/**
 * Pure aggregation helpers over the benchmark snapshot.
 *
 * These functions never invent a score: every cell resolves to a real
 * `BenchmarkResult` or to an explicit "missing" state.
 */
import type {
  BenchmarkResult,
  BenchmarkSnapshot,
  EvidenceQuality,
  SourceType,
} from "./types";
import { comparisonGroupId } from "./comparability";

const EVIDENCE_RANK: Record<EvidenceQuality, number> = { high: 3, medium: 2, low: 1 };

/**
 * Provenance preference, most-direct first. Mirrors the seed order in the
 * product spec: machine-readable > repo > paper > independent reproduction >
 * vendor official. A vendor claim is always the weakest evidence class.
 */
const SOURCE_TYPE_RANK: Record<SourceType, number> = {
  benchmark_machine_readable: 5,
  benchmark_repo: 4,
  benchmark_paper: 3,
  independent_reproduction: 2,
  vendor_official: 1,
};

/** Prefer stronger evidence, then more-direct provenance, then the better number. */
function betterResult(a: BenchmarkResult, b: BenchmarkResult): BenchmarkResult {
  const evidence = EVIDENCE_RANK[a.evidenceQuality] - EVIDENCE_RANK[b.evidenceQuality];
  if (evidence !== 0) return evidence > 0 ? a : b;

  const provenance = SOURCE_TYPE_RANK[a.sourceType] - SOURCE_TYPE_RANK[b.sourceType];
  if (provenance !== 0) return provenance > 0 ? a : b;

  if (a.score !== null && b.score !== null && a.score !== b.score) {
    const higherIsBetter = a.higherIsBetter;
    return (higherIsBetter ? a.score > b.score : a.score < b.score) ? a : b;
  }

  // Deterministic final tie-break so rendering order never flaps.
  return a.id <= b.id ? a : b;
}

/**
 * The result that best represents one model at one benchmark for the current
 * view. Only ever returns an input result; never a synthesised one.
 */
export function pickBestResult(
  results: BenchmarkResult[],
  opts: { benchmarkId: string; groupId?: string | null }
): BenchmarkResult | null {
  const candidates = results.filter(
    (r) =>
      r.benchmarkId === opts.benchmarkId &&
      r.scoreState === "reported" &&
      r.score !== null &&
      (opts.groupId == null || comparisonGroupId(r) === opts.groupId)
  );
  if (candidates.length === 0) return null;
  return candidates.reduce(betterResult);
}

/**
 * The canonical comparable group for a benchmark column: the strict group that
 * carries the most reported results, tie-broken by version token so the choice
 * is deterministic. This is what "strict comparable" mode renders.
 */
export function selectPrimaryGroupId(results: BenchmarkResult[], benchmarkId: string): string | null {
  const counts = new Map<string, number>();
  for (const result of results) {
    if (result.benchmarkId !== benchmarkId) continue;
    if (result.scoreState !== "reported" || result.score === null) continue;
    const key = comparisonGroupId(result);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  if (counts.size === 0) return null;
  return [...counts.entries()].sort((a, b) => (b[1] - a[1]) || (a[0] < b[0] ? -1 : 1))[0][0];
}

export interface ModelCoverage {
  modelCanonicalId: string;
  benchmarksAvailable: number;
  benchmarksTracked: number;
  benchmarkOfficialCount: number;
  vendorReportedCount: number;
}

/** Counts per model across the tracked benchmarks, for the coverage view. */
export function buildCoverage(snapshot: BenchmarkSnapshot): ModelCoverage[] {
  const tracked = snapshot.benchmarks.length;
  return snapshot.models.map((model) => {
    const forModel = snapshot.results.filter(
      (r) => r.modelCanonicalId === model.canonicalId && r.scoreState === "reported" && r.score !== null
    );
    const benchmarks = new Set(forModel.map((r) => r.benchmarkId));
    const official = forModel.filter((r) => r.sourceType !== "vendor_official").length;
    const vendor = forModel.filter((r) => r.sourceType === "vendor_official").length;
    return {
      modelCanonicalId: model.canonicalId,
      benchmarksAvailable: benchmarks.size,
      benchmarksTracked: tracked,
      benchmarkOfficialCount: official,
      vendorReportedCount: vendor,
    };
  });
}

export interface AxisCoverage {
  axis: string;
  benchmarkCount: number;
}

/** How many tracked benchmarks touch each workload axis. */
export function coverageByAxis(snapshot: BenchmarkSnapshot): AxisCoverage[] {
  const counts = new Map<string, number>();
  for (const benchmark of snapshot.benchmarks) {
    for (const axis of benchmark.axes) counts.set(axis, (counts.get(axis) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([axis, benchmarkCount]) => ({ axis, benchmarkCount }))
    .sort((a, b) => b.benchmarkCount - a.benchmarkCount || (a.axis < b.axis ? -1 : 1));
}

export interface SnapshotSummary {
  benchmarkCount: number;
  modelCount: number;
  resultCount: number;
  reportedCount: number;
  officialCount: number;
  vendorCount: number;
  benchmarksWithNoResults: number;
  unresolvedBenchmarkCount: number;
  unresolvedModelCount: number;
}

export function summarise(snapshot: BenchmarkSnapshot): SnapshotSummary {
  const withResults = new Set(
    snapshot.results.filter((r) => r.scoreState === "reported" && r.score !== null).map((r) => r.benchmarkId)
  );
  return {
    benchmarkCount: snapshot.benchmarks.length,
    modelCount: snapshot.models.length,
    resultCount: snapshot.results.length,
    reportedCount: snapshot.results.filter((r) => r.scoreState === "reported" && r.score !== null).length,
    officialCount: snapshot.results.filter((r) => r.scoreState === "reported" && r.sourceType !== "vendor_official").length,
    vendorCount: snapshot.results.filter((r) => r.scoreState === "reported" && r.sourceType === "vendor_official").length,
    benchmarksWithNoResults: snapshot.benchmarks.length - withResults.size,
    unresolvedBenchmarkCount: snapshot.unresolvedBenchmarks.length,
    unresolvedModelCount: snapshot.unresolvedModels.length,
  };
}
