import { promises as fs } from "node:fs"

import { NextResponse } from "next/server"

import { resolveLocalUploadPath } from "@/lib/content-ops/publishing"

function inferContentType(filename: string) {
  const extension = filename.split(".").pop()?.toLowerCase()

  switch (extension) {
    case "png":
      return "image/png"
    case "jpg":
    case "jpeg":
      return "image/jpeg"
    case "gif":
      return "image/gif"
    case "webp":
      return "image/webp"
    case "svg":
      return "image/svg+xml"
    case "txt":
      return "text/plain; charset=utf-8"
    case "md":
      return "text/markdown; charset=utf-8"
    case "json":
      return "application/json; charset=utf-8"
    default:
      return "application/octet-stream"
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ assetId: string; filename: string }> }
) {
  const { assetId, filename } = await params
  const filePath = resolveLocalUploadPath(assetId, filename)

  try {
    const file = await fs.readFile(filePath)
    return new NextResponse(file, {
      headers: {
        "Content-Type": inferContentType(filename),
        "Cache-Control": "public, max-age=60",
      },
    })
  } catch {
    return NextResponse.json({ error: "Upload not found" }, { status: 404 })
  }
}
