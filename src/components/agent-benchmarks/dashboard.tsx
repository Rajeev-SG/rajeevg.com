"use client";
import { useMemo, useState } from "react";
import type { BenchmarkMeta, BenchmarkResult, BenchmarkSnapshot } from "@/lib/agent-benchmarks/types";
import { computeGroupRanks } from "@/lib/agent-benchmarks/comparability";
import {
  buildCoverage,
  coverageByAxis,
  missingReason,
  MISSING_REASON_LABEL,
  pickBestResult,
  selectCompareMetricId,
  selectCompareView,
  selectPrimaryGroupId,
  summarise,
} from "@/lib/agent-benchmarks/aggregate";
import { CoverageMatrix, type MatrixCell, type MatrixColumn, type MatrixRow } from "./coverage-matrix";
import { AwaitingBenchmarks, BenchmarkLeaderboard } from "./benchmark-leaderboard";
import { DetailPanel, type Selection } from "./detail-panel";
import { DEFAULT_FILTERS, Filters, type FilterState } from "./filters";
import { COHORT_OPTIONS, inCohort, type Cohort } from "@/lib/agent-benchmarks/cohort";
import { ProvenanceBadge } from "./provenance-badge";

const AXIS_LABEL: Record<string, string> = {
  desktop_cua: "Desktop / CUA",
  browser_navigation: "Browser / web",
  enterprise_saas: "Enterprise SaaS",
  cross_application_work: "Cross-application work",
  tool_api_mcp: "Tool / API / MCP",
  terminal_coding: "Terminal / coding",
  deep_research_browsing: "Deep research / browsing",
  mobile_gui: "Mobile / GUI",
  skills_harness: "Skills / harness use",
  policy_multi_turn: "Policy / multi-turn",
};

type PageView = "compare" | "coverage";

function passesEvidence(result: BenchmarkResult, filter: FilterState["evidence"]): boolean {
  if (filter === "all") return true;
  if (filter === "official") return result.sourceType !== "vendor_official";
  return result.sourceType !== "vendor_official" || result.evidenceQuality !== "low";
}

function Segmented<T extends string>({
  legend, value, options, onChange, size = "md",
}: {
  legend: string;
  value: T;
  options: { value: T; label: string; hint?: string }[];
  onChange: (v: T) => void;
  size?: "md" | "lg";
}) {
  return (
    <fieldset className="space-y-1">
      <legend className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{legend}</legend>
      <div className="flex flex-wrap gap-1">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={value === option.value}
            title={option.hint}
            onClick={() => onChange(option.value)}
            className={`rounded-lg border ${size === "lg" ? "px-4 py-2" : "px-3 py-1.5"} text-sm ${value === option.value ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export function AgentBenchmarkDashboard({ snapshot }: { snapshot: BenchmarkSnapshot }) {
  const [page, setPage] = useState<PageView>("compare");
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [leaderboardBenchmarkId, setLeaderboardBenchmarkId] = useState<string | null>(null);
  const [leaderboardMetricId, setLeaderboardMetricId] = useState<string | null>(null);

  const modelById = useMemo(() => new Map(snapshot.models.map((m) => [m.canonicalId, m])), [snapshot]);
  const benchmarkById = useMemo(() => new Map(snapshot.benchmarks.map((b) => [b.id, b])), [snapshot]);
  const metricById = useMemo(() => new Map(snapshot.metrics.map((m) => [m.id, m])), [snapshot]);
  const summary = useMemo(() => summarise(snapshot), [snapshot]);

  const scopedResults = useMemo(
    () => snapshot.results.filter((r) => r.scoreState === "reported" && r.score !== null && passesEvidence(r, filters.evidence)),
    [snapshot, filters.evidence]
  );

  const ranks = useMemo(() => computeGroupRanks(scopedResults), [scopedResults]);

  const q = filters.search.trim().toLowerCase();

  /** Models in the selected cohort, in registry order. */
  const cohortModels = useMemo(
    () => snapshot.models.filter((m) => inCohort(m, filters.cohort)),
    [snapshot, filters.cohort]
  );

  /** Benchmarks in scope: tier, category, search. */
  const scopedBenchmarks = useMemo(
    () => snapshot.benchmarks.filter((b) => {
      if (!filters.includeP1 && b.tier !== "p0") return false;
      if (filters.category !== "all" && b.category !== filters.category) return false;
      if (q && !`${b.name} ${b.category}`.toLowerCase().includes(q)) return false;
      return true;
    }),
    [snapshot, filters.category, filters.includeP1, q]
  );

  /**
   * Columns for a matrix. The dense comparison shows exactly one metric per
   * benchmark (the one carrying the most comparable coverage) so the grid stays
   * readable; the coverage map shows every declared metric.
   */
  const columnsFor = (benchmarks: BenchmarkMeta[], oneMetricPerBenchmark: boolean, cohortModelIds: string[]): MatrixColumn[] => {
    const out: MatrixColumn[] = [];
    for (const benchmark of benchmarks) {
      const metricIds = oneMetricPerBenchmark
        ? [selectCompareMetricId(benchmark, scopedResults, cohortModelIds)].filter((id): id is string => Boolean(id))
        : benchmark.primaryMetricIds;
      for (const metricId of metricIds) {
        const metric = metricById.get(metricId);
        if (!metric) continue;
        out.push({ key: `${benchmark.id}::${metricId}`, benchmark, metric });
      }
    }
    return out;
  };

  // --- Compare view: dense, data-driven benchmark and model selection --------
  const compare = useMemo(() => {
    const scopedIds = scopedBenchmarks
      .slice()
      .sort((a, b) => {
        const pa = a.comparePriority ?? Number.MAX_SAFE_INTEGER;
        const pb = b.comparePriority ?? Number.MAX_SAFE_INTEGER;
        if (pa !== pb) return pa - pb;
        return a.name.localeCompare(b.name);
      })
      .map((b) => b.id);
    return selectCompareView({
      cohortModelIds: cohortModels.map((m) => m.canonicalId),
      benchmarkIds: scopedIds,
      results: scopedResults,
    });
  }, [scopedBenchmarks, cohortModels, scopedResults]);

  const compareBenchmarks = useMemo(
    () => compare.benchmarkIds
      .map((id) => benchmarkById.get(id))
      .filter((b): b is BenchmarkMeta => Boolean(b))
      // Ordering: curated priority, then cohort coverage descending, then name.
      .sort((a, b) => {
        const pa = a.comparePriority ?? Number.MAX_SAFE_INTEGER;
        const pb = b.comparePriority ?? Number.MAX_SAFE_INTEGER;
        if (pa !== pb) return pa - pb;
        const ca = compare.coverage.find((c) => c.benchmarkId === a.id)?.modelCount ?? 0;
        const cb = compare.coverage.find((c) => c.benchmarkId === b.id)?.modelCount ?? 0;
        if (ca !== cb) return cb - ca;
        return a.name.localeCompare(b.name);
      }),
    [compare, benchmarkById]
  );

  const compareColumns = useMemo(
    () => columnsFor(compareBenchmarks, true, compare.modelIds),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [compareBenchmarks, compare.modelIds, metricById, scopedResults]
  );

  const buildRows = (
    mode: "model" | "system",
    visibleBenchmarks: BenchmarkMeta[],
    visibleModelIds: string[],
    oneMetricPerBenchmark: boolean
  ): MatrixRow[] => {
    const columns = columnsFor(visibleBenchmarks, oneMetricPerBenchmark, visibleModelIds);
    const cellFor = (results: BenchmarkResult[], benchmarkId: string, metricId: string): MatrixCell | null => {
      const groupId = filters.comparability === "strict" ? selectPrimaryGroupId(results, benchmarkId) : null;
      const result = pickBestResult(results, { benchmarkId, groupId });
      if (!result || result.metricId !== metricId) return null;
      return { result, rank: ranks.get(result.id) ?? null };
    };

    if (mode === "model") {
      return visibleModelIds
        .filter((id) => filters.organisation === "all" || modelById.get(id)?.organisation === filters.organisation)
        .filter((id) => filters.harness === "all" || scopedResults.some((r) => r.modelCanonicalId === id && (r.harnessCanonicalId ?? "unspecified") === filters.harness))
        .filter((id) => {
          const model = modelById.get(id);
          return model ? !q || `${model.displayName} ${model.family} ${model.organisation}`.toLowerCase().includes(q) : false;
        })
        .map((id): MatrixRow | null => {
          const model = modelById.get(id);
          if (!model) return null;
          const modelResults = scopedResults.filter((r) => r.modelCanonicalId === id);
          const cells: Record<string, MatrixCell | null> = {};
          let available = 0;
          for (const column of columns) {
            const cell = cellFor(modelResults.filter((r) => r.metricId === column.metric.id), column.benchmark.id, column.metric.id);
            cells[column.key] = cell;
            if (cell) available += 1;
          }
          return {
            id,
            label: model.displayName,
            sublabel: `${model.organisation} · ${model.family}`,
            track: "Model",
            coverage: { available, total: visibleBenchmarks.length },
            cells,
          };
        })
        .filter((row): row is MatrixRow => row !== null);
    }

    const systems = new Map<string, string>();
    for (const r of scopedResults) {
      const harnessId = r.harnessCanonicalId ?? "unspecified";
      if (!visibleModelIds.includes(r.modelCanonicalId)) continue;
      systems.set(`${r.modelCanonicalId}::${harnessId}`, r.modelCanonicalId);
    }
    return [...systems.entries()]
      .map(([key, modelId]): MatrixRow | null => {
        const harnessId = key.split("::")[1];
        const model = modelById.get(modelId);
        if (!model) return null;
        if (filters.organisation !== "all" && model.organisation !== filters.organisation) return null;
        if (filters.harness !== "all" && harnessId !== filters.harness) return null;
        const harness = snapshot.harnesses.find((h) => h.canonicalId === harnessId)?.name ?? "Unspecified";
        if (q && !`${model.displayName} ${harness} ${model.organisation}`.toLowerCase().includes(q)) return null;
        const systemResults = scopedResults.filter((r) => r.modelCanonicalId === modelId && (r.harnessCanonicalId ?? "unspecified") === harnessId);
        const cells: Record<string, MatrixCell | null> = {};
        let available = 0;
        for (const column of columns) {
          const cell = cellFor(systemResults.filter((r) => r.metricId === column.metric.id), column.benchmark.id, column.metric.id);
          cells[column.key] = cell;
          if (cell) available += 1;
        }
        return {
          id: key,
          label: model.displayName,
          sublabel: `+ ${harness}`,
          track: "System",
          coverage: { available, total: visibleBenchmarks.length },
          cells,
        };
      })
      .filter((row): row is MatrixRow => row !== null && Object.values(row.cells).some((c) => c !== null));
  };

  const compareRows = useMemo(
    () => buildRows(filters.view, compareBenchmarks, compare.modelIds, true),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [compareBenchmarks, compare.modelIds, scopedResults, filters, ranks, modelById, snapshot, q]
  );

  // --- Coverage view: the full sparse evidence map --------------------------
  /**
   * Coverage is the full evidence map: every model in the registry and every
   * tracked benchmark (P0 and P1), regardless of the cohort or tier controls
   * above. Sparsity is the information, so nothing is filtered away here beyond
   * the explicit advanced filters (organisation, harness, search, evidence).
   */
  const coverageBenchmarks = useMemo(
    () => snapshot.benchmarks.filter((b) => {
      if (filters.category !== "all" && b.category !== filters.category) return false;
      if (q && !`${b.name} ${b.category}`.toLowerCase().includes(q)) return false;
      return true;
    }),
    [snapshot, filters.category, q]
  );

  const coverageRows = useMemo(() => {
    const modelIds = snapshot.models.map((m) => m.canonicalId);
    return buildRows(filters.view, coverageBenchmarks, modelIds, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapshot, coverageBenchmarks, filters, scopedResults, ranks, modelById, q]);

  const coverageColumns = useMemo(
    () => columnsFor(coverageBenchmarks, false, snapshot.models.map((m) => m.canonicalId)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [coverageBenchmarks, metricById, snapshot, scopedResults]
  );

  const coverage = useMemo(() => buildCoverage(snapshot).filter((c) => {
    const model = modelById.get(c.modelCanonicalId);
    return model ? inCohort(model, filters.cohort) : false;
  }), [snapshot, modelById, filters.cohort]);

  const axes = useMemo(() => coverageByAxis(snapshot), [snapshot]);
  const categories = useMemo(() => [...new Set(snapshot.benchmarks.map((b) => b.category))].sort(), [snapshot]);
  const organisations = useMemo(() => [...new Set(snapshot.models.map((m) => m.organisation))].sort(), [snapshot]);
  const harnessOptions = useMemo(() => {
    const used = new Set(scopedResults.map((r) => r.harnessCanonicalId ?? "unspecified"));
    return [...used].map((id) => ({ value: id, label: snapshot.harnesses.find((h) => h.canonicalId === id)?.name ?? id }));
  }, [scopedResults, snapshot]);

  const auditedBenchmarks = snapshot.benchmarks.filter((b) => b.auditStatus === "audited_with_findings");
  const p0Count = snapshot.benchmarks.filter((b) => b.tier === "p0").length;

  const missingTitle = (row: MatrixRow, column: MatrixColumn): string => {
    const modelId = row.id.split("::")[0];
    const reason = missingReason(snapshot, { benchmarkId: column.benchmark.id, modelCanonicalId: modelId, scopedResults });
    return MISSING_REASON_LABEL[reason];
  };

  // Benchmark leaderboard: selection defaults to the first compare column.
  const leaderboardBenchmark = useMemo(
    () => benchmarkById.get(leaderboardBenchmarkId ?? compareBenchmarks[0]?.id ?? "") ?? null,
    [benchmarkById, leaderboardBenchmarkId, compareBenchmarks]
  );
  const leaderboardMetricIds = leaderboardBenchmark?.primaryMetricIds ?? [];
  const leaderboardMetric = leaderboardBenchmark
    ? metricById.get(
        leaderboardMetricId && leaderboardMetricIds.includes(leaderboardMetricId)
          ? leaderboardMetricId
          : selectCompareMetricId(leaderboardBenchmark, scopedResults, cohortModels.map((m) => m.canonicalId))
            ?? leaderboardMetricIds[0]
      ) ?? null
    : null;

  /** Benchmarks tracked in scope that did not reach the compare threshold. */
  const awaiting = useMemo(
    () => compare.awaiting
      .map((a) => ({ benchmark: benchmarkById.get(a.benchmarkId), modelCount: a.modelCount, shortfall: a.shortfall, reason: a.reason }))
      .filter((a): a is { benchmark: BenchmarkMeta; modelCount: number; shortfall: number; reason: "no_results" | "below_threshold" } => Boolean(a.benchmark)),
    [compare.awaiting, benchmarkById]
  );

  const densityPct = Math.round(compare.density * 100);

  const selectBenchmarkIntoLeaderboard = (benchmark: BenchmarkMeta) => {
    setPage("compare");
    setLeaderboardBenchmarkId(benchmark.id);
    setLeaderboardMetricId(null);
    requestAnimationFrame(() => {
      document.getElementById("benchmark-leaderboard")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  return (
    <div className="space-y-8">
      <section aria-label="Snapshot summary" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Benchmarks tracked", value: `${p0Count} P0 · ${snapshot.benchmarks.length} total` },
          { label: "Models in registry", value: String(summary.modelCount) },
          { label: "Result records", value: `${summary.reportedCount} reported` },
          { label: "Evidence split", value: `${summary.officialCount} official · ${summary.vendorCount} vendor` },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{stat.label}</p>
            <p className="mt-1 text-lg font-semibold tabular-nums">{stat.value}</p>
          </div>
        ))}
      </section>

      <div className="space-y-4 rounded-xl border p-4">
        <div className="grid gap-4 sm:grid-cols-2">
        <Segmented
          legend="Page"
          size="lg"
          value={page}
          onChange={(next) => setPage(next)}
          options={[
            { value: "compare", label: "Compare", hint: "Dense comparison of the models that matter, on the benchmarks where enough evidence overlaps." },
            { value: "coverage", label: "Coverage", hint: "The full model × benchmark evidence map, including every gap." },
          ]}
        />

        <Segmented
          legend="Cohort"
          value={filters.cohort}
          onChange={(cohort: Cohort) => setFilters((f) => ({ ...f, cohort }))}
          options={COHORT_OPTIONS.map((o) => ({ value: o.value, label: o.label, hint: o.hint }))}
        />
        </div>
        <p className="max-w-3xl text-sm leading-7 text-muted-foreground">
          {page === "compare"
            ? `Benchmarks with at least 3 tracked models and models with at least 2 results in that set. Ultra-sparse combinations are held back here and shown in full under Coverage; nothing is inferred to fill a gap.`
            : "The full registry: every model against every tracked benchmark, ignoring the cohort and tier controls above. Sparsity is the information here — it shows where the public record does not yet cover a model."}
        </p>
      </div>

      {page === "compare" ? (
        <>
          <section aria-label="Comparable evidence" className="space-y-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-2xl font-semibold tracking-tight">Comparable evidence</h2>
              <p className="text-sm tabular-nums text-muted-foreground">
                {compare.modelIds.length} models × {compareBenchmarks.length} benchmarks · {compare.populatedCells}/{compare.totalCells} cells populated ({densityPct}%)
              </p>
            </div>
            <p className="max-w-3xl text-sm leading-7 text-muted-foreground">
              A dash means no ingested public result for that combination — not a failed model. Select a benchmark heading to open its leaderboard below.
            </p>
            <CoverageMatrix
              columns={compareColumns}
              rows={compareRows}
              missingTitle={missingTitle}
              onSelectCell={(row, column, cell) => setSelection({
                kind: "cell",
                modelId: cell?.result.modelCanonicalId ?? row.id.split("::")[0],
                harnessId: row.track === "System" ? row.id.split("::")[1] : null,
                benchmarkId: column.benchmark.id,
                metricId: column.metric.id,
              })}
              onSelectBenchmark={selectBenchmarkIntoLeaderboard}
              onSelectRow={(row) => setSelection({ kind: "model", modelId: row.id.split("::")[0] })}
            />
          </section>

          {leaderboardBenchmark && leaderboardMetric ? (
            <section id="benchmark-leaderboard" aria-label="Benchmark leaderboard" className="scroll-mt-24 space-y-3">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div className="space-y-1">
                  <h2 className="text-2xl font-semibold tracking-tight">Benchmark leaderboard</h2>
                  <p className="text-sm leading-7 text-muted-foreground">
                    {leaderboardBenchmark.measures}
                  </p>
                </div>
                <div className="flex flex-wrap items-end gap-4">
                {leaderboardMetricIds.length > 1 ? (
                  <label className="space-y-1 text-sm">
                    <span className="block text-xs font-medium uppercase tracking-wide text-muted-foreground">Metric</span>
                    <select
                      aria-label="Metric"
                      value={leaderboardMetric?.id ?? ""}
                      onChange={(e) => setLeaderboardMetricId(e.target.value)}
                      className="max-w-[16rem] rounded-lg border bg-background px-3 py-1.5"
                    >
                      {leaderboardMetricIds.map((id) => (
                        <option key={id} value={id}>{metricById.get(id)?.label ?? id}</option>
                      ))}
                    </select>
                  </label>
                ) : null}
                <label className="space-y-1 text-sm">
                  <span className="block text-xs font-medium uppercase tracking-wide text-muted-foreground">Benchmark</span>
                  <select
                    aria-label="Benchmark"
                    value={leaderboardBenchmark.id}
                    onChange={(e) => setLeaderboardBenchmarkId(e.target.value)}
                    className="max-w-[22rem] rounded-lg border bg-background px-3 py-1.5"
                  >
                    {[...compareBenchmarks, ...snapshot.benchmarks.filter((b) => !compare.benchmarkIds.includes(b.id) && (filters.includeP1 || b.tier === "p0"))]
                      .map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </label>
                </div>
              </div>
              {leaderboardBenchmark.auditStatus === "audited_with_findings" ? (
                <p className="rounded-lg border border-amber-500/40 bg-amber-500/5 px-3 py-2 text-sm text-amber-700 dark:text-amber-400">
                  Independent audit of {leaderboardBenchmark.versionToken}: {leaderboardBenchmark.knownMajorIssueCount} major and {leaderboardBenchmark.knownMinorIssueCount} minor findings.
                  {leaderboardBenchmark.auditSourceUrl ? <> <a href={leaderboardBenchmark.auditSourceUrl} target="_blank" rel="noopener noreferrer" className="underline">Audit source</a>.</> : null}
                </p>
              ) : null}
              <BenchmarkLeaderboard
                benchmark={leaderboardBenchmark}
                metric={leaderboardMetric}
                snapshot={snapshot}
                results={scopedResults}
                onSelectCell={(modelId, harnessId) => setSelection({
                  kind: "cell",
                  modelId,
                  harnessId,
                  benchmarkId: leaderboardBenchmark.id,
                  metricId: leaderboardMetric.id,
                })}
              />
            </section>
          ) : null}

          <AwaitingBenchmarks
            benchmarks={awaiting}
            onSelectBenchmark={(benchmark) => setSelection({ kind: "benchmark", benchmarkId: benchmark.id })}
          />
        </>
      ) : (
        <section aria-label="Coverage map" className="space-y-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-2xl font-semibold tracking-tight">Coverage map</h2>
            <p className="text-sm tabular-nums text-muted-foreground">
              {coverageRows.length} rows × {coverageColumns.length} columns · {summary.benchmarksWithNoResults} benchmarks with no ingested result
            </p>
          </div>
          <CoverageMatrix
            columns={coverageColumns}
            rows={coverageRows}
            missingTitle={missingTitle}
            onSelectCell={(row, column, cell) => setSelection({
              kind: "cell",
              modelId: cell?.result.modelCanonicalId ?? row.id.split("::")[0],
              harnessId: row.track === "System" ? row.id.split("::")[1] : null,
              benchmarkId: column.benchmark.id,
              metricId: column.metric.id,
            })}
            onSelectBenchmark={(benchmark) => setSelection({ kind: "benchmark", benchmarkId: benchmark.id })}
            onSelectRow={(row) => setSelection({ kind: "model", modelId: row.id.split("::")[0] })}
          />
          <p className="text-xs text-muted-foreground">
            Rank is computed only inside a strictly comparable group; a dash means no result has been ingested for that cell.
          </p>
        </section>
      )}

      {selection ? <DetailPanel selection={selection} snapshot={snapshot} onClose={() => setSelection(null)} /> : null}

      <section aria-label="Coverage summary" className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">Coverage</h2>
        <p className="text-sm leading-7 text-muted-foreground">
          Coverage answers “which of my tracked models have actually been evaluated broadly?”, and where the public record is thin. It is deliberately not a quality score.
        </p>
        {/* Mobile: per-model cards, so every figure is visible without sideways scroll. */}
        <div className="space-y-2 md:hidden">
          {coverage.map((c) => (
            <div key={c.modelCanonicalId} className="rounded-xl border p-3">
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-medium">{modelById.get(c.modelCanonicalId)?.displayName}</span>
                <span className="tabular-nums text-sm text-muted-foreground">
                  {c.benchmarksAvailable} / {p0Count} benchmarks
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {c.benchmarkOfficialCount} benchmark-official · {c.vendorReportedCount} vendor-reported
              </p>
            </div>
          ))}
        </div>

        {/* Desktop: full table. */}
        <div className="hidden overflow-x-auto rounded-xl border md:block">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr><th className="px-3 py-2 font-medium">Model</th><th className="px-3 py-2 font-medium">Benchmarks with a result</th><th className="px-3 py-2 font-medium">Official</th><th className="px-3 py-2 font-medium">Vendor-reported</th></tr>
            </thead>
            <tbody>
              {coverage.map((c) => (
                <tr key={c.modelCanonicalId} className="border-t">
                  <td className="px-3 py-1.5">{modelById.get(c.modelCanonicalId)?.displayName}</td>
                  <td className="px-3 py-1.5 tabular-nums">{c.benchmarksAvailable} / {p0Count}</td>
                  <td className="px-3 py-1.5 tabular-nums">{c.benchmarkOfficialCount}</td>
                  <td className="px-3 py-1.5 tabular-nums">{c.vendorReportedCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border p-4">
            <h3 className="mb-2 text-sm font-medium uppercase tracking-wide text-muted-foreground">Workload axes covered</h3>
            <ul className="space-y-1 text-sm">
              {axes.map((a) => <li key={a.axis} className="flex justify-between"><span>{AXIS_LABEL[a.axis] ?? a.axis}</span><span className="tabular-nums text-muted-foreground">{a.benchmarkCount}</span></li>)}
            </ul>
          </div>
          <div className="rounded-xl border p-4">
            <h3 className="mb-2 text-sm font-medium uppercase tracking-wide text-muted-foreground">Known audit caveats</h3>
            {auditedBenchmarks.length === 0 ? <p className="text-sm text-muted-foreground">No audited benchmarks with findings in scope.</p> : (
              <ul className="space-y-2 text-sm">
                {auditedBenchmarks.map((b) => (
                  <li key={b.id}>
                    <span className="font-medium">{b.name}</span> — {b.knownMajorIssueCount} major, {b.knownMinorIssueCount} minor findings ({b.versionToken}).
                    {b.auditSourceUrl ? <> <a href={b.auditSourceUrl} target="_blank" rel="noopener noreferrer" className="underline">Audit</a></> : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      <section aria-label="Advanced filters and diagnostics" className="space-y-3">
        <details className="rounded-xl border p-4" open={page === "coverage"}>
          <summary className="cursor-pointer text-sm font-medium">Advanced controls</summary>
          <div className="mt-3">
            <Filters
              state={filters}
              onChange={setFilters}
              categories={categories}
              organisations={organisations}
              harnesses={harnessOptions}
            />
          </div>
        </details>
        <details className="rounded-xl border p-4">
          <summary className="cursor-pointer text-sm font-medium">Maintenance and source diagnostics</summary>
          <div className="mt-3 space-y-4 text-sm text-muted-foreground">
            <div>
              <h4 className="font-medium text-foreground">Source freshness</h4>
              <ul className="mt-1 space-y-1">
                {snapshot.sources.map((s) => (
                  <li key={s.id}>
                    <a href={s.url} target="_blank" rel="noopener noreferrer" className="underline">{s.label}</a>
                    {" · "}{s.status}{s.checkedAt ? ` · checked ${s.checkedAt}` : ""}
                    {s.note ? ` — ${s.note}` : ""}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-foreground">Unresolved benchmark names ({snapshot.unresolvedBenchmarks.length})</h4>
              <ul className="mt-1 space-y-1">
                {snapshot.unresolvedBenchmarks.map((u) => <li key={u.name}>{u.name} — {u.reason}</li>)}
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-foreground">Unresolved model names ({snapshot.unresolvedModels.length})</h4>
              <ul className="mt-1 space-y-1">
                {snapshot.unresolvedModels.map((u) => <li key={u.reportedName}>{u.reportedName} — {u.reason}</li>)}
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-foreground">Candidate benchmark registry</h4>
              <p className="mt-1">{snapshot.candidates.length} benchmarks recorded. {["p0", "p1", "p2", "rejected", "superseded"].map((s) => `${snapshot.candidates.filter((c) => c.status === s).length} ${s}`).join(" · ")}.</p>
              <ul className="mt-1 space-y-1">
                {snapshot.candidates.filter((c) => c.status === "rejected" || c.status === "superseded").map((c) => (
                  <li key={c.id}><span className="font-medium text-foreground">{c.name}</span> — {c.status}: {c.rationale}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-foreground">Missing-cell meanings</h4>
              <ul className="mt-1 space-y-1">
                {Object.entries(MISSING_REASON_LABEL).map(([key, label]) => <li key={key}><span className="font-medium text-foreground">{key}</span> — {label}</li>)}
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-foreground">Provenance key</h4>
              <p className="mt-1 flex flex-wrap items-center gap-2">
                <ProvenanceBadge sourceType="benchmark_repo" evidenceQuality="high" /> benchmark-official ·
                <ProvenanceBadge sourceType="benchmark_paper" evidenceQuality="high" /> paper ·
                <ProvenanceBadge sourceType="independent_reproduction" evidenceQuality="medium" /> independent ·
                <ProvenanceBadge sourceType="vendor_official" evidenceQuality="medium" /> vendor-reported
              </p>
            </div>
          </div>
        </details>
      </section>
    </div>
  );
}
