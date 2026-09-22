/**
 * The column layout of the capability table (#173).
 *
 * This module is the SINGLE source of truth for the column ids and the
 * summary-vs-detail split. The component builds its columns from
 * `ALL_COLUMN_IDS`, so a column rename must touch this list and cannot silently
 * break the summary mapping; `table-summary.test.ts` validates the split against
 * the same list rather than a duplicated copy.
 */

/** Every column id the table defines, in display order. */
export const ALL_COLUMN_IDS = [
  "name",
  "vendor",
  "platform",
  "capability_type",
  "control_mode",
  "availability",
  "evidence_basis",
  "maturity",
  "ui_api",
] as const

export type ColumnId = (typeof ALL_COLUMN_IDS)[number]

/** The ~4 summary columns shown in the dense row. The rest are secondary
 * metadata rendered in the expanded detail. */
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

/** Ids that stay in the dense summary row, in declared order. */
export function summaryColumnIds(ids: readonly string[] = ALL_COLUMN_IDS): string[] {
  const wanted = new Set(SUMMARY_COLUMNS as readonly string[])
  return ids.filter((id) => wanted.has(id))
}

/** Ids that are secondary metadata and belong in the expanded detail. */
export function detailColumnIds(ids: readonly string[] = ALL_COLUMN_IDS): string[] {
  const wanted = new Set(SUMMARY_COLUMNS as readonly string[])
  return ids.filter((id) => !wanted.has(id))
}

/** Assert a table's actual column ids match this canonical list.
 *
 * Called by the component at module load: if a column is renamed (e.g.
 * `control_mode` -> `control`) without updating this list, the mismatch throws
 * immediately instead of silently blanking a summary cell. */
export function assertColumnIds(ids: readonly string[]): void {
  const expected = ALL_COLUMN_IDS as readonly string[]
  const missing = expected.filter((id) => !ids.includes(id))
  const extra = ids.filter((id) => !expected.includes(id))
  if (missing.length || extra.length) {
    throw new Error(
      `capability table column ids drifted from ALL_COLUMN_IDS ` +
        `(missing: ${missing.join(", ") || "none"}; extra: ${extra.join(", ") || "none"})`,
    )
  }
}
