import "server-only"

import { google } from "googleapis"

import type { ContentOpsMetrics } from "@/lib/content-ops/types"

const SEARCH_CONSOLE_SCOPE = "https://www.googleapis.com/auth/webmasters.readonly"
const DEFAULT_SITE_URL = "sc-domain:rajeevg.com"
const DEFAULT_DAYS = 28
const MAX_DAYS = 16 * 30 // GSC UI/API retains ~16 months of data
const MAX_ROWS = 250

export type SearchConsoleDimension = "page" | "query" | "country" | "device"

export type SearchConsoleStatus =
  | { state: "not_configured"; reason: "missing_credentials" | "missing_site_url" }
  | { state: "ready" }

export type SearchConsolePeriodRow = {
  key: string
  clicks: number
  impressions: number
  ctr: number
  averagePosition: number
}

export type SearchConsolePeriodResult = {
  status: SearchConsoleStatus
  siteUrl: string
  startDate: string
  endDate: string
  rows: SearchConsolePeriodRow[]
  error?: string
}

function isoDaysAgo(days: number) {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

function clampRange(days: number) {
  return Math.min(Math.max(Math.round(days), 1), MAX_DAYS)
}

/**
 * Resolve the service-account credentials for Search Console.
 *
 * Reuses the existing GA4 service-account JSON when dedicated GSC env vars are
 * absent so production needs at most one Google service-account secret.
 */
export function resolveSearchConsoleCredentials(): {
  clientEmail: string
  privateKey: string
  source: "gsc" | "ga4"
} | null {
  const gscEmail = process.env.GSC_CLIENT_EMAIL?.trim()
  const gscKey = process.env.GSC_PRIVATE_KEY?.replace(/\\n/g, "\n")
  if (gscEmail && gscKey) {
    return { clientEmail: gscEmail, privateKey: gscKey, source: "gsc" }
  }

  const inlineJson =
    process.env.GA4_SERVICE_ACCOUNT_JSON?.trim() ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON?.trim()
  if (inlineJson) {
    try {
      const parsed = JSON.parse(inlineJson) as { client_email?: string; private_key?: string }
      if (parsed.client_email && parsed.private_key) {
        return {
          clientEmail: parsed.client_email,
          privateKey: parsed.private_key.replace(/\\n/g, "\n"),
          source: "ga4",
        }
      }
    } catch {
      return null
    }
  }

  return null
}

export function getSearchConsoleStatus(): SearchConsoleStatus {
  const creds = resolveSearchConsoleCredentials()
  if (!creds) return { state: "not_configured", reason: "missing_credentials" }
  if (!process.env.GSC_SITE_URL?.trim() && !DEFAULT_SITE_URL) {
    return { state: "not_configured", reason: "missing_site_url" }
  }
  return { state: "ready" }
}

function getAuth() {
  const creds = resolveSearchConsoleCredentials()
  if (!creds) return null
  return new google.auth.JWT({
    email: creds.clientEmail,
    key: creds.privateKey,
    scopes: [SEARCH_CONSOLE_SCOPE],
  })
}

/**
 * Run a privacy-safe Search Analytics query. Only aggregate counts are
 * returned; raw query strings are never logged or persisted by this module.
 */
export async function getSearchConsolePeriodMetrics(
  options: {
    days?: number
    endDate?: string
    dimension?: SearchConsoleDimension
    rowLimit?: number
    filters?: { dimension: SearchConsoleDimension; value: string }[]
  } = {}
): Promise<SearchConsolePeriodResult> {
  const status = getSearchConsoleStatus()
  if (status.state === "not_configured") {
    return {
      status,
      siteUrl: getSiteUrl(),
      startDate: isoDaysAgo(clampRange(options.days ?? DEFAULT_DAYS)),
      endDate: options.endDate ?? isoDaysAgo(0),
      rows: [],
    }
  }

  const auth = getAuth()
  if (!auth) {
    return {
      status: { state: "not_configured", reason: "missing_credentials" },
      siteUrl: getSiteUrl(),
      startDate: isoDaysAgo(clampRange(options.days ?? DEFAULT_DAYS)),
      endDate: options.endDate ?? isoDaysAgo(0),
      rows: [],
      error: "credentials unavailable",
    }
  }

  const dimension = options.dimension ?? "page"
  const days = clampRange(options.days ?? DEFAULT_DAYS)
  const endDate = options.endDate ?? isoDaysAgo(3) // GSC data typically lags ~3 days
  const start = new Date(endDate)
  start.setDate(start.getDate() - days)
  const startDate = start.toISOString().slice(0, 10)
  const siteUrl = getSiteUrl()

  const searchconsole = google.searchconsole({ version: "v1", auth })
  try {
    const response = await searchconsole.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate,
        endDate,
        dimensions: [dimension],
        rowLimit: Math.min(options.rowLimit ?? MAX_ROWS, MAX_ROWS),
        ...(options.filters?.length
          ? {
              dimensionFilterGroups: [
                {
                  filters: options.filters.map((f) => ({
                    dimension: f.dimension,
                    expression: f.value,
                  })),
                },
              ],
            }
          : {}),
      },
    })

    const rows = (response.data.rows ?? []).map((row) => ({
      key: row.keys?.[0] ?? "",
      clicks: row.clicks ?? 0,
      impressions: row.impressions ?? 0,
      ctr: row.ctr ?? 0,
      averagePosition: row.position ?? 0,
    }))

    return { status: { state: "ready" }, siteUrl, startDate, endDate, rows }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    // Never include request payloads in the error surfaced to callers.
    return { status: { state: "ready" }, siteUrl, startDate, endDate, rows: [], error: message.slice(0, 200) }
  }
}

function getSiteUrl() {
  return process.env.GSC_SITE_URL?.trim() || DEFAULT_SITE_URL
}

/**
 * Operational dashboard view: last 28 days of per-page metrics keyed by page
 * path, matching the shape consumed by src/lib/content-ops/data.ts.
 */
export async function getSearchConsoleMetricsByPage(
  options: { days?: number } = {}
): Promise<Record<string, ContentOpsMetrics>> {
  const result = await getSearchConsolePeriodMetrics({ dimension: "page", days: options.days ?? DEFAULT_DAYS })
  if (result.error) return {}

  return Object.fromEntries(
    result.rows
      .filter((row) => row.key.startsWith("http"))
      .map((row) => {
        let path = row.key
        try {
          path = new URL(row.key).pathname
        } catch {
          // keep raw key when URL parsing fails
        }
        const metrics: ContentOpsMetrics = {
          clicks: row.clicks,
          impressions: row.impressions,
          ctr: row.ctr,
          averagePosition: row.averagePosition,
        }
        return [path, metrics]
      })
  )
}
