import { NextResponse } from "next/server"

import { getDashboardAccess } from "@/lib/content-ops/auth"
import { compilePreviewMdx } from "@/lib/content-ops/preview"
import { validateAllowedMdxComponents } from "@/lib/content-ops/component-registry"

export async function POST(request: Request) {
  const access = await getDashboardAccess()
  if (access.status !== "authorized") {
    return NextResponse.json({ error: access.reason }, { status: access.status === "signed_out" ? 401 : 403 })
  }

  const body = (await request.json()) as { markdown?: string }
  if (typeof body.markdown !== "string") {
    return NextResponse.json({ error: "markdown is required" }, { status: 400 })
  }

  const validation = validateAllowedMdxComponents(body.markdown)
  if (!validation.valid) {
    return NextResponse.json(
      { error: `Unsupported JSX components: ${validation.unknown.join(", ")}` },
      { status: 400 }
    )
  }

  try {
    const code = await compilePreviewMdx(body.markdown)
    return NextResponse.json({ code, validation })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Preview compilation failed",
      },
      { status: 400 }
    )
  }
}
