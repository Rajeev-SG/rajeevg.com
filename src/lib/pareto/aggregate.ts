/**
 * Aggregate per-source data into a Pareto snapshot with stale/error retention.
 *
 * Reliability rule: if one source fails, retain last known successful dataset
 * for that source rather than breaking the whole dashboard. Source freshness
 * is explicitly exposed as ok / stale / error / pending.
 */
import type { CanonicalModel, ParetoSnapshot, SourceFreshness, UnmatchedRecord } from "./types";
import { mapAaModels } from "./artificial-analysis";
import { getAaModelsCached } from "./aa-cache";
import { aaFallback } from "./aa-fallback";
import { resolveAaSlug } from "./aliases";
import { fetchOpenRouterModels, mapOpenRouterModels } from "./openrouter";
import { mergeCanonicalModels } from "./normalise";
import { autoJoin, parseOrId } from "./auto-discover";

// Simple in-process cache for the last-good snapshot. On Vercel ISR this is
// bounded by lambda lifetime; the page-level ISR revalidate covers the rest.
let lastGoodSnapshot: ParetoSnapshot | null = null;
let lastFetchAt = 0;
const AA_REVALIDATE_S = 7200;
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
export async function buildParetoSnapshot(options?: {
  aaApiKey?: string | null;
  maxAaPages?: number;
}): Promise<SnapshotOutcome> {
  const errors: string[] = [];
  const now = new Date().toISOString();
  let aaDegraded = false;
  let aaFallbackReason: string | null = null;
  let aaUnmatchedBySlugAuto = new Map<string, { creatorName: string | null; aa: CanonicalModel["aa"] }>();
  let aaOrCandidates = new Map<string, { displayName: string; openrouter: CanonicalModel["openrouter"] }>();

  // AA
  let aaMatched = new Map<string, Partial<CanonicalModel>>();
  let aaUnmatched: UnmatchedRecord[] = [];
  let aaFetchedAt: string | null = null;
  let aaStatus: SourceFreshness["aaStatus"] = "pending";
  {
    try {
      const aaCached = await getAaModelsCached();
      if (aaCached.status === "degraded") {
        // Serve bundled official last-known-good AA data from the shared
        // snapshot (page AND API), preserving degraded metadata.
        aaDegraded = true;
        aaFallbackReason = aaCached.reason ?? "unknown";
        if (aaCached.retryAfterSeconds != null) errors.push(`AA: degraded, retry after ${aaCached.retryAfterSeconds}s (${aaFallbackReason})`);
        else errors.push(`AA: degraded (${aaFallbackReason})`);
        aaStatus = "error";
      } else {
        const mapped = mapAaModels(aaCached.models, aaCached.intelligenceIndexVersion);
      aaUnmatchedBySlugAuto = new Map(
        aaCached.models
          .filter((m) => !mapped.matched.has(resolveAaSlug(m.slug)?.canonicalId ?? ""))
          .map((m) => [m.slug, { creatorName: m.creatorName, aa: {
            slug: m.slug,
            intelligenceIndex: m.intelligenceIndex,
            codingIndex: m.codingIndex,
            agenticIndex: m.agenticIndex,
            costPerTaskUsd: m.costPerTaskUsd,
            throughputTokensPerSecond: null,
            latencyTtfbSeconds: null,
            intelligenceIndexVersion: aaCached.intelligenceIndexVersion,
          } as CanonicalModel["aa"] }])
      );
        const liveModels = Array.from(mapped.matched.values());
        const liveHasQuality = liveModels.some((m) => m.aa?.intelligenceIndex != null || m.aa?.codingIndex != null || m.aa?.agenticIndex != null);
        if (!liveHasQuality) {
          // Zero non-null quality metrics is unhealthy even on HTTP 200; fall back.
          aaDegraded = true;
          aaFallbackReason = "AA response has zero non-null quality metrics";
          errors.push(`AA: ${aaFallbackReason}`);
          aaStatus = "error";
        } else {
          aaMatched = mapped.matched;
          aaUnmatched = mapped.unmatched;
          aaFetchedAt = aaCached.fetchedAt;
          aaStatus = "ok";
        }
      }
    } catch (err) {
      aaDegraded = true;
      aaFallbackReason = err instanceof Error ? err.message : String(err);
      errors.push(`AA: ${aaFallbackReason}`);
      aaStatus = "error";
    }
  }

  // Shared fallback: when AA is degraded or zero-quality, both page and API
  // serve the bundled official last-known-good AA snapshot instead of nulls.
  if (aaDegraded) {
    aaMatched = new Map<string, Partial<CanonicalModel>>(
      aaFallback.models
        .filter((m) => m.aa.intelligenceIndex != null || m.aa.codingIndex != null || m.aa.agenticIndex != null)
        .map((m) => [m.canonicalId, {
          canonicalId: m.canonicalId,
          displayName: m.displayName,
          organisation: m.organisation,
          releaseDate: m.releaseDate,
          aa: m.aa,
        } as Partial<CanonicalModel>])
    );
    aaFetchedAt = aaFallback.freshness.aaFetchedAt;
  }

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
    aaOrCandidates = new Map(
      result.models
        .filter((m) => parseOrId(m.id) !== null)
        .map((m) => [m.id, { displayName: m.name, openrouter: {
          modelId: m.id,
          inputPricePerMillion: m.inputPerMillion,
          outputPricePerMillion: m.outputPerMillion,
          contextLength: m.contextLength,
          createdAtUnix: m.createdAtUnix,
        } as CanonicalModel["openrouter"] }])
    );
    orFetchedAt = result.fetchedAt;
    orStatus = "ok";
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

  // Automatic latest-model discovery: deterministic exact join for records
  // not covered by explicit aliases. AA slugs like "muse-spark-1-3-xhigh"
  // join to OR ids like "meta/muse-spark-1.3" when normalised slugs match
  // exactly AND the OR org prefix matches the AA creator name exactly.
  const aaMatchedIds = new Set(aaMatched.keys());
  const orMatchedIds = new Set(orMatched.keys());
  const autoJoined = new Map<string, Partial<CanonicalModel>>();
  for (const [aaKey, aaRec] of aaUnmatchedBySlugAuto) {
    for (const [orId, orRec] of aaOrCandidates) {
      const joined = autoJoin(
        { slug: aaKey, creatorName: aaRec.creatorName },
        { id: orId, name: orRec.displayName }
      );
      if (joined && !aaMatchedIds.has(joined.canonicalId) && !orMatchedIds.has(orId) && !autoJoined.has(joined.canonicalId)) {
        autoJoined.set(joined.canonicalId, {
          canonicalId: joined.canonicalId,
          displayName: joined.displayName,
          organisation: joined.organisation,
          aa: aaRec.aa,
          openrouter: orRec.openrouter,
        });
      }
    }
  }
  for (const [id, partial] of autoJoined) {
    aaMatched.set(id, partial);
    orMatched.set(id, partial);
  }

  const models = mergeCanonicalModels(aaMatched, orMatched, arMatched);
  void [aaUnmatched, orUnmatched, arUnmatched]; // unmatched records stay server-side only
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
export async function getParetoSnapshot(options?: { aaApiKey?: string | null }): Promise<SnapshotOutcome> {
  const now = Date.now();
  const minRevalidate = Math.min(AA_REVALIDATE_S, OR_REVALIDATE_S, ARENA_REVALIDATE_S) * 1000;
  if (lastGoodSnapshot && now - lastFetchAt < minRevalidate) {
    return { snapshot: lastGoodSnapshot, errors: [] };
  }
  try {
    return await buildParetoSnapshot(options);
  } catch (err) {
    if (lastGoodSnapshot) return { snapshot: lastGoodSnapshot, errors: [String(err)] };
    throw err;
  }
}
