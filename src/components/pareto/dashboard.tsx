"use client";
import { useMemo, useState } from "react";
import type { ParetoSnapshot } from "@/lib/pareto/types";
import { computePareto } from "@/lib/pareto/pareto";
import { FilterBar, FilterState } from "./filter-bar";
import { ParetoScatterObservablePlot } from "./pareto-scatter-observable-plot";
import { ModelTable } from "./model-table";

export interface DashboardProps {
  snapshot: ParetoSnapshot;
}

const QUALITY_LABEL: Record<string, string> = {
  aa_intelligence: "AA Intelligence Index",
  aa_coding: "AA Coding Index",
  aa_agentic: "AA Agentic Index",
  arena_webdev_rating: "Arena WebDev (Bradley-Terry)",
  arena_agent_ips: "Arena Agent (IPS)",
};

const COST_LABEL: Record<string, string> = {
  aa_cost_per_task: "AA cost per task ($)",
  or_input_per_million: "OpenRouter input $/1M tokens",
  or_output_per_million: "OpenRouter output $/1M tokens",
  or_blended_per_million: "OpenRouter blended $/1M tokens",
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }); }
  catch { return iso; }
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = { ok: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400", stale: "bg-amber-500/10 text-amber-700 dark:text-amber-400", error: "bg-red-500/10 text-red-700 dark:text-red-400", pending: "bg-muted text-muted-foreground" };
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${map[status] ?? ""}`}>{status}</span>;
}

export function ParetoDashboard({ snapshot }: DashboardProps) {
  const [filters, setFilters] = useState<FilterState>({
    mode: "general",
    quality: "aa_intelligence",
    cost: "aa_cost_per_task",
    inputShare: 0.8,
    outputShare: 0.2,
    onlyOpenRouter: false,
    search: "",
  });

  // Memoised pure client computation over the compact server payload.
  const frontierPoints = useMemo(() => {
    let models = snapshot.models;
    if (filters.onlyOpenRouter) models = models.filter((m) => m.openrouter !== null);
    if (filters.search.trim()) {
      const q = filters.search.trim().toLowerCase();
      models = models.filter((m) => m.displayName.toLowerCase().includes(q) || m.organisation.toLowerCase().includes(q));
    }
    const pareto = computePareto(models, filters.quality, filters.cost, filters.inputShare, filters.outputShare);
    // Only Pareto-efficient models render in graph and table.
    return pareto.points.filter((p) => p.onFrontier);
  }, [snapshot, filters]);

  const freshness = snapshot.freshness;
  const xLabel = COST_LABEL[filters.cost];
  const yLabel = QUALITY_LABEL[filters.quality];

  return (
    <div className="space-y-8">
      <section aria-label="Source freshness" className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border p-3">
          <div className="flex items-center justify-between"><span className="text-sm font-medium">Artificial Analysis</span><StatusBadge status={freshness.aaStatus} /></div>
          <p className="mt-1 text-xs text-muted-foreground">Fetched {formatDate(freshness.aaFetchedAt)}</p>
        </div>
        <div className="rounded-xl border p-3">
          <div className="flex items-center justify-between"><span className="text-sm font-medium">OpenRouter</span><StatusBadge status={freshness.openrouterStatus} /></div>
          <p className="mt-1 text-xs text-muted-foreground">Fetched {formatDate(freshness.openrouterFetchedAt)}</p>
        </div>
        <div className="rounded-xl border p-3">
          <div className="flex items-center justify-between"><span className="text-sm font-medium">LM Arena dataset</span><StatusBadge status={freshness.arenaStatus} /></div>
          <p className="mt-1 text-xs text-muted-foreground">Published {formatDate(freshness.arenaPublishedAt)} · fetched {formatDate(freshness.arenaFetchedAt)}</p>
        </div>
      </section>

      <FilterBar state={filters} onChange={setFilters} />

      {frontierPoints.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
          No models match the current filter combination. Loosen filters or wait for a source to populate.
        </div>
      ) : (
        <>
          <ParetoScatterObservablePlot points={frontierPoints} xLabel={xLabel} yLabel={yLabel} />
          <section aria-label="Model table" className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight">Model table</h2>
            <ModelTable points={frontierPoints} xLabel={xLabel} yLabel={yLabel} />
          </section>
        </>
      )}

      <section aria-label="Methodology" className="space-y-2 text-sm text-muted-foreground">
        <h2 className="text-lg font-medium text-foreground">Methodology</h2>
        <p>Pareto dominance: model A dominates B iff Q(A) ≥ Q(B) and C(A) ≤ C(B) and at least one inequality is strict. Models missing the selected metric are excluded from that frontier. The graph and table show only the currently selected Pareto-efficient models.</p>
        <p>Blended OpenRouter cost = inputShare × input $/1M + outputShare × output $/1M (visible and editable above when selected).</p>
        <p>Arena WebDev uses Bradley-Terry Arena Scores (rating ± bounds, vote counts). Arena Agent uses IPS scores (score ± CI, observation and session counts). These methodologies are kept semantically separate and are never merged into a single &quot;Elo&quot;.</p>
      </section>
    </div>
  );
}
