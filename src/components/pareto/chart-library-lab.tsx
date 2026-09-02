"use client";
import dynamic from "next/dynamic";
import { useState } from "react";
import type { ParetoPoint } from "@/lib/pareto/types";

const ParetoScatterECharts = dynamic(() => import("./pareto-scatter-echarts"), { ssr: false, loading: () => <ChartSkeleton library="ECharts" /> });
const ParetoScatterVegaLite = dynamic(() => import("./pareto-scatter-vega-lite"), { ssr: false, loading: () => <ChartSkeleton library="Vega-Lite" /> });
const ParetoScatterObservablePlot = dynamic(() => import("./pareto-scatter-observable-plot"), { ssr: false, loading: () => <ChartSkeleton library="Observable Plot" /> });
const ParetoScatterPlotly = dynamic(() => import("./pareto-scatter-plotly"), { ssr: false, loading: () => <ChartSkeleton library="Plotly.js" /> });

function ChartSkeleton({ library }: { library: string }) {
  return <div className="flex h-[420px] items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">Loading {library}…</div>;
}

export interface ChartLibraryLabProps {
  points: ParetoPoint[];
  xLabel: string;
  yLabel: string;
  bundleSizes: Record<string, string>;
}

const LIBRARIES = [
  { key: "echarts", label: "Apache ECharts", Component: ParetoScatterECharts, version: "6.1.0" },
  { key: "vega-lite", label: "Vega-Lite", Component: ParetoScatterVegaLite, version: "6.4.3 (+ vega 6.4.0, vega-embed 7.2.0)" },
  { key: "observable-plot", label: "Observable Plot", Component: ParetoScatterObservablePlot, version: "0.6.17" },
  { key: "plotly", label: "Plotly.js", Component: ParetoScatterPlotly, version: "4.0.0" },
] as const;

export function ChartLibraryLab({ points, xLabel, yLabel, bundleSizes }: ChartLibraryLabProps) {
  const [view, setView] = useState<"tabs" | "all">("tabs");
  const [active, setActive] = useState<(typeof LIBRARIES)[number]["key"]>("echarts");

  return (
    <section className="space-y-4" aria-label="Chart Library Lab">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Chart Library Lab</h2>
          <p className="text-sm text-muted-foreground">
            The same filtered Pareto scatter rendered by four OSS libraries for apples-to-apples comparison.
          </p>
        </div>
        <div className="flex gap-1 rounded-lg border p-1" role="tablist" aria-label="Lab view mode">
          <button onClick={() => setView("tabs")} aria-selected={view === "tabs"} role="tab" className={`rounded px-3 py-1 text-sm ${view === "tabs" ? "bg-primary text-primary-foreground" : ""}`}>Tabs</button>
          <button onClick={() => setView("all")} aria-selected={view === "all"} role="tab" className={`rounded px-3 py-1 text-sm ${view === "all" ? "bg-primary text-primary-foreground" : ""}`}>Compare all</button>
        </div>
      </div>

      {view === "tabs" ? (
        <div className="flex flex-wrap gap-1" role="tablist" aria-label="Chart library">
          {LIBRARIES.map(({ key, label }) => (
            <button key={key} role="tab" aria-selected={active === key} onClick={() => setActive(key)}
              className={`rounded-lg border px-3 py-1.5 text-sm ${active === key ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
              {label}
            </button>
          ))}
        </div>
      ) : null}

      <div className="space-y-8">
        {LIBRARIES.map(({ key, label, Component, version }) => {
          const show = view === "all" || active === key;
          if (!show) return null;
          return (
            <div key={key} className="space-y-2 rounded-xl border p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-lg font-medium">{label}</h3>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="rounded-full border px-2 py-0.5">v{version}</span>
                  <span className="rounded-full border px-2 py-0.5">lazy chunk: {bundleSizes[key] ?? "measured at build"}</span>
                </div>
              </div>
              <Component points={points} xLabel={xLabel} yLabel={yLabel} />
              <p className="text-xs text-muted-foreground">Rendered by {label}.</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
