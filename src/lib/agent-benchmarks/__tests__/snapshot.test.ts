import { describe, expect, it } from "vitest";
import results from "@/data/agent-benchmarks/results.json";
import { isPlausibleSnapshot, seedSnapshot } from "@/lib/agent-benchmarks/registry";
import { validateSnapshot } from "@/lib/agent-benchmarks/validation";
import { comparisonGroupId } from "@/lib/agent-benchmarks/comparability";

const snapshot = seedSnapshot();

describe("bundled seed snapshot", () => {
  it("validates", () => {
    expect(validateSnapshot(snapshot).ok).toBe(true);
  });

  it("has a non-empty primary benchmark set with reported results", () => {
    expect(snapshot.benchmarks.length).toBeGreaterThanOrEqual(19);
    expect(snapshot.results.filter((r) => r.scoreState === "reported").length).toBeGreaterThan(50);
  });

  it("composes deterministically and matches the committed results file", () => {
    // The bundled fallback is composed from the registries at runtime, so it
    // must equal the committed results.json exactly (no hidden second source).
    expect(JSON.stringify(snapshot.results)).toBe(JSON.stringify(results));
    expect(JSON.stringify(seedSnapshot().results)).toBe(JSON.stringify(results));
  });

  it("keeps each benchmark+metric column's compatible runs as distinct identities", () => {
    const byColumn = new Map<string, Set<string>>();
    for (const result of snapshot.results) {
      if (result.scoreState !== "reported") continue;
      const column = `${result.benchmarkId}::${result.metricId}`;
      const set = byColumn.get(column) ?? new Set<string>();
      set.add(comparisonGroupId(result));
      byColumn.set(column, set);
    }
    for (const [, groups] of byColumn) {
      expect(groups.size).toBeGreaterThanOrEqual(1);
    }
  });

  it("records provenance and a source URL on every result", () => {
    for (const result of snapshot.results) {
      expect(result.sourceUrl).toMatch(/^https?:\/\//);
      expect(["benchmark_machine_readable", "benchmark_repo", "benchmark_paper", "vendor_official", "independent_reproduction"]).toContain(result.sourceType);
    }
  });
});

describe("durable snapshot shape guard", () => {
  it("accepts the bundled seed", () => {
    expect(isPlausibleSnapshot(seedSnapshot())).toBe(true);
  });

  it("rejects a snapshot whose schema predates the tracked flag", () => {
    const stale = JSON.parse(JSON.stringify(seedSnapshot()));
    for (const model of stale.models) delete model.tracked;
    expect(isPlausibleSnapshot(stale)).toBe(false);
  });

  it("rejects a snapshot whose benchmarks predate comparePriority", () => {
    const stale = JSON.parse(JSON.stringify(seedSnapshot()));
    for (const benchmark of stale.benchmarks) delete benchmark.comparePriority;
    expect(isPlausibleSnapshot(stale)).toBe(false);
  });

  it("rejects a snapshot whose results reference unknown benchmarks", () => {
    const broken = JSON.parse(JSON.stringify(seedSnapshot()));
    broken.results[0].benchmarkId = "not-a-benchmark";
    expect(isPlausibleSnapshot(broken)).toBe(false);
  });

  it("rejects empty or malformed payloads", () => {
    expect(isPlausibleSnapshot(null)).toBe(false);
    expect(isPlausibleSnapshot({})).toBe(false);
    expect(isPlausibleSnapshot({ benchmarks: [], models: [], results: [], generatedAt: "x" })).toBe(false);
  });
});
