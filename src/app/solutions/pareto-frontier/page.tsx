import type { Metadata } from "next";
import { ParetoDashboard } from "@/components/pareto/dashboard";
import { getParetoSnapshot } from "@/lib/pareto/aggregate";
import { aaFallback, countAaQuality } from "@/lib/pareto/aa-fallback";
import type { ParetoSnapshot } from "@/lib/pareto/types";
import { site } from "@/lib/site";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "LLM Pareto Frontier",
  description: "Deterministic Pareto frontier of major LLMs across quality and cost, using live data from Artificial Analysis, OpenRouter, and LM Arena's official dataset.",
  alternates: { canonical: "/solutions/pareto-frontier" },
  openGraph: {
    title: `LLM Pareto Frontier • ${site.name}`,
    description: "Current Pareto frontier of major LLMs using official structured data.",
    type: "website",
  },
};

export default async function ParetoFrontierPage() {
  const { snapshot, errors } = await getParetoSnapshot();

  // Non-empty render guarantee: if the live snapshot has no AA-scored models,
  // render the bundled last-known-good AA snapshot instead of an empty dashboard.
  const liveAaQuality = countAaQuality(snapshot.models);
  const aaFallbackSnapshot: ParetoSnapshot = { generatedAt: aaFallback.generatedAt, freshness: aaFallback.freshness, models: aaFallback.models, unmatched: [] };
  const effectiveSnapshot: ParetoSnapshot = liveAaQuality > 0 ? snapshot : aaFallbackSnapshot;
  const aaDegraded = liveAaQuality === 0;
  return (
    <section className="space-y-8" data-analytics-section="pareto_frontier" data-analytics-item-type="tool">
      <header className="max-w-3xl space-y-3">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">Solutions · Analytics</p>
        <h1 className="text-4xl font-semibold tracking-tight">LLM Pareto Frontier</h1>
        <p className="text-lg leading-8 text-muted-foreground">
          Deterministic quality-vs-cost frontier for major LLMs, built from official structured data:
          Artificial Analysis v2, OpenRouter, and LM Arena&apos;s published Hugging Face dataset. No scraping, no fuzzy matching.
        </p>
        {aaDegraded ? (
          <p className="rounded-lg border border-blue-500/40 bg-blue-500/5 px-3 py-2 text-sm text-blue-700 dark:text-blue-400">
            Live Artificial Analysis data temporarily unavailable; showing bundled last-known-good AA snapshot
            captured {new Date(aaFallback.provenance.fetchedAt).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
            . {errors.length > 0 ? `${errors.join(" · ")}` : null}
          </p>
        ) : null}
        {errors.length > 0 && !aaDegraded ? (
          <p className="rounded-lg border border-amber-500/40 bg-amber-500/5 px-3 py-2 text-sm text-amber-700 dark:text-amber-400">
            One or more sources degraded; showing last-known data. {errors.join(" · ")}
          </p>
        ) : null}
      </header>
      <ParetoDashboard snapshot={effectiveSnapshot} />
    </section>
  );
}
