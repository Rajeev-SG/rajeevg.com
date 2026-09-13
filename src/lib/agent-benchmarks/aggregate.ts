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

// ---------------------------------------------------------------------------
// Compare-view eligibility (issue #145)
//
// The default view is a *dense* comparison, not the full sparse registry. Both
// the benchmark columns and the model rows are chosen from the data, so the view
// becomes denser on its own as the evidence registry improves — no manual edits.
// ---------------------------------------------------------------------------

/** Minimum distinct cohort models with a result before a benchmark is shown. */
export const MIN_MODELS_PER_BENCHMARK = 3;
/** Minimum visible benchmarks with a result before a model is shown. */
export const MIN_BENCHMARKS_PER_MODEL = 2;

export interface BenchmarkCoverage {
  benchmarkId: string;
  /** Distinct cohort models with at least one usable result here. */
  modelCount: number;
  /** Distinct cohort models that would populate a cell in the compare table. */
  populatedModelIds: string[];
}

export interface AwaitingBenchmark extends BenchmarkCoverage {
  /** Why the benchmark is not in the default comparison. */
  reason: "no_results" | "below_threshold";
  /** How many more cohort models are needed to reach the threshold. */
  shortfall: number;
}

export interface CompareView {
  benchmarkIds: string[];
  modelIds: string[];
  awaiting: AwaitingBenchmark[];
  coverage: BenchmarkCoverage[];
  populatedCells: number;
  totalCells: number;
  /** Share of model × benchmark cells that carry a value, 0-1. */
  density: number;
}

export interface CompareViewOptions {
  /** Candidate models, in the order rows should default to. */
  cohortModelIds: string[];
  /** Benchmark ids in scope (tier/category/search already applied). */
  benchmarkIds: string[];
  /** Results already filtered to reported + the active evidence filter. */
  results: BenchmarkResult[];
  /** Whether a specific benchmark/model cell has a usable value. */
  hasValue?: (result: BenchmarkResult) => boolean;
  minModelsPerBenchmark?: number;
  minBenchmarksPerModel?: number;
}

/**
 * Choose the dense default comparison: benchmarks with enough cohort coverage,
 * then the models that are covered across those benchmarks. Pure and
 * order-stable; adding rows only ever grows the view.
 */
export function selectCompareView(options: CompareViewOptions): CompareView {
  const minModels = options.minModelsPerBenchmark ?? MIN_MODELS_PER_BENCHMARK;
  const minBenchmarks = options.minBenchmarksPerModel ?? MIN_BENCHMARKS_PER_MODEL;
  const hasValue = options.hasValue ?? (() => true);
  const cohort = new Set(options.cohortModelIds);

  const usable = options.results.filter((r) => cohort.has(r.modelCanonicalId) && hasValue(r));

  // Distinct cohort models per benchmark.
  const byBenchmark = new Map<string, Set<string>>();
  for (const result of usable) {
    const set = byBenchmark.get(result.benchmarkId) ?? new Set<string>();
    set.add(result.modelCanonicalId);
    byBenchmark.set(result.benchmarkId, set);
  }

  const coverage: BenchmarkCoverage[] = options.benchmarkIds.map((benchmarkId) => {
    const models = byBenchmark.get(benchmarkId) ?? new Set<string>();
    return { benchmarkId, modelCount: models.size, populatedModelIds: [...models].sort() };
  });

  const eligible = coverage.filter((c) => c.modelCount >= minModels);
  const benchmarkIds = eligible.map((c) => c.benchmarkId);

  const awaiting: AwaitingBenchmark[] = coverage
    .filter((c) => c.modelCount < minModels)
    .map((c): AwaitingBenchmark => ({
      ...c,
      reason: c.modelCount === 0 ? "no_results" : "below_threshold",
      shortfall: minModels - c.modelCount,
    }))
    .sort((a, b) => b.modelCount - a.modelCount || (a.benchmarkId < b.benchmarkId ? -1 : 1));

  const visibleBenchmarks = new Set(benchmarkIds);
  const perModel = new Map<string, Set<string>>();
  for (const result of usable) {
    if (!visibleBenchmarks.has(result.benchmarkId)) continue;
    const set = perModel.get(result.modelCanonicalId) ?? new Set<string>();
    set.add(result.benchmarkId);
    perModel.set(result.modelCanonicalId, set);
  }

  const modelIds = options.cohortModelIds.filter((id) => (perModel.get(id)?.size ?? 0) >= minBenchmarks);

  let populatedCells = 0;
  for (const id of modelIds) populatedCells += perModel.get(id)?.size ?? 0;
  const totalCells = modelIds.length * benchmarkIds.length;

  return {
    benchmarkIds,
    modelIds,
    awaiting,
    coverage,
    populatedCells,
    totalCells,
    density: totalCells === 0 ? 0 : populatedCells / totalCells,
  };
}

/**
 * Why a cell in the compare table is empty. Distinguishes "we have nothing",
 * "we have something, but not for this model", and "we have something for this
 * model under a different protocol". Never used to invent a value.
 */
export type MissingReason =
  | "no_public_result"
  | "tracked_not_ingested"
  | "incompatible_protocol"
  | "filtered_out";

export const MISSING_REASON_LABEL: Record<MissingReason, string> = {
  no_public_result: "No public result found for this model.",
  tracked_not_ingested: "Benchmark tracked, but no current-model result ingested yet.",
  incompatible_protocol: "This model has results for this benchmark under a different version, subset or protocol, so it cannot be ranked in this column.",
  filtered_out: "No comparable result under the current filters.",
};

export function missingReason(
  snapshot: BenchmarkSnapshot,
  opts: { benchmarkId: string; modelCanonicalId: string; scopedResults: BenchmarkResult[] }
): MissingReason {
  const allForModelAndBenchmark = snapshot.results.filter(
    (r) => r.benchmarkId === opts.benchmarkId && r.modelCanonicalId === opts.modelCanonicalId && r.scoreState === "reported" && r.score !== null
  );
  if (allForModelAndBenchmark.length === 0) {
    const anyForBenchmark = snapshot.results.some(
      (r) => r.benchmarkId === opts.benchmarkId && r.scoreState === "reported" && r.score !== null
    );
    return anyForBenchmark ? "no_public_result" : "tracked_not_ingested";
  }
  const scoped = opts.scopedResults.some(
    (r) => r.benchmarkId === opts.benchmarkId && r.modelCanonicalId === opts.modelCanonicalId
  );
  return scoped ? "incompatible_protocol" : "filtered_out";
}

/**
 * Which metric column to show for a benchmark in the dense comparison.
 *
 * A benchmark can have several headline metrics (OSWorld 2.0 reports both binary
 * completion and a partial score). Showing all of them multiplies the columns and
 * re-sparsens the grid, so the default view shows the one metric that actually
 * carries the broadest comparable coverage for the selected cohort. Ties fall
 * back to the registry's declared metric order, so the choice is deterministic.
 */
export function selectCompareMetricId(
  benchmark: { id: string; primaryMetricIds: string[] },
  results: BenchmarkResult[],
  cohortModelIds: string[]
): string | null {
  const cohort = new Set(cohortModelIds);
  let best: { metricId: string; models: number } | null = null;
  for (const metricId of benchmark.primaryMetricIds) {
    const models = new Set(
      results
        .filter((r) => r.benchmarkId === benchmark.id && r.metricId === metricId && cohort.has(r.modelCanonicalId))
        .map((r) => r.modelCanonicalId)
    );
    if (!best || models.size > best.models) best = { metricId, models: models.size };
  }
  return best?.metricId ?? null;
}
