import "server-only"

const DEFAULT_HACKATHON_VOTING_APP_URL = "https://vote.rajeevg.com"

export type HackathonVoteTruthEntry = {
  rank: number
  slug: string
  projectName: string
  voteCount: number
  totalScore: number
  averageScore: number | null
  isVotingOpen: boolean
}

export type HackathonVoteTruthSummary = {
  source: "competition-public-snapshot"
  summaryUrl: string
  generatedAt: string
  status: string
  startedAt: string | null
  finalizedAt: string | null
  totals: {
    totalVotes: number
    uniqueJudges: number
    totalEntries: number
    openEntries: number
    participatingJudges: number
    remainingVotes: number
    totalScore: number
    averageScore: number | null
  }
  entries: HackathonVoteTruthEntry[]
}

export type HackathonVoteTruthResult = {
  summary: HackathonVoteTruthSummary | null
  note: string | null
}

export type HackathonEventDay = {
  isoDate: string
  label: string
}

function formatCoverageRate(value: number) {
  const percentage = value * 100
  return `${percentage >= 10 ? percentage.toFixed(0) : percentage.toFixed(1)}%`
}

function toIsoDate(value: string | null | undefined) {
  if (!value) return null
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed.toISOString().slice(0, 10)
}

function getHackathonVotingAppBaseUrl() {
  const value = process.env.HACKATHON_VOTING_APP_URL?.trim()
  return (value || DEFAULT_HACKATHON_VOTING_APP_URL).replace(/\/+$/, "")
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value)
}

function parseEntry(value: unknown): HackathonVoteTruthEntry | null {
  if (!value || typeof value !== "object") return null
  const row = value as Record<string, unknown>

  if (
    !isFiniteNumber(row.rank) ||
    typeof row.slug !== "string" ||
    typeof row.projectName !== "string" ||
    !isFiniteNumber(row.voteCount) ||
    !isFiniteNumber(row.totalScore) ||
    (row.averageScore !== null && !isFiniteNumber(row.averageScore)) ||
    typeof row.isVotingOpen !== "boolean"
  ) {
    return null
  }

  return {
    rank: row.rank,
    slug: row.slug,
    projectName: row.projectName,
    voteCount: row.voteCount,
    totalScore: row.totalScore,
    averageScore: row.averageScore,
    isVotingOpen: row.isVotingOpen,
  }
}

function parseSummary(value: unknown, summaryUrl: string): HackathonVoteTruthSummary | null {
  if (!value || typeof value !== "object") return null
  const payload = value as Record<string, unknown>
  const totals = payload.totals as Record<string, unknown> | undefined
  const entriesValue = Array.isArray(payload.entries) ? payload.entries : null

  if (
    payload.source !== "competition-public-snapshot" ||
    typeof payload.generatedAt !== "string" ||
    typeof payload.status !== "string" ||
    !totals ||
    !isFiniteNumber(totals.totalVotes) ||
    !isFiniteNumber(totals.uniqueJudges) ||
    !isFiniteNumber(totals.totalEntries) ||
    !isFiniteNumber(totals.openEntries) ||
    !isFiniteNumber(totals.participatingJudges) ||
    !isFiniteNumber(totals.remainingVotes) ||
    !isFiniteNumber(totals.totalScore) ||
    (totals.averageScore !== null && !isFiniteNumber(totals.averageScore)) ||
    !entriesValue
  ) {
    return null
  }

  const entries = entriesValue.map((entry) => parseEntry(entry)).filter((entry) => entry !== null)

  if (entries.length !== entriesValue.length) {
    return null
  }

  return {
    source: "competition-public-snapshot",
    summaryUrl,
    generatedAt: payload.generatedAt,
    status: payload.status,
    startedAt: typeof payload.startedAt === "string" ? payload.startedAt : null,
    finalizedAt: typeof payload.finalizedAt === "string" ? payload.finalizedAt : null,
    totals: {
      totalVotes: totals.totalVotes,
      uniqueJudges: totals.uniqueJudges,
      totalEntries: totals.totalEntries,
      openEntries: totals.openEntries,
      participatingJudges: totals.participatingJudges,
      remainingVotes: totals.remainingVotes,
      totalScore: totals.totalScore,
      averageScore: totals.averageScore,
    },
    entries,
  }
}

export async function getHackathonVoteTruth(): Promise<HackathonVoteTruthResult> {
  const summaryUrl = `${getHackathonVotingAppBaseUrl()}/api/reporting/public-summary`

  try {
    const response = await fetch(summaryUrl, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    })

    if (!response.ok) {
      return {
        summary: null,
        note: `Source-of-truth summary request returned ${response.status} ${response.statusText}.`,
      }
    }

    const payload = await response.json()
    const summary = parseSummary(payload, summaryUrl)

    if (!summary) {
      return {
        summary: null,
        note: "Source-of-truth summary response did not match the expected schema.",
      }
    }

    return { summary, note: null }
  } catch (error) {
    return {
      summary: null,
      note: error instanceof Error ? error.message : "Unknown source-of-truth summary error.",
    }
  }
}

export function getHackathonEventDay(summary: HackathonVoteTruthSummary | null): HackathonEventDay | null {
  const isoDate =
    toIsoDate(summary?.startedAt) ||
    toIsoDate(summary?.finalizedAt) ||
    toIsoDate(summary?.generatedAt)

  if (!isoDate) return null

  return {
    isoDate,
    label: new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(new Date(`${isoDate}T00:00:00Z`)),
  }
}

export function describeHackathonVoteTruthReconciliation({
  trackedVotes,
  voteTruth,
  fallbackNote,
}: {
  trackedVotes: number
  voteTruth: HackathonVoteTruthSummary | null
  fallbackNote: string | null
}) {
  if (!voteTruth) {
    return fallbackNote
      ? [`Source-of-truth reconciliation could not reach the live voting app summary: ${fallbackNote}`]
      : []
  }

  const persistedVotes = voteTruth.totals.totalVotes
  const voteGap = persistedVotes - trackedVotes
  const coverageRate = persistedVotes > 0 ? trackedVotes / persistedVotes : 0

  return [
    `Source of truth: the live voting app currently reports ${persistedVotes} persisted votes across ${voteTruth.totals.totalEntries} entries and ${voteTruth.totals.uniqueJudges} judges at ${voteTruth.summaryUrl}.`,
    `Tracked analytics coverage: GA4 currently shows ${trackedVotes} vote_submitted events, a gap of ${voteGap} versus the persisted vote total (${formatCoverageRate(coverageRate)} coverage).`,
    "The gap is expected because vote_submitted is client-side telemetry behind analytics consent, while the persisted vote total comes from the live competition snapshot that powers the public scoreboard.",
  ]
}
