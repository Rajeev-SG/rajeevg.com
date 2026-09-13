import { describe, expect, it } from "vitest";
import type { BenchmarkResult } from "@/lib/agent-benchmarks/types";
import { buildCoverage, coverageByAxis, pickBestResult, selectPrimaryGroupId, summarise } from "@/lib/agent-benchmarks/aggregate";
import { seedSnapshot } from "@/lib/agent-benchmarks/registry";

const snapshot = seedSnapshot();

function makeResult(partial: Partial<BenchmarkResult>): BenchmarkResult {
  return {
    id: "r", benchmarkId: "b", benchmarkVersion: "v1", subset: null, metricId: "accuracy",
    score: 10, scoreState: "reported", scoreUnit: "percent", higherIsBetter: true,
    modelCanonicalId: "m", modelReportedName: "M", modelRevision: null, organisation: "O",
    harnessCanonicalId: null, harnessReportedName: null, agentVersion: null,
    observationMode: null, toolMode: null, reasoningEffort: null, maxSteps: null, tokenBudget: null,
    environmentRevision: null, runDate: null, publishedAt: null, sourceUrl: "https://e.com",
    sourceType: "vendor_official", evidenceQuality: "medium", officialSubmission: null, notes: null,
    ...partial,
  };
}

describe("pickBestResult", () => {
  it("prefers stronger evidence over a higher but weaker number", () => {
    const results = [
      makeResult({ id: "official", score: 40, sourceType: "benchmark_repo", evidenceQuality: "high" }),
      makeResult({ id: "vendor", score: 90, sourceType: "vendor_official", evidenceQuality: "medium" }),
    ];
    expect(pickBestResult(results, { benchmarkId: "b" })?.id).toBe("official");
  });

  it("prefers more-direct provenance at equal evidence", () => {
    const results = [
      makeResult({ id: "paper", score: 50, sourceType: "benchmark_paper", evidenceQuality: "high" }),
      makeResult({ id: "machine", score: 50, sourceType: "benchmark_machine_readable", evidenceQuality: "high" }),
    ];
    expect(pickBestResult(results, { benchmarkId: "b" })?.id).toBe("machine");
  });

  it("returns null when nothing reported exists (never invents a score)", () => {
    const results = [makeResult({ id: "x", score: null, scoreState: "not_ingested_yet" })];
    expect(pickBestResult(results, { benchmarkId: "b" })).toBeNull();
  });
});

describe("selectPrimaryGroupId", () => {
  it("picks the strict group with the most reported results", () => {
    const results = [
      makeResult({ id: "a", benchmarkVersion: "v1", subset: null }),
      makeResult({ id: "b", benchmarkVersion: "v1", subset: null }),
      makeResult({ id: "c", benchmarkVersion: "v2", subset: null }),
    ];
    const groupId = selectPrimaryGroupId(results, "b");
    expect(pickBestResult(results, { benchmarkId: "b", groupId })?.id).toMatch(/^[ab]$/);
  });
});

describe("coverage on the seed snapshot", () => {
  it("reports per-model coverage bounded by tracked benchmarks", () => {
    const coverage = buildCoverage(snapshot);
    const tracked = snapshot.benchmarks.length;
    expect(coverage.length).toBe(snapshot.models.length);
    for (const row of coverage) {
      expect(row.benchmarksTracked).toBe(tracked);
      expect(row.benchmarksAvailable).toBeLessThanOrEqual(tracked);
      expect(row.benchmarksAvailable).toBeGreaterThanOrEqual(0);
    }
  });

  it("summarises non-zero counts", () => {
    const summary = summarise(snapshot);
    expect(summary.benchmarkCount).toBeGreaterThanOrEqual(19);
    expect(summary.modelCount).toBeGreaterThan(15);
    expect(summary.reportedCount).toBeGreaterThan(50);
  });

  it("reports axis coverage", () => {
    const axes = coverageByAxis(snapshot);
    expect(axes.length).toBeGreaterThan(5);
    expect(axes[0].benchmarkCount).toBeGreaterThanOrEqual(axes[axes.length - 1].benchmarkCount);
  });
});
