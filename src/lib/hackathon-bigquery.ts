import "server-only"

import { BigQuery } from "@google-cloud/bigquery"

export const DEFAULT_PROJECT_ID = "personal-gws-1"
export const DEFAULT_DATASET_ID = "hackathon_reporting"
const DEFAULT_CREDENTIALS_PATH = "/Users/rajeev/.codex/auth/google/ga4-mcp-personal-gws-1.json"

export const MODELED_TABLES = [
  "daily_overview",
  "event_breakdown",
  "entry_performance",
  "round_snapshots",
  "auth_funnel_daily",
  "voting_funnel_daily",
  "manager_operations_daily",
  "experience_overview_daily",
] as const

export type QueryableTable = (typeof MODELED_TABLES)[number]

type RowCountRow = {
  row_count: number | string
}

export function getHackathonBigQueryProjectId() {
  return process.env.BIGQUERY_PROJECT_ID || process.env.GOOGLE_PROJECT_ID || DEFAULT_PROJECT_ID
}

export function getHackathonBigQueryDatasetId() {
  return process.env.BIGQUERY_DATASET_ID || DEFAULT_DATASET_ID
}

export function getHackathonBigQueryClient() {
  const projectId = getHackathonBigQueryProjectId()
  const inlineCredentials =
    process.env.BIGQUERY_SERVICE_ACCOUNT_JSON || process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON

  if (inlineCredentials) {
    return new BigQuery({
      projectId,
      credentials: JSON.parse(inlineCredentials),
    })
  }

  const keyFilename =
    process.env.GOOGLE_APPLICATION_CREDENTIALS ||
    process.env.BIGQUERY_SERVICE_ACCOUNT_PATH ||
    DEFAULT_CREDENTIALS_PATH

  return new BigQuery({
    projectId,
    keyFilename,
  })
}

export function hackathonDatasetPath(table: QueryableTable) {
  return `\`${getHackathonBigQueryProjectId()}.${getHackathonBigQueryDatasetId()}.${table}\``
}

export async function runHackathonBigQueryQuery<T>(query: string) {
  const client = getHackathonBigQueryClient()
  const response = await client.query({ query, location: "EU" })
  const rows = Array.isArray(response) ? response[0] : response
  return rows as T[]
}

export async function getModeledTableRowCounts() {
  const counts = await Promise.all(
    MODELED_TABLES.map(async (table) => {
      const [row] = await runHackathonBigQueryQuery<RowCountRow>(
        `SELECT COUNT(*) AS row_count FROM ${hackathonDatasetPath(table)}`,
      )

      return {
        table,
        rowCount: Number(row?.row_count ?? 0),
      }
    }),
  )

  return counts
}

export async function getRawExportTableCount(propertyId: string) {
  const client = getHackathonBigQueryClient()
  const [tables] = await client.dataset(`ga4_${propertyId}`).getTables()
  return tables.length
}
