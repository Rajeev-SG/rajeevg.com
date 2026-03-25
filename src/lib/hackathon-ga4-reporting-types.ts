import type { HackathonVoteTruthSummary } from "@/lib/hackathon-vote-truth"

export type HackathonGaSource = "live" | "dummy"

export type HackathonGaOverview = {
  eventCount: number
  totalUsers: number
  screenPageViews: number
  judgeAuthCompletions: number
  voteDialogViews: number
  voteSubmissions: number
  managerActions: number
}

export type HackathonGaEventRow = {
  eventName: string
  viewerRole: string
  competitionStatus: string
  eventCount: number
  totalUsers: number
}

export type HackathonGaEntryRow = {
  entryName: string
  entrySlug: string
  dialogViews: number
  consentedDialogViews: number
  deniedDialogViews: number
  unknownDialogViews: number
  voteSubmissions: number
  totalUsers: number
  averageScore: number
}

export type HackathonGaConsentSummary = {
  pageContextGranted: number
  pageContextDenied: number
  pageContextUnknown: number
  consentGrantedUpdates: number
}

export type HackathonGaRoundStateRow = {
  competitionStatus: string
  eventCount: number
  averageEntryCount: number
  averageOpenEntryCount: number
  averageParticipatingJudgeCount: number
  averageRemainingVotes: number
}

export type HackathonGaManagerRow = {
  eventName: string
  eventCount: number
}

export type HackathonGaDefinition = {
  key: string
  label: string
  type: "dimension" | "metric"
  meaning: string
}

export type HackathonGaReport = {
  source: HackathonGaSource
  generatedAt: string
  propertyId: string
  hostname: string
  streamId: string
  historicalWindow: string
  hasLiveRows: boolean
  notes: string[]
  voteTruth: HackathonVoteTruthSummary | null
  overview: HackathonGaOverview
  consentSummary: HackathonGaConsentSummary
  eventSurface: HackathonGaEventRow[]
  entrySurface: HackathonGaEntryRow[]
  roundSurface: HackathonGaRoundStateRow[]
  managerSurface: HackathonGaManagerRow[]
  definitions: HackathonGaDefinition[]
}
