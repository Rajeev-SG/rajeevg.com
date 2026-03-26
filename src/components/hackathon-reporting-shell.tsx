"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { BarChart3, ChevronDown, Database, Gauge, Info, RadioTower } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

export type HackathonReportingSurface = "bigquery" | "ga4"
export type HackathonReportingSourceMode = "live" | "dummy"

export type MetricDefinition = {
  label: string
  value: string
  detail: string
  icon: ReactNode
  tooltip?: string
}

export function buildSchemaAnchorId(value: string) {
  return `schema-${value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")}`
}

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

export function DefinitionTooltipLabel({
  label,
  tooltip,
  className,
}: {
  label: string
  tooltip?: string
  className?: string
}) {
  if (!tooltip) return <span className={className}>{label}</span>

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-1 rounded-sm text-left transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70",
            className,
          )}
          aria-label={`Explain ${label}`}
        >
          <span>{label}</span>
          <Info className="size-3 shrink-0 opacity-70" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="start"
        sideOffset={10}
        className="w-[min(20rem,calc(100vw-2rem))] rounded-2xl border-border/70 bg-background/98 p-4 text-sm leading-6 shadow-xl"
      >
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Definition
          </p>
          <p className="text-sm font-semibold text-foreground">{label}</p>
          <div className="text-muted-foreground">{tooltip}</div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

function MetricCard({
  label,
  value,
  detail,
  icon,
  tooltip,
}: MetricDefinition) {
  return (
    <Card className="min-h-full border-border/70 bg-background/80">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            <DefinitionTooltipLabel label={label} tooltip={tooltip} />
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
  trackingCoverageValue: string
  trackingCoverageDetail: string
  fallbackTelemetry?: boolean
}): MetricDefinition[] {
  const telemetryDetail = metrics.fallbackTelemetry
    ? "Shown from GA4-derived fallback telemetry because the modeled BigQuery tables are still empty."
    : undefined

  return [
    {
      label: metrics.fallbackTelemetry ? "Fallback tracked events" : "Tracked events",
      value: metrics.eventCount,
      detail: telemetryDetail ?? "Total hackathon analytics events returned in the current reporting window.",
      icon: <BarChart3 className="size-4" />,
      tooltip: "All analytics events counted for this page's reporting window. Use it as volume, not as a vote total.",
    },
    {
      label: metrics.fallbackTelemetry ? "Fallback tracked users" : "Tracked users",
      value: metrics.totalUsers,
      detail: telemetryDetail ?? "Distinct users observed on vote.rajeevg.com across all tracked host activity in the same window.",
      icon: <RadioTower className="size-4" />,
      tooltip: "Distinct analytics users seen in this reporting window. This is a user count, so it does not share a denominator with consent-action percentages or vote tracking coverage.",
    },
    {
      label: "Recorded votes",
      value: metrics.actualVotes,
      detail: "Authoritative vote rows from the live voting app snapshot that powers the public scoreboard.",
      icon: <Gauge className="size-4" />,
      tooltip: "Votes saved by the voting app itself. This is the source-of-truth total.",
    },
    {
      label: metrics.fallbackTelemetry ? "Fallback tracked vote submissions" : "Tracked vote submissions",
      value: metrics.trackedVoteSubmissions,
      detail:
        telemetryDetail ?? "GA4 vote_submitted events captured as analytics telemetry for the same window.",
      icon: <RadioTower className="size-4" />,
      tooltip: "Vote submissions that analytics actually recorded. This can be lower than recorded votes when telemetry is missing or filtered.",
    },
    {
      label: "Vote tracking coverage",
      value: metrics.trackingCoverageValue,
      detail: metrics.trackingCoverageDetail,
      icon: <Database className="size-4" />,
      tooltip: "Formula shown directly as tracked vote submissions divided by recorded votes. The percentage lives in the supporting text so it is harder to confuse with consent percentages.",
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
      title="What this page includes"
      description="Fresh scope notes, data boundaries, and any proven caveats for this reporting surface."
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
  heroDescription,
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
  heroDescription?: string
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
                {heroDescription ??
                  "Each page now stays focused on a single reporting source, so the evidence, caveats, and live numbers are easier to read without context switching."}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
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
                About this page
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
