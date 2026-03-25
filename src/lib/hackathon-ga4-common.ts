import "server-only"

import { BetaAnalyticsDataClient, type protos } from "@google-analytics/data"

export const DEFAULT_PROPERTY_ID = "498363924"
const DEFAULT_HACKATHON_STREAM_ID = "14214480224"
const DEFAULT_HACKATHON_HOSTNAME = "vote.rajeevg.com"
const DEFAULT_CREDENTIALS_PATH = "/Users/rajeev/.codex/auth/google/ga4-mcp-personal-gws-1.json"

export const HACKATHON_HISTORICAL_WINDOW = "Last 30 days including today"
export const HACKATHON_REPORTING_DATE_RANGE = {
  startDate: "30daysAgo",
  endDate: "today",
  name: "Last30Days",
} as const

export const HACKATHON_EVENT_NAMES = [
  "judge_auth_dialog_opened",
  "judge_auth_email_requested",
  "judge_auth_email_request_failed",
  "judge_auth_completed",
  "judge_auth_verify_failed",
  "judge_auth_google_started",
  "judge_auth_google_failed",
  "vote_dialog_viewed",
  "vote_score_selected",
  "vote_submit_started",
  "vote_submitted",
  "vote_submit_failed",
  "competition_state_snapshot",
  "competition_round_started",
  "competition_round_start_failed",
  "competition_round_finalized",
  "competition_round_finalize_failed",
  "competition_round_reset",
  "competition_round_reset_failed",
  "entry_voting_state_changed",
  "entry_voting_state_change_failed",
  "workbook_picker_opened",
  "workbook_upload_started",
  "workbook_upload_completed",
  "workbook_upload_failed",
  "scoreboard_view_changed",
  "scoreboard_summary_toggled",
] as const

export const MANAGER_EVENT_NAMES = [
  "workbook_picker_opened",
  "workbook_upload_started",
  "workbook_upload_completed",
  "workbook_upload_failed",
  "entry_voting_state_changed",
  "entry_voting_state_change_failed",
  "competition_round_started",
  "competition_round_start_failed",
  "competition_round_finalized",
  "competition_round_finalize_failed",
  "competition_round_reset",
  "competition_round_reset_failed",
] as const

export const HACKATHON_BREAKDOWN_EVENT_NAMES = [
  ...HACKATHON_EVENT_NAMES,
  "page_context",
  "page_engagement_summary",
  "section_view",
  "consent_state_updated",
] as const

export const HACKATHON_VOTING_EVENT_NAMES = [
  "vote_dialog_viewed",
  "vote_score_selected",
  "vote_submit_started",
  "vote_submitted",
  "vote_submit_failed",
] as const

export const HACKATHON_EXPERIENCE_EVENT_NAMES = [
  "page_context",
  "page_engagement_summary",
  "scoreboard_summary_toggled",
  "scoreboard_view_changed",
  "section_view",
] as const

export type ReportRow = protos.google.analytics.data.v1beta.IRow
export type RunReportResponse = protos.google.analytics.data.v1beta.IRunReportResponse

let analyticsClient: BetaAnalyticsDataClient | null = null

function cleanEnvValue(value: string | undefined) {
  return value?.trim()
}

export function getHackathonPropertyId() {
  return cleanEnvValue(process.env.GA4_PROPERTY_ID) || DEFAULT_PROPERTY_ID
}

export function getHackathonStreamId() {
  return cleanEnvValue(process.env.GA4_HACKATHON_STREAM_ID) || DEFAULT_HACKATHON_STREAM_ID
}

export function getHackathonHostname() {
  return cleanEnvValue(process.env.GA4_HACKATHON_HOSTNAME) || DEFAULT_HACKATHON_HOSTNAME
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

export function getHackathonAnalyticsClient() {
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

export function dimensionValue(row: ReportRow | undefined, index: number) {
  return row?.dimensionValues?.[index]?.value ?? ""
}

export function metricValue(row: ReportRow | undefined, index: number) {
  return Number(row?.metricValues?.[index]?.value ?? 0)
}

export function exactStringFilter(fieldName: string, value: string) {
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

export function inListFilter(fieldName: string, values: readonly string[]) {
  return {
    filter: {
      fieldName,
      inListFilter: {
        values: [...values],
        caseSensitive: true,
      },
    },
  }
}

export function andFilter(expressions: object[]) {
  return { andGroup: { expressions } }
}

export async function runHackathonGa4Report(
  request: Omit<protos.google.analytics.data.v1beta.IRunReportRequest, "property">,
) {
  const client = getHackathonAnalyticsClient()
  const [response] = await client.runReport({
    property: `properties/${getHackathonPropertyId()}`,
    ...request,
  })

  return response
}
