import "server-only"

import { unstable_noStore as noStore } from "next/cache"

import {
  MODELED_TABLES,
  getModeledTableRowCounts,
  getRawExportTableCount,
} from "@/lib/hackathon-bigquery"
import { getHackathonBigQueryLinkSummary } from "@/lib/hackathon-ga4-admin"
import { getHackathonPropertyId, getHackathonStreamId } from "@/lib/hackathon-ga4-common"
import { getHackathonEventDay, getHackathonVoteTruth } from "@/lib/hackathon-vote-truth"

export type HackathonBigQueryStatus = {
  generatedAt: string
  eventDayLabel: string | null
  eventDayIsoDate: string | null
  modeledTableCount: number
  modeledTablesWithRows: number
  modeledRowCount: number
  modeledTableRows: Array<{ table: string; rowCount: number }>
  rawExportTableCount: number
  link: {
    name: string
    createTime: string
    dailyExportEnabled: boolean
    streamingExportEnabled: boolean
    exportStreams: string[]
    excludedEvents: string[]
    datasetLocation: string
    includesHackathonStream: boolean
  } | null
}

export async function getHackathonBigQueryStatus(): Promise<HackathonBigQueryStatus> {
  noStore()

  const [modeledTableRows, rawExportTableCount, link, voteTruthResult] = await Promise.all([
    getModeledTableRowCounts(),
    getRawExportTableCount(getHackathonPropertyId()),
    getHackathonBigQueryLinkSummary(getHackathonPropertyId()).catch(() => null),
    getHackathonVoteTruth(),
  ])

  const modeledRowCount = modeledTableRows.reduce((sum, row) => sum + row.rowCount, 0)
  const modeledTablesWithRows = modeledTableRows.filter((row) => row.rowCount > 0).length
  const eventDay = getHackathonEventDay(voteTruthResult.summary)
  const hackathonStream = `properties/${getHackathonPropertyId()}/dataStreams/${getHackathonStreamId()}`

  return {
    generatedAt: new Date().toISOString(),
    eventDayLabel: eventDay?.label ?? null,
    eventDayIsoDate: eventDay?.isoDate ?? null,
    modeledTableCount: MODELED_TABLES.length,
    modeledTablesWithRows,
    modeledRowCount,
    modeledTableRows,
    rawExportTableCount,
    link: link
      ? {
          name: link.name,
          createTime: link.createTime,
          dailyExportEnabled: link.dailyExportEnabled,
          streamingExportEnabled: link.streamingExportEnabled,
          exportStreams: link.exportStreams,
          excludedEvents: link.excludedEvents,
          datasetLocation: link.datasetLocation,
          includesHackathonStream: link.exportStreams.includes(hackathonStream),
        }
      : null,
  }
}
