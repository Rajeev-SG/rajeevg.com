"use client"

import { BookOpenText, CircleAlert, Hammer, Lightbulb } from "lucide-react"

import { ContentDataTable } from "@/components/content-ops/content-data-table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PRIMARY_TABS, computeDashboardCounts } from "@/lib/content-ops/ia"
import type { ContentOpsCapabilities, ContentOpsRow } from "@/lib/content-ops/types"

type ProviderOption = {
  provider: "fallback" | "brave" | "openrouter" | "minimax"
  label: string
  configured: boolean
}

type DashboardSummary = {
  totalStrategyAssets: number
  totalTrackedContent: number
  queuedIdeas: number
  liveAssets: number
  glossaryNodes: number
  interactiveAssets: number
}

type AnalyticsSummary = {
  dataSource: "live" | "fallback"
  historicalWindow: string
  screenPageViews: number
  sessions: number
  activeUsers: number
  topPages: { path: string; views: number }[]
  topSearchPages: { path: string; clicks: number; impressions: number }[]
  searchAvailable: boolean
}

type ContentOpsDashboardProps = {
  tabs: Record<string, ContentOpsRow[]>
  summary: DashboardSummary
  providerOptions: ProviderOption[]
  capabilities: ContentOpsCapabilities
  analytics?: AnalyticsSummary
}

const PRIMARY_TAB_IDS = PRIMARY_TABS.map((tab) => tab.id)

export function ContentOpsDashboard({ tabs, providerOptions, capabilities, analytics }: ContentOpsDashboardProps) {
  const allRows = Object.values(tabs).flat()
  const counts = computeDashboardCounts(allRows)
  const liveRows = tabs.Existing_Content ?? []
  const ideaRows = [...(tabs.Master_Matrix ?? []), ...(tabs.Topic_Graph ?? [])]
  const draftRows = [...(tabs.Title_Decisions ?? [])]

  return (
    <Tabs defaultValue="overview" className="space-y-6">
      <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 rounded-xl border bg-background p-1.5">
        {PRIMARY_TABS.map((tab) => (
          <TabsTrigger key={tab.id} value={tab.id} className="rounded-lg px-3 py-2">
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>

      {/* ── Overview ─────────────────────────────────────────── */}
      <TabsContent value="overview" className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <CircleAlert className="size-4 text-amber-500" />
                Needs attention
              </CardDescription>
              <CardTitle className="text-3xl">{counts.needsAttention}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {counts.needsAttention === 0
                ? "Nothing blocked or waiting on review."
                : "Blocked, in review, or waiting on a PR."}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <Lightbulb className="size-4 text-sky-500" />
                Active opportunities
              </CardDescription>
              <CardTitle className="text-3xl">{counts.opportunities}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Ideas worth a second look, from research and planning.
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <BookOpenText className="size-4 text-emerald-500" />
                Live content tracked
              </CardDescription>
              <CardTitle className="text-3xl">{counts.liveTracked}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Posts, hubs, and proof pages already published and monitored.
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <Hammer className="size-4 text-violet-500" />
                In progress
              </CardDescription>
              <CardTitle className="text-3xl">{counts.inFlight}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Approved or actively being written right now.
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>What changed recently</CardTitle>
            <CardDescription>
              {analytics?.dataSource === "live"
                ? `Traffic and search numbers cover ${analytics.historicalWindow.toLowerCase()}.`
                : "Traffic data is unavailable right now — the numbers below will fill in once the reporting API responds."}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <p className="font-medium">Site traffic</p>
              <p className="text-muted-foreground">
                {analytics?.dataSource === "live"
                  ? `${analytics.screenPageViews.toLocaleString()} page views · ${analytics.sessions.toLocaleString()} sessions`
                  : "No GA4 data available in this view yet."}
              </p>
            </div>
            <div>
              <p className="font-medium">Search visibility</p>
              <p className="text-muted-foreground">
                {analytics?.searchAvailable
                  ? `${analytics.topSearchPages.reduce((sum, p) => sum + p.impressions, 0).toLocaleString()} impressions across tracked pages`
                  : "Search Console data will appear here once the first sync completes."}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Needs attention</CardTitle>
            <CardDescription>Work that is blocked, waiting on review, or sitting in a PR.</CardDescription>
          </CardHeader>
          <CardContent>
            {counts.needsAttention === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing is stuck. The next review cycle is clear.</p>
            ) : (
              <ContentDataTable
                rows={tabs.Existing_Content?.filter((row) =>
                  ["blocked", "review", "pr_open"].includes(row.workflowStatus)
                ) ?? []}
                providerOptions={providerOptions}
                capabilities={capabilities}
                compact
              />
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* ── Content ──────────────────────────────────────────── */}
      <TabsContent value="content" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Live content</CardTitle>
            <CardDescription>
              Everything published and tracked, with search performance where we have it.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ContentDataTable
              rows={liveRows}
              providerOptions={providerOptions}
              capabilities={capabilities}
            />
          </CardContent>
        </Card>
      </TabsContent>

      {/* ── Opportunities ────────────────────────────────────── */}
      <TabsContent value="opportunities" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Ideas worth a second look</CardTitle>
            <CardDescription>
              Candidate pages and angles from planning, ranked by potential impact. Nothing here is published yet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ContentDataTable
              rows={ideaRows}
              providerOptions={providerOptions}
              capabilities={capabilities}
            />
          </CardContent>
        </Card>
      </TabsContent>

      {/* ── Drafts ───────────────────────────────────────────── */}
      <TabsContent value="drafts" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Drafts and working decisions</CardTitle>
            <CardDescription>
              Titles, angles, and half-built drafts that have not shipped. Work in the open, share when it&apos;s ready.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ContentDataTable
              rows={draftRows}
              providerOptions={providerOptions}
              capabilities={capabilities}
            />
          </CardContent>
        </Card>
      </TabsContent>

      {/* ── Analytics ────────────────────────────────────────── */}
      <TabsContent value="analytics" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Traffic and search, at a glance</CardTitle>
            <CardDescription>
              {analytics?.dataSource === "live"
                ? `Live from GA4 and Search Console, ${analytics.historicalWindow.toLowerCase()}.`
                : "The reporting API has not responded yet. Zeros here mean unavailable, not quiet."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Page views</p>
                <p className="mt-2 text-2xl font-semibold">
                  {analytics?.dataSource === "live" ? analytics.screenPageViews.toLocaleString() : "—"}
                </p>
              </div>
              <div className="rounded-xl border p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Sessions</p>
                <p className="mt-2 text-2xl font-semibold">
                  {analytics?.dataSource === "live" ? analytics.sessions.toLocaleString() : "—"}
                </p>
              </div>
              <div className="rounded-xl border p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Active users</p>
                <p className="mt-2 text-2xl font-semibold">
                  {analytics?.dataSource === "live" ? analytics.activeUsers.toLocaleString() : "—"}
                </p>
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium">Most viewed pages</p>
              {analytics?.dataSource === "live" && analytics.topPages.length > 0 ? (
                <ul className="space-y-1 text-sm">
                  {analytics.topPages.slice(0, 5).map((page) => (
                    <li key={page.path} className="flex justify-between rounded-lg border px-3 py-2">
                      <span className="font-mono text-xs">{page.path}</span>
                      <span className="text-muted-foreground">{page.views.toLocaleString()} views</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No page data available yet.</p>
              )}
            </div>

            <div>
              <p className="mb-2 text-sm font-medium">Search Console — top pages</p>
              {analytics?.searchAvailable && analytics.topSearchPages.length > 0 ? (
                <ul className="space-y-1 text-sm">
                  {analytics.topSearchPages.slice(0, 5).map((page) => (
                    <li key={page.path} className="flex justify-between rounded-lg border px-3 py-2">
                      <span className="font-mono text-xs">{page.path}</span>
                      <span className="text-muted-foreground">
                        {page.clicks.toLocaleString()} clicks · {page.impressions.toLocaleString()} impressions
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Search Console data lands here after the first successful pull.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* ── Reference data ───────────────────────────────────── */}
      <TabsContent value="reference" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Reference data</CardTitle>
            <CardDescription>
              The original planning workbook, kept for history. Nothing here is needed for day-to-day decisions, but
              nothing has been deleted either.
            </CardDescription>
          </CardHeader>
        </Card>
        {(["Master_Matrix", "Title_Decisions", "Topic_Graph", "Programmatic", "Interactive_Assets", "Sources"] as const).map(
          (tab) => (
            <Card key={tab}>
              <CardHeader>
                <CardTitle className="text-base">{tab.replaceAll("_", " ")}</CardTitle>
              </CardHeader>
              <CardContent>
                <ContentDataTable
                  rows={tabs[tab] || []}
                  providerOptions={providerOptions}
                  capabilities={capabilities}
                  compact
                />
              </CardContent>
            </Card>
          )
        )}
      </TabsContent>
    </Tabs>
  )
}
