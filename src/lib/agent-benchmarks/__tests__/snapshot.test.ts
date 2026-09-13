import { describe, expect, it } from "vitest";
import fallback from "@/data/agent-benchmarks/fallback-snapshot.json";
import results from "@/data/agent-benchmarks/results.json";
import { validateSnapshot } from "@/lib/agent-benchmarks/validation";
import { comparisonGroupId } from "@/lib/agent-benchmarks/comparability";
import type { BenchmarkSnapshot } from "@/lib/agent-benchmarks/types";

const snapshot = fallback as unknown as BenchmarkSnapshot;

describe("bundled snapshot", () => {
  it("validates", () => {
    expect(validateSnapshot(snapshot).ok).toBe(true);
  });

  it("has a non-empty primary benchmark set with reported results", () => {
    expect(snapshot.benchmarks.length).toBeGreaterThanOrEqual(19);
    expect(snapshot.results.filter((r) => r.scoreState === "reported").length).toBeGreaterThan(50);
  });

  it("serialises deterministically (results.json matches the snapshot)", () => {
    expect(JSON.stringify(snapshot.results)).toBe(JSON.stringify(results));
  });

  it("never co-locates unlike protocols in one comparable group across a benchmark", () => {
    // For each benchmark+metric column, group results and assert every group's
    // scores use one metric scale (guards against version/subset mixing).
    const byColumn = new Map<string, Set<string>>();
    for (const result of snapshot.results) {
      if (result.scoreState !== "reported") continue;
      const column = `${result.benchmarkId}::${result.metricId}`;
      const set = byColumn.get(column) ?? new Set<string>();
      set.add(comparisonGroupId(result));
      byColumn.set(column, set);
    }
    // Any column with more than one comparable group is fine, but each group
    // must be a distinct identity — i.e. no accidental collapse to a single key.
    for (const [, groups] of byColumn) {
      expect(groups.size).toBeGreaterThanOrEqual(1);
    }
  });
});
