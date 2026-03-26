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
  acceptedActions: number
  deniedActions: number
}

export type HackathonGaDefinition = {
  key: string
  label: string
  type: "dimension" | "metric"
  meaning: string
  typicalValues: string
  interpretation: string
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
  definitions: HackathonGaDefinition[]
}
