/**
 * Feature-guide loaders for the Capability Explorer (#175, parent #116).
 *
 * Two-layer like the dataset loader: the additive published guide index
 * (`Rajeev-SG/adpi-data@main/guides.json` + `guides/<release>/*.json`) with a
 * bundled last-known-good index fallback. The durable read never throws and a
 * missing/garbage guide degrades to the explicit "not yet available" state, so
 * the page cannot be blanked by a failed refresh.
 */
import seedGuides from "@/data/adpi/guides.json";
import type { GuideDetail, GuideIndex, GuideIndexEntry, GuideSection, GuideSectionKind } from "./guide-types";

/** Bumped on a guide-schema change so a stale cache is not served. */
export const GUIDE_SCHEMA_VERSION = 1;

const DATA_BASE =
  process.env.ADPI_DATA_BASE ?? "https://raw.githubusercontent.com/Rajeev-SG/adpi-data/main";

export const GUIDE_INDEX_URL = `${DATA_BASE}/guides.json?v=${GUIDE_SCHEMA_VERSION}`;

/** Upper bound on any guide fetch, so a hung connection cannot stall a page
 *  render indefinitely (#175 review: no-fetch-timeout). */
export const GUIDE_FETCH_TIMEOUT_MS = 5000;

/** A published detail pointer must be exactly `guides/<release>/<file>.json`:
 *  a single relative path with no traversal, no absolute URL and no query, so a
 *  drifted/compromised index cannot make the render server fetch an arbitrary
 *  URL (SSRF) or read outside the data base (#175 review: detail-path-ssrf). */
const DETAIL_POINTER_RE = /^guides\/[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+\.json$/;

export function isSafeDetailPointer(detail: unknown): detail is string {
  return typeof detail === "string" && DETAIL_POINTER_RE.test(detail);
}

/** The bundled, last-known-good guide index (the guaranteed render path). */
export function seedGuideIndex(): GuideIndex {
  return seedGuides as unknown as GuideIndex;
}

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
    (entry) =>
      typeof entry?.feature_id === "string" && isSafeDetailPointer(entry?.detail),
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

let indexCache: { at: number; index: GuideIndex | null; source: "durable" | "bundled" } = {
  at: 0,
  index: null,
  source: "bundled",
};
const CACHE_MS = 60 * 60 * 1000;

export interface GuideIndexOutcome {
  index: GuideIndex;
  /** "durable" when the live published index was used, else "bundled". */
  source: "durable" | "bundled";
}

/**
 * Read the published guide index, falling back to the bundled last-known-good
 * seed. Never throws, and never returns null: on a cold render where the live
 * index is unreachable or malformed, the bundled seed is served (the guaranteed
 * render path), exactly like the dataset loader — so a fetch outage degrades
 * to "Guide not yet available" per feature rather than blanking the route.
 */
export async function getGuideIndexOutcome(): Promise<GuideIndexOutcome> {
  const now = Date.now();
  if (indexCache.index && now - indexCache.at < CACHE_MS) {
    return { index: indexCache.index, source: indexCache.source };
  }
  try {
    const res = await fetch(GUIDE_INDEX_URL, {
      headers: { Accept: "application/json" },
      next: { revalidate: 3600, tags: ["adpi-guides"] },
      signal: AbortSignal.timeout(GUIDE_FETCH_TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const parsed: unknown = await res.json();
    if (!isPlausibleGuideIndex(parsed)) throw new Error("invalid guide index shape");
    indexCache = { at: now, index: parsed, source: "durable" };
    return { index: parsed, source: "durable" };
  } catch (error) {
    // Observable, bounded failure (#175 review): warn so a degraded state is
    // diagnosable, then serve the bundled last-known-good seed.
    console.warn(`adpi guide index unavailable (${String(error)}); using bundled seed`);
    const seed = seedGuideIndex();
    indexCache = { at: now, index: seed, source: "bundled" };
    return { index: seed, source: "bundled" };
  }
}

/** The effective guide index (live when available, else the bundled seed). */
export async function getGuideIndex(): Promise<GuideIndex> {
  return (await getGuideIndexOutcome()).index;
}

/** Fetch one guide detail from its published pointer. Never throws.
 *
 * The pointer is re-validated here (not only at index load): a detail path that
 * is not exactly `guides/<release>/<file>.json` is refused before any fetch, so
 * a traversal/absolute URL cannot make the render server request an arbitrary
 * address (#175 review: detail-path-ssrf).
 */
export async function getGuideDetail(detailPath: string): Promise<GuideDetail | null> {
  if (!isSafeDetailPointer(detailPath)) {
    console.warn(`adpi guide detail pointer rejected as unsafe: ${String(detailPath)}`);
    return null;
  }
  try {
    const res = await fetch(`${DATA_BASE}/${detailPath}?v=${GUIDE_SCHEMA_VERSION}`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 3600, tags: ["adpi-guides"] },
      signal: AbortSignal.timeout(GUIDE_FETCH_TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const parsed: unknown = await res.json();
    if (!isPlausibleGuideDetail(parsed)) throw new Error("invalid guide detail shape");
    return parsed;
  } catch (error) {
    console.warn(`adpi guide detail unavailable (${detailPath}): ${String(error)}`);
    return null;
  }
}
