"use client";
import { useEffect, useRef } from "react";
import embed from "vega-embed";
import type { ParetoPoint } from "@/lib/pareto/types";

export interface ParetoScatterProps {
  points: ParetoPoint[];
  xLabel: string;
  yLabel: string;
}

export default function ParetoScatterVegaLite({ points, xLabel, yLabel }: ParetoScatterProps) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const spec = {
      $schema: "https://vega.github.io/schema/vega-lite/v6.json",
      description: `Pareto scatter: ${yLabel} vs ${xLabel}`,
      data: { values: points },
      transform: [{ calculate: "datum.onFrontier ? 'Frontier' : 'Dominated'", as: "status" }],
      layer: [
        {
          mark: { type: "line", orient: "horizontal" },
          transform: [{ filter: "datum.onFrontier" }, { sort: [{ field: "cost" }] }],
          encoding: { x: { field: "cost", type: "quantitative", scale: { type: "log" } }, y: { field: "quality", type: "quantitative" } },
        },
        {
          mark: { type: "point", size: 120, opacity: 0.85 },
          encoding: {
            x: { field: "cost", type: "quantitative", scale: { type: "log" }, title: xLabel },
            y: { field: "quality", type: "quantitative", title: yLabel },
            color: { field: "status", type: "nominal", scale: { domain: ["Frontier", "Dominated"], range: ["#2563eb", "#94a3b8"] }, legend: { title: null } },
            tooltip: [
              { field: "displayName", title: "Model" },
              { field: "organisation", title: "Creator" },
              { field: "cost", title: xLabel },
              { field: "quality", title: yLabel },
              { field: "arenaWebdevRatingLower", title: "WebDev CI lower" },
              { field: "arenaWebdevRatingUpper", title: "WebDev CI upper" },
              { field: "arenaAgentIpsLower", title: "Agent IPS CI lower" },
              { field: "arenaAgentIpsUpper", title: "Agent IPS CI upper" },
            ],
          },
        },
      ],
      width: "container",
      height: 360,
      background: "transparent",
    };
    const api = embed(ref.current, spec as never, { actions: false });
    return () => { api.then((v) => v.finalize()).catch(() => {}); };
  }, [points, xLabel, yLabel]);
  return <div ref={ref} style={{ width: "100%" }} aria-label={`Vega-Lite Pareto scatter: ${yLabel} vs ${xLabel}`} role="img" />;
}
