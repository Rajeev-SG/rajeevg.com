"use client";
import { ProvenanceBadge } from "./provenance-badge";
import { comparisonGroupId, computeGroupRanks, type GroupRank } from "@/lib/agent-benchmarks/comparability";
import { missingReason, MISSING_REASON_LABEL } from "@/lib/agent-benchmarks/aggregate";
import type { BenchmarkMeta, BenchmarkResult, BenchmarkSnapshot, MetricDef } from "@/lib/agent-benchmarks/types";

function fmtScore(value: number, unit: MetricDef["unit"]): string {
  if (unit === "rating") return value.toFixed(0);
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

/** Human summary of what makes a group comparable, from its key parts. */
function groupLabel(result: BenchmarkResult, metric: MetricDef | undefined): string {
  const parts = [
    result.benchmarkVersion ? `version ${result.benchmarkVersion}` : null,
    result.subset ? `subset “${result.subset}”` : "base set",
    metric?.label ?? result.metricId,
    result.observationMode ? `observation ${result.observationMode}` : null,
    result.toolMode ? `tools ${result.toolMode}` : null,
    result.reasoningEffort ? `effort ${result.reasoningEffort}` : null,
  ].filter(Boolean);
  return parts.join(" · ");
}

export function BenchmarkLeaderboard({
  benchmark, metric, snapshot, results, onSelectCell,
}: {
  benchmark: BenchmarkMeta;
  metric: MetricDef;
  snapshot: BenchmarkSnapshot;
  /** Results already scoped by the active evidence filter. */
  results: BenchmarkResult[];
  onSelectCell: (modelId: string, harnessId: string | null) => void;
}) {
  const modelById = new Map(snapshot.models.map((m) => [m.canonicalId, m]));
  const scores = results.filter(
    (r) => r.benchmarkId === benchmark.id && r.metricId === metric.id && r.scoreState === "reported" && r.score !== null
  );

  if (scores.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
        No current-model result has been ingested for {benchmark.name}.{" "}
        {snapshot.results.some((r) => r.benchmarkId === benchmark.id && r.scoreState === "reported")
          ? "Other evidence exists for this benchmark; see the benchmark detail for provenance."
          : "It stays listed as tracked-but-empty rather than being shown as a column of blanks."}
      </div>
    );
  }

  const ranks = computeGroupRanks(scores);

  // Group by strict comparability, then order groups by size (largest first) so
  // the most broadly comparable cohort leads. Never mixes groups in one ranking.
  const groups = new Map<string, BenchmarkResult[]>();
  for (const result of scores) {
    const key = comparisonGroupId(result);
    const list = groups.get(key);
    if (list) list.push(result);
    else groups.set(key, [result]);
  }
  const ordered = [...groups.entries()].sort((a, b) => b[1].length - a[1].length || (a[0] < b[0] ? -1 : 1));

  return (
    <div className="space-y-5">
      {ordered.map(([groupId, group], index) => {
        const sorted = [...group].sort((a, b) => (ranks.get(a.id)?.rank ?? 0) - (ranks.get(b.id)?.rank ?? 0));
        const sample = sorted[0];
        return (
          <div key={groupId} className="space-y-2">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h4 className="text-sm font-medium">
                {index === 0 ? "Ranked leaderboard" : `Separate protocol group ${index + 1}`}
                <span className="ml-2 font-normal text-muted-foreground">{sorted.length} comparable run{sorted.length === 1 ? "" : "s"}</span>
              </h4>
              <p className="text-xs text-muted-foreground">{groupLabel(sample, metric)}</p>
            </div>
            {/* Mobile: one card per ranked run, so the score is never off-screen. */}
            <ul className="space-y-2 md:hidden">
              <li className="sr-only">
                {benchmark.name} {metric.label}, ranked only within runs sharing {groupLabel(sample, metric)}.
              </li>
              {sorted.map((result) => {
                const rank: GroupRank | undefined = ranks.get(result.id);
                return (
                  <li key={result.id} className="rounded-xl border p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <button
                          type="button"
                          onClick={() => onSelectCell(result.modelCanonicalId, result.harnessCanonicalId)}
                          className="text-left"
                        >
                          <span className="block truncate font-medium">
                            {modelById.get(result.modelCanonicalId)?.displayName ?? result.modelCanonicalId}
                          </span>
                          <span className="mt-0.5 block text-xs text-muted-foreground">
                            #{rank?.rank ?? "—"} · {modelById.get(result.modelCanonicalId)?.organisation}
                          </span>
                        </button>
                      </div>
                      <span className="shrink-0 text-right">
                        <span className="block text-lg font-semibold tabular-nums leading-tight">
                          {fmtScore(result.score as number, metric.unit)}
                        </span>
                        <span className="block text-[10px] uppercase tracking-wide text-muted-foreground">{metric.label}</span>
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                      <span>{result.harnessReportedName ?? "Unspecified harness"}</span>
                      <ProvenanceBadge sourceType={result.sourceType} evidenceQuality={result.evidenceQuality} />
                      <a href={result.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline">Source</a>
                    </div>
                  </li>
                );
              })}
            </ul>

            {/* Desktop: full ranked table. */}
            <div className="hidden overflow-x-auto rounded-xl border md:block">
              <table className="w-full min-w-[680px] text-sm">
                <caption className="sr-only">
                  {benchmark.name} {metric.label}, ranked only within runs sharing {groupLabel(sample, metric)}.
                </caption>
                <thead className="bg-muted/50 text-left">
                  <tr>
                    <th scope="col" className="px-3 py-2 font-medium">Rank</th>
                    <th scope="col" className="px-3 py-2 font-medium">Model / system</th>
                    <th scope="col" className="px-3 py-2 text-right font-medium">{metric.label}</th>
                    <th scope="col" className="px-3 py-2 font-medium">Harness</th>
                    <th scope="col" className="px-3 py-2 font-medium">Evidence</th>
                    <th scope="col" className="px-3 py-2 font-medium">Source</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((result) => {
                    const rank: GroupRank | undefined = ranks.get(result.id);
                    return (
                      <tr key={result.id} className="border-t">
                        <td className="px-3 py-1.5 tabular-nums text-muted-foreground">{rank?.rank ?? "—"}</td>
                        <td className="px-3 py-1.5">
                          <button
                            type="button"
                            onClick={() => onSelectCell(result.modelCanonicalId, result.harnessCanonicalId)}
                            className="text-left hover:underline"
                          >
                            <span className="font-medium">{modelById.get(result.modelCanonicalId)?.displayName ?? result.modelCanonicalId}</span>
                            <span className="ml-2 text-xs text-muted-foreground">{modelById.get(result.modelCanonicalId)?.organisation}</span>
                          </button>
                        </td>
                        <td className="px-3 py-1.5 text-right tabular-nums font-medium">{fmtScore(result.score as number, metric.unit)}</td>
                        <td className="px-3 py-1.5 text-muted-foreground">{result.harnessReportedName ?? "Unspecified"}</td>
                        <td className="px-3 py-1.5"><ProvenanceBadge sourceType={result.sourceType} evidenceQuality={result.evidenceQuality} /></td>
                        <td className="px-3 py-1.5">
                          <a href={result.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-xs underline">Source</a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Compact list of tracked benchmarks with no usable current-model results. */
export function AwaitingBenchmarks({
  benchmarks, coverageById, onSelectBenchmark,
}: {
  benchmarks: { benchmark: BenchmarkMeta; modelCount: number; shortfall: number; reason: "no_results" | "below_threshold" }[];
  coverageById?: never;
  onSelectBenchmark: (benchmark: BenchmarkMeta) => void;
}) {
  if (benchmarks.length === 0) return null;
  return (
    <section aria-label="Tracked, awaiting current results" className="space-y-3">
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold tracking-tight">Tracked, awaiting current results</h2>
        <p className="text-sm leading-7 text-muted-foreground">
          Important benchmarks where the public record does not yet cover enough of the tracked models to compare.
          They are tracked and clickable, not dropped — and they graduate into the comparison above automatically once
          enough results are ingested.
        </p>
      </div>
      <ul className="flex flex-wrap gap-2">
        {benchmarks.map(({ benchmark, modelCount, shortfall, reason }) => (
          <li key={benchmark.id}>
            <button
              type="button"
              onClick={() => onSelectBenchmark(benchmark)}
              title={reason === "no_results"
                ? "No current-model result ingested for this benchmark yet."
                : `${modelCount} of 3 required tracked models have a result; ${shortfall} more needed.`}
              className="rounded-lg border px-3 py-2 text-left text-sm hover:bg-muted"
            >
              <span className="block font-medium">{benchmark.name}</span>
              <span className="block text-xs text-muted-foreground">
                {reason === "no_results" ? "no result ingested yet" : `${modelCount} of 3 models · ${shortfall} more needed`}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

export { missingReason, MISSING_REASON_LABEL };
