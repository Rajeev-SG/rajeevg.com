"use client";

export type ViewMode = "model" | "system";
export type Comparability = "strict" | "all";
export type EvidenceFilter = "official" | "official_vendor" | "all";

export interface FilterState {
  view: ViewMode;
  comparability: Comparability;
  category: string;
  organisation: string;
  harness: string;
  evidence: EvidenceFilter;
  trackedOnly: boolean;
  includeP1: boolean;
  search: string;
}

export const DEFAULT_FILTERS: FilterState = {
  view: "model",
  comparability: "all",
  category: "all",
  organisation: "all",
  harness: "all",
  evidence: "all",
  trackedOnly: true,
  includeP1: false,
  search: "",
};

const TRACKED_FAMILIES = ["GPT", "GLM", "DeepSeek", "Kimi", "Qwen"];

export function isTrackedFamily(family: string): boolean {
  return TRACKED_FAMILIES.some((tracked) => family.toLowerCase().includes(tracked.toLowerCase()));
}

function Segmented<T extends string>({
  legend, value, options, onChange,
}: { legend: string; value: T; options: { value: T; label: string; hint?: string }[]; onChange: (v: T) => void }) {
  return (
    <fieldset className="space-y-1">
      <legend className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{legend}</legend>
      <div className="flex flex-wrap gap-1">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={value === option.value}
            title={option.hint}
            onClick={() => onChange(option.value)}
            className={`rounded-lg border px-3 py-1.5 text-sm ${value === option.value ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function Select({ label, value, options, onChange }: { label: string; value: string; options: { value: string; label: string }[]; onChange: (v: string) => void }) {
  return (
    <label className="space-y-1 text-sm">
      <span className="block text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="max-w-[16rem] rounded-lg border bg-background px-3 py-1.5">
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
}

export function Filters({
  state, onChange, categories, organisations, harnesses,
}: {
  state: FilterState;
  onChange: (next: FilterState) => void;
  categories: string[];
  organisations: string[];
  harnesses: { value: string; label: string }[];
}) {
  const patch = (p: Partial<FilterState>) => onChange({ ...state, ...p });

  return (
    <div className="flex flex-wrap items-end gap-x-6 gap-y-4 rounded-xl border p-4" role="group" aria-label="Matrix filters">
      <Segmented
        legend="View"
        value={state.view}
        onChange={(view) => patch({ view })}
        options={[
          { value: "model", label: "Model", hint: "One row per model, showing the best credible evidence." },
          { value: "system", label: "System", hint: "One row per model + harness combination." },
        ]}
      />
      <Segmented
        legend="Comparability"
        value={state.comparability}
        onChange={(comparability) => patch({ comparability })}
        options={[
          { value: "strict", label: "Strict comparable", hint: "Only same benchmark / version / subset / metric / protocol / effort." },
          { value: "all", label: "All credible", hint: "Any credible result, with version and protocol shown." },
        ]}
      />
      <Segmented
        legend="Evidence"
        value={state.evidence}
        onChange={(evidence) => patch({ evidence })}
        options={[
          { value: "official", label: "Official only" },
          { value: "official_vendor", label: "Official + vendor" },
          { value: "all", label: "All credible" },
        ]}
      />

      <Select label="Category" value={state.category} onChange={(category) => patch({ category })}
        options={[{ value: "all", label: "All categories" }, ...categories.map((c) => ({ value: c, label: c }))]} />
      <Select label="Organisation" value={state.organisation} onChange={(organisation) => patch({ organisation })}
        options={[{ value: "all", label: "All organisations" }, ...organisations.map((o) => ({ value: o, label: o }))]} />
      {state.view === "system" ? (
        <Select label="Harness" value={state.harness} onChange={(harness) => patch({ harness })}
          options={[{ value: "all", label: "All harnesses" }, ...harnesses]} />
      ) : null}

      <fieldset className="space-y-1">
        <legend className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Cohort</legend>
        <div className="flex flex-col gap-1 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={state.trackedOnly} onChange={(e) => patch({ trackedOnly: e.target.checked })} className="accent-primary" />
            My tracked families (GPT / GLM / DeepSeek / Kimi / Qwen)
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={state.includeP1} onChange={(e) => patch({ includeP1: e.target.checked })} className="accent-primary" />
            Include secondary benchmarks (P1)
          </label>
        </div>
      </fieldset>

      <label className="space-y-1 text-sm">
        <span className="block text-xs font-medium uppercase tracking-wide text-muted-foreground">Search</span>
        <input type="search" value={state.search} onChange={(e) => patch({ search: e.target.value })} placeholder="Model, lab, benchmark…"
          className="rounded-lg border bg-background px-3 py-1.5" />
      </label>
    </div>
  );
}
