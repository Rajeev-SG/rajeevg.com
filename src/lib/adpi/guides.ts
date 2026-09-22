/**
 * Feature-guide loaders for the Capability Explorer (#175, parent #116).
 *
 * Two-layer like the dataset loader: the additive published guide index
 * (`Rajeev-SG/adpi-data@main/guides.json` + `guides/<release>/*.json`) with a
 * bundled last-known-good index fallback. The durable read never throws and a
 * missing/garbage guide degrades to the explicit "not yet available" state, so
 * the page cannot be blanked by a failed refresh.
 */
import type { GuideDetail, GuideIndex, GuideIndexEntry, GuideSection, GuideSectionKind } from "./guide-types";

/** Bumped on a guide-schema change so a stale cache is not served. */
export const GUIDE_SCHEMA_VERSION = 1;

const DATA_BASE =
  process.env.ADPI_DATA_BASE ?? "https://raw.githubusercontent.com/Rajeev-SG/adpi-data/main";

export const GUIDE_INDEX_URL = `${DATA_BASE}/guides.json?v=${GUIDE_SCHEMA_VERSION}`;

export const SECTION_ORDER: GuideSectionKind[] = [
  "definition",
  "mechanism",
  "use_cases",
  "setup",
  "kpis",
  "relationships",
  "sources",
];

export const SECTION_LABEL: Record<GuideSectionKind, string> = {
  definition: "What it is",
  mechanism: "How it works",
  use_cases: "Why and when to use it",
  setup: "How to set it up",
  kpis: "KPIs it could influence",
  relationships: "Alternatives on other platforms",
  sources: "Official sources",
};

export function isPlausibleGuideIndex(parsed: unknown): parsed is GuideIndex {
  const candidate = parsed as GuideIndex | null;
  if (!candidate || typeof candidate.release !== "string" || !candidate.release) return false;
  if (!Array.isArray(candidate.guides)) return false;
  return candidate.guides.every(
    (entry) => typeof entry?.feature_id === "string" && typeof entry?.detail === "string",
  );
}

export function isPlausibleGuideDetail(parsed: unknown): parsed is GuideDetail {
  const candidate = parsed as GuideDetail | null;
  if (!candidate || typeof candidate !== "object") return false;
  const guide = candidate.guide;
  if (!guide || typeof guide.feature_id !== "string") return false;
  return Array.isArray(guide.sections);
}

export function guideEntry(index: GuideIndex, featureId: string): GuideIndexEntry | null {
  return index.guides.find((entry) => entry.feature_id === featureId) ?? null;
}

/** Sort a guide's sections into the canonical seven-slot order, keeping only
 *  recognised kinds so a drifted payload cannot inject an unknown section. */
export function orderedSections(sections: GuideSection[]): GuideSection[] {
  const byKind = new Map(sections.map((section) => [section.kind, section]));
  return SECTION_ORDER.map((kind) => byKind.get(kind)).filter(
    (section): section is GuideSection => Boolean(section),
  );
}

let indexCache: { at: number; index: GuideIndex | null } = { at: 0, index: null };
const CACHE_MS = 60 * 60 * 1000;

/** Read the published guide index, cached in-process. Never throws. */
export async function getDurableGuideIndex(): Promise<GuideIndex | null> {
  const now = Date.now();
  if (indexCache.index && now - indexCache.at < CACHE_MS) return indexCache.index;
  try {
    const res = await fetch(GUIDE_INDEX_URL, {
      headers: { Accept: "application/json" },
      next: { revalidate: 3600, tags: ["adpi-guides"] },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const parsed: unknown = await res.json();
    if (!isPlausibleGuideIndex(parsed)) throw new Error("invalid guide index shape");
    indexCache = { at: now, index: parsed };
    return parsed;
  } catch {
    indexCache = { at: now, index: indexCache.index };
    return indexCache.index;
  }
}

/** Fetch one guide detail from its published pointer. Never throws. */
export async function getGuideDetail(detailPath: string): Promise<GuideDetail | null> {
  try {
    const res = await fetch(`${DATA_BASE}/${detailPath}?v=${GUIDE_SCHEMA_VERSION}`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 3600, tags: ["adpi-guides"] },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const parsed: unknown = await res.json();
    if (!isPlausibleGuideDetail(parsed)) throw new Error("invalid guide detail shape");
    return parsed;
  } catch {
    return null;
  }
}
