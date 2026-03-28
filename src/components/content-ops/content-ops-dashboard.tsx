"use client"

import { BarChart3, BookOpenText, Layers3, Workflow } from "lucide-react"

import { ContentDataTable } from "@/components/content-ops/content-data-table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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

type ContentOpsDashboardProps = {
  tabs: Record<string, ContentOpsRow[]>
  summary: DashboardSummary
  providerOptions: ProviderOption[]
  capabilities: ContentOpsCapabilities
}

export function ContentOpsDashboard({ tabs, summary, providerOptions, capabilities }: ContentOpsDashboardProps) {
  const orderedTabs = [
    "Dashboard",
    "Master_Matrix",
    "Existing_Content",
    "Title_Decisions",
    "Topic_Graph",
    "Programmatic",
    "Interactive_Assets",
    "Sources",
  ]

  return (
    <Tabs defaultValue="Dashboard" className="space-y-6">
      <TabsList className="flex h-auto w-full flex-wrap justify-start gap-2 rounded-xl border bg-background p-2">
        {orderedTabs.map((tab) => (
          <TabsTrigger key={tab} value={tab} className="rounded-lg px-3 py-2">
            {tab.replaceAll("_", " ")}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="Dashboard" className="space-y-6">
        {capabilities.deploymentMode === "hosted" ? (
          <Card className="border-amber-500/40 bg-amber-500/5">
            <CardHeader>
              <CardTitle className="text-lg">Hosted preview mode</CardTitle>
              <CardDescription>
                {capabilities.reason}
              </CardDescription>
            </CardHeader>
          </Card>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Strategy database</CardDescription>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Layers3 className="size-5 text-sky-500" />
                {summary.totalStrategyAssets}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Seeded from the workbook, then expanded with current-site content and queued derivatives.
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Tracked live content</CardDescription>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <BookOpenText className="size-5 text-emerald-500" />
                {summary.liveAssets}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Existing posts, glossary nodes, hubs, dashboards, and proof routes already mapped into the new system.
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Queued opportunities</CardDescription>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Workflow className="size-5 text-amber-500" />
                {summary.queuedIdeas}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Derived ideas waiting for research, drafting, or approval inside the CMS workflow.
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Interactive and glossary assets</CardDescription>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <BarChart3 className="size-5 text-violet-500" />
                {summary.interactiveAssets + summary.glossaryNodes}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Bounded pSEO-safe concept nodes plus live proof dashboards and interactive routes.
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
          <Card>
            <CardHeader>
              <CardTitle>How this content OS is organised</CardTitle>
              <CardDescription>
                The workbook stays the strategic seed, while the repo inventory and workflow state turn it into an operational system.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                The public site now works as a graph: hubs route readers into flagships, proof pages, playbooks, dashboards, and glossary nodes.
              </p>
              <p>
                The dashboard mirrors the spreadsheet tabs, but each row can now move through a workflow, carry a research pack, open into the editor, and later connect to GitHub or deploy status.
              </p>
              <p>
                Existing content is not treated as legacy debris. Every live article and dashboard is classified, linked upward into a pillar, and linked sideways into its next best proof or action.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Research providers</CardTitle>
              <CardDescription>Adapters are configured once and exposed everywhere the row sheet or editor needs research context.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {providerOptions.map((provider) => (
                <div key={provider.provider} className="flex items-center justify-between rounded-lg border px-3 py-2">
                  <span className="text-sm">{provider.label}</span>
                  <Badge variant={provider.configured ? "default" : "outline"}>
                    {provider.configured ? "Configured" : "Fallback"}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Priority working set</CardTitle>
            <CardDescription>Start here to move existing proof into a cleaner content graph.</CardDescription>
          </CardHeader>
          <CardContent>
            <ContentDataTable
              rows={tabs.Existing_Content.slice(0, 12)}
              providerOptions={providerOptions}
              capabilities={capabilities}
            />
          </CardContent>
        </Card>
      </TabsContent>

      {orderedTabs
        .filter((tab) => tab !== "Dashboard")
        .map((tab) => (
          <TabsContent key={tab} value={tab}>
            <Card>
              <CardHeader>
                <CardTitle>{tab.replaceAll("_", " ")}</CardTitle>
                <CardDescription>
                  {tab === "Existing_Content"
                    ? "Live posts, dashboards, hubs, glossary nodes, and queued derived ideas layered on top of the workbook."
                    : "Strategy rows rendered as an operational table with filtering, sorting, row detail, and workflow actions where available."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ContentDataTable
                  rows={tabs[tab] || []}
                  providerOptions={providerOptions}
                  capabilities={capabilities}
                />
              </CardContent>
            </Card>
          </TabsContent>
        ))}
    </Tabs>
  )
}
