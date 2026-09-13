"use client";
import { ProvenanceBadge } from "./provenance-badge";
import type { BenchmarkMeta, BenchmarkResult, MetricDef } from "@/lib/agent-benchmarks/types";
import type { GroupRank } from "@/lib/agent-benchmarks/comparability";

export interface MatrixColumn {
  key: string;
  benchmark: BenchmarkMeta;
  metric: MetricDef;
}

export interface MatrixCell {
  result: BenchmarkResult;
  rank: GroupRank | null;
}

export interface MatrixRow {
  id: string;
  label: string;
  sublabel: string;
  track: string;
  cells: Record<string, MatrixCell | null>;
}

function formatScore(value: number, unit: MetricDef["unit"]): string {
  if (unit === "rating") return value.toFixed(0);
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function CoverageMatrix({
  columns, rows, onSelectCell, onSelectBenchmark, onSelectRow,
}: {
  columns: MatrixColumn[];
  rows: MatrixRow[];
  onSelectCell: (row: MatrixRow, column: MatrixColumn, cell: MatrixCell | null) => void;
  onSelectBenchmark: (benchmark: BenchmarkMeta) => void;
  onSelectRow: (row: MatrixRow) => void;
}) {
  if (columns.length === 0) {
    return <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">No benchmark columns match the current filters.</div>;
  }
  if (rows.length === 0) {
    return <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">No models or systems match the current filters.</div>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border" role="region" aria-label="Agent benchmark coverage matrix">
      <table className="w-full border-collapse text-sm">
        <caption className="sr-only">Model or system coverage across tracked agent benchmarks. Each cell shows the best credible score, its provenance class and its rank within its comparable group.</caption>
        <thead>
          <tr className="bg-muted/50">
            <th scope="col" className="sticky left-0 z-10 min-w-[13rem] border-r bg-muted/50 px-3 py-2 text-left font-medium">
              {rows[0]?.track === "System" ? "System (model + harness)" : "Model"}
            </th>
            {columns.map((column) => (
              <th key={column.key} scope="col" className="min-w-[8.5rem] px-3 py-2 text-left align-bottom font-medium">
                <button type="button" onClick={() => onSelectBenchmark(column.benchmark)} className="text-left hover:underline">
                  <span className="block text-xs leading-tight">{column.benchmark.name}</span>
                  <span className="mt-0.5 block text-[10px] font-normal uppercase tracking-wide text-muted-foreground">
                    {column.metric.label}{column.benchmark.auditStatus === "audited_with_findings" ? " · audit" : ""}
                  </span>
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t">
              <th scope="row" className="sticky left-0 z-10 border-r bg-card px-3 py-2 text-left font-medium">
                <button type="button" onClick={() => onSelectRow(row)} className="text-left hover:underline">
                  <span className="block">{row.label}</span>
                  <span className="mt-0.5 block text-[11px] font-normal text-muted-foreground">{row.sublabel}</span>
                </button>
              </th>
              {columns.map((column) => {
                const cell = row.cells[column.key] ?? null;
                if (!cell) {
                  return (
                    <td key={column.key} className="px-3 py-2 text-muted-foreground" title="No ingested result. Missing data stays missing and is never inferred from another model or benchmark.">
                      <button type="button" onClick={() => onSelectCell(row, column, null)} className="w-full text-left text-muted-foreground/70 hover:text-foreground">
                        &mdash;
                      </button>
                    </td>
                  );
                }
                const { result, rank } = cell;
                const score = result.score as number;
                return (
                  <td key={column.key} className="px-3 py-2 align-top">
                    <button
                      type="button"
                      onClick={() => onSelectCell(row, column, cell)}
                      className="flex w-full flex-col items-start gap-0.5 rounded-md px-1 py-0.5 text-left hover:bg-muted"
                      title={`${result.modelReportedName} · ${result.benchmarkId} ${result.benchmarkVersion ?? ""} · ${result.subset ?? "base set"}`}
                    >
                      <span className="flex items-baseline gap-1.5">
                        <span className="tabular-nums font-medium">{formatScore(score, column.metric.unit)}</span>
                        {rank && rank.groupSize > 1 ? <span className="text-[10px] text-muted-foreground">#{rank.rank}/{rank.groupSize}</span> : null}
                      </span>
                      <span className="flex items-center gap-1">
                        <ProvenanceBadge sourceType={result.sourceType} evidenceQuality={result.evidenceQuality} />
                        {row.track === "System" && result.harnessReportedName ? (
                          <span className="truncate text-[10px] text-muted-foreground">{result.harnessReportedName}</span>
                        ) : null}
                      </span>
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
