"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Sparkles, Save, ShieldCheck } from "lucide-react"

import { TiptapEditor } from "@/components/content-ops/tiptap-editor"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import type { ContentInventoryRecord, ContentOpsCapabilities, ResearchPack } from "@/lib/content-ops/types"

type EditorShellProps = {
  asset: ContentInventoryRecord
  initialFrontmatter: Record<string, unknown>
  initialBody: string
  sourcePath?: string
  richModeSafe: boolean
  unsupportedPatterns: string[]
  researchPack: ResearchPack | null
  capabilities: ContentOpsCapabilities
  sourceAccessNote: string | null
}

function normalizeTags(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value
  if (!value) return []
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
}

export function EditorShell({
  asset,
  initialFrontmatter,
  initialBody,
  sourcePath,
  richModeSafe,
  unsupportedPatterns,
  researchPack,
  capabilities,
  sourceAccessNote,
}: EditorShellProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [mode, setMode] = useState(richModeSafe ? "rich" : "raw")
  const [body, setBody] = useState(initialBody)
  const [pack, setPack] = useState(researchPack)
  const [frontmatter, setFrontmatter] = useState({
    title: String(initialFrontmatter.title || asset.title),
    slug: String(initialFrontmatter.slug || asset.url.split("/").filter(Boolean).pop() || asset.id.toLowerCase()),
    date: String(initialFrontmatter.date || new Date().toISOString().slice(0, 10)),
    updated: String(initialFrontmatter.updated || ""),
    description: String(initialFrontmatter.description || asset.notes || ""),
    excerpt: String(initialFrontmatter.excerpt || asset.notes || ""),
    tags: normalizeTags(initialFrontmatter.tags as string[] | string | undefined).join(", "),
    image: String(initialFrontmatter.image || ""),
    draft: initialFrontmatter.draft !== false,
  })

  const publishStateLabel = useMemo(() => {
    if (sourcePath) return "Repo-backed MDX"
    return "Draft starter"
  }, [sourcePath])

  const saveDraft = () => {
    startTransition(async () => {
      const response = await fetch("/api/content-ops/editor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assetId: asset.id,
          sourcePath,
          slug: frontmatter.slug,
          title: frontmatter.title,
          date: frontmatter.date,
          updated: frontmatter.updated || undefined,
          description: frontmatter.description || undefined,
          excerpt: frontmatter.excerpt || undefined,
          image: frontmatter.image || undefined,
          draft: frontmatter.draft,
          tags: normalizeTags(frontmatter.tags),
          body,
        }),
      })

      if (response.ok) {
        router.refresh()
      }
    })
  }

  const requestResearch = () => {
    startTransition(async () => {
      const response = await fetch("/api/content-ops/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assetId: asset.id, provider: "fallback" }),
      })

      if (response.ok) {
        const result = await response.json()
        setPack(result.pack)
      }
    })
  }

  const markApproved = () => {
    startTransition(async () => {
      await fetch("/api/content-ops/workflow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assetId: asset.id, workflowStatus: "approved" }),
      })
      router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{asset.pageClass}</Badge>
              <Badge variant="outline">{publishStateLabel}</Badge>
              <Badge variant="outline">{asset.workflowStatus}</Badge>
            </div>
            <CardTitle className="text-3xl">{asset.title}</CardTitle>
            <CardDescription>
              {asset.pillar} / {asset.cluster}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Input
              value={frontmatter.title}
              onChange={(event) => setFrontmatter((current) => ({ ...current, title: event.target.value }))}
              placeholder="Title"
            />
            <Input
              value={frontmatter.slug}
              onChange={(event) => setFrontmatter((current) => ({ ...current, slug: event.target.value }))}
              placeholder="slug"
            />
            <Input
              type="date"
              value={frontmatter.date}
              onChange={(event) => setFrontmatter((current) => ({ ...current, date: event.target.value }))}
            />
            <Input
              type="date"
              value={frontmatter.updated}
              onChange={(event) => setFrontmatter((current) => ({ ...current, updated: event.target.value }))}
            />
            <Input
              value={frontmatter.tags}
              onChange={(event) => setFrontmatter((current) => ({ ...current, tags: event.target.value }))}
              placeholder="tag-1, tag-2"
            />
            <Input
              value={frontmatter.image}
              onChange={(event) => setFrontmatter((current) => ({ ...current, image: event.target.value }))}
              placeholder="/images/..."
            />
            <div className="md:col-span-2">
              <Textarea
                value={frontmatter.description}
                onChange={(event) =>
                  setFrontmatter((current) => ({ ...current, description: event.target.value }))
                }
                placeholder="Description"
              />
            </div>
            <div className="md:col-span-2">
              <Textarea
                value={frontmatter.excerpt}
                onChange={(event) => setFrontmatter((current) => ({ ...current, excerpt: event.target.value }))}
                placeholder="Excerpt"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Workflow and publishing</CardTitle>
            <CardDescription>
              Drafts stay repo-backed MDX. Production publishing should flow through GitHub and deploy status from this same asset ID.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {sourceAccessNote ? (
              <div className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-3 text-sm text-muted-foreground">
                {sourceAccessNote}
              </div>
            ) : null}
            {capabilities.reason ? (
              <div className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-3 text-sm text-muted-foreground">
                {capabilities.reason}
              </div>
            ) : null}
            <Button
              className="w-full justify-start"
              onClick={saveDraft}
              disabled={pending || !capabilities.draftFileEditingEnabled}
            >
              <Save className="mr-2 size-4" />
              Save draft
            </Button>
            <Button
              className="w-full justify-start"
              variant="outline"
              onClick={requestResearch}
              disabled={pending || !capabilities.workflowWritesEnabled}
            >
              <Sparkles className="mr-2 size-4" />
              Request SEO suggestions
            </Button>
            <Button
              className="w-full justify-start"
              variant="outline"
              onClick={markApproved}
              disabled={pending || !capabilities.workflowWritesEnabled}
            >
              <ShieldCheck className="mr-2 size-4" />
              Approve publication
            </Button>
            <div className="rounded-xl border p-3 text-sm text-muted-foreground">
              Publish status: repo draft saved to PR open to merged to deployed to live.
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <Card>
          <CardHeader>
            <CardTitle>Article editor</CardTitle>
            <CardDescription>
              Use rich mode for common authoring. Switch to raw mode when the file contains advanced MDX blocks or custom components.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={mode} onValueChange={setMode} className="space-y-4">
              <TabsList>
                <TabsTrigger value="rich">Rich editor</TabsTrigger>
                <TabsTrigger value="raw">Raw MDX</TabsTrigger>
              </TabsList>
              <TabsContent value="rich" className="space-y-4">
                {richModeSafe ? (
                  <TiptapEditor
                    value={body}
                    onChange={setBody}
                    placeholder="Use the research pack to turn this asset into a proof-backed article."
                  />
                ) : (
                  <Card className="border-amber-500/40 bg-amber-500/5">
                    <CardHeader>
                      <CardTitle className="text-lg">Rich mode locked for safety</CardTitle>
                      <CardDescription>
                        This source contains advanced MDX patterns that should stay in raw mode to avoid losing custom blocks or Mermaid diagrams.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm text-muted-foreground">
                      {unsupportedPatterns.map((pattern) => (
                        <div key={pattern}>{pattern}</div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
              <TabsContent value="raw">
                <Textarea
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  className="min-h-[520px] font-mono text-sm"
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Research pack</CardTitle>
              <CardDescription>
                Provider-backed when configured, otherwise synthesized locally from the workbook and current content graph.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              {pack ? (
                <>
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
                    <p className="font-medium">Suggested structure</p>
                    <ul className="mt-2 space-y-2 text-muted-foreground">
                      {pack.recommendedStructure.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium">Recommended internal links</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {pack.recommendedInternalLinks.map((link) => (
                        <Badge key={link} variant="secondary">
                          {link}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="rounded-xl border border-dashed p-4 text-muted-foreground">
                  Generate a research pack from the row sheet or from this editor to populate internal links, search angles, and proof-backed structure.
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Deployment timeline</CardTitle>
              <CardDescription>Shows how this asset is expected to move through GitHub and Vercel once wired to the repo workflow.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="rounded-xl border p-3">1. Draft saved in repo-compatible MDX.</div>
              <div className="rounded-xl border p-3">2. Workflow state moves to review and approval.</div>
              <div className="rounded-xl border p-3">3. GitHub branch / PR status attaches to the same asset record.</div>
              <div className="rounded-xl border p-3">4. Preview and production deployment status flow back into the dashboard.</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
