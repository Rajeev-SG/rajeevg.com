"use client";
import { useEffect, useRef } from "react";
import * as Plot from "@observablehq/plot";
import type { ParetoPoint } from "@/lib/pareto/types";

export interface ParetoScatterProps {
  points: ParetoPoint[];
  xLabel: string;
  yLabel: string;
}

export default function ParetoScatterObservablePlot({ points, xLabel, yLabel }: ParetoScatterProps) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const frontier = points.filter((p) => p.onFrontier).sort((a, b) => (a.cost ?? 0) - (b.cost ?? 0));
    const chart = Plot.plot({
      x: { type: "log", label: xLabel, tickFormat: (d: number) => (d >= 1 ? `$${d}` : `$${d.toFixed(2)}`) },
      y: { label: yLabel },
      marks: [
        Plot.ruleY([0]),
        Plot.line(frontier, { x: "cost", y: "quality", stroke: "#2563eb", strokeWidth: 2 }),
        Plot.dot(points, {
          x: "cost",
          y: "quality",
          fill: (d) => (d.onFrontier ? "#2563eb" : "#94a3b8"),
          title: (d) => `${d.displayName}\n${d.organisation}\n${xLabel}: ${d.cost}\n${yLabel}: ${d.quality}`,
        }),
        Plot.text(frontier, { x: "cost", y: "quality", text: "displayName", dy: -12, fontSize: 9 }),
      ],
      width: ref.current.clientWidth,
      height: 380,
      style: { background: "transparent", color: "currentColor" },
    });
    ref.current.appendChild(chart);
    return () => { chart.remove(); };
  }, [points, xLabel, yLabel]);
  return <div ref={ref} style={{ width: "100%" }} aria-label={`Observable Plot Pareto scatter: ${yLabel} vs ${xLabel}`} role="img" />;
}
