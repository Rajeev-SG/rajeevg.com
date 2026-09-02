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
