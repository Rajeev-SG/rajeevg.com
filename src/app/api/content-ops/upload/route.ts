import { randomUUID } from "node:crypto"

import { NextResponse } from "next/server"

import { getDashboardAccess } from "@/lib/content-ops/auth"
import { getContentOpsCapabilities } from "@/lib/content-ops/data"
import { uploadContentAsset } from "@/lib/content-ops/publishing"
import { updateContentOpsState } from "@/lib/content-ops/state-store"

export async function POST(request: Request) {
  const access = await getDashboardAccess()
  if (access.status !== "authorized") {
    return NextResponse.json({ error: access.reason }, { status: access.status === "signed_out" ? 401 : 403 })
  }

  const capabilities = getContentOpsCapabilities()
  if (!capabilities.uploadEnabled) {
    return NextResponse.json({ error: capabilities.reason || "Uploads are disabled." }, { status: 503 })
  }

  const formData = await request.formData()
  const assetId = formData.get("assetId")
  const file = formData.get("file")

  if (typeof assetId !== "string" || !(file instanceof File)) {
    return NextResponse.json({ error: "assetId and file are required" }, { status: 400 })
  }

  const upload = await uploadContentAsset({ assetId, file })

  await updateContentOpsState((state) => ({
    ...state,
    uploads: {
      ...state.uploads,
      [assetId]: [...(state.uploads[assetId] || []), upload],
    },
    publishEvents: {
      ...state.publishEvents,
      [assetId]: [
        ...(state.publishEvents[assetId] || []),
        {
          id: randomUUID(),
          assetId,
          type: "upload_added",
          status: "success",
          createdAt: new Date().toISOString(),
          message:
            upload.provider === "vercel_blob"
              ? "Uploaded asset to Vercel Blob."
              : "Saved asset into the local public uploads directory.",
          details: {
            url: upload.url,
            filename: upload.filename,
          },
        },
      ],
    },
  }))

  return NextResponse.json({ upload })
}
