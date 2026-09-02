import type { Metadata } from "next";
import { ParetoDashboard } from "@/components/pareto/dashboard";
import { getParetoSnapshot } from "@/lib/pareto/aggregate";
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

// Measured from the production build's lazy client chunks (gzip size, Next 15.4.10 webpack).
const BUNDLE_SIZES: Record<string, string> = {
  echarts: "189K gzip",
  "vega-lite": "170K gzip",
  "observable-plot": "37K gzip",
  plotly: "1197K gzip",
};

export default async function ParetoFrontierPage() {
  const { snapshot, errors } = await getParetoSnapshot();
  return (
    <section className="space-y-8" data-analytics-section="pareto_frontier" data-analytics-item-type="tool">
      <header className="max-w-3xl space-y-3">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">Solutions · Analytics</p>
        <h1 className="text-4xl font-semibold tracking-tight">LLM Pareto Frontier</h1>
        <p className="text-lg leading-8 text-muted-foreground">
          Deterministic quality-vs-cost frontier for major LLMs, built from official structured data:
          Artificial Analysis v2, OpenRouter, and LM Arena&apos;s published Hugging Face dataset. No scraping, no fuzzy matching.
        </p>
        {errors.length > 0 ? (
          <p className="rounded-lg border border-amber-500/40 bg-amber-500/5 px-3 py-2 text-sm text-amber-700 dark:text-amber-400">
            One or more sources degraded; showing last-known data. {errors.join(" · ")}
          </p>
        ) : null}
      </header>
      <ParetoDashboard snapshot={snapshot} bundleSizes={BUNDLE_SIZES} />
    </section>
  );
}
