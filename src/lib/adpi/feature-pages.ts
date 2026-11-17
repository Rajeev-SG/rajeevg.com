import { getGuideDetail, getGuideIndexOutcome, guideEntry } from "./guides"
import type { GuideClaim, GuideSection } from "./guide-types"
import { pmaxAudienceSignals } from "./pmax-audience-signals"
import { capabilitiesOf, getCapabilityDataset } from "./registry"
import type { ControlMode } from "./types"

export const explorerPath = "/solutions/capability-explorer"

export function featurePath(id: string) {
  return `${explorerPath}/guides/${encodeURIComponent(id)}`
}

export interface FeatureListing {
  id: string
  name: string
  vendor: string
  platform: string
  category?: string
  summary: string
}

interface GuideItem {
  title?: string
  text: string
  sources?: string[]
}

export interface FeatureGuide extends Omit<FeatureListing, "summary"> {
  summary?: GuideItem
  control?: ControlMode
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

const categories: Record<string, string[]> = {
  Targeting: [
    "ga.broad-match", "ga.customer-match-api-upload", "ga.customer-match-eea-restriction",
    "ga.pmax-negative-keywords", "ga.search-negative-keywords", "meta.lookalike-audiences",
    "meta.shared-audience-usage-restrictions", "meta.teen-targeting-restrictions",
    "meta.website-custom-audience", "pin.broad-match", "pin.negative-exact-match",
    "pin.negative-keywords", "tt.keyword-quality-module", "tt.negative-keyword-broad-match",
    "tt.search-broad-match", "tt.smart-plus-automatic-targeting",
  ],
  "Placements": [
    "meta.advantage-plus-reels-placement", "meta.manual-reels-placement",
    "pin.top-of-search-api-v5", "tt.automatic-search-placement-compatibility",
  ],
  "Delivery & bidding": [
    "ga.attribution-affects-bidding", "ga.target-cpa-bidding", "meta.automatic-conversion-location",
    "pin.performance-plus-automatic-ad-groups", "pin.performance-plus-learning-mode",
    "tt.smart-plus-budget-increments",
  ],
  "Measurement & reporting": [
    "ga.attribution-model-setting", "ga.enhanced-conversions-web", "meta.automatic-advanced-matching",
    "meta.brand-suitability-delivery-reports", "meta.capi-pixel-customer-information",
    "pin.conversions-api", "pin.limited-data-processing", "pin.performance-plus-expanded-reporting",
    "pin.pinterest-tag", "tt.events-api-first-party-cookie", "tt.mmp-ad-level-reporting-unsupported",
    "tt.search-ad-impression-counting", "tt.split-testing-experiment-manager",
  ],
}

const categoryById = new Map(Object.entries(categories)
  .flatMap(([category, ids]) => ids.map((id) => [id, category] as const)))

// Some older guides include editorial notes alongside planner-facing copy.
const internalLanguage = /\b(?:packets?|spans?|source[ _-]ids?|hash(?:es)?|fact versions?|evidence(?: basis)?|corpus|stage[- ]?1|pipeline)\b|\b[a-f\d]{12,64}\b|https?:\/\//i

function plannerText(value?: string | null) {
  return value && !internalLanguage.test(value) ? value.trim() : ""
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
  if (!section || section.status === "not_documented" || section.status === "conflicting") return []

  const items = section.claims.flatMap((claim) => {
    const text = plannerText(claim.text).replace(/^Use case:\s*/i, "")
    if (!text || claim.status === "not_documented" || claim.status === "conflicting") return []
    const conditions = includeConditions ? (claim.conditions ?? []).map(plannerText).filter(Boolean) : []
    return [{
      text: conditions.length ? `${text} (${conditions.join(", ")})` : text,
      sources: sourceLinks(claim),
    }]
  })
  const summary = plannerText(section.summary)
  return items.length > 0 ? items : summary ? [{ text: summary }] : []
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
  const featured = pmaxAudienceSignals
  return [
    {
      id: featured.id, name: featured.name, vendor: featured.vendor, platform: featured.platform,
      category: featured.category, summary: featured.summary?.text ?? "",
    },
    ...index.guides.filter((entry) => entry.feature_id !== featured.id).map((entry) => ({
      id: entry.feature_id,
      name: entry.name,
      vendor: entry.vendor,
      platform: entry.platform,
      category: categoryById.get(entry.feature_id),
      summary: plannerText(entry.summary),
    })),
  ]
}

export async function getFeatureGuide(id: string) {
  if (id === pmaxAudienceSignals.id) return { name: pmaxAudienceSignals.name, page: pmaxAudienceSignals }
  const { index, source } = await getGuideIndexOutcome()
  const entry = guideEntry(index, id)
  if (!entry) return {}
  const detail = await getGuideDetail(entry.detail, source)
  if (!detail || detail.guide.feature_id !== id) return { name: entry.name }

  const guide = detail.guide
  const byKind = new Map(guide.sections.map((section) => [section.kind, section]))
  const definition = sectionItems(byKind.get("definition"), false).slice(0, 2)
  const summary = definition.length > 0
    ? { text: definition.map((item) => item.text).join(" "), sources: definition.flatMap((item) => item.sources ?? []) }
    : { text: plannerText(entry.summary) }
  const useCases = sectionItems(byKind.get("use_cases"))
  const isLimitation = (item: GuideItem) => /^(?:avoid|do not|don’t|don't)\b/i.test(item.text)
  const comparisons = (guide.relationships ?? []).flatMap((relationship) => {
    const name = plannerText(relationship.name)
    if (!name || relationship.status === "not_documented" || relationship.status === "conflicting") return []
    const text = [plannerText(relationship.difference), plannerText(relationship.context)].filter(Boolean).join(" ")
    const sources = sourceLinks(relationship)
    return [{
      vendor: relationship.vendor,
      name,
      href: guideEntry(index, relationship.feature_id) ? featurePath(relationship.feature_id) : sources[0],
      match: relationshipLabels[relationship.kind] ?? "Not documented",
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

  const { dataset } = await getCapabilityDataset()
  const ids = new Set(guide.capability_ids ?? [])
  const modes = new Set(capabilitiesOf(dataset)
    .filter((record) => ids.has(record.id))
    .map((record) => record.control_mode))
  const control = modes.size === 1 ? [...modes][0] : undefined

  const page: FeatureGuide = {
    id,
    name: entry.name,
    vendor: entry.vendor,
    platform: entry.platform,
    category: categoryById.get(id),
    summary,
    control,
    checkedAt: guide.source_checked_at ?? entry.source_checked_at,
    facts: [
      { label: "Platform", value: entry.vendor },
      ...(entry.platform && entry.platform !== entry.vendor ? [{ label: "Product", value: entry.platform }] : []),
      { label: "Control type", value: control ? "" : "Not documented" },
    ].filter(({ value }) => value),
    inputs: sectionItems(byKind.get("mechanism")),
    useCases: useCases.filter((item) => !isLimitation(item)),
    limitations: useCases.filter(isLimitation),
    steps: sectionItems(byKind.get("setup")),
    kpis: sectionItems(byKind.get("kpis")),
    comparisons,
    sources: [...urls].map((url) => ({ url, label: titles.get(url) || sourceLabel(url) })),
  }
  return { name: page.name, page }
}
