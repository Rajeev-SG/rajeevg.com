import type { Metadata } from "next"

import { MasterTable } from "@/components/adpi/master-table"
import { Planner } from "@/components/adpi/planner"
import { getAdpiDataset } from "@/lib/adpi/dataset"
import { site } from "@/lib/site"

export const revalidate = 3600

export const metadata: Metadata = {
  title: "Ad Platform Capability Explorer",
  description:
    "Qualified answers to ad-platform planning questions: is a capability available, is it control, signal or automation, on what evidence, and as of when. With a searchable master capability table.",
  alternates: { canonical: "/solutions/ad-platform-explorer" },
  openGraph: {
    title: `Ad Platform Capability Explorer • ${site.name}`,
    description: "Qualified ad-platform capability answers with evidence basis and verification date.",
    type: "website",
  },
}

export default async function AdPlatformExplorerPage() {
  const { dataset, live, questions } = await getAdpiDataset()
  const reviewed = dataset.provenance?.kind === "reviewed_launch_slice"

  return (
    <section className="space-y-12" data-analytics-section="ad_platform_explorer" data-analytics-item-type="tool">
      <header className="max-w-3xl space-y-4">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Solutions · Martech
        </p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Ad Platform Capability Explorer
        </h1>
        <p className="text-lg leading-8 text-muted-foreground">
          Can I do X on platform Y, and under what conditions? Each answer is qualified: what type
          of control it is, the evidence basis, the conditions that must hold, and the date it was
          verified. Documentation alone never produces an unqualified “yes”.
        </p>
        <p className="text-sm leading-7 text-muted-foreground">
          {live
            ? "Live current-state dataset from the public adpi-data feed."
            : "Live feed unavailable; showing the reviewed launch snapshot."}{" "}
          Generated {new Date(dataset.generated_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}.
          {reviewed
            ? " Launch answers are from the reviewed golden slice (#61 Stage 1)."
            : null}
        </p>
      </header>

      <Planner capabilities={dataset.capabilities} questions={questions} />

      <section className="space-y-4" data-analytics-section="adpi_table">
        <header className="max-w-3xl space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight">Master capability table</h2>
          <p className="text-muted-foreground">
            Every capability in the current-state dataset, with its behaviour, evidence basis and
            availability. Sort and filter in the browser.
          </p>
        </header>
        <MasterTable capabilities={dataset.capabilities} />
      </section>

      <section className="max-w-3xl space-y-3 rounded-xl border bg-muted/30 p-5 text-sm leading-7 text-muted-foreground">
        <h2 className="text-base font-semibold text-foreground">How to read this</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong className="text-foreground">Evidence basis is load-bearing.</strong> “Documented”
            means a vendor help page states it. It does not mean it is available in your account.
            Only an account observation can produce an unqualified “yes”.
          </li>
          <li>
            <strong className="text-foreground">Behaviour is control, signal or automation</strong> —
            not a boolean. A hard target, an optimisation input, and an automatic placement are
            different things and are shown as such.
          </li>
          <li>
            <strong className="text-foreground">Vendors are not treated as equivalent.</strong> The
            comparison view shows each platform in its own terms and flags when concepts differ.
          </li>
          <li>
            <strong className="text-foreground">Publication time is not evidence freshness.</strong>{" "}
            Each record carries its own verification date; use that, not the page’s generation date.
          </li>
        </ul>
      </section>
    </section>
  )
}
