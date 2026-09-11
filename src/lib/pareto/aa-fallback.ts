/**
 * Last-known-good AA snapshot sources.
 *
 * Two layers, in priority order:
 *
 * 1. DURABLE snapshot published by the serialized refresh workflow to the
 *    dedicated `pareto-data` Git branch (raw.githubusercontent.com). Data
 *    freshness is therefore decoupled from the app deployment and from any
 *    paid/quota-limited third-party storage.
 * 2. BUNDLED snapshot in `src/data/pareto-aa-fallback.json`, committed rarely
 *    (on meaningful schema/model-set changes only). It is the guaranteed
 *    render path when the durable read fails.
 *
 * History (why Git and not Vercel Blob): delivery originally used Vercel Blob.
 * Blob is metered by *operations* on the Hobby plan (2,000 advanced ops/month:
 * put/copy/list; 10,000 simple ops/month). The project blew that ceiling, Vercel
 * suspended every Blob store on the team for 30 days, and the twice-daily
 * refresh began failing with HTTP 502. Publishing to a Git branch costs nothing,
 * has no per-operation quota, is versioned and auditable, and — because that
 * branch is explicitly excluded from Vercel deployments — still does not trigger
 * a build. See docs/pareto-frontier-data-pipeline.md.
 */
import fallbackJson from "@/data/pareto-aa-fallback.json";
import type { CanonicalModel, ParetoSnapshot } from "./types";

export interface AaFallbackSnapshot {
  provenance: {
    source: string;
    fetchedAt: string;
    aaStatus: "ok";
    note: string;
  };
  generatedAt: string;
  freshness: ParetoSnapshot["freshness"];
  models: CanonicalModel[];
}

export const aaFallback: AaFallbackSnapshot = fallbackJson as AaFallbackSnapshot;

/**
 * Raw URL of the durable snapshot on the `pareto-data` branch. Overridable via
 * PARETO_SNAPSHOT_URL so a fork or a different repo can point elsewhere.
 */
export const PARETO_SNAPSHOT_BRANCH = "pareto-data";
export const PARETO_SNAPSHOT_PATH = "pareto-aa-fallback.json";
export const PARETO_SNAPSHOT_URL =
  process.env.PARETO_SNAPSHOT_URL ??
  `https://raw.githubusercontent.com/Rajeev-SG/rajeevg.com/${PARETO_SNAPSHOT_BRANCH}/${PARETO_SNAPSHOT_PATH}`;

/**
 * In-process cache for the durable snapshot. Bounded by lambda lifetime; the
 * Next.js data cache (revalidate below) bounds cross-invocation reads.
 */
let durableCache: { at: number; snap: AaFallbackSnapshot | null } = { at: 0, snap: null };
const DURABLE_CACHE_MS = 60 * 60 * 1000;

function isPlausibleSnapshot(parsed: unknown): parsed is AaFallbackSnapshot {
  const candidate = parsed as AaFallbackSnapshot | null;
  return Boolean(
    candidate &&
      Array.isArray(candidate.models) &&
      candidate.models.length > 0 &&
      typeof candidate.generatedAt === "string" &&
      candidate.generatedAt.length > 0
  );
}

/**
 * Read the durable snapshot from the `pareto-data` branch, cached in-process
 * for one hour. Never throws: on any failure the caller keeps the bundled
 * last-known-good snapshot (or the previously cached durable read).
 */
export async function getDurableAaSnapshot(): Promise<AaFallbackSnapshot | null> {
  const now = Date.now();
  if (durableCache.snap && now - durableCache.at < DURABLE_CACHE_MS) return durableCache.snap;
  try {
    const res = await fetch(PARETO_SNAPSHOT_URL, {
      headers: { Accept: "application/json" },
      // Data-cache the upstream read; the publisher refreshes twice daily.
      next: { revalidate: 3600, tags: ["pareto-snapshot"] },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const parsed: unknown = await res.json();
    if (!isPlausibleSnapshot(parsed)) throw new Error("invalid durable snapshot shape");
    durableCache = { at: now, snap: parsed };
    return parsed;
  } catch {
    // Retain whatever we previously had; never replace good data with a failure.
    durableCache = { at: now, snap: durableCache.snap };
    return durableCache.snap;
  }
}

/** Count models with at least one non-null AA quality metric. */
export function countAaQuality(models: CanonicalModel[]): number {
  return models.filter((m) => m.aa.intelligenceIndex !== null || m.aa.codingIndex !== null || m.aa.agenticIndex !== null).length;
}

/**
 * AA health guard: an AA response with zero non-null quality metrics is
 * unhealthy regardless of HTTP status, and must not silently replace the
 * bundled last-known-good data with an empty dashboard.
 */
export function isAaHealthy(models: CanonicalModel[]): boolean {
  return countAaQuality(models) > 0;
}
