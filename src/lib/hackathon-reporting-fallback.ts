import "server-only"

import { getDummyHackathonAnalyticsDataset } from "@/lib/hackathon-reporting-dummy"
import {
  describeHackathonVoteTruthReconciliation,
  getHackathonEventDay,
  getHackathonVoteTruth,
} from "@/lib/hackathon-vote-truth"
import type {
  AuthFunnelRow,
  DailyOverviewRow,
  EntryPerformanceRow,
  ExperienceOverviewRow,
  EventBreakdownRow,
  HackathonAnalyticsDataset,
  ManagerOperationsRow,
  RoundSnapshotRow,
  VotingFunnelRow,
} from "@/lib/hackathon-reporting-types"
import {
  HACKATHON_BREAKDOWN_EVENT_NAMES,
  HACKATHON_EXPERIENCE_EVENT_NAMES,
  HACKATHON_VOTING_EVENT_NAMES,
  MANAGER_EVENT_NAMES,
  andFilter,
  buildHackathonReportingDateRange,
  describeHackathonReportingWindow,
  dimensionValue,
  exactStringFilter,
  getHackathonHostname,
  inListFilter,
  metricValue,
  runHackathonGa4Report,
} from "@/lib/hackathon-ga4-common"

function normalizeDimension(value: string, fallback = "unknown") {
  if (!value || value === "(not set)") return fallback
  return value
}

function formatGaDate(value: string) {
  if (value.length !== 8) return value
  return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`
}

function hasMaterialRows(dataset: Omit<HackathonAnalyticsDataset, "source" | "generatedAt" | "hasLiveRows" | "notes">) {
  return (
    dataset.overview.length > 0 ||
    dataset.eventBreakdown.length > 0 ||
    dataset.entryPerformance.length > 0 ||
    dataset.roundSnapshots.length > 0 ||
    dataset.authFunnel.length > 0 ||
    dataset.votingFunnel.length > 0 ||
    dataset.managerOperations.length > 0 ||
    dataset.experienceOverview.length > 0
  )
}

export async function buildHackathonAnalyticsDatasetFromGa4(notes: string[]): Promise<HackathonAnalyticsDataset> {
  const hostname = getHackathonHostname()
  const hostFilter = exactStringFilter("hostName", hostname)
  const dummy = getDummyHackathonAnalyticsDataset()
  const voteTruthResultPromise = getHackathonVoteTruth()
  const voteTruthResult = await voteTruthResultPromise
  const eventDay = getHackathonEventDay(voteTruthResult.summary)
  const reportingDateRange = buildHackathonReportingDateRange(
    eventDay?.isoDate ?? new Date().toISOString().slice(0, 10),
  )
  const reportingWindow = describeHackathonReportingWindow(
    eventDay?.label ?? reportingDateRange.startDate,
  )

  const [
    overviewBaseResponse,
    overviewEventsResponse,
    eventBreakdownResponse,
    entryResponse,
    roundResponse,
    authResponse,
    votingResponse,
    managerResponse,
    experienceCountsResponse,
    experienceMetricsResponse,
  ] = await Promise.all([
    runHackathonGa4Report({
      dateRanges: [reportingDateRange],
      dimensions: [{ name: "date" }],
      metrics: [
        { name: "eventCount" },
        { name: "screenPageViews" },
        { name: "sessions" },
        { name: "totalUsers" },
      ],
      dimensionFilter: hostFilter,
      orderBys: [{ dimension: { dimensionName: "date" } }],
      limit: 100,
    }),
    runHackathonGa4Report({
      dateRanges: [reportingDateRange],
      dimensions: [
        { name: "date" },
        { name: "eventName" },
        { name: "customEvent:viewer_role" },
        { name: "customEvent:consent_preference" },
      ],
      metrics: [{ name: "eventCount" }],
      dimensionFilter: andFilter([
        hostFilter,
        inListFilter("eventName", [
          "judge_auth_completed",
          "vote_dialog_viewed",
          "vote_submitted",
          "workbook_upload_completed",
          "competition_round_started",
          "competition_round_finalized",
          "consent_state_updated",
          ...MANAGER_EVENT_NAMES,
        ]),
      ]),
      orderBys: [{ dimension: { dimensionName: "date" } }],
      limit: 1000,
    }),
    runHackathonGa4Report({
      dateRanges: [reportingDateRange],
      dimensions: [
        { name: "date" },
        { name: "eventName" },
        { name: "customEvent:viewer_role" },
        { name: "customEvent:competition_status" },
      ],
      metrics: [{ name: "eventCount" }, { name: "totalUsers" }],
      dimensionFilter: andFilter([hostFilter, inListFilter("eventName", HACKATHON_BREAKDOWN_EVENT_NAMES)]),
      orderBys: [{ dimension: { dimensionName: "date" } }, { metric: { metricName: "eventCount" }, desc: true }],
      limit: 2000,
    }),
    runHackathonGa4Report({
      dateRanges: [reportingDateRange],
      dimensions: [
        { name: "date" },
        { name: "customEvent:entry_slug" },
        { name: "customEvent:entry_name" },
        { name: "customEvent:competition_status" },
        { name: "customEvent:viewer_can_vote" },
        { name: "eventName" },
      ],
      metrics: [
        { name: "eventCount" },
        { name: "totalUsers" },
        { name: "averageCustomEvent:score" },
        { name: "customEvent:score" },
      ],
      dimensionFilter: andFilter([
        hostFilter,
        inListFilter("eventName", [
          "vote_dialog_viewed",
          "vote_submit_started",
          "vote_submit_failed",
          "vote_submitted",
        ]),
      ]),
      orderBys: [{ dimension: { dimensionName: "date" } }, { metric: { metricName: "eventCount" }, desc: true }],
      limit: 2000,
    }),
    Promise.resolve({ rows: [] }),
    runHackathonGa4Report({
      dateRanges: [reportingDateRange],
      dimensions: [{ name: "date" }, { name: "eventName" }],
      metrics: [{ name: "eventCount" }, { name: "totalUsers" }],
      dimensionFilter: andFilter([
        hostFilter,
        inListFilter("eventName", [
          "judge_auth_email_requested",
          "judge_auth_email_request_failed",
          "judge_auth_completed",
          "judge_auth_verify_failed",
          "judge_auth_google_started",
          "judge_auth_google_failed",
        ]),
      ]),
      orderBys: [{ dimension: { dimensionName: "date" } }],
      limit: 500,
    }),
    runHackathonGa4Report({
      dateRanges: [reportingDateRange],
      dimensions: [
        { name: "date" },
        { name: "customEvent:entry_slug" },
        { name: "customEvent:entry_name" },
        { name: "customEvent:viewer_role" },
        { name: "customEvent:viewport_category" },
        { name: "customEvent:viewer_can_vote" },
        { name: "eventName" },
      ],
      metrics: [{ name: "eventCount" }, { name: "totalUsers" }],
      dimensionFilter: andFilter([hostFilter, inListFilter("eventName", HACKATHON_VOTING_EVENT_NAMES)]),
      orderBys: [{ dimension: { dimensionName: "date" } }],
      limit: 2000,
    }),
    runHackathonGa4Report({
      dateRanges: [reportingDateRange],
      dimensions: [{ name: "date" }, { name: "eventName" }, { name: "customEvent:entry_voting_open" }],
      metrics: [
        { name: "eventCount" },
        { name: "customEvent:issue_count" },
        { name: "customEvent:imported_project_count" },
      ],
      dimensionFilter: andFilter([hostFilter, inListFilter("eventName", MANAGER_EVENT_NAMES)]),
      orderBys: [{ dimension: { dimensionName: "date" } }],
      limit: 500,
    }),
    runHackathonGa4Report({
      dateRanges: [reportingDateRange],
      dimensions: [
        { name: "date" },
        { name: "customEvent:viewport_category" },
        { name: "customEvent:theme" },
        { name: "customEvent:analytics_consent_state" },
        { name: "eventName" },
      ],
      metrics: [{ name: "eventCount" }, { name: "totalUsers" }],
      dimensionFilter: andFilter([hostFilter, inListFilter("eventName", HACKATHON_EXPERIENCE_EVENT_NAMES)]),
      orderBys: [{ dimension: { dimensionName: "date" } }],
      limit: 1000,
    }),
    runHackathonGa4Report({
      dateRanges: [reportingDateRange],
      dimensions: [
        { name: "date" },
        { name: "customEvent:viewport_category" },
        { name: "customEvent:theme" },
        { name: "customEvent:analytics_consent_state" },
      ],
      metrics: [
        { name: "averageCustomEvent:engaged_seconds" },
        { name: "averageCustomEvent:interaction_count" },
        { name: "averageCustomEvent:scroll_depth_percent" },
      ],
      dimensionFilter: andFilter([hostFilter, exactStringFilter("eventName", "page_engagement_summary")]),
      orderBys: [{ dimension: { dimensionName: "date" } }],
      limit: 500,
    }),
  ])

  const overviewMap = new Map<string, DailyOverviewRow>()
  for (const row of overviewBaseResponse.rows ?? []) {
    const eventDate = formatGaDate(dimensionValue(row, 0))
    overviewMap.set(eventDate, {
      eventDate,
      totalEvents: metricValue(row, 0),
      pageViews: metricValue(row, 1),
      sessions: metricValue(row, 2),
      uniqueUsers: metricValue(row, 3),
      judgeAuthCompletions: 0,
      voteDialogViews: 0,
      voteSubmissions: 0,
      workbookUploads: 0,
      roundOpens: 0,
      finalizations: 0,
      consentGrants: 0,
      managerActions: 0,
      totalScore: 0,
    })
  }

  for (const row of overviewEventsResponse.rows ?? []) {
    const eventDate = formatGaDate(dimensionValue(row, 0))
    const eventName = dimensionValue(row, 1)
    const eventCount = metricValue(row, 0)
    const consentPreference = normalizeDimension(dimensionValue(row, 3))
    const daily = overviewMap.get(eventDate)

    if (!daily) continue

    if (eventName === "judge_auth_completed") daily.judgeAuthCompletions += eventCount
    if (eventName === "vote_dialog_viewed") daily.voteDialogViews += eventCount
    if (eventName === "vote_submitted") daily.voteSubmissions += eventCount
    if (eventName === "workbook_upload_completed") daily.workbookUploads += eventCount
    if (eventName === "competition_round_started") daily.roundOpens += eventCount
    if (eventName === "competition_round_finalized") daily.finalizations += eventCount
    if (eventName === "consent_state_updated" && consentPreference === "granted") {
      daily.consentGrants += eventCount
    }
    if (MANAGER_EVENT_NAMES.includes(eventName as (typeof MANAGER_EVENT_NAMES)[number])) {
      daily.managerActions += eventCount
    }
  }

  const eventBreakdown: EventBreakdownRow[] = (eventBreakdownResponse.rows ?? []).map((row) => ({
    eventDate: formatGaDate(dimensionValue(row, 0)),
    eventName: dimensionValue(row, 1),
    viewerRole: normalizeDimension(dimensionValue(row, 2)),
    competitionStatus: normalizeDimension(dimensionValue(row, 3)),
    eventCount: metricValue(row, 0),
    uniqueUsers: metricValue(row, 1),
  }))

  const entryMap = new Map<
    string,
    EntryPerformanceRow & { scoreSum: number; scoreSamples: number }
  >()
  for (const row of entryResponse.rows ?? []) {
    const eventDate = formatGaDate(dimensionValue(row, 0))
    const entrySlug = dimensionValue(row, 1)
    const entryName = dimensionValue(row, 2) || entrySlug
    const competitionStatus = normalizeDimension(dimensionValue(row, 3))
    const viewerCanVote = normalizeDimension(dimensionValue(row, 4), "unknown")
    const eventName = dimensionValue(row, 5)
    const eventCount = metricValue(row, 0)
    const totalUsers = metricValue(row, 1)
    const averageScore = metricValue(row, 2)
    const summedScore = metricValue(row, 3)
    if (!entrySlug) continue

    const key = `${eventDate}:${entrySlug}:${competitionStatus}`
    const current = entryMap.get(key) ?? {
      eventDate,
      entrySlug,
      entryName,
      competitionStatus,
      dialogViews: 0,
      eligibleDialogViews: 0,
      blockedDialogViews: 0,
      voteSubmitStarts: 0,
      voteSubmitFailures: 0,
      votesSubmitted: 0,
      uniqueVoters: 0,
      totalScore: 0,
      averageScore: 0,
      viewToVoteRate: 0,
      scoreSum: 0,
      scoreSamples: 0,
    }

    if (eventName === "vote_dialog_viewed") {
      current.dialogViews += eventCount
      if (viewerCanVote === "true") current.eligibleDialogViews += eventCount
      if (viewerCanVote === "false") current.blockedDialogViews += eventCount
    }

    if (eventName === "vote_submit_started") current.voteSubmitStarts += eventCount
    if (eventName === "vote_submit_failed") current.voteSubmitFailures += eventCount

    if (eventName === "vote_submitted") {
      current.votesSubmitted += eventCount
      current.uniqueVoters = Math.max(current.uniqueVoters, totalUsers)
      current.totalScore += summedScore
      current.scoreSum += averageScore * eventCount
      current.scoreSamples += eventCount

      const overview = overviewMap.get(eventDate)
      if (overview) overview.totalScore += summedScore
    }

    entryMap.set(key, current)
  }

  const entryPerformance: EntryPerformanceRow[] = Array.from(entryMap.values())
    .map(({ scoreSum, scoreSamples, ...row }) => ({
      ...row,
      averageScore: scoreSamples ? scoreSum / scoreSamples : 0,
      viewToVoteRate: row.eligibleDialogViews ? row.votesSubmitted / row.eligibleDialogViews : 0,
    }))
    .sort((left, right) => left.eventDate.localeCompare(right.eventDate) || right.totalScore - left.totalScore)

  const roundSnapshots: RoundSnapshotRow[] = (roundResponse.rows ?? []).map((row) => {
    const eventDate = formatGaDate(dimensionValue(row, 0))
    return {
      eventDate,
      latestEventTs: `${eventDate}T23:59:59Z`,
      competitionStatus: normalizeDimension(dimensionValue(row, 1)),
      entryCount: Math.round(metricValue(row, 1)),
      openEntryCount: Math.round(metricValue(row, 2)),
      participatingJudgeCount: Math.round(metricValue(row, 3)),
      totalRemainingVotes: Math.round(metricValue(row, 4)),
    }
  })

  type AuthCounts = {
    emailRequests: number
    emailRequestFailures: number
    verifyFailures: number
    totalCompletions: number
    googleStarts: number
    googleFailures: number
    emailUsers: number
    googleUsers: number
  }

  const authMap = new Map<string, AuthCounts>()
  for (const row of authResponse.rows ?? []) {
    const eventDate = formatGaDate(dimensionValue(row, 0))
    const eventName = dimensionValue(row, 1)
    const eventCount = metricValue(row, 0)
    const totalUsers = metricValue(row, 1)
    const current = authMap.get(eventDate) ?? {
      emailRequests: 0,
      emailRequestFailures: 0,
      verifyFailures: 0,
      totalCompletions: 0,
      googleStarts: 0,
      googleFailures: 0,
      emailUsers: 0,
      googleUsers: 0,
    }

    if (eventName === "judge_auth_email_requested") {
      current.emailRequests += eventCount
      current.emailUsers = Math.max(current.emailUsers, totalUsers)
    }
    if (eventName === "judge_auth_email_request_failed") current.emailRequestFailures += eventCount
    if (eventName === "judge_auth_verify_failed") current.verifyFailures += eventCount
    if (eventName === "judge_auth_completed") current.totalCompletions += eventCount
    if (eventName === "judge_auth_google_started") {
      current.googleStarts += eventCount
      current.googleUsers = Math.max(current.googleUsers, totalUsers)
    }
    if (eventName === "judge_auth_google_failed") current.googleFailures += eventCount

    authMap.set(eventDate, current)
  }

  const authFunnel: AuthFunnelRow[] = Array.from(authMap.entries())
    .flatMap(([eventDate, counts]) => {
      const googleCompletions = Math.max(counts.googleStarts - counts.googleFailures, 0)
      const emailCompletions = Math.max(counts.totalCompletions - googleCompletions, 0)

      return [
        {
          eventDate,
          authMethod: "email_code",
          authFlow: "passwordless",
          emailDomain: "unknown",
          authRequests: counts.emailRequests,
          signupStarts: 0,
          authCompletions: emailCompletions,
          authFailures: counts.emailRequestFailures + counts.verifyFailures,
          googleStarts: 0,
          googleFailures: 0,
          uniqueUsers: Math.max(counts.emailUsers, emailCompletions),
        },
        {
          eventDate,
          authMethod: "google_oauth",
          authFlow: "popup",
          emailDomain: "unknown",
          authRequests: 0,
          signupStarts: 0,
          authCompletions: googleCompletions,
          authFailures: 0,
          googleStarts: counts.googleStarts,
          googleFailures: counts.googleFailures,
          uniqueUsers: Math.max(counts.googleUsers, googleCompletions),
        },
      ]
    })
    .filter((row) => row.authRequests || row.authCompletions || row.googleStarts || row.authFailures || row.googleFailures)

  const votingMap = new Map<string, VotingFunnelRow>()
  for (const row of votingResponse.rows ?? []) {
    const eventDate = formatGaDate(dimensionValue(row, 0))
    const entrySlug = dimensionValue(row, 1)
    const entryName = dimensionValue(row, 2) || entrySlug
    const viewerRole = normalizeDimension(dimensionValue(row, 3))
    const viewportCategory = normalizeDimension(dimensionValue(row, 4))
    const viewerCanVote = normalizeDimension(dimensionValue(row, 5), "unknown")
    const eventName = dimensionValue(row, 6)
    const eventCount = metricValue(row, 0)
    const totalUsers = metricValue(row, 1)
    if (!entrySlug) continue

    const key = `${eventDate}:${entrySlug}:${viewerRole}:${viewportCategory}`
    const current = votingMap.get(key) ?? {
      eventDate,
      entrySlug,
      entryName,
      viewerRole,
      viewportCategory,
      dialogViews: 0,
      eligibleDialogViews: 0,
      blockedDialogViews: 0,
      scoreSelections: 0,
      submitStarts: 0,
      submittedVotes: 0,
      submitFailures: 0,
      uniqueViewers: 0,
      uniqueSubmitters: 0,
      submissionRate: 0,
    }

    if (eventName === "vote_dialog_viewed") {
      current.dialogViews += eventCount
      current.uniqueViewers = Math.max(current.uniqueViewers, totalUsers)
      if (viewerCanVote === "true") current.eligibleDialogViews += eventCount
      if (viewerCanVote === "false") current.blockedDialogViews += eventCount
    }
    if (eventName === "vote_score_selected") current.scoreSelections += eventCount
    if (eventName === "vote_submit_started") current.submitStarts += eventCount
    if (eventName === "vote_submit_failed") current.submitFailures += eventCount
    if (eventName === "vote_submitted") {
      current.submittedVotes += eventCount
      current.uniqueSubmitters = Math.max(current.uniqueSubmitters, totalUsers)
    }

    votingMap.set(key, current)
  }

  const votingFunnel: VotingFunnelRow[] = Array.from(votingMap.values())
    .map((row) => ({
      ...row,
      submissionRate: row.eligibleDialogViews ? row.submittedVotes / row.eligibleDialogViews : 0,
    }))
    .sort((left, right) => left.eventDate.localeCompare(right.eventDate) || right.submittedVotes - left.submittedVotes)

  const managerMap = new Map<string, ManagerOperationsRow>()
  for (const row of managerResponse.rows ?? []) {
    const eventDate = formatGaDate(dimensionValue(row, 0))
    const eventName = dimensionValue(row, 1)
    const entryVotingOpen = normalizeDimension(dimensionValue(row, 2), "")
    const eventCount = metricValue(row, 0)
    const issueCount = metricValue(row, 1)
    const importedProjectCount = metricValue(row, 2)
    const current = managerMap.get(eventDate) ?? {
      eventDate,
      workbookPickerOpens: 0,
      workbookUploadStarts: 0,
      workbookUploadSuccesses: 0,
      workbookUploadFailures: 0,
      workbookIssueTotal: 0,
      importedProjectTotal: 0,
      entryVotingOpened: 0,
      entryVotingClosed: 0,
      roundStarts: 0,
      roundStartFailures: 0,
      finalizations: 0,
      finalizeFailures: 0,
      resets: 0,
      resetFailures: 0,
    }

    if (eventName === "workbook_picker_opened") current.workbookPickerOpens += eventCount
    if (eventName === "workbook_upload_started") current.workbookUploadStarts += eventCount
    if (eventName === "workbook_upload_completed") {
      current.workbookUploadSuccesses += eventCount
      current.importedProjectTotal += importedProjectCount
    }
    if (eventName === "workbook_upload_failed") {
      current.workbookUploadFailures += eventCount
      current.workbookIssueTotal += issueCount
    }
    if (eventName === "entry_voting_state_changed") {
      if (entryVotingOpen === "true") current.entryVotingOpened += eventCount
      if (entryVotingOpen === "false") current.entryVotingClosed += eventCount
    }
    if (eventName === "competition_round_started") current.roundStarts += eventCount
    if (eventName === "competition_round_start_failed") current.roundStartFailures += eventCount
    if (eventName === "competition_round_finalized") current.finalizations += eventCount
    if (eventName === "competition_round_finalize_failed") current.finalizeFailures += eventCount
    if (eventName === "competition_round_reset") current.resets += eventCount
    if (eventName === "competition_round_reset_failed") current.resetFailures += eventCount

    managerMap.set(eventDate, current)
  }

  const managerOperations = Array.from(managerMap.values()).sort((left, right) =>
    left.eventDate.localeCompare(right.eventDate),
  )

  const experienceMetricMap = new Map<
    string,
    Pick<ExperienceOverviewRow, "avgEngagedSeconds" | "avgInteractionCount" | "avgScrollDepthPercent">
  >()
  for (const row of experienceMetricsResponse.rows ?? []) {
    const eventDate = formatGaDate(dimensionValue(row, 0))
    const viewportCategory = normalizeDimension(dimensionValue(row, 1))
    const theme = normalizeDimension(dimensionValue(row, 2))
    const analyticsConsentState = normalizeDimension(dimensionValue(row, 3))
    experienceMetricMap.set(`${eventDate}:${viewportCategory}:${theme}:${analyticsConsentState}`, {
      avgEngagedSeconds: metricValue(row, 0),
      avgInteractionCount: metricValue(row, 1),
      avgScrollDepthPercent: metricValue(row, 2),
    })
  }

  const experienceMap = new Map<string, ExperienceOverviewRow>()
  for (const row of experienceCountsResponse.rows ?? []) {
    const eventDate = formatGaDate(dimensionValue(row, 0))
    const viewportCategory = normalizeDimension(dimensionValue(row, 1))
    const theme = normalizeDimension(dimensionValue(row, 2))
    const analyticsConsentState = normalizeDimension(dimensionValue(row, 3))
    const eventName = dimensionValue(row, 4)
    const eventCount = metricValue(row, 0)
    const totalUsers = metricValue(row, 1)
    const key = `${eventDate}:${viewportCategory}:${theme}:${analyticsConsentState}`
    const current = experienceMap.get(key) ?? {
      eventDate,
      viewportCategory,
      theme,
      analyticsConsentState,
      boardView: "table",
      pageContextViews: 0,
      pageEngagementSummaries: 0,
      scoreboardSummaryOpened: 0,
      scoreboardSummaryClosed: 0,
      tableViewSwitches: 0,
      chartViewSwitches: 0,
      sectionViews: 0,
      uniqueUsers: 0,
      avgEngagedSeconds: 0,
      avgInteractionCount: 0,
      avgScrollDepthPercent: 0,
    }

    if (eventName === "page_context") current.pageContextViews += eventCount
    if (eventName === "page_engagement_summary") current.pageEngagementSummaries += eventCount
    if (eventName === "scoreboard_summary_toggled") current.scoreboardSummaryOpened += eventCount
    if (eventName === "scoreboard_view_changed") current.tableViewSwitches += eventCount
    if (eventName === "section_view") current.sectionViews += eventCount
    current.uniqueUsers = Math.max(current.uniqueUsers, totalUsers)

    experienceMap.set(key, current)
  }

  const experienceOverview: ExperienceOverviewRow[] = Array.from(experienceMap.entries())
    .map(([key, row]) => ({
      ...row,
      ...experienceMetricMap.get(key),
    }))
    .sort((left, right) => left.eventDate.localeCompare(right.eventDate) || left.viewportCategory.localeCompare(right.viewportCategory))

  const dataset = {
    voteTruth: voteTruthResult.summary,
    overview: Array.from(overviewMap.values()).sort((left, right) => left.eventDate.localeCompare(right.eventDate)),
    eventBreakdown,
    entryPerformance,
    roundSnapshots,
    authFunnel,
    votingFunnel,
    managerOperations,
    experienceOverview,
    definitions: dummy.definitions,
  }

  const hasLiveRows = hasMaterialRows(dataset)

  return {
    source: "live",
    generatedAt: new Date().toISOString(),
    hasLiveRows,
    notes: [
      ...(hasLiveRows
        ? [
            `BigQuery modeled tables are still empty, so this route is currently showing GA4-derived telemetry plus the live vote ledger over ${reportingWindow.toLowerCase()}, not warehouse-modeled rows.`,
          ]
        : ["GA4 fallback also returned no material rows for the current hackathon host and reporting window."]),
      ...notes,
      ...describeHackathonVoteTruthReconciliation({
        trackedVotes: dataset.overview.reduce((sum, row) => sum + row.voteSubmissions, 0),
        voteTruth: voteTruthResult.summary,
        fallbackNote: voteTruthResult.note,
      }),
    ],
    ...dataset,
  }
}
