import { NextResponse } from "next/server"

import { getDashboardAccess } from "@/lib/content-ops/auth"
import { createResearchPack, getContentOpsCapabilities } from "@/lib/content-ops/data"

export async function POST(request: Request) {
  const access = await getDashboardAccess()
  if (access.status !== "authorized") {
    return NextResponse.json({ error: access.reason }, { status: access.status === "signed_out" ? 401 : 403 })
  }

  const body = (await request.json()) as {
    assetId?: string
    provider?: "fallback" | "brave" | "openrouter" | "minimax"
  }

  if (!body.assetId) {
    return NextResponse.json({ error: "assetId is required" }, { status: 400 })
  }

  const capabilities = getContentOpsCapabilities()
  if (!capabilities.workflowWritesEnabled) {
    return NextResponse.json({ error: capabilities.reason || "Workflow writes are disabled in this environment." }, { status: 503 })
  }

  const pack = await createResearchPack(body.assetId, body.provider || "fallback")
  return NextResponse.json({ pack })
}
