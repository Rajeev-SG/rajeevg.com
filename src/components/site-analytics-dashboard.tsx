"use client"

import * as React from "react"
import Link from "next/link"
import { useTheme } from "next-themes"
import * as Plot from "@observablehq/plot"
import * as echarts from "echarts/core"
import { BarChart, PieChart } from "echarts/charts"
import { DatasetComponent, GridComponent, LegendComponent, TooltipComponent } from "echarts/components"
import { CanvasRenderer } from "echarts/renderers"
import {
  ArrowUpRight,
  BarChart3,
  Clock3,
  RadioTower,
  ScrollText,
  ShieldCheck,
  Sparkles,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type {
  SiteAnalyticsDashboard as SiteAnalyticsDashboardData,
  SiteDeviceMixRow,
  SiteKeyEventRow,
  SitePagePerformanceRow,
  SiteRealtimeEventRow,
} from "@/lib/ga4-site-reporting-types"
import { cn } from "@/lib/utils"

echarts.use([
  BarChart,
  PieChart,
  CanvasRenderer,
  DatasetComponent,
  GridComponent,
  LegendComponent,
  TooltipComponent,
])

type RendererMode = "echarts" | "observable"

function formatInteger(value: number) {
  return new Intl.NumberFormat("en-GB").format(value)
}

function formatDuration(seconds: number) {
  if (!seconds) return "0m"
  if (seconds < 60) return `${Math.round(seconds)}s`

  const minutes = seconds / 60
  if (minutes < 120) return `${minutes.toFixed(1)}m`

  return `${(minutes / 60).toFixed(1)}h`
}

function formatPath(path: string) {
  return path === "/" ? "Home" : path
}

function paletteForTheme(resolvedTheme?: string) {
  return resolvedTheme === "dark"
    ? {
        panel: "#0b1220",
        plotBackground: "#101826",
        grid: "rgba(148,163,184,0.18)",
        text: "#f8fafc",
        muted: "rgba(226,232,240,0.74)",
        accent: ["#38bdf8", "#22c55e", "#f97316", "#facc15", "#a78bfa", "#fb7185"],
      }
    : {
        panel: "#ffffff",
        plotBackground: "#f8fafc",
        grid: "rgba(15,23,42,0.12)",
        text: "#0f172a",
        muted: "rgba(15,23,42,0.62)",
        accent: ["#0369a1", "#15803d", "#ea580c", "#ca8a04", "#7c3aed", "#e11d48"],
      }
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
    <Card className="border-border/70 bg-card/70">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            {label}
          </p>
          <CardTitle className="text-3xl">{value}</CardTitle>
        </div>
        <div className="rounded-full border border-border/70 bg-muted/30 p-2 text-muted-foreground">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-6 text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  )
}

function ChartCard({
  title,
  description,
  emptyText,
  children,
}: {
  title: string
  description: string
  emptyText: string
  children: React.ReactNode
}) {
  const hasChildren = React.Children.count(children) > 0

  return (
    <Card className="border-border/70 bg-card/70">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {hasChildren ? (
          children
        ) : (
          <p className="text-sm leading-6 text-muted-foreground">{emptyText}</p>
        )}
      </CardContent>
    </Card>
  )
}

function buildTopBlogChart(
  renderer: RendererMode,
  rows: SitePagePerformanceRow[],
  palette: ReturnType<typeof paletteForTheme>,
) {
  if (!rows.length) return null

  const topRows = rows.slice(0, 6)

  return renderer === "echarts" ? (
    <EChartSurface
      option={{
        backgroundColor: "transparent",
        color: [palette.accent[0], palette.accent[1]],
        tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
        legend: { bottom: 0, textStyle: { color: palette.muted } },
        grid: { left: 28, right: 24, top: 24, bottom: 48, containLabel: true },
        xAxis: {
          type: "value",
          axisLabel: { color: palette.muted },
          splitLine: { lineStyle: { color: palette.grid } },
        },
        yAxis: {
          type: "category",
          inverse: true,
          data: topRows.map((row) => formatPath(row.pagePath)),
          axisLabel: { color: palette.muted, width: 180, overflow: "truncate" },
          axisLine: { lineStyle: { color: palette.grid } },
        },
        series: [
          {
            name: "Views",
            type: "bar",
            barMaxWidth: 18,
            data: topRows.map((row) => row.screenPageViews),
          },
          {
            name: "Users",
            type: "bar",
            barMaxWidth: 18,
            data: topRows.map((row) => row.activeUsers),
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
          marginRight: 32,
          style: { background: palette.plotBackground, color: palette.text },
          x: { label: "Views and users", grid: true },
          y: { label: null },
          color: { legend: true, range: [palette.accent[0], palette.accent[1]] },
          marks: [
            Plot.ruleX([0], { stroke: palette.grid }),
            Plot.barX(topRows, {
              x: "screenPageViews",
              y: (row) => formatPath(row.pagePath),
              fill: "screenPageViews",
              insetRight: 0.2,
            }),
            Plot.dot(topRows, {
              x: "activeUsers",
              y: (row) => formatPath(row.pagePath),
              r: 7,
              fill: palette.accent[1],
              stroke: palette.plotBackground,
            }),
          ],
        })
      }
    />
  )
}

function buildDeviceChart(
  renderer: RendererMode,
  rows: SiteDeviceMixRow[],
  palette: ReturnType<typeof paletteForTheme>,
) {
  if (!rows.length) return null

  return renderer === "echarts" ? (
    <EChartSurface
      option={{
        backgroundColor: "transparent",
        color: palette.accent,
        tooltip: { trigger: "item" },
        legend: { bottom: 0, textStyle: { color: palette.muted } },
        series: [
          {
            type: "pie",
            radius: ["45%", "72%"],
            data: rows.map((row) => ({
              name: row.deviceCategory,
              value: row.screenPageViews,
            })),
            label: { color: palette.text, formatter: "{b}: {d}%" },
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
          marginLeft: 96,
          marginRight: 32,
          style: { background: palette.plotBackground, color: palette.text },
          x: { label: "Page views", grid: true },
          y: { label: null },
          color: { legend: true, range: palette.accent },
          marks: [
            Plot.ruleX([0], { stroke: palette.grid }),
            Plot.barX(rows, {
              x: "screenPageViews",
              y: "deviceCategory",
              fill: "deviceCategory",
              sort: { y: "-x" },
            }),
            Plot.text(rows, {
              x: "screenPageViews",
              y: "deviceCategory",
              text: (row) => formatInteger(row.activeUsers),
              dx: 18,
              fill: palette.text,
            }),
          ],
        })
      }
    />
  )
}

function buildRealtimeChart(
  renderer: RendererMode,
  rows: SiteRealtimeEventRow[],
  palette: ReturnType<typeof paletteForTheme>,
) {
  if (!rows.length) return null

  const topRows = rows.slice(0, 8)

  return renderer === "echarts" ? (
    <EChartSurface
      option={{
        backgroundColor: "transparent",
        color: [palette.accent[2]],
        tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
        grid: { left: 28, right: 24, top: 24, bottom: 72, containLabel: true },
        xAxis: {
          type: "category",
          data: topRows.map((row) => row.eventName),
          axisLabel: { color: palette.muted, rotate: 24, interval: 0 },
          axisLine: { lineStyle: { color: palette.grid } },
        },
        yAxis: {
          type: "value",
          axisLabel: { color: palette.muted },
          splitLine: { lineStyle: { color: palette.grid } },
        },
        series: [
          {
            type: "bar",
            barMaxWidth: 32,
            data: topRows.map((row) => row.eventCount),
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
          marginBottom: 96,
          style: { background: palette.plotBackground, color: palette.text },
          x: { label: null, tickRotate: -26 },
          y: { label: "Last 30 minutes", grid: true },
          marks: [
            Plot.ruleY([0], { stroke: palette.grid }),
            Plot.barY(topRows, {
              x: "eventName",
              y: "eventCount",
              fill: palette.accent[2],
              inset: 0.16,
            }),
          ],
        })
      }
    />
  )
}

function buildKeyEventChart(
  renderer: RendererMode,
  rows: SiteKeyEventRow[],
  palette: ReturnType<typeof paletteForTheme>,
) {
  if (!rows.length) return null

  return renderer === "echarts" ? (
    <EChartSurface
      option={{
        backgroundColor: "transparent",
        color: [palette.accent[4], palette.accent[5]],
        tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
        legend: { bottom: 0, textStyle: { color: palette.muted } },
        grid: { left: 28, right: 24, top: 24, bottom: 48, containLabel: true },
        xAxis: {
          type: "value",
          axisLabel: { color: palette.muted },
          splitLine: { lineStyle: { color: palette.grid } },
        },
        yAxis: {
          type: "category",
          inverse: true,
          data: rows.map((row) => row.eventName),
          axisLabel: { color: palette.muted },
          axisLine: { lineStyle: { color: palette.grid } },
        },
        series: [
          {
            name: "Key events",
            type: "bar",
            barMaxWidth: 18,
            data: rows.map((row) => row.keyEvents),
          },
          {
            name: "Total hits",
            type: "bar",
            barMaxWidth: 18,
            data: rows.map((row) => row.eventCount),
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
          marginLeft: 126,
          marginRight: 32,
          style: { background: palette.plotBackground, color: palette.text },
          x: { label: "Key events and event hits", grid: true },
          y: { label: null },
          color: { legend: true, range: [palette.accent[4], palette.accent[5]] },
          marks: [
            Plot.ruleX([0], { stroke: palette.grid }),
            Plot.barX(rows, {
              x: "eventCount",
              y: "eventName",
              fill: "eventCount",
              insetBottom: 0.16,
            }),
            Plot.dot(rows, {
              x: "keyEvents",
              y: "eventName",
              r: 7,
              fill: palette.accent[4],
              stroke: palette.plotBackground,
            }),
          ],
        })
      }
    />
  )
}

export function SiteAnalyticsDashboard({ report }: { report: SiteAnalyticsDashboardData }) {
  const { resolvedTheme } = useTheme()
  const palette = paletteForTheme(resolvedTheme)
  const [renderer, setRenderer] = React.useState<RendererMode>("echarts")

  const averageEngagementSeconds =
    report.overview.activeUsers > 0
      ? report.overview.userEngagementDuration / report.overview.activeUsers
      : 0

  return (
    <section
      className="space-y-8"
      data-analytics-section="site_reporting_dashboard"
      data-analytics-item-type="page_section"
      data-analytics-page-context="primary"
      data-analytics-page-content-group="projects"
      data-analytics-page-content-type="site_reporting_dashboard"
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">GA4 Data API</Badge>
          <Badge variant="outline">{report.historicalWindow}</Badge>
          <Badge variant="outline">{report.realtimeWindow}</Badge>
          <Badge variant="outline">Host filter: {report.siteHostname}</Badge>
          <Badge variant={report.dataSource === "live" ? "default" : "secondary"}>
            {report.dataSource === "live" ? "Live property data" : "Fallback snapshot"}
          </Badge>
        </div>
        <div className="space-y-3">
          <p className="text-sm uppercase tracking-[0.22em] text-muted-foreground">Reporting route</p>
          <h1 className="max-w-4xl text-3xl font-bold tracking-tight sm:text-4xl">
            GA4 content and instrumentation dashboard
          </h1>
          <p className="max-w-4xl text-base leading-7 text-muted-foreground sm:text-lg">
            A site-specific reporting layer for <code>rajeevg.com</code> that keeps the custom
            schema, portfolio key events, and content performance visible without blending in the
            hackathon app traffic from the shared GA4 property.
          </p>
        </div>
      </div>

      <Card className="border-border/70 bg-linear-to-br from-background via-background to-muted/30">
        <CardHeader className="gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <CardTitle className="text-2xl">Live reporting boundaries</CardTitle>
            <CardDescription className="max-w-3xl text-sm leading-6 sm:text-base">
              Historical cards read from property <code>{report.propertyId}</code> and filter to
              <code> {report.siteHostname}</code>. Realtime custom-event cards lock to stream
              <code> {report.streamId}</code> so the main site’s vocabulary stays visible even
              though the shared property also collects <code>vote.rajeevg.com</code>.
            </CardDescription>
          </div>
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{report.promotedDimensions.length} custom dimensions</Badge>
              <Badge variant="secondary">{report.promotedMetrics.length} custom metrics</Badge>
              <Badge variant="secondary">{report.portfolioKeyEvents.length} key events</Badge>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="outline">
                {renderer === "echarts" ? "ECharts renderer" : "Observable Plot renderer"}
              </Badge>
              <RendererToggle renderer={renderer} onChange={setRenderer} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {report.notes.map((note) => (
            <p key={note} className="text-sm leading-6 text-muted-foreground">
              {note}
            </p>
          ))}
          <p className="text-sm leading-6 text-muted-foreground">
            The chart toggle redraws the same live dataset two different ways so it is easier to
            compare narrative summaries, categorical breakdowns, and realtime event spikes without
            leaving this route.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Page views"
          value={formatInteger(report.overview.screenPageViews)}
          detail="All main-site page views in the historical window, filtered away from the hackathon app."
          icon={<BarChart3 className="size-4" />}
        />
        <MetricCard
          label="Active users"
          value={formatInteger(report.overview.activeUsers)}
          detail="Distinct active users seen on rajeevg.com across the last 30 days."
          icon={<RadioTower className="size-4" />}
        />
        <MetricCard
          label="Avg engagement"
          value={formatDuration(averageEngagementSeconds)}
          detail="Average engaged time per active user, using GA4’s engagement-duration metric."
          icon={<Clock3 className="size-4" />}
        />
        <MetricCard
          label="Blog share"
          value={`${Math.round(
            report.overview.screenPageViews > 0
              ? (report.overview.blogScreenPageViews / report.overview.screenPageViews) * 100
              : 0,
          )}%`}
          detail="Share of tracked views coming from blog pages in the current reporting window."
          icon={<ScrollText className="size-4" />}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard
          title="Top blog pages"
          description="The most-read blog URLs on the main site, combining headline volume with the audience behind it."
          emptyText="No blog-specific rows were returned in the current reporting window."
        >
          {buildTopBlogChart(renderer, report.topBlogPosts, palette)}
        </ChartCard>

        <ChartCard
          title="Device mix"
          description="A quick read on whether the audience is leaning desktop, mobile, or tablet in the current host-filtered window."
          emptyText="Device-category rows are not available from the current API response."
        >
          {buildDeviceChart(renderer, report.deviceMix, palette)}
        </ChartCard>

        <ChartCard
          title="Realtime custom events"
          description="The site-owned vocabulary visible in the last 30 minutes, filtered to the main-site GA4 stream."
          emptyText="No tracked custom events are visible in realtime right now."
        >
          {buildRealtimeChart(renderer, report.realtimeCustomEvents, palette)}
        </ChartCard>

        <ChartCard
          title="Portfolio key events"
          description="The conversion-like interactions that matter most on the public site, separated from raw event volume."
          emptyText="No historical key-event rows are available yet for the filtered main-site window."
        >
          {buildKeyEventChart(renderer, report.keyEvents, palette)}
        </ChartCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-border/70 bg-card/70">
          <CardHeader>
            <CardTitle>Top blog pages</CardTitle>
            <CardDescription>
              The content pages currently carrying the most reading volume on the main site.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {report.topBlogPosts.length ? (
              report.topBlogPosts.map((row) => (
                <div
                  key={`${row.pagePath}-${row.pageTitle}`}
                  className="grid gap-2 rounded-2xl border border-border/60 bg-background/50 p-4 md:grid-cols-[1.5fr_auto_auto_auto]"
                >
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">{formatPath(row.pagePath)}</p>
                    <p className="text-sm leading-6 text-muted-foreground">{row.pageTitle}</p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Views</p>
                    <p className="text-lg font-semibold">{formatInteger(row.screenPageViews)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Users</p>
                    <p className="text-lg font-semibold">{formatInteger(row.activeUsers)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                      Engagement
                    </p>
                    <p className="text-lg font-semibold">
                      {formatDuration(row.userEngagementDuration)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm leading-6 text-muted-foreground">
                No blog-specific rows were returned in the current reporting window.
              </p>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-border/70 bg-card/70">
            <CardHeader>
              <CardTitle>Realtime custom events</CardTitle>
              <CardDescription>
                The main-site custom event vocabulary currently visible in GA4 Realtime.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {report.realtimeCustomEvents.length ? (
                report.realtimeCustomEvents.map((row) => (
                  <div
                    key={`${row.eventName}-${row.eventCount}`}
                    className="flex items-center justify-between rounded-xl border border-border/60 bg-background/50 px-4 py-3"
                  >
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">{row.eventName}</p>
                      <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                        stream {report.streamId}
                      </p>
                    </div>
                    <p className="text-2xl font-semibold">{formatInteger(row.eventCount)}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm leading-6 text-muted-foreground">
                  No tracked custom events are visible in realtime right now. That usually means the
                  main site is quiet, not that the schema disappeared.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card/70">
            <CardHeader>
              <CardTitle>Portfolio key events</CardTitle>
              <CardDescription>
                Key-event rows promoted for the site’s conversion-like interactions.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {report.keyEvents.length ? (
                report.keyEvents.map((row) => (
                  <div
                    key={row.eventName}
                    className="flex items-center justify-between rounded-xl border border-border/60 bg-background/50 px-4 py-3"
                  >
                    <div>
                      <p className="font-medium text-foreground">{row.eventName}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatInteger(row.eventCount)} total event hits in the retained window
                      </p>
                    </div>
                    <p className="text-2xl font-semibold">{formatInteger(row.keyEvents)}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm leading-6 text-muted-foreground">
                  No historical key-event rows are available yet for the filtered main-site window.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="border-border/70 bg-card/70">
          <CardHeader>
            <CardTitle>Device mix</CardTitle>
            <CardDescription>How the current site traffic splits across device classes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {report.deviceMix.length ? (
              report.deviceMix.map((row) => (
                <div
                  key={row.deviceCategory}
                  className="rounded-2xl border border-border/60 bg-background/50 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium capitalize text-foreground">{row.deviceCategory}</p>
                    <Badge variant="outline">{formatInteger(row.activeUsers)} users</Badge>
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                        Views
                      </p>
                      <p className="text-xl font-semibold">{formatInteger(row.screenPageViews)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                        Engagement
                      </p>
                      <p className="text-xl font-semibold">
                        {formatDuration(row.userEngagementDuration)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm leading-6 text-muted-foreground">
                Device-category rows are not available from the current API response.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/70">
          <CardHeader>
            <CardTitle>Full-site page leaders</CardTitle>
            <CardDescription>
              The highest-volume pages on the main site across blog, projects, and supporting routes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {report.topContent.length ? (
              report.topContent.map((row) => (
                <div
                  key={`${row.pagePath}-${row.pageTitle}`}
                  className="grid gap-2 rounded-2xl border border-border/60 bg-background/50 p-4 md:grid-cols-[1.5fr_auto_auto]"
                >
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">{formatPath(row.pagePath)}</p>
                    <p className="text-sm leading-6 text-muted-foreground">{row.pageTitle}</p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Views</p>
                    <p className="text-lg font-semibold">{formatInteger(row.screenPageViews)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                      Engagement
                    </p>
                    <p className="text-lg font-semibold">
                      {formatDuration(row.userEngagementDuration)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm leading-6 text-muted-foreground">
                No page-performance rows were returned for the current historical window.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="border-border/70 bg-card/70">
          <CardHeader>
            <CardTitle>Promoted site dimensions</CardTitle>
            <CardDescription>
              Event-scoped fields promoted on the GA4 property so the site-owned schema is usable in
              reports and explorations.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {report.promotedDimensions.map((item) => (
              <Badge key={item} variant="outline">
                {item}
              </Badge>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/70">
          <CardHeader>
            <CardTitle>Promoted site metrics</CardTitle>
            <CardDescription>
              Numeric event parameters preserved as first-class reporting metrics.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {report.promotedMetrics.map((item) => (
              <Badge key={item} variant="outline">
                {item}
              </Badge>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/70 bg-card/70">
        <CardHeader>
          <CardTitle>Why this route exists</CardTitle>
          <CardDescription>
            The shared property is now good enough that it deserves a site-owned reading surface, not
            just a GA admin tab.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-border/60 bg-background/50 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Front and center
            </p>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              The dashboard keeps the blog pages, project pages, current custom event stream, and
              promoted schema in one place so the site’s content analytics do not get flattened into
              default <code>page_view</code> tables.
            </p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-background/50 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Related reading
            </p>
            <div className="mt-3 space-y-3 text-sm leading-6 text-muted-foreground">
              <p>
                <Link
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                  href="/blog/how-we-built-a-consented-first-party-analytics-stack"
                >
                  Analytics stack post
                  <ArrowUpRight className="size-3.5" />
                </Link>
              </p>
              <p>
                <Link
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                  href="/blog/how-we-finished-the-ga4-property-setup-on-rajeevg-com"
                >
                  GA4 property post
                  <ArrowUpRight className="size-3.5" />
                </Link>
              </p>
              <p>
                <Link className="inline-flex items-center gap-1 text-primary hover:underline" href="/privacy">
                  Privacy and consent policy
                  <ShieldCheck className="size-3.5" />
                </Link>
              </p>
              <p className="inline-flex items-center gap-1 text-muted-foreground">
                <Sparkles className="size-3.5" />
                Same live GA4 payload, two renderer systems, one route to review.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
