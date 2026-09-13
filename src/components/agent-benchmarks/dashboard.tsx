"use client";
import { useMemo, useState } from "react";
import type { BenchmarkResult, BenchmarkSnapshot } from "@/lib/agent-benchmarks/types";
import { computeGroupRanks } from "@/lib/agent-benchmarks/comparability";
import { buildCoverage, coverageByAxis, pickBestResult, selectPrimaryGroupId, summarise } from "@/lib/agent-benchmarks/aggregate";
import { CoverageMatrix, type MatrixCell, type MatrixColumn, type MatrixRow } from "./coverage-matrix";
import { DetailPanel, type Selection } from "./detail-panel";
import { DEFAULT_FILTERS, Filters, isTrackedFamily, type FilterState } from "./filters";
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

function passesEvidence(result: BenchmarkResult, filter: FilterState["evidence"]): boolean {
  if (filter === "all") return true;
  if (filter === "official") return result.sourceType !== "vendor_official";
  return result.sourceType !== "vendor_official" || result.evidenceQuality !== "low";
}

export function AgentBenchmarkDashboard({ snapshot }: { snapshot: BenchmarkSnapshot }) {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [selection, setSelection] = useState<Selection | null>(null);

  const modelById = useMemo(() => new Map(snapshot.models.map((m) => [m.canonicalId, m])), [snapshot]);
  const summary = useMemo(() => summarise(snapshot), [snapshot]);

  const scopedResults = useMemo(
    () => snapshot.results.filter((r) => r.scoreState === "reported" && r.score !== null && passesEvidence(r, filters.evidence)),
    [snapshot, filters.evidence]
  );

  const ranks = useMemo(() => computeGroupRanks(scopedResults), [scopedResults]);

  const modelKeys = useMemo(
    () => new Set(scopedResults.map((r) => `${r.modelCanonicalId}::${r.harnessCanonicalId ?? "unspecified"}`)),
    [scopedResults]
  );

  const columns = useMemo<MatrixColumn[]>(() => {
    const q = filters.search.trim().toLowerCase();
    const out: MatrixColumn[] = [];
    for (const benchmark of snapshot.benchmarks) {
      if (!filters.includeP1 && benchmark.tier !== "p0") continue;
      if (filters.category !== "all" && benchmark.category !== filters.category) continue;
      if (q && !(`${benchmark.name} ${benchmark.category}`.toLowerCase().includes(q))) continue;
      for (const metricId of benchmark.primaryMetricIds) {
        const metric = snapshot.metrics.find((m) => m.id === metricId);
        if (!metric) continue;
        out.push({ key: `${benchmark.id}::${metricId}`, benchmark, metric });
      }
    }
    return out;
  }, [snapshot, filters.category, filters.includeP1, filters.search]);

  const rows = useMemo<MatrixRow[]>(() => {
    const q = filters.search.trim().toLowerCase();
    const visibleColumns = columns.map((c) => c.benchmark.id);

    const cellFor = (results: BenchmarkResult[], benchmarkId: string, metricId: string): MatrixCell | null => {
      const groupId = filters.comparability === "strict" ? selectPrimaryGroupId(results, benchmarkId) : null;
      const result = pickBestResult(results, { benchmarkId, groupId });
      if (!result || result.metricId !== metricId) return null;
      return { result, rank: ranks.get(result.id) ?? null };
    };

    if (filters.view === "model") {
      return snapshot.models
        .filter((m) => filters.organisation === "all" || m.organisation === filters.organisation)
        .filter((m) => !filters.trackedOnly || isTrackedFamily(m.family))
        .filter((m) => filters.harness === "all" || scopedResults.some((r) => r.modelCanonicalId === m.canonicalId && (r.harnessCanonicalId ?? "unspecified") === filters.harness))
        .filter((m) => !q || `${m.displayName} ${m.family} ${m.organisation}`.toLowerCase().includes(q))
        .map((m) => {
          const modelResults = scopedResults.filter((r) => r.modelCanonicalId === m.canonicalId);
          const cells: Record<string, MatrixCell | null> = {};
          for (const column of columns) {
            const metricResults = modelResults.filter((r) => r.metricId === column.metric.id);
            if (!visibleColumns.includes(column.benchmark.id)) continue;
            cells[column.key] = cellFor(metricResults, column.benchmark.id, column.metric.id);
          }
          return {
            id: m.canonicalId,
            label: m.displayName,
            sublabel: `${m.organisation} · ${m.family}`,
            track: "Model",
            cells,
          };
        })
        .filter((row) => row.cells && Object.values(row.cells).some((c) => c !== null));
    }

    // System view: one row per model + harness that has at least one result.
    const systems = new Map<string, { modelId: string; harnessId: string }>();
    for (const r of scopedResults) {
      const harnessId = r.harnessCanonicalId ?? "unspecified";
      systems.set(`${r.modelCanonicalId}::${harnessId}`, { modelId: r.modelCanonicalId, harnessId });
    }
    return [...systems.values()]
      .map(({ modelId, harnessId }) => {
        const model = modelById.get(modelId);
        if (!model) return null;
        if (filters.organisation !== "all" && model.organisation !== filters.organisation) return null;
        if (filters.trackedOnly && !isTrackedFamily(model.family)) return null;
        if (filters.harness !== "all" && harnessId !== filters.harness) return null;
        const harness = snapshot.harnesses.find((h) => h.canonicalId === harnessId)?.name ?? "Unspecified";
        if (q && !`${model.displayName} ${harness} ${model.organisation}`.toLowerCase().includes(q)) return null;
        const systemResults = scopedResults.filter((r) => r.modelCanonicalId === modelId && (r.harnessCanonicalId ?? "unspecified") === harnessId);
        const cells: Record<string, MatrixCell | null> = {};
        for (const column of columns) {
          const metricResults = systemResults.filter((r) => r.metricId === column.metric.id);
          cells[column.key] = cellFor(metricResults, column.benchmark.id, column.metric.id);
        }
        return {
          id: `${modelId}::${harnessId}`,
          label: model.displayName,
          sublabel: `+ ${harness}`,
          track: "System",
          cells,
        } satisfies MatrixRow;
      })
      .filter((row): row is MatrixRow => row !== null && Object.values(row.cells).some((c) => c !== null));
  }, [snapshot, columns, scopedResults, filters, modelById, ranks]);

  const coverage = useMemo(() => buildCoverage(snapshot).filter((c) => {
    const model = modelById.get(c.modelCanonicalId);
    if (!model) return false;
    if (filters.organisation !== "all" && model.organisation !== filters.organisation) return false;
    if (filters.trackedOnly && !isTrackedFamily(model.family)) return false;
    return true;
  }), [snapshot, modelById, filters.organisation, filters.trackedOnly]);

  const axes = useMemo(() => coverageByAxis(snapshot), [snapshot]);
  const categories = useMemo(() => [...new Set(snapshot.benchmarks.map((b) => b.category))].sort(), [snapshot]);
  const organisations = useMemo(() => [...new Set(snapshot.models.map((m) => m.organisation))].sort(), [snapshot]);
  const harnessOptions = useMemo(() => {
    const used = new Set(scopedResults.map((r) => r.harnessCanonicalId ?? "unspecified"));
    return [...used].map((id) => ({ value: id, label: snapshot.harnesses.find((h) => h.canonicalId === id)?.name ?? id }));
  }, [scopedResults, snapshot]);

  const auditedBenchmarks = snapshot.benchmarks.filter((b) => b.auditStatus === "audited_with_findings");
  const p0Count = snapshot.benchmarks.filter((b) => b.tier === "p0").length;

  return (
    <div className="space-y-8">
      <section aria-label="Snapshot summary" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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

      <Filters
        state={filters}
        onChange={setFilters}
        categories={categories}
        organisations={organisations}
        harnesses={harnessOptions}
      />

      <CoverageMatrix
        columns={columns}
        rows={rows}
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
        {rows.length} rows × {columns.length} columns. A dash means no result has been ingested for that cell; nothing is ever inferred from a neighbouring model or benchmark.
        {" "}Rank ({rows[0]?.track === "System" ? "model + harness" : "system"}) is computed only inside a comparable group.
      </p>

      {selection ? <DetailPanel selection={selection} snapshot={snapshot} onClose={() => setSelection(null)} /> : null}

      <section aria-label="Coverage" className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">Coverage</h2>
        <p className="text-sm leading-7 text-muted-foreground">
          Coverage answers “which of my tracked models have actually been evaluated broadly?”, and where the public record is thin. It is deliberately not a quality score.
        </p>
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[560px] text-sm">
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

      <section aria-label="Maintenance diagnostics" className="space-y-3">
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
