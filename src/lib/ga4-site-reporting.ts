import "server-only"

import { BetaAnalyticsDataClient, type protos } from "@google-analytics/data"
import { unstable_noStore as noStore } from "next/cache"

import type {
  SiteAnalyticsDashboard,
  SiteDeviceMixRow,
  SiteKeyEventRow,
  SiteOverviewMetrics,
  SitePagePerformanceRow,
  SiteRealtimeEventRow,
} from "@/lib/ga4-site-reporting-types"

const DEFAULT_PROPERTY_ID = "498363924"
const DEFAULT_STREAM_ID = "11542983613"
const DEFAULT_SITE_HOSTNAME = "rajeevg.com"
const DEFAULT_CREDENTIALS_PATH = "/Users/rajeev/.codex/auth/google/ga4-mcp-personal-gws-1.json"

const TRACKED_CUSTOM_EVENTS = [
  "page_context",
  "post_click",
  "project_click",
  "copy_code",
  "blog_search",
  "page_engagement_summary",
  "scroll_depth",
  "article_progress",
  "article_complete",
  "section_view",
  "engaged_time",
  "contact_click",
  "profile_click",
  "consent_state_updated",
]

const PROMOTED_DIMENSIONS = [
  "page_type",
  "site_section",
  "content_group",
  "content_type",
  "content_id",
  "content_tags",
  "viewport_category",
  "analytics_consent_state",
  "referrer_type",
  "section_name",
  "item_type",
  "link_type",
  "destination",
  "selected_tags",
  "search_term",
  "consent_preference",
  "theme_to",
  "content_slug",
  "analytics_section",
  "theme",
  "color_scheme",
  "screen_orientation",
  "consent_rehydrated",
  "filter_state",
]

const PROMOTED_METRICS = [
  "route_depth",
  "query_param_count",
  "tag_count",
  "project_count",
  "selected_tag_count",
  "search_term_length",
  "interaction_sequence",
  "copied_characters",
  "engaged_seconds",
  "engaged_seconds_total",
  "interaction_count",
  "section_views_count",
  "max_scroll_depth_percent",
  "max_article_progress_percent",
  "result_count",
  "scroll_depth_percent",
  "article_progress_percent",
  "page_view_sequence",
]

const PORTFOLIO_KEY_EVENTS = ["contact_click", "project_click", "profile_click"]

type ReportRow = protos.google.analytics.data.v1beta.IRow
type RunReportResponse = protos.google.analytics.data.v1beta.IRunReportResponse
type RunRealtimeReportResponse = protos.google.analytics.data.v1beta.IRunRealtimeReportResponse

let analyticsClient: BetaAnalyticsDataClient | null = null

function cleanEnvValue(value: string | undefined) {
  return value?.trim()
}

function getPropertyId() {
  return cleanEnvValue(process.env.GA4_PROPERTY_ID) || DEFAULT_PROPERTY_ID
}

function getStreamId() {
  return cleanEnvValue(process.env.GA4_SITE_STREAM_ID) || DEFAULT_STREAM_ID
}

function getSiteHostname() {
  return cleanEnvValue(process.env.GA4_SITE_HOSTNAME) || DEFAULT_SITE_HOSTNAME
}

function parseInlineCredentials() {
  const inlineCredentials =
    cleanEnvValue(process.env.GA4_SERVICE_ACCOUNT_JSON) ||
    cleanEnvValue(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON)

  if (!inlineCredentials) return null

  return JSON.parse(inlineCredentials) as {
    client_email: string
    private_key: string
    project_id?: string
  }
}

function getAnalyticsClient() {
  if (analyticsClient) return analyticsClient

  const inlineCredentials = parseInlineCredentials()
  if (inlineCredentials) {
    analyticsClient = new BetaAnalyticsDataClient({
      credentials: inlineCredentials,
      projectId: inlineCredentials.project_id,
    })
    return analyticsClient
  }

  const keyFilename =
    cleanEnvValue(process.env.GA4_SERVICE_ACCOUNT_PATH) ||
    cleanEnvValue(process.env.GOOGLE_APPLICATION_CREDENTIALS) ||
    DEFAULT_CREDENTIALS_PATH

  analyticsClient = new BetaAnalyticsDataClient({ keyFilename })
  return analyticsClient
}

function exactStringFilter(fieldName: string, value: string) {
  return {
    filter: {
      fieldName,
      stringFilter: {
        matchType: "EXACT" as const,
        value,
        caseSensitive: false,
      },
    },
  }
}

function beginsWithFilter(fieldName: string, value: string) {
  return {
    filter: {
      fieldName,
      stringFilter: {
        matchType: "BEGINS_WITH" as const,
        value,
        caseSensitive: false,
      },
    },
  }
}

function inListFilter(fieldName: string, values: string[]) {
  return {
    filter: {
      fieldName,
      inListFilter: {
        values,
        caseSensitive: true,
      },
    },
  }
}

function dimensionValue(row: ReportRow | undefined, index: number) {
  return row?.dimensionValues?.[index]?.value ?? ""
}

function metricValue(row: ReportRow | undefined, index: number) {
  return Number(row?.metricValues?.[index]?.value ?? 0)
}

function sortByViews(rows: SitePagePerformanceRow[]) {
  return rows.sort((left, right) => right.screenPageViews - left.screenPageViews)
}

async function runReport(
  request: Omit<protos.google.analytics.data.v1beta.IRunReportRequest, "property">
) {
  const client = getAnalyticsClient()
  const [response] = await client.runReport({
    property: `properties/${getPropertyId()}`,
    ...request,
  })
  return response
}

async function runRealtimeReport(
  request: Omit<protos.google.analytics.data.v1beta.IRunRealtimeReportRequest, "property">
) {
  const client = getAnalyticsClient()
  const [response] = await client.runRealtimeReport({
    property: `properties/${getPropertyId()}`,
    ...request,
  })
  return response
}

function buildOverviewMetrics(
  overviewResponse: RunReportResponse,
  blogResponse: RunReportResponse,
  projectsResponse: RunReportResponse
): SiteOverviewMetrics {
  const overviewRow = overviewResponse.rows?.[0]
  const blogRows = blogResponse.rows ?? []
  const projectRows = projectsResponse.rows ?? []

  return {
    screenPageViews: metricValue(overviewRow, 0),
    sessions: metricValue(overviewRow, 1),
    activeUsers: metricValue(overviewRow, 2),
    userEngagementDuration: metricValue(overviewRow, 3),
    blogScreenPageViews: blogRows.reduce((sum, row) => sum + metricValue(row, 0), 0),
    projectScreenPageViews: projectRows.reduce((sum, row) => sum + metricValue(row, 0), 0),
  }
}

function mapPagePerformanceRows(response: RunReportResponse): SitePagePerformanceRow[] {
  return sortByViews(
    (response.rows ?? [])
      .map((row) => ({
        pagePath: dimensionValue(row, 0),
        pageTitle: dimensionValue(row, 1),
        screenPageViews: metricValue(row, 0),
        activeUsers: metricValue(row, 1),
        userEngagementDuration: metricValue(row, 2),
      }))
      .filter((row) => row.pagePath)
  )
}

function mapDeviceRows(response: RunReportResponse): SiteDeviceMixRow[] {
  return (response.rows ?? [])
    .map((row) => ({
      deviceCategory: dimensionValue(row, 0) || "unknown",
      activeUsers: metricValue(row, 0),
      screenPageViews: metricValue(row, 1),
      userEngagementDuration: metricValue(row, 2),
    }))
    .filter((row) => row.activeUsers || row.screenPageViews)
}

function mapKeyEventRows(response: RunReportResponse): SiteKeyEventRow[] {
  return (response.rows ?? [])
    .map((row) => ({
      eventName: dimensionValue(row, 0),
      eventCount: metricValue(row, 0),
      keyEvents: metricValue(row, 1),
    }))
    .filter((row) => row.eventName)
}

function mapRealtimeRows(response: RunRealtimeReportResponse): SiteRealtimeEventRow[] {
  const totals = new Map<string, number>()

  for (const row of response.rows ?? []) {
    const eventName = dimensionValue(row, 0)
    if (!eventName) continue

    totals.set(eventName, (totals.get(eventName) ?? 0) + metricValue(row, 0))
  }

  return Array.from(totals.entries())
    .map(([eventName, eventCount]) => ({ eventName, eventCount }))
    .sort((left, right) => right.eventCount - left.eventCount)
}

export async function getGa4SiteAnalyticsDashboard(): Promise<SiteAnalyticsDashboard> {
  noStore()

  const siteHostname = getSiteHostname()
  const propertyId = getPropertyId()
  const streamId = getStreamId()

  try {
    const [overviewResponse, topContentResponse, topBlogPostsResponse, deviceResponse, keyEventsResponse, realtimeResponse, blogTotalsResponse, projectTotalsResponse] =
      await Promise.all([
        runReport({
          dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
          dimensions: [{ name: "hostName" }],
          metrics: [
            { name: "screenPageViews" },
            { name: "sessions" },
            { name: "activeUsers" },
            { name: "userEngagementDuration" },
          ],
          dimensionFilter: exactStringFilter("hostName", siteHostname),
        }),
        runReport({
          dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
          dimensions: [{ name: "pagePath" }, { name: "pageTitle" }],
          metrics: [
            { name: "screenPageViews" },
            { name: "activeUsers" },
            { name: "userEngagementDuration" },
          ],
          dimensionFilter: exactStringFilter("hostName", siteHostname),
          orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
          limit: 12,
        }),
        runReport({
          dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
          dimensions: [{ name: "pagePath" }, { name: "pageTitle" }],
          metrics: [
            { name: "screenPageViews" },
            { name: "activeUsers" },
            { name: "userEngagementDuration" },
          ],
          dimensionFilter: {
            andGroup: {
              expressions: [
                exactStringFilter("hostName", siteHostname),
                beginsWithFilter("pagePath", "/blog"),
              ],
            },
          },
          orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
          limit: 12,
        }),
        runReport({
          dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
          dimensions: [{ name: "deviceCategory" }],
          metrics: [
            { name: "activeUsers" },
            { name: "screenPageViews" },
            { name: "userEngagementDuration" },
          ],
          dimensionFilter: exactStringFilter("hostName", siteHostname),
          orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
          limit: 5,
        }),
        runReport({
          dateRanges: [{ startDate: "90daysAgo", endDate: "today" }],
          dimensions: [{ name: "eventName" }],
          metrics: [{ name: "eventCount" }, { name: "keyEvents" }],
          dimensionFilter: {
            andGroup: {
              expressions: [
                exactStringFilter("hostName", siteHostname),
                inListFilter("eventName", PORTFOLIO_KEY_EVENTS),
              ],
            },
          },
          orderBys: [{ metric: { metricName: "eventCount" }, desc: true }],
          limit: PORTFOLIO_KEY_EVENTS.length,
        }),
        runRealtimeReport({
          dimensions: [{ name: "eventName" }, { name: "streamId" }, { name: "minutesAgo" }],
          metrics: [{ name: "eventCount" }],
          dimensionFilter: {
            andGroup: {
              expressions: [
                exactStringFilter("streamId", streamId),
                inListFilter("eventName", TRACKED_CUSTOM_EVENTS),
              ],
            },
          },
          orderBys: [{ metric: { metricName: "eventCount" }, desc: true }],
          limit: 20,
        }),
        runReport({
          dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
          dimensions: [{ name: "pagePath" }, { name: "pageTitle" }],
          metrics: [
            { name: "screenPageViews" },
            { name: "activeUsers" },
            { name: "userEngagementDuration" },
          ],
          dimensionFilter: {
            andGroup: {
              expressions: [
                exactStringFilter("hostName", siteHostname),
                beginsWithFilter("pagePath", "/blog"),
              ],
            },
          },
          limit: 50,
        }),
        runReport({
          dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
          dimensions: [{ name: "pagePath" }, { name: "pageTitle" }],
          metrics: [
            { name: "screenPageViews" },
            { name: "activeUsers" },
            { name: "userEngagementDuration" },
          ],
          dimensionFilter: {
            andGroup: {
              expressions: [
                exactStringFilter("hostName", siteHostname),
                beginsWithFilter("pagePath", "/projects"),
              ],
            },
          },
          limit: 50,
        }),
      ])

    const realtimeRows = mapRealtimeRows(realtimeResponse)
    const topContent = mapPagePerformanceRows(topContentResponse)
    const topBlogPosts = mapPagePerformanceRows(topBlogPostsResponse)

    return {
      dataSource: "live",
      generatedAt: new Date().toISOString(),
      propertyId,
      streamId,
      siteHostname,
      historicalWindow: "Last 30 days",
      realtimeWindow: "Last 30 minutes",
      notes: [
        "Historical cards are filtered to hostName=rajeevg.com so the shared property does not blend in vote.rajeevg.com page traffic.",
        "Realtime custom-event cards are filtered to the main-site stream ID so the app-owned site schema stays front and center.",
        realtimeRows.length > 0
          ? "Realtime confirms the site-owned custom event vocabulary is landing right now, even when the standard report layer is still thin."
          : "No tracked custom events are visible in realtime right now. The dashboard still keeps the schema and historical page reporting visible while traffic is quiet.",
      ],
      overview: buildOverviewMetrics(overviewResponse, blogTotalsResponse, projectTotalsResponse),
      topContent,
      topBlogPosts,
      deviceMix: mapDeviceRows(deviceResponse),
      keyEvents: mapKeyEventRows(keyEventsResponse),
      realtimeCustomEvents: realtimeRows,
      trackedCustomEvents: TRACKED_CUSTOM_EVENTS,
      promotedDimensions: PROMOTED_DIMENSIONS,
      promotedMetrics: PROMOTED_METRICS,
      portfolioKeyEvents: PORTFOLIO_KEY_EVENTS,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Google Analytics Data API error"

    return {
      dataSource: "fallback",
      generatedAt: new Date().toISOString(),
      propertyId,
      streamId,
      siteHostname,
      historicalWindow: "Last 30 days",
      realtimeWindow: "Last 30 minutes",
      notes: [
        "The GA4 dashboard could not reach the reporting API from this runtime.",
        message,
        "Set GA4_SERVICE_ACCOUNT_JSON in Vercel for live server-side reporting, or fall back to the local key file for development.",
      ],
      overview: {
        screenPageViews: 0,
        sessions: 0,
        activeUsers: 0,
        userEngagementDuration: 0,
        blogScreenPageViews: 0,
        projectScreenPageViews: 0,
      },
      topContent: [],
      topBlogPosts: [],
      deviceMix: [],
      keyEvents: [],
      realtimeCustomEvents: [],
      trackedCustomEvents: TRACKED_CUSTOM_EVENTS,
      promotedDimensions: PROMOTED_DIMENSIONS,
      promotedMetrics: PROMOTED_METRICS,
      portfolioKeyEvents: PORTFOLIO_KEY_EVENTS,
    }
  }
}
