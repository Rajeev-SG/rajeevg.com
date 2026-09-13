/**
 * Data loaders for the Agent Benchmark Matrix.
 *
 * Two layers, mirroring the Pareto pipeline:
 *
 * 1. DURABLE snapshot published by the refresh workflow to the dedicated
 *    `benchmark-data` Git branch (raw.githubusercontent.com). Data freshness is
 *    decoupled from the app deployment and from any metered object storage.
 * 2. BUNDLED seed in `src/data/agent-benchmarks/*.json` on `main`: the
 *    guaranteed render path and the test fixture.
 *
 * The durable read never throws: on any failure the caller keeps the bundled
 * last-known-good snapshot, so a failed refresh can never blank the page.
 */
import benchmarksJson from "@/data/agent-benchmarks/benchmarks.json";
import metricsJson from "@/data/agent-benchmarks/metrics.json";
import modelsJson from "@/data/agent-benchmarks/models.json";
import harnessesJson from "@/data/agent-benchmarks/harnesses.json";
import resultsJson from "@/data/agent-benchmarks/results.json";
import candidatesJson from "@/data/agent-benchmarks/candidates.json";
import sourcesJson from "@/data/agent-benchmarks/sources.json";
import unresolvedJson from "@/data/agent-benchmarks/unresolved.json";
import type {
  BenchmarkMeta,
  BenchmarkResult,
  BenchmarkSnapshot,
  CandidateRecord,
  HarnessRecord,
  MetricDef,
  ModelRecord,
  SourceFreshness,
  UnresolvedBenchmark,
  UnresolvedModel,
} from "./types";

export const BENCHMARK_DATA_BRANCH = "benchmark-data";
export const BENCHMARK_SNAPSHOT_PATH = "agent-benchmark-snapshot.json";

/**
 * Bumped whenever the snapshot schema changes. It is appended to the snapshot
 * URL as a query string so a schema change cannot be served a stale cached copy
 * of the previous shape (raw.githubusercontent.com ignores unknown query
 * parameters, so the content is unchanged).
 */
export const BENCHMARK_SNAPSHOT_SCHEMA_VERSION = 2;

export const BENCHMARK_SNAPSHOT_URL =
  process.env.AGENT_BENCHMARK_SNAPSHOT_URL ??
  `https://raw.githubusercontent.com/Rajeev-SG/rajeevg.com/${BENCHMARK_DATA_BRANCH}/${BENCHMARK_SNAPSHOT_PATH}?v=${BENCHMARK_SNAPSHOT_SCHEMA_VERSION}`;

const SEED_REVIEWED_AT = "2026-09-13";

/** The bundled, last-known-good snapshot assembled from the seed registries. */
export function seedSnapshot(): BenchmarkSnapshot {
  return {
    // The seed is a reviewed, dated snapshot: use its review date (not epoch)
    // so a degraded render still shows a meaningful "snapshot generated" date.
    generatedAt: `${SEED_REVIEWED_AT}T00:00:00.000Z`,
    seedReviewedAt: SEED_REVIEWED_AT,
    benchmarks: benchmarksJson as BenchmarkMeta[],
    metrics: metricsJson as MetricDef[],
    models: modelsJson as ModelRecord[],
    harnesses: harnessesJson as HarnessRecord[],
    results: resultsJson as BenchmarkResult[],
    candidates: candidatesJson as CandidateRecord[],
    sources: sourcesJson as SourceFreshness[],
    unresolvedBenchmarks: (unresolvedJson as { benchmarks: UnresolvedBenchmark[] }).benchmarks ?? [],
    unresolvedModels: (unresolvedJson as { models: UnresolvedModel[] }).models ?? [],
  };
}

let durableCache: { at: number; snap: BenchmarkSnapshot | null } = { at: 0, snap: null };
const DURABLE_CACHE_MS = 60 * 60 * 1000;

/**
 * Shape check for the durable snapshot. Deliberately stricter than "is it
 * JSON": a snapshot written before a schema change (for example one whose model
 * records predate the `tracked` flag) must be rejected so the page falls back to
 * the bundled seed instead of silently rendering a wrong or empty view.
 */
export function isPlausibleSnapshot(parsed: unknown): parsed is BenchmarkSnapshot {
  const candidate = parsed as BenchmarkSnapshot | null;
  if (
    !candidate ||
    !Array.isArray(candidate.benchmarks) ||
    candidate.benchmarks.length === 0 ||
    !Array.isArray(candidate.models) ||
    candidate.models.length === 0 ||
    !Array.isArray(candidate.results) ||
    typeof candidate.generatedAt !== "string" ||
    candidate.generatedAt.length === 0
  ) {
    return false;
  }
  const benchmarksHavePriority = candidate.benchmarks.every((b) => "comparePriority" in (b as object));
  const modelsHaveTracked = candidate.models.every((m) => typeof (m as { tracked?: unknown }).tracked === "boolean");
  const benchmarkIds = new Set(candidate.benchmarks.map((b) => b.id));
  const resultsAreResolvable = candidate.results.every((r) => benchmarkIds.has(r.benchmarkId));
  return benchmarksHavePriority && modelsHaveTracked && resultsAreResolvable;
}

/**
 * Read the durable snapshot from the `benchmark-data` branch, cached in-process
 * for an hour. Never throws; on failure it returns the previously cached read
 * (or `null`, so the caller falls back to the bundled seed).
 */
export async function getDurableBenchmarkSnapshot(): Promise<BenchmarkSnapshot | null> {
  const now = Date.now();
  if (durableCache.snap && now - durableCache.at < DURABLE_CACHE_MS) return durableCache.snap;
  try {
    const res = await fetch(BENCHMARK_SNAPSHOT_URL, {
      headers: { Accept: "application/json" },
      next: { revalidate: 3600, tags: ["agent-benchmark-snapshot"] },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const parsed: unknown = await res.json();
    if (!isPlausibleSnapshot(parsed)) throw new Error("invalid durable snapshot shape");
    durableCache = { at: now, snap: parsed };
    return parsed;
  } catch {
    durableCache = { at: now, snap: durableCache.snap };
    return durableCache.snap;
  }
}

export interface SnapshotOutcome {
  snapshot: BenchmarkSnapshot;
  /** "durable" when the live published snapshot was used, else "bundled". */
  source: "durable" | "bundled";
  degraded: boolean;
  note: string | null;
}

/**
 * Effective snapshot for rendering: prefer the live validated snapshot, fall
 * back to the bundled seed. `degraded` is true when we had to fall back, so the
 * page can say so plainly instead of pretending everything is live.
 */
export async function getAgentBenchmarkSnapshot(): Promise<SnapshotOutcome> {
  const durable = await getDurableBenchmarkSnapshot();
  if (durable) {
    return { snapshot: durable, source: "durable", degraded: false, note: null };
  }
  return {
    snapshot: seedSnapshot(),
    source: "bundled",
    degraded: true,
    note: "Live published snapshot unavailable; showing the bundled reviewed seed.",
  };
}

/** Resolve an exact source-reported model name to a canonical id, or null. */
export function resolveModelName(name: string): string | null {
  const normalised = name.trim().toLowerCase();
  for (const model of modelsJson as ModelRecord[]) {
    if (model.displayName.toLowerCase() === normalised) return model.canonicalId;
    if (model.canonicalId.toLowerCase() === normalised) return model.canonicalId;
    for (const alias of model.aliases) {
      if (alias.trim().toLowerCase() === normalised) return model.canonicalId;
    }
  }
  return null;
}
