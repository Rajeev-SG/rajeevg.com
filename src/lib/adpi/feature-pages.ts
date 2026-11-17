import { getGuideDetail, getGuideIndexOutcome, guideEntry } from "./guides"
import type { GuideClaim, GuideControlMode, GuideIndexEntry, GuideSection } from "./guide-types"
import { pmaxAudienceSignals } from "./pmax-audience-signals"

export const explorerPath = "/solutions/capability-explorer"

export function featurePath(id: string) {
  return `${explorerPath}/guides/${encodeURIComponent(id)}`
}

export interface FeatureListing {
  id: string
  name: string
  vendor: string
  platform: string
  category: string
  searchTerms: string[]
  summary: string
}

interface GuideItem {
  title?: string
  text: string
  sources?: string[]
}

export interface FeatureGuide extends Omit<FeatureListing, "summary" | "searchTerms"> {
  summary?: GuideItem
  control: GuideControlMode
  controlLabel?: string
  checkedAt?: string | null
  availability?: string
  facts: { label: string; value: string }[]
  inputs: GuideItem[]
  useCases: GuideItem[]
  limitations: GuideItem[]
  steps: GuideItem[]
  kpis: GuideItem[]
  comparisonHeading?: string
  comparisons: { vendor: string; name: string; href?: string; match: string; details?: GuideItem }[]
  sources: { url: string; label: string }[]
}

const relationshipLabels = {
  equivalent_for_use: "Same idea",
  partial_alternative: "Partial",
  related_not_equivalent: "Related",
}

function isReleaseGuide(entry: GuideIndexEntry): entry is GuideIndexEntry & {
  category: string
  control_mode: GuideControlMode
} {
  return typeof entry.category === "string" && entry.category.length > 0 &&
    (entry.control_mode === "control" || entry.control_mode === "signal" ||
      entry.control_mode === "automatic")
}

const internalLanguage = /\b(?:packets?|spans?|source[ _-]ids?|hash(?:es)?|fact versions?|corpus|stage[- ]?1|pipeline|the (?:available |supplied )?evidence)\b|\b[a-f\d]{12,64}\b|https?:\/\//i

function plannerText(value?: string | null) {
  return value?.trim()
    .split(/(?<=[.!?])\s+/)
    .filter((part) => !internalLanguage.test(part))
    .join(" ") ?? ""
}

function sourceUrl(value: string): string | undefined {
  try {
    const url = new URL(value)
    if (url.protocol === "https:" || url.protocol === "http:") return url.href
  } catch {
    return undefined
  }
}

function sourceLinks(claim: Pick<GuideClaim, "evidence">) {
  return (claim.evidence ?? []).flatMap(({ source_url }) => sourceUrl(source_url) ?? [])
}

function sectionItems(section?: GuideSection, includeConditions = true): GuideItem[] {
  if (!section || (section.status !== "documented" && section.status !== "inferred")) return []

  return section.claims.flatMap((claim) => {
    const text = plannerText(claim.text).replace(/^Use case:\s*/i, "")
    if (!text || (claim.status !== "documented" && claim.status !== "inferred")) return []
    const conditions = includeConditions ? (claim.conditions ?? []).map(plannerText).filter(Boolean) : []
    return [{
      text: conditions.length ? `${text} (${conditions.join(", ")})` : text,
      sources: sourceLinks(claim),
    }]
  })
}

function sourceLabel(url: string) {
  const host = new URL(url).hostname.replace(/^www\./, "")
  if (host === "support.google.com" || host === "developers.google.com") return "Google Ads documentation"
  if (host.endsWith(".facebook.com") || host === "facebook.com") return "Meta documentation"
  if (host === "ads.tiktok.com" || host === "business-api.tiktok.com") return "TikTok Ads documentation"
  if (host.endsWith(".pinterest.com") || host === "pinterest.com") return "Pinterest documentation"
  return host
}

export async function getFeatureListings(): Promise<FeatureListing[]> {
  const { index } = await getGuideIndexOutcome()
  return index.guides.filter(isReleaseGuide).map((entry) => ({
    id: entry.feature_id,
    name: entry.name,
    vendor: entry.vendor,
    platform: entry.platform,
    category: entry.category,
    searchTerms: Array.isArray(entry.search_terms) ? entry.search_terms : [],
    summary: plannerText(entry.summary),
  }))
}

export async function getFeatureGuide(id: string) {
  const { index } = await getGuideIndexOutcome()
  const entry = guideEntry(index, id)
  if (!entry || !isReleaseGuide(entry)) return {}
  if (id === pmaxAudienceSignals.id) return { name: pmaxAudienceSignals.name, page: pmaxAudienceSignals }
  const detail = await getGuideDetail(entry.detail)
  if (!detail || detail.guide.feature_id !== id) return { name: entry.name }

  const guide = detail.guide
  const byKind = new Map(guide.sections.map((section) => [section.kind, section]))
  const definition = sectionItems(byKind.get("definition"), false).slice(0, 2)
  const summary = definition.length > 0
    ? { text: definition.map((item) => item.text).join(" "), sources: definition.flatMap((item) => item.sources ?? []) }
    : undefined
  const useCases = sectionItems(byKind.get("use_cases"))
  const isLimitation = (item: GuideItem) => /^(?:avoid|do not|don’t|don't)\b/i.test(item.text)
  const comparedVendors = new Set<string>()
  const comparisons = (guide.relationships ?? []).flatMap((relationship) => {
    const name = plannerText(relationship.name)
    if (!name || (relationship.status !== "documented" && relationship.status !== "inferred")) return []
    const text = plannerText(relationship.difference)
    const sources = sourceLinks(relationship)
    if (!text || !sources.length || comparedVendors.has(relationship.vendor)) return []
    comparedVendors.add(relationship.vendor)
    const alternative = guideEntry(index, relationship.feature_id)
    return [{
      vendor: relationship.vendor,
      name,
      href: alternative && isReleaseGuide(alternative) ? featurePath(relationship.feature_id) : sources[0],
      match: relationshipLabels[relationship.kind],
      details: { text, sources },
    }]
  })
  const urls = new Set([
    ...guide.sections.flatMap((section) => section.claims.flatMap(sourceLinks)),
    ...comparisons.flatMap((comparison) => comparison.details.sources),
  ])
  const titles = new Map<string, string>()
  for (const claim of byKind.get("sources")?.claims ?? []) {
    const title = plannerText(claim.text.split(/\s*\(?(?:source[ _-]id|https?:\/\/)/i)[0])
      .replace(/[,\s]+$/, "")
    const links = sourceLinks(claim)
    if (title && links.length === 1 && !(claim.evidence ?? []).some((ref) => title.includes(ref.source_id))) {
      titles.set(links[0], title)
    }
  }

  const page: FeatureGuide = {
    id,
    name: entry.name,
    vendor: entry.vendor,
    platform: entry.platform,
    category: entry.category,
    summary,
    control: entry.control_mode,
    checkedAt: guide.source_checked_at ?? entry.source_checked_at,
    facts: [
      { label: "Platform", value: entry.vendor },
      ...(entry.platform && entry.platform !== entry.vendor ? [{ label: "Product", value: entry.platform }] : []),
      { label: "Category", value: entry.category },
    ],
    inputs: sectionItems(byKind.get("mechanism")),
    useCases: useCases.filter((item) => !isLimitation(item)),
    limitations: useCases.filter(isLimitation),
    steps: sectionItems(byKind.get("setup")).map((item) => ({
      ...item,
      text: item.text.replace(/^(?:step\s+)?\d+[.):]\s*/i, ""),
    })),
    kpis: sectionItems(byKind.get("kpis")),
    comparisons,
    sources: [...urls].map((url) => ({ url, label: titles.get(url) || sourceLabel(url) })),
  }
  return { name: page.name, page }
}
