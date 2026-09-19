/**
 * Ad Platform Intelligence dataset delivery (#54/#57).
 *
 * Two layers, in priority order — mirroring the Pareto pattern
 * (src/lib/pareto/aa-fallback.ts):
 *
 * 1. DURABLE: the public current-state export published by the Oracle pipeline
 *    to `Rajeev-SG/adpi-data` (raw.githubusercontent.com). Data freshness is
 *    decoupled from this app's deployment — the data repo is not connected to
 *    Vercel, so a refresh never triggers a build.
 * 2. BUNDLED: `src/data/adpi-launch.json`, the reviewed #61 launch slice. It is
 *    the guaranteed render path when the durable read fails, and the only
 *    source of the three reviewed planner questions.
 *
 * IMPORTANT: the durable dataset is the *current state* of the whole corpus;
 * the bundled slice is the *reviewed launch* subset. Qualification logic uses
 * the durable records when they are present and fall back to bundled records
 * for the launch questions, so the reviewed answers never regress to empty.
 */
import bundledJson from "@/data/adpi-launch.json"
import type { AdpiDataset, Capability, PlannerQuestion } from "./types"

export const ADPI_DATA_BRANCH = "main"
export const ADPI_DATA_PATH = "dataset.json"
export const ADPI_DATA_URL =
  process.env.ADPI_DATA_URL ??
  `https://raw.githubusercontent.com/Rajeev-SG/adpi-data/${ADPI_DATA_BRANCH}/${ADPI_DATA_PATH}`

export const bundledDataset = bundledJson as AdpiDataset

const REVALIDATE_S = 3600
let durableCache: { at: number; data: AdpiDataset | null } = { at: 0, data: null }
const DURABLE_CACHE_MS = 60 * 60 * 1000

function isPlausibleDataset(parsed: unknown): parsed is AdpiDataset {
  const candidate = parsed as AdpiDataset | null
  return Boolean(
    candidate &&
      typeof candidate.schema_version === "number" &&
      typeof candidate.generated_at === "string" &&
      Array.isArray(candidate.capabilities) &&
      candidate.capabilities.every(
        (capability) =>
          capability &&
          typeof capability.id === "string" &&
          typeof capability.control_mode === "string" &&
          typeof capability.evidence_basis === "string" &&
          typeof capability.availability === "string",
      ),
  )
}

async function getDurableDataset(): Promise<AdpiDataset | null> {
  const now = Date.now()
  if (durableCache.data && now - durableCache.at < DURABLE_CACHE_MS) {
    return durableCache.data
  }
  try {
    const response = await fetch(ADPI_DATA_URL, { next: { revalidate: REVALIDATE_S } })
    if (!response.ok) return null
    const parsed: unknown = await response.json()
    if (!isPlausibleDataset(parsed)) return null
    durableCache = { at: now, data: parsed }
    return parsed
  } catch {
    return null
  }
}

export interface ResolvedDataset {
  dataset: AdpiDataset
  /** True when the live public export was used; false when the bundled slice served. */
  live: boolean
  /** The reviewed launch questions and their cases (always from the bundled slice). */
  questions: PlannerQuestion[]
}

/**
 * Merge the live dataset with the reviewed launch slice.
 *
 * The live export is the current corpus; the bundled slice carries the
 * reviewed launch questions and their pinned records. A reviewed record is
 * preferred over a live record with the same id (the reviewed one is the one
 * the golden gate signed off), but any live-only records are still shown so
 * the table is the real dataset.
 */
export async function getAdpiDataset(): Promise<ResolvedDataset> {
  const live = await getDurableDataset()
  const questions = bundledDataset.questions ?? []
  if (!live) {
    return { dataset: bundledDataset, live: false, questions }
  }
  const reviewedIds = new Set(bundledDataset.capabilities.map((c) => c.id))
  const merged: Capability[] = [
    ...bundledDataset.capabilities,
    ...live.capabilities.filter((c) => !reviewedIds.has(c.id)),
  ]
  const dataset: AdpiDataset = {
    schema_version: live.schema_version,
    generated_at: live.generated_at,
    provenance: bundledDataset.provenance,
    questions,
    capabilities: merged,
  }
  return { dataset, live: true, questions }
}
