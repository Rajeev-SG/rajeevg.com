import { describe, expect, it } from "vitest";
import type { BenchmarkResult } from "@/lib/agent-benchmarks/types";
import { comparisonGroupId, computeGroupRanks, isStrictlyComparable, systemId } from "@/lib/agent-benchmarks/comparability";

function makeResult(partial: Partial<BenchmarkResult>): BenchmarkResult {
  return {
    id: partial.id ?? "r",
    benchmarkId: "osworld-2.0",
    benchmarkVersion: "v2026.08.08",
    subset: null,
    metricId: "binary_completion",
    score: 10,
    scoreState: "reported",
    scoreUnit: "percent",
    higherIsBetter: true,
    modelCanonicalId: "gpt-5.6-sol",
    modelReportedName: "GPT-5.6 Sol",
    modelRevision: null,
    organisation: "OpenAI",
    harnessCanonicalId: "codex",
    harnessReportedName: "Codex",
    agentVersion: null,
    observationMode: null,
    toolMode: null,
    reasoningEffort: null,
    maxSteps: null,
    tokenBudget: null,
    environmentRevision: null,
    runDate: null,
    publishedAt: null,
    sourceUrl: "https://example.com",
    sourceType: "vendor_official",
    evidenceQuality: "medium",
    officialSubmission: null,
    notes: null,
    ...partial,
  };
}

describe("comparisonGroupId", () => {
  it("treats harness differences as comparable (harness is system identity, not comparability)", () => {
    const a = makeResult({ id: "a", harnessCanonicalId: "codex" });
    const b = makeResult({ id: "b", harnessCanonicalId: "claude-code" });
    expect(comparisonGroupId(a)).toBe(comparisonGroupId(b));
    expect(isStrictlyComparable(a, b)).toBe(true);
  });

  it("separates benchmark versions", () => {
    const a = makeResult({ id: "a", benchmarkVersion: "v2026.06.24" });
    const b = makeResult({ id: "b", benchmarkVersion: "v2026.08.08" });
    expect(isStrictlyComparable(a, b)).toBe(false);
  });

  it("separates subsets", () => {
    const a = makeResult({ id: "a", subset: "banking" });
    const b = makeResult({ id: "b", subset: "retail" });
    expect(isStrictlyComparable(a, b)).toBe(false);
  });

  it("separates metrics", () => {
    const a = makeResult({ id: "a", metricId: "binary_completion" });
    const b = makeResult({ id: "b", metricId: "partial_score" });
    expect(isStrictlyComparable(a, b)).toBe(false);
  });

  it("separates reasoning budgets", () => {
    const a = makeResult({ id: "a", reasoningEffort: "high" });
    const b = makeResult({ id: "b", reasoningEffort: "ultra" });
    expect(isStrictlyComparable(a, b)).toBe(false);
  });

  it("separates tool/observation mode", () => {
    const a = makeResult({ id: "a", toolMode: "oracle" });
    const b = makeResult({ id: "b", toolMode: "retrieval" });
    expect(isStrictlyComparable(a, b)).toBe(false);
  });
});

describe("systemId", () => {
  it("keeps model + harness separate", () => {
    const a = makeResult({ id: "a", modelCanonicalId: "gpt-5.6-sol", harnessCanonicalId: "codex" });
    const b = makeResult({ id: "b", modelCanonicalId: "gpt-5.6-sol", harnessCanonicalId: "claude-code" });
    expect(systemId(a)).not.toBe(systemId(b));
  });
});

describe("computeGroupRanks", () => {
  it("ranks only inside a comparable group and never across groups", () => {
    const results = [
      makeResult({ id: "a", score: 50, harnessCanonicalId: "codex" }),
      makeResult({ id: "b", score: 30, harnessCanonicalId: "claude-code" }),
      makeResult({ id: "c", score: 90, benchmarkVersion: "vOTHER" }),
    ];
    const ranks = computeGroupRanks(results);
    expect(ranks.get("a")?.rank).toBe(1);
    expect(ranks.get("b")?.rank).toBe(2);
    expect(ranks.get("a")?.groupSize).toBe(2);
    // Different version => its own group of one => rank 1, but never compared with a/b.
    expect(ranks.get("c")?.rank).toBe(1);
    expect(ranks.get("c")?.groupSize).toBe(1);
  });

  it("excludes non-reported or null scores from ranking", () => {
    const results = [
      makeResult({ id: "a", score: 50 }),
      makeResult({ id: "b", score: null, scoreState: "not_ingested_yet" }),
    ];
    const ranks = computeGroupRanks(results);
    expect(ranks.has("b")).toBe(false);
  });

  it("respects lower-is-better metrics for delta sign", () => {
    const results = [
      makeResult({ id: "a", score: 10, metricId: "steps", higherIsBetter: false }),
      makeResult({ id: "b", score: 20, metricId: "steps", higherIsBetter: false }),
    ];
    const ranks = computeGroupRanks(results);
    expect(ranks.get("a")?.rank).toBe(1);
    expect(ranks.get("a")?.deltaToLeader).toBe(0);
    expect(ranks.get("b")?.deltaToLeader).toBe(10);
  });
});
