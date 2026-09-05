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

export function computeDashboardCounts(allRows: ContentOpsRow[]): DashboardCounts {
  return {
    needsAttention: needsAttention(allRows).length,
    opportunities: activeOpportunities(allRows).length,
    liveTracked: allRows.filter((row) => isPublishedRow(row)).length,
    inFlight: inFlightRows(allRows).length,
  }
}
