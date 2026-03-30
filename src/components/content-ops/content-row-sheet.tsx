"use client"

import Link from "next/link"
import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Sparkles, Workflow, FilePenLine, Search, Rocket, Link2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import type { ContentOpsCapabilities, ContentOpsRow, ResearchPack } from "@/lib/content-ops/types"

type ProviderOption = {
  provider: "fallback" | "brave" | "openrouter" | "minimax"
  label: string
  configured: boolean
}

type ContentRowSheetProps = {
  row: ContentOpsRow
  providerOptions: ProviderOption[]
  capabilities: ContentOpsCapabilities
}

function TimelineBadge({ label, active }: { label: string; active: boolean }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border px-3 py-2">
      <span
        className={`size-2 rounded-full ${active ? "bg-emerald-500" : "bg-muted-foreground/30"}`}
      />
      <span className="text-sm">{label}</span>
    </div>
  )
}

export function ContentRowSheet({ row, providerOptions, capabilities }: ContentRowSheetProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pack, setPack] = useState<ResearchPack | null>(null)
  const [derived, setDerived] = useState(Boolean(row.derived))
  const [selectedProvider, setSelectedProvider] = useState<
    "fallback" | "brave" | "openrouter" | "minimax"
  >("fallback")
  const [pending, startTransition] = useTransition()
  const canMutate = row.sourceType !== "workbook" && capabilities.workflowWritesEnabled

  const timeline = useMemo(
    () => [
      "planned",
      "queued",
      "research_ready",
      "in_progress",
      "review",
      "approved",
      "pr_open",
      "merged",
      "deployed",
      "live",
    ],
    []
  )

  const currentIndex = Math.max(timeline.indexOf(row.workflowStatus), 0)

  const runAction = async (
    endpoint: string,
    payload: Record<string, unknown>,
    onSuccess?: (result: Record<string, unknown>) => void
  ) => {
    startTransition(async () => {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        const result = await response.json()
        onSuccess?.(result)
        router.refresh()
      }
    })
  }

  const orderedFields = Object.entries(row.record).filter(
    ([key, value]) => key !== "_row" && value !== "" && value !== null && value !== undefined
  )

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="justify-start px-0 text-left font-medium">
          {row.title}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader className="border-b">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{row.tab}</Badge>
            <Badge variant="outline">{row.workflowStatus}</Badge>
            {row.pageClass ? <Badge variant="outline">{row.pageClass}</Badge> : null}
            {derived ? <Badge variant="outline">Derived</Badge> : null}
          </div>
          <SheetTitle className="pr-12 text-2xl">{row.title}</SheetTitle>
          <SheetDescription>
            {row.pillar ? `${row.pillar} / ${row.cluster}` : "Workbook reference row"}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 p-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Status
              </p>
              <p className="mt-2 text-sm text-foreground">{row.status}</p>
              {row.url ? (
                <Link
                  href={row.url}
                  className="mt-3 inline-flex items-center gap-2 text-sm text-sky-600 hover:underline"
                >
                  <Link2 className="size-4" />
                  Open destination
                </Link>
              ) : null}
            </div>
            <div className="rounded-xl border p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Working notes
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {row.notes || "Use this row to drive research, drafting, publication, and proof work."}
              </p>
            </div>
          </div>

          {row.metrics ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {row.metrics.impressions !== undefined ? (
                <div className="rounded-xl border p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    Impressions
                  </p>
                  <p className="mt-2 text-2xl font-semibold">{row.metrics.impressions}</p>
                </div>
              ) : null}
              {row.metrics.clicks !== undefined ? (
                <div className="rounded-xl border p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    Clicks
                  </p>
                  <p className="mt-2 text-2xl font-semibold">{row.metrics.clicks}</p>
                </div>
              ) : null}
              {row.metrics.ctr !== undefined ? (
                <div className="rounded-xl border p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    CTR
                  </p>
                  <p className="mt-2 text-2xl font-semibold">{(row.metrics.ctr * 100).toFixed(1)}%</p>
                </div>
              ) : null}
              {row.metrics.averagePosition !== undefined ? (
                <div className="rounded-xl border p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    Avg position
                  </p>
                  <p className="mt-2 text-2xl font-semibold">{row.metrics.averagePosition.toFixed(1)}</p>
                </div>
              ) : null}
            </div>
          ) : null}

          {canMutate ? (
            <div className="rounded-xl border p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    Actions
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Research, queueing, editor access, SEO review, and release tracking all start here.
                  </p>
                </div>
                {pending ? <Loader2 className="size-4 animate-spin text-muted-foreground" /> : null}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  onClick={() =>
                    runAction(
                      "/api/content-ops/research",
                      { assetId: row.id, provider: selectedProvider },
                      (result) => setPack((result.pack as ResearchPack | undefined) ?? null)
                    )
                  }
                >
                  <Sparkles className="mr-2 size-4" />
                  Generate research pack
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => runAction("/api/content-ops/workflow", { assetId: row.id, action: "queue" })}
                >
                  <Workflow className="mr-2 size-4" />
                  Queue content item
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={derived}
                  onClick={() =>
                    runAction("/api/content-ops/workflow", { assetId: row.id, action: "mark-derived" }, () =>
                      setDerived(true)
                    )
                  }
                >
                  <Rocket className="mr-2 size-4" />
                  {derived ? "Marked derived" : "Mark as derived"}
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link href={`/dashboard/editor/${row.id}`}>
                    <FilePenLine className="mr-2 size-4" />
                    Open in editor
                  </Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <a href="#seo-suggestions">View SEO/programmatic suggestions</a>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <a href="#deployment-timeline">View deployment timeline/status</a>
                </Button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {providerOptions.map((option) => (
                  <Button
                    key={option.provider}
                    size="sm"
                    variant={selectedProvider === option.provider ? "default" : "outline"}
                    className="h-8"
                    onClick={() => setSelectedProvider(option.provider)}
                  >
                    {option.label}
                    {!option.configured ? " (fallback)" : ""}
                  </Button>
                ))}
              </div>
            </div>
          ) : row.sourceType !== "workbook" && capabilities.reason ? (
            <div className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-4 text-sm text-muted-foreground">
              {capabilities.reason}
            </div>
          ) : null}

          <div id="seo-suggestions" className="rounded-xl border p-4">
            <div className="flex items-center gap-2">
              <Search className="size-4 text-muted-foreground" />
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                SEO and programmatic suggestions
              </p>
            </div>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>Keep indexation conservative: {row.indexation || "review before publishing"}.</li>
              <li>
                Reinforce the {row.pillar?.toLowerCase() || "current"} hub with explicit next-step links.
              </li>
              <li>
                Treat this as {row.pageClass?.toLowerCase() || "a strategy asset"} rather than a thin keyword
                page.
              </li>
            </ul>
          </div>

          <div id="deployment-timeline" className="rounded-xl border p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Deployment timeline
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {timeline.map((item, index) => (
                <TimelineBadge key={item} label={item} active={index <= currentIndex} />
              ))}
            </div>
          </div>

          {pack ? (
            <div className="rounded-xl border p-4">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-muted-foreground" />
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  Research pack
                </p>
              </div>
              <div className="mt-4 space-y-4 text-sm">
                <div>
                  <p className="font-medium">Query cluster</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {pack.queryCluster.map((query) => (
                      <Badge key={query} variant="outline">
                        {query}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="font-medium">Recommended structure</p>
                  <ul className="mt-2 space-y-2 text-muted-foreground">
                    {pack.recommendedStructure.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="font-medium">Source summaries</p>
                  <div className="mt-2 space-y-3">
                    {pack.sourceSummaries.map((source) => (
                      <div key={source.url} className="rounded-lg border p-3">
                        <p className="font-medium">{source.title}</p>
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 block text-xs text-sky-600 hover:underline"
                        >
                          {source.url}
                        </a>
                        <p className="mt-2 text-muted-foreground">{source.summary}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          <div className="rounded-xl border p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Row metadata
            </p>
            <dl className="mt-3 grid gap-3">
              {orderedFields.map(([key, value]) => (
                <div key={key} className="rounded-lg border p-3">
                  <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    {key.replaceAll("_", " ")}
                  </dt>
                  <dd className="mt-1 text-sm text-foreground">
                    {Array.isArray(value) ? value.join(", ") : String(value)}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
