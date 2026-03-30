import { randomUUID } from "node:crypto"

import { NextResponse } from "next/server"

import { getDashboardAccess } from "@/lib/content-ops/auth"
import { getContentOpsCapabilities } from "@/lib/content-ops/data"
import { buildEditorDocumentFromDraft, saveDraftDocumentLocally } from "@/lib/content-ops/editor"
import { updateContentOpsState } from "@/lib/content-ops/state-store"
import type { EditorFrontmatter } from "@/lib/content-ops/types"

export async function POST(request: Request) {
  const access = await getDashboardAccess()
  if (access.status !== "authorized") {
    return NextResponse.json({ error: access.reason }, { status: access.status === "signed_out" ? 401 : 403 })
  }

  const body = (await request.json()) as {
    assetId?: string
    slug?: string
    title?: string
    date?: string
    updated?: string
    description?: string
    excerpt?: string
    tags?: string[]
    draft?: boolean
    image?: string
    body?: string
    sourcePath?: string
  }

  if (!body.assetId || !body.slug || !body.title || !body.date || !body.body) {
    return NextResponse.json({ error: "assetId, slug, title, date, and body are required" }, { status: 400 })
  }

  const markdown = body.body

  const capabilities = getContentOpsCapabilities()
  if (!capabilities.draftPersistenceEnabled) {
    return NextResponse.json(
      { error: capabilities.reason || "Draft persistence is disabled in this environment." },
      { status: 503 }
    )
  }

  const frontmatter: EditorFrontmatter = {
    slug: body.slug,
    title: body.title,
    date: body.date,
    updated: body.updated,
    description: body.description,
    excerpt: body.excerpt,
    tags: body.tags || [],
    draft: body.draft ?? true,
    image: body.image,
  }

  const draftDocument = buildEditorDocumentFromDraft({
    frontmatter,
    body: markdown,
    sourcePath: body.sourcePath,
  })

  if (!draftDocument.richModeSafe && draftDocument.unsupportedPatterns.some((pattern) => pattern.startsWith("Unknown JSX components:"))) {
    return NextResponse.json(
      {
        error: draftDocument.unsupportedPatterns.find((pattern) => pattern.startsWith("Unknown JSX components:")),
      },
      { status: 400 }
    )
  }

  let result = {
    path: body.sourcePath || draftDocument.articlePath,
    slug: frontmatter.slug,
    articlePath: draftDocument.articlePath,
  }

  if (capabilities.draftFileEditingEnabled) {
    const localResult = await saveDraftDocumentLocally({
      frontmatter,
      body: markdown,
      sourcePath: body.sourcePath,
    })

    result = {
      path: localResult.path,
      slug: localResult.slug,
      articlePath: localResult.articlePath,
    }
  }

  await updateContentOpsState((state) => ({
    ...state,
    workflow: {
      ...state.workflow,
      [body.assetId!]: "in_progress",
    },
    drafts: {
      ...state.drafts,
      [body.assetId!]: {
        assetId: body.assetId!,
        slug: result.slug,
        path: result.path,
        updatedAt: new Date().toISOString(),
      },
    },
    draftDocuments: {
      ...state.draftDocuments,
      [body.assetId!]: {
        assetId: body.assetId!,
        slug: result.slug,
        articlePath: result.articlePath,
        sourcePath: body.sourcePath,
        frontmatter,
        body: markdown.trim(),
        componentUsages: draftDocument.componentUsages,
        updatedAt: new Date().toISOString(),
      },
    },
    publishEvents: {
      ...state.publishEvents,
      [body.assetId!]: [
        ...(state.publishEvents[body.assetId!] || []),
        {
          id: randomUUID(),
          assetId: body.assetId!,
          type: "draft_saved",
          status: "success",
          createdAt: new Date().toISOString(),
          message: capabilities.draftFileEditingEnabled
            ? "Draft saved to repo-backed MDX in the local working tree."
            : "Draft saved to durable content-ops state.",
          details: {
            articlePath: result.articlePath,
            sourcePath: body.sourcePath || null,
          },
        },
      ],
    },
  }))

  return NextResponse.json({ draft: result, draftDocument })
}
