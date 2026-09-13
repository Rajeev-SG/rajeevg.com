import { describe, expect, it } from "vitest";
import type { BenchmarkResult, BenchmarkSnapshot } from "@/lib/agent-benchmarks/types";
import {
  MIN_BENCHMARKS_PER_MODEL,
  MIN_MODELS_PER_BENCHMARK,
  missingReason,
  selectCompareMetricId,
  selectCompareView,
} from "@/lib/agent-benchmarks/aggregate";
import { seedSnapshot } from "@/lib/agent-benchmarks/registry";
import { inCohort } from "@/lib/agent-benchmarks/cohort";

const snapshot = seedSnapshot();

function result(partial: Partial<BenchmarkResult> & { model: string; bench: string }): BenchmarkResult {
  return {
    id: `${partial.bench}__${partial.model}`,
    benchmarkId: partial.bench,
    benchmarkVersion: "v1",
    subset: null,
    metricId: "accuracy",
    score: 50,
    scoreState: "reported",
    scoreUnit: "percent",
    higherIsBetter: true,
    modelCanonicalId: partial.model,
    modelReportedName: partial.model,
    modelRevision: null,
    organisation: "OpenAI",
    harnessCanonicalId: null,
    harnessReportedName: null,
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

const models = ["m1", "m2", "m3", "m4", "m5"];
const benchmarks = ["b1", "b2", "b3"];

describe("selectCompareView thresholds", () => {
  it("hides a benchmark that covers fewer than the minimum number of models", () => {
    const results = [
      result({ model: "m1", bench: "b1" }),
      result({ model: "m2", bench: "b1" }), // only 2 models -> b1 excluded at threshold 3
      result({ model: "m1", bench: "b2" }),
      result({ model: "m2", bench: "b2" }),
      result({ model: "m3", bench: "b2" }),
    ];
    const view = selectCompareView({ cohortModelIds: models, benchmarkIds: benchmarks, results });
    expect(view.benchmarkIds).toEqual(["b2"]);
    expect(view.awaiting.map((a) => a.benchmarkId)).toContain("b1");
    expect(view.awaiting.find((a) => a.benchmarkId === "b1")?.reason).toBe("below_threshold");
  });

  it("admits a benchmark exactly at the threshold (boundary)", () => {
    const results = [
      result({ model: "m1", bench: "b1" }),
      result({ model: "m2", bench: "b1" }),
      result({ model: "m3", bench: "b1" }),
    ];
    const view = selectCompareView({ cohortModelIds: models, benchmarkIds: ["b1"], results });
    expect(view.benchmarkIds).toEqual(["b1"]);
    expect(view.awaiting).toHaveLength(0);
  });

  it("drops a benchmark one below the threshold (boundary)", () => {
    const results = [
      result({ model: "m1", bench: "b1" }),
      result({ model: "m2", bench: "b1" }),
    ];
    const view = selectCompareView({ cohortModelIds: models, benchmarkIds: ["b1"], results });
    expect(view.benchmarkIds).toEqual([]);
    expect(view.awaiting[0]).toMatchObject({ benchmarkId: "b1", reason: "below_threshold", shortfall: 1 });
  });

  it("hides a model with fewer than the minimum results across visible benchmarks", () => {
    const results = [
      result({ model: "m1", bench: "b1" }), result({ model: "m2", bench: "b1" }), result({ model: "m3", bench: "b1" }),
      result({ model: "m2", bench: "b2" }), result({ model: "m3", bench: "b2" }),
      result({ model: "m1", bench: "b3" }), result({ model: "m2", bench: "b3" }), result({ model: "m3", bench: "b3" }),
      // m4 has a single result in an eligible benchmark only.
      result({ model: "m4", bench: "b1" }),
    ];
    // Make m4 ineligible while keeping b1 eligible at 3 models (m1, m2, m3).
    const filtered = results.filter((r) => !(r.modelCanonicalId === "m4" && r.benchmarkId === "b1"));
    const withExtra = [...filtered, result({ model: "m4", bench: "b2" })];
    const view = selectCompareView({ cohortModelIds: models, benchmarkIds: benchmarks, results: withExtra });
    expect(view.benchmarkIds).toEqual(["b1", "b2", "b3"]);
    // m4 has only 1 result across the visible set -> below the model threshold.
    expect(view.modelIds).not.toContain("m4");
    expect(view.modelIds).toContain("m1");
  });

  it("marks benchmarks with no cohort results distinctly from near-threshold ones", () => {
    const results = [
      result({ model: "m1", bench: "b1" }), result({ model: "m2", bench: "b1" }), result({ model: "m3", bench: "b1" }),
      result({ model: "m1", bench: "b2" }),
    ];
    const view = selectCompareView({ cohortModelIds: models, benchmarkIds: ["b1", "b2", "b3"], results });
    const b2 = view.awaiting.find((a) => a.benchmarkId === "b2");
    const b3 = view.awaiting.find((a) => a.benchmarkId === "b3");
    expect(b2?.reason).toBe("below_threshold");
    expect(b3?.reason).toBe("no_results");
    expect(b3?.shortfall).toBe(3);
  });

  it("never counts results from outside the cohort", () => {
    const results = [
      result({ model: "outsider", bench: "b1" }),
      result({ model: "outsider2", bench: "b1" }),
      result({ model: "outsider3", bench: "b1" }),
    ];
    const view = selectCompareView({ cohortModelIds: models, benchmarkIds: ["b1"], results });
    expect(view.benchmarkIds).toEqual([]);
  });

  it("computes density over the selected models and benchmarks only", () => {
    // b3 covers m1..m3 only, so a genuine gap exists inside the dense view.
    const results = [
      result({ model: "m1", bench: "b1" }), result({ model: "m2", bench: "b1" }), result({ model: "m3", bench: "b1" }), result({ model: "m4", bench: "b1" }),
      result({ model: "m1", bench: "b2" }), result({ model: "m2", bench: "b2" }), result({ model: "m3", bench: "b2" }), result({ model: "m4", bench: "b2" }),
      result({ model: "m1", bench: "b3" }), result({ model: "m2", bench: "b3" }), result({ model: "m3", bench: "b3" }),
    ];
    const view = selectCompareView({ cohortModelIds: models, benchmarkIds: ["b1", "b2", "b3"], results });
    expect(view.benchmarkIds).toEqual(["b1", "b2", "b3"]);
    expect(view.modelIds).toEqual(["m1", "m2", "m3", "m4"]);
    expect(view.totalCells).toBe(4 * 3);
    expect(view.populatedCells).toBe(11);
    expect(view.density).toBeCloseTo(11 / 12, 6);
  });

  it("grows automatically when a benchmark crosses the threshold", () => {
    const before = [
      result({ model: "m1", bench: "b1" }), result({ model: "m2", bench: "b1" }),
    ];
    expect(selectCompareView({ cohortModelIds: models, benchmarkIds: ["b1"], results: before }).benchmarkIds).toEqual([]);
    const after = [...before, result({ model: "m3", bench: "b1" })];
    expect(selectCompareView({ cohortModelIds: models, benchmarkIds: ["b1"], results: after }).benchmarkIds).toEqual(["b1"]);
  });

  it("exposes explicit thresholds that match the documented defaults", () => {
    expect(MIN_MODELS_PER_BENCHMARK).toBe(3);
    expect(MIN_BENCHMARKS_PER_MODEL).toBe(2);
  });
});

describe("compare view on the real seed data (#145 acceptance)", () => {
  const cohort = snapshot.models.filter((m) => inCohort(m, "my_models")).map((m) => m.canonicalId);
  const p0 = snapshot.benchmarks.filter((b) => b.tier === "p0").map((b) => b.id);
  const view = selectCompareView({
    cohortModelIds: cohort,
    benchmarkIds: p0,
    results: snapshot.results.filter((r) => r.scoreState === "reported" && r.score !== null),
  });

  it("defaults to the tracked current-generation models only", () => {
    expect(cohort).toEqual([
      "gpt-5.6-sol", "gpt-5.6-terra", "gpt-5.6-luna",
      "glm-5.3", "glm-5.3-flash",
      "deepseek-v4.1-flash",
      "kimi-k3", "qwen3.8-max",
    ]);
  });

  it("produces the 8-model × 7-benchmark dense comparison", () => {
    expect(view.modelIds).toHaveLength(8);
    expect(view.benchmarkIds).toHaveLength(7);
    expect(view.modelIds).toContain("gpt-5.6-sol");
    expect(view.modelIds).toContain("qwen3.8-max");
  });

  it("keeps OSWorld 2.0 in the default comparison", () => {
    expect(view.benchmarkIds).toContain("osworld-2.0");
  });

  it("is at least twice as dense as the full sparse matrix would be", () => {
    expect(view.density).toBeGreaterThan(0.6);
    const sparse = snapshot.results.filter((r) => r.scoreState === "reported" && r.score !== null);
    const sparseCells = new Set(sparse.map((r) => `${r.modelCanonicalId}::${r.benchmarkId}`));
    const fullDensity = sparseCells.size / (snapshot.models.length * snapshot.benchmarks.length);
    expect(view.density).toBeGreaterThan(fullDensity * 2);
  });

  it("moves the zero-coverage benchmarks into the awaiting list", () => {
    const awaitingIds = view.awaiting.map((a) => a.benchmarkId);
    for (const id of ["workarena-plus-plus", "enterpriseops-gym", "webchorearena", "aa-analyst-agent", "crmarena-pro", "theagentcompany", "appworld"]) {
      expect(awaitingIds).toContain(id);
      expect(view.awaiting.find((a) => a.benchmarkId === id)?.reason).toBe("no_results");
    }
    // Near-threshold benchmarks are surfaced too, so nothing silently disappears.
    expect(awaitingIds).toContain("spreadsheetbench-2");
  });

  it("accounts for every scoped benchmark as either a column or awaiting", () => {
    const shown = new Set([...view.benchmarkIds, ...view.awaiting.map((a) => a.benchmarkId)]);
    for (const id of p0) expect(shown.has(id)).toBe(true);
  });
});

describe("missingReason", () => {
  it("explains a tracked-but-empty benchmark", () => {
    expect(missingReason(snapshot, { benchmarkId: "workarena-plus-plus", modelCanonicalId: "gpt-5.6-sol", scopedResults: snapshot.results }))
      .toBe("tracked_not_ingested");
  });

  it("explains a model with no public result on a benchmark that has results", () => {
    expect(missingReason(snapshot, { benchmarkId: "terminal-bench-2.1", modelCanonicalId: "qwen3.8-flash-next", scopedResults: snapshot.results }))
      .toBe("no_public_result");
  });

  it("explains a result excluded by the current evidence filter", () => {
    const scoped = snapshot.results.filter((r) => r.sourceType !== "vendor_official");
    expect(missingReason(snapshot, { benchmarkId: "terminal-bench-2.1", modelCanonicalId: "glm-5.3", scopedResults: scoped }))
      .toBe("filtered_out");
  });
});

describe("strict comparability semantics are unchanged by the redesign", () => {
  it("keeps the seed snapshot valid and provenance complete", () => {
    const snap: BenchmarkSnapshot = snapshot;
    for (const r of snap.results) expect(r.sourceUrl).toMatch(/^https?:\/\//);
    expect(snap.results.every((r) => r.scoreState !== "reported" || r.score !== null)).toBe(true);
  });
});

describe("selectCompareMetricId", () => {
  const cohort = snapshot.models.filter((m) => inCohort(m, "my_models")).map((m) => m.canonicalId);
  const reported = snapshot.results.filter((r) => r.scoreState === "reported" && r.score !== null);

  it("picks the metric with the broadest cohort coverage for a multi-metric benchmark", () => {
    const osworld = snapshot.benchmarks.find((b) => b.id === "osworld-2.0");
    expect(osworld).toBeDefined();
    // Binary completion has fewer cohort models than the partial-progress score.
    const chosen = selectCompareMetricId(osworld!, reported, cohort);
    expect(chosen).toBe("partial_score");
  });

  it("keeps the declared primary metric when coverage ties", () => {
    const terminal = snapshot.benchmarks.find((b) => b.id === "terminal-bench-2.1");
    expect(terminal!.primaryMetricIds).toEqual(["accuracy"]);
    expect(selectCompareMetricId(terminal!, reported, cohort)).toBe("accuracy");
  });

  it("returns null when the benchmark has no metric ids", () => {
    expect(selectCompareMetricId({ id: "x", primaryMetricIds: [] }, reported, cohort)).toBeNull();
  });
});

describe("compare matrix shape on the real seed data", () => {
  const cohort = snapshot.models.filter((m) => inCohort(m, "my_models")).map((m) => m.canonicalId);
  const p0 = snapshot.benchmarks.filter((b) => b.tier === "p0").map((b) => b.id);
  const results = snapshot.results.filter((r) => r.scoreState === "reported" && r.score !== null);
  const view = selectCompareView({ cohortModelIds: cohort, benchmarkIds: p0, results });

  it("renders one column per benchmark, so the grid matches the density figure", () => {
    const columns = view.benchmarkIds.map((id) => {
      const benchmark = snapshot.benchmarks.find((b) => b.id === id)!;
      return selectCompareMetricId(benchmark, results, view.modelIds);
    });
    expect(columns.filter(Boolean)).toHaveLength(view.benchmarkIds.length);
    expect(view.modelIds.length * columns.length).toBe(view.totalCells);
  });

  it("fills at least the density it advertises for the rendered metric set", () => {
    let filled = 0;
    for (const modelId of view.modelIds) {
      for (const benchmarkId of view.benchmarkIds) {
        const benchmark = snapshot.benchmarks.find((b) => b.id === benchmarkId)!;
        const metricId = selectCompareMetricId(benchmark, results, view.modelIds);
        const hit = results.some(
          (r) => r.benchmarkId === benchmarkId && r.modelCanonicalId === modelId && r.metricId === metricId
        );
        if (hit) filled += 1;
      }
    }
    expect(filled).toBe(view.populatedCells);
    expect(filled / view.totalCells).toBeCloseTo(view.density, 6);
  });
});
