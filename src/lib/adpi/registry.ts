/**
 * Data loaders for the capability explorer.
 *
 * Same two-layer design as the Agent Benchmark Matrix and Pareto pipeline:
 *
 * 1. DURABLE published dataset — `Rajeev-SG/adpi-data@main/dataset.json`, served
 *    over raw.githubusercontent.com. The refresh pipeline writes it; the site
 *    only reads it, so Vercel is never in the data-refresh path.
 * 2. BUNDLED reviewed seed in `src/data/adpi/capabilities.json` on `main`: the
 *    guaranteed render path and the test fixture.
 *
 * The durable read never throws: on any failure the caller keeps the bundled
 * last-known-good snapshot, so a failed refresh cannot blank the page. The
 * dataset is *labelled* with its source so the UI never presents the seed as
 * live production data.
 */
import seedJson from "@/data/adpi/capabilities.json";
import type { CapabilityDataset, CapabilityRecord } from "./types";

/** Bumped on a schema change so a schema change cannot be served a stale cache. */
export const ADPI_SCHEMA_VERSION = 2;

export const ADPI_DATASET_URL =
  process.env.ADPI_DATASET_URL ??
  `https://raw.githubusercontent.com/Rajeev-SG/adpi-data/main/dataset.json?v=${ADPI_SCHEMA_VERSION}`;

/** The bundled, last-known-good dataset. */
export function seedDataset(): CapabilityDataset {
  // The seed mirrors the published export shape, which predates the #62
  // qualified fields; `capabilitiesOf` normalises a missing field to explicit
  // `unknown`. The cast is via `unknown` because the JSON's inferred type is
  // narrower than the optional-field model.
  return seedJson as unknown as CapabilityDataset;
}

/**
 * Shape check. Deliberately stricter than "is it JSON": a payload from before a
 * schema change must be rejected so the page falls back to the seed rather than
 * rendering a wrong or empty view.
 */
export function isPlausibleDataset(parsed: unknown): parsed is CapabilityDataset {
  const candidate = parsed as CapabilityDataset | null;
  if (!candidate || typeof candidate.generated_at !== "string" || candidate.generated_at.length === 0) {
    return false;
  }
  if (!Array.isArray(candidate.capabilities) || candidate.capabilities.length === 0) {
    return false;
  }
  return candidate.capabilities.every(
    (record) => typeof record.id === "string" && typeof record.name === "string" && typeof record.vendor === "string",
  );
}

let durableCache: { at: number; dataset: CapabilityDataset | null } = { at: 0, dataset: null };
const DURABLE_CACHE_MS = 60 * 60 * 1000;

/** Read the durable dataset, cached in-process for an hour. Never throws. */
export async function getDurableDataset(): Promise<CapabilityDataset | null> {
  const now = Date.now();
  if (durableCache.dataset && now - durableCache.at < DURABLE_CACHE_MS) return durableCache.dataset;
  try {
    const res = await fetch(ADPI_DATASET_URL, {
      headers: { Accept: "application/json" },
      next: { revalidate: 3600, tags: ["adpi-dataset"] },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const parsed: unknown = await res.json();
    if (!isPlausibleDataset(parsed)) throw new Error("invalid dataset shape");
    durableCache = { at: now, dataset: parsed };
    return parsed;
  } catch {
    durableCache = { at: now, dataset: durableCache.dataset };
    return durableCache.dataset;
  }
}

export interface DatasetOutcome {
  dataset: CapabilityDataset;
  /** "durable" when the live published dataset was used, else "bundled". */
  source: "durable" | "bundled";
  degraded: boolean;
  note: string | null;
}

/** Effective dataset for rendering: prefer the live one, fall back to the seed. */
export async function getCapabilityDataset(): Promise<DatasetOutcome> {
  const durable = await getDurableDataset();
  if (durable) return { dataset: durable, source: "durable", degraded: false, note: null };
  return {
    dataset: seedDataset(),
    source: "bundled",
    degraded: true,
    note: "Live published dataset unavailable; showing the bundled reviewed seed.",
  };
}

/**
 * A record as the product must read it: a missing `evidence_basis` or
 * `availability` is normalised to an explicit `unknown`, never left absent.
 * The live public feed predates the #62 fields, so this is the honesty rule in
 * code — a consumer can never read a missing field as documented/supported.
 */
export function normaliseRecord(record: CapabilityRecord): CapabilityRecord {
  return {
    ...record,
    evidence_basis: record.evidence_basis ?? "unknown",
    availability: record.availability ?? "unknown",
    control_mode: record.control_mode ?? "not_applicable",
    maturity: record.maturity ?? "unknown",
    evidence: record.evidence ?? [],
  };
}

/** Convenience accessor for the capability list, normalised. */
export function capabilitiesOf(dataset: CapabilityDataset): CapabilityRecord[] {
  return dataset.capabilities.map(normaliseRecord);
}
