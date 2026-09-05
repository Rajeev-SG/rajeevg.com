import { ContentOpsDashboard } from "@/components/content-ops/content-ops-dashboard"
import { getContentOpsData } from "@/lib/content-ops/data"
import { getGa4SiteAnalyticsDashboard } from "@/lib/ga4-site-reporting"
import { getSearchConsoleMetricsByPage } from "@/lib/content-ops/search-console"

export default async function DashboardPage() {
  const [data, ga4, searchByPage] = await Promise.all([
    getContentOpsData(),
    getGa4SiteAnalyticsDashboard().catch(() => null),
    getSearchConsoleMetricsByPage().catch(() => ({})),
  ])

  const analytics = ga4
    ? {
        dataSource: ga4.dataSource,
        historicalWindow: ga4.historicalWindow,
        screenPageViews: ga4.overview.screenPageViews,
        sessions: ga4.overview.sessions,
        activeUsers: ga4.overview.activeUsers,
        topPages: ga4.topContent.slice(0, 5).map((row) => ({
          path: row.pagePath,
          views: row.screenPageViews,
        })),
        topSearchPages: Object.entries(searchByPage)
          .map(([path, metrics]) => ({
            path,
            clicks: metrics.clicks ?? 0,
            impressions: metrics.impressions ?? 0,
          }))
          .sort((a, b) => b.impressions - a.impressions)
          .slice(0, 5),
        searchAvailable: Object.keys(searchByPage).length > 0,
      }
    : undefined

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-[0.22em] text-muted-foreground">Content</p>
        <h1 className="text-3xl font-semibold tracking-tight">Content overview</h1>
        <p className="max-w-3xl text-muted-foreground">
          What&apos;s live, what&apos;s next, and where search performance is moving — one page, no spreadsheet archaeology.
        </p>
      </div>

      <ContentOpsDashboard
        tabs={data.tabs}
        summary={data.summary}
        providerOptions={data.providerOptions}
        capabilities={data.capabilities}
        analytics={analytics}
      />
    </section>
  )
}
