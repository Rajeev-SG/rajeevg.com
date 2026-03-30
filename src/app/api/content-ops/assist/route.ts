import { NextResponse } from "next/server"

import { generateContentAssist, type ContentAssistAction } from "@/lib/content-ops/assistant"
import { getDashboardAccess } from "@/lib/content-ops/auth"
import { getContentOpsAsset } from "@/lib/content-ops/data"
import type { EditorFrontmatter } from "@/lib/content-ops/types"

export async function POST(request: Request) {
  const access = await getDashboardAccess()
  if (access.status !== "authorized") {
    return NextResponse.json({ error: access.reason }, { status: access.status === "signed_out" ? 401 : 403 })
  }

  const body = (await request.json()) as {
    assetId?: string
    action?: ContentAssistAction
    frontmatter?: EditorFrontmatter
    markdown?: string
  }

  if (!body.assetId || !body.action || !body.frontmatter || typeof body.markdown !== "string") {
    return NextResponse.json(
      { error: "assetId, action, frontmatter, and markdown are required" },
      { status: 400 }
    )
  }

  const detail = await getContentOpsAsset(body.assetId)
  if (!detail) {
    return NextResponse.json({ error: "Unknown content asset" }, { status: 404 })
  }

  const result = await generateContentAssist({
    action: body.action,
    asset: detail.asset,
    frontmatter: body.frontmatter,
    researchPack: detail.researchPack,
    body: body.markdown,
  })

  return NextResponse.json({ result })
}
