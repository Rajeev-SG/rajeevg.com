import { NextResponse } from "next/server"

import { getContentOpsCapabilities } from "@/lib/content-ops/data"
import { saveDraftDocument } from "@/lib/content-ops/editor"
import { updateContentOpsState } from "@/lib/content-ops/state-store"

export async function POST(request: Request) {
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

  const capabilities = getContentOpsCapabilities()
  if (!capabilities.draftFileEditingEnabled) {
    return NextResponse.json({ error: capabilities.reason || "Draft file editing is disabled in this environment." }, { status: 503 })
  }

  const result = await saveDraftDocument({
    slug: body.slug,
    title: body.title,
    date: body.date,
    updated: body.updated,
    description: body.description,
    excerpt: body.excerpt,
    tags: body.tags || [],
    draft: body.draft ?? true,
    image: body.image,
    body: body.body,
    sourcePath: body.sourcePath,
  })

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
  }))

  return NextResponse.json({ draft: result })
}
