"use client"

import { ReactNode, useMemo, useState } from "react"
import { ListTree } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  buildSchemaAnchorId,
  DefinitionTooltipLabel,
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

type EntrySurfaceBuildResult = {
  rows: EntrySurfaceView[]
  omittedEntries: number
  omittedDialogViews: number
  omittedTrackedSubmissions: number
}

function buildEntrySurface(report: HackathonGaReport): EntrySurfaceBuildResult {
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

  const rows = Array.from(grouped.values())
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
  const filteredRows =
    truthEntries.length > 0 ? rows.filter((row) => row.actualVotes != null) : rows
  const omittedRows =
    truthEntries.length > 0 ? rows.filter((row) => row.actualVotes == null) : []

  return {
    rows: filteredRows.sort((left, right) => {
      if ((right.actualVotes ?? -1) !== (left.actualVotes ?? -1)) {
        return (right.actualVotes ?? -1) - (left.actualVotes ?? -1)
      }

      if (right.voteSubmissions !== left.voteSubmissions) {
        return right.voteSubmissions - left.voteSubmissions
      }

      return right.dialogViews - left.dialogViews
    }),
    omittedEntries: omittedRows.length,
    omittedDialogViews: omittedRows.reduce((sum, row) => sum + row.dialogViews, 0),
    omittedTrackedSubmissions: omittedRows.reduce((sum, row) => sum + row.voteSubmissions, 0),
  }
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
        <div className="mt-3">
          <p className="text-sm font-medium text-foreground">Typical values or units</p>
          <p className="text-sm text-muted-foreground">{definition.typicalValues}</p>
        </div>
        <div className="mt-3">
          <p className="text-sm font-medium text-foreground">How to read it</p>
          <p className="text-sm text-muted-foreground">{definition.interpretation}</p>
        </div>
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
  tooltip,
}: {
  label: string
  value: string
  tooltip?: string
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
        <DefinitionTooltipLabel label={label} tooltip={tooltip} />
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
  const entrySurfaceResult = useMemo(() => buildEntrySurface(report), [report])
  const entrySurface = entrySurfaceResult.rows
  const knownConsentUsers =
    report.consentSummary.acceptedUsers + report.consentSummary.deniedUsers
  const cleanTrackedSubmissions = entrySurface.reduce((sum, row) => sum + row.voteSubmissions, 0)
  const ga4Notes = [
    ...report.notes,
    ...(entrySurfaceResult.omittedEntries > 0
      ? [
          `Entry-level cards exclude ${entrySurfaceResult.omittedEntries} GA4-only entries that do not match the live competition slate, removing ${formatInteger(entrySurfaceResult.omittedTrackedSubmissions)} tracked submit rows and ${formatInteger(entrySurfaceResult.omittedDialogViews)} dialog-view rows from the visible entry analysis.`,
        ]
      : []),
  ]
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
    trackedVoteSubmissions: formatInteger(cleanTrackedSubmissions),
    trackingCoverage: formatCoverageRate(
      cleanTrackedSubmissions,
      report.voteTruth?.totals.totalVotes ?? null,
    ),
  })
  const derivedDefinitions: DerivedDefinition[] = [
    {
      label: "Tracked events",
      meaning: "All analytics events GA4 returned for the hackathon host on the live event day.",
      interpretation: "Use this as an activity volume number, not as a vote or judge total.",
    },
    {
      label: "Tracked users",
      meaning: "Distinct GA4 users seen on vote.rajeevg.com during the live event day.",
      interpretation: "This is an analytics audience count, not the official list of judges.",
    },
    {
      label: "Recorded votes",
      meaning: "Votes saved by the live voting app, independent of analytics consent.",
      interpretation: "Use this as the official vote ledger. It is the total the public scoreboard is based on.",
    },
    {
      label: "Tracked vote submissions",
      meaning: "GA4 vote_submitted telemetry that matched the live competition entries for the same event day.",
      interpretation: "Use this for trend and measurement quality, not as the final vote count.",
    },
    {
      label: "Analytics coverage",
      meaning: "Tracked vote submissions divided by recorded votes.",
      interpretation: "This shows how much of the real vote ledger is visible in analytics.",
    },
    {
      label: "Successful judge sign-ins",
      meaning: "judge_auth_completed events captured on the live event day.",
      interpretation: "Use this to see successful sign-ins GA4 observed, not the final list of judges.",
    },
    {
      label: "Vote modal opens",
      meaning: "vote_dialog_viewed events that matched the live competition entries.",
      interpretation: "Use this to understand demand for the scoring modal before submissions are counted.",
    },
    {
      label: "Average vote score",
      meaning: "Average score from tracked submissions for that entry on the live event day.",
      interpretation: "Read it as a signal from tracked votes only, not as the official scoreboard average.",
    },
    {
      label: "Accepted users",
      meaning: "Tracked users who appeared on page_context rows with consent marked as accepted.",
      interpretation: "Use this as the plain accepted count, not as a unique daily audience total.",
    },
    {
      label: "Denied users",
      meaning: "Tracked users who appeared on page_context rows with consent marked as denied.",
      interpretation: "Users can appear in both accepted and denied counts if they first loaded denied and later accepted.",
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
          "Direct GA4 reporting for the live hackathon event day, focused on what analytics captured and what it missed."
        }
        heroDescription="This page is the direct analytics view for the hackathon event day. It focuses on telemetry quality, consent impact, and live competition behavior without mixing in warehouse status."
        onSourceChange={setSource}
        showDummyPreview={false}
        source={source}
        summaryMetrics={summaryMetrics}
        topBadges={["Hackathon", `Host ${report.hostname}`, report.historicalWindow, "GA4"]}
        preMetricContent={
          <div className="space-y-4">
            <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
              <HackathonDisclosureCard
                title="Metric and field definitions"
                description="Plain-English definitions for every GA4 metric and field used on this page."
                icon={<ListTree className="size-4" />}
              >
                <DefinitionTable
                  definitions={report.definitions}
                  derivedDefinitions={derivedDefinitions}
                />
              </HackathonDisclosureCard>
              <HackathonReportingNotesCard notes={ga4Notes} />
            </div>

            <Card className="border-border/70 bg-background/80">
              <CardHeader>
                <CardTitle>Consent and measurement</CardTitle>
                <CardDescription>
                  A plain count of tracked users seen with accepted versus denied consent during the event day.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                <SurfaceMetric
                  label="Accepted"
                  value={formatInteger(report.consentSummary.acceptedUsers)}
                  tooltip="Tracked users seen on page_context rows where consent was marked accepted."
                />
                <SurfaceMetric
                  label="Denied"
                  value={formatInteger(report.consentSummary.deniedUsers)}
                  tooltip="Tracked users seen on page_context rows where consent was marked denied."
                />
                <div className="sm:col-span-2 rounded-2xl border border-border/70 bg-muted/30 p-4">
                  <p className="text-sm leading-6 text-muted-foreground">
                    {knownConsentUsers <= 0
                      ? "Known accepted-versus-denied consent rows are not available yet."
                      : `${formatInteger(
                          report.consentSummary.acceptedUsers,
                        )} tracked users were seen accepted and ${formatInteger(
                          report.consentSummary.deniedUsers,
                        )} were seen denied. The overall tracked-user total is ${formatInteger(
                          report.overview.totalUsers,
                        )}, so these consent buckets overlap when the same person first lands denied and later accepts.`}
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
              <CardTitle>Top tracked events</CardTitle>
              <CardDescription>
                The biggest GA4 event groups for the live event day, shown as telemetry rather than as warehouse modeling.
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

        </div>

        <Card className="border-border/70 bg-background/80">
          <CardHeader>
            <CardTitle>Entry-by-entry tracking</CardTitle>
            <CardDescription>
              Real competition entries only, with GA4 demand, tracked submissions, recorded vote totals, and tracked average score.
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
                          Recorded votes{" "}
                          {row.actualVotes == null ? "Unavailable" : formatInteger(row.actualVotes)}
                        </Badge>
                        <Badge variant="outline">
                          Analytics coverage {formatShare(row.trackingCoverage)}
                        </Badge>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                      <SurfaceMetric
                        label="Vote modal opens"
                        value={formatInteger(row.dialogViews)}
                        tooltip="vote_dialog_viewed events that matched this competition entry."
                      />
                      <SurfaceMetric
                        label="Tracked vote submissions"
                        value={formatInteger(row.voteSubmissions)}
                        tooltip="vote_submitted events GA4 recorded for this competition entry."
                      />
                      <SurfaceMetric
                        label="Recorded votes"
                        value={row.actualVotes == null ? "Unavailable" : formatInteger(row.actualVotes)}
                        tooltip="Votes saved by the app for this entry. This is the source-of-truth value."
                      />
                      <SurfaceMetric
                        label="Analytics coverage"
                        value={formatShare(row.trackingCoverage)}
                        tooltip="Tracked vote submissions divided by recorded votes for this entry."
                      />
                      <SurfaceMetric
                        label="Average vote score"
                        value={formatScore(row.averageScore)}
                        tooltip="Average score from tracked submissions for this entry."
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
                                Recorded votes{" "}
                                {row.actualVotes == null ? "Unavailable" : formatInteger(row.actualVotes)}
                              </Badge>
                              <Badge variant="outline">
                                Analytics coverage {formatShare(row.trackingCoverage)}
                              </Badge>
                            </div>
                          </div>

                          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                            <SurfaceMetric
                              label="Vote modal opens"
                              value={formatInteger(row.dialogViews)}
                              tooltip="vote_dialog_viewed events that matched this competition entry."
                            />
                            <SurfaceMetric
                              label="Tracked vote submissions"
                              value={formatInteger(row.voteSubmissions)}
                              tooltip="vote_submitted events GA4 recorded for this competition entry."
                            />
                            <SurfaceMetric
                              label="Recorded votes"
                              value={row.actualVotes == null ? "Unavailable" : formatInteger(row.actualVotes)}
                              tooltip="Votes saved by the app for this entry. This is the source-of-truth value."
                            />
                            <SurfaceMetric
                              label="Analytics coverage"
                              value={formatShare(row.trackingCoverage)}
                              tooltip="Tracked vote submissions divided by recorded votes for this entry."
                            />
                            <SurfaceMetric
                              label="Average vote score"
                              value={formatScore(row.averageScore)}
                              tooltip="Average score from tracked submissions for this entry."
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
