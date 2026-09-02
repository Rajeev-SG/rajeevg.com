/**
 * Aggregate per-source data into a Pareto snapshot with stale/error retention.
 *
 * Reliability rule: if one source fails, retain last known successful dataset
 * for that source rather than breaking the whole dashboard. Source freshness
 * is explicitly exposed as ok / stale / error / pending.
 */
import type { CanonicalModel, ParetoSnapshot, SourceFreshness, UnmatchedRecord } from "./types";
import { fetchAaAllPages, mapAaModels } from "./artificial-analysis";
import { fetchOpenRouterModels, mapOpenRouterModels } from "./openrouter";
import { fetchArenaSnapshot, mapArenaModels } from "./arena";
import { mergeCanonicalModels } from "./normalise";

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

  // AA
  let aaMatched = new Map<string, Partial<CanonicalModel>>();
  let aaUnmatched: UnmatchedRecord[] = [];
  let aaFetchedAt: string | null = null;
  let aaStatus: SourceFreshness["aaStatus"] = "pending";
  const aaApiKey = options?.aaApiKey ?? process.env.ARTIFICIAL_ANALYSIS_API_KEY ?? process.env.AA_API_KEY ?? null;
  if (aaApiKey) {
    try {
      const result = await fetchAaAllPages({ apiKey: aaApiKey, maxPages: options?.maxAaPages ?? 20 });
      const mapped = mapAaModels(result.models, result.intelligenceIndexVersion);
      aaMatched = mapped.matched;
      aaUnmatched = mapped.unmatched;
      aaFetchedAt = result.fetchedAt;
      aaStatus = "ok";
    } catch (err) {
      errors.push(`AA: ${err instanceof Error ? err.message : String(err)}`);
      aaStatus = "error";
      if (lastGoodSnapshot) {
        aaMatched = new Map(lastGoodSnapshot.models.map((m) => [m.canonicalId, { canonicalId: m.canonicalId, displayName: m.displayName, organisation: m.organisation, releaseDate: m.releaseDate, aa: m.aa }]));
        aaUnmatched = lastGoodSnapshot.unmatched.filter((u) => u.source === "aa");
        aaFetchedAt = lastGoodSnapshot.freshness.aaFetchedAt;
        aaStatus = lastGoodSnapshot.freshness.aaStatus === "ok" ? "stale" : "error";
      }
    }
  } else {
    aaStatus = "pending";
    if (lastGoodSnapshot) {
      aaStatus = "stale";
      aaFetchedAt = lastGoodSnapshot.freshness.aaFetchedAt;
      aaMatched = new Map(lastGoodSnapshot.models.map((m) => [m.canonicalId, { canonicalId: m.canonicalId, displayName: m.displayName, organisation: m.organisation, releaseDate: m.releaseDate, aa: m.aa }]));
      aaUnmatched = lastGoodSnapshot.unmatched.filter((u) => u.source === "aa");
    }
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

  // Arena
  let arMatched = new Map<string, Partial<CanonicalModel>>();
  let arUnmatched: UnmatchedRecord[] = [];
  let arFetchedAt: string | null = null;
  let arStatus: SourceFreshness["arenaStatus"] = "pending";
  let arenaPublishedAt: string | null = null;
  try {
    const snapshot = await fetchArenaSnapshot();
    const mapped = mapArenaModels(snapshot);
    arMatched = mapped.matched;
    arUnmatched = mapped.unmatched;
    arenaPublishedAt = mapped.arenaPublishedAt;
    arFetchedAt = snapshot.fetchedAt;
    arStatus = "ok";
  } catch (err) {
    errors.push(`Arena: ${err instanceof Error ? err.message : String(err)}`);
    arStatus = "error";
    if (lastGoodSnapshot) {
      arMatched = new Map(lastGoodSnapshot.models.map((m) => [m.canonicalId, { canonicalId: m.canonicalId, displayName: m.displayName, organisation: m.organisation, arena: m.arena }]));
      arUnmatched = lastGoodSnapshot.unmatched.filter((u) => u.source === "arena");
      arFetchedAt = lastGoodSnapshot.freshness.arenaFetchedAt;
      arenaPublishedAt = lastGoodSnapshot.freshness.arenaPublishedAt;
      arStatus = lastGoodSnapshot.freshness.arenaStatus === "ok" ? "stale" : "error";
    }
  }

  const models = mergeCanonicalModels(aaMatched, orMatched, arMatched);
  const unmatched = [...aaUnmatched, ...orUnmatched, ...arUnmatched];
  const freshness: SourceFreshness = {
    aaFetchedAt,
    aaStatus,
    openrouterFetchedAt: orFetchedAt,
    openrouterStatus: orStatus,
    arenaFetchedAt: arFetchedAt,
    arenaStatus: arStatus,
    arenaPublishedAt,
  };

  const snapshot: ParetoSnapshot = { generatedAt: now, freshness, models, unmatched };
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
