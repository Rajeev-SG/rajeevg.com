import type { ContentOpsRow, ContentWorkflowStatus } from "@/lib/content-ops/types"

export type PrimaryTab = "overview" | "content" | "opportunities" | "drafts" | "analytics" | "reference"

export const PRIMARY_TABS: { id: PrimaryTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "content", label: "Content" },
  { id: "opportunities", label: "Opportunities" },
  { id: "drafts", label: "Drafts" },
  { id: "analytics", label: "Analytics" },
  { id: "reference", label: "Reference data" },
]

export const REFERENCE_TABS = [
  "Master_Matrix",
  "Title_Decisions",
  "Topic_Graph",
  "Programmatic",
  "Interactive_Assets",
  "Sources",
] as const

/** Map internal workflow codes to plain-English states a reader understands. */
export function describeWorkflowStatus(status: ContentWorkflowStatus): string {
  switch (status) {
    case "live":
      return "Live"
    case "approved":
      return "Ready to build"
    case "in_progress":
      return "In progress"
    case "queued":
      return "Queued"
    case "review":
      return "In review"
    case "pr_open":
      return "PR open"
    case "merged":
      return "Merged"
    case "deployed":
      return "Deployed"
    case "blocked":
      return "Blocked"
    case "archived":
      return "Archived"
    case "planned":
      return "Idea"
    case "research_ready":
      return "Research ready"
    default:
      return status
  }
}

/** Rows that represent live or nearly-live published site content. */
export function isPublishedRow(row: ContentOpsRow): boolean {
  return row.workflowStatus === "live" || row.tab === "Existing_Content"
}

/** Rows that need the user's attention: blocked, review, or pr-open work. */
export function needsAttention(rows: ContentOpsRow[]): ContentOpsRow[] {
  return rows.filter((row) =>
    row.workflowStatus === "blocked" || row.workflowStatus === "review" || row.workflowStatus === "pr_open"
  )
}

/** Ideas/candidates worth considering: planned or research-ready workbook rows. */
export function activeOpportunities(rows: ContentOpsRow[]): ContentOpsRow[] {
  return rows.filter((row) =>
    row.workflowStatus === "planned" || row.workflowStatus === "research_ready" || row.workflowStatus === "queued"
  )
}

/** Work already moving: in_progress, approved, pr_open. */
export function inFlightRows(rows: ContentOpsRow[]): ContentOpsRow[] {
  return rows.filter((row) =>
    row.workflowStatus === "in_progress" || row.workflowStatus === "approved" || row.workflowStatus === "pr_open"
  )
}

export type DashboardCounts = {
  needsAttention: number
  opportunities: number
  liveTracked: number
  inFlight: number
}

/**
 * Overview counts, computed from canonical non-overlapping sources:
 *
 * - liveTracked: Existing_Content tab rows only (the site inventory; each
 *   record is one real page). Workbook planning rows never count.
 * - needsAttention / inFlight: Existing_Content rows whose workflow state
 *   puts them in that bucket. Planned workbook ideas cannot be "in progress".
 * - opportunities: unique candidates drawn from Master_Matrix + Topic_Graph +
 *   idea-kind records, deduplicated by URL (then by id) so the same concept
 *   is never counted twice across overlapping sheets.
 */
export function computeDashboardCounts(sources: {
  contentRows: ContentOpsRow[]
  opportunityRows: ContentOpsRow[]
}): DashboardCounts {
  const { contentRows, opportunityRows } = sources
  return {
    needsAttention: needsAttention(contentRows).length,
    opportunities: uniqueOpportunityRows(activeOpportunities(opportunityRows)).length,
    liveTracked: contentRows.filter((row) => row.tab === "Existing_Content").length,
    inFlight: inFlightRows(contentRows).length,
  }
}

/**
 * Plain-English display text for workbook strategy/status codes such as
 * "Existing -> expand" or "New". Raw values stay visible only in Reference
 * data views, which are explicitly archival.
 */
export function describeStrategyStatus(status: string): string {
  if (!status) return ""
  const normalized = status.trim().toLowerCase()
  if (normalized.startsWith("existing -> expand")) return "Live — worth expanding"
  if (normalized.startsWith("existing -> tighten")) return "Live — needs tightening"
  if (normalized.startsWith("existing -> hub")) return "Live — anchor for its hub"
  if (normalized.startsWith("existing -> hub anchor")) return "Live — anchor for its hub"
  if (normalized.startsWith("existing -> proof")) return "Live — proof page"
  if (normalized.startsWith("existing -> supporting")) return "Live — supporting page"
  if (normalized.startsWith("existing -> interactive")) return "Live — interactive proof"
  if (normalized.startsWith("existing -> flagship")) return "Live — flagship"
  if (normalized === "existing") return "Live"
  if (normalized === "new") return "Not started"
  return status
}

/**
 * Deduplicated opportunity candidates: workbook Master_Matrix rows plus
 * idea-kind inventory records, keyed by URL (falling back to id) so the same
 * concept is never counted twice across overlapping sheets.
 */
export function uniqueOpportunityRows(rows: ContentOpsRow[]): ContentOpsRow[] {
  const seen = new Set<string>()
  const unique: ContentOpsRow[] = []
  for (const row of rows) {
    const key = row.url && row.url !== "" ? row.url : `id:${row.id}`
    if (seen.has(key)) continue
    seen.add(key)
    unique.push(row)
  }
  return unique
}
