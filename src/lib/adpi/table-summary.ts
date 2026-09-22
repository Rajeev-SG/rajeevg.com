/**
 * The summary-vs-detail column split for the capability table (#173).
 *
 * Extracted from the component so the mapping is unit-testable: a column
 * rename that breaks the summary mapping (a real regression the review flagged)
 * fails a test rather than silently blanking the row.
 */

export const SUMMARY_COLUMNS = ["name", "platform", "control_mode", "availability"] as const
export type SummaryColumn = (typeof SUMMARY_COLUMNS)[number]

/** The default sort column. Must be a VISIBLE summary column so a user can see
 * and change the order (a hidden-column default sort is invisible to them). */
export const DEFAULT_SORT_COLUMN: SummaryColumn = "name"

export const SUMMARY_LABEL: Record<SummaryColumn, string> = {
  name: "Capability",
  platform: "Surface",
  control_mode: "Control",
  availability: "Availability",
}

export function isSummaryColumn(id: string): id is SummaryColumn {
  return (SUMMARY_COLUMNS as readonly string[]).includes(id)
}

/** Ids that stay in the dense summary row, in their declared order. */
export function summaryColumnIds(ids: readonly string[]): string[] {
  const wanted = new Set(SUMMARY_COLUMNS as readonly string[])
  return ids.filter((id) => wanted.has(id))
}

/** Ids that are secondary metadata and belong in the expanded detail. */
export function detailColumnIds(ids: readonly string[]): string[] {
  const wanted = new Set(SUMMARY_COLUMNS as readonly string[])
  return ids.filter((id) => !wanted.has(id))
}
