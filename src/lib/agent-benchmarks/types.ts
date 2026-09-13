/**
 * Canonical data model for the Agent Benchmark Matrix.
 *
 * Design rules (from the product spec):
 * - A benchmark score is never just `model -> score`. Identity is
 *   `benchmark + version + subset + metric + model revision + harness + protocol -> score`.
 * - Missing data stays missing. Displayed records are never inferred from a
 *   neighbouring model, family member, vendor claim or another benchmark.
 * - Model identity is deterministic (explicit alias + exact match). No fuzzy
 *   matching, no LLM matching, no edit distance.
 */

/** The workload axes a benchmark maps onto (a benchmark may cover several). */
export type WorkloadAxis =
  | "desktop_cua"
  | "browser_navigation"
  | "enterprise_saas"
  | "cross_application_work"
  | "tool_api_mcp"
  | "terminal_coding"
  | "deep_research_browsing"
  | "mobile_gui"
  | "skills_harness"
  | "policy_multi_turn";

/** Coarse UI grouping for benchmark columns. */
export type BenchmarkCategory =
  | "Desktop / CUA"
  | "Enterprise / browser"
  | "Web chores / navigation"
  | "Tools / API / policy"
  | "Terminal / coding"
  | "Research";

/**
 * How trustworthy the *source* of a single result is. This is a property of
 * provenance, never of the model.
 */
export type EvidenceQuality = "high" | "medium" | "low";

/**
 * Provenance class, ordered most- to least-direct. Used both for filtering and
 * for display so a vendor table is never shown as benchmark-official.
 */
export type SourceType =
  | "benchmark_machine_readable"
  | "benchmark_repo"
  | "benchmark_paper"
  | "vendor_official"
  | "independent_reproduction";

/** Explicit state for a score that is not a plain number. */
export type ScoreState =
  | "reported"
  | "not_publicly_reported"
  | "not_ingested_yet"
  | "incompatible_protocol"
  | "source_stale";

export type ScoreUnit = "percent" | "fraction" | "points" | "rating" | "other";

export type AuditStatus = "clean" | "audited_with_findings" | "unaudited" | "unknown";

export type FreshnessStatus = "current" | "stale" | "failed" | "manual" | "pending";

export interface MetricDef {
  id: string;
  label: string;
  /** What the number means in one plain-English phrase. */
  description: string;
  unit: ScoreUnit;
  higherIsBetter: boolean;
  /** Valid inclusive range for validation. */
  min: number;
  max: number;
}

export interface BenchmarkMeta {
  id: string;
  name: string;
  /** p0 = default matrix column; p1 = tracked, shown on demand. */
  tier: "p0" | "p1";
  category: BenchmarkCategory;
  axes: WorkloadAxis[];
  /** One plain-English sentence: what this benchmark measures. */
  measures: string;
  taskCount: number | null;
  /** Human-facing current version, e.g. "2.0 (release v2026.08.08)". */
  currentVersion: string | null;
  /** Canonical pinned version token used for comparability. */
  versionToken: string;
  primaryMetricIds: string[];
  /** deterministic = programmatic verifier; llm_judged = model-as-judge. */
  scoring: "deterministic" | "llm_judged" | "human" | "mixed";
  environment: "self_hosted" | "live_web" | "static" | "sandbox" | "mixed";
  reproducibility: "reproducible" | "partially_reproducible" | "private_tasks" | "vendor_only";
  officialUrl: string;
  repoUrl: string | null;
  paperUrl: string | null;
  /** Free-text caveats shown in the benchmark detail drawer. */
  notes: string;
  auditStatus: AuditStatus;
  auditSourceUrl: string | null;
  knownMajorIssueCount: number | null;
  knownMinorIssueCount: number | null;
  lastSourceCheck: string | null;
}

export interface ModelRecord {
  canonicalId: string;
  displayName: string;
  family: string;
  organisation: string;
  releaseDate: string | null;
  /** Exact strings used by benchmark sources that map to this canonical model. */
  aliases: string[];
  /** Optional OpenRouter id, for a reciprocal link to the Pareto dashboard. */
  openrouterId: string | null;
}

export interface HarnessRecord {
  canonicalId: string;
  name: string;
  organisation: string;
  /** e.g. "scaffold", "vendor computer-use harness", "BrowserGym". */
  kind: string;
  /** True when the harness is the benchmark's own recommended agent. */
  benchmarkOwned: boolean;
  repoUrl: string | null;
  notes: string;
}

/**
 * One evaluation result. Every field is explicitly nullable rather than
 * guessed: a missing configuration detail is `null`, not "default".
 */
export interface BenchmarkResult {
  id: string;
  benchmarkId: string;
  benchmarkVersion: string | null;
  subset: string | null;
  metricId: string;

  score: number | null;
  scoreState: ScoreState;
  scoreUnit: ScoreUnit;
  higherIsBetter: boolean;

  modelCanonicalId: string;
  /** Name as printed by the source, kept verbatim for provenance. */
  modelReportedName: string;
  modelRevision: string | null;
  organisation: string;

  harnessCanonicalId: string | null;
  harnessReportedName: string | null;
  agentVersion: string | null;

  observationMode: string | null;
  toolMode: string | null;
  reasoningEffort: string | null;
  maxSteps: number | null;
  tokenBudget: number | null;
  environmentRevision: string | null;

  runDate: string | null;
  publishedAt: string | null;

  sourceUrl: string;
  sourceType: SourceType;
  evidenceQuality: EvidenceQuality;
  officialSubmission: boolean | null;
  notes: string | null;
}

export interface CandidateRecord {
  id: string;
  name: string;
  discoveredAt: string;
  sourceUrl: string;
  domain: string;
  status: "p0" | "p1" | "p2" | "rejected" | "superseded";
  rationale: string;
  supersededBy: string | null;
  lastReviewedAt: string;
}

export interface SourceFreshness {
  id: string;
  label: string;
  url: string;
  status: FreshnessStatus;
  /** Published/run date of the underlying data, if known. */
  publishedAt: string | null;
  /** When we last fetched/checked it. */
  checkedAt: string | null;
  note: string | null;
}

export interface UnresolvedBenchmark {
  name: string;
  seenIn: string;
  reason: string;
}

export interface UnresolvedModel {
  reportedName: string;
  seenIn: string;
  reason: string;
}

export interface BenchmarkSnapshot {
  generatedAt: string;
  /** ISO date the curated seed data was last reviewed. */
  seedReviewedAt: string;
  benchmarks: BenchmarkMeta[];
  metrics: MetricDef[];
  models: ModelRecord[];
  harnesses: HarnessRecord[];
  results: BenchmarkResult[];
  candidates: CandidateRecord[];
  sources: SourceFreshness[];
  unresolvedBenchmarks: UnresolvedBenchmark[];
  unresolvedModels: UnresolvedModel[];
}

/** A benchmark column shown in the coverage matrix. */
export interface MatrixColumn {
  benchmarkId: string;
  name: string;
  category: BenchmarkCategory;
  versionToken: string;
}

export const SCORE_STATE_LABEL: Record<ScoreState, string> = {
  reported: "Reported",
  not_publicly_reported: "Not publicly reported",
  not_ingested_yet: "Not ingested yet",
  incompatible_protocol: "Incompatible protocol",
  source_stale: "Source stale",
};
