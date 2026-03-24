"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { ArrowRight, BarChart3, Database, Gauge, ListTree, RadioTower, ShieldCheck } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { HackathonGaReport } from "@/lib/hackathon-ga4-reporting-types"

function formatInteger(value: number) {
  return new Intl.NumberFormat("en-GB").format(value)
}

function formatScore(value: number) {
  return Number.isFinite(value) ? value.toFixed(1) : "0.0"
}

function Toggle({
  value,
  onChange,
}: {
  value: "live" | "dummy"
  onChange: (value: "live" | "dummy") => void
}) {
  return (
    <div className="inline-flex rounded-full border border-border/70 bg-muted/30 p-1">
      {[
        { key: "live", label: "Live reporting" },
        { key: "dummy", label: "Dummy preview" },
      ].map((option) => (
        <button
          key={option.key}
          type="button"
          onClick={() => onChange(option.key as "live" | "dummy")}
          className={
            value === option.key
              ? "rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background"
              : "rounded-full px-4 py-2 text-sm font-medium text-muted-foreground"
          }
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

function MetricCard({
  label,
  value,
  detail,
  icon,
}: {
  label: string
  value: string
  detail: string
  icon: React.ReactNode
}) {
  return (
    <Card className="border-border/70 bg-background/80">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            {label}
          </p>
          <CardTitle className="text-3xl">{value}</CardTitle>
        </div>
        <div className="rounded-full border border-border/60 bg-muted/30 p-2 text-muted-foreground">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-6 text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  )
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

  const eventMax = useMemo(
    () => Math.max(...report.eventSurface.map((row) => row.eventCount), 1),
    [report.eventSurface]
  )

  return (
    <section
      className="space-y-8"
      data-analytics-section="hackathon_ga4_reporting"
      data-analytics-item-type="page_section"
      data-analytics-page-context="primary"
      data-analytics-page-content-group="projects"
      data-analytics-page-content-type="hackathon_ga4_reporting"
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">GA4 Data API</Badge>
          <Badge variant="outline">Shared property {report.propertyId}</Badge>
          <Badge variant="outline">Host filter {report.hostname}</Badge>
          <Badge variant="outline">Stream {report.streamId}</Badge>
        </div>
        <div className="space-y-3">
          <p className="text-sm uppercase tracking-[0.22em] text-muted-foreground">Google Analytics surface</p>
          <h1 className="max-w-4xl text-3xl font-bold tracking-tight sm:text-4xl">
            Hackathon GA4 reporting surface
          </h1>
          <p className="max-w-4xl text-base leading-7 text-muted-foreground sm:text-lg">
            This route reads the shared GA4 property through the official Google Analytics library,
            filters to <code>vote.rajeevg.com</code>, and turns the promoted hackathon schema into a
            dedicated reporting view that can be checked independently of the BigQuery fallback.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Toggle value={source} onChange={setSource} />
          <Button asChild variant="outline">
            <Link href="/projects/hackathon-voting-analytics">
              Back to BigQuery dashboard
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </div>

      <Card className="border-border/70 bg-linear-to-br from-background via-background to-muted/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Database className="size-4" />
            Reporting source
          </CardTitle>
          <CardDescription>
            Generated {new Date(report.generatedAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {report.notes.map((note) => (
            <p key={note} className="text-sm leading-6 text-muted-foreground">
              {note}
            </p>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Event count" value={formatInteger(report.overview.eventCount)} detail="Total hackathon-app events returned in the current GA reporting window." icon={<BarChart3 className="size-4" />} />
        <MetricCard label="Users" value={formatInteger(report.overview.totalUsers)} detail="Distinct users observed on the hackathon hostname in the same historical window." icon={<RadioTower className="size-4" />} />
        <MetricCard label="Vote submits" value={formatInteger(report.overview.voteSubmissions)} detail="Submitted voting events seen by GA, separate from the BigQuery-derived fallback model." icon={<Gauge className="size-4" />} />
        <MetricCard label="Manager actions" value={formatInteger(report.overview.managerActions)} detail="Manager-only uploads, round controls, and per-entry voting-state operations." icon={<ShieldCheck className="size-4" />} />
      </div>

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
                <div key={`${row.eventName}-${row.viewerRole}-${row.competitionStatus}`} className="rounded-2xl border border-border/60 bg-background/50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-foreground">{row.eventName}</p>
                      <p className="text-sm text-muted-foreground">
                        {row.viewerRole} · {row.competitionStatus}
                      </p>
                    </div>
                    <div className="text-right">
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
                <div key={row.competitionStatus} className="rounded-2xl border border-border/60 bg-background/50 p-4">
                  <div className="flex items-center justify-between gap-3">
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
              report.entrySurface.map((row) => (
                <div key={row.entrySlug} className="grid gap-3 rounded-2xl border border-border/60 bg-background/50 p-4 md:grid-cols-[1.6fr_repeat(4,auto)]">
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">{row.entryName || row.entrySlug}</p>
                    <p className="text-sm text-muted-foreground">{row.entrySlug}</p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Dialogs</p>
                    <p className="text-lg font-semibold">{formatInteger(row.dialogViews)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Votes</p>
                    <p className="text-lg font-semibold">{formatInteger(row.voteSubmissions)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Avg score</p>
                    <p className="text-lg font-semibold">{formatScore(row.averageScore)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Avg aggregate</p>
                    <p className="text-lg font-semibold">{formatScore(row.averageAggregateScore)}</p>
                  </div>
                </div>
              ))
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
                <div key={row.eventName} className="flex items-center justify-between rounded-xl border border-border/60 bg-background/50 px-4 py-3">
                  <p className="font-medium text-foreground">{row.eventName}</p>
                  <p className="text-2xl font-semibold">{formatInteger(row.eventCount)}</p>
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
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium text-foreground">{definition.label}</p>
                <Badge variant="outline">{definition.type}</Badge>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{definition.key}</p>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{definition.meaning}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </section>
  )
}
