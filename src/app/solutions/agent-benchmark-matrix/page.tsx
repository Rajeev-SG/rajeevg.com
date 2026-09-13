import type { Metadata } from "next";
import Link from "next/link";

import { AgentBenchmarkDashboard } from "@/components/agent-benchmarks/dashboard";
import { getAgentBenchmarkSnapshot } from "@/lib/agent-benchmarks/registry";
import { validateSnapshot } from "@/lib/agent-benchmarks/validation";
import { summarise } from "@/lib/agent-benchmarks/aggregate";
import { site } from "@/lib/site";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Agent Benchmark Matrix",
  description:
    "A provenance-first matrix of agent, computer-use and tool-use benchmarks: which models were evaluated, under which harness and protocol, what they scored, and where the public evidence is missing.",
  alternates: { canonical: "/solutions/agent-benchmark-matrix" },
  openGraph: {
    title: `Agent Benchmark Matrix • ${site.name}`,
    description:
      "Cross-model agent benchmark coverage with provenance, harness separation, strict comparability and honest gaps.",
    type: "website",
    url: `${site.siteUrl}/solutions/agent-benchmark-matrix`,
  },
};

export default async function AgentBenchmarkMatrixPage() {
  const { snapshot, source, degraded, note } = await getAgentBenchmarkSnapshot();
  const validation = validateSnapshot(snapshot);
  const summary = summarise(snapshot);

  return (
    <section className="space-y-8" data-analytics-section="agent_benchmark_matrix" data-analytics-item-type="tool">
      <header className="max-w-3xl space-y-3">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">Solutions · AI &amp; Agent Systems</p>
        <h1 className="text-4xl font-semibold tracking-tight">Agent Benchmark Matrix</h1>
        <p className="text-lg leading-8 text-muted-foreground">
          A provenance-first matrix of agent benchmarks, showing exactly which model and harness combinations were evaluated,
          under what protocol, and where evidence is still missing. No ranking across unlike runs, no invented composite score.
        </p>
        <p className="text-sm leading-7 text-muted-foreground">
          Looking for the quality-versus-cost view instead? See the <Link href="/solutions/pareto-frontier" className="underline underline-offset-4">LLM Pareto Frontier</Link>.
          This page answers a different question: what evidence exists that a model or system can actually do the work.
        </p>

        <p className="text-sm text-muted-foreground">
          Snapshot generated {new Date(snapshot.generatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
          {" · "}{summary.benchmarkCount} benchmarks · {summary.modelCount} models · {summary.reportedCount} reported results
          {summary.unresolvedBenchmarkCount + summary.unresolvedModelCount > 0
            ? ` · ${summary.unresolvedBenchmarkCount + summary.unresolvedModelCount} names queued for triage`
            : null}.
        </p>

        {degraded ? (
          <p className="rounded-lg border border-blue-500/40 bg-blue-500/5 px-3 py-2 text-sm text-blue-700 dark:text-blue-400">
            {note ?? "Showing the bundled reviewed seed."}
          </p>
        ) : null}
        {!validation.ok ? (
          <p className="rounded-lg border border-red-500/40 bg-red-500/5 px-3 py-2 text-sm text-red-700 dark:text-red-400">
            Snapshot validation failed; showing the last-known-good data. {validation.errors.slice(0, 2).join(" · ")}
          </p>
        ) : null}
        {validation.ok && validation.warnings.length > 0 ? (
          <p className="rounded-lg border border-amber-500/40 bg-amber-500/5 px-3 py-2 text-sm text-amber-700 dark:text-amber-400">
            {validation.warnings.length} data warning{validation.warnings.length === 1 ? "" : "s"} (see maintenance diagnostics).
          </p>
        ) : null}
      </header>

      <AgentBenchmarkDashboard snapshot={snapshot} />

      <section aria-label="Methodology" className="max-w-3xl space-y-2 text-sm leading-7 text-muted-foreground">
        <h2 className="text-lg font-medium text-foreground">How to read this</h2>
        <p>
          A benchmark score is never just “model → number”. It is a combination of benchmark, benchmark version, subset, metric,
          model revision, harness, tool and observation mode, and reasoning or step budget. Two runs of the same model under
          different harnesses stay separate records, and are only ranked together inside a strictly comparable group.
        </p>
        <p>
          Missing cells stay missing. A blank is not a zero and is never filled from a neighbouring model, a family member, a
          vendor claim or a different benchmark. Some blanks mean “not publicly reported”; others mean “not ingested yet”. Both are
          stated rather than hidden.
        </p>
        <p>
          There is deliberately no cross-benchmark “agent intelligence” score. Percentages from different benchmarks use different
          tasks, denominators and protocols and are not additive. Per-benchmark ranks, percentiles and coverage counts are shown
          instead. Provenance is labelled on every cell: benchmark-official data is the strongest class, a vendor-reported score is
          marked as such, and independent reimplementations are kept as their own protocols.
        </p>
      </section>
    </section>
  );
}
