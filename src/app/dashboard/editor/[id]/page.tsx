import { notFound } from "next/navigation"

import { EditorShell } from "@/components/content-ops/editor-shell"
import { buildArticlePath, buildEditorDocumentFromDraft, loadEditorDocument } from "@/lib/content-ops/editor"
import { getContentOpsAsset } from "@/lib/content-ops/data"
import type { EditorFrontmatter } from "@/lib/content-ops/types"

function buildStarterBody(title: string, notes: string, nextSteps: string[]) {
  return `## Why this page exists\n\n${notes}\n\n## What the reader needs to understand\n\n- \n- \n- \n\n## Recommended next steps\n\n${nextSteps.map((step) => `- ${step}`).join("\n")}\n`
}

export default async function ContentEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const detail = await getContentOpsAsset(id)

  if (!detail) return notFound()

  let sourcePath = detail.draftDocument?.sourcePath || detail.asset.sourcePath || detail.draft?.path
  let initialFrontmatter: EditorFrontmatter = {
    title: detail.asset.title,
    slug: detail.asset.url.split("/").filter(Boolean).pop() || detail.asset.id.toLowerCase(),
    date: new Date().toISOString().slice(0, 10),
    draft: true,
    tags: detail.asset.tags,
    description: detail.asset.notes || undefined,
    excerpt: detail.asset.notes || undefined,
  }
  let initialBody = detail.draftDocument?.body || buildStarterBody(detail.asset.title, detail.asset.notes, detail.asset.nextSteps)
  let baselineBody = initialBody
  let richModeSafe = true
  let editingMode: "rich" | "raw_only" = "rich"
  let editingModeReason: string | null = null
  let unsupportedPatterns: string[] = []
  let sourceAccessNote: string | null = null

  if (detail.draftDocument) {
    initialFrontmatter = detail.draftDocument.frontmatter
    const draftDocument = buildEditorDocumentFromDraft({
      frontmatter: detail.draftDocument.frontmatter,
      body: detail.draftDocument.body,
      sourcePath: detail.draftDocument.sourcePath,
    })
    editingMode = draftDocument.editingMode
    editingModeReason = draftDocument.editingModeReason
    richModeSafe = draftDocument.richModeSafe
    unsupportedPatterns = draftDocument.unsupportedPatterns
  }

  const editablePath = detail.asset.sourcePath || detail.draft?.path || buildArticlePath(initialFrontmatter.slug, sourcePath)

  if (!detail.draftDocument && editablePath) {
    try {
      const document = await loadEditorDocument(editablePath)
      sourcePath = document.sourcePath || editablePath
      initialFrontmatter = document.frontmatter
      initialBody = document.body
      baselineBody = document.body
      editingMode = document.editingMode
      editingModeReason = document.editingModeReason
      richModeSafe = document.richModeSafe
      unsupportedPatterns = document.unsupportedPatterns
    } catch {
      sourceAccessNote =
        "This environment could not read the canonical MDX source directly, so the editor opened with the latest durable draft state instead."
    }
  }

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-[0.22em] text-muted-foreground">Content editor</p>
        <h1 className="text-3xl font-semibold tracking-tight">{detail.asset.title}</h1>
        <p className="max-w-3xl text-muted-foreground">
          Repo-backed MDX stays the publishing source of truth. The editor adds workflow state, research context, and safe rich-mode authoring where the source permits it.
        </p>
      </div>

      <EditorShell
        asset={detail.asset}
        initialFrontmatter={initialFrontmatter}
        initialBody={initialBody}
        baselineBody={baselineBody}
        sourcePath={sourcePath}
        derived={detail.derived}
        editingMode={editingMode}
        editingModeReason={editingModeReason}
        richModeSafe={richModeSafe}
        unsupportedPatterns={unsupportedPatterns}
        researchPack={detail.researchPack}
        draftDocument={detail.draftDocument}
        publishEvents={detail.publishEvents}
        uploads={detail.uploads}
        capabilities={detail.capabilities}
        sourceAccessNote={sourceAccessNote}
      />
    </section>
  )
}
