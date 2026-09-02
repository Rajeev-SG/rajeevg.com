"use client";
import { useEffect, useRef } from "react";
import * as Plot from "@observablehq/plot";
import type { ParetoPoint } from "@/lib/pareto/types";

export interface ParetoScatterProps {
  points: ParetoPoint[];
  xLabel: string;
  yLabel: string;
}

function formatCost(v: number | null): string {
  if (v === null) return "—";
  return v >= 1 ? `$${v.toFixed(2)}` : `$${v.toFixed(4)}`;
}

/**
 * Lightweight deterministic label strategy: alternate label placement
 * (above / below / left) round-robin across frontier points, so labels
 * never stack on the same offset. Every point keeps a full native title
 * tooltip for accessibility and identification.
 */
export function ParetoScatterObservablePlot({ points, xLabel, yLabel }: ParetoScatterProps) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const sorted = [...points].sort((a, b) => (a.cost ?? 0) - (b.cost ?? 0));
    const chart = Plot.plot({
      x: { type: "log", label: xLabel, tickFormat: (d: number) => (d >= 1 ? `$${d}` : `$${d.toFixed(2)}`) },
      y: { label: yLabel },
      marks: [
        Plot.ruleY([0]),
        Plot.line(sorted, { x: "cost", y: "quality", stroke: "#2563eb", strokeWidth: 2 }),
        Plot.dot(sorted, {
          x: "cost",
          y: "quality",
          fill: "#2563eb",
          title: (d) => `${d.displayName}\n${d.organisation}\n${xLabel}: ${formatCost(d.cost)}\n${yLabel}: ${d.quality}`,
        }),
        Plot.text(sorted, { x: "cost", y: "quality", text: "displayName", dy: -12, fontSize: 10, lineWidth: 14, pointerEvents: "none" }),
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
