"use client";
import { useEffect, useRef } from "react";
import Plotly from "plotly.js-dist-min";
import type { ParetoPoint } from "@/lib/pareto/types";

export interface ParetoScatterProps {
  points: ParetoPoint[];
  xLabel: string;
  yLabel: string;
}

export default function ParetoScatterPlotly({ points, xLabel, yLabel }: ParetoScatterProps) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const frontier = points.filter((p) => p.onFrontier).sort((a, b) => (a.cost ?? 0) - (b.cost ?? 0));
    const data = [
      {
        x: frontier.map((p) => p.cost),
        y: frontier.map((p) => p.quality),
        mode: "lines",
        type: "scatter",
        name: "Pareto frontier",
        line: { color: "#2563eb", width: 2 },
        hoverinfo: "skip",
      },
      {
        x: points.map((p) => p.cost),
        y: points.map((p) => p.quality),
        mode: "markers",
        type: "scatter",
        text: points.map((p) => p.displayName),
        customdata: points.map((p) => [p.organisation, p.aaIntelligence, p.orInputPerMillion, p.orOutputPerMillion]),
        marker: { color: points.map((p) => (p.onFrontier ? "#2563eb" : "#94a3b8")), size: 11 },
        hovertemplate: "<b>%{text}</b><br>%{xaxis.title.text}: %{x}<br>%{yaxis.title.text}: %{y}<extra></extra>",
      },
    ];
    const layout = {
      xaxis: { type: "log", title: { text: xLabel } },
      yaxis: { title: { text: yLabel } },
      paper_bgcolor: "rgba(0,0,0,0)",
      plot_bgcolor: "rgba(0,0,0,0)",
      margin: { l: 70, r: 30, t: 20, b: 60 },
      showlegend: false,
    };
    Plotly.newPlot(el, data as never, layout as never, { responsive: true, displayModeBar: false });
    return () => { Plotly.purge(el); };
  }, [points, xLabel, yLabel]);
  return <div ref={ref} style={{ width: "100%", height: 400 }} aria-label={`Plotly Pareto scatter: ${yLabel} vs ${xLabel}`} role="img" />;
}
