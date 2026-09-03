"use client";
import { useEffect, useRef } from "react";
import * as Plot from "@observablehq/plot";
import type { ParetoPoint } from "@/lib/pareto/types";
import { computeLabelPlacements } from "@/lib/pareto/label-layout";

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
    const width = ref.current.clientWidth || 640;
    // Deterministic collision-avoidance: estimate label spans in normalised
    // x and assign overlapping close-y labels to alternating vertical lanes.
    const yMin = Math.min(...sorted.map((d) => d.quality ?? 0));
    const yMax = Math.max(...sorted.map((d) => d.quality ?? 1));
    const ySpan = Math.max(yMax - yMin, 1e-9);
    const xMin = Math.min(...sorted.map((d) => d.cost ?? 0));
    const xMax = Math.max(...sorted.map((d) => d.cost ?? 1));
    const xSpan = Math.max(xMax - xMin, 1e-9);
    const placements = computeLabelPlacements(
      sorted.map((d, i) => ({
        index: i,
        label: d.displayName,
        x01: ((d.cost ?? 0) - xMin) / xSpan,
        y01: 1 - ((d.quality ?? 0) - yMin) / ySpan, // top=0 pixel orientation
      })),
      width
    );
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
        // Deterministic per-lane label marks: each lane's constant dy is safe
        // for Plot's typed constant offset while keeping point association.
        ...Array.from(new Set(placements.map((p) => p.lane))).map((lane) => {
          const laneDy = placements.find((pl) => pl.lane === lane)!.dy;
          const laneData = sorted.filter((_, i) => placements[i]?.lane === lane);
          return Plot.text(laneData, {
            x: "cost",
            y: "quality",
            text: "displayName",
            dy: laneDy,
            fontSize: 10,
            lineWidth: 16,
            pointerEvents: "none",
          });
        }),
      ],
      width,
      height: 380,
      style: { background: "transparent", color: "currentColor" },
    });
    ref.current.appendChild(chart);
    return () => { chart.remove(); };
  }, [points, xLabel, yLabel]);
  return <div ref={ref} style={{ width: "100%" }} aria-label={`Observable Plot Pareto scatter: ${yLabel} vs ${xLabel}`} role="img" />;
}
