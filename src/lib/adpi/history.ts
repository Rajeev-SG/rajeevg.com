/**
 * The published fact-history/changelog (#58), surfaced in the explorer.
 *
 * Where `dataset.json` is the current state, `history.json` is how change
 * accrues: one entry per fact version, so a planner can see what actually
 * changed, when a fact was first seen and last verified, and whether it was
 * superseded or retired. The read never throws and never invents a change — a
 * missing or malformed history simply yields no history surface, so the page
 * can never claim a change that the artefact did not state.
 */
import type { Availability, ControlMode } from "./types";

/** One published history entry (schema v2, `pipeline/run.py::_public_history_entry`). */
export interface AdpiHistoryEntry {
  id: string;
  vendor: string;
  platform: string;
  name: string;
  capability_type?: string;
  maturity?: string;
  control_mode?: ControlMode;
  evidence_basis?: string;
  availability?: Availability;
  first_seen_at?: string;
  last_verified_at?: string;
  /** null means the version is still current; a date means it stopped being current. */
  effective_to?: string | null;
  superseded?: boolean;
  changed_fields?: string[];
  /** "added" | "changed" | "superseded" | "retired". */
  change: string;
}

export interface AdpiHistory {
  schema_version: number;
  generated_at: string;
  note?: string;
  entries: AdpiHistoryEntry[];
}

export const ADPI_HISTORY_URL =
  process.env.ADPI_HISTORY_URL ??
  "https://raw.githubusercontent.com/Rajeev-SG/adpi-data/main/history.json";

/** Shape check: a payload from a different schema must be rejected, not rendered. */
export function isPlausibleHistory(parsed: unknown): parsed is AdpiHistory {
  const candidate = parsed as AdpiHistory | null;
  if (!candidate || typeof candidate.generated_at !== "string") return false;
  if (!Array.isArray(candidate.entries)) return false;
  return candidate.entries.every(
    (entry) => typeof entry.id === "string" && typeof entry.change === "string",
  );
}

let historyCache: { at: number; history: AdpiHistory | null } = { at: 0, history: null };
const CACHE_MS = 60 * 60 * 1000;

/** Read the published history, cached in-process. Never throws, never invents one. */
export async function getDurableHistory(): Promise<AdpiHistory | null> {
  const now = Date.now();
  if (historyCache.history && now - historyCache.at < CACHE_MS) return historyCache.history;
  try {
    const res = await fetch(ADPI_HISTORY_URL, {
      headers: { Accept: "application/json" },
      next: { revalidate: 3600, tags: ["adpi-history"] },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const parsed: unknown = await res.json();
    if (!isPlausibleHistory(parsed)) throw new Error("invalid history shape");
    historyCache = { at: now, history: parsed };
    return parsed;
  } catch {
    historyCache = { at: now, history: historyCache.history };
    return historyCache.history;
  }
}

export interface HistorySummary {
  total: number;
  /** Counts by `change` kind, only for the kinds actually present. */
  byChange: Record<string, number>;
  /** The most recent non-"added" events (a change, supersession or retirement). */
  recentChanges: AdpiHistoryEntry[];
  /** The latest verification date any entry carries. */
  lastVerifiedAt: string | null;
}

/**
 * Summarise history for the UI. Pure and deterministic, so it is unit-testable
 * without a network. `limit` caps the recent-changes list.
 */
export function summariseHistory(history: AdpiHistory, limit = 5): HistorySummary {
  const byChange: Record<string, number> = {};
  for (const entry of history.entries) {
    byChange[entry.change] = (byChange[entry.change] ?? 0) + 1;
  }
  const recentChanges = history.entries
    .filter((entry) => entry.change !== "added")
    .slice()
    // Most recent first: by the date the change took effect (effective_to), then
    // by last_verified_at, so a supersession/retirement sorts ahead of older ones.
    .sort((a, b) => (b.effective_to ?? "").localeCompare(a.effective_to ?? ""))
    .slice(0, limit);
  const lastVerifiedAt =
    history.entries
      .map((entry) => entry.last_verified_at)
      .filter((value): value is string => Boolean(value))
      .sort()
      .at(-1) ?? null;
  return { total: history.entries.length, byChange, recentChanges, lastVerifiedAt };
}
