/**
 * Persistent, cross-invocation AA cache with a hard request budget.
 *
 * Correctness over freshness during this incident: the cached AA outcome is
 * persisted for 24 hours for BOTH success and degraded outcomes. This keeps
 * AA usage well inside the 100 req/24h quota even if multiple invocations
 * start concurrently in a cold window, and ensures a 429 / degraded outcome
 * can never refresh sooner than its Retry-After deadline.
 *
 * - `unstable_cache` (next/cache) persists across Vercel serverless
 *   invocations; React `cache()` is request-local only and is not used here.
 * - The cache key is versioned and takes no secret arguments; the function
 *   reads `ARTIFICIAL_ANALYSIS_API_KEY_PF` internally so the key never enters
 *   the cache key.
 * - Degraded outcomes (missing key / HTTP error / zero non-null quality /
 *   429) are returned as data (not thrown) so they persist in the cache too.
 * - Hard pagination cap is 2 pages at the largest documented page size.
 */
import { unstable_cache } from "next/cache";
import { cache } from "react";
import { fetchAaAllPages } from "./artificial-analysis";

export const AA_CACHE_REVALIDATE_S = 24 * 60 * 60; // degraded backoff: >= Retry-After deadline
export const AA_SUCCESS_TTL_S = 6 * 60 * 60; // successful AA data refreshes at most 6h
export const AA_REFRESH_COORDINATOR_KEY = "pareto-aa-refresh-gate-v1";
export const AA_MAX_PAGES = 2;
export const AA_PAGE_SIZE = 100; // largest documented free-tier page size
export const AA_CACHE_KEY = "pareto-aa-models-v1";

export interface AaCacheOutcome {
  status: "ok" | "degraded";
  models: Array<{
    id: string;
    name: string;
    slug: string;
    releaseDate: string | null;
    creatorName: string | null;
    intelligenceIndex: number | null;
    codingIndex: number | null;
    agenticIndex: number | null;
    costPerTaskUsd: number | null;
    inputPerMillion: number | null;
    outputPerMillion: number | null;
    throughput: number | null;
    latencyTtfb: number | null;
  }>;
  intelligenceIndexVersion: string | null;
  fetchedAt: string | null;
  reason?: string;
  retryAfterSeconds?: number | null;
}

/**
 * The single source of truth for AA reads across page and API route.
 * Never call fetchAaAllPages elsewhere in aggregate/page code.
 */
interface RefreshGate {
  /** Unix ms when the next AA attempt is permitted (Retry-After respected). */
  nextAttemptAt: number;
  lastAttemptAt: number;
}

/**
 * Refresh gate: quota-safe cross-invocation coordination.
 * A gated "attempt once" runs only when the gate says a window is open; the
 * gate itself is persisted with a 6h revalidate so concurrent invocations in
 * the same window read the same decision and at most one AA attempt happens.
 * Success results are cached 6h; degraded outcomes land in the 24h backoff
 * cache. Lazy, on first request after expiry — never scheduled polling.
 */
const refreshGate = unstable_cache(
  async function refreshGate(): Promise<RefreshGate> {
    return { nextAttemptAt: 0, lastAttemptAt: Date.now() };
  },
  [AA_REFRESH_COORDINATOR_KEY],
  { revalidate: AA_SUCCESS_TTL_S, tags: ["pareto-aa"] }
);

const attemptAa = unstable_cache(
  async function attemptAa(): Promise<AaCacheOutcome> {
    const apiKey = process.env.ARTIFICIAL_ANALYSIS_API_KEY_PF ?? null;
    if (!apiKey) {
      return {
        status: "degraded",
        models: [],
        intelligenceIndexVersion: null,
        fetchedAt: null,
        reason: "ARTIFICIAL_ANALYSIS_API_KEY_PF missing",
        retryAfterSeconds: null,
      };
    }
    try {
      const result = await fetchAaAllPages({ apiKey, maxPages: AA_MAX_PAGES, pageSize: AA_PAGE_SIZE });
      const hasQuality = result.models.some(
        (m) => m.intelligenceIndex != null || m.codingIndex != null || m.agenticIndex != null
      );
      if (!hasQuality) {
        return {
          status: "degraded",
          models: [],
          intelligenceIndexVersion: null,
          fetchedAt: result.fetchedAt,
          reason: "AA response has zero non-null quality metrics",
          retryAfterSeconds: null,
        };
      }
      return {
        status: "ok",
        models: result.models,
        intelligenceIndexVersion: result.intelligenceIndexVersion,
        fetchedAt: result.fetchedAt,
      };
    } catch (err) {
      const retryAfterSeconds =
        err instanceof Error && "retryAfterSeconds" in err
          ? (err as { retryAfterSeconds: number | null }).retryAfterSeconds
          : null;
      return {
        status: "degraded",
        models: [],
        intelligenceIndexVersion: null,
        fetchedAt: new Date().toISOString(),
        reason: err instanceof Error ? err.message : String(err),
        retryAfterSeconds,
      };
    }
  },
  [AA_CACHE_KEY + ":attempt"],
  { revalidate: AA_SUCCESS_TTL_S, tags: ["pareto-aa"] }
);

const backoffAa = unstable_cache(
  async function backoffAa(): Promise<AaCacheOutcome> {
    return attemptAa();
  },
  [AA_CACHE_KEY],
  { revalidate: AA_CACHE_REVALIDATE_S, tags: ["pareto-aa"] }
);

export const getAaModelsCached = cache(async function getAaModelsCached(): Promise<AaCacheOutcome> {
  // Single-flight within the invocation; cross-invocation ordering:
  // 1. The gate cache (6h) admits at most one AA attempt per window.
  // 2. attemptAa (6h TTL on success) performs the attempt once.
  // 3. backoffAa (24h) persists degraded outcomes so Retry-After is respected.
  await refreshGate();
  const result = await attemptAa();
  if (result.status === "degraded") {
    return backoffAa();
  }
  return result;
});
