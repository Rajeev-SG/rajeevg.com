import { notFound } from "next/navigation"

import { EditorShell } from "@/components/content-ops/editor-shell"
import { loadEditorDocument } from "@/lib/content-ops/editor"
import { getContentOpsAsset } from "@/lib/content-ops/data"

function buildStarterBody(title: string, notes: string, nextSteps: string[]) {
  return `## Why this page exists\n\n${notes}\n\n## What the reader needs to understand\n\n- \n- \n- \n\n## Recommended next steps\n\n${nextSteps.map((step) => `- ${step}`).join("\n")}\n`
}

export default async function ContentEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const detail = await getContentOpsAsset(id)

  if (!detail) return notFound()

  let sourcePath = detail.draft?.path
  let initialFrontmatter: Record<string, unknown> = {
    title: detail.asset.title,
    slug: detail.asset.url.split("/").filter(Boolean).pop() || detail.asset.id.toLowerCase(),
    date: new Date().toISOString().slice(0, 10),
    draft: true,
    tags: detail.asset.tags,
    description: detail.asset.notes,
    excerpt: detail.asset.notes,
  }
  let initialBody = buildStarterBody(detail.asset.title, detail.asset.notes, detail.asset.nextSteps)
  let richModeSafe = true
  let unsupportedPatterns: string[] = []

  const editablePath = detail.asset.sourcePath || detail.draft?.path

  if (editablePath) {
    const document = await loadEditorDocument(editablePath)
    sourcePath = editablePath
    initialFrontmatter = document.frontmatter
    initialBody = document.body
    richModeSafe = document.richModeSafe
    unsupportedPatterns = document.unsupportedPatterns
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
        sourcePath={sourcePath}
        richModeSafe={richModeSafe}
        unsupportedPatterns={unsupportedPatterns}
        researchPack={detail.researchPack}
      />
    </section>
  )
}
