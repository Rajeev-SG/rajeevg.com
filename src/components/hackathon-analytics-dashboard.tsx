"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import Link from "next/link"
import * as Plot from "@observablehq/plot"
import * as echarts from "echarts/core"
import { BarChart, FunnelChart, HeatmapChart, LineChart, PieChart, ScatterChart, SunburstChart } from "echarts/charts"
import { DatasetComponent, GridComponent, LegendComponent, TitleComponent, TooltipComponent, VisualMapComponent } from "echarts/components"
import { CanvasRenderer } from "echarts/renderers"
import {
  Activity,
  ArrowRight,
  BarChart3,
  Database,
  Eye,
  Gauge,
  GitBranch,
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
  ExperienceOverviewRow,
  HackathonAnalyticsDataset,
  ManagerOperationsRow,
  RoundSnapshotRow,
  VotingFunnelRow,
} from "@/lib/hackathon-reporting-types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
}

type RendererMode = "echarts" | "observable"
type SourceMode = "live" | "dummy"

type SummaryCard = {
  label: string
  value: string
  tone?: "default" | "accent"
  detail: string
}

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`
}

function formatScore(value: number) {
  return value.toFixed(value >= 10 ? 0 : 1)
}

function formatCount(value: number) {
  return new Intl.NumberFormat("en-GB").format(value)
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

function aggregateManager(rows: ManagerOperationsRow[]) {
  return rows.reduce(
    (acc, row) => {
      acc.importedProjectTotal += row.importedProjectTotal
      acc.entryVotingOpened += row.entryVotingOpened
      acc.entryVotingClosed += row.entryVotingClosed
      acc.finalizations += row.finalizations
      acc.resets += row.resets
      return acc
    },
    { importedProjectTotal: 0, entryVotingOpened: 0, entryVotingClosed: 0, finalizations: 0, resets: 0 },
  )
}

function getLatestSnapshot(rows: RoundSnapshotRow[]) {
  return rows.at(-1)
}

function groupEntryPerformance(rows: EntryPerformanceRow[]) {
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
    .map((row) => ({
      ...row,
      averageScore: row.averageScore / row.daysObserved,
      viewToVoteRate: row.viewToVoteRate / row.daysObserved,
    }))
    .sort((a, b) => b.totalScore - a.totalScore)
}

function aggregateExperience(rows: ExperienceOverviewRow[]) {
  const viewportMap = new Map<string, { viewport: string; engaged: number; users: number; count: number }>()
  const boardViewMap = new Map<string, { boardView: string; tableViewSwitches: number; chartViewSwitches: number; users: number }>()
  for (const row of rows) {
    const viewport = viewportMap.get(row.viewportCategory) ?? {
      viewport: row.viewportCategory,
      engaged: 0,
      users: 0,
      count: 0,
    }
    viewport.engaged += row.avgEngagedSeconds
    viewport.users += row.uniqueUsers
    viewport.count += 1
    viewportMap.set(row.viewportCategory, viewport)

    const boardView = boardViewMap.get(row.boardView) ?? {
      boardView: row.boardView,
      tableViewSwitches: 0,
      chartViewSwitches: 0,
      users: 0,
    }
    boardView.tableViewSwitches += row.tableViewSwitches
    boardView.chartViewSwitches += row.chartViewSwitches
    boardView.users += row.uniqueUsers
    boardViewMap.set(row.boardView, boardView)
  }

  return {
    viewportSummary: Array.from(viewportMap.values()).map((row) => ({
      ...row,
      avgEngagedSeconds: row.count ? row.engaged / row.count : 0,
    })),
    boardViewSummary: Array.from(boardViewMap.values()),
  }
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

  return <div ref={ref} className={cn("h-[320px] w-full", className)} />
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
  children,
}: {
  eyebrow: string
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <section className="space-y-4" id={title.toLowerCase().replace(/\s+/g, "-")}>
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">{eyebrow}</p>
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
          <p className="max-w-3xl text-sm text-muted-foreground sm:text-base">{description}</p>
        </div>
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

function SourceToggle({
  source,
  onChange,
}: {
  source: SourceMode
  onChange: (value: SourceMode) => void
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

function DefinitionTable({ definitions }: { definitions: AnalyticsDefinition[] }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {definitions.map((definition) => (
        <Card key={definition.key} className="border-border/70 bg-background/80">
          <CardHeader className="space-y-3 pb-3">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-base">{definition.label}</CardTitle>
              <Badge variant="outline">{definition.type}</Badge>
            </div>
            <CardDescription className="text-sm leading-6">{definition.meaning}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="font-medium text-foreground">Typical values or units</p>
              <p className="text-muted-foreground">{definition.typicalValues}</p>
            </div>
            <div>
              <p className="font-medium text-foreground">How to read it</p>
              <p className="text-muted-foreground">{definition.interpretation}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function HackathonAnalyticsDashboard({ live, dummy }: DashboardProps) {
  const { resolvedTheme } = useTheme()
  const palette = usePalette(resolvedTheme)
  const [renderer, setRenderer] = React.useState<RendererMode>("echarts")
  const [source, setSource] = React.useState<SourceMode>(live.hasLiveRows ? "live" : "dummy")

  const dataset = source === "live" ? live : dummy
  const overviewTotals = aggregateOverview(dataset.overview)
  const authTotals = aggregateAuth(dataset.authFunnel)
  const votingTotals = aggregateVoting(dataset.votingFunnel)
  const managerTotals = aggregateManager(dataset.managerOperations)
  const latestSnapshot = getLatestSnapshot(dataset.roundSnapshots)
  const entries = groupEntryPerformance(dataset.entryPerformance)
  const experience = aggregateExperience(dataset.experienceOverview)
  const taxonomy = aggregateEventTaxonomy(dataset.eventBreakdown)

  const summaryCards: SummaryCard[] = [
    {
      label: "Votes submitted",
      value: formatCount(overviewTotals.voteSubmissions),
      tone: "accent",
      detail: "Total successful scoring events recorded in the reporting layer.",
    },
    {
      label: "Judges authenticated",
      value: formatCount(overviewTotals.judgeAuthCompletions),
      detail: "Passwordless and Google sign-ins that completed successfully.",
    },
    {
      label: "Remaining votes",
      value: formatCount(latestSnapshot?.totalRemainingVotes ?? 0),
      detail: "Live denominator for the manager’s judging-completion decision.",
    },
    {
      label: "Aggregate score points",
      value: formatCount(overviewTotals.totalScore),
      detail: "Total score mass distributed across the field.",
    },
  ]

  const topEntry = entries[0]
  const entryLabels = entries.map((entry) => entry.entryName)
  const eventDates = dataset.overview.map((row) => row.eventDate)

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
              name: "Unique users",
              type: "line",
              smooth: true,
              data: dataset.overview.map((row) => row.uniqueUsers),
            },
            {
              name: "Vote submissions",
              type: "bar",
              barMaxWidth: 26,
              data: dataset.overview.map((row) => row.voteSubmissions),
            },
            {
              name: "Manager actions",
              type: "line",
              smooth: true,
              data: dataset.overview.map((row) => row.managerActions),
            },
          ],
        }}
      />
    ) : (
      <ObservableSurface
        builder={(width) =>
          Plot.plot({
            width,
            height: 320,
            marginLeft: 52,
            marginBottom: 48,
            style: { background: palette.panel, color: palette.text },
            x: { label: null, tickRotate: -20 },
            y: { grid: true, label: "Daily count" },
            color: { legend: true },
            marks: [
              Plot.ruleY([0], { stroke: palette.grid }),
              Plot.barY(dataset.overview, {
                x: "eventDate",
                y: "voteSubmissions",
                fill: palette.accent[1],
                inset: 0.18,
              }),
              Plot.lineY(dataset.overview, {
                x: "eventDate",
                y: "uniqueUsers",
                stroke: palette.accent[0],
                marker: true,
              }),
              Plot.lineY(dataset.overview, {
                x: "eventDate",
                y: "managerActions",
                stroke: palette.accent[4],
                marker: true,
              }),
            ],
          })
        }
      />
    )

  const funnelStages = [
    { stage: "Auth requested", value: authTotals.authRequests || authTotals.googleStarts },
    { stage: "Auth completed", value: authTotals.authCompletions },
    { stage: "Dialog viewed", value: votingTotals.dialogViews },
    { stage: "Score selected", value: votingTotals.scoreSelections },
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
            height: 320,
            marginLeft: 120,
            style: { background: palette.panel, color: palette.text },
            x: { grid: true, label: "People or events" },
            y: { label: null },
            marks: [
              Plot.ruleX([0], { stroke: palette.grid }),
              Plot.barX(funnelStages, {
                y: "stage",
                x: "value",
                fill: palette.accent[1],
                sort: { y: "-x" },
              }),
              Plot.text(funnelStages, {
                y: "stage",
                x: "value",
                text: (d) => formatCount(d.value),
                dx: 18,
                fill: palette.text,
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
            height: 320,
            style: { background: palette.panel, color: palette.text },
            color: { legend: true, range: palette.accent },
            marks: [
              Plot.barX(authMethodChartData, {
                x: "completions",
                y: "method",
                fill: "method",
                sort: { y: "-x" },
              }),
              Plot.text(authMethodChartData, {
                x: "completions",
                y: "method",
                text: (d) => formatCount(d.completions),
                dx: 18,
                fill: palette.text,
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
          grid: { left: 44, right: 24, top: 24, bottom: 34 },
          xAxis: {
            type: "value",
            name: "Average score",
            nameTextStyle: { color: palette.muted },
            axisLabel: { color: palette.muted },
            splitLine: { lineStyle: { color: palette.grid } },
          },
          yAxis: {
            type: "value",
            name: "View-to-vote rate",
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
              label: {
                show: true,
                formatter: (params: { data: [number, number, number, string] }) => params.data[3],
                position: "top",
                color: palette.text,
              },
            },
          ],
        }}
      />
    ) : (
      <ObservableSurface
        builder={(width) =>
          Plot.plot({
            width,
            height: 320,
            marginLeft: 56,
            marginBottom: 48,
            style: { background: palette.panel, color: palette.text },
            x: { label: "Average score", grid: true },
            y: { label: "View to vote rate", percent: true, grid: true },
            marks: [
              Plot.dot(entries, {
                x: "averageScore",
                y: "viewToVoteRate",
                r: (d) => 6 + d.votesSubmitted * 0.9,
                fill: palette.accent[2],
                stroke: palette.panel,
              }),
              Plot.text(entries, {
                x: "averageScore",
                y: "viewToVoteRate",
                text: "entryName",
                dy: -16,
                fill: palette.text,
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
          grid: { left: 96, right: 20, top: 20, bottom: 20 },
          xAxis: {
            type: "value",
            axisLabel: { color: palette.muted },
            splitLine: { lineStyle: { color: palette.grid } },
          },
          yAxis: {
            type: "category",
            data: entryLabels,
            axisLabel: { color: palette.muted },
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
            height: 320,
            marginLeft: 118,
            style: { background: palette.panel, color: palette.text },
            x: { label: "Aggregate score", grid: true },
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

  const managerChart =
    renderer === "echarts" ? (
      <EChartSurface
        option={{
          backgroundColor: "transparent",
          color: palette.accent,
          legend: { bottom: 0, textStyle: { color: palette.muted } },
          tooltip: { trigger: "axis" },
          grid: { left: 26, right: 20, top: 20, bottom: 52, containLabel: true },
          xAxis: {
            type: "category",
            data: dataset.managerOperations.map((row) => row.eventDate),
            axisLabel: { color: palette.muted },
          },
          yAxis: {
            type: "value",
            axisLabel: { color: palette.muted },
            splitLine: { lineStyle: { color: palette.grid } },
          },
          series: [
            { name: "Uploads", type: "bar", stack: "ops", data: dataset.managerOperations.map((row) => row.workbookUploadSuccesses) },
            { name: "Entry opens", type: "bar", stack: "ops", data: dataset.managerOperations.map((row) => row.entryVotingOpened) },
            { name: "Entry closes", type: "bar", stack: "ops", data: dataset.managerOperations.map((row) => row.entryVotingClosed) },
            { name: "Round starts", type: "bar", stack: "ops", data: dataset.managerOperations.map((row) => row.roundStarts) },
            { name: "Finalizations", type: "bar", stack: "ops", data: dataset.managerOperations.map((row) => row.finalizations) },
          ],
        }}
      />
    ) : (
      <ObservableSurface
        builder={(width) =>
          Plot.plot({
            width,
            height: 320,
            marginBottom: 48,
            style: { background: palette.panel, color: palette.text },
            x: { label: null, tickRotate: -20 },
            y: { label: "Daily manager operations", grid: true },
            color: { legend: true },
            marks: [
              Plot.barY(dataset.managerOperations, {
                x: "eventDate",
                y: "workbookUploadSuccesses",
                fill: palette.accent[0],
                inset: 0.2,
              }),
              Plot.barY(dataset.managerOperations, {
                x: "eventDate",
                y: "entryVotingOpened",
                fill: palette.accent[2],
                inset: 0.45,
              }),
              Plot.barY(dataset.managerOperations, {
                x: "eventDate",
                y: "entryVotingClosed",
                fill: palette.accent[4],
                inset: 0.7,
              }),
              Plot.lineY(dataset.managerOperations, {
                x: "eventDate",
                y: "finalizations",
                stroke: palette.accent[5],
                marker: true,
              }),
            ],
          })
        }
      />
    )

  const experienceCells = dataset.experienceOverview.map((row) => ({
    key: `${row.viewportCategory}-${row.boardView}`,
    viewportCategory: row.viewportCategory,
    boardView: row.boardView,
    avgEngagedSeconds: row.avgEngagedSeconds,
  }))

  const uniqueViewports = Array.from(new Set(experienceCells.map((row) => row.viewportCategory)))
  const uniqueBoardViews = Array.from(new Set(experienceCells.map((row) => row.boardView)))

  const experienceChart =
    renderer === "echarts" ? (
      <EChartSurface
        option={{
          backgroundColor: "transparent",
          tooltip: { trigger: "item" },
          grid: { left: 54, right: 20, top: 20, bottom: 30 },
          xAxis: {
            type: "category",
            data: uniqueBoardViews,
            axisLabel: { color: palette.muted },
          },
          yAxis: {
            type: "category",
            data: uniqueViewports,
            axisLabel: { color: palette.muted },
          },
          visualMap: {
            min: 0,
            max: Math.max(...experienceCells.map((row) => row.avgEngagedSeconds), 1),
            calculable: false,
            orient: "horizontal",
            left: "center",
            bottom: 0,
            inRange: {
              color: ["#0f172a", palette.accent[0]],
            },
            textStyle: { color: palette.muted },
          },
          series: [
            {
              type: "heatmap",
              data: experienceCells.map((row) => [
                uniqueBoardViews.indexOf(row.boardView),
                uniqueViewports.indexOf(row.viewportCategory),
                Number(row.avgEngagedSeconds.toFixed(1)),
              ]),
              label: { show: true, color: palette.text },
            },
          ],
        }}
      />
    ) : (
      <ObservableSurface
        builder={(width) =>
          Plot.plot({
            width,
            height: 320,
            marginLeft: 64,
            style: { background: palette.panel, color: palette.text },
            x: { label: null },
            y: { label: null },
            color: { scheme: "blues", legend: true },
            marks: [
              Plot.cell(experienceCells, {
                x: "boardView",
                y: "viewportCategory",
                fill: "avgEngagedSeconds",
                inset: 2,
              }),
              Plot.text(experienceCells, {
                x: "boardView",
                y: "viewportCategory",
                text: (d) => formatScore(d.avgEngagedSeconds),
                fill: palette.text,
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
              label: { color: palette.text },
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
            height: 320,
            marginLeft: 140,
            style: { background: palette.panel, color: palette.text },
            x: { label: "Event count", grid: true },
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
                  fx: "eventName",
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
      <section className="overflow-hidden rounded-[2rem] border border-border/70 bg-gradient-to-br from-background via-background to-muted/30">
        <div className="grid gap-6 px-6 py-8 sm:px-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="rounded-full px-3 py-1">
                Hackathon analytics lab
              </Badge>
              <Badge variant="outline" className="rounded-full px-3 py-1">
                {source === "live" ? "Live reporting dataset" : "Dummy data preview"}
              </Badge>
              <Badge variant="outline" className="rounded-full px-3 py-1">
                {renderer === "echarts" ? "ECharts renderer" : "Observable Plot renderer"}
              </Badge>
            </div>
            <div className="space-y-3">
              <h1 className="max-w-4xl text-4xl font-semibold tracking-tight sm:text-5xl">
                Hackathon voting analytics, without the muddy Looker Studio layer.
              </h1>
              <p className="max-w-3xl text-base text-muted-foreground sm:text-lg">
                This route is a dedicated reporting surface for the voting app. It stays pinned to
                the `hackathon_reporting` dataset, supports a dummy preview mode for design review,
                and lets you flip the whole visual system between ECharts and Observable Plot.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <RendererToggle renderer={renderer} onChange={setRenderer} />
              <SourceToggle
                source={source}
                onChange={setSource}
              />
            </div>
          </div>
          <Card className="border-border/70 bg-background/80">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Database className="size-4" />
                Reporting source
              </CardTitle>
              <CardDescription>
                Generated {new Date(dataset.generatedAt).toLocaleString("en-GB", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {dataset.notes.map((note) => (
                <p key={note} className="text-sm leading-6 text-muted-foreground">
                  {note}
                </p>
              ))}
              <div className="flex flex-wrap gap-2 pt-2">
                <Button asChild size="sm">
                  <Link href="/projects/hackathon-voting-analytics/google-analytics">
                    GA4 API surface
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href="https://vote.rajeevg.com" target="_blank" rel="noreferrer">
                    Live voting app
                    <ArrowRight className="size-4" />
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
        {summaryCards.map((card) => (
          <Card key={card.label} className={cn("border-border/70 bg-background/80", card.tone === "accent" && "bg-linear-to-br from-background to-cyan-500/5")}>
            <CardHeader className="pb-3">
              <CardDescription>{card.label}</CardDescription>
              <CardTitle className="text-3xl">{card.value}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-6 text-muted-foreground">{card.detail}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <SectionShell
        eyebrow="Pulse"
        title="Round pulse and volume"
        description="This combines the scoreboard-sized story with the traffic-shaped story, so you can tell whether usage, votes, and manager interventions rose together."
      >
        <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <Card className="border-border/70 bg-background/80">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="size-4" />
                Daily momentum
              </CardTitle>
              <CardDescription>
                Unique users, submitted votes, and manager actions over the reporting window.
              </CardDescription>
            </CardHeader>
            <CardContent>{overviewChart}</CardContent>
          </Card>
          <Card className="border-border/70 bg-background/80">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gauge className="size-4" />
                Latest round state
              </CardTitle>
              <CardDescription>
                The freshest denominator snapshot from the dedicated round snapshot table.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <MetricTile label="Status" value={latestSnapshot?.competitionStatus ?? "pending"} />
                <MetricTile label="Entries" value={formatCount(latestSnapshot?.entryCount ?? 0)} />
                <MetricTile label="Open entries" value={formatCount(latestSnapshot?.openEntryCount ?? 0)} />
                <MetricTile label="Judges in denominator" value={formatCount(latestSnapshot?.participatingJudgeCount ?? 0)} />
              </div>
              <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  Remaining votes
                </p>
                <p className="mt-2 text-4xl font-semibold tracking-tight">
                  {formatCount(latestSnapshot?.totalRemainingVotes ?? 0)}
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  This is the on-the-day manager number to trust before closing individual entries or finalizing the round.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </SectionShell>

      <SectionShell
        eyebrow="Funnel"
        title="Voting funnel and judge access"
        description="This section answers the first real operational question people ask: did judges get in cleanly, open the modal, and actually finish their votes?"
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
                Passwordless and Google auth completions split by method, ready for when live rows start landing.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {authChart}
              <div className="grid gap-3 sm:grid-cols-2">
                <MetricTile label="Auth completions" value={formatCount(authTotals.authCompletions)} />
                <MetricTile label="Auth failures" value={formatCount(authTotals.authFailures + authTotals.googleFailures)} />
                <MetricTile label="Dialog views" value={formatCount(votingTotals.dialogViews)} />
                <MetricTile label="Submitted votes" value={formatCount(votingTotals.submittedVotes)} />
              </div>
            </CardContent>
          </Card>
        </div>
      </SectionShell>

      <SectionShell
        eyebrow="Entries"
        title="Entry analysis"
        description="Project-by-project performance needs both ranking and friction context, so this section pairs the scoreboard story with conversion quality."
      >
        <div className="grid gap-6">
          <Card className="border-border/70 bg-background/80">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="size-4" />
                Leaderboard by aggregate score
              </CardTitle>
              <CardDescription>
                Summed score mass across the reporting window, taken from entry performance rather than the public scoreboard UI.
              </CardDescription>
            </CardHeader>
            <CardContent>{leaderboardChart}</CardContent>
          </Card>
          <Card className="border-border/70 bg-background/80">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="size-4" />
                Conversion quality by entry
              </CardTitle>
              <CardDescription>
                Bubble size tracks submitted votes, the x-axis shows average score, and the y-axis shows how reliably an eligible modal view became a vote.
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
              <CardContent className="grid gap-3 sm:grid-cols-4">
                <MetricTile label="Entry" value={topEntry.entryName} />
                <MetricTile label="Aggregate score" value={formatCount(topEntry.totalScore)} />
                <MetricTile label="Average score" value={formatScore(topEntry.averageScore)} />
                <MetricTile label="View-to-vote rate" value={formatPercent(topEntry.viewToVoteRate)} />
              </CardContent>
            </Card>
          ) : null}
        </div>
      </SectionShell>

      <SectionShell
        eyebrow="Manager"
        title="Manager operations"
        description="This is the operational trust layer: upload behavior, entry open-close activity, and the few actions that can change the state of the event."
      >
        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <Card className="border-border/70 bg-background/80">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="size-4" />
                Round-control activity
              </CardTitle>
              <CardDescription>
                Uploads, entry state changes, round starts, and finalizations across the reporting window.
              </CardDescription>
            </CardHeader>
            <CardContent>{managerChart}</CardContent>
          </Card>
          <Card className="border-border/70 bg-background/80">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers3 className="size-4" />
                Operations digest
              </CardTitle>
              <CardDescription>
                The fastest way to answer “did the control surface behave the way we expected?”
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <MetricTile label="Projects imported" value={formatCount(managerTotals.importedProjectTotal)} />
              <MetricTile label="Entries opened" value={formatCount(managerTotals.entryVotingOpened)} />
              <MetricTile label="Entries closed" value={formatCount(managerTotals.entryVotingClosed)} />
              <MetricTile label="Finalizations" value={formatCount(managerTotals.finalizations)} />
              <MetricTile label="Resets" value={formatCount(managerTotals.resets)} />
              <MetricTile label="Workbook issues" value={formatCount(dataset.managerOperations.reduce((sum, row) => sum + row.workbookIssueTotal, 0))} />
            </CardContent>
          </Card>
        </div>
      </SectionShell>

      <SectionShell
        eyebrow="Experience"
        title="Experience, devices, and board behavior"
        description="The reporting shell should answer not just whether votes happened, but how the interface behaved across device classes, themes, and table-versus-chart board usage."
      >
        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <Card className="border-border/70 bg-background/80">
            <CardHeader>
              <CardTitle>Engagement heatmap</CardTitle>
              <CardDescription>
                Average engaged seconds by viewport category and preferred board view.
              </CardDescription>
            </CardHeader>
            <CardContent>{experienceChart}</CardContent>
          </Card>
          <Card className="border-border/70 bg-background/80">
            <CardHeader>
              <CardTitle>Board-view behavior</CardTitle>
              <CardDescription>
                Whether people stayed in table mode or deliberately explored the chart renderer.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {experience.boardViewSummary.map((row) => (
                <div key={row.boardView} className="rounded-2xl border border-border/70 bg-muted/30 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                        {row.boardView}
                      </p>
                      <p className="mt-1 text-2xl font-semibold">{formatCount(row.users)} users</p>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      <p>Table switches: {formatCount(row.tableViewSwitches)}</p>
                      <p>Chart switches: {formatCount(row.chartViewSwitches)}</p>
                    </div>
                  </div>
                </div>
              ))}
              {experience.viewportSummary.map((row) => (
                <div key={row.viewport} className="flex items-center justify-between border-b border-border/60 py-2 text-sm last:border-b-0">
                  <span className="font-medium capitalize">{row.viewport}</span>
                  <span className="text-muted-foreground">
                    {formatScore(row.avgEngagedSeconds)}s avg engaged time
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </SectionShell>

      <SectionShell
        eyebrow="Taxonomy"
        title="Event taxonomy and promoted schema"
        description="This is the operator-facing reference layer: what the event vocabulary looks like, how it groups by role and round state, and what each promoted dimension or metric actually means."
      >
        <div className="grid gap-6">
          <Card className="border-border/70 bg-background/80">
            <CardHeader>
              <CardTitle>Event taxonomy</CardTitle>
              <CardDescription>
                Grouped by viewer role and competition status so you can see whether the event vocabulary is balanced or manager-heavy.
              </CardDescription>
            </CardHeader>
            <CardContent>{taxonomyChart}</CardContent>
          </Card>
          <DefinitionTable definitions={dataset.definitions} />
        </div>
      </SectionShell>
    </div>
  )
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-lg font-semibold tracking-tight">{value}</p>
    </div>
  )
}
