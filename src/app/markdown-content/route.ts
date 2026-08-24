import { NextRequest, NextResponse } from "next/server"

import { renderMarkdownPage } from "@/lib/markdown"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const pathname = request.headers.get("x-markdown-path")
  if (!pathname) {
    return new NextResponse("Not found", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    })
  }
  const result = await renderMarkdownPage(pathname)
  return new NextResponse(result.body, {
    status: result.status,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      Vary: "Accept",
    },
  })
}
