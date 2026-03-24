"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { BarChart3, Database, Gauge, RadioTower, ShieldCheck } from "lucide-react"

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

function SourceToggle({
  source,
  onChange,
}: {
  source: HackathonReportingSourceMode
  onChange: (value: HackathonReportingSourceMode) => void
}) {
  return (
    <div className="inline-flex rounded-full border border-border bg-muted/50 p-1">
      {([
        { value: "live", label: "Live reporting" },
        { value: "dummy", label: "Dummy preview" },
      ] as const).map((item) => (
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
    <div className="inline-flex rounded-full border border-border bg-muted/40 p-1">
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

export function buildHackathonSummaryMetrics(metrics: {
  eventCount: string
  totalUsers: string
  voteSubmissions: string
  managerActions: string
}): MetricDefinition[] {
  return [
    {
      label: "Event count",
      value: metrics.eventCount,
      detail: "Total hackathon analytics events returned in the current reporting window.",
      icon: <BarChart3 className="size-4" />,
    },
    {
      label: "Users",
      value: metrics.totalUsers,
      detail: "Distinct users observed on the hackathon reporting surface in the same window.",
      icon: <RadioTower className="size-4" />,
    },
    {
      label: "Vote submits",
      value: metrics.voteSubmissions,
      detail: "Successful vote submissions visible in the current reporting source.",
      icon: <Gauge className="size-4" />,
    },
    {
      label: "Manager actions",
      value: metrics.managerActions,
      detail: "Uploads, round controls, and entry state operations recorded for the manager.",
      icon: <ShieldCheck className="size-4" />,
    },
  ]
}

export function HackathonReportingShell({
  activeSurface,
  source,
  onSourceChange,
  generatedAt,
  topBadges,
  summary,
  summaryMetrics,
  children,
}: {
  activeSurface: HackathonReportingSurface
  source: HackathonReportingSourceMode
  onSourceChange: (value: HackathonReportingSourceMode) => void
  generatedAt: string
  topBadges: string[]
  summary: string
  summaryMetrics: MetricDefinition[]
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
              <SourceToggle onChange={onSourceChange} source={source} />
            </div>
          </div>
          <Card className="h-full min-h-[12.5rem] border-border/70 bg-background/80">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Database className="size-4" />
                Reporting source
              </CardTitle>
              <CardDescription>
                Generated{" "}
                {new Date(generatedAt).toLocaleString("en-GB", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="min-h-[4.5rem] text-sm leading-6 text-muted-foreground">{summary}</p>
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

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryMetrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </div>

      {children}
    </section>
  )
}
