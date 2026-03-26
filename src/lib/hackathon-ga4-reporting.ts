import "server-only"

import { unstable_noStore as noStore } from "next/cache"

import { getModeledTableRowCounts, getRawExportTableCount } from "@/lib/hackathon-bigquery"
import { getDummyHackathonAnalyticsDataset } from "@/lib/hackathon-reporting-dummy"
import {
  describeHackathonVoteTruthReconciliation,
  getHackathonEventDay,
  getHackathonVoteTruth,
} from "@/lib/hackathon-vote-truth"
import type {
  HackathonGaConsentSummary,
  HackathonGaDefinition,
  HackathonGaEntryRow,
  HackathonGaEventRow,
  HackathonGaOverview,
  HackathonGaReport,
} from "@/lib/hackathon-ga4-reporting-types"
import {
  HACKATHON_EVENT_NAMES,
  MANAGER_EVENT_NAMES,
  RunReportResponse,
  andFilter,
  buildHackathonReportingDateRange,
  describeHackathonReportingWindow,
  dimensionValue,
  exactStringFilter,
  getHackathonHostname,
  getHackathonPropertyId,
  getHackathonStreamId,
  inListFilter,
  metricValue,
  runHackathonGa4Report,
} from "@/lib/hackathon-ga4-common"

const DEFINITIONS: HackathonGaDefinition[] = [
  {
    key: "customEvent:competition_status",
    label: "Judging state",
    type: "dimension",
    meaning: "The judging phase the app was in when the event fired.",
    typicalValues: "preparing, open, finalized",
    interpretation: "Use this to separate setup activity, live judging, and post-results viewing.",
  },
  {
    key: "customEvent:viewer_role",
    label: "Viewer role",
    type: "dimension",
    meaning: "The kind of visitor the app believed it was serving when the event fired.",
    typicalValues: "public, judge, manager",
    interpretation: "Use this to separate public traffic from judges and the organiser account.",
  },
  {
    key: "customEvent:entry_name",
    label: "Entry name",
    type: "dimension",
    meaning: "The project name attached to a scoring or voting event.",
    typicalValues: "What's My Frog, ModelLens, Brief It",
    interpretation: "Use this for human-readable labels in entry-level reporting.",
  },
  {
    key: "customEvent:entry_slug",
    label: "Entry slug",
    type: "dimension",
    meaning: "The stable identifier for a hackathon project.",
    typicalValues: "what-s-my-frog, modellens, brief-it",
    interpretation: "Use this to join related events for the same project even when labels vary slightly.",
  },
  {
    key: "customEvent:analytics_consent_state",
    label: "Analytics consent state",
    type: "dimension",
    meaning: "Whether the event reached GA4 with consent marked as granted or denied.",
    typicalValues: "granted, denied, blank",
    interpretation: "Blank does not mean a third user choice. It means GA4 stored the event without this parameter value.",
  },
  {
    key: "customEvent:consent_preference",
    label: "Consent preference",
    type: "dimension",
    meaning: "The explicit preference recorded when a consent-change event fired.",
    typicalValues: "granted, denied",
    interpretation: "Use this only on consent_state_updated events, not as a general session-level consent flag.",
  },
  {
    key: "customEvent:consent_source",
    label: "Consent source",
    type: "dimension",
    meaning: "Which UI route or control produced the consent change.",
    typicalValues: "default, banner_accept, banner_decline, preferences",
    interpretation: "Use this to see where people actually made or changed their consent choice.",
  },
  {
    key: "customEvent:entry_voting_open",
    label: "Entry open for voting",
    type: "dimension",
    meaning: "Whether the specific project was open to new votes when the event fired.",
    typicalValues: "true, false",
    interpretation: "Use this to distinguish normal scoring opportunities from closed or paused states.",
  },
  {
    key: "customEvent:viewer_can_vote",
    label: "Viewer eligible to vote",
    type: "dimension",
    meaning: "Whether the signed-in viewer was allowed to vote on the project tied to the event.",
    typicalValues: "true, false",
    interpretation: "Use this to separate real vote opportunities from blocked states.",
  },
  {
    key: "customEvent:viewer_has_vote",
    label: "Viewer already voted",
    type: "dimension",
    meaning: "Whether the viewer had already submitted their locked score for that project.",
    typicalValues: "true, false",
    interpretation: "Use this to separate fresh vote opportunities from already-finished judging.",
  },
  {
    key: "customEvent:analytics_section",
    label: "App section",
    type: "dimension",
    meaning: "Which part of the product emitted the event.",
    typicalValues: "scoreboard, vote_dialog, judge_auth, manager_controls",
    interpretation: "Use this to understand where activity happened inside the app.",
  },
  {
    key: "customEvent:viewport_category",
    label: "Device layout",
    type: "dimension",
    meaning: "The responsive layout bucket the app assigned to the session.",
    typicalValues: "mobile, tablet, desktop",
    interpretation: "Use this to compare behavior across phone and desktop layouts.",
  },
  {
    key: "customEvent:upload_method",
    label: "Upload method",
    type: "dimension",
    meaning: "How the organiser chose the workbook file.",
    typicalValues: "click, drag_drop",
    interpretation: "Use this only for workbook management events.",
  },
  {
    key: "customEvent:score",
    label: "Vote score",
    type: "metric",
    meaning: "The single 0 to 10 score chosen in a vote event.",
    typicalValues: "0-10 points",
    interpretation: "Use this for average-score and score-distribution analysis.",
  },
  {
    key: "customEvent:aggregate_score",
    label: "Total score snapshot",
    type: "metric",
    meaning: "The running total score bundled into certain event payloads.",
    typicalValues: "score points",
    interpretation: "Treat this as a snapshot field, not as the authoritative final leaderboard.",
  },
  {
    key: "customEvent:vote_count",
    label: "Vote count snapshot",
    type: "metric",
    meaning: "The running number of votes bundled into certain event payloads.",
    typicalValues: "count",
    interpretation: "Treat this as a snapshot field, not as the authoritative final vote ledger.",
  },
]

function normalizeState(value: string) {
  if (!value || value === "(not set)") return "unknown"
  return value
}

function buildDummyReport(): HackathonGaReport {
  const dataset = getDummyHackathonAnalyticsDataset()
  const overview = dataset.overview.reduce<HackathonGaOverview>(
    (acc, row) => {
      acc.eventCount += row.totalEvents
      acc.totalUsers += row.uniqueUsers
      acc.screenPageViews += row.pageViews
      acc.judgeAuthCompletions += row.judgeAuthCompletions
      acc.voteDialogViews += row.voteDialogViews
      acc.voteSubmissions += row.voteSubmissions
      acc.managerActions += row.managerActions
      return acc
    },
    {
      eventCount: 0,
      totalUsers: 0,
      screenPageViews: 0,
      judgeAuthCompletions: 0,
      voteDialogViews: 0,
      voteSubmissions: 0,
      managerActions: 0,
    }
  )
  const consentSummary = dataset.experienceOverview.reduce<HackathonGaConsentSummary>(
    (acc, row) => {
      if (row.analyticsConsentState === "granted") acc.acceptedUsers += row.uniqueUsers
      else if (row.analyticsConsentState === "denied") acc.deniedUsers += row.uniqueUsers
      else acc.unknownUsers += row.uniqueUsers
      return acc
    },
    {
      acceptedUsers: 0,
      deniedUsers: 0,
      unknownUsers: 0,
    },
  )

  const eventSurface = dataset.eventBreakdown
    .slice()
    .sort((left, right) => right.eventCount - left.eventCount)
    .slice(0, 14)
    .map<HackathonGaEventRow>((row) => ({
      eventName: row.eventName,
      viewerRole: row.viewerRole,
      competitionStatus: row.competitionStatus,
      eventCount: row.eventCount,
      totalUsers: row.uniqueUsers,
    }))

  const entrySurface = dataset.entryPerformance
    .slice()
    .sort((left, right) => right.votesSubmitted - left.votesSubmitted)
    .slice(0, 8)
    .map<HackathonGaEntryRow>((row) => ({
      entryName: row.entryName,
      entrySlug: row.entrySlug,
      dialogViews: row.dialogViews,
      consentedDialogViews: row.eligibleDialogViews,
      deniedDialogViews: row.blockedDialogViews,
      unknownDialogViews: Math.max(row.dialogViews - row.eligibleDialogViews - row.blockedDialogViews, 0),
      voteSubmissions: row.votesSubmitted,
      totalUsers: row.uniqueVoters,
      averageScore: row.averageScore,
    }))

  return {
    source: "dummy",
    generatedAt: new Date().toISOString(),
    propertyId: getHackathonPropertyId(),
    hostname: getHackathonHostname(),
    streamId: getHackathonStreamId(),
    historicalWindow: "Hackathon event day preview",
    hasLiveRows: false,
    notes: [
      "Dummy preview is active, so this GA surface shows the intended reporting layout before the shared property returns hackathon rows.",
      "The real live mode stays pinned to vote.rajeevg.com and the promoted hackathon schema on the shared property.",
    ],
    voteTruth: null,
    overview,
    consentSummary,
    eventSurface,
    entrySurface,
    definitions: DEFINITIONS,
  }
}

function emptyOverview(): HackathonGaOverview {
  return {
    eventCount: 0,
    totalUsers: 0,
    screenPageViews: 0,
    judgeAuthCompletions: 0,
    voteDialogViews: 0,
    voteSubmissions: 0,
    managerActions: 0,
  }
}

function mapOverview(response: RunReportResponse, eventTotals: Map<string, number>) {
  const row = response.rows?.[0]
  const authCompletions = eventTotals.get("judge_auth_completed") ?? 0
  const dialogViews = eventTotals.get("vote_dialog_viewed") ?? 0
  const voteSubmissions = eventTotals.get("vote_submitted") ?? 0
  const managerActions = MANAGER_EVENT_NAMES.reduce(
    (sum, eventName) => sum + (eventTotals.get(eventName) ?? 0),
    0,
  )

  return {
    eventCount: metricValue(row, 0),
    totalUsers: metricValue(row, 1),
    screenPageViews: metricValue(row, 2),
    judgeAuthCompletions: authCompletions,
    voteDialogViews: dialogViews,
    voteSubmissions,
    managerActions,
  }
}

function mapEventSurface(response: RunReportResponse): HackathonGaEventRow[] {
  return (response.rows ?? []).map((row) => ({
    eventName: dimensionValue(row, 0),
    viewerRole: dimensionValue(row, 1) || "unknown",
    competitionStatus: dimensionValue(row, 2) || "unknown",
    eventCount: metricValue(row, 0),
    totalUsers: metricValue(row, 1),
  }))
}

function mapEventTotals(response: RunReportResponse) {
  const totals = new Map<string, number>()

  for (const row of response.rows ?? []) {
    totals.set(dimensionValue(row, 0), metricValue(row, 0))
  }

  return totals
}

function getEntryKey(entrySlug: string, entryName: string) {
  return entrySlug || entryName
}

function mapEntrySurface(dialogResponse: RunReportResponse, submitResponse: RunReportResponse): HackathonGaEntryRow[] {
  const grouped = new Map<string, HackathonGaEntryRow>()

  for (const row of dialogResponse.rows ?? []) {
    const entrySlug = dimensionValue(row, 0)
    const entryName = dimensionValue(row, 1)
    const key = getEntryKey(entrySlug, entryName)
    if (!key) continue

    const current = grouped.get(key) ?? {
      entryName,
      entrySlug,
      dialogViews: 0,
      consentedDialogViews: 0,
      deniedDialogViews: 0,
      unknownDialogViews: 0,
      voteSubmissions: 0,
      totalUsers: 0,
      averageScore: 0,
    }

    const count = metricValue(row, 0)
    const consentState = normalizeState(dimensionValue(row, 2))
    current.dialogViews += count
    if (consentState === "granted") current.consentedDialogViews += count
    else if (consentState === "denied") current.deniedDialogViews += count
    else current.unknownDialogViews += count

    grouped.set(key, current)
  }

  for (const row of submitResponse.rows ?? []) {
    const entrySlug = dimensionValue(row, 0)
    const entryName = dimensionValue(row, 1)
    const key = getEntryKey(entrySlug, entryName)
    if (!entrySlug && !entryName) continue

    const current = grouped.get(key) ?? {
      entryName,
      entrySlug,
      dialogViews: 0,
      consentedDialogViews: 0,
      deniedDialogViews: 0,
      unknownDialogViews: 0,
      voteSubmissions: 0,
      totalUsers: 0,
      averageScore: 0,
    }

    const count = metricValue(row, 0)
    const totalUsers = metricValue(row, 1)
    const averageScore = metricValue(row, 2)
    current.voteSubmissions += count
    current.totalUsers = Math.max(current.totalUsers, totalUsers)
    current.averageScore = averageScore

    grouped.set(key, current)
  }

  return Array.from(grouped.values()).sort((left, right) => right.voteSubmissions - left.voteSubmissions)
}

function mapConsentSummary(pageContextResponse: RunReportResponse): HackathonGaConsentSummary {
  const summary: HackathonGaConsentSummary = {
    acceptedUsers: 0,
    deniedUsers: 0,
    unknownUsers: 0,
  }

  for (const row of pageContextResponse.rows ?? []) {
    const state = normalizeState(dimensionValue(row, 0))
    const users = metricValue(row, 1)
    if (state === "granted") summary.acceptedUsers += users
    else if (state === "denied") summary.deniedUsers += users
    else summary.unknownUsers += users
  }

  return summary
}

export async function getHackathonGa4Report(): Promise<HackathonGaReport> {
  noStore()

  try {
    const hostname = getHackathonHostname()
    const hostFilter = exactStringFilter("hostName", hostname)
    const voteTruthResult = await getHackathonVoteTruth()
    const eventDay = getHackathonEventDay(voteTruthResult.summary)
    const reportingDateRange = buildHackathonReportingDateRange(
      eventDay?.isoDate ?? new Date().toISOString().slice(0, 10),
    )
    const reportingWindow = describeHackathonReportingWindow(
      eventDay?.label ?? reportingDateRange.startDate,
    )

    const [
      overviewResponse,
      eventTotalsResponse,
      eventResponse,
      entryDialogResponse,
      entrySubmitResponse,
      pageContextConsentResponse,
    ] = await Promise.all([
      runHackathonGa4Report({
        dateRanges: [reportingDateRange],
        dimensions: [],
        metrics: [
          { name: "eventCount" },
          { name: "totalUsers" },
          { name: "screenPageViews" },
        ],
        dimensionFilter: hostFilter,
        limit: 1,
      }),
      runHackathonGa4Report({
        dateRanges: [reportingDateRange],
        dimensions: [{ name: "eventName" }],
        metrics: [{ name: "eventCount" }],
        dimensionFilter: andFilter([hostFilter, inListFilter("eventName", HACKATHON_EVENT_NAMES)]),
        orderBys: [{ metric: { metricName: "eventCount" }, desc: true }],
        limit: 100,
      }),
      runHackathonGa4Report({
        dateRanges: [reportingDateRange],
        dimensions: [
          { name: "eventName" },
          { name: "customEvent:viewer_role" },
          { name: "customEvent:competition_status" },
        ],
        metrics: [{ name: "eventCount" }, { name: "totalUsers" }],
        dimensionFilter: andFilter([hostFilter, inListFilter("eventName", HACKATHON_EVENT_NAMES)]),
        orderBys: [{ metric: { metricName: "eventCount" }, desc: true }],
        limit: 400,
      }),
      runHackathonGa4Report({
        dateRanges: [reportingDateRange],
        dimensions: [
          { name: "customEvent:entry_slug" },
          { name: "customEvent:entry_name" },
          { name: "customEvent:analytics_consent_state" },
        ],
        metrics: [
          { name: "eventCount" },
          { name: "totalUsers" },
          { name: "averageCustomEvent:score" },
        ],
        dimensionFilter: andFilter([hostFilter, exactStringFilter("eventName", "vote_dialog_viewed")]),
        orderBys: [{ metric: { metricName: "eventCount" }, desc: true }],
        limit: 500,
      }),
      runHackathonGa4Report({
        dateRanges: [reportingDateRange],
        dimensions: [
          { name: "customEvent:entry_slug" },
          { name: "customEvent:entry_name" },
        ],
        metrics: [
          { name: "eventCount" },
          { name: "totalUsers" },
          { name: "averageCustomEvent:score" },
        ],
        dimensionFilter: andFilter([hostFilter, exactStringFilter("eventName", "vote_submitted")]),
        orderBys: [{ metric: { metricName: "eventCount" }, desc: true }],
        limit: 500,
      }),
      runHackathonGa4Report({
        dateRanges: [reportingDateRange],
        dimensions: [{ name: "customEvent:analytics_consent_state" }],
        metrics: [{ name: "eventCount" }, { name: "totalUsers" }],
        dimensionFilter: andFilter([hostFilter, exactStringFilter("eventName", "page_context")]),
        orderBys: [{ metric: { metricName: "eventCount" }, desc: true }],
        limit: 20,
      }),
    ])

    const eventTotals = mapEventTotals(eventTotalsResponse)
    const eventSurface = mapEventSurface(eventResponse)
    const entrySurface = mapEntrySurface(entryDialogResponse, entrySubmitResponse)
    const overview = mapOverview(overviewResponse, eventTotals)
    const consentSummary = mapConsentSummary(pageContextConsentResponse)
    const [modeledTableCounts, rawExportTableCount] = await Promise.all([
      getModeledTableRowCounts(),
      getRawExportTableCount(getHackathonPropertyId()),
    ])
    const modeledRowCount = modeledTableCounts.reduce((sum, row) => sum + row.rowCount, 0)

    const hasLiveRows =
      overview.eventCount > 0 || eventSurface.length > 0 || entrySurface.length > 0

    return {
      source: "live",
      generatedAt: new Date().toISOString(),
      propertyId: getHackathonPropertyId(),
      hostname,
      streamId: getHackathonStreamId(),
      historicalWindow: reportingWindow,
      hasLiveRows,
      voteTruth: voteTruthResult.summary,
      notes: hasLiveRows
        ? [
            `Live mode is reading directly from the shared GA4 property through the official Google Analytics Data API client, scoped to ${reportingWindow}.`,
            `Warehouse reconciliation: the modeled BigQuery dataset currently has ${modeledRowCount} landed rows across ${modeledTableCounts.length} tables, and ga4_${getHackathonPropertyId()} currently has ${rawExportTableCount} landed raw export tables.`,
            "The route is filtered to vote.rajeevg.com so the hackathon app stays separated from rajeevg.com content analytics even though both live on the same property.",
            ...describeHackathonVoteTruthReconciliation({
              trackedVotes: overview.voteSubmissions,
              voteTruth: voteTruthResult.summary,
              fallbackNote: voteTruthResult.note,
            }),
          ]
        : [
            `The GA4 property is reachable, but no hackathon-host rows were returned for ${reportingWindow}.`,
            "Use Dummy preview to review the GA reporting shell while the shared property starts collecting or retaining hackathon rows.",
            ...describeHackathonVoteTruthReconciliation({
              trackedVotes: overview.voteSubmissions,
              voteTruth: voteTruthResult.summary,
              fallbackNote: voteTruthResult.note,
            }),
          ],
      overview,
      consentSummary,
      eventSurface,
      entrySurface,
      definitions: DEFINITIONS,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown GA Data API error"
    return {
      ...buildDummyReport(),
      source: "live",
      hasLiveRows: false,
      notes: [
        "Live GA mode could not complete the report request from this runtime.",
        message,
        "Dummy preview is still available so the GA-specific reporting layout can be reviewed end to end.",
      ],
      voteTruth: null,
      overview: emptyOverview(),
      consentSummary: {
        acceptedUsers: 0,
        deniedUsers: 0,
        unknownUsers: 0,
      },
      eventSurface: [],
      entrySurface: [],
      definitions: DEFINITIONS,
    }
  }
}

export function getDummyHackathonGa4Report(): HackathonGaReport {
  return buildDummyReport()
}
