import "server-only"

import { readFileSync } from "node:fs"
import { createSign } from "node:crypto"

import { getHackathonBigQueryProjectId } from "@/lib/hackathon-bigquery"

const ADMIN_API_BASE = "https://analyticsadmin.googleapis.com/v1alpha"
const DEFAULT_CREDENTIALS_PATH = "/Users/rajeev/.codex/auth/google/ga4-mcp-personal-gws-1.json"

type ServiceAccountCredentials = {
  client_email: string
  private_key: string
}

export type HackathonBigQueryLinkSummary = {
  name: string
  project: string
  createTime: string
  dailyExportEnabled: boolean
  streamingExportEnabled: boolean
  exportStreams: string[]
  excludedEvents: string[]
  datasetLocation: string
}

function cleanEnvValue(value: string | undefined) {
  return value?.trim()
}

function getCredentialsPath() {
  return (
    cleanEnvValue(process.env.GA4_SERVICE_ACCOUNT_PATH) ||
    cleanEnvValue(process.env.GOOGLE_APPLICATION_CREDENTIALS) ||
    DEFAULT_CREDENTIALS_PATH
  )
}

function getInlineCredentials() {
  const raw =
    cleanEnvValue(process.env.GA4_SERVICE_ACCOUNT_JSON) ||
    cleanEnvValue(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON)

  if (!raw) return null
  return JSON.parse(raw) as ServiceAccountCredentials
}

function getServiceAccountCredentials() {
  return getInlineCredentials() ?? (JSON.parse(readFileSync(getCredentialsPath(), "utf8")) as ServiceAccountCredentials)
}

async function getAdminAccessToken() {
  const credentials = getServiceAccountCredentials()
  const now = Math.floor(Date.now() / 1000)
  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString("base64url")
  const unsignedToken = `${encode({ alg: "RS256", typ: "JWT" })}.${encode({
    iss: credentials.client_email,
    scope: "https://www.googleapis.com/auth/analytics.readonly",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  })}`
  const signer = createSign("RSA-SHA256")
  signer.update(unsignedToken)
  signer.end()
  const assertion = `${unsignedToken}.${signer.sign(credentials.private_key).toString("base64url")}`

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
    cache: "no-store",
  })

  if (!response.ok) {
    throw new Error(`Admin token request returned ${response.status} ${response.statusText}`)
  }

  const payload = (await response.json()) as { access_token?: string }
  if (!payload.access_token) {
    throw new Error("Admin token response did not contain an access token")
  }

  return payload.access_token
}

export async function getHackathonBigQueryLinkSummary(propertyId: string) {
  const token = await getAdminAccessToken()
  const response = await fetch(`${ADMIN_API_BASE}/properties/${propertyId}/bigQueryLinks`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  })

  if (!response.ok) {
    throw new Error(`Admin BigQuery link request returned ${response.status} ${response.statusText}`)
  }

  const payload = (await response.json()) as {
    bigqueryLinks?: Array<{
      name?: string
      project?: string
      createTime?: string
      dailyExportEnabled?: boolean
      streamingExportEnabled?: boolean
      exportStreams?: string[]
      excludedEvents?: string[]
      datasetLocation?: string
    }>
  }

  const expectedProject = `projects/${getHackathonBigQueryProjectId()}`
  const match = payload.bigqueryLinks?.find((link) => link.project === expectedProject) ?? payload.bigqueryLinks?.[0]

  if (!match?.name || !match.project || !match.createTime || !match.datasetLocation) {
    throw new Error("Admin BigQuery link response did not contain a complete link record")
  }

  return {
    name: match.name,
    project: match.project,
    createTime: match.createTime,
    dailyExportEnabled: Boolean(match.dailyExportEnabled),
    streamingExportEnabled: Boolean(match.streamingExportEnabled),
    exportStreams: match.exportStreams ?? [],
    excludedEvents: match.excludedEvents ?? [],
    datasetLocation: match.datasetLocation,
  } satisfies HackathonBigQueryLinkSummary
}
