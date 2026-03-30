"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Save, ShieldCheck, Sparkles, Upload, WandSparkles } from "lucide-react"

import { ContentMdxEditor } from "@/components/content-ops/mdx-editor"
import { PreviewRenderer } from "@/components/content-ops/preview-renderer"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type {
  ContentAssetUpload,
  ContentEditorDraft,
  ContentInventoryRecord,
  ContentOpsCapabilities,
  EditorFrontmatter,
  PublishEvent,
  ResearchPack,
} from "@/lib/content-ops/types"
import type { ContentAssistAction } from "@/lib/content-ops/assistant"

type EditorShellProps = {
  asset: ContentInventoryRecord
  initialFrontmatter: EditorFrontmatter
  initialBody: string
  baselineBody: string
  sourcePath?: string
  richModeSafe: boolean
  unsupportedPatterns: string[]
  researchPack: ResearchPack | null
  draftDocument: ContentEditorDraft | null
  publishEvents: PublishEvent[]
  uploads: ContentAssetUpload[]
  capabilities: ContentOpsCapabilities
  sourceAccessNote: string | null
}

const AI_ACTIONS: Array<{ action: ContentAssistAction; label: string; apply: "replace" | "append" | "insert-top" }> = [
  { action: "generate-draft", label: "Generate first draft", apply: "replace" },
  { action: "improve-intro", label: "Improve intro", apply: "insert-top" },
  { action: "improve-conclusion", label: "Add conclusion", apply: "append" },
  { action: "add-faq", label: "Add FAQ", apply: "append" },
  { action: "add-comparison-table", label: "Add comparison table", apply: "append" },
  { action: "tighten-copy", label: "Tighten draft", apply: "replace" },
]

function normalizeTags(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value
  if (!value) return []
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
}

function applyAssistantMarkdown(currentBody: string, nextMarkdown: string, mode: "replace" | "append" | "insert-top") {
  if (mode === "replace") return nextMarkdown.trim()
  if (mode === "insert-top") return `${nextMarkdown.trim()}\n\n${currentBody.trim()}`.trim()
  return `${currentBody.trim()}\n\n${nextMarkdown.trim()}`.trim()
}

export function EditorShell({
  asset,
  initialFrontmatter,
  initialBody,
  baselineBody,
  sourcePath,
  richModeSafe,
  unsupportedPatterns,
  researchPack,
  draftDocument,
  publishEvents,
  uploads,
  capabilities,
  sourceAccessNote,
}: EditorShellProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [previewPending, startPreviewTransition] = useTransition()
  const [activeTab, setActiveTab] = useState("editor")
  const [body, setBody] = useState(initialBody)
  const [pack, setPack] = useState(researchPack)
  const [previewCode, setPreviewCode] = useState<string | null>(null)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [assistantResult, setAssistantResult] = useState<{ title: string; markdown: string; apply: "replace" | "append" | "insert-top" } | null>(null)
  const [frontmatter, setFrontmatter] = useState<EditorFrontmatter>(initialFrontmatter)
  const requiresRawEditing = unsupportedPatterns.some(
    (pattern) => pattern === "MDX imports" || pattern === "MDX exports"
  )

  const publishStateLabel = useMemo(() => {
    if (capabilities.publishMode === "github_contents") return "Repo-backed publish via GitHub"
    if (sourcePath) return "Repo-backed MDX"
    return "Draft starter"
  }, [capabilities.publishMode, sourcePath])

  const saveDraft = () => {
    startTransition(async () => {
      const response = await fetch("/api/content-ops/editor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assetId: asset.id,
          sourcePath,
          frontmatter,
          slug: frontmatter.slug,
          title: frontmatter.title,
          date: frontmatter.date,
          updated: frontmatter.updated || undefined,
          description: frontmatter.description || undefined,
          excerpt: frontmatter.excerpt || undefined,
          image: frontmatter.image || undefined,
          draft: frontmatter.draft,
          tags: frontmatter.tags,
          body,
        }),
      })

      if (response.ok) {
        router.refresh()
        return
      }

      const result = await response.json().catch(() => null)
      setPreviewError(result?.error || "Draft save failed.")
    })
  }

  const publishDocument = () => {
    startTransition(async () => {
      const response = await fetch("/api/content-ops/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assetId: asset.id,
          sourcePath,
          frontmatter,
          markdown: body,
        }),
      })

      if (response.ok) {
        router.refresh()
        return
      }

      const result = await response.json().catch(() => null)
      setPreviewError(result?.error || "Publish failed.")
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

  const requestPreview = () => {
    startPreviewTransition(async () => {
      setPreviewError(null)
      const response = await fetch("/api/content-ops/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markdown: body }),
      })

      const result = await response.json().catch(() => null)

      if (response.ok) {
        setPreviewCode(result.code)
      } else {
        setPreviewError(result?.error || "Preview compilation failed.")
      }
    })
  }

  const runAssistant = (action: ContentAssistAction, applyMode: "replace" | "append" | "insert-top") => {
    startTransition(async () => {
      const response = await fetch("/api/content-ops/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assetId: asset.id,
          action,
          frontmatter,
          markdown: body,
        }),
      })

      if (!response.ok) return
      const result = await response.json()
      if (!result.result?.markdown) return
      setAssistantResult({
        title: result.result.title || action,
        markdown: result.result.markdown,
        apply: applyMode,
      })
    })
  }

  const uploadAsset = (file: File) => {
    startTransition(async () => {
      const formData = new FormData()
      formData.append("assetId", asset.id)
      formData.append("file", file)

      const response = await fetch("/api/content-ops/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const result = await response.json().catch(() => null)
        setPreviewError(result?.error || "Upload failed.")
        return
      }

      const result = await response.json()
      if (result.upload?.url) {
        setBody((current) => `${current.trim()}\n\n![${result.upload.filename}](${result.upload.url})\n`)
        router.refresh()
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{asset.pageClass}</Badge>
              <Badge variant="outline">{publishStateLabel}</Badge>
              <Badge variant="outline">{asset.workflowStatus}</Badge>
              <Badge variant="outline">{asset.cluster}</Badge>
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
              placeholder="Article title"
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
              value={frontmatter.updated || ""}
              onChange={(event) => setFrontmatter((current) => ({ ...current, updated: event.target.value || undefined }))}
            />
            <Input
              value={frontmatter.tags.join(", ")}
              onChange={(event) =>
                setFrontmatter((current) => ({ ...current, tags: normalizeTags(event.target.value) }))
              }
              placeholder="tag-1, tag-2"
            />
            <Input
              value={frontmatter.image || ""}
              onChange={(event) => setFrontmatter((current) => ({ ...current, image: event.target.value || undefined }))}
              placeholder="/images/..."
            />
            <div className="md:col-span-2">
              <Textarea
                value={frontmatter.description || ""}
                onChange={(event) =>
                  setFrontmatter((current) => ({ ...current, description: event.target.value || undefined }))
                }
                placeholder="Description"
              />
            </div>
            <div className="md:col-span-2">
              <Textarea
                value={frontmatter.excerpt || ""}
                onChange={(event) =>
                  setFrontmatter((current) => ({ ...current, excerpt: event.target.value || undefined }))
                }
                placeholder="Excerpt"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Workflow and publishing</CardTitle>
            <CardDescription>
              Drafts persist durably. Publication writes the canonical MDX source to the repo path that the live site
              builds from.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {sourceAccessNote ? (
              <Alert>
                <AlertDescription>{sourceAccessNote}</AlertDescription>
              </Alert>
            ) : null}
            {capabilities.reason ? (
              <Alert>
                <AlertDescription>{capabilities.reason}</AlertDescription>
              </Alert>
            ) : null}
            {!richModeSafe && unsupportedPatterns.length ? (
              <Alert>
                <AlertDescription>
                  This document has advanced MDX features. Rich editing stays available where possible, but use the raw
                  tab for exact source edits.
                </AlertDescription>
              </Alert>
            ) : null}
            <Button className="w-full justify-start" onClick={saveDraft} disabled={pending || !capabilities.draftPersistenceEnabled}>
              {pending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}
              Save draft
            </Button>
            <Button
              className="w-full justify-start"
              variant="outline"
              onClick={requestResearch}
              disabled={pending || !capabilities.workflowWritesEnabled}
            >
              <Sparkles className="mr-2 size-4" />
              Generate research pack
            </Button>
            <Button
              className="w-full justify-start"
              variant="outline"
              onClick={publishDocument}
              disabled={pending || !capabilities.publishEnabled}
            >
              <ShieldCheck className="mr-2 size-4" />
              Publish or republish
            </Button>
            <div className="rounded-xl border p-3 text-sm text-muted-foreground">
              Canonical article path: {draftDocument?.articlePath || sourcePath || `content/posts/${frontmatter.slug}.mdx`}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <Card>
          <CardHeader>
            <CardTitle>Editorial workspace</CardTitle>
            <CardDescription>
              MDXEditor is the primary editor because it edits markdown and MDX directly instead of round-tripping
              through HTML. The raw tab stays available for exact source control.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div
                role="tablist"
                aria-label="Editorial workspace views"
                className="inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground"
              >
                {[
                  { value: "editor", label: "Editor" },
                  { value: "preview", label: "Preview" },
                  { value: "raw", label: "Raw MDX" },
                ].map((tab) => (
                  <Button
                    key={tab.value}
                    type="button"
                    role="tab"
                    size="sm"
                    variant={activeTab === tab.value ? "secondary" : "ghost"}
                    aria-selected={activeTab === tab.value}
                    aria-controls={`editor-panel-${tab.value}`}
                    className="h-7 px-3"
                    onClick={() => {
                      setActiveTab(tab.value)
                      if (tab.value === "preview" && !previewCode) requestPreview()
                    }}
                  >
                    {tab.label}
                  </Button>
                ))}
              </div>
              {activeTab === "editor" ? (
                <div id="editor-panel-editor" role="tabpanel" aria-label="Editor" className="space-y-4">
                {requiresRawEditing ? (
                  <Alert>
                    <AlertDescription>
                      This document contains MDX import or export syntax, so exact source editing is the safe path for
                      this draft.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <ContentMdxEditor value={body} onChange={setBody} diffMarkdown={baselineBody} />
                )}
                </div>
              ) : null}
              {activeTab === "preview" ? (
                <div id="editor-panel-preview" role="tabpanel" aria-label="Preview" className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-muted-foreground">
                    Preview uses the same MDX component mapping as the published article route.
                  </p>
                  <Button variant="outline" size="sm" onClick={requestPreview} disabled={previewPending}>
                    {previewPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                    Refresh preview
                  </Button>
                </div>
                {previewError ? (
                  <Alert>
                    <AlertDescription>{previewError}</AlertDescription>
                  </Alert>
                ) : null}
                {previewCode ? (
                  <PreviewRenderer code={previewCode} />
                ) : (
                  <Alert>
                    <AlertDescription>Generate a preview to validate MDX serialization and component rendering.</AlertDescription>
                  </Alert>
                )}
                </div>
              ) : null}
              {activeTab === "raw" ? (
                <div id="editor-panel-raw" role="tabpanel" aria-label="Raw MDX">
                <Textarea
                  aria-label="Raw MDX source"
                  className="min-h-[520px] font-mono text-sm"
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                />
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>AI assist</CardTitle>
              <CardDescription>
                Explicit editorial actions only. Nothing mutates the draft until you apply the result.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {AI_ACTIONS.map((item) => (
                  <Button
                    key={item.action}
                    size="sm"
                    variant="outline"
                    onClick={() => runAssistant(item.action, item.apply)}
                    disabled={pending}
                  >
                    <WandSparkles className="mr-2 size-4" />
                    {item.label}
                  </Button>
                ))}
              </div>
              {assistantResult ? (
                <div className="space-y-3 rounded-xl border p-3">
                  <p className="text-sm font-medium">{assistantResult.title}</p>
                  <Textarea readOnly className="min-h-[220px] font-mono text-sm" value={assistantResult.markdown} />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      onClick={() =>
                        setBody((current) =>
                          applyAssistantMarkdown(current, assistantResult.markdown, assistantResult.apply)
                        )
                      }
                    >
                      Apply to draft
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setAssistantResult(null)}>
                      Dismiss
                    </Button>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Research pack</CardTitle>
              <CardDescription>Keep strategy inputs, query clusters, risks, and link opportunities alongside the draft.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {pack ? (
                <>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Query cluster</p>
                    <p className="mt-2 text-sm text-muted-foreground">{pack.queryCluster.join(" • ")}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Recommended structure</p>
                    <ul className="mt-2 list-disc space-y-2 pl-4 text-sm text-muted-foreground">
                      {pack.recommendedStructure.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Internal links</p>
                    <ul className="mt-2 list-disc space-y-2 pl-4 text-sm text-muted-foreground">
                      {pack.recommendedInternalLinks.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </>
              ) : (
                <Alert>
                  <AlertDescription>Generate a research pack to bring SEO and internal-link guidance into the editor.</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Uploads and release history</CardTitle>
              <CardDescription>
                Media uploads go to durable object storage when configured. Publish events stay attached to the same content asset.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Input
                  type="file"
                  disabled={!capabilities.uploadEnabled || pending}
                  onChange={(event) => {
                    const file = event.target.files?.[0]
                    if (file) uploadAsset(file)
                  }}
                />
                <Button type="button" variant="outline" disabled={!capabilities.uploadEnabled || pending}>
                  <Upload className="mr-2 size-4" />
                  Upload
                </Button>
              </div>
              {uploads.length ? (
                <div className="space-y-2">
                  {uploads.slice().reverse().map((upload) => (
                    <div key={upload.id} className="rounded-xl border p-3 text-sm">
                      <p className="font-medium">{upload.filename}</p>
                      <p className="text-muted-foreground">{upload.url}</p>
                    </div>
                  ))}
                </div>
              ) : null}
              <div className="space-y-2">
                {publishEvents.length ? (
                  publishEvents
                    .slice()
                    .reverse()
                    .map((event) => (
                      <div key={event.id} className="rounded-xl border p-3 text-sm">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-medium">{event.message}</p>
                          <Badge variant={event.status === "failed" ? "destructive" : "outline"}>{event.type}</Badge>
                        </div>
                        <p className="mt-1 text-muted-foreground">{new Date(event.createdAt).toLocaleString()}</p>
                      </div>
                    ))
                ) : (
                  <Alert>
                    <AlertDescription>No release events yet. Save a draft or publish to start the timeline.</AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
