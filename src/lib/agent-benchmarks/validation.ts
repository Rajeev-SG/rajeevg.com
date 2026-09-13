/**
 * Validation gates for a benchmark snapshot.
 *
 * A refresh that trips any of these must fail safely: the last-known-good
 * snapshot is kept and the failure is surfaced in freshness metadata, never
 * silently published.
 */
import type { BenchmarkResult, BenchmarkSnapshot, MetricDef } from "./types";

export interface ValidationResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/** Identity used to detect two records that claim to be the same evaluation. */
export function resultIdentity(result: BenchmarkResult): string {
  return [
    result.benchmarkId,
    result.benchmarkVersion ?? "*",
    result.subset ?? "*",
    result.metricId,
    result.modelCanonicalId,
    result.harnessCanonicalId ?? "*",
    result.observationMode ?? "*",
    result.toolMode ?? "*",
    result.reasoningEffort ?? "*",
    result.runDate ?? "*",
  ].join("::");
}

export interface ValidateOptions {
  /** Reported-result count of the previous snapshot, for the never-shrink gate. */
  previousReportedCount?: number;
  /** Minimum share of the previous count a refresh may retain. */
  shrinkFloor?: number;
}

export function validateSnapshot(snapshot: BenchmarkSnapshot, options: ValidateOptions = {}): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const benchmarkById = new Map(snapshot.benchmarks.map((b) => [b.id, b]));
  const metricById = new Map(snapshot.metrics.map((m) => [m.id, m]));
  const modelIds = new Set(snapshot.models.map((m) => m.canonicalId));
  const harnessIds = new Set(snapshot.harnesses.map((h) => h.canonicalId));

  if (snapshot.benchmarks.length === 0) errors.push("no benchmarks tracked");
  if (snapshot.models.length === 0) errors.push("no models in the canonical registry");
  const reported = snapshot.results.filter((r) => r.scoreState === "reported" && r.score !== null);
  if (reported.length === 0) errors.push("no reported results (empty snapshot)");

  const seen = new Map<string, string>();
  for (const result of snapshot.results) {
    const where = result.id || "(missing id)";

    if (!result.benchmarkId || !benchmarkById.has(result.benchmarkId)) {
      errors.push(`${where}: unknown benchmarkId "${result.benchmarkId}"`);
    }
    const metric: MetricDef | undefined = metricById.get(result.metricId);
    if (!metric) {
      errors.push(`${where}: unknown metricId "${result.metricId}"`);
    }
    if (!modelIds.has(result.modelCanonicalId)) {
      errors.push(`${where}: unknown modelCanonicalId "${result.modelCanonicalId}"`);
    }
    if (result.harnessCanonicalId && !harnessIds.has(result.harnessCanonicalId)) {
      errors.push(`${where}: unknown harnessCanonicalId "${result.harnessCanonicalId}"`);
    }
    if (!result.sourceUrl || !isHttpUrl(result.sourceUrl)) {
      errors.push(`${where}: missing or non-http sourceUrl`);
    }

    if (result.scoreState === "reported") {
      if (result.score === null || !Number.isFinite(result.score)) {
        errors.push(`${where}: scoreState reported but score is not finite`);
      } else if (metric) {
        if (result.score < metric.min || result.score > metric.max) {
          errors.push(`${where}: score ${result.score} outside ${metric.id} range [${metric.min}, ${metric.max}]`);
        }
      }
      if (!result.runDate && !result.publishedAt) {
        warnings.push(`${where}: no run or publication date`);
      }
    } else if (result.score !== null) {
      warnings.push(`${where}: non-reported state carries a numeric score`);
    }

    const identity = resultIdentity(result);
    const prior = seen.get(identity);
    if (prior) errors.push(`duplicate evaluation identity: ${where} collides with ${prior}`);
    else seen.set(identity, where);
  }

  // Never-shrink: a refresh that loses most of the corpus is treated as a
  // parser/upstream failure rather than a real shrink.
  const previous = options.previousReportedCount;
  if (typeof previous === "number" && previous > 0) {
    const floor = options.shrinkFloor ?? 0.5;
    if (reported.length < previous * floor) {
      errors.push(`suspicious shrink: ${reported.length} reported results vs previous ${previous} (< ${Math.round(floor * 100)}%)`);
    }
  }

  const missingAudit = snapshot.benchmarks.filter((b) => b.auditStatus === "unknown").length;
  if (missingAudit > 0) warnings.push(`${missingAudit} benchmark(s) have unknown audit status`);

  return { ok: errors.length === 0, errors, warnings };
}

/** Assert-and-throw wrapper used by the refresh script and snapshot loader. */
export function assertValidSnapshot(snapshot: BenchmarkSnapshot, options: ValidateOptions = {}): void {
  const result = validateSnapshot(snapshot, options);
  if (!result.ok) throw new Error(`invalid benchmark snapshot:\n- ${result.errors.join("\n- ")}`);
}
