/**
 * Deterministic comparability grouping and within-group ranking.
 *
 * The single most important rule on this page: two results are only ever
 * ranked together when they share benchmark, benchmark version, subset, metric
 * and a materially compatible evaluation protocol. Harness identity is kept
 * out of the *comparability* key (a harness is part of the *system* identity,
 * not of whether two runs are comparable in principle) but is always shown, and
 * ranking is done between model+harness systems so a scaffold is never
 * silently folded into a model.
 */
import type { BenchmarkResult } from "./types";

const STAR = "*";

function field(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return STAR;
  const text = String(value).trim();
  return text.length === 0 ? STAR : text;
}

/**
 * Strict comparability key. Two results with the same key may be ranked
 * together; different keys must never be ranked together. Nullable protocol
 * fields are normalised to "*" so that "unspecified" is compared as
 * unspecified rather than accidentally matching a specified value.
 */
export function comparisonGroupId(result: Pick<BenchmarkResult,
  "benchmarkId" | "benchmarkVersion" | "subset" | "metricId" | "observationMode" | "toolMode" | "reasoningEffort"
>): string {
  return [
    result.benchmarkId,
    field(result.benchmarkVersion),
    field(result.subset),
    result.metricId,
    field(result.observationMode),
    field(result.toolMode),
    field(result.reasoningEffort),
  ].join("|");
}

/** System identity: model + harness. Never collapses a harness into a model. */
export function systemId(result: Pick<BenchmarkResult, "modelCanonicalId" | "harnessCanonicalId">): string {
  return `${result.modelCanonicalId}+${result.harnessCanonicalId ?? "unspecified"}`;
}

/**
 * True when two results share a strict comparable group. Exposed separately
 * from `comparisonGroupId` so the rule is explicit and testable.
 */
export function isStrictlyComparable(a: BenchmarkResult, b: BenchmarkResult): boolean {
  return comparisonGroupId(a) === comparisonGroupId(b);
}

export interface GroupRank {
  /** 1 = leader within the comparable group. */
  rank: number;
  /** Share of the group at or below this result, 0-100 (100 = leader). */
  percentile: number;
  /** How far this result trails the group leader, in the metric's own units (0 = leader). */
  deltaToLeader: number;
  groupSize: number;
  groupId: string;
}

/**
 * Rank reported, scored results inside their own comparable group. Results
 * with a non-numeric state, or a null score, are excluded from ranking and get
 * `null` rather than a fabricated position.
 */
export function computeGroupRanks(results: BenchmarkResult[]): Map<string, GroupRank> {
  const groups = new Map<string, BenchmarkResult[]>();
  for (const result of results) {
    if (result.scoreState !== "reported" || result.score === null) continue;
    const key = comparisonGroupId(result);
    const list = groups.get(key);
    if (list) list.push(result);
    else groups.set(key, [result]);
  }

  const out = new Map<string, GroupRank>();
  for (const [groupId, group] of groups) {
    const higherIsBetter = group[0].higherIsBetter;
    const sorted = [...group].sort((a, b) => {
      const av = a.score as number;
      const bv = b.score as number;
      return higherIsBetter ? bv - av : av - bv;
    });
    const leader = sorted[0].score as number;
    sorted.forEach((result, index) => {
      const score = result.score as number;
      // Distance behind the leader in the metric's own units (0 = leader).
      const delta = higherIsBetter ? leader - score : score - leader;
      const percentile = sorted.length <= 1 ? 100 : ((sorted.length - 1 - index) / (sorted.length - 1)) * 100;
      out.set(result.id, {
        rank: index + 1,
        percentile: Math.round(percentile),
        deltaToLeader: Number(delta.toFixed(4)),
        groupSize: sorted.length,
        groupId,
      });
    });
  }
  return out;
}
