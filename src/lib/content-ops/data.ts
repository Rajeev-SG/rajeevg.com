import "server-only"

import workbookData from "@/data/content-ops/workbook.json"
import { getExistingContentInventory } from "@/lib/content-ops/content-audit"
import { generateResearchPack, getResearchProviderOptions } from "@/lib/content-ops/research"
import { readContentOpsState, updateContentOpsState } from "@/lib/content-ops/state-store"
import type {
  ContentOpsCapabilities,
  ContentInventoryRecord,
  ContentOpsMetrics,
  ContentOpsRow,
  ContentWorkflowStatus,
  WorkbookDataset,
  WorkbookSheetName,
} from "@/lib/content-ops/types"
import { getGa4SiteAnalyticsDashboard } from "@/lib/ga4-site-reporting"
import { getSearchConsoleMetricsByPage } from "@/lib/content-ops/search-console"

const workbook = workbookData as WorkbookDataset

export function getContentOpsCapabilities(): ContentOpsCapabilities {
  const hosted = Boolean(process.env.VERCEL)
  const hasDatabase = Boolean(process.env.CONTENT_OPS_DATABASE_URL)

  if (!hosted) {
    return {
      workflowWritesEnabled: true,
      draftFileEditingEnabled: true,
      deploymentMode: "local",
    }
  }

  return {
    workflowWritesEnabled: hasDatabase,
    draftFileEditingEnabled: false,
    deploymentMode: "hosted",
    reason: hasDatabase
      ? "Hosted dashboard can persist workflow state, but repo-backed file editing is disabled in preview and production."
      : "Hosted preview is running in read-only mode because durable content-ops storage is not configured.",
  }
}

function splitList(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return []
  return value
    .split(";")
    .map((item) => item.trim())
    .filter(Boolean)
}

function toInventoryRow(record: ContentInventoryRecord, workflowState: Record<string, ContentWorkflowStatus>): ContentOpsRow {
  return {
    id: record.id,
    title: record.title,
    tab: "Existing_Content",
    kind: record.kind,
    workflowStatus: workflowState[record.id] || record.workflowStatus,
    status: record.status,
    pageClass: record.pageClass,
    pillar: record.pillar,
    cluster: record.cluster,
    url: record.url,
    format: record.format,
    audienceSegment: record.audienceSegment,
    intent: record.intent,
    discoveryMode: record.discoveryMode,
    priority: record.priority,
    impact: record.impact,
    indexation: record.indexation,
    tags: record.tags,
    notes: record.notes,
    sourceType: record.sourceType,
    record,
  }
}

function toMasterMatrixRows(workflowState: Record<string, ContentWorkflowStatus>) {
  return workbook.sheets.Master_Matrix.map((row) => ({
    id: String(row.Asset_ID),
    title: String(row.Working_Title),
    tab: "Master_Matrix" as const,
    kind: "workbook" as const,
    workflowStatus: (workflowState[String(row.Asset_ID)] || "planned") as ContentWorkflowStatus,
    status: String(row.Asset_Status || "Planned"),
    pageClass: String(row.Page_Class || ""),
    pillar: String(row.Pillar || ""),
    cluster: String(row.Cluster || ""),
    url: String(row.Recommended_URL || ""),
    format: String(row.Format || ""),
    audienceSegment: String(row.Audience_Segment || ""),
    intent: String(row.Intent || ""),
    discoveryMode: String(row.Discovery_Mode || ""),
    priority: String(row.Priority || ""),
    impact: String(row.Impact || ""),
    indexation: String(row.Indexation || ""),
    notes: String(row.Differentiation_Angle || ""),
    sourceType: "workbook",
    record: row,
  }))
}

function toGenericSheetRows(tab: WorkbookSheetName): ContentOpsRow[] {
  return workbook.sheets[tab].map((row, index) => ({
    id: `${tab}-${index + 1}`,
    title:
      String(
        row.Working_Title ||
          row.Recommended_title ||
          row.Node_Label ||
          row.Page_type ||
          row.Interactive_asset ||
          row.URL ||
          row.Raw_title ||
          row.Source_ID ||
          tab
      ) || tab,
    tab,
    kind: "workbook",
    workflowStatus: "planned",
    status: "Reference",
    sourceType: "workbook",
    record: row,
  }))
}

async function getAnalyticsMetrics(): Promise<Record<string, ContentOpsMetrics>> {
  try {
    const [dashboard, searchConsoleByPage] = await Promise.all([
      getGa4SiteAnalyticsDashboard(),
      getSearchConsoleMetricsByPage(),
    ])
    const byPath = new Map(
      [...dashboard.topContent, ...dashboard.topBlogPosts].map((row) => [
        row.pagePath,
        {
          activeUsers: row.activeUsers,
          screenPageViews: row.screenPageViews,
          engagementDuration: row.userEngagementDuration,
        } satisfies ContentOpsMetrics,
      ])
    )

    for (const [pagePath, metrics] of Object.entries(searchConsoleByPage)) {
      byPath.set(pagePath, {
        ...(byPath.get(pagePath) || {}),
        ...metrics,
      })
    }

    return Object.fromEntries(byPath.entries())
  } catch {
    return {}
  }
}

export async function getContentOpsData() {
  const state = await readContentOpsState()
  const inventory = getExistingContentInventory()
  const inventoryRows = inventory.map((record) => toInventoryRow(record, state.workflow))
  const masterRows = toMasterMatrixRows(state.workflow)

  const tabs: Record<string, ContentOpsRow[]> = {
    Dashboard: [],
    Master_Matrix: [...masterRows, ...inventoryRows],
    Existing_Content: inventoryRows,
    Title_Decisions: toGenericSheetRows("Title_Decisions"),
    Topic_Graph: toGenericSheetRows("Topic_Graph"),
    Programmatic: toGenericSheetRows("Programmatic"),
    Interactive_Assets: toGenericSheetRows("Interactive_Assets"),
    Sources: toGenericSheetRows("Sources"),
  }

  const analyticsMetrics = await getAnalyticsMetrics()

  const enrichedInventory = inventoryRows.map((row) => ({
    ...row,
    metrics: row.url ? analyticsMetrics[row.url] : undefined,
  }))

  return {
    workbook,
    tabs: {
      ...tabs,
      Existing_Content: enrichedInventory,
      Master_Matrix: [...masterRows, ...enrichedInventory],
    },
    inventory,
    hubs: inventory.filter((record) => record.kind === "hub"),
    glossary: inventory.filter((record) => record.kind === "glossary"),
    queuedIdeas: inventory.filter((record) => record.kind === "idea"),
    interactiveAssets: inventory.filter(
      (record) => record.kind === "dashboard" || record.pageClass === "Interactive asset"
    ),
    capabilities: getContentOpsCapabilities(),
    providerOptions: getResearchProviderOptions(),
    summary: {
      totalStrategyAssets: workbook.sheets.Master_Matrix.length,
      totalTrackedContent: inventory.length,
      queuedIdeas: inventory.filter((record) => record.workflowStatus === "queued").length,
      liveAssets: inventory.filter((record) => (state.workflow[record.id] || record.workflowStatus) === "live")
        .length,
      glossaryNodes: inventory.filter((record) => record.kind === "glossary").length,
      interactiveAssets: inventory.filter(
        (record) => record.kind === "dashboard" || record.pageClass === "Interactive asset"
      ).length,
    },
  }
}

export async function getContentOpsAsset(assetId: string) {
  const data = await getContentOpsData()
  const asset = data.inventory.find((record) => record.id === assetId)
  if (!asset) return null

  const state = await readContentOpsState()
  return {
    asset,
    workflowStatus: state.workflow[asset.id] || asset.workflowStatus,
    derived: Boolean(state.derived[asset.id]),
    researchPack: state.researchPacks[asset.id] || null,
    draft: state.drafts[asset.id] || null,
    capabilities: data.capabilities,
    providerOptions: getResearchProviderOptions(),
  }
}

export async function saveAssetWorkflow(assetId: string, workflowStatus: ContentWorkflowStatus) {
  return updateContentOpsState((state) => ({
    ...state,
    workflow: {
      ...state.workflow,
      [assetId]: workflowStatus,
    },
  }))
}

export async function markAssetDerived(assetId: string) {
  return updateContentOpsState((state) => ({
    ...state,
    derived: {
      ...state.derived,
      [assetId]: true,
    },
  }))
}

export async function createResearchPack(assetId: string, provider: "fallback" | "brave" | "openrouter" | "minimax") {
  const asset = getExistingContentInventory().find((record) => record.id === assetId)
  if (!asset) {
    throw new Error(`Unknown asset: ${assetId}`)
  }

  const pack = await generateResearchPack(asset, provider)

  await updateContentOpsState((state) => ({
    ...state,
    workflow: {
      ...state.workflow,
      [assetId]:
        state.workflow[assetId] && state.workflow[assetId] !== "planned"
          ? state.workflow[assetId]
          : "research_ready",
    },
    researchPacks: {
      ...state.researchPacks,
      [assetId]: pack,
    },
  }))

  return pack
}

export function getHubRoutes() {
  return getExistingContentInventory().filter((record) => record.kind === "hub")
}

export function getGlossaryRoutes() {
  return getExistingContentInventory().filter((record) => record.kind === "glossary")
}

export function getHubBySlug(slug: string) {
  return getExistingContentInventory().find(
    (record) => record.kind === "hub" && record.url.replace(/^\//, "") === slug
  )
}

export function getGlossaryBySlug(slug: string) {
  return getExistingContentInventory().find(
    (record) => record.kind === "glossary" && record.url.replace(/^\/glossary\//, "") === slug
  )
}

export function getContentInventoryBySlug(slug: string) {
  return getExistingContentInventory().find((record) => record.sourceSlug === slug)
}

export function getRelatedContent(record: ContentInventoryRecord) {
  const inventory = getExistingContentInventory()
  const related = new Set([...record.relatedIds, ...record.parentHubs, ...record.nextSteps])

  return inventory.filter(
    (item) =>
      item.id !== record.id &&
      (related.has(item.id) || related.has(item.url) || item.pillar === record.pillar || item.cluster === record.cluster)
  )
}

export function getWorkbookList(field: string, tab: WorkbookSheetName) {
  return workbook.sheets[tab]
    .map((row) => row[field])
    .filter((value): value is string => typeof value === "string" && Boolean(value))
}

export function getParentHubUrls(record: ContentInventoryRecord) {
  return splitList(record.parentHubs.join(";"))
}
