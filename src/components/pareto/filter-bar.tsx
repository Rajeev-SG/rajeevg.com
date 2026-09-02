"use client";
import { Mode, QualityMetric, CostMetric } from "@/lib/pareto/types";

export interface FilterState {
  mode: Mode;
  quality: QualityMetric;
  cost: CostMetric;
  inputShare: number;
  outputShare: number;
  onlyOpenRouter: boolean;
  search: string;
}

export const MODE_QUALITY: Record<Mode, { value: QualityMetric; label: string }[]> = {
  general: [{ value: "aa_intelligence", label: "AA Intelligence" }],
  coding: [
    { value: "aa_coding", label: "AA Coding" },
    { value: "arena_webdev_rating", label: "Arena WebDev (BT)" },
  ],
  agentic: [
    { value: "aa_agentic", label: "AA Agentic" },
    { value: "arena_agent_ips", label: "Arena Agent (IPS)" },
  ],
};

const COST_OPTIONS: { value: CostMetric; label: string }[] = [
  { value: "aa_cost_per_task", label: "AA $/task" },
  { value: "or_input_per_million", label: "OR input $/1M" },
  { value: "or_output_per_million", label: "OR output $/1M" },
  { value: "or_blended_per_million", label: "OR blended $/1M" },
];

export function FilterBar({ state, onChange }: { state: FilterState; onChange: (next: FilterState) => void }) {
  const patch = (p: Partial<FilterState>) => onChange({ ...state, ...p });
  return (
    <div className="flex flex-wrap items-end gap-4 rounded-xl border p-4" role="group" aria-label="Dashboard filters">
      <fieldset className="space-y-1">
        <legend className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Mode</legend>
        <div className="flex gap-1">
          {(["general", "coding", "agentic"] as Mode[]).map((m) => (
            <button key={m} aria-pressed={state.mode === m} onClick={() => {
              const first = MODE_QUALITY[m][0].value;
              patch({ mode: m, quality: first });
            }} className={`rounded-lg border px-3 py-1.5 text-sm capitalize ${state.mode === m ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
              {m}
            </button>
          ))}
        </div>
      </fieldset>

      <label className="space-y-1 text-sm">
        <span className="block text-xs font-medium uppercase tracking-wide text-muted-foreground">Quality</span>
        <select value={state.quality} onChange={(e) => patch({ quality: e.target.value as QualityMetric })} className="rounded-lg border bg-background px-3 py-1.5">
          {MODE_QUALITY[state.mode].map((q) => <option key={q.value} value={q.value}>{q.label}</option>)}
        </select>
      </label>

      <label className="space-y-1 text-sm">
        <span className="block text-xs font-medium uppercase tracking-wide text-muted-foreground">Cost</span>
        <select value={state.cost} onChange={(e) => patch({ cost: e.target.value as CostMetric })} className="rounded-lg border bg-background px-3 py-1.5">
          {COST_OPTIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </label>

      {state.cost === "or_blended_per_million" ? (
        <fieldset className="space-y-1">
          <legend className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Token mix — blended = inputShare × input$/M + outputShare × output$/M
          </legend>
          <div className="flex items-center gap-2 text-sm">
            <input type="range" min={0} max={100} value={Math.round(state.inputShare * 100)}
              onChange={(e) => { const v = Number(e.target.value); patch({ inputShare: v / 100, outputShare: 1 - v / 100 }); }}
              className="w-44" aria-label="Input token share percent" />
            <span className="tabular-nums text-muted-foreground">{Math.round(state.inputShare * 100)}% in / {Math.round(state.outputShare * 100)}% out</span>
          </div>
        </fieldset>
      ) : null}

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={state.onlyOpenRouter} onChange={(e) => patch({ onlyOpenRouter: e.target.checked })} className="accent-primary" />
        Only on OpenRouter
      </label>
      <label className="space-y-1 text-sm">
        <span className="block text-xs font-medium uppercase tracking-wide text-muted-foreground">Search</span>
        <input type="search" value={state.search} onChange={(e) => patch({ search: e.target.value })} placeholder="Model or lab…" className="rounded-lg border bg-background px-3 py-1.5" />
      </label>
    </div>
  );
}
