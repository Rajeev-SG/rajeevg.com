"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { BarChart3, ChevronDown, Database, Gauge, RadioTower, ShieldCheck } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export type HackathonReportingSurface = "bigquery" | "ga4"
export type HackathonReportingSourceMode = "live" | "dummy"

type SurfaceTab = {
  key: HackathonReportingSurface
  label: string
  href: string
}

type MetricDefinition = {
  label: string
  value: string
  detail: string
  icon: ReactNode
}

const SURFACE_TABS: SurfaceTab[] = [
  {
    key: "bigquery",
    label: "BigQuery analysis",
    href: "/projects/hackathon-voting-analytics",
  },
  {
    key: "ga4",
    label: "GA4 property",
    href: "/projects/hackathon-voting-analytics/google-analytics",
  },
]

function formatGeneratedAt(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(value))
}

function SourceToggle({
  source,
  onChange,
  showDummyPreview,
}: {
  source: HackathonReportingSourceMode
  onChange: (value: HackathonReportingSourceMode) => void
  showDummyPreview: boolean
}) {
  const items = showDummyPreview
    ? ([
        { value: "live", label: "Live reporting" },
        { value: "dummy", label: "Dummy preview" },
      ] as const)
    : ([{ value: "live", label: "Live reporting" }] as const)

  return (
    <div className="inline-flex flex-wrap rounded-full border border-border bg-muted/50 p-1">
      {items.map((item) => (
        <button
          key={item.value}
          type="button"
          onClick={() => onChange(item.value)}
          className={cn(
            "rounded-full px-3 py-1.5 text-xs font-semibold transition sm:px-4 sm:text-sm",
            source === item.value
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}

function SurfaceTabs({ activeSurface }: { activeSurface: HackathonReportingSurface }) {
  return (
    <div className="inline-flex flex-wrap rounded-full border border-border bg-muted/40 p-1">
      {SURFACE_TABS.map((tab) => {
        const active = tab.key === activeSurface
        return (
          <Button
            key={tab.key}
            asChild
            variant="ghost"
            className={cn(
              "h-auto rounded-full px-4 py-2 text-xs font-semibold sm:text-sm",
              active
                ? "bg-background text-foreground shadow-sm hover:bg-background"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Link aria-current={active ? "page" : undefined} href={tab.href}>
              {tab.label}
            </Link>
          </Button>
        )
      })}
    </div>
  )
}

function MetricCard({
  label,
  value,
  detail,
  icon,
}: MetricDefinition) {
  return (
    <Card className="min-h-full border-border/70 bg-background/80">
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

export function buildHackathonSummaryMetrics(metrics: {
  eventCount: string
  totalUsers: string
  actualVotes: string
  trackedVoteSubmissions: string
  trackingCoverage: string
  managerActions: string
  fallbackTelemetry?: boolean
}): MetricDefinition[] {
  const telemetryPrefix = metrics.fallbackTelemetry ? "Fallback " : ""
  const telemetryDetail = metrics.fallbackTelemetry
    ? "Shown from GA4-derived fallback telemetry because the modeled BigQuery tables are still empty."
    : undefined

  return [
    {
      label: `${telemetryPrefix}event count`,
      value: metrics.eventCount,
      detail: telemetryDetail ?? "Total hackathon analytics events returned in the current reporting window.",
      icon: <BarChart3 className="size-4" />,
    },
    {
      label: `${telemetryPrefix}users`,
      value: metrics.totalUsers,
      detail: telemetryDetail ?? "Distinct users observed on the hackathon reporting surface in the same window.",
      icon: <RadioTower className="size-4" />,
    },
    {
      label: "Persisted votes",
      value: metrics.actualVotes,
      detail: "Authoritative vote rows from the live voting app snapshot that powers the public scoreboard.",
      icon: <Gauge className="size-4" />,
    },
    {
      label: `${telemetryPrefix}tracked submits`,
      value: metrics.trackedVoteSubmissions,
      detail:
        telemetryDetail ?? "GA4 vote_submitted events captured as analytics telemetry for the same window.",
      icon: <RadioTower className="size-4" />,
    },
    {
      label: "GA4 coverage",
      value: metrics.trackingCoverage,
      detail: "Tracked submits divided by the authoritative persisted vote total.",
      icon: <Database className="size-4" />,
    },
    {
      label: `${telemetryPrefix}manager actions`,
      value: metrics.managerActions,
      detail:
        telemetryDetail ?? "Uploads, round controls, and entry state operations recorded for the manager.",
      icon: <ShieldCheck className="size-4" />,
    },
  ]
}

export function HackathonDisclosureCard({
  title,
  description,
  icon,
  defaultOpen = false,
  children,
}: {
  title: string
  description: string
  icon?: ReactNode
  defaultOpen?: boolean
  children: ReactNode
}) {
  return (
    <details
      className="group rounded-[1.5rem] border border-border/70 bg-background/80"
      open={defaultOpen}
    >
      <summary className="flex cursor-pointer list-none items-start justify-between gap-4 px-5 py-5 [&::-webkit-details-marker]:hidden">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {icon ? (
              <span className="rounded-full border border-border/60 bg-muted/30 p-2 text-muted-foreground">
                {icon}
              </span>
            ) : null}
            <h3 className="text-base font-semibold">{title}</h3>
          </div>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
        <ChevronDown className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
      </summary>
      <div className="px-5 pb-5">{children}</div>
    </details>
  )
}

export function HackathonReportingNotesCard({
  notes,
}: {
  notes: string[]
}) {
  if (!notes.length) return null

  return (
    <HackathonDisclosureCard
      title="Source reconciliation"
      description="Fresh reporting boundaries, fallback behavior, and proven discrepancies for this surface."
    >
      <div className="space-y-3">
        <ul className="space-y-3 text-sm leading-6 text-muted-foreground">
          {notes.map((note) => (
            <li key={note} className="rounded-2xl border border-border/60 bg-background/50 px-4 py-3">
              {note}
            </li>
          ))}
        </ul>
      </div>
    </HackathonDisclosureCard>
  )
}

export function HackathonReportingShell({
  activeSurface,
  source,
  onSourceChange,
  generatedAt,
  topBadges,
  summary,
  summaryMetrics,
  preMetricContent,
  showDummyPreview = activeSurface === "bigquery",
  children,
}: {
  activeSurface: HackathonReportingSurface
  source: HackathonReportingSourceMode
  onSourceChange: (value: HackathonReportingSourceMode) => void
  generatedAt: string
  topBadges: string[]
  summary: string
  summaryMetrics: MetricDefinition[]
  preMetricContent?: ReactNode
  showDummyPreview?: boolean
  children: ReactNode
}) {
  return (
    <section
      className="space-y-8"
      data-analytics-section="hackathon_reporting_shell"
      data-analytics-item-type="page_section"
      data-analytics-page-context="primary"
      data-analytics-page-content-group="projects"
      data-analytics-page-content-type="hackathon_reporting_dashboard"
    >
      <section
        className="overflow-hidden rounded-[2rem] border border-border/70 bg-gradient-to-br from-background via-background to-muted/30"
        data-analytics-reporting-shell="hero"
      >
        <div className="grid gap-6 px-6 py-8 sm:px-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              {topBadges.map((badge) => (
                <Badge key={badge} variant="outline" className="rounded-full px-3 py-1">
                  {badge}
                </Badge>
              ))}
            </div>
            <div className="space-y-3">
              <p className="text-sm uppercase tracking-[0.22em] text-muted-foreground">
                Hackathon reporting surface
              </p>
              <h1 className="max-w-4xl text-4xl font-semibold tracking-tight sm:text-5xl">
                Hackathon reporting dashboard
              </h1>
              <p className="max-w-3xl text-base text-muted-foreground sm:text-lg">
                The shell stays fixed while you switch between BigQuery modeling and direct GA4
                property reporting, so it is easier to compare the same hackathon story without
                reorienting yourself every time.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <SurfaceTabs activeSurface={activeSurface} />
              <SourceToggle
                onChange={onSourceChange}
                showDummyPreview={showDummyPreview}
                source={source}
              />
            </div>
          </div>
          <Card className="h-full min-h-[12.5rem] border-border/70 bg-background/80">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Database className="size-4" />
                Reporting source
              </CardTitle>
              <CardDescription>
                Generated {formatGeneratedAt(generatedAt)} UTC
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm leading-6 text-muted-foreground">{summary}</p>
              <div className="flex flex-wrap gap-2 pt-2">
                <Button asChild variant="outline" size="sm">
                  <Link href="https://vote.rajeevg.com" rel="noreferrer" target="_blank">
                    Live voting app
                  </Link>
                </Button>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/projects">Back to projects</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {preMetricContent}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {summaryMetrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </div>

      {children}
    </section>
  )
}
