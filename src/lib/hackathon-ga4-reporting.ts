import "server-only"

import { unstable_noStore as noStore } from "next/cache"

import { getModeledTableRowCounts, getRawExportTableCount } from "@/lib/hackathon-bigquery"
import { getDummyHackathonAnalyticsDataset } from "@/lib/hackathon-reporting-dummy"
import {
  describeHackathonVoteTruthReconciliation,
  getHackathonVoteTruth,
} from "@/lib/hackathon-vote-truth"
import type {
  HackathonGaDefinition,
  HackathonGaEntryRow,
  HackathonGaEventRow,
  HackathonGaManagerRow,
  HackathonGaOverview,
  HackathonGaReport,
  HackathonGaRoundStateRow,
} from "@/lib/hackathon-ga4-reporting-types"
import {
  HACKATHON_EVENT_NAMES,
  HACKATHON_HISTORICAL_WINDOW,
  HACKATHON_REPORTING_DATE_RANGE,
  MANAGER_EVENT_NAMES,
  RunReportResponse,
  andFilter,
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
  { key: "customEvent:competition_status", label: "Competition Status", type: "dimension", meaning: "The active judging-round state when the event fired." },
  { key: "customEvent:viewer_role", label: "Viewer Role", type: "dimension", meaning: "Whether the event came from a public visitor, judge, or the single manager." },
  { key: "customEvent:entry_name", label: "Entry Name", type: "dimension", meaning: "Human-readable project name attached to scoring and voting events." },
  { key: "customEvent:entry_slug", label: "Entry Slug", type: "dimension", meaning: "Stable project identifier used to join per-entry reporting rows." },
  { key: "customEvent:entry_voting_open", label: "Entry Voting Open", type: "dimension", meaning: "Whether a specific project was currently open to new votes." },
  { key: "customEvent:viewer_can_vote", label: "Viewer Can Vote", type: "dimension", meaning: "Whether the current signed-in viewer was eligible to vote on that project." },
  { key: "customEvent:viewer_has_vote", label: "Viewer Has Vote", type: "dimension", meaning: "Whether the viewer had already cast their one locked score for the project." },
  { key: "customEvent:analytics_section", label: "Analytics Section", type: "dimension", meaning: "The product surface that emitted the event, such as scoreboard, judge auth, or manager controls." },
  { key: "customEvent:viewport_category", label: "Viewport Category", type: "dimension", meaning: "Responsive bucket such as mobile, tablet, or desktop." },
  { key: "customEvent:upload_method", label: "Upload Method", type: "dimension", meaning: "How the manager selected the workbook, such as click or drag and drop." },
  { key: "customEvent:score", label: "Score", type: "metric", meaning: "The single 0-10 score chosen in a vote event." },
  { key: "customEvent:aggregate_score", label: "Aggregate Score", type: "metric", meaning: "The current summed scoreboard total represented by the event payload." },
  { key: "customEvent:vote_count", label: "Vote Count", type: "metric", meaning: "The number of votes represented by the event payload or snapshot." },
  { key: "customEvent:entry_count", label: "Entry Count", type: "metric", meaning: "How many projects were loaded into the current competition snapshot." },
  { key: "customEvent:open_entry_count", label: "Open Entry Count", type: "metric", meaning: "How many projects were accepting new votes at that moment." },
  { key: "customEvent:participating_judge_count", label: "Participating Judge Count", type: "metric", meaning: "How many judges had joined the completion denominator by scoring at least one project." },
  { key: "customEvent:total_remaining_votes", label: "Total Remaining Votes", type: "metric", meaning: "Outstanding vote obligations still blocking completion or finalization." },
]

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
      voteSubmissions: row.votesSubmitted,
      totalUsers: row.uniqueVoters,
      averageScore: row.averageScore,
      averageAggregateScore: row.totalScore,
    }))

  const roundSurface = dataset.roundSnapshots
    .slice(-3)
    .map<HackathonGaRoundStateRow>((row) => ({
      competitionStatus: row.competitionStatus,
      eventCount: 1,
      averageEntryCount: row.entryCount,
      averageOpenEntryCount: row.openEntryCount,
      averageParticipatingJudgeCount: row.participatingJudgeCount,
      averageRemainingVotes: row.totalRemainingVotes,
    }))

  const managerSurface = dataset.managerOperations
    .slice(-1)
    .flatMap<HackathonGaManagerRow>((row) => [
      { eventName: "workbook_upload_completed", eventCount: row.workbookUploadSuccesses },
      { eventName: "entry_voting_state_changed", eventCount: row.entryVotingOpened + row.entryVotingClosed },
      { eventName: "competition_round_started", eventCount: row.roundStarts },
      { eventName: "competition_round_finalized", eventCount: row.finalizations },
      { eventName: "competition_round_reset", eventCount: row.resets },
    ])
    .filter((row) => row.eventCount > 0)

  return {
    source: "dummy",
    generatedAt: new Date().toISOString(),
    propertyId: getHackathonPropertyId(),
    hostname: getHackathonHostname(),
    streamId: getHackathonStreamId(),
    historicalWindow: HACKATHON_HISTORICAL_WINDOW,
    hasLiveRows: false,
    notes: [
      "Dummy preview is active, so this GA surface shows the intended reporting layout before the shared property returns hackathon rows.",
      "The real live mode stays pinned to vote.rajeevg.com and the promoted hackathon schema on the shared property.",
    ],
    voteTruth: null,
    overview,
    eventSurface,
    entrySurface,
    roundSurface,
    managerSurface,
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

function mapOverview(response: RunReportResponse, eventRows: HackathonGaEventRow[]) {
  const row = response.rows?.[0]
  const authCompletions = eventRows
    .filter((item) => item.eventName === "judge_auth_completed")
    .reduce((sum, item) => sum + item.eventCount, 0)
  const dialogViews = eventRows
    .filter((item) => item.eventName === "vote_dialog_viewed")
    .reduce((sum, item) => sum + item.eventCount, 0)
  const voteSubmissions = eventRows
    .filter((item) => item.eventName === "vote_submitted")
    .reduce((sum, item) => sum + item.eventCount, 0)
  const managerActions = eventRows
    .filter((item) => item.viewerRole === "manager")
    .reduce((sum, item) => sum + item.eventCount, 0)

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

function mapEntrySurface(response: RunReportResponse): HackathonGaEntryRow[] {
  const rows = response.rows ?? []
  const grouped = new Map<string, HackathonGaEntryRow>()

  for (const row of rows) {
    const entrySlug = dimensionValue(row, 0)
    const entryName = dimensionValue(row, 1)
    const eventName = dimensionValue(row, 2)
    if (!entrySlug && !entryName) continue

    const current = grouped.get(entrySlug) ?? {
      entryName,
      entrySlug,
      dialogViews: 0,
      voteSubmissions: 0,
      totalUsers: 0,
      averageScore: 0,
      averageAggregateScore: 0,
    }

    const count = metricValue(row, 0)
    const totalUsers = metricValue(row, 1)
    const averageScore = metricValue(row, 2)
    const averageAggregateScore = metricValue(row, 3)

    if (eventName === "vote_dialog_viewed") current.dialogViews += count
    if (eventName === "vote_submitted") {
      current.voteSubmissions += count
      current.totalUsers = Math.max(current.totalUsers, totalUsers)
      current.averageScore = averageScore
      current.averageAggregateScore = averageAggregateScore
    }

    grouped.set(entrySlug, current)
  }

  return Array.from(grouped.values()).sort((left, right) => right.voteSubmissions - left.voteSubmissions)
}

function mapRoundSurface(response: RunReportResponse): HackathonGaRoundStateRow[] {
  return (response.rows ?? []).map((row) => ({
    competitionStatus: dimensionValue(row, 0) || "unknown",
    eventCount: metricValue(row, 0),
    averageEntryCount: metricValue(row, 1),
    averageOpenEntryCount: metricValue(row, 2),
    averageParticipatingJudgeCount: metricValue(row, 3),
    averageRemainingVotes: metricValue(row, 4),
  }))
}

function mapManagerSurface(response: RunReportResponse): HackathonGaManagerRow[] {
  return (response.rows ?? []).map((row) => ({
    eventName: dimensionValue(row, 0),
    eventCount: metricValue(row, 0),
  }))
}

export async function getHackathonGa4Report(): Promise<HackathonGaReport> {
  noStore()

  try {
    const hostname = getHackathonHostname()
    const hostFilter = exactStringFilter("hostName", hostname)

    const [overviewResponse, eventResponse, entryResponse, roundResponse, managerResponse] =
      await Promise.all([
        runHackathonGa4Report({
          dateRanges: [HACKATHON_REPORTING_DATE_RANGE],
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
          dateRanges: [HACKATHON_REPORTING_DATE_RANGE],
          dimensions: [
            { name: "eventName" },
            { name: "customEvent:viewer_role" },
            { name: "customEvent:competition_status" },
          ],
          metrics: [{ name: "eventCount" }, { name: "totalUsers" }],
          dimensionFilter: andFilter([hostFilter, inListFilter("eventName", HACKATHON_EVENT_NAMES)]),
          orderBys: [{ metric: { metricName: "eventCount" }, desc: true }],
          limit: 50,
        }),
        runHackathonGa4Report({
          dateRanges: [HACKATHON_REPORTING_DATE_RANGE],
          dimensions: [
            { name: "customEvent:entry_slug" },
            { name: "customEvent:entry_name" },
            { name: "eventName" },
          ],
          metrics: [
            { name: "eventCount" },
            { name: "totalUsers" },
            { name: "averageCustomEvent:score" },
            { name: "averageCustomEvent:aggregate_score" },
          ],
          dimensionFilter: andFilter([
            hostFilter,
            inListFilter("eventName", ["vote_dialog_viewed", "vote_submitted"]),
          ]),
          orderBys: [{ metric: { metricName: "eventCount" }, desc: true }],
          limit: 100,
        }),
        runHackathonGa4Report({
          dateRanges: [HACKATHON_REPORTING_DATE_RANGE],
          dimensions: [{ name: "customEvent:competition_status" }],
          metrics: [
            { name: "eventCount" },
            { name: "averageCustomEvent:entry_count" },
            { name: "averageCustomEvent:open_entry_count" },
            { name: "averageCustomEvent:participating_judge_count" },
            { name: "averageCustomEvent:total_remaining_votes" },
          ],
          dimensionFilter: andFilter([
            hostFilter,
            exactStringFilter("eventName", "competition_state_snapshot"),
          ]),
          orderBys: [{ metric: { metricName: "eventCount" }, desc: true }],
          limit: 10,
        }),
        runHackathonGa4Report({
          dateRanges: [HACKATHON_REPORTING_DATE_RANGE],
          dimensions: [{ name: "eventName" }],
          metrics: [{ name: "eventCount" }],
          dimensionFilter: andFilter([hostFilter, inListFilter("eventName", MANAGER_EVENT_NAMES)]),
          orderBys: [{ metric: { metricName: "eventCount" }, desc: true }],
          limit: 20,
        }),
      ])

    const eventSurface = mapEventSurface(eventResponse)
    const entrySurface = mapEntrySurface(entryResponse)
    const roundSurface = mapRoundSurface(roundResponse)
    const managerSurface = mapManagerSurface(managerResponse)
    const overview = mapOverview(overviewResponse, eventSurface)
    const [modeledTableCounts, rawExportTableCount, voteTruthResult] = await Promise.all([
      getModeledTableRowCounts(),
      getRawExportTableCount(getHackathonPropertyId()),
      getHackathonVoteTruth(),
    ])
    const modeledRowCount = modeledTableCounts.reduce((sum, row) => sum + row.rowCount, 0)

    const hasLiveRows =
      overview.eventCount > 0 ||
      eventSurface.length > 0 ||
      entrySurface.length > 0 ||
      roundSurface.length > 0 ||
      managerSurface.length > 0

    return {
      source: "live",
      generatedAt: new Date().toISOString(),
      propertyId: getHackathonPropertyId(),
      hostname,
      streamId: getHackathonStreamId(),
      historicalWindow: HACKATHON_HISTORICAL_WINDOW,
      hasLiveRows,
      voteTruth: voteTruthResult.summary,
      notes: hasLiveRows
        ? [
            "Live mode is reading directly from the shared GA4 property through the official Google Analytics Data API client, using the last 30 days including today.",
            `Warehouse reconciliation: the modeled BigQuery dataset currently has ${modeledRowCount} landed rows across ${modeledTableCounts.length} tables, and ga4_${getHackathonPropertyId()} currently has ${rawExportTableCount} landed raw export tables.`,
            "The route is filtered to vote.rajeevg.com so the hackathon app stays separated from rajeevg.com content analytics even though both live on the same property.",
            ...describeHackathonVoteTruthReconciliation({
              trackedVotes: overview.voteSubmissions,
              voteTruth: voteTruthResult.summary,
              fallbackNote: voteTruthResult.note,
            }),
          ]
        : [
            "The GA4 property is reachable, but no hackathon-host rows were returned for the current reporting window.",
            "Use Dummy preview to review the GA reporting shell while the shared property starts collecting or retaining hackathon rows.",
            ...describeHackathonVoteTruthReconciliation({
              trackedVotes: overview.voteSubmissions,
              voteTruth: voteTruthResult.summary,
              fallbackNote: voteTruthResult.note,
            }),
          ],
      overview,
      eventSurface,
      entrySurface,
      roundSurface,
      managerSurface,
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
      eventSurface: [],
      entrySurface: [],
      roundSurface: [],
      managerSurface: [],
    }
  }
}

export function getDummyHackathonGa4Report(): HackathonGaReport {
  return buildDummyReport()
}
