"use client";
import { useEffect, useRef } from "react";
import * as echarts from "echarts/core";
import { ScatterChart, LineChart } from "echarts/charts";
import { GridComponent, TooltipComponent, DataZoomComponent, TitleComponent } from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import type { ParetoPoint } from "@/lib/pareto/types";

echarts.use([ScatterChart, LineChart, GridComponent, TooltipComponent, DataZoomComponent, TitleComponent, CanvasRenderer]);

export interface ParetoScatterProps {
  points: ParetoPoint[];
  xLabel: string;
  yLabel: string;
}

function buildOptions(points: ParetoPoint[], xLabel: string, yLabel: string) {
  const frontier = points.filter((p) => p.onFrontier).sort((a, b) => (a.cost ?? 0) - (b.cost ?? 0));
  return {
    backgroundColor: "transparent",
    grid: { left: 70, right: 30, top: 30, bottom: 60 },
    tooltip: {
      trigger: "item",
      formatter: (params: { data?: { name: string; value: number[] } }) => {
        const d = params.data;
        if (!d) return "";
        return `<strong>${d.name}</strong><br/>${xLabel}: ${d.value[0]}<br/>${yLabel}: ${d.value[1]}`;
      },
    },
    xAxis: { type: "log", name: xLabel, nameLocation: "middle", nameGap: 30, axisLabel: { formatter: (v: number) => (v >= 1 ? `$${v}` : `$${v.toFixed(2)}`) } },
    yAxis: { type: "value", name: yLabel },
    dataZoom: [{ type: "inside" }, { type: "slider" }],
    series: [
      {
        name: "Pareto frontier",
        type: "line",
        data: frontier.map((p) => [p.cost, p.quality]),
        lineStyle: { color: "#2563eb", width: 2 },
        symbol: "none",
        silent: true,
      },
      {
        name: "Models",
        type: "scatter",
        data: points.map((p) => ({
          name: p.displayName,
          value: [p.cost, p.quality],
          itemStyle: { color: p.onFrontier ? "#2563eb" : "#94a3b8" },
        })),
        symbolSize: 12,
      },
    ],
  };
}

export default function ParetoScatterECharts({ points, xLabel, yLabel }: ParetoScatterProps) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const chart = echarts.init(ref.current);
    chart.setOption(buildOptions(points, xLabel, yLabel));
    const onResize = () => chart.resize();
    window.addEventListener("resize", onResize);
    return () => { window.removeEventListener("resize", onResize); chart.dispose(); };
  }, [points, xLabel, yLabel]);
  return <div ref={ref} style={{ width: "100%", height: 420 }} aria-label={`ECharts Pareto scatter: ${yLabel} vs ${xLabel}`} role="img" />;
}
