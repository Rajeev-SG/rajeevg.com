import { describe, expect, it } from "vitest"

import {
  ALL_COLUMN_IDS,
  DEFAULT_SORT_COLUMN,
  SUMMARY_COLUMNS,
  SUMMARY_LABEL,
  assertColumnIds,
  detailColumnIds,
  isSummaryColumn,
  summaryColumnIds,
} from "./table-summary"

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

  it("the canonical list matches the table's real columns (drift guard)", () => {
    // assertColumnIds throws if a table column id is added/renamed/removed
    // without updating ALL_COLUMN_IDS. The component calls it at module load;
    // here we prove the guard actually fires.
    expect(() => assertColumnIds(ALL_COLUMN_IDS)).not.toThrow()
    expect(() => assertColumnIds([...ALL_COLUMN_IDS, "new_col"])).toThrow(/drifted/)
    expect(() =>
      assertColumnIds(ALL_COLUMN_IDS.filter((id) => id !== "control_mode")),
    ).toThrow(/drifted/)
  })
})
