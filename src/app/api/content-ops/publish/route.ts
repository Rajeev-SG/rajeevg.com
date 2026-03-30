import { randomUUID } from "node:crypto"

import { revalidatePath } from "next/cache"
import { NextResponse } from "next/server"

import { getDashboardAccess } from "@/lib/content-ops/auth"
import { getContentOpsAsset, getContentOpsCapabilities } from "@/lib/content-ops/data"
import type { EditorFrontmatter } from "@/lib/content-ops/types"
import { buildEditorDocumentFromDraft } from "@/lib/content-ops/editor"
import { publishEditorDocument } from "@/lib/content-ops/publishing"
import { tryUpdateContentOpsState } from "@/lib/content-ops/state-store"

export async function POST(request: Request) {
  const access = await getDashboardAccess()
  if (access.status !== "authorized") {
    return NextResponse.json({ error: access.reason }, { status: access.status === "signed_out" ? 401 : 403 })
  }

  const capabilities = getContentOpsCapabilities()
  if (!capabilities.publishEnabled) {
    return NextResponse.json({ error: capabilities.reason || "Publishing is disabled." }, { status: 503 })
  }

  const body = (await request.json()) as {
    assetId?: string
    frontmatter?: EditorFrontmatter
    markdown?: string
    sourcePath?: string
  }

  if (!body.assetId || !body.frontmatter || typeof body.markdown !== "string") {
    return NextResponse.json({ error: "assetId, frontmatter, and markdown are required" }, { status: 400 })
  }

  const markdown = body.markdown

  const detail = await getContentOpsAsset(body.assetId)
  if (!detail) {
    return NextResponse.json({ error: "Unknown content asset" }, { status: 404 })
  }

  const draftDocument = buildEditorDocumentFromDraft({
    frontmatter: body.frontmatter,
    body: markdown,
    sourcePath: body.sourcePath || detail.asset.sourcePath || undefined,
  })
  const normalizedFrontmatter = draftDocument.frontmatter

  if (!draftDocument.richModeSafe && draftDocument.unsupportedPatterns.some((pattern) => pattern.startsWith("Unknown JSX components:"))) {
    return NextResponse.json(
      {
        error: draftDocument.unsupportedPatterns.find((pattern) => pattern.startsWith("Unknown JSX components:")),
      },
      { status: 400 }
    )
  }

  try {
    const published = await publishEditorDocument({
      frontmatter: {
        ...normalizedFrontmatter,
        draft: false,
      },
      body: markdown,
      sourcePath: body.sourcePath || detail.asset.sourcePath || undefined,
    })

    revalidatePath("/")
    revalidatePath("/blog")
    revalidatePath(`/blog/${normalizedFrontmatter.slug}`)
    revalidatePath("/dashboard")
    revalidatePath(`/dashboard/editor/${body.assetId}`)

    const stateUpdate = await tryUpdateContentOpsState((state) => ({
      ...state,
      workflow: {
        ...state.workflow,
        [body.assetId!]: published.workflowStatus,
      },
      drafts: {
        ...state.drafts,
        [body.assetId!]: {
          assetId: body.assetId!,
          slug: normalizedFrontmatter.slug,
          path: published.articlePath,
          updatedAt: new Date().toISOString(),
        },
      },
      draftDocuments: {
        ...state.draftDocuments,
        [body.assetId!]: {
          assetId: body.assetId!,
          slug: normalizedFrontmatter.slug,
          articlePath: published.articlePath,
          sourcePath: body.sourcePath || detail.asset.sourcePath || undefined,
          frontmatter: {
            ...normalizedFrontmatter,
            draft: false,
          },
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
            type: "publish_requested",
            status: "success",
            createdAt: new Date().toISOString(),
            message: "Publish action requested from the dashboard editor.",
            details: {
              articlePath: published.articlePath,
              publishMode: capabilities.publishMode,
            },
          },
          {
            ...published.event,
            id: published.event.id,
            assetId: body.assetId!,
          },
          {
            id: randomUUID(),
            assetId: body.assetId!,
            type: published.deliveryState === "local_runtime_live" ? "live" : "deploy_pending",
            status: "success",
            createdAt: new Date().toISOString(),
            message:
              published.deliveryState === "local_runtime_live"
                ? "The local runtime overlay can render the updated article immediately."
                : published.deliveryState === "deployed_live"
                  ? "The published article is now live on the deployed site."
                  : "GitHub publish succeeded and the repo is updated. Wait for deployment to complete before treating the page as live.",
            details: {
              articlePath: published.articlePath,
              deliveryState: published.deliveryState,
            },
          },
        ],
      },
    }))

    return NextResponse.json({
      published: {
        articlePath: published.articlePath,
        workflowStatus: published.workflowStatus,
        deliveryState: published.deliveryState,
      },
      warning: stateUpdate.ok ? null : stateUpdate.error.message,
    })
  } catch (error) {
    await tryUpdateContentOpsState((state) => ({
      ...state,
      publishEvents: {
        ...state.publishEvents,
        [body.assetId!]: [
          ...(state.publishEvents[body.assetId!] || []),
          {
            id: randomUUID(),
            assetId: body.assetId!,
            type: "failed",
            status: "failed",
            createdAt: new Date().toISOString(),
            message: error instanceof Error ? error.message : "Publishing failed",
          },
        ],
      },
    }))

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Publishing failed",
      },
      { status: 500 }
    )
  }
}
