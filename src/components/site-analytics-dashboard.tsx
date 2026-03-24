import type { ReactNode } from "react"
import Link from "next/link"
import { ArrowUpRight, BarChart3, Clock3, RadioTower, ScrollText, ShieldCheck } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { SiteAnalyticsDashboard as SiteAnalyticsDashboardData } from "@/lib/ga4-site-reporting-types"

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

type MetricCardProps = {
  label: string
  value: string
  detail: string
  icon: ReactNode
}

function MetricCard({ label, value, detail, icon }: MetricCardProps) {
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

export function SiteAnalyticsDashboard({ report }: { report: SiteAnalyticsDashboardData }) {
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
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{report.promotedDimensions.length} custom dimensions</Badge>
            <Badge variant="secondary">{report.promotedMetrics.length} custom metrics</Badge>
            <Badge variant="secondary">{report.portfolioKeyEvents.length} key events</Badge>
          </div>
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
              : 0
          )}%`}
          detail="Share of tracked views coming from blog pages in the current reporting window."
          icon={<ScrollText className="size-4" />}
        />
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
                    <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Engagement</p>
                    <p className="text-lg font-semibold">{formatDuration(row.userEngagementDuration)}</p>
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
            <CardDescription>
              How the current site traffic splits across device classes.
            </CardDescription>
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
                      <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Views</p>
                      <p className="text-xl font-semibold">{formatInteger(row.screenPageViews)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Engagement</p>
                      <p className="text-xl font-semibold">{formatDuration(row.userEngagementDuration)}</p>
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
                    <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Engagement</p>
                    <p className="text-lg font-semibold">{formatDuration(row.userEngagementDuration)}</p>
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
                <Link className="inline-flex items-center gap-1 text-primary hover:underline" href="/blog/how-we-built-a-consented-first-party-analytics-stack">
                  Analytics stack post
                  <ArrowUpRight className="size-3.5" />
                </Link>
              </p>
              <p>
                <Link className="inline-flex items-center gap-1 text-primary hover:underline" href="/blog/how-we-finished-the-ga4-property-setup-on-rajeevg-com">
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
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
