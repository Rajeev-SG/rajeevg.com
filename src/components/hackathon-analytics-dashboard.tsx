"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import * as Plot from "@observablehq/plot"
import * as echarts from "echarts/core"
import { BarChart, FunnelChart, HeatmapChart, LineChart, PieChart, ScatterChart, SunburstChart } from "echarts/charts"
import { DatasetComponent, GridComponent, LegendComponent, TitleComponent, TooltipComponent, VisualMapComponent } from "echarts/components"
import { CanvasRenderer } from "echarts/renderers"
import {
  Activity,
  BarChart3,
  Database,
  Eye,
  Layers3,
  RadioTower,
  Sparkles,
} from "lucide-react"

import type {
  AnalyticsDefinition,
  AuthFunnelRow,
  DailyOverviewRow,
  EntryPerformanceRow,
  EventBreakdownRow,
  HackathonAnalyticsDataset,
  VotingFunnelRow,
} from "@/lib/hackathon-reporting-types"
import type { HackathonBigQueryStatus } from "@/lib/hackathon-bigquery-status"
import type { HackathonVoteTruthEntry } from "@/lib/hackathon-vote-truth"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  buildSchemaAnchorId,
  DefinitionTooltipLabel,
  HackathonDisclosureCard,
  HackathonReportingNotesCard,
  HackathonReportingShell,
  type MetricDefinition,
} from "@/components/hackathon-reporting-shell"
import { cn } from "@/lib/utils"

echarts.use([
  BarChart,
  FunnelChart,
  HeatmapChart,
  LineChart,
  PieChart,
  ScatterChart,
  SunburstChart,
  CanvasRenderer,
  DatasetComponent,
  GridComponent,
  LegendComponent,
  TitleComponent,
  TooltipComponent,
  VisualMapComponent,
])

type DashboardProps = {
  live: HackathonAnalyticsDataset
  dummy: HackathonAnalyticsDataset
  status: HackathonBigQueryStatus
}

type RendererMode = "echarts" | "observable"
type SourceMode = "live" | "dummy"

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`
}

function formatScore(value: number) {
  return value.toFixed(value >= 10 ? 0 : 1)
}

function formatCount(value: number) {
  return new Intl.NumberFormat("en-GB").format(value)
}

function chartHeightForWidth(width: number) {
  if (width < 480) return 380
  if (width < 900) return 344
  return 320
}

function formatCompactDateLabel(value: string) {
  const parsedDate = new Date(`${value}T00:00:00Z`)
  if (Number.isNaN(parsedDate.getTime())) return value

  return new Intl.DateTimeFormat("en-GB", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(parsedDate)
}

function getNumericDomain(values: number[], padding: number, clampMin?: number, clampMax?: number) {
  if (!values.length) {
    return { min: clampMin ?? 0, max: clampMax ?? 1 }
  }

  const min = Math.min(...values)
  const max = Math.max(...values)
  const paddedMin = min - padding
  const paddedMax = max + padding

  return {
    min: clampMin === undefined ? paddedMin : Math.max(clampMin, paddedMin),
    max: clampMax === undefined ? paddedMax : Math.min(clampMax, paddedMax),
  }
}

function aggregateOverview(rows: DailyOverviewRow[]) {
  return rows.reduce(
    (acc, row) => ({
      totalEvents: acc.totalEvents + row.totalEvents,
      uniqueUsers: acc.uniqueUsers + row.uniqueUsers,
      voteSubmissions: acc.voteSubmissions + row.voteSubmissions,
      judgeAuthCompletions: acc.judgeAuthCompletions + row.judgeAuthCompletions,
      totalScore: acc.totalScore + row.totalScore,
      consentGrants: acc.consentGrants + row.consentGrants,
      managerActions: acc.managerActions + row.managerActions,
    }),
    {
      totalEvents: 0,
      uniqueUsers: 0,
      voteSubmissions: 0,
      judgeAuthCompletions: 0,
      totalScore: 0,
      consentGrants: 0,
      managerActions: 0,
    },
  )
}

function aggregateAuth(rows: AuthFunnelRow[]) {
  return rows.reduce(
    (acc, row) => {
      acc.authRequests += row.authRequests
      acc.authCompletions += row.authCompletions
      acc.authFailures += row.authFailures
      acc.googleStarts += row.googleStarts
      acc.googleFailures += row.googleFailures
      return acc
    },
    { authRequests: 0, authCompletions: 0, authFailures: 0, googleStarts: 0, googleFailures: 0 },
  )
}

function aggregateVoting(rows: VotingFunnelRow[]) {
  return rows.reduce(
    (acc, row) => {
      acc.dialogViews += row.dialogViews
      acc.eligibleDialogViews += row.eligibleDialogViews
      acc.blockedDialogViews += row.blockedDialogViews
      acc.scoreSelections += row.scoreSelections
      acc.submitStarts += row.submitStarts
      acc.submittedVotes += row.submittedVotes
      acc.submitFailures += row.submitFailures
      return acc
    },
    {
      dialogViews: 0,
      eligibleDialogViews: 0,
      blockedDialogViews: 0,
      scoreSelections: 0,
      submitStarts: 0,
      submittedVotes: 0,
      submitFailures: 0,
    },
  )
}

function groupEntryPerformance(
  rows: EntryPerformanceRow[],
  truthEntries: HackathonVoteTruthEntry[] = [],
) {
  const truthBySlug = new Map(truthEntries.map((entry) => [entry.slug, entry]))
  const map = new Map<string, EntryPerformanceRow & { daysObserved: number }>()
  for (const row of rows) {
    const current = map.get(row.entrySlug)
    if (!current) {
      map.set(row.entrySlug, { ...row, daysObserved: 1 })
      continue
    }
    current.dialogViews += row.dialogViews
    current.eligibleDialogViews += row.eligibleDialogViews
    current.blockedDialogViews += row.blockedDialogViews
    current.voteSubmitStarts += row.voteSubmitStarts
    current.voteSubmitFailures += row.voteSubmitFailures
    current.votesSubmitted += row.votesSubmitted
    current.uniqueVoters += row.uniqueVoters
    current.totalScore += row.totalScore
    current.averageScore += row.averageScore
    current.viewToVoteRate += row.viewToVoteRate
    current.daysObserved += 1
  }
  return Array.from(map.values())
    .map((row) => {
      const truthEntry = truthBySlug.get(row.entrySlug)

      return {
        ...row,
        totalScore: truthEntry?.totalScore ?? row.totalScore,
        averageScore: truthEntry?.averageScore ?? row.averageScore / row.daysObserved,
        viewToVoteRate: Math.min(row.viewToVoteRate / row.daysObserved, 1),
      }
    })
    .sort((a, b) => b.totalScore - a.totalScore)
}

function aggregateEventTaxonomy(rows: EventBreakdownRow[]) {
  const taxonomy = new Map<string, Map<string, number>>()
  for (const row of rows) {
    const key = `${row.viewerRole}:${row.competitionStatus}`
    const roleStatus = taxonomy.get(key) ?? new Map<string, number>()
    roleStatus.set(row.eventName, (roleStatus.get(row.eventName) ?? 0) + row.eventCount)
    taxonomy.set(key, roleStatus)
  }

  return Array.from(taxonomy.entries()).map(([key, values]) => {
    const [viewerRole, competitionStatus] = key.split(":")
    return {
      viewerRole,
      competitionStatus,
      events: Array.from(values.entries())
        .map(([eventName, eventCount]) => ({ eventName, eventCount }))
        .sort((a, b) => b.eventCount - a.eventCount),
    }
  })
}

function usePalette(resolvedTheme?: string) {
  return React.useMemo(
    () =>
      resolvedTheme === "dark"
        ? {
            background: "#090b0e",
            panel: "#11161d",
            grid: "rgba(255,255,255,0.08)",
            text: "#f8fafc",
            muted: "rgba(248,250,252,0.65)",
            accent: ["#6ee7f9", "#a78bfa", "#f59e0b", "#34d399", "#fb7185", "#fcd34d"],
          }
        : {
            background: "#f7fafc",
            panel: "#ffffff",
            grid: "rgba(15,23,42,0.08)",
            text: "#0f172a",
            muted: "rgba(15,23,42,0.62)",
            accent: ["#0f766e", "#7c3aed", "#f59e0b", "#16a34a", "#e11d48", "#0ea5e9"],
          },
    [resolvedTheme],
  )
}

function EChartSurface({
  option,
  className,
}: {
  option: echarts.EChartsCoreOption
  className?: string
}) {
  const ref = React.useRef<HTMLDivElement | null>(null)

  React.useEffect(() => {
    if (!ref.current) return
    const chart = echarts.init(ref.current)
    chart.setOption(option)

    const observer = new ResizeObserver(() => chart.resize())
    observer.observe(ref.current)

    return () => {
      observer.disconnect()
      chart.dispose()
    }
  }, [option])

  return <div ref={ref} className={cn("h-[360px] w-full md:h-[320px]", className)} />
}

function ObservableSurface({
  builder,
  className,
}: {
  builder: (width: number) => Element
  className?: string
}) {
  const ref = React.useRef<HTMLDivElement | null>(null)

  React.useEffect(() => {
    if (!ref.current) return
    const node = ref.current
    let plot: Element | null = null

    const render = () => {
      if (!node) return
      const width = Math.max(280, Math.floor(node.clientWidth || 280))
      node.innerHTML = ""
      plot = builder(width)
      node.append(plot)
    }

    render()

    const observer = new ResizeObserver(() => render())
    observer.observe(node)

    return () => {
      observer.disconnect()
      plot?.remove()
    }
  }, [builder])

  return <div ref={ref} className={cn("w-full overflow-hidden", className)} />
}

function SectionShell({
  eyebrow,
  title,
  description,
  actions,
  children,
}: {
  eyebrow: string
  title: string
  description: string
  actions?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="space-y-4" id={title.toLowerCase().replace(/\s+/g, "-")}>
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">{eyebrow}</p>
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
            <p className="max-w-3xl text-sm text-muted-foreground sm:text-base">{description}</p>
          </div>
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
      {children}
    </section>
  )
}

function RendererToggle({
  renderer,
  onChange,
}: {
  renderer: RendererMode
  onChange: (value: RendererMode) => void
}) {
  return (
    <div className="inline-flex rounded-full border border-border bg-muted/50 p-1">
      {(["echarts", "observable"] as const).map((value) => (
        <button
          key={value}
          type="button"
          onClick={() => onChange(value)}
          className={cn(
            "rounded-full px-3 py-1.5 text-xs font-semibold transition sm:px-4 sm:text-sm",
            renderer === value
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {value === "echarts" ? "ECharts" : "Observable Plot"}
        </button>
      ))}
    </div>
  )
}

type DerivedDefinition = {
  label: string
  meaning: string
  interpretation: string
}

function DefinitionGroup<T>({
  items,
  overflowLabel,
  gridClassName,
  renderItem,
}: {
  items: readonly T[]
  overflowLabel: string
  gridClassName: string
  renderItem: (item: T) => React.ReactNode
}) {
  const visibleItems = items.slice(0, 5)
  const hiddenItems = items.slice(5)

  return (
    <div className="space-y-4">
      <div className={gridClassName}>{visibleItems.map((item) => renderItem(item))}</div>
      {hiddenItems.length ? (
        <details className="rounded-2xl border border-border/60 bg-background/50">
          <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-foreground">
            {overflowLabel} ({hiddenItems.length})
          </summary>
          <div className={cn("border-t border-border/60 px-4 py-4", gridClassName)}>
            {hiddenItems.map((item) => renderItem(item))}
          </div>
        </details>
      ) : null}
    </div>
  )
}

function DefinitionTable({
  definitions,
  derivedDefinitions,
}: {
  definitions: AnalyticsDefinition[]
  derivedDefinitions: DerivedDefinition[]
}) {
  return (
    <div className="space-y-6">
      <DefinitionGroup
        items={derivedDefinitions}
        overflowLabel="More derived metrics"
        gridClassName="grid gap-4 lg:grid-cols-2"
        renderItem={(definition) => (
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
        )}
      />
      <DefinitionGroup
        items={definitions}
        overflowLabel="More schema fields"
        gridClassName="grid gap-4 lg:grid-cols-2"
        renderItem={(definition) => (
          <details
            key={definition.key}
            id={buildSchemaAnchorId(definition.label)}
            className="rounded-2xl border border-border/70 bg-background/80"
          >
            <summary className="flex cursor-pointer list-none flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between [&::-webkit-details-marker]:hidden">
              <span className="break-words text-base font-semibold">{definition.label}</span>
              <Badge variant="outline">{definition.type}</Badge>
            </summary>
            <div className="space-y-3 border-t border-border/60 px-5 py-4 text-sm">
              <p className="leading-6 text-muted-foreground">{definition.meaning}</p>
              <div>
                <p className="font-medium text-foreground">Typical values or units</p>
                <p className="break-words text-muted-foreground">{definition.typicalValues}</p>
              </div>
              <div>
                <p className="font-medium text-foreground">How to read it</p>
                <p className="text-muted-foreground">{definition.interpretation}</p>
              </div>
            </div>
          </details>
        )}
      />
    </div>
  )
}

export function HackathonAnalyticsDashboard({ live, dummy, status }: DashboardProps) {
  const { resolvedTheme } = useTheme()
  const palette = usePalette(resolvedTheme)
  const [renderer, setRenderer] = React.useState<RendererMode>("echarts")
  const [source, setSource] = React.useState<SourceMode>("live")

  const dataset = source === "live" ? live : dummy
  const isLiveWarehouseOnly = source === "live" && !dataset.hasLiveRows
  const overviewTotals = aggregateOverview(dataset.overview)
  const authTotals = aggregateAuth(dataset.authFunnel)
  const votingTotals = aggregateVoting(dataset.votingFunnel)
  const entries = groupEntryPerformance(dataset.entryPerformance, dataset.voteTruth?.entries ?? [])
  const taxonomy = aggregateEventTaxonomy(dataset.eventBreakdown)
  const primaryModeledTableRows = status.modeledTableRows.slice(0, 5)
  const overflowModeledTableRows = status.modeledTableRows.slice(5)
  const summaryCards: MetricDefinition[] = isLiveWarehouseOnly
    ? [
        {
          label: "Warehouse rows",
          value: formatCount(status.modeledRowCount),
          detail: "Total landed rows across the dedicated hackathon_reporting warehouse tables.",
          icon: <Database className="size-4" />,
          tooltip: "All rows currently landed across the dedicated BigQuery reporting tables.",
        },
        {
          label: "Warehouse tables with data",
          value: formatCount(status.modeledTablesWithRows),
          detail: "How many of the eight warehouse tables currently contain at least one landed row.",
          icon: <Layers3 className="size-4" />,
          tooltip: "How many of the eight modeled BigQuery tables currently contain data.",
        },
        {
          label: "Raw GA4 export tables",
          value: formatCount(status.rawExportTableCount),
          detail: "How many raw GA4 export tables currently exist in ga4_498363924.",
          icon: <RadioTower className="size-4" />,
          tooltip: "How many raw GA4 export tables exist in ga4_498363924 right now.",
        },
        {
          label: "Daily BigQuery export",
          value: status.link?.dailyExportEnabled ? "Enabled" : "Unavailable",
          detail: "Admin-side BigQuery link status for daily GA4 export.",
          icon: <Activity className="size-4" />,
          tooltip: "Whether the live GA4 to BigQuery link is configured to export daily tables.",
        },
        {
          label: "Streaming BigQuery export",
          value: status.link?.streamingExportEnabled ? "Enabled" : "Unavailable",
          detail: "Admin-side BigQuery link status for streaming GA4 export.",
          icon: <Activity className="size-4" />,
          tooltip: "Whether the live GA4 to BigQuery link is configured to export intraday streaming tables.",
        },
      ]
    : [
        {
          label: "Modeled events",
          value: formatCount(overviewTotals.totalEvents),
          detail: "All analytics events returned by the warehouse model for the live event day.",
          icon: <BarChart3 className="size-4" />,
          tooltip: "All modeled analytics events returned by BigQuery for this page's reporting window.",
        },
        {
          label: "Modeled users",
          value: formatCount(overviewTotals.uniqueUsers),
          detail: "Distinct users returned by the warehouse model for the same reporting window.",
          icon: <RadioTower className="size-4" />,
          tooltip: "Distinct modeled users returned by BigQuery for this page's reporting window.",
        },
        {
          label: "Recorded votes",
          value:
            dataset.voteTruth != null ? formatCount(dataset.voteTruth.totals.totalVotes) : "Unavailable",
          detail: "Source-of-truth votes from the live voting app snapshot.",
          icon: <Database className="size-4" />,
          tooltip: "Votes saved by the app itself. This is the official vote total.",
        },
        {
          label: "Successful judge sign-ins",
          value: formatCount(overviewTotals.judgeAuthCompletions),
          detail: "Judge sign-ins observed in the warehouse model for the live event day.",
          icon: <Sparkles className="size-4" />,
          tooltip: "Successful judge sign-ins recorded in the warehouse model for the reporting window.",
        },
        {
          label: "Total score",
          value: formatCount(overviewTotals.totalScore),
          detail: "Total score mass accumulated across all modeled votes in the reporting window.",
          icon: <Activity className="size-4" />,
          tooltip: "The sum of all modeled vote scores recorded in the warehouse for the reporting window.",
        },
      ]
  const derivedDefinitions: DerivedDefinition[] = [
    {
      label: "Warehouse rows",
      meaning: "Total landed rows across the dedicated hackathon_reporting warehouse tables.",
      interpretation: "If this is zero, the BigQuery dashboard should be treated as a warehouse-status page, not an analytics story.",
    },
    {
      label: "Warehouse tables with data",
      meaning: "How many modeled warehouse tables currently contain data.",
      interpretation: "This is the quickest way to tell whether any part of the reporting model has started landing.",
    },
    {
      label: "Raw GA4 export tables",
      meaning: "How many raw GA4 export tables currently exist in the ga4_498363924 dataset.",
      interpretation: "If this is zero, the break is upstream of modeling and the raw export has not landed at all.",
    },
    {
      label: "Daily BigQuery export",
      meaning: "Whether the live GA4 BigQuery link has daily export enabled.",
      interpretation: "Enabled here but zero raw tables means the issue is not just a dashboard-query bug.",
    },
    {
      label: "Streaming BigQuery export",
      meaning: "Whether the live GA4 BigQuery link has streaming export enabled.",
      interpretation: "Enabled here but zero raw tables means intraday export is configured yet still not landing.",
    },
    {
      label: "Modeled events",
      meaning: "All modeled analytics events returned for the dashboard reporting window.",
      interpretation: "Use this as BigQuery-modeled event volume, not as a vote total.",
    },
    {
      label: "Modeled users",
      meaning: "Distinct modeled users returned for the dashboard reporting window.",
      interpretation: "Use this as the modeled audience size for the event day.",
    },
    {
      label: "Recorded votes",
      meaning: "Votes saved by the live voting app, independent of analytics consent.",
      interpretation: "Use this as the official vote ledger alongside the warehouse model.",
    },
    {
      label: "Successful judge sign-ins",
      meaning: "Successful judge authentication events in the modeled data.",
      interpretation: "Use this to understand modeled access completion volume on the event day.",
    },
    {
      label: "Sign-in failures",
      meaning: "Modeled authentication failures in the same event-day window.",
      interpretation: "Use this as a friction signal when sign-in appears to be underperforming.",
    },
    {
      label: "Vote modal opens",
      meaning: "Modeled vote-modal views for the event day.",
      interpretation: "This measures demand for the scoring surface before submits are considered.",
    },
    {
      label: "Total score",
      meaning: "Summed score mass accumulated by an entry or the full event in the modeled dataset.",
      interpretation: "Use this to compare ranking strength across entries on the event day.",
    },
    {
      label: "Average vote score",
      meaning: "Average score value recorded for an entry in the modeled dataset.",
      interpretation: "Use this to compare score quality independently from vote volume.",
    },
    {
      label: "Vote conversion rate",
      meaning: "Submitted votes divided by eligible dialog views for the entry.",
      interpretation: "This is the modeled conversion rate for the vote surface.",
    },
  ]

  const topEntry = entries[0]
  const entryLabels = entries.map((entry) => entry.entryName)
  const eventDates = dataset.overview.map((row) => row.eventDate)
  const overviewPlotRows = dataset.overview.map((row) => ({
    ...row,
    eventDateLabel: formatCompactDateLabel(row.eventDate),
  }))
  const scoreDomain = getNumericDomain(
    entries.map((entry) => entry.averageScore),
    0.45,
    0,
    10,
  )
  const voteRateDomain = getNumericDomain(
    entries.map((entry) => entry.viewToVoteRate),
    0.05,
    0,
    1,
  )

  const overviewChart =
    renderer === "echarts" ? (
      <EChartSurface
        option={{
          backgroundColor: "transparent",
          color: palette.accent,
          grid: { left: 24, right: 18, top: 30, bottom: 24, containLabel: true },
          legend: { textStyle: { color: palette.muted } },
          tooltip: { trigger: "axis" },
          xAxis: {
            type: "category",
            data: eventDates,
            axisLabel: { color: palette.muted },
            axisLine: { lineStyle: { color: palette.grid } },
          },
          yAxis: {
            type: "value",
            axisLabel: { color: palette.muted },
            splitLine: { lineStyle: { color: palette.grid } },
          },
          series: [
            {
              name: "Modeled users",
              type: "line",
              smooth: true,
              data: dataset.overview.map((row) => row.uniqueUsers),
            },
            {
              name: "Recorded vote submissions",
              type: "bar",
              barMaxWidth: 26,
              data: dataset.overview.map((row) => row.voteSubmissions),
            },
          ],
        }}
      />
    ) : (
      <ObservableSurface
        builder={(width) =>
          Plot.plot({
            width,
            height: chartHeightForWidth(width),
            marginLeft: 52,
            marginBottom: width < 640 ? 68 : 48,
            style: { background: palette.panel, color: palette.text },
            x: { label: null, tickRotate: width < 640 ? -34 : -20 },
            y: { grid: true, label: "Daily count" },
            color: { legend: true },
            marks: [
              Plot.ruleY([0], { stroke: palette.grid }),
              Plot.barY(overviewPlotRows, {
                x: width < 640 ? "eventDateLabel" : "eventDate",
                y: "voteSubmissions",
                fill: palette.accent[1],
                inset: 0.18,
              }),
              Plot.lineY(overviewPlotRows, {
                x: width < 640 ? "eventDateLabel" : "eventDate",
                y: "uniqueUsers",
                stroke: palette.accent[0],
                marker: true,
              }),
            ],
          })
        }
      />
    )

  const funnelStages = [
    { stage: "Sign-in requested", value: authTotals.authRequests || authTotals.googleStarts },
    { stage: "Sign-in completed", value: authTotals.authCompletions },
    { stage: "Vote modal opened", value: votingTotals.dialogViews },
    { stage: "Score chosen", value: votingTotals.scoreSelections },
    { stage: "Submit started", value: votingTotals.submitStarts },
    { stage: "Vote submitted", value: votingTotals.submittedVotes },
  ].filter((item) => item.value > 0)

  const funnelChart =
    renderer === "echarts" ? (
      <EChartSurface
        option={{
          backgroundColor: "transparent",
          color: [palette.accent[0], palette.accent[1], palette.accent[2], palette.accent[3], palette.accent[4], palette.accent[5]],
          tooltip: { trigger: "item" },
          series: [
            {
              type: "funnel",
              left: "10%",
              top: 20,
              bottom: 20,
              width: "80%",
              sort: "descending",
              gap: 6,
              label: { color: palette.text },
              data: funnelStages.map((item) => ({ name: item.stage, value: item.value })),
            },
          ],
        }}
      />
    ) : (
      <ObservableSurface
        builder={(width) =>
          Plot.plot({
            width,
            height: chartHeightForWidth(width),
            marginLeft: width < 640 ? 140 : 120,
            marginRight: 28,
            style: { background: palette.panel, color: palette.text },
            x: { grid: true, label: null, domain: [0, funnelMax * 1.14] },
            y: { label: null },
            marks: [
              Plot.ruleX([0], { stroke: palette.grid }),
              Plot.barX(funnelStages, {
                y: "stage",
                x: "value",
                fill: palette.accent[1],
                sort: { y: "-x" },
              }),
            ],
          })
        }
      />
    )

  const authMethodRows = dataset.authFunnel.reduce<Record<string, number>>((acc, row) => {
    acc[row.authMethod] = (acc[row.authMethod] ?? 0) + row.authCompletions
    return acc
  }, {})

  const authMethodChartData = Object.entries(authMethodRows).map(([method, completions]) => ({
    method,
    completions,
  }))
  const funnelMax = Math.max(...funnelStages.map((item) => item.value), 1)
  const authMax = Math.max(...authMethodChartData.map((item) => item.completions), 1)

  const authChart =
    renderer === "echarts" ? (
      <EChartSurface
        option={{
          backgroundColor: "transparent",
          color: palette.accent,
          tooltip: { trigger: "item" },
          legend: { bottom: 0, textStyle: { color: palette.muted } },
          series: [
            {
              type: "pie",
              radius: ["48%", "72%"],
              data: authMethodChartData.map((item) => ({ name: item.method, value: item.completions })),
              label: { color: palette.text },
            },
          ],
        }}
      />
    ) : (
      <ObservableSurface
        builder={(width) =>
          Plot.plot({
            width,
            height: chartHeightForWidth(width),
            marginLeft: width < 640 ? 152 : 136,
            marginRight: 28,
            style: { background: palette.panel, color: palette.text },
            x: { label: null, grid: true, domain: [0, authMax * 1.16] },
            color: { legend: true, range: palette.accent },
            marks: [
              Plot.barX(authMethodChartData, {
                x: "completions",
                y: "method",
                fill: "method",
                sort: { y: "-x" },
              }),
            ],
          })
        }
      />
    )

  const entryScatter =
    renderer === "echarts" ? (
      <EChartSurface
        option={{
          backgroundColor: "transparent",
          color: palette.accent,
          tooltip: { trigger: "item" },
          grid: { left: 56, right: 76, top: 36, bottom: 44, containLabel: true },
          xAxis: {
            type: "value",
            name: "Average vote score",
            min: Number(scoreDomain.min.toFixed(1)),
            max: Number(scoreDomain.max.toFixed(1)),
            nameTextStyle: { color: palette.muted },
            axisLabel: { color: palette.muted },
            splitLine: { lineStyle: { color: palette.grid } },
          },
          yAxis: {
            type: "value",
            name: "Vote conversion rate",
            min: Number(voteRateDomain.min.toFixed(2)),
            max: Number(voteRateDomain.max.toFixed(2)),
            nameTextStyle: { color: palette.muted },
            axisLabel: { color: palette.muted, formatter: (value: number) => `${Math.round(value * 100)}%` },
            splitLine: { lineStyle: { color: palette.grid } },
          },
          series: [
            {
              type: "scatter",
              symbolSize: (value: number[]) => 10 + value[2] * 1.8,
              data: entries.map((entry) => [
                Number(entry.averageScore.toFixed(2)),
                Number(entry.viewToVoteRate.toFixed(3)),
                entry.votesSubmitted,
                entry.entryName,
              ]),
              label: { show: false },
            },
          ],
        }}
      />
    ) : (
      <ObservableSurface
        builder={(width) =>
          Plot.plot({
            width,
            height: chartHeightForWidth(width),
            marginLeft: 56,
            marginBottom: width < 640 ? 64 : 48,
            style: { background: palette.panel, color: palette.text },
            x: { label: "Average vote score", grid: true, domain: [scoreDomain.min, scoreDomain.max] },
            y: {
              label: "Vote conversion rate",
              percent: true,
              grid: true,
              domain: [voteRateDomain.min, voteRateDomain.max],
            },
            marks: [
              Plot.dot(entries, {
                x: "averageScore",
                y: "viewToVoteRate",
                r: (d) => 6 + d.votesSubmitted * 0.9,
                fill: palette.accent[2],
                stroke: palette.panel,
              }),
            ],
          })
        }
      />
    )

  const leaderboardChart =
    renderer === "echarts" ? (
      <EChartSurface
        option={{
          backgroundColor: "transparent",
          color: palette.accent,
          grid: { left: 124, right: 28, top: 20, bottom: 20, containLabel: true },
          xAxis: {
            type: "value",
            axisLabel: { color: palette.muted },
            splitLine: { lineStyle: { color: palette.grid } },
          },
          yAxis: {
            type: "category",
            data: entryLabels,
            axisLabel: { color: palette.muted, width: 112, overflow: "break" },
          },
          tooltip: { trigger: "axis" },
          series: [
            {
              type: "bar",
              data: entries.map((entry) => entry.totalScore),
              barMaxWidth: 26,
            },
          ],
        }}
      />
    ) : (
      <ObservableSurface
        builder={(width) =>
          Plot.plot({
            width,
            height: chartHeightForWidth(width),
            marginLeft: width < 640 ? 132 : 118,
            style: { background: palette.panel, color: palette.text },
            x: { label: null, grid: true },
            y: { label: null },
            marks: [
              Plot.ruleX([0], { stroke: palette.grid }),
              Plot.barX(entries, {
                y: "entryName",
                x: "totalScore",
                fill: palette.accent[0],
                sort: { y: "-x" },
              }),
            ],
          })
        }
      />
    )

  const taxonomyChartData = taxonomy.map((group) => ({
    name: `${group.viewerRole} / ${group.competitionStatus}`,
    children: group.events.slice(0, 8).map((event) => ({
      name: event.eventName,
      value: event.eventCount,
    })),
  }))

  const taxonomyChart =
    renderer === "echarts" ? (
      <EChartSurface
        option={{
          backgroundColor: "transparent",
          tooltip: { trigger: "item" },
          series: [
            {
              type: "sunburst",
              radius: [24, "88%"],
              sort: undefined,
              data: taxonomyChartData,
              label: { color: palette.text, width: 92, overflow: "truncate" },
              minAngle: 6,
              levels: [{}, {}, { itemStyle: { borderWidth: 2 } }],
            },
          ],
        }}
      />
    ) : (
      <ObservableSurface
        builder={(width) =>
          Plot.plot({
            width,
            height: chartHeightForWidth(width),
            marginLeft: width < 640 ? 156 : 140,
            style: { background: palette.panel, color: palette.text },
            x: { label: null, grid: true },
            y: { label: null },
            color: { legend: true },
            marks: [
              Plot.barX(
                taxonomy.flatMap((group) =>
                  group.events.slice(0, 4).map((event) => ({
                    group: `${group.viewerRole} / ${group.competitionStatus}`,
                    eventName: event.eventName,
                    eventCount: event.eventCount,
                  })),
                ),
                {
                  x: "eventCount",
                  y: "group",
                  fill: "eventName",
                  inset: 0.22,
                },
              ),
            ],
          })
        }
      />
    )

  return (
    <div
      className="space-y-10"
      data-analytics-section="hackathon_reporting_dashboard"
      data-analytics-item-type="page_section"
      data-analytics-page-context="primary"
      data-analytics-page-content-group="projects"
      data-analytics-page-content-type="hackathon_reporting_dashboard"
    >
      <HackathonReportingShell
        activeSurface="bigquery"
        generatedAt={dataset.generatedAt}
        summary={
          dataset.notes[0] ??
          "Warehouse reporting from the dedicated BigQuery dataset for the hackathon event day."
        }
        heroDescription="This page is the warehouse view for the hackathon. It either shows the modeled BigQuery story or, when the export is empty, the exact evidence for why the warehouse is still blank."
        onSourceChange={setSource}
        source={source}
        summaryMetrics={summaryCards}
        topBadges={[
          "Hackathon",
          "Host vote.rajeevg.com",
          status.eventDayLabel ? `Event day ${status.eventDayLabel}` : "Event day unavailable",
          "BigQuery",
        ]}
        preMetricContent={
          <div className="space-y-4">
            <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
              <HackathonDisclosureCard
                title="Metric and field definitions"
                description="Plain-English definitions for every warehouse metric and field used on this page."
              >
                <DefinitionTable
                  definitions={dataset.definitions}
                  derivedDefinitions={derivedDefinitions}
                />
              </HackathonDisclosureCard>
              <HackathonReportingNotesCard notes={dataset.notes} />
            </div>
          </div>
        }
      >
      {isLiveWarehouseOnly ? (
        <SectionShell
          eyebrow="Warehouse"
          title="Warehouse status"
          description="This page stays warehouse-scoped. When the export is empty, it shows proof of the warehouse state instead of substitute analytics totals."
        >
          <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <Card className="border-border/70 bg-background/80">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="size-4" />
                  Modeled tables
                </CardTitle>
                <CardDescription>
                  Every table in the dedicated `hackathon_reporting` dataset, with the current landed row count.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {primaryModeledTableRows.map((row) => (
                  <div
                    key={row.table}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-background/50 px-4 py-3"
                  >
                    <p className="break-words font-medium text-foreground">{row.table}</p>
                    <p className="shrink-0 text-lg font-semibold">{formatCount(row.rowCount)}</p>
                  </div>
                ))}
                {overflowModeledTableRows.length ? (
                  <details className="rounded-2xl border border-border/60 bg-background/50">
                    <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-foreground">
                      More modeled tables ({overflowModeledTableRows.length})
                    </summary>
                    <div className="space-y-3 border-t border-border/60 px-4 py-4">
                      {overflowModeledTableRows.map((row) => (
                        <div
                          key={row.table}
                          className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-background/70 px-4 py-3"
                        >
                          <p className="break-words font-medium text-foreground">{row.table}</p>
                          <p className="shrink-0 text-lg font-semibold">{formatCount(row.rowCount)}</p>
                        </div>
                      ))}
                    </div>
                  </details>
                ) : null}
              </CardContent>
            </Card>

            <Card className="border-border/70 bg-background/80">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RadioTower className="size-4" />
                  Export link proof
                </CardTitle>
                <CardDescription>
                  Live Admin API evidence for the GA4 to BigQuery export link that should be feeding this route.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                {status.link ? (
                  <>
                    <div className="rounded-2xl border border-border/60 bg-background/50 p-4">
                      <p className="font-medium text-foreground">{status.link.name}</p>
                      <p className="mt-2 text-muted-foreground">
                        Created {new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }).format(new Date(status.link.createTime))} UTC
                      </p>
                      <p className="mt-2 text-muted-foreground">
                        Dataset location {status.link.datasetLocation}. Daily export {status.link.dailyExportEnabled ? "enabled" : "disabled"}. Streaming export {status.link.streamingExportEnabled ? "enabled" : "disabled"}.
                      </p>
                    </div>
                    <div className="rounded-2xl border border-border/60 bg-background/50 p-4">
                      <p className="font-medium text-foreground">Selected streams</p>
                      <ul className="mt-2 space-y-2 text-muted-foreground">
                        {status.link.exportStreams.map((stream) => (
                          <li key={stream}>{stream}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-2xl border border-border/60 bg-background/50 p-4">
                      <p className="font-medium text-foreground">Excluded events</p>
                      <p className="mt-2 text-muted-foreground">
                        {status.link.excludedEvents.length
                          ? status.link.excludedEvents.join(", ")
                          : "None returned by the live Admin API response."}
                      </p>
                    </div>
                  </>
                ) : (
                  <p className="text-muted-foreground">
                    The warehouse check succeeded, but the Admin API link record could not be read from this runtime.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </SectionShell>
      ) : (
        <>
          <SectionShell
            eyebrow="Pulse"
            title="Daily volume"
            description="Modeled event-day activity from BigQuery, focused on the core judging story."
            actions={<RendererToggle renderer={renderer} onChange={setRenderer} />}
          >
            <Card className="border-border/70 bg-background/80">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="size-4" />
                  Daily momentum
                </CardTitle>
                  <CardDescription>
                    Modeled users and recorded vote submissions over the event-day window.
                  </CardDescription>
              </CardHeader>
              <CardContent>{overviewChart}</CardContent>
            </Card>
          </SectionShell>

          <SectionShell
            eyebrow="Funnel"
            title="Judge access and vote flow"
            description="This section answers the main operational question: did judges get in cleanly, open voting, and complete submissions?"
          >
            <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <Card className="border-border/70 bg-background/80">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <RadioTower className="size-4" />
                    Voting funnel
                  </CardTitle>
                  <CardDescription>
                    From auth to submitted vote, using the dedicated voting funnel table rather than generic GA conversion events.
                  </CardDescription>
                </CardHeader>
                <CardContent>{funnelChart}</CardContent>
              </Card>
              <Card className="border-border/70 bg-background/80">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="size-4" />
                    Auth mix
                  </CardTitle>
                  <CardDescription>
                    Passwordless and Google sign-ins split by method.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {authChart}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <MetricTile label="Successful judge sign-ins" value={formatCount(authTotals.authCompletions)} tooltip="Successful judge sign-ins recorded in the warehouse model." />
                    <MetricTile label="Sign-in failures" value={formatCount(authTotals.authFailures + authTotals.googleFailures)} tooltip="Authentication failures recorded in the warehouse model." />
                    <MetricTile label="Vote modal opens" value={formatCount(votingTotals.dialogViews)} tooltip="Modeled openings of the voting modal for the event day." />
                    <MetricTile label="Recorded vote submissions" value={formatCount(votingTotals.submittedVotes)} tooltip="Vote submissions recorded in the BigQuery model for the event day." />
                  </div>
                </CardContent>
              </Card>
            </div>
          </SectionShell>

          <SectionShell
            eyebrow="Entries"
            title="Entry performance"
            description="Project-by-project performance, combining leaderboard strength with how reliably views turned into votes."
          >
            <div className="grid gap-6">
              <Card className="border-border/70 bg-background/80">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="size-4" />
                    Leaderboard by total score
                  </CardTitle>
                  <CardDescription>
                    Total score accumulated across the modeled event-day window.
                  </CardDescription>
                </CardHeader>
                <CardContent>{leaderboardChart}</CardContent>
              </Card>
              <Card className="border-border/70 bg-background/80">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="size-4" />
                    Vote conversion by entry
                  </CardTitle>
                  <CardDescription>
                    Bubble size tracks recorded votes, the x-axis shows average vote score, and the y-axis shows how reliably an eligible modal view became a vote.
                  </CardDescription>
                </CardHeader>
                <CardContent>{entryScatter}</CardContent>
              </Card>
              {topEntry ? (
                <Card className="border-border/70 bg-background/80">
                  <CardHeader>
                    <CardTitle>Current top entry readout</CardTitle>
                    <CardDescription>
                      The leading project right now, with the exact metrics most likely to come up in a retrospective.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <MetricTile label="Entry" value={topEntry.entryName} />
                    <MetricTile label="Total score" value={formatCount(topEntry.totalScore)} tooltip="The sum of all scores recorded for this entry in the modeled dataset." />
                    <MetricTile label="Average vote score" value={formatScore(topEntry.averageScore)} tooltip="The average score recorded for this entry in the modeled dataset." />
                    <MetricTile label="Vote conversion rate" value={formatPercent(topEntry.viewToVoteRate)} tooltip="Recorded vote submissions divided by eligible modal opens for this entry." />
                  </CardContent>
                </Card>
              ) : null}
            </div>
          </SectionShell>
        </>
      )}

      {!isLiveWarehouseOnly ? (
        <SectionShell
          eyebrow="Taxonomy"
          title="Tracked event mix"
          description="Event vocabulary grouped by viewer role and judging state, so you can see where the modeled activity is concentrated."
        >
          <div className="grid gap-6">
            <Card className="border-border/70 bg-background/80">
              <CardHeader>
                <CardTitle>Tracked event mix</CardTitle>
                <CardDescription>
                  Grouped by viewer role and competition status so you can quickly see whether activity is public, judge-led, or manager-led.
                </CardDescription>
              </CardHeader>
              <CardContent>{taxonomyChart}</CardContent>
            </Card>
          </div>
        </SectionShell>
      ) : null}
      </HackathonReportingShell>
    </div>
  )
}

function MetricTile({
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
