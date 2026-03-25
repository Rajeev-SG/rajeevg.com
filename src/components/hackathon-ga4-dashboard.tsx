"use client"

import { ReactNode, useMemo, useState } from "react"
import { ListTree } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  buildSchemaAnchorId,
  HackathonDisclosureCard,
  HackathonReportingNotesCard,
  HackathonReportingShell,
  buildHackathonSummaryMetrics,
} from "@/components/hackathon-reporting-shell"
import { cn } from "@/lib/utils"
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

function DefinitionGroup({
  items,
  overflowLabel,
  gridClassName,
}: {
  items: ReactNode[]
  overflowLabel: string
  gridClassName: string
}) {
  const visibleItems = items.slice(0, 5)
  const hiddenItems = items.slice(5)

  return (
    <div className="space-y-4">
      <div className={gridClassName}>{visibleItems}</div>
      {hiddenItems.length ? (
        <details className="rounded-2xl border border-border/60 bg-background/50">
          <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-foreground">
            {overflowLabel} ({hiddenItems.length})
          </summary>
          <div className={cn("border-t border-border/60 px-4 py-4", gridClassName)}>
            {hiddenItems}
          </div>
        </details>
      ) : null}
    </div>
  )
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
  const derivedItems = derivedDefinitions.map((definition) => (
    <details
      key={definition.label}
      id={buildSchemaAnchorId(definition.label)}
      className="rounded-2xl border border-border/70 bg-background/70"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 [&::-webkit-details-marker]:hidden">
        <div className="flex flex-wrap items-center gap-2">
          <span className="break-words text-base font-semibold">{definition.label}</span>
          <Badge variant="outline">derived</Badge>
        </div>
        <span className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Open</span>
      </summary>
      <div className="space-y-3 border-t border-border/60 px-5 py-4 text-sm">
        <p className="leading-6 text-muted-foreground">{definition.meaning}</p>
        <div>
          <p className="font-medium text-foreground">How to read it</p>
          <p className="text-muted-foreground">{definition.interpretation}</p>
        </div>
      </div>
    </details>
  ))
  const definitionItems = definitions.map((definition) => (
    <details
      key={definition.key}
      id={buildSchemaAnchorId(definition.label)}
      className="rounded-2xl border border-border/60 bg-background/50"
    >
      <summary className="flex cursor-pointer list-none flex-col gap-2 px-4 py-4 sm:flex-row sm:items-center sm:justify-between [&::-webkit-details-marker]:hidden">
        <p className="break-words font-medium text-foreground">{definition.label}</p>
        <Badge variant="outline">{definition.type}</Badge>
      </summary>
      <div className="border-t border-border/60 px-4 py-4">
        <p className="break-all text-sm text-muted-foreground">{definition.key}</p>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">{definition.meaning}</p>
      </div>
    </details>
  ))

  return (
    <div className="space-y-6">
      <DefinitionGroup
        items={derivedItems}
        overflowLabel="More derived metrics"
        gridClassName="grid gap-4 lg:grid-cols-2"
      />
      <DefinitionGroup
        items={definitionItems}
        overflowLabel="More schema fields"
        gridClassName="grid gap-4 md:grid-cols-2"
      />
    </div>
  )
}

function SurfaceMetric({
  label,
  value,
  definitionId,
}: {
  label: string
  value: string
  definitionId?: string
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
        {definitionId ? (
          <a href={`#${definitionId}`} className="transition hover:text-foreground">
            {label}
          </a>
        ) : (
          label
        )}
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
  const primaryEventSurface = report.eventSurface.slice(0, 5)
  const overflowEventSurface = report.eventSurface.slice(5, 12)
  const primaryEntrySurface = entrySurface.slice(0, 5)
  const overflowEntrySurface = entrySurface.slice(5)

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
  })
  const derivedDefinitions: DerivedDefinition[] = [
    {
      label: "Event count",
      meaning: "All hackathon-host analytics events returned on the live event day.",
      interpretation: "Use this to understand telemetry volume, not as a scorecard metric.",
    },
    {
      label: "Users",
      meaning: "Distinct GA4 users seen on vote.rajeevg.com during the live event day.",
      interpretation: "This is a telemetry audience number, not a judge roster.",
    },
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
      label: "Auth completions",
      meaning: "judge_auth_completed events captured on the live event day.",
      interpretation: "Use this to see successful sign-ins GA4 observed, not the final list of judges.",
    },
    {
      label: "Dialog views",
      meaning: "vote_dialog_viewed telemetry captured on the live event day.",
      interpretation: "This is demand for the vote modal before submit completion is considered.",
    },
    {
      label: "Avg score",
      meaning: "Average submitted score value captured for the entry on the live event day.",
      interpretation: "Read it as a quality signal for votes GA4 actually saw, not as the authoritative scoreboard average.",
    },
    {
      label: "Granted page-context share",
      meaning: "Page-context events with granted analytics consent divided by known granted plus denied page-context states.",
      interpretation: "This is the consent-rate proxy that best explains why telemetry and the live vote ledger diverge.",
    },
    {
      label: "Granted page-context hits",
      meaning: "page_context events on the live event day where GA carried analytics_consent_state = granted.",
      interpretation: "This is the numerator behind the granted share.",
    },
    {
      label: "Denied page-context hits",
      meaning: "page_context events on the live event day where GA carried analytics_consent_state = denied.",
      interpretation: "This is the denominator counterpart behind the granted share.",
    },
    {
      label: "Consent grants captured",
      meaning: "consent_state_updated events on the live event day where consent_preference = granted.",
      interpretation: "This shows observed positive consent actions, separate from page-context state.",
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
        topBadges={["Hackathon", `Host ${report.hostname}`, report.historicalWindow, "GA4"]}
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
                  definitionId={buildSchemaAnchorId("Granted page-context share")}
                />
                <SurfaceMetric
                  label="Granted page-context hits"
                  value={formatInteger(report.consentSummary.pageContextGranted)}
                  definitionId={buildSchemaAnchorId("Granted page-context hits")}
                />
                <SurfaceMetric
                  label="Denied page-context hits"
                  value={formatInteger(report.consentSummary.pageContextDenied)}
                  definitionId={buildSchemaAnchorId("Denied page-context hits")}
                />
                <SurfaceMetric
                  label="Consent grants captured"
                  value={formatInteger(report.consentSummary.consentGrantedUpdates)}
                  definitionId={buildSchemaAnchorId("Consent grants captured")}
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
              <CardTitle>Event-day event surface</CardTitle>
              <CardDescription>
                The top GA event groupings for the live event day, kept intentionally simple so the page shows behavior patterns without pretending it is a warehouse model.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {report.eventSurface.length ? (
                <>
                  {primaryEventSurface.map((row) => (
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
                  ))}
                  {overflowEventSurface.length ? (
                    <details className="rounded-2xl border border-border/60 bg-background/50">
                      <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-foreground">
                        More event groups ({overflowEventSurface.length})
                      </summary>
                      <div className="space-y-3 border-t border-border/60 px-4 py-4">
                        {overflowEventSurface.map((row) => (
                          <div
                            key={`${row.eventName}-${row.viewerRole}-${row.competitionStatus}`}
                            className="rounded-2xl border border-border/60 bg-background/70 p-4"
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
                          </div>
                        ))}
                      </div>
                    </details>
                  ) : null}
                </>
              ) : (
                <p className="text-sm leading-6 text-muted-foreground">
                  No hackathon-host event rows were returned by GA for the current event day.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-background/80">
            <CardHeader>
              <CardTitle>Telemetry checkpoints</CardTitle>
              <CardDescription>
                The route keeps the checkpoints that explain reporting quality on the live event day: auth completions, dialog demand, tracked submits, and the live vote total they are being compared against.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <SurfaceMetric
                label="Auth completions"
                value={formatInteger(report.overview.judgeAuthCompletions)}
                definitionId={buildSchemaAnchorId("Auth completions")}
              />
              <SurfaceMetric
                label="Dialog views"
                value={formatInteger(report.overview.voteDialogViews)}
                definitionId={buildSchemaAnchorId("Dialog views")}
              />
              <SurfaceMetric
                label="Tracked submits"
                value={formatInteger(report.overview.voteSubmissions)}
                definitionId={buildSchemaAnchorId("Tracked submits")}
              />
              <SurfaceMetric
                label="Persisted votes"
                value={
                  report.voteTruth
                    ? formatInteger(report.voteTruth.totals.totalVotes)
                    : "Unavailable"
                }
                definitionId={buildSchemaAnchorId("Persisted votes")}
              />
            </CardContent>
          </Card>
        </div>

        <Card className="border-border/70 bg-background/80">
          <CardHeader>
            <CardTitle>Entry surface</CardTitle>
            <CardDescription>
              Per-project demand, tracked submits, source-of-truth vote counts, and score quality for the live event day.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {entrySurface.length ? (
              <>
                {primaryEntrySurface.map((row) => {
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
                        label="Dialog views"
                        value={formatInteger(row.dialogViews)}
                        definitionId={buildSchemaAnchorId("Dialog views")}
                      />
                      <SurfaceMetric
                        label="Tracked submits"
                        value={formatInteger(row.voteSubmissions)}
                        definitionId={buildSchemaAnchorId("Tracked submits")}
                      />
                      <SurfaceMetric
                        label="Persisted votes"
                        value={row.actualVotes == null ? "Unavailable" : formatInteger(row.actualVotes)}
                        definitionId={buildSchemaAnchorId("Persisted votes")}
                      />
                      <SurfaceMetric
                        label="GA4 coverage"
                        value={formatShare(row.trackingCoverage)}
                        definitionId={buildSchemaAnchorId("GA4 coverage")}
                      />
                      <SurfaceMetric
                        label="Avg score"
                        value={formatScore(row.averageScore)}
                        definitionId={buildSchemaAnchorId("Avg score")}
                      />
                    </div>
                  </div>
                )
                })}
                {overflowEntrySurface.length ? (
                  <details className="rounded-[1.5rem] border border-border/60 bg-background/50">
                    <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-foreground">
                      More entries ({overflowEntrySurface.length})
                    </summary>
                    <div className="space-y-4 border-t border-border/60 px-4 py-4">
                      {overflowEntrySurface.map((row) => (
                        <div
                          key={`${row.entrySlug}-${row.entryName}`}
                          className="rounded-[1.5rem] border border-border/60 bg-background/70 p-4"
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
                              label="Dialog views"
                              value={formatInteger(row.dialogViews)}
                              definitionId={buildSchemaAnchorId("Dialog views")}
                            />
                            <SurfaceMetric
                              label="Tracked submits"
                              value={formatInteger(row.voteSubmissions)}
                              definitionId={buildSchemaAnchorId("Tracked submits")}
                            />
                            <SurfaceMetric
                              label="Persisted votes"
                              value={row.actualVotes == null ? "Unavailable" : formatInteger(row.actualVotes)}
                              definitionId={buildSchemaAnchorId("Persisted votes")}
                            />
                            <SurfaceMetric
                              label="GA4 coverage"
                              value={formatShare(row.trackingCoverage)}
                              definitionId={buildSchemaAnchorId("GA4 coverage")}
                            />
                            <SurfaceMetric
                              label="Avg score"
                              value={formatScore(row.averageScore)}
                              definitionId={buildSchemaAnchorId("Avg score")}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </details>
                ) : null}
              </>
            ) : (
              <p className="text-sm leading-6 text-muted-foreground">
                No entry-level scoring rows are visible in the GA property yet.
              </p>
            )}
          </CardContent>
        </Card>

      </HackathonReportingShell>
    </section>
  )
}
