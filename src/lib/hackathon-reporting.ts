import "server-only"

import { BigQuery } from "@google-cloud/bigquery"
import { unstable_noStore as noStore } from "next/cache"

import { getDummyHackathonAnalyticsDataset } from "@/lib/hackathon-reporting-dummy"
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

const DEFAULT_PROJECT_ID = "personal-gws-1"
const DEFAULT_DATASET_ID = "hackathon_reporting"
const DEFAULT_CREDENTIALS_PATH = "/Users/rajeev/.codex/auth/google/ga4-mcp-personal-gws-1.json"

type QueryableTable =
  | "daily_overview"
  | "event_breakdown"
  | "entry_performance"
  | "round_snapshots"
  | "auth_funnel_daily"
  | "voting_funnel_daily"
  | "manager_operations_daily"
  | "experience_overview_daily"

function getBigQueryClient() {
  const projectId = process.env.BIGQUERY_PROJECT_ID || process.env.GOOGLE_PROJECT_ID || DEFAULT_PROJECT_ID
  const inlineCredentials = process.env.BIGQUERY_SERVICE_ACCOUNT_JSON || process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON

  if (inlineCredentials) {
    return new BigQuery({
      projectId,
      credentials: JSON.parse(inlineCredentials),
    })
  }

  const keyFilename =
    process.env.GOOGLE_APPLICATION_CREDENTIALS ||
    process.env.BIGQUERY_SERVICE_ACCOUNT_PATH ||
    DEFAULT_CREDENTIALS_PATH

  return new BigQuery({
    projectId,
    keyFilename,
  })
}

function datasetPath(table: QueryableTable) {
  const projectId = process.env.BIGQUERY_PROJECT_ID || process.env.GOOGLE_PROJECT_ID || DEFAULT_PROJECT_ID
  const datasetId = process.env.BIGQUERY_DATASET_ID || DEFAULT_DATASET_ID
  return `\`${projectId}.${datasetId}.${table}\``
}

async function runQuery<T>(query: string) {
  const client = getBigQueryClient()
  const response = await client.query({ query, location: "EU" })
  const rows = Array.isArray(response) ? response[0] : response
  return rows as T[]
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

export async function getHackathonAnalyticsDataset(): Promise<HackathonAnalyticsDataset> {
  noStore()

  try {
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
        FROM ${datasetPath("daily_overview")}
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
        FROM ${datasetPath("event_breakdown")}
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
        FROM ${datasetPath("entry_performance")}
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
        FROM ${datasetPath("round_snapshots")}
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
        FROM ${datasetPath("auth_funnel_daily")}
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
        FROM ${datasetPath("voting_funnel_daily")}
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
        FROM ${datasetPath("manager_operations_daily")}
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
        FROM ${datasetPath("experience_overview_daily")}
        ORDER BY event_date, viewportCategory
      `),
    ])

    const dummy = getDummyHackathonAnalyticsDataset()
    const dataset = {
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

    return {
      source: "live",
      generatedAt: new Date().toISOString(),
      hasLiveRows,
      notes: hasLiveRows
        ? [
            "Live mode is reading directly from the dedicated hackathon_reporting dataset in BigQuery.",
            "This route never reads the main rajeevg.com page analytics tables, which avoids the mixed-data problem from the old Looker shell.",
          ]
        : [
            "The reporting tables are reachable, but they do not yet contain landed rows for this route to chart.",
            "Use Dummy preview to inspect the full visual shell while Google finishes populating the export-linked reporting tables.",
          ],
      ...dataset,
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
