import type {
  AnalyticsDefinition,
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

const days = [
  "2026-03-18",
  "2026-03-19",
  "2026-03-20",
  "2026-03-21",
  "2026-03-22",
  "2026-03-23",
]

const entries = [
  { slug: "north-star", name: "North Star" },
  { slug: "signalforge", name: "SignalForge" },
  { slug: "civic-mesh", name: "CivicMesh" },
  { slug: "relay-ops", name: "RelayOps" },
]

const dimensions: AnalyticsDefinition[] = [
  {
    key: "event_source",
    label: "App section",
    type: "dimension",
    meaning: "Which part of the app emitted the event.",
    typicalValues: "scoreboard, vote_dialog, judge_auth, manager_controls, consent_banner",
    interpretation: "Use it to tell whether activity came from browsing, judging, sign-in, or organiser controls.",
  },
  {
    key: "competition_status",
    label: "Judging state",
    type: "dimension",
    meaning: "The judging phase the app was in when the event fired.",
    typicalValues: "preparing, open, finalized",
    interpretation: "Use it to separate setup activity, live judging, and post-results viewing.",
  },
  {
    key: "viewer_role",
    label: "Viewer role",
    type: "dimension",
    meaning: "The kind of visitor the app believed it was serving when the event fired.",
    typicalValues: "public, judge, manager",
    interpretation: "Use it to separate public traffic from judges and the organiser account.",
  },
  {
    key: "entry_slug",
    label: "Entry slug",
    type: "dimension",
    meaning: "Stable identifier for a hackathon project.",
    typicalValues: "north-star, signalforge, civic-mesh",
    interpretation: "Use it to join related rows for the same project even when labels vary slightly.",
  },
  {
    key: "entry_name",
    label: "Entry name",
    type: "dimension",
    meaning: "Human-readable project title from the workbook.",
    typicalValues: "North Star, SignalForge, CivicMesh",
    interpretation: "Use it for labels that non-technical readers will recognise immediately.",
  },
  {
    key: "upload_method",
    label: "Upload method",
    type: "dimension",
    meaning: "How the organiser chose the workbook file.",
    typicalValues: "drag_drop, file_picker",
    interpretation: "Use it to see whether people relied on drag-and-drop or the file picker.",
  },
  {
    key: "workbook_extension",
    label: "Workbook file type",
    type: "dimension",
    meaning: "The file type submitted by the organiser.",
    typicalValues: "xlsx",
    interpretation: "Use it to confirm uploads are coming from the expected workbook format.",
  },
  {
    key: "viewer_can_vote",
    label: "Viewer eligible to vote",
    type: "dimension",
    meaning: "Whether the signed-in viewer was allowed to vote on the project tied to the event.",
    typicalValues: "true, false",
    interpretation: "Use it to separate real scoring opportunities from blocked states.",
  },
  {
    key: "viewer_has_vote",
    label: "Viewer already voted",
    type: "dimension",
    meaning: "Whether the viewer had already submitted their locked score for the project in focus.",
    typicalValues: "true, false",
    interpretation: "Use it to distinguish fresh vote opportunities from already-finished judging.",
  },
  {
    key: "entry_voting_open",
    label: "Entry open for voting",
    type: "dimension",
    meaning: "Whether a specific project was open to new votes when the event fired.",
    typicalValues: "true, false",
    interpretation: "Use it to explain paused judging, blocked attempts, and organiser intervention.",
  },
  {
    key: "consent_source",
    label: "Consent source",
    type: "dimension",
    meaning: "Which UI route or control produced the consent change.",
    typicalValues: "default, banner_accept, banner_decline, preferences",
    interpretation: "Use it to understand where people actually made or changed their consent choice.",
  },
]

const metrics: AnalyticsDefinition[] = [
  {
    key: "issue_count",
    label: "Upload issue count",
    type: "metric",
    meaning: "Validation issues found in a workbook upload attempt.",
    typicalValues: "count",
    interpretation: "Use it to spot workbook quality problems quickly.",
  },
  {
    key: "imported_project_count",
    label: "Imported project count",
    type: "metric",
    meaning: "The number of projects accepted from a workbook upload.",
    typicalValues: "count",
    interpretation: "Use it to confirm import success and compare clean uploads with messy ones.",
  },
  {
    key: "vote_count",
    label: "Vote count snapshot",
    type: "metric",
    meaning: "How many votes were represented by the event or snapshot row.",
    typicalValues: "count",
    interpretation: "Treat this as a snapshot field for charts, not as the final vote ledger.",
  },
  {
    key: "aggregate_score",
    label: "Total score",
    type: "metric",
    meaning: "The summed score recorded for a project.",
    typicalValues: "score points",
    interpretation: "Use it for leaderboard, trend, and project-comparison charts.",
  },
  {
    key: "score",
    label: "Vote score",
    type: "metric",
    meaning: "The single judge-selected score on a 0 to 10 scale.",
    typicalValues: "score points",
    interpretation: "Use it for score distributions, averages, and outlier analysis.",
  },
]

const overview: DailyOverviewRow[] = days.map((eventDate, index) => ({
  eventDate,
  totalEvents: 420 + index * 74,
  pageViews: 130 + index * 18,
  sessions: 78 + index * 10,
  uniqueUsers: 64 + index * 8,
  judgeAuthCompletions: 6 + index * 2,
  voteDialogViews: 28 + index * 14,
  voteSubmissions: 16 + index * 12,
  workbookUploads: index === 0 ? 1 : 0,
  roundOpens: index === 1 ? 1 : 0,
  finalizations: index === days.length - 1 ? 1 : 0,
  consentGrants: 14 + index * 3,
  managerActions: 9 + index * 2,
  totalScore: 58 + index * 41,
}))

const eventBreakdown: EventBreakdownRow[] = [
  ...days.flatMap((eventDate, index) => [
    {
      eventDate,
      eventName: "page_context",
      viewerRole: "public",
      competitionStatus: index < 1 ? "preparing" : index < 5 ? "open" : "finalized",
      eventCount: 96 + index * 8,
      uniqueUsers: 48 + index * 5,
    },
    {
      eventDate,
      eventName: "judge_auth_completed",
      viewerRole: "judge",
      competitionStatus: index < 1 ? "preparing" : "open",
      eventCount: 6 + index,
      uniqueUsers: 6 + index,
    },
    {
      eventDate,
      eventName: "vote_dialog_viewed",
      viewerRole: "judge",
      competitionStatus: index < 1 ? "preparing" : "open",
      eventCount: 22 + index * 9,
      uniqueUsers: 10 + index * 2,
    },
    {
      eventDate,
      eventName: "vote_submitted",
      viewerRole: "judge",
      competitionStatus: index < 1 ? "preparing" : "open",
      eventCount: 14 + index * 11,
      uniqueUsers: 8 + index * 2,
    },
    {
      eventDate,
      eventName: "entry_voting_state_changed",
      viewerRole: "manager",
      competitionStatus: index < 1 ? "preparing" : "open",
      eventCount: index === 2 ? 2 : index === 3 ? 1 : 0,
      uniqueUsers: index >= 2 ? 1 : 0,
    },
  ]),
]

const entryPerformance: EntryPerformanceRow[] = days.flatMap((eventDate, dayIndex) =>
  entries.map((entry, entryIndex) => ({
    eventDate,
    entrySlug: entry.slug,
    entryName: entry.name,
    competitionStatus: dayIndex < 1 ? "preparing" : dayIndex < 5 ? "open" : "finalized",
    dialogViews: 8 + dayIndex * 3 + entryIndex * 2,
    eligibleDialogViews: 6 + dayIndex * 2 + entryIndex,
    blockedDialogViews: 1 + (entryIndex % 2),
    voteSubmitStarts: 5 + dayIndex * 2 + entryIndex,
    voteSubmitFailures: entryIndex === 1 && dayIndex === 2 ? 1 : 0,
    votesSubmitted: 4 + dayIndex * 2 + entryIndex,
    uniqueVoters: 4 + dayIndex + entryIndex,
    totalScore: 24 + dayIndex * 9 + entryIndex * 11,
    averageScore: 6.2 + entryIndex * 0.6 + dayIndex * 0.15,
    viewToVoteRate: 0.48 + entryIndex * 0.06 + dayIndex * 0.03,
  })),
)

const roundSnapshots: RoundSnapshotRow[] = days.map((eventDate, index) => ({
  eventDate,
  latestEventTs: `${eventDate}T18:${String(10 + index).padStart(2, "0")}:00Z`,
  competitionStatus: index < 1 ? "preparing" : index < 5 ? "open" : "finalized",
  entryCount: 4,
  openEntryCount: index === 3 ? 3 : 4,
  participatingJudgeCount: index < 1 ? 0 : 9 + index,
  totalRemainingVotes: index < 1 ? 0 : Math.max(0, 44 - index * 9),
}))

const authFunnel: AuthFunnelRow[] = days.flatMap((eventDate, index) => [
  {
    eventDate,
    authMethod: "email_code",
    authFlow: "passwordless",
    emailDomain: "gmail.com",
    authRequests: 4 + index,
    signupStarts: 1 + (index % 2),
    authCompletions: 3 + index,
    authFailures: index === 2 ? 1 : 0,
    googleStarts: 0,
    googleFailures: 0,
    uniqueUsers: 3 + index,
  },
  {
    eventDate,
    authMethod: "google_oauth",
    authFlow: "popup",
    emailDomain: "gmail.com",
    authRequests: 0,
    signupStarts: 0,
    authCompletions: 2 + index,
    authFailures: 0,
    googleStarts: 3 + index,
    googleFailures: index === 1 ? 1 : 0,
    uniqueUsers: 2 + index,
  },
])

const votingFunnel: VotingFunnelRow[] = days.flatMap((eventDate, dayIndex) =>
  entries.flatMap((entry, entryIndex) =>
    ["mobile", "desktop"].map((viewportCategory, viewportIndex) => ({
      eventDate,
      entrySlug: entry.slug,
      entryName: entry.name,
      viewerRole: "judge",
      viewportCategory,
      dialogViews: 5 + dayIndex * 2 + entryIndex + viewportIndex,
      eligibleDialogViews: 4 + dayIndex + entryIndex,
      blockedDialogViews: viewportIndex === 0 && entryIndex === 2 ? 1 : 0,
      scoreSelections: 4 + dayIndex + entryIndex,
      submitStarts: 4 + dayIndex + entryIndex,
      submittedVotes: 3 + dayIndex + entryIndex,
      submitFailures: entryIndex === 1 && dayIndex === 2 ? 1 : 0,
      uniqueViewers: 3 + dayIndex + entryIndex,
      uniqueSubmitters: 2 + dayIndex + entryIndex,
      submissionRate: 0.52 + entryIndex * 0.04 + viewportIndex * 0.03 + dayIndex * 0.02,
    })),
  ),
)

const managerOperations: ManagerOperationsRow[] = days.map((eventDate, index) => ({
  eventDate,
  workbookPickerOpens: index === 0 ? 1 : 0,
  workbookUploadStarts: index === 0 ? 1 : 0,
  workbookUploadSuccesses: index === 0 ? 1 : 0,
  workbookUploadFailures: 0,
  workbookIssueTotal: 0,
  importedProjectTotal: index === 0 ? 4 : 0,
  entryVotingOpened: index === 1 ? 4 : 0,
  entryVotingClosed: index === 3 ? 1 : 0,
  roundStarts: index === 1 ? 1 : 0,
  roundStartFailures: 0,
  finalizations: index === 5 ? 1 : 0,
  finalizeFailures: 0,
  resets: 0,
  resetFailures: 0,
}))

const experienceOverview: ExperienceOverviewRow[] = days.flatMap((eventDate, index) =>
  ["mobile", "desktop", "tablet"].flatMap((viewportCategory, viewportIndex) =>
    ["dark", "light"].map((theme, themeIndex) => ({
      eventDate,
      viewportCategory,
      theme,
      analyticsConsentState: index < 1 ? "denied" : "granted",
      boardView: viewportCategory === "mobile" ? (index % 2 === 0 ? "table" : "chart") : "table",
      pageContextViews: 12 + index * 3 + viewportIndex,
      pageEngagementSummaries: 7 + index * 2 + themeIndex,
      scoreboardSummaryOpened: viewportCategory === "mobile" ? 4 + index : 1 + themeIndex,
      scoreboardSummaryClosed: viewportCategory === "mobile" ? 3 + index : 1,
      tableViewSwitches: viewportCategory === "mobile" ? 3 + index : 2 + themeIndex,
      chartViewSwitches: viewportCategory === "mobile" ? 2 + index : 1 + themeIndex,
      sectionViews: 11 + index * 4 + viewportIndex,
      uniqueUsers: 8 + index * 2 + viewportIndex,
      avgEngagedSeconds: 24 + index * 3 + viewportIndex * 2,
      avgInteractionCount: 5.2 + index * 0.4 + themeIndex * 0.3,
      avgScrollDepthPercent: 48 + index * 5 + viewportIndex * 3,
    })),
  ),
)

export function getDummyHackathonAnalyticsDataset(): HackathonAnalyticsDataset {
  return {
    source: "dummy",
    generatedAt: "2026-03-24T20:30:00Z",
    hasLiveRows: true,
    notes: [
      "Dummy preview mode is turned on, so the charts show a full judging story even before the export tables land.",
      "The live mode stays isolated to the hackathon reporting dataset and never falls back to rajeevg.com page analytics.",
    ],
    voteTruth: null,
    overview,
    eventBreakdown,
    entryPerformance,
    roundSnapshots,
    authFunnel,
    votingFunnel,
    managerOperations,
    experienceOverview,
    definitions: [...dimensions, ...metrics],
  }
}
