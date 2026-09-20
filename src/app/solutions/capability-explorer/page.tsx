import type { Metadata } from "next"
import Link from "next/link"

import { AdpiDashboard } from "@/components/adpi/dashboard"
import { AdpiFreshness } from "@/components/adpi/freshness"
import { capabilitiesOf, getCapabilityDataset } from "@/lib/adpi/registry"
import { reviewedGolden } from "@/lib/adpi/reviewed"
import { site } from "@/lib/site"

export const revalidate = 3600

export const metadata: Metadata = {
  title: "Ad Platform Capability Explorer",
  description:
    "Qualified planner answers for advertising-platform capabilities: supported / conditional / unknown, with structured conditions, evidence basis, evidence reference and a verification date — over a searchable master table of the published corpus.",
  alternates: { canonical: "/solutions/capability-explorer" },
  openGraph: {
    title: `Ad Platform Capability Explorer • ${site.name}`,
    description:
      "Can I do X on platform Y, in market Z, with this objective/control level, and under what conditions? A dated, qualified answer or an explicit abstention.",
    type: "website",
    url: `${site.siteUrl}/solutions/capability-explorer`,
  },
}

export default async function CapabilityExplorerPage() {
  const { dataset, source, degraded, note } = await getCapabilityDataset()
  const records = capabilitiesOf(dataset)
  const reviewed = reviewedGolden()

  return (
    <section className="space-y-8" data-analytics-section="capability_explorer" data-analytics-item-type="tool">
      <header className="max-w-3xl space-y-3">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Solutions · Martech &amp; Measurement
        </p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Ad Platform Capability Explorer
        </h1>
        <p className="text-lg leading-8 text-muted-foreground">
          A planner question gets a dated, qualified answer — supported, conditional or unknown —
          never a bare yes/no. Control, signal and automation stay distinct; unknown stays unknown.
        </p>
        <p className="text-sm leading-7 text-muted-foreground">
          The reviewed launch answers come from the human-reviewed Stage-1 slice
          ({reviewed.cases.length} cases, reviewed {reviewed.reviewed_at} by {reviewed.reviewed_by}).
          The master table below is the published corpus.
        </p>

        <details className="group rounded-xl border p-3 sm:p-4">
          <summary className="cursor-pointer text-sm font-medium">How to read an answer</summary>
          <div className="mt-3 space-y-2 text-sm leading-7 text-muted-foreground">
            <p>
              <strong>Supported</strong> is an unqualified yes and requires account observation;
              documentation alone establishes <strong>conditional</strong> (it exists, with
              conditions a given account may not meet) or leaves it <strong>unknown</strong>.
            </p>
            <p>
              <strong>Control</strong> means you set it; <strong>signal</strong> means the platform&rsquo;s
              optimisation uses it but you do not target it; <strong>automatic</strong> means the
              platform decides. These are different things and are never flattened.
            </p>
            <p>
              Empty scope means &ldquo;not evidenced&rdquo;, never &ldquo;unrestricted&rdquo;. A missing
              availability is shown as unknown, never defaulted to supported.
            </p>
          </div>
        </details>

        <p className="text-sm text-muted-foreground">
          {source === "durable" ? "Live published dataset" : "Bundled reviewed seed"} ·{" "}
          {records.length} capabilities · generated{" "}
          {new Date(dataset.generated_at).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
          .
        </p>

        {source === "durable" ? <AdpiFreshness dataset={dataset} /> : null}

        {degraded ? (
          <p className="rounded-lg border border-blue-500/40 bg-blue-500/5 px-3 py-2 text-sm text-blue-700 dark:text-blue-400">
            {note ?? "Showing the bundled reviewed seed."}
          </p>
        ) : null}

        {/* Honesty banner: the live feed predates the qualified fields for most
            records, so most rows show explicit unknown availability. */}
        <p className="rounded-lg border border-amber-500/40 bg-amber-500/5 px-3 py-2 text-sm text-amber-700 dark:text-amber-400">
          Availability and evidence basis are only asserted where the published corpus carries them;
          everywhere else the explorer shows <strong>unknown</strong> rather than inferring a value.
        </p>
      </header>

      <AdpiDashboard records={records} source={source} />

      <section aria-label="Methodology" className="max-w-3xl space-y-2 text-sm leading-7 text-muted-foreground">
        <h2 className="text-lg font-medium text-foreground">Where the data comes from</h2>
        <p>
          Capabilities are extracted from official vendor documentation by a provenance-first
          pipeline: raw and cleaned snapshots are hashed and kept privately, and the public dataset
          carries normalised facts plus a source id, an evidence pointer and a verification date —
          never the vendor&rsquo;s prose.
        </p>
        <p>
          A capability is a qualified fact, not a boolean. A missing field is a real state
          (&ldquo;not evidenced&rdquo;), so the explorer never renders a default that could be read as
          an assurance. See the{" "}
          <Link className="underline underline-offset-4" href="/solutions/pareto-frontier">
            LLM Pareto Frontier
          </Link>{" "}
          and{" "}
          <Link className="underline underline-offset-4" href="/solutions/agent-benchmark-matrix">
            Agent Benchmark Matrix
          </Link>{" "}
          for the same provenance-first approach elsewhere.
        </p>
      </section>
    </section>
  )
}
