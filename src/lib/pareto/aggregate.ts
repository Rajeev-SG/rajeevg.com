/**
 * Aggregate per-source data into a Pareto snapshot with stale/error retention.
 *
 * Reliability rule: if one source fails, retain last known successful dataset
 * for that source rather than breaking the whole dashboard. Source freshness
 * is explicitly exposed as ok / stale / error / pending.
 */
import type { CanonicalModel, ParetoSnapshot, SourceFreshness, UnmatchedRecord } from "./types";
import { aaFallback } from "./aa-fallback";
import { fetchOpenRouterModels, mapOpenRouterModels } from "./openrouter";
import { autoJoin, parseOrId } from "./auto-discover";
import { mergeCanonicalModels } from "./normalise";

// Simple in-process cache for the last-good snapshot. On Vercel ISR this is
// bounded by lambda lifetime; the page-level ISR revalidate covers the rest.
let lastGoodSnapshot: ParetoSnapshot | null = null;
let lastFetchAt = 0;
const AA_REVALIDATE_S = 86400;
const OR_REVALIDATE_S = 3600;
const ARENA_REVALIDATE_S = 3600;

export const REVALIDATE = {
  aa: AA_REVALIDATE_S,
  openrouter: OR_REVALIDATE_S,
  arena: ARENA_REVALIDATE_S,
};

interface SnapshotOutcome {
  snapshot: ParetoSnapshot;
  errors: string[];
}

/**
 * Fetch all three sources and build the snapshot. On per-source failure the
 * previous good value for that source is retained; it is marked stale/error.
 */
export async function buildParetoSnapshot(): Promise<SnapshotOutcome> {
  const errors: string[] = [];
  const now = new Date().toISOString();
  // AA is refreshed only by the serialized daily workflow. Page views and
  // serverless cold starts consume zero AA quota.
  const aaMatched = new Map<string, Partial<CanonicalModel>>(
    aaFallback.models
      .filter((model) => model.aa.intelligenceIndex != null || model.aa.codingIndex != null || model.aa.agenticIndex != null)
      .map((model) => [model.canonicalId, {
        canonicalId: model.canonicalId,
        displayName: model.displayName,
        organisation: model.organisation,
        releaseDate: model.releaseDate,
        aa: model.aa,
      }])
  );
  const aaFetchedAt = aaFallback.freshness.aaFetchedAt;
  const aaStatus: SourceFreshness["aaStatus"] = "ok";

  // OpenRouter
  let orMatched = new Map<string, Partial<CanonicalModel>>();
  let orUnmatched: UnmatchedRecord[] = [];
  let orFetchedAt: string | null = null;
  let orStatus: SourceFreshness["openrouterStatus"] = "pending";
  try {
    const result = await fetchOpenRouterModels();
    const mapped = mapOpenRouterModels(result.models);
    orMatched = mapped.matched;
    orUnmatched = mapped.unmatched;
    orFetchedAt = result.fetchedAt;
    orStatus = "ok";
    // Deterministic auto-join of OR records not covered by the explicit
    // alias map against AA fallback slugs. Exact identity only, never fuzzy.
    const aaRecords = aaFallback.models.filter((m) => m.aa.slug != null);
    for (const m of result.models) {
      const parsed = parseOrId(m.id);
      if (!parsed) continue;
      for (const aa of aaRecords) {
        const joined = autoJoin(
          { slug: aa.aa.slug as string, creatorName: aa.organisation },
          { id: m.id, name: m.name }
        );
        if (!joined) continue;
        if (orMatched.has(joined.canonicalId)) break;
        const existing = aaMatched.get(joined.canonicalId);
        if (existing) {
          // Merge OR pricing into the existing AA-backed canonical partial.
          orMatched.set(joined.canonicalId, {
            ...existing,
            openrouter: {
              modelId: m.id,
              inputPricePerMillion: m.inputPerMillion,
              outputPricePerMillion: m.outputPerMillion,
              contextLength: m.contextLength,
              createdAtUnix: m.createdAtUnix,
            },
          });
        } else {
          orMatched.set(joined.canonicalId, {
            canonicalId: joined.canonicalId,
            displayName: joined.displayName,
            organisation: joined.organisation,
            openrouter: {
              modelId: m.id,
              inputPricePerMillion: m.inputPerMillion,
              outputPricePerMillion: m.outputPerMillion,
              contextLength: m.contextLength,
              createdAtUnix: m.createdAtUnix,
            },
          });
        }
        break;
      }
    }
  } catch (err) {
    errors.push(`OpenRouter: ${err instanceof Error ? err.message : String(err)}`);
    orStatus = "error";
    if (lastGoodSnapshot) {
      orMatched = new Map(lastGoodSnapshot.models.map((m) => [m.canonicalId, { canonicalId: m.canonicalId, displayName: m.displayName, organisation: m.organisation, openrouter: m.openrouter }]));
      orUnmatched = lastGoodSnapshot.unmatched.filter((u) => u.source === "openrouter");
      orFetchedAt = lastGoodSnapshot.freshness.openrouterFetchedAt;
      orStatus = lastGoodSnapshot.freshness.openrouterStatus === "ok" ? "stale" : "error";
    }
  }

  // Arena is intentionally NOT fetched on the Pareto critical path: the
  // dashboard only needs AA quality and OpenRouter cost. Optional Arena
  // fields/status are served without network work.
  const arMatched = new Map<string, Partial<CanonicalModel>>();
  const arUnmatched: UnmatchedRecord[] = [];
  const arFetchedAt: string | null = null;
  const arStatus: SourceFreshness["arenaStatus"] = "pending";
  const arenaPublishedAt: string | null = null;

  const models = mergeCanonicalModels(aaMatched, orMatched, arMatched);
  void [orUnmatched, arUnmatched]; // unmatched records stay server-side only
  const freshness: SourceFreshness = {
    aaFetchedAt,
    aaStatus,
    openrouterFetchedAt: orFetchedAt,
    openrouterStatus: orStatus,
    arenaFetchedAt: arFetchedAt,
    arenaStatus: arStatus,
    arenaPublishedAt,
  };

  // Compact client payload: drop unmatched records and unused AA performance
  // fields; the browser never needs them.
  const modelsCompact = models.map((m) => ({
    ...m,
    aa: {
      slug: m.aa.slug,
      intelligenceIndex: m.aa.intelligenceIndex,
      codingIndex: m.aa.codingIndex,
      agenticIndex: m.aa.agenticIndex,
      costPerTaskUsd: m.aa.costPerTaskUsd,
      throughputTokensPerSecond: null,
      latencyTtfbSeconds: null,
      intelligenceIndexVersion: m.aa.intelligenceIndexVersion,
    },
  }));
  const snapshot: ParetoSnapshot = { generatedAt: now, freshness, models: modelsCompact, unmatched: [] };
  // Retain only if at least one source is ok (don't cache a fully broken snapshot).
  if (freshness.aaStatus === "ok" || freshness.openrouterStatus === "ok" || freshness.arenaStatus === "ok") {
    lastGoodSnapshot = snapshot;
    lastFetchAt = Date.now();
  }
  return { snapshot, errors };
}

/**
 * Get cached snapshot if fresh enough, else rebuild.
 * Falls back to lastGoodSnapshot with stale marks on total failure.
 */
export async function getParetoSnapshot(): Promise<SnapshotOutcome> {
  const now = Date.now();
  const minRevalidate = Math.min(AA_REVALIDATE_S, OR_REVALIDATE_S, ARENA_REVALIDATE_S) * 1000;
  if (lastGoodSnapshot && now - lastFetchAt < minRevalidate) {
    return { snapshot: lastGoodSnapshot, errors: [] };
  }
  try {
    return await buildParetoSnapshot();
  } catch (err) {
    if (lastGoodSnapshot) return { snapshot: lastGoodSnapshot, errors: [String(err)] };
    throw err;
  }
}
