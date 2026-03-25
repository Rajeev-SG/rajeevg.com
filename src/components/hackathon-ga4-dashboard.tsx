"use client"

import { useMemo, useState } from "react"
import { ListTree, ShieldCheck } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  HackathonDisclosureCard,
  HackathonReportingNotesCard,
  HackathonReportingShell,
  buildHackathonSummaryMetrics,
} from "@/components/hackathon-reporting-shell"
import type {
  HackathonGaDefinition,
  HackathonGaReport,
} from "@/lib/hackathon-ga4-reporting-types"

function formatInteger(value: number) {
  return new Intl.NumberFormat("en-GB").format(value)
}

function formatScore(value: number | null) {
  if (value == null || !Number.isFinite(value)) return "N/A"
  return value.toFixed(1)
}

function formatCoverageRate(trackedVotes: number, persistedVotes: number | null) {
  if (persistedVotes == null || persistedVotes <= 0) return "N/A"
  const percentage = (trackedVotes / persistedVotes) * 100
  return `${percentage >= 10 ? percentage.toFixed(0) : percentage.toFixed(1)}%`
}

function formatShare(value: number | null) {
  if (value == null || !Number.isFinite(value)) return "N/A"
  const percentage = value * 100
  return `${percentage >= 10 ? percentage.toFixed(0) : percentage.toFixed(1)}%`
}

function normalizeEntryToken(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

type DerivedDefinition = {
  label: string
  meaning: string
  interpretation: string
}

type EntrySurfaceView = {
  entryName: string
  entrySlug: string
  dialogViews: number
  consentedDialogViews: number
  deniedDialogViews: number
  unknownDialogViews: number
  voteSubmissions: number
  averageScore: number | null
  actualVotes: number | null
  trackingCoverage: number | null
}

function buildEntrySurface(report: HackathonGaReport): EntrySurfaceView[] {
  const truthEntries = report.voteTruth?.entries ?? []
  const truthBySlug = new Map(truthEntries.map((entry) => [entry.slug, entry]))
  const truthByName = new Map(
    truthEntries.map((entry) => [normalizeEntryToken(entry.projectName), entry]),
  )
  const grouped = new Map<
    string,
    EntrySurfaceView & {
      scoreSum: number
      scoreSamples: number
    }
  >()

  for (const row of report.entrySurface) {
    const truthMatch =
      truthBySlug.get(row.entrySlug) ||
      truthByName.get(normalizeEntryToken(row.entryName || row.entrySlug))
    const key =
      truthMatch?.slug ||
      row.entrySlug ||
      normalizeEntryToken(row.entryName || "") ||
      `unknown-${grouped.size + 1}`
    const current = grouped.get(key) ?? {
      entryName: truthMatch?.projectName || row.entryName || row.entrySlug || "Unknown entry",
      entrySlug: truthMatch?.slug || row.entrySlug || normalizeEntryToken(row.entryName || ""),
      dialogViews: 0,
      consentedDialogViews: 0,
      deniedDialogViews: 0,
      unknownDialogViews: 0,
      voteSubmissions: 0,
      averageScore: null,
      actualVotes: truthMatch?.voteCount ?? null,
      trackingCoverage: null,
      scoreSum: 0,
      scoreSamples: 0,
    }

    current.entryName = truthMatch?.projectName || current.entryName
    current.entrySlug = truthMatch?.slug || current.entrySlug
    current.actualVotes = truthMatch?.voteCount ?? current.actualVotes
    current.dialogViews += row.dialogViews
    current.consentedDialogViews += row.consentedDialogViews
    current.deniedDialogViews += row.deniedDialogViews
    current.unknownDialogViews += row.unknownDialogViews
    current.voteSubmissions += row.voteSubmissions

    if (row.voteSubmissions > 0 && Number.isFinite(row.averageScore)) {
      current.scoreSum += row.averageScore * row.voteSubmissions
      current.scoreSamples += row.voteSubmissions
    }

    grouped.set(key, current)
  }

  return Array.from(grouped.values())
    .map(({ scoreSum, scoreSamples, ...row }) => {
      const averageScore =
        scoreSamples > 0
          ? scoreSum / scoreSamples
          : truthBySlug.get(row.entrySlug)?.averageScore ?? null
      const trackingCoverage =
        row.actualVotes != null && row.actualVotes > 0
          ? row.voteSubmissions / row.actualVotes
          : null

      return {
        ...row,
        averageScore,
        trackingCoverage,
      }
    })
    .sort((left, right) => {
      if ((right.actualVotes ?? -1) !== (left.actualVotes ?? -1)) {
        return (right.actualVotes ?? -1) - (left.actualVotes ?? -1)
      }

      if (right.voteSubmissions !== left.voteSubmissions) {
        return right.voteSubmissions - left.voteSubmissions
      }

      return right.dialogViews - left.dialogViews
    })
}

function DefinitionTable({
  definitions,
  derivedDefinitions,
}: {
  definitions: HackathonGaDefinition[]
  derivedDefinitions: DerivedDefinition[]
}) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-2">
        {derivedDefinitions.map((definition) => (
          <Card key={definition.label} className="border-border/70 bg-background/70">
            <CardHeader className="space-y-3 pb-3">
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="break-words text-base">{definition.label}</CardTitle>
                <Badge variant="outline">derived</Badge>
              </div>
              <CardDescription className="text-sm leading-6">{definition.meaning}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="font-medium text-foreground">How to read it</p>
                <p className="text-muted-foreground">{definition.interpretation}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {definitions.map((definition) => (
          <div
            key={definition.key}
            className="rounded-2xl border border-border/60 bg-background/50 p-4"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="break-words font-medium text-foreground">{definition.label}</p>
              <Badge variant="outline">{definition.type}</Badge>
            </div>
            <p className="mt-2 break-all text-sm text-muted-foreground">{definition.key}</p>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{definition.meaning}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function SurfaceMetric({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 break-words text-lg font-semibold tracking-tight">{value}</p>
    </div>
  )
}

export function HackathonGa4Dashboard({
  live,
  dummy,
}: {
  live: HackathonGaReport
  dummy: HackathonGaReport
}) {
  const [source, setSource] = useState<"live" | "dummy">("live")
  const report = source === "live" ? live : dummy
  const entrySurface = useMemo(() => buildEntrySurface(report), [report])
  const knownPageContexts =
    report.consentSummary.pageContextGranted + report.consentSummary.pageContextDenied
  const grantedPageContextShare =
    knownPageContexts > 0 ? report.consentSummary.pageContextGranted / knownPageContexts : null
  const eventSurfaceMax = useMemo(
    () => Math.max(...report.eventSurface.map((row) => row.eventCount), 1),
    [report.eventSurface],
  )

  const summaryMetrics = buildHackathonSummaryMetrics({
    eventCount: formatInteger(report.overview.eventCount),
    totalUsers: formatInteger(report.overview.totalUsers),
    actualVotes:
      report.voteTruth != null ? formatInteger(report.voteTruth.totals.totalVotes) : "Unavailable",
    trackedVoteSubmissions: formatInteger(report.overview.voteSubmissions),
    trackingCoverage: formatCoverageRate(
      report.overview.voteSubmissions,
      report.voteTruth?.totals.totalVotes ?? null,
    ),
    managerActions: formatInteger(report.overview.managerActions),
  })
  const derivedDefinitions: DerivedDefinition[] = [
    {
      label: "Persisted votes",
      meaning: "Authoritative vote rows from the live competition summary, independent of analytics consent.",
      interpretation: "Use this as the vote ledger. It is the number the public scoreboard actually closes over.",
    },
    {
      label: "Tracked submits",
      meaning: "GA4 vote_submitted telemetry captured for the same host and reporting window.",
      interpretation: "Use this for behavior trends, not as the final vote count.",
    },
    {
      label: "GA4 coverage",
      meaning: "Tracked submits divided by persisted votes.",
      interpretation: "This is the clearest indication of how much of the real vote ledger is visible in analytics.",
    },
    {
      label: "Granted page-context share",
      meaning: "Page-context events with granted analytics consent divided by known granted plus denied page-context states.",
      interpretation: "This is the consent-rate proxy that best explains why telemetry and the live vote ledger diverge.",
    },
  ]

  return (
    <section
      className="space-y-8"
      data-analytics-section="hackathon_ga4_reporting"
      data-analytics-item-type="page_section"
      data-analytics-page-context="primary"
      data-analytics-page-content-group="projects"
      data-analytics-page-content-type="hackathon_ga4_reporting"
    >
      <HackathonReportingShell
        activeSurface="ga4"
        generatedAt={report.generatedAt}
        summary={
          report.notes[0] ??
          "Direct GA4 reporting for the same hackathon story, using the promoted event schema on the shared property."
        }
        onSourceChange={setSource}
        showDummyPreview={false}
        source={source}
        summaryMetrics={summaryMetrics}
        topBadges={["Hackathon", `Host ${report.hostname}`, "GA4"]}
        preMetricContent={
          <div className="space-y-4">
            <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
              <HackathonDisclosureCard
                title="Promoted schema and derived metrics"
                description="The schema reference now sits between the header and the topline cards, so the article explains both the underlying GA fields and the reporting math built on top of them."
                icon={<ListTree className="size-4" />}
              >
                <DefinitionTable
                  definitions={report.definitions}
                  derivedDefinitions={derivedDefinitions}
                />
              </HackathonDisclosureCard>
              <HackathonReportingNotesCard notes={report.notes} />
            </div>

            <Card className="border-border/70 bg-background/80">
              <CardHeader>
                <CardTitle>Consent and tracking impact</CardTitle>
                <CardDescription>
                  This is the evidence layer for why the telemetry cards do not match the live vote ledger one for one.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <SurfaceMetric
                  label="Granted page-context share"
                  value={formatShare(grantedPageContextShare)}
                />
                <SurfaceMetric
                  label="Granted page-context hits"
                  value={formatInteger(report.consentSummary.pageContextGranted)}
                />
                <SurfaceMetric
                  label="Denied page-context hits"
                  value={formatInteger(report.consentSummary.pageContextDenied)}
                />
                <SurfaceMetric
                  label="Consent grants captured"
                  value={formatInteger(report.consentSummary.consentGrantedUpdates)}
                />
                <div className="sm:col-span-2 xl:col-span-4 rounded-2xl border border-border/70 bg-muted/30 p-4">
                  <p className="text-sm leading-6 text-muted-foreground">
                    {grantedPageContextShare == null
                      ? "Known granted-versus-denied page-context rows are not available yet, so this route can only fall back to vote tracking coverage when explaining telemetry loss."
                      : `Only ${formatShare(
                          grantedPageContextShare,
                        )} of known page-context hits were granted. That means this page is useful for understanding consented behavior, but it cannot act as the final vote ledger.`}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        }
      >
        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <Card className="border-border/70 bg-background/80">
            <CardHeader>
              <CardTitle>Historical event surface</CardTitle>
              <CardDescription>
                The top GA event groupings for the hackathon host, kept intentionally simple so the live route shows behavior patterns without pretending it is a warehouse model.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {report.eventSurface.length ? (
                report.eventSurface.slice(0, 12).map((row) => (
                  <div
                    key={`${row.eventName}-${row.viewerRole}-${row.competitionStatus}`}
                    className="rounded-2xl border border-border/60 bg-background/50 p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="break-words font-medium text-foreground">{row.eventName}</p>
                        <p className="break-words text-sm text-muted-foreground">
                          {row.viewerRole} · {row.competitionStatus}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-2xl font-semibold">{formatInteger(row.eventCount)}</p>
                        <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                          {formatInteger(row.totalUsers)} users
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-muted/40">
                      <div
                        className="h-2 rounded-full bg-cyan-500/80"
                        style={{
                          width: `${Math.max(
                            8,
                            Math.round((row.eventCount / eventSurfaceMax) * 100),
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm leading-6 text-muted-foreground">
                  No hackathon-host event rows were returned by GA for the current historical window.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-background/80">
            <CardHeader>
              <CardTitle>Telemetry checkpoints</CardTitle>
              <CardDescription>
                The route keeps the checkpoints that explain the reporting quality: auth completions, dialog demand, tracked submits, and the live vote total they are being compared against.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <SurfaceMetric
                label="Auth completions"
                value={formatInteger(report.overview.judgeAuthCompletions)}
              />
              <SurfaceMetric
                label="Dialog views"
                value={formatInteger(report.overview.voteDialogViews)}
              />
              <SurfaceMetric
                label="Tracked submits"
                value={formatInteger(report.overview.voteSubmissions)}
              />
              <SurfaceMetric
                label="Persisted votes"
                value={
                  report.voteTruth
                    ? formatInteger(report.voteTruth.totals.totalVotes)
                    : "Unavailable"
                }
              />
            </CardContent>
          </Card>
        </div>

        <Card className="border-border/70 bg-background/80">
          <CardHeader>
            <CardTitle>Entry surface</CardTitle>
            <CardDescription>
              Per-project demand, consent, tracked submits, and source-of-truth vote counts shown together. Redundant aggregate averages are removed on purpose.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {entrySurface.length ? (
              entrySurface.map((row) => {
                const knownDialogs = row.consentedDialogViews + row.deniedDialogViews
                const grantedDialogShare =
                  knownDialogs > 0 ? row.consentedDialogViews / knownDialogs : null

                return (
                  <div
                    key={`${row.entrySlug}-${row.entryName}`}
                    className="rounded-[1.5rem] border border-border/60 bg-background/50 p-4"
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-1">
                        <p className="break-words text-lg font-semibold text-foreground">
                          {row.entryName}
                        </p>
                        <p className="break-all text-sm text-muted-foreground">{row.entrySlug}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline">
                          Persisted votes{" "}
                          {row.actualVotes == null ? "Unavailable" : formatInteger(row.actualVotes)}
                        </Badge>
                        <Badge variant="outline">
                          Coverage {formatShare(row.trackingCoverage)}
                        </Badge>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                      <SurfaceMetric
                        label="Consented dialogs"
                        value={formatInteger(row.consentedDialogViews)}
                      />
                      <SurfaceMetric
                        label="Granted dialog share"
                        value={formatShare(grantedDialogShare)}
                      />
                      <SurfaceMetric
                        label="Tracked submits"
                        value={formatInteger(row.voteSubmissions)}
                      />
                      <SurfaceMetric
                        label="Avg score"
                        value={formatScore(row.averageScore)}
                      />
                      <SurfaceMetric
                        label="Denied dialogs"
                        value={formatInteger(row.deniedDialogViews)}
                      />
                    </div>

                    {row.unknownDialogViews > 0 ? (
                      <p className="mt-4 text-sm leading-6 text-muted-foreground">
                        {formatInteger(row.unknownDialogViews)} dialog views carried an unknown
                        consent state, so the granted-dialog share only uses rows where GA exposed a
                        known granted or denied value.
                      </p>
                    ) : null}
                  </div>
                )
              })
            ) : (
              <p className="text-sm leading-6 text-muted-foreground">
                No entry-level scoring rows are visible in the GA property yet.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-background/80">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="size-4" />
              Manager operations
            </CardTitle>
            <CardDescription>
              The manager-only controls and failure events visible directly in GA reporting.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {report.managerSurface.length ? (
              report.managerSurface.map((row) => (
                <div
                  key={row.eventName}
                  className="flex flex-col gap-2 rounded-xl border border-border/60 bg-background/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <p className="break-words font-medium text-foreground">{row.eventName}</p>
                  <p className="shrink-0 text-2xl font-semibold">{formatInteger(row.eventCount)}</p>
                </div>
              ))
            ) : (
              <p className="text-sm leading-6 text-muted-foreground">
                No manager-operation rows were returned in the current historical window.
              </p>
            )}
          </CardContent>
        </Card>
      </HackathonReportingShell>
    </section>
  )
}
