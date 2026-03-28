import { NextResponse } from "next/server"

import { createResearchPack } from "@/lib/content-ops/data"

export async function POST(request: Request) {
  const body = (await request.json()) as {
    assetId?: string
    provider?: "fallback" | "brave" | "openrouter" | "minimax"
  }

  if (!body.assetId) {
    return NextResponse.json({ error: "assetId is required" }, { status: 400 })
  }

  const pack = await createResearchPack(body.assetId, body.provider || "fallback")
  return NextResponse.json({ pack })
}
