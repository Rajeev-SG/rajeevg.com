import "server-only"

import { unstable_noStore as noStore } from "next/cache"

import {
  MODELED_TABLES,
  getHackathonRawExportDatasetId,
  getModeledTableRowCounts,
  getRawExportTableCount,
  hackathonDatasetPath,
  runHackathonBigQueryQuery,
} from "@/lib/hackathon-bigquery"
import { getHackathonPropertyId } from "@/lib/hackathon-ga4-common"
import { getDummyHackathonAnalyticsDataset } from "@/lib/hackathon-reporting-dummy"
import {
  getHackathonEventDay,
  getHackathonVoteTruth,
} from "@/lib/hackathon-vote-truth"
import type {
  AuthFunnelRow,
  DailyOverviewRow,
  EntryPerformanceRow,
  EventBreakdownRow,
  ExperienceOverviewRow,
  HackathonAnalyticsDataset,
  ManagerOperationsRow,
  RoundSnapshotRow,
  VotingFunnelRow,
} from "@/lib/hackathon-reporting-types"

async function runQuery<T>(query: string) {
  return runHackathonBigQueryQuery<T>(query)
}

function isDatasetEmpty(dataset: Omit<HackathonAnalyticsDataset, "source" | "generatedAt" | "hasLiveRows" | "notes">) {
  return (
    dataset.overview.length === 0 &&
    dataset.eventBreakdown.length === 0 &&
    dataset.entryPerformance.length === 0 &&
    dataset.roundSnapshots.length === 0 &&
    dataset.authFunnel.length === 0 &&
    dataset.votingFunnel.length === 0 &&
    dataset.managerOperations.length === 0 &&
    dataset.experienceOverview.length === 0
  )
}

function whereEventDate(eventDayIsoDate: string | null) {
  return eventDayIsoDate ? `WHERE event_date = DATE '${eventDayIsoDate}'` : ""
}

export async function getHackathonAnalyticsDataset(): Promise<HackathonAnalyticsDataset> {
  noStore()

  try {
    const [modeledTableCounts, rawExportTableCount, voteTruthResult] = await Promise.all([
      getModeledTableRowCounts(),
      getRawExportTableCount(getHackathonPropertyId()),
      getHackathonVoteTruth(),
    ])
    const rawExportDatasetId = getHackathonRawExportDatasetId(getHackathonPropertyId())
    const eventDay = getHackathonEventDay(voteTruthResult.summary)
    const eventDateClause = whereEventDate(eventDay?.isoDate ?? null)

    const [
      overview,
      eventBreakdown,
      entryPerformance,
      roundSnapshots,
      authFunnel,
      votingFunnel,
      managerOperations,
      experienceOverview,
    ] = await Promise.all([
      runQuery<DailyOverviewRow>(`
        SELECT
          FORMAT_DATE('%F', event_date) AS eventDate,
          total_events AS totalEvents,
          page_views AS pageViews,
          sessions,
          unique_users AS uniqueUsers,
          judge_auth_completions AS judgeAuthCompletions,
          vote_dialog_views AS voteDialogViews,
          vote_submissions AS voteSubmissions,
          workbook_uploads AS workbookUploads,
          round_opens AS roundOpens,
          finalizations,
          consent_grants AS consentGrants,
          manager_actions AS managerActions,
          total_score AS totalScore
        FROM ${hackathonDatasetPath("daily_overview")}
        ${eventDateClause}
        ORDER BY event_date
      `),
      runQuery<EventBreakdownRow>(`
        SELECT
          FORMAT_DATE('%F', event_date) AS eventDate,
          event_name AS eventName,
          viewer_role AS viewerRole,
          competition_status AS competitionStatus,
          event_count AS eventCount,
          unique_users AS uniqueUsers
        FROM ${hackathonDatasetPath("event_breakdown")}
        ${eventDateClause}
        ORDER BY event_date, event_count DESC
      `),
      runQuery<EntryPerformanceRow>(`
        SELECT
          FORMAT_DATE('%F', event_date) AS eventDate,
          entry_slug AS entrySlug,
          entry_name AS entryName,
          competition_status AS competitionStatus,
          dialog_views AS dialogViews,
          eligible_dialog_views AS eligibleDialogViews,
          blocked_dialog_views AS blockedDialogViews,
          vote_submit_starts AS voteSubmitStarts,
          vote_submit_failures AS voteSubmitFailures,
          votes_submitted AS votesSubmitted,
          unique_voters AS uniqueVoters,
          total_score AS totalScore,
          average_score AS averageScore,
          view_to_vote_rate AS viewToVoteRate
        FROM ${hackathonDatasetPath("entry_performance")}
        ${eventDateClause}
        ORDER BY event_date, total_score DESC
      `),
      runQuery<RoundSnapshotRow>(`
        SELECT
          FORMAT_DATE('%F', event_date) AS eventDate,
          FORMAT_TIMESTAMP('%FT%TZ', latest_event_ts) AS latestEventTs,
          competition_status AS competitionStatus,
          entry_count AS entryCount,
          open_entry_count AS openEntryCount,
          participating_judge_count AS participatingJudgeCount,
          total_remaining_votes AS totalRemainingVotes
        FROM ${hackathonDatasetPath("round_snapshots")}
        ${eventDateClause}
        ORDER BY event_date
      `),
      runQuery<AuthFunnelRow>(`
        SELECT
          FORMAT_DATE('%F', event_date) AS eventDate,
          auth_method AS authMethod,
          auth_flow AS authFlow,
          email_domain AS emailDomain,
          auth_requests AS authRequests,
          signup_starts AS signupStarts,
          auth_completions AS authCompletions,
          auth_failures AS authFailures,
          google_starts AS googleStarts,
          google_failures AS googleFailures,
          unique_users AS uniqueUsers
        FROM ${hackathonDatasetPath("auth_funnel_daily")}
        ${eventDateClause}
        ORDER BY event_date, auth_completions DESC
      `),
      runQuery<VotingFunnelRow>(`
        SELECT
          FORMAT_DATE('%F', event_date) AS eventDate,
          entry_slug AS entrySlug,
          entry_name AS entryName,
          viewer_role AS viewerRole,
          viewport_category AS viewportCategory,
          dialog_views AS dialogViews,
          eligible_dialog_views AS eligibleDialogViews,
          blocked_dialog_views AS blockedDialogViews,
          score_selections AS scoreSelections,
          submit_starts AS submitStarts,
          submitted_votes AS submittedVotes,
          submit_failures AS submitFailures,
          unique_viewers AS uniqueViewers,
          unique_submitters AS uniqueSubmitters,
          submission_rate AS submissionRate
        FROM ${hackathonDatasetPath("voting_funnel_daily")}
        ${eventDateClause}
        ORDER BY event_date, submittedVotes DESC
      `),
      runQuery<ManagerOperationsRow>(`
        SELECT
          FORMAT_DATE('%F', event_date) AS eventDate,
          workbook_picker_opens AS workbookPickerOpens,
          workbook_upload_starts AS workbookUploadStarts,
          workbook_upload_successes AS workbookUploadSuccesses,
          workbook_upload_failures AS workbookUploadFailures,
          workbook_issue_total AS workbookIssueTotal,
          imported_project_total AS importedProjectTotal,
          entry_voting_opened AS entryVotingOpened,
          entry_voting_closed AS entryVotingClosed,
          round_starts AS roundStarts,
          round_start_failures AS roundStartFailures,
          finalizations,
          finalize_failures AS finalizeFailures,
          resets,
          reset_failures AS resetFailures
        FROM ${hackathonDatasetPath("manager_operations_daily")}
        ${eventDateClause}
        ORDER BY event_date
      `),
      runQuery<ExperienceOverviewRow>(`
        SELECT
          FORMAT_DATE('%F', event_date) AS eventDate,
          viewport_category AS viewportCategory,
          theme,
          analytics_consent_state AS analyticsConsentState,
          board_view AS boardView,
          page_context_views AS pageContextViews,
          page_engagement_summaries AS pageEngagementSummaries,
          scoreboard_summary_opened AS scoreboardSummaryOpened,
          scoreboard_summary_closed AS scoreboardSummaryClosed,
          table_view_switches AS tableViewSwitches,
          chart_view_switches AS chartViewSwitches,
          section_views AS sectionViews,
          unique_users AS uniqueUsers,
          avg_engaged_seconds AS avgEngagedSeconds,
          avg_interaction_count AS avgInteractionCount,
          avg_scroll_depth_percent AS avgScrollDepthPercent
        FROM ${hackathonDatasetPath("experience_overview_daily")}
        ${eventDateClause}
        ORDER BY event_date, viewportCategory
      `),
    ])

    const dummy = getDummyHackathonAnalyticsDataset()
    const dataset = {
      voteTruth: voteTruthResult.summary,
      overview,
      eventBreakdown,
      entryPerformance,
      roundSnapshots,
      authFunnel,
      votingFunnel,
      managerOperations,
      experienceOverview,
      definitions: dummy.definitions,
    }

    const hasLiveRows = !isDatasetEmpty(dataset)
    const modeledRowCount = modeledTableCounts.reduce((sum, table) => sum + table.rowCount, 0)

    if (hasLiveRows) {
      return {
        source: "live",
        generatedAt: new Date().toISOString(),
        hasLiveRows,
        notes: [
          `Live mode is reading directly from the dedicated hackathon_reporting dataset in BigQuery, scoped to ${eventDay?.label ?? "the live event day"}.`,
          `Warehouse reconciliation: ${modeledRowCount} rows are currently landed across ${MODELED_TABLES.length} modeled tables, while the raw export dataset ${rawExportDatasetId} has ${rawExportTableCount} landed tables.`,
          "This route never reads the main rajeevg.com page analytics tables, which avoids the mixed-data problem from the old Looker shell.",
          ...(voteTruthResult.summary
            ? [
                ...(voteTruthResult.note ? [voteTruthResult.note] : []),
                `Source of truth: the hackathon snapshot reports ${voteTruthResult.summary.totals.totalVotes} recorded votes across ${voteTruthResult.summary.totals.totalEntries} entries and ${voteTruthResult.summary.totals.uniqueJudges} judges at ${voteTruthResult.summary.summaryUrl}.`,
              ]
            : voteTruthResult.note
              ? [`Source-of-truth snapshot could not be read from the voting app: ${voteTruthResult.note}`]
              : []),
        ],
        ...dataset,
      }
    }

    return {
      source: "live",
      generatedAt: new Date().toISOString(),
      hasLiveRows: false,
      notes: [
        "BigQuery modeled tables are still empty, so this route is currently showing warehouse status only.",
        `Warehouse reconciliation: 0 rows are landed across ${MODELED_TABLES.length} modeled tables, and the raw export dataset ${rawExportDatasetId} currently has ${rawExportTableCount} landed tables.`,
        "No GA4-derived fallback metrics are rendered on this route anymore, so the BigQuery page stays strictly warehouse-scoped.",
      ],
      voteTruth: voteTruthResult.summary,
      overview: [],
      eventBreakdown: [],
      entryPerformance: [],
      roundSnapshots: [],
      authFunnel: [],
      votingFunnel: [],
      managerOperations: [],
      experienceOverview: [],
      definitions: dummy.definitions,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown BigQuery error"
    const dummy = getDummyHackathonAnalyticsDataset()

    return {
      source: "live",
      generatedAt: new Date().toISOString(),
      hasLiveRows: false,
      notes: [
        "Live mode could not reach the reporting dataset from this runtime.",
        message,
        "Dummy preview is still available so the shell can be reviewed and exercised end to end.",
      ],
      voteTruth: null,
      overview: [],
      eventBreakdown: [],
      entryPerformance: [],
      roundSnapshots: [],
      authFunnel: [],
      votingFunnel: [],
      managerOperations: [],
      experienceOverview: [],
      definitions: dummy.definitions,
    }
  }
}
