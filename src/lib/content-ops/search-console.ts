import "server-only"

import { google } from "googleapis"

import type { ContentOpsMetrics } from "@/lib/content-ops/types"

function getSearchConsoleAuth() {
  const clientEmail = process.env.GSC_CLIENT_EMAIL
  const privateKey = process.env.GSC_PRIVATE_KEY?.replace(/\\n/g, "\n")

  if (!clientEmail || !privateKey || !process.env.GSC_SITE_URL) {
    return null
  }

  return new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/webmasters.readonly"],
  })
}

export async function getSearchConsoleMetricsByPage() {
  const auth = getSearchConsoleAuth()
  if (!auth) return {} as Record<string, ContentOpsMetrics>

  const searchconsole = google.searchconsole({ version: "v1", auth })
  const siteUrl = process.env.GSC_SITE_URL as string
  const endDate = new Date()
  const startDate = new Date(endDate)
  startDate.setDate(endDate.getDate() - 28)

  const response = await searchconsole.searchanalytics.query({
    siteUrl,
    requestBody: {
      startDate: startDate.toISOString().slice(0, 10),
      endDate: endDate.toISOString().slice(0, 10),
      dimensions: ["page"],
      rowLimit: 250,
    },
  })

  const rows = response.data.rows ?? []

  return Object.fromEntries(
    rows.map((row) => [
      row.keys?.[0] ?? "",
      {
        clicks: row.clicks ?? undefined,
        impressions: row.impressions ?? undefined,
        ctr: row.ctr ?? undefined,
        averagePosition: row.position ?? undefined,
      } satisfies ContentOpsMetrics,
    ])
  )
}
