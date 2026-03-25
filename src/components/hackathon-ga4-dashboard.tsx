"use client"

import { useMemo, useState } from "react"
import { ListTree } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  HackathonReportingShell,
  HackathonReportingNotesCard,
  buildHackathonSummaryMetrics,
} from "@/components/hackathon-reporting-shell"
import type { HackathonGaReport } from "@/lib/hackathon-ga4-reporting-types"

function formatInteger(value: number) {
  return new Intl.NumberFormat("en-GB").format(value)
}

function formatScore(value: number) {
  return Number.isFinite(value) ? value.toFixed(1) : "0.0"
}

function formatCoverageRate(trackedVotes: number, persistedVotes: number | null) {
  if (persistedVotes == null || persistedVotes <= 0) return "N/A"
  const percentage = (trackedVotes / persistedVotes) * 100
  return `${percentage >= 10 ? percentage.toFixed(0) : percentage.toFixed(1)}%`
}

function RowBar({ value, max }: { value: number; max: number }) {
  const width = max > 0 ? Math.max(8, Math.round((value / max) * 100)) : 0
  return (
    <div className="mt-2 h-2 rounded-full bg-muted/40">
      <div className="h-2 rounded-full bg-cyan-500/80" style={{ width: `${width}%` }} />
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
  const truthEntryMap = useMemo(
    () => new Map(report.voteTruth?.entries.map((entry) => [entry.slug, entry]) ?? []),
    [report.voteTruth]
  )

  const eventMax = useMemo(
    () => Math.max(...report.eventSurface.map((row) => row.eventCount), 1),
    [report.eventSurface]
  )
  const summaryMetrics = buildHackathonSummaryMetrics({
    eventCount: formatInteger(report.overview.eventCount),
    totalUsers: formatInteger(report.overview.totalUsers),
    actualVotes:
      report.voteTruth != null ? formatInteger(report.voteTruth.totals.totalVotes) : "Unavailable",
    trackedVoteSubmissions: formatInteger(report.overview.voteSubmissions),
    trackingCoverage: formatCoverageRate(
      report.overview.voteSubmissions,
      report.voteTruth?.totals.totalVotes ?? null
    ),
    managerActions: formatInteger(report.overview.managerActions),
  })

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
        source={source}
        summaryMetrics={summaryMetrics}
        topBadges={["Hackathon", `Host ${report.hostname}`, "GA4"]}
      >
      <HackathonReportingNotesCard notes={report.notes} />

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-border/70 bg-background/80">
          <CardHeader>
            <CardTitle>Historical event surface</CardTitle>
            <CardDescription>
              A GA-native view of the hackathon event vocabulary grouped by viewer role and round state.
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
                  <RowBar value={row.eventCount} max={eventMax} />
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
            <CardTitle>Round snapshot surface</CardTitle>
            <CardDescription>
              GA-exposed averages from the promoted snapshot metrics on <code>competition_state_snapshot</code>.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {report.roundSurface.length ? (
              report.roundSurface.map((row) => (
                <div
                  key={row.competitionStatus}
                  className="rounded-2xl border border-border/60 bg-background/50 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-lg font-semibold capitalize">{row.competitionStatus}</p>
                    <Badge variant="outline">{formatInteger(row.eventCount)} snapshots</Badge>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Entries</p>
                      <p className="text-xl font-semibold">{formatScore(row.averageEntryCount)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Open entries</p>
                      <p className="text-xl font-semibold">{formatScore(row.averageOpenEntryCount)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Judges in denominator</p>
                      <p className="text-xl font-semibold">{formatScore(row.averageParticipatingJudgeCount)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Remaining votes</p>
                      <p className="text-xl font-semibold">{formatScore(row.averageRemainingVotes)}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm leading-6 text-muted-foreground">
                No competition snapshot rows are visible in GA yet for the hackathon hostname.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="border-border/70 bg-background/80">
          <CardHeader>
            <CardTitle>Entry surface</CardTitle>
            <CardDescription>
              Per-project demand and scoring rows derived from GA event-level dimensions and metrics.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {report.entrySurface.length ? (
              report.entrySurface.map((row) => {
                const truthEntry = truthEntryMap.get(row.entrySlug)

                return (
                  <div
                    key={row.entrySlug}
                    className="grid gap-3 rounded-2xl border border-border/60 bg-background/50 p-4 sm:grid-cols-2 xl:grid-cols-[minmax(0,1.6fr)_repeat(5,minmax(0,auto))]"
                  >
                    <div className="min-w-0 space-y-1 sm:col-span-2 xl:col-span-1">
                      <p className="break-words font-medium text-foreground">{row.entryName || row.entrySlug}</p>
                      <p className="break-all text-sm text-muted-foreground">{row.entrySlug}</p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Dialogs</p>
                      <p className="text-lg font-semibold">{formatInteger(row.dialogViews)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Tracked submits</p>
                      <p className="text-lg font-semibold">{formatInteger(row.voteSubmissions)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Actual votes</p>
                      <p className="text-lg font-semibold">
                        {truthEntry ? formatInteger(truthEntry.voteCount) : "Unavailable"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Avg score</p>
                      <p className="text-lg font-semibold">{formatScore(row.averageScore)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Avg aggregate</p>
                      <p className="text-lg font-semibold">{formatScore(row.averageAggregateScore)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Gap</p>
                      <p className="text-lg font-semibold">
                        {truthEntry ? formatInteger(truthEntry.voteCount - row.voteSubmissions) : "N/A"}
                      </p>
                    </div>
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
            <CardTitle>Manager operations</CardTitle>
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
      </div>

      <Card className="border-border/70 bg-background/80">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListTree className="size-4" />
            Promoted hackathon schema
          </CardTitle>
          <CardDescription>
            The key hackathon dimensions and metrics promoted on the shared property and used by this GA API surface.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {report.definitions.map((definition) => (
            <div key={definition.key} className="rounded-2xl border border-border/60 bg-background/50 p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="break-words font-medium text-foreground">{definition.label}</p>
                <Badge variant="outline">{definition.type}</Badge>
              </div>
              <p className="mt-2 break-all text-sm text-muted-foreground">{definition.key}</p>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{definition.meaning}</p>
            </div>
          ))}
        </CardContent>
      </Card>
      </HackathonReportingShell>
    </section>
  )
}
