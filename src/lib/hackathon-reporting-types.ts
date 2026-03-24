export type ReportSource = "live" | "dummy"

export type DailyOverviewRow = {
  eventDate: string
  totalEvents: number
  pageViews: number
  sessions: number
  uniqueUsers: number
  judgeAuthCompletions: number
  voteDialogViews: number
  voteSubmissions: number
  workbookUploads: number
  roundOpens: number
  finalizations: number
  consentGrants: number
  managerActions: number
  totalScore: number
}

export type EventBreakdownRow = {
  eventDate: string
  eventName: string
  viewerRole: string
  competitionStatus: string
  eventCount: number
  uniqueUsers: number
}

export type EntryPerformanceRow = {
  eventDate: string
  entrySlug: string
  entryName: string
  competitionStatus: string
  dialogViews: number
  eligibleDialogViews: number
  blockedDialogViews: number
  voteSubmitStarts: number
  voteSubmitFailures: number
  votesSubmitted: number
  uniqueVoters: number
  totalScore: number
  averageScore: number
  viewToVoteRate: number
}

export type RoundSnapshotRow = {
  eventDate: string
  latestEventTs: string
  competitionStatus: string
  entryCount: number
  openEntryCount: number
  participatingJudgeCount: number
  totalRemainingVotes: number
}

export type AuthFunnelRow = {
  eventDate: string
  authMethod: string
  authFlow: string
  emailDomain: string
  authRequests: number
  signupStarts: number
  authCompletions: number
  authFailures: number
  googleStarts: number
  googleFailures: number
  uniqueUsers: number
}

export type VotingFunnelRow = {
  eventDate: string
  entrySlug: string
  entryName: string
  viewerRole: string
  viewportCategory: string
  dialogViews: number
  eligibleDialogViews: number
  blockedDialogViews: number
  scoreSelections: number
  submitStarts: number
  submittedVotes: number
  submitFailures: number
  uniqueViewers: number
  uniqueSubmitters: number
  submissionRate: number
}

export type ManagerOperationsRow = {
  eventDate: string
  workbookPickerOpens: number
  workbookUploadStarts: number
  workbookUploadSuccesses: number
  workbookUploadFailures: number
  workbookIssueTotal: number
  importedProjectTotal: number
  entryVotingOpened: number
  entryVotingClosed: number
  roundStarts: number
  roundStartFailures: number
  finalizations: number
  finalizeFailures: number
  resets: number
  resetFailures: number
}

export type ExperienceOverviewRow = {
  eventDate: string
  viewportCategory: string
  theme: string
  analyticsConsentState: string
  boardView: string
  pageContextViews: number
  pageEngagementSummaries: number
  scoreboardSummaryOpened: number
  scoreboardSummaryClosed: number
  tableViewSwitches: number
  chartViewSwitches: number
  sectionViews: number
  uniqueUsers: number
  avgEngagedSeconds: number
  avgInteractionCount: number
  avgScrollDepthPercent: number
}

export type AnalyticsDefinition = {
  key: string
  label: string
  type: "dimension" | "metric"
  meaning: string
  typicalValues: string
  interpretation: string
}

export type HackathonAnalyticsDataset = {
  source: ReportSource
  generatedAt: string
  hasLiveRows: boolean
  notes: string[]
  overview: DailyOverviewRow[]
  eventBreakdown: EventBreakdownRow[]
  entryPerformance: EntryPerformanceRow[]
  roundSnapshots: RoundSnapshotRow[]
  authFunnel: AuthFunnelRow[]
  votingFunnel: VotingFunnelRow[]
  managerOperations: ManagerOperationsRow[]
  experienceOverview: ExperienceOverviewRow[]
  definitions: AnalyticsDefinition[]
}
