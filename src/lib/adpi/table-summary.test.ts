import { describe, expect, it } from "vitest"

import {
  DEFAULT_SORT_COLUMN,
  SUMMARY_COLUMNS,
  SUMMARY_LABEL,
  detailColumnIds,
  isSummaryColumn,
  summaryColumnIds,
} from "./table-summary"

// The column ids the table actually defines (keep in sync with the component).
const ALL_COLUMN_IDS = [
  "name",
  "vendor",
  "platform",
  "capability_type",
  "control_mode",
  "availability",
  "evidence_basis",
  "maturity",
  "ui_api",
]

describe("capability table summary columns", () => {
  it("keeps the summary to about four readable columns", () => {
    expect(SUMMARY_COLUMNS.length).toBeLessThanOrEqual(4)
  })

  it("maps every summary column to a non-empty label", () => {
    for (const column of SUMMARY_COLUMNS) {
      expect(SUMMARY_LABEL[column]).toBeTruthy()
    }
  })

  it("the default sort column is a visible summary column", () => {
    // A hidden default sort is invisible to the user (#173 review F2).
    expect(isSummaryColumn(DEFAULT_SORT_COLUMN)).toBe(true)
    expect(summaryColumnIds(ALL_COLUMN_IDS)).toContain(DEFAULT_SORT_COLUMN)
  })

  it("selects exactly the summary columns, in declared order", () => {
    expect(summaryColumnIds(ALL_COLUMN_IDS)).toEqual([
      "name",
      "platform",
      "control_mode",
      "availability",
    ])
  })

  it("routes the secondary fields to the detail panel", () => {
    expect(detailColumnIds(ALL_COLUMN_IDS)).toEqual([
      "vendor",
      "capability_type",
      "evidence_basis",
      "maturity",
      "ui_api",
    ])
  })

  it("a column rename is caught: unknown id is neither summary nor detail-omitted", () => {
    // If a column is renamed (e.g. 'surface'), it stops matching the summary set
    // and would silently vanish from the row; the mapping must be explicit.
    expect(isSummaryColumn("surface")).toBe(false)
    expect(summaryColumnIds(["surface", "name"])).toEqual(["name"])
    expect(detailColumnIds(["surface", "name"])).toEqual(["surface"])
  })
})
