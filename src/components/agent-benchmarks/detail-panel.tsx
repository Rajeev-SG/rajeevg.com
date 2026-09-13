"use client";
import { ProvenanceBadge, sourceLabel, evidenceLabel } from "./provenance-badge";
import { comparisonGroupId, computeGroupRanks } from "@/lib/agent-benchmarks/comparability";
import type { BenchmarkMeta, BenchmarkResult, BenchmarkSnapshot, HarnessRecord, MetricDef, ModelRecord } from "@/lib/agent-benchmarks/types";

export type Selection =
  | { kind: "benchmark"; benchmarkId: string }
  | { kind: "model"; modelId: string }
  | { kind: "cell"; modelId: string; harnessId: string | null; benchmarkId: string; metricId: string };

function fmtDate(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function fmtScore(value: number | null, unit: MetricDef["unit"]): string {
  if (value === null) return "—";
  if (unit === "rating") return value.toFixed(0);
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[10rem_1fr] gap-2 py-1 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

function SourceLink({ result }: { result: BenchmarkResult }) {
  return (
    <a href={result.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
      {sourceLabel(result.sourceType)} source
    </a>
  );
}

export function DetailPanel({
  selection, snapshot, onClose,
}: {
  selection: Selection;
  snapshot: BenchmarkSnapshot;
  onClose: () => void;
}) {
  const metricById = new Map(snapshot.metrics.map((m) => [m.id, m]));
  const modelById = new Map(snapshot.models.map((m) => [m.canonicalId, m]));
  const harnessById = new Map(snapshot.harnesses.map((h) => [h.canonicalId, h]));
  const benchmarkById = new Map(snapshot.benchmarks.map((b) => [b.id, b]));

  const shell = (title: string, subtitle: string, body: React.ReactNode) => (
    <section aria-label="Detail" className="rounded-xl border bg-card/60 p-4">
      <div className="mb-3 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <button type="button" onClick={onClose} className="rounded-lg border px-2.5 py-1 text-sm hover:bg-muted" aria-label="Close detail panel">
          Close
        </button>
      </div>
      {body}
    </section>
  );

  if (selection.kind === "benchmark") {
    const benchmark = benchmarkById.get(selection.benchmarkId);
    if (!benchmark) return null;
    const results = snapshot.results.filter((r) => r.benchmarkId === selection.benchmarkId && r.scoreState === "reported" && r.score !== null);
    const ranks = computeGroupRanks(results);
    const groups = new Map<string, BenchmarkResult[]>();
    for (const r of results) {
      const key = comparisonGroupId(r);
      const list = groups.get(key);
      if (list) list.push(r); else groups.set(key, [r]);
    }
    const audited = benchmark.auditStatus === "audited_with_findings";
    return shell(
      benchmark.name,
      `${benchmark.category} · version ${benchmark.currentVersion ?? benchmark.versionToken}`,
      <div className="space-y-4">
        <p className="text-sm leading-7">{benchmark.measures}</p>
        {audited ? (
          <p className="rounded-lg border border-amber-500/40 bg-amber-500/5 px-3 py-2 text-sm text-amber-700 dark:text-amber-400">
            Independent audit of {benchmark.versionToken}: {benchmark.knownMajorIssueCount} major and {benchmark.knownMinorIssueCount} minor findings.
            {benchmark.auditSourceUrl ? <> <a href={benchmark.auditSourceUrl} target="_blank" rel="noopener noreferrer" className="underline">Audit source</a>.</> : null}
          </p>
        ) : null}
        <dl>
          <Row label="Tasks">{benchmark.taskCount ?? "Not published"}</Row>
          <Row label="Scoring">{benchmark.scoring.replace("_", " ")}</Row>
          <Row label="Environment">{benchmark.environment.replace("_", " ")}</Row>
          <Row label="Reproducibility">{benchmark.reproducibility.replace(/_/g, " ")}</Row>
          <Row label="Metrics">{benchmark.primaryMetricIds.map((id) => metricById.get(id)?.label ?? id).join(", ")}</Row>
          <Row label="Last source check">{fmtDate(benchmark.lastSourceCheck)}</Row>
          <Row label="Links">
            <span className="flex flex-wrap gap-2">
              <a href={benchmark.officialUrl} target="_blank" rel="noopener noreferrer" className="underline">Official</a>
              {benchmark.repoUrl ? <a href={benchmark.repoUrl} target="_blank" rel="noopener noreferrer" className="underline">Repository</a> : null}
              {benchmark.paperUrl ? <a href={benchmark.paperUrl} target="_blank" rel="noopener noreferrer" className="underline">Paper</a> : null}
            </span>
          </Row>
        </dl>
        <p className="text-sm leading-7 text-muted-foreground">{benchmark.notes}</p>
        <div className="space-y-3">
          <h4 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Comparable runs</h4>
          {[...groups.entries()].map(([groupId, group]) => (
            <div key={groupId} className="rounded-lg border p-3">
              <p className="mb-2 text-xs text-muted-foreground">{groupId.replace(/\|/g, " · ")}</p>
              <ul className="space-y-1 text-sm">
                {[...group].sort((a, b) => a.id < b.id ? -1 : 1).map((r) => (
                  <li key={r.id} className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{modelById.get(r.modelCanonicalId)?.displayName ?? r.modelCanonicalId}</span>
                    {r.harnessReportedName ? <span className="text-muted-foreground">+ {r.harnessReportedName}</span> : null}
                    <span className="tabular-nums">{fmtScore(r.score, metricById.get(r.metricId)?.unit ?? "percent")}</span>
                    {ranks.get(r.id) && (ranks.get(r.id) as { groupSize: number }).groupSize > 1 ? <span className="text-[11px] text-muted-foreground">#{ranks.get(r.id)?.rank}</span> : null}
                    <ProvenanceBadge sourceType={r.sourceType} evidenceQuality={r.evidenceQuality} />
                    <a href={r.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-xs underline">source</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {groups.size === 0 ? <p className="text-sm text-muted-foreground">No result ingested yet for this benchmark. Missing data stays missing.</p> : null}
        </div>
      </div>
    );
  }

  if (selection.kind === "model") {
    const model = modelById.get(selection.modelId);
    if (!model) return null;
    const results = snapshot.results.filter((r) => r.modelCanonicalId === selection.modelId && r.scoreState === "reported" && r.score !== null);
    const covered = new Set(results.map((r) => r.benchmarkId));
    const gaps = snapshot.benchmarks.filter((b) => b.tier === "p0" && !covered.has(b.id));
    return shell(
      model.displayName,
      `${model.organisation} · ${model.family} family${model.releaseDate ? ` · released ${fmtDate(model.releaseDate)}` : ""}`,
      <div className="space-y-4">
        <div>
          <h4 className="mb-2 text-sm font-medium uppercase tracking-wide text-muted-foreground">Benchmark evidence ({results.length})</h4>
          {results.length === 0 ? <p className="text-sm text-muted-foreground">No public result found in the registry.</p> : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr><th className="py-1 pr-3">Benchmark</th><th className="py-1 pr-3">Metric</th><th className="py-1 pr-3">Score</th><th className="py-1 pr-3">Harness</th><th className="py-1 pr-3">Version</th><th className="py-1 pr-3">Provenance</th><th className="py-1">Source</th></tr>
                </thead>
                <tbody>
                  {[...results].sort((a, b) => a.benchmarkId.localeCompare(b.benchmarkId) || a.metricId.localeCompare(b.metricId)).map((r) => (
                    <tr key={r.id} className="border-t">
                      <td className="py-1.5 pr-3">{benchmarkById.get(r.benchmarkId)?.name ?? r.benchmarkId}</td>
                      <td className="py-1.5 pr-3 text-muted-foreground">{metricById.get(r.metricId)?.label ?? r.metricId}</td>
                      <td className="py-1.5 pr-3 tabular-nums">{fmtScore(r.score, metricById.get(r.metricId)?.unit ?? "percent")}</td>
                      <td className="py-1.5 pr-3 text-muted-foreground">{r.harnessReportedName ?? "Unspecified"}</td>
                      <td className="py-1.5 pr-3 text-muted-foreground">{r.subset ?? r.benchmarkVersion ?? "—"}</td>
                      <td className="py-1.5 pr-3"><ProvenanceBadge sourceType={r.sourceType} evidenceQuality={r.evidenceQuality} /></td>
                      <td className="py-1.5"><SourceLink result={r} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div>
          <h4 className="mb-2 text-sm font-medium uppercase tracking-wide text-muted-foreground">Gaps across P0 benchmarks</h4>
          {gaps.length === 0 ? <p className="text-sm">No P0 gaps for this model.</p> : (
            <p className="text-sm text-muted-foreground">{gaps.map((g) => g.name).join(", ")}</p>
          )}
        </div>
      </div>
    );
  }

  // cell
  const model = modelById.get(selection.modelId);
  const benchmark = benchmarkById.get(selection.benchmarkId);
  const metric = metricById.get(selection.metricId);
  const harness: HarnessRecord | undefined = selection.harnessId ? harnessById.get(selection.harnessId) : undefined;
  const cellResults = snapshot.results.filter(
    (r) => r.modelCanonicalId === selection.modelId && r.benchmarkId === selection.benchmarkId && r.metricId === selection.metricId
            && (selection.harnessId ? r.harnessCanonicalId === selection.harnessId : true)
  );
  const title = `${model?.displayName ?? selection.modelId}${harness ? ` + ${harness.name}` : ""}`;
  return shell(
    title,
    `${benchmark?.name ?? selection.benchmarkId} · ${metric?.label ?? selection.metricId}`,
    <div className="space-y-3">
      {cellResults.length === 0 ? (
        <p className="text-sm text-muted-foreground">No ingested result for this cell. Missing data stays missing and is never inferred.</p>
      ) : cellResults.map((r) => (
        <div key={r.id} className="rounded-lg border p-3">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="text-lg tabular-nums font-semibold">{fmtScore(r.score, metric?.unit ?? "percent")}</span>
            <ProvenanceBadge sourceType={r.sourceType} evidenceQuality={r.evidenceQuality} />
            <span className="text-xs text-muted-foreground">{evidenceLabel(r.evidenceQuality)}</span>
          </div>
          <dl className="text-sm">
            <Row label="Reported as">{r.modelReportedName}{r.modelRevision ? ` (${r.modelRevision})` : ""}</Row>
            <Row label="Harness">{r.harnessReportedName ?? "Unspecified"}</Row>
            <Row label="Benchmark version">{r.benchmarkVersion ?? "—"}</Row>
            <Row label="Subset">{r.subset ?? "Base set"}</Row>
            <Row label="Reasoning effort">{r.reasoningEffort ?? "—"}</Row>
            <Row label="Observation / tool mode">{[r.observationMode, r.toolMode].filter(Boolean).join(" · ") || "—"}</Row>
            <Row label="Max steps">{r.maxSteps ?? "—"}</Row>
            <Row label="Run / published">{`${fmtDate(r.runDate)} · ${fmtDate(r.publishedAt)}`}</Row>
            <Row label="Source"><a href={r.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline break-all">{r.sourceUrl}</a></Row>
          </dl>
          {r.notes ? <p className="mt-2 text-sm text-muted-foreground">{r.notes}</p> : null}
        </div>
      ))}
      {harness ? <p className="text-xs text-muted-foreground">{harness.name}: {harness.notes}</p> : null}
      <p className="text-xs text-muted-foreground">Provenance classes: benchmark-official data is strongest; a vendor-reported score is labelled as such and is never merged into an official result.</p>
    </div>
  );
}

export type { HarnessRecord, ModelRecord };
