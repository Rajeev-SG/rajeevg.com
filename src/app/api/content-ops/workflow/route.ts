import { NextResponse } from "next/server"

import { markAssetDerived, saveAssetWorkflow } from "@/lib/content-ops/data"
import type { ContentWorkflowStatus } from "@/lib/content-ops/types"

export async function POST(request: Request) {
  const body = (await request.json()) as {
    assetId?: string
    action?: "queue" | "mark-derived" | "set-status"
    workflowStatus?: ContentWorkflowStatus
  }

  if (!body.assetId) {
    return NextResponse.json({ error: "assetId is required" }, { status: 400 })
  }

  if (body.action === "mark-derived") {
    const state = await markAssetDerived(body.assetId)
    return NextResponse.json({ state })
  }

  if (body.action === "queue") {
    const state = await saveAssetWorkflow(body.assetId, "queued")
    return NextResponse.json({ state })
  }

  if (body.workflowStatus) {
    const state = await saveAssetWorkflow(body.assetId, body.workflowStatus)
    return NextResponse.json({ state })
  }

  return NextResponse.json({ error: "No workflow action provided" }, { status: 400 })
}
