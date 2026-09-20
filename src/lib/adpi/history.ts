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

/** The schema this reader understands; a mismatch is rejected, not rendered. */
export const ADPI_HISTORY_SCHEMA_VERSION = 2;

export const ADPI_HISTORY_URL =
  process.env.ADPI_HISTORY_URL ??
  "https://raw.githubusercontent.com/Rajeev-SG/adpi-data/main/history.json";

/**
 * Shape check: a payload from a different schema must be rejected, not rendered.
 * Every entry is guarded for null/non-object before its fields are read, and the
 * `schema_version` is checked — a future schema must degrade to "no history
 * surface", never render a wrong view.
 */
export function isPlausibleHistory(parsed: unknown): parsed is AdpiHistory {
  const candidate = parsed as AdpiHistory | null;
  if (!candidate || typeof candidate !== "object") return false;
  if (candidate.schema_version !== ADPI_HISTORY_SCHEMA_VERSION) return false;
  if (typeof candidate.generated_at !== "string") return false;
  if (!Array.isArray(candidate.entries)) return false;
  return candidate.entries.every(
    (entry) =>
      typeof entry === "object" &&
      entry !== null &&
      typeof entry.id === "string" &&
      typeof entry.change === "string",
  );
}

// Cache lifetime aligned with the Next fetch `revalidate` (1 h), so the two
// layers do not compound into a doubly-stale read. Only a *successful* fetch
// refreshes `at`: a failure serves the last known history but does not extend
// its lifetime, so a persistently broken feed eventually surfaces as no history
// rather than serving a superseded artefact forever (F4).
const CACHE_MS = 60 * 60 * 1000;
let historyCache: { at: number; history: AdpiHistory | null } = { at: 0, history: null };

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
    // Serve the last known history without extending its lifetime; a null cache
    // simply yields no history surface.
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
  // Recency key: a still-current changed entry (effective_to null) is *recent*,
  // so fall back to its last_verified_at, then first_seen_at, rather than
  // sorting it last behind every dated supersession (F1). The documented
  // tiebreak is applied in the comparator.
  const recency = (entry: AdpiHistoryEntry): string =>
    entry.effective_to ?? entry.last_verified_at ?? entry.first_seen_at ?? "";
  const recentChanges = history.entries
    .filter((entry) => entry.change !== "added")
    .slice()
    .sort((a, b) => {
      const byRecency = recency(b).localeCompare(recency(a));
      if (byRecency !== 0) return byRecency;
      // Tiebreak: latest verification first, then newest first-seen.
      return (b.last_verified_at ?? "").localeCompare(a.last_verified_at ?? "");
    })
    .slice(0, limit);
  const lastVerifiedAt =
    history.entries
      .map((entry) => entry.last_verified_at)
      .filter((value): value is string => Boolean(value))
      .sort()
      .at(-1) ?? null;
  return { total: history.entries.length, byChange, recentChanges, lastVerifiedAt };
}
