export const CONTENT_WORKFLOW_STATUSES = [
  "planned",
  "queued",
  "research_ready",
  "in_progress",
  "review",
  "approved",
  "pr_open",
  "merged",
  "deployed",
  "live",
  "blocked",
  "archived",
] as const

export type ContentWorkflowStatus = (typeof CONTENT_WORKFLOW_STATUSES)[number]

export type WorkbookSheetName =
  | "Dashboard"
  | "Master_Matrix"
  | "Title_Decisions"
  | "Topic_Graph"
  | "Programmatic"
  | "Interactive_Assets"
  | "Sources"

export type WorkbookRecord = Record<string, string | number>

export type WorkbookDataset = {
  source: string
  sheetOrder: WorkbookSheetName[]
  metadata: Record<
    WorkbookSheetName,
    {
      headerRow: number
      headers: string[]
      rowCount: number
    }
  >
  sheets: Record<WorkbookSheetName, WorkbookRecord[]>
}

export type ContentInventoryKind =
  | "post"
  | "project"
  | "dashboard"
  | "glossary"
  | "idea"
  | "hub"

export type ContentInventoryRecord = {
  id: string
  title: string
  status: string
  workflowStatus: ContentWorkflowStatus
  kind: ContentInventoryKind
  pageClass: string
  pillar: string
  cluster: string
  url: string
  format: string
  audienceSegment: string
  intent: string
  discoveryMode: string
  coreJtbd: string
  differentiationAngle: string
  evidence: string
  parentHubs: string[]
  nextSteps: string[]
  indexation: string
  priority: string
  effort: string
  impact: string
  primaryKpi: string
  notes: string
  tags: string[]
  relatedIds: string[]
  sourceType: "existing_content" | "derived_opportunity" | "hub_page" | "glossary_page"
  sourcePath?: string
  sourceSlug?: string
  derivedFrom?: string[]
  heroLabel?: string
}

export type ContentOpsRow = {
  id: string
  title: string
  tab: WorkbookSheetName | "Existing_Content"
  kind: ContentInventoryKind | "workbook"
  workflowStatus: ContentWorkflowStatus
  status: string
  pageClass?: string
  pillar?: string
  cluster?: string
  url?: string
  format?: string
  audienceSegment?: string
  intent?: string
  discoveryMode?: string
  priority?: string
  impact?: string
  indexation?: string
  tags?: string[]
  notes?: string
  sourceType: string
  metrics?: ContentOpsMetrics
  record: Record<string, string | number | string[] | undefined>
}

export type ContentOpsMetrics = {
  impressions?: number
  clicks?: number
  ctr?: number
  averagePosition?: number
  activeUsers?: number
  screenPageViews?: number
  engagementDuration?: number
}

export type ResearchPack = {
  id: string
  assetId: string
  provider: "fallback" | "brave" | "openrouter" | "minimax"
  generatedAt: string
  status: "ready" | "missing_provider"
  queryCluster: string[]
  competingAngles: string[]
  sourceSummaries: Array<{
    title: string
    url: string
    summary: string
  }>
  recommendedStructure: string[]
  risks: string[]
  relatedInternalContent: string[]
  recommendedInternalLinks: string[]
  seoSuggestions: string[]
}

export type ContentOpsState = {
  workflow: Record<string, ContentWorkflowStatus>
  derived: Record<string, boolean>
  researchPacks: Record<string, ResearchPack>
  drafts: Record<
    string,
    {
      assetId: string
      slug: string
      path: string
      updatedAt: string
    }
  >
}

export type ContentOpsCapabilities = {
  workflowWritesEnabled: boolean
  draftFileEditingEnabled: boolean
  deploymentMode: "local" | "hosted"
  reason?: string
}
