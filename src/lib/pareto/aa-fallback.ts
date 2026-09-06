/**
 * Last-known-good AA snapshot bundled from the official structured endpoint
 * (artificialanalysis.ai API v2 /language/models/free, captured 2026-09-02).
 *
 * Used only when live AA data is unhealthy or absent, so the dashboard never
 * renders empty. Live refresh replaces it as soon as AA is healthy again.
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
 * Durable snapshot read from Vercel Blob, cached in-process for one hour.
 * The scheduled refresh writes validated snapshots to Blob so data freshness
 * is decoupled from Git deploys. On any fetch error the bundled
 * last-known-good fallback above remains authoritative.
 */
let blobCache: { at: number; snap: AaFallbackSnapshot | null } = { at: 0, snap: null };
const BLOB_CACHE_MS = 60 * 60 * 1000;

export async function getDurableAaSnapshot(): Promise<AaFallbackSnapshot | null> {
  const now = Date.now();
  if (blobCache.snap && now - blobCache.at < BLOB_CACHE_MS) return blobCache.snap;
  const url = process.env.PARETO_BLOB_URL;
  if (!url) return null;
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const parsed = (await res.json()) as AaFallbackSnapshot;
    if (!Array.isArray(parsed?.models) || parsed.models.length === 0 || !parsed.generatedAt) {
      throw new Error("invalid durable snapshot shape");
    }
    blobCache = { at: now, snap: parsed };
    return parsed;
  } catch {
    // Retain whatever we previously had; never replace good data with a failure.
    blobCache = { at: now, snap: blobCache.snap };
    return blobCache.snap;
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
