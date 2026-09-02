"use client";
import { useMemo, useState } from "react";
import type { ParetoPoint } from "@/lib/pareto/types";
import { creatorHomepageUrl, artificialAnalysisModelUrl, openRouterModelUrl } from "@/lib/pareto/links";

export interface ModelTableProps {
  points: ParetoPoint[];
  xLabel: string;
  yLabel: string;
}

type SortKey = "displayName" | "quality" | "cost" | "organisation" | "orInputPerMillion" | "orOutputPerMillion";
type SortDir = "asc" | "desc";

function fmtMoney(v: number | null): string {
  return v !== null ? (v >= 1 ? `$${v.toFixed(2)}` : `$${v.toFixed(4)}`) : "—";
}

export function ModelTable({ points, xLabel, yLabel }: ModelTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("quality");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const sorted = useMemo(() => {
    const copy = [...points];
    copy.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "displayName") cmp = a.displayName.localeCompare(b.displayName);
      else if (sortKey === "organisation") cmp = a.organisation.localeCompare(b.organisation);
      else cmp = (a[sortKey] ?? -Infinity) - (b[sortKey] ?? -Infinity);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [points, sortKey, sortDir]);

  function header(key: SortKey, label: string) {
    const active = sortKey === key;
    return (
      <th scope="col" className="px-3 py-2 text-left font-medium">
        <button onClick={() => { setSortKey(key); setSortDir(active && sortDir === "asc" ? "desc" : "asc"); }}
          className="inline-flex items-center gap-1 hover:underline" aria-label={`Sort by ${label}`}>
          {label}{active ? <span aria-hidden>{sortDir === "asc" ? "▲" : "▼"}</span> : null}
        </button>
      </th>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border" role="region" aria-label="Model data table">
      <table className="w-full min-w-[880px] text-sm">
        <thead className="bg-muted/50">
          <tr>
            {header("displayName", "Model")}
            {header("organisation", "Creator")}
            {header("quality", yLabel)}
            {header("cost", xLabel)}
            {header("orInputPerMillion", "OR input $/1M")}
            {header("orOutputPerMillion", "OR output $/1M")}
            <th scope="col" className="px-3 py-2 text-left font-medium">Links</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((p) => {
            const orUrl = openRouterModelUrl(p.openrouterModelId);
            const aaUrl = artificialAnalysisModelUrl(p.aaSlug);
            const homeUrl = creatorHomepageUrl(p.organisation);
            return (
              <tr key={p.canonicalId} className="border-t">
                <td className="px-3 py-2 font-medium">{p.displayName}</td>
                <td className="px-3 py-2 text-muted-foreground">{p.organisation}</td>
                <td className="px-3 py-2 tabular-nums">{p.quality ?? "—"}</td>
                <td className="px-3 py-2 tabular-nums">{fmtMoney(p.cost)}</td>
                <td className="px-3 py-2 tabular-nums">{fmtMoney(p.orInputPerMillion)}</td>
                <td className="px-3 py-2 tabular-nums">{fmtMoney(p.orOutputPerMillion)}</td>
                <td className="px-3 py-2 whitespace-nowrap text-xs">
                  {orUrl ? <a className="underline" href={orUrl} target="_blank" rel="noopener noreferrer">OpenRouter</a> : null}
                  {aaUrl ? <a className="ml-2 underline" href={aaUrl} target="_blank" rel="noopener noreferrer">AA</a> : null}
                  {homeUrl ? <a className="ml-2 underline" href={homeUrl} target="_blank" rel="noopener noreferrer">Lab</a> : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
