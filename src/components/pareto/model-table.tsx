"use client";
import { useMemo, useState } from "react";
import type { ParetoPoint } from "@/lib/pareto/types";

export interface ModelTableProps {
  points: ParetoPoint[];
  xLabel: string;
  yLabel: string;
}

type SortKey = "displayName" | "quality" | "cost" | "organisation";
type SortDir = "asc" | "desc";

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
      <table className="w-full min-w-[720px] text-sm">
        <thead className="bg-muted/50">
          <tr>
            {header("displayName", "Model")}
            {header("organisation", "Creator")}
            {header("quality", yLabel)}
            {header("cost", xLabel)}
            <th scope="col" className="px-3 py-2 text-left font-medium">Frontier</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((p) => (
            <tr key={p.canonicalId} className="border-t">
              <td className="px-3 py-2 font-medium">{p.displayName}</td>
              <td className="px-3 py-2 text-muted-foreground">{p.organisation}</td>
              <td className="px-3 py-2 tabular-nums">{p.quality ?? "—"}</td>
              <td className="px-3 py-2 tabular-nums">{p.cost !== null ? (p.cost >= 1 ? `$${p.cost.toFixed(2)}` : `$${p.cost.toFixed(4)}`) : "—"}</td>
              <td className="px-3 py-2">{p.onFrontier ? <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">On frontier</span> : <span className="text-xs text-muted-foreground">Dominated</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
