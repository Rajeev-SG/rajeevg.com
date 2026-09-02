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
import { fetchAaAllPages } from "./artificial-analysis";

export const AA_CACHE_REVALIDATE_S = 24 * 60 * 60; // 24h: quota-safe for success AND degraded
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
export const getAaModelsCached = unstable_cache(
  async function getAaModelsCached(): Promise<AaCacheOutcome> {
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
  [AA_CACHE_KEY],
  { revalidate: AA_CACHE_REVALIDATE_S, tags: ["pareto-aa"] }
);
