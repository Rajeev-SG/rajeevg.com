import { describe, expect, it } from "vitest"
import {
  PRIMARY_TABS,
  REFERENCE_TABS,
  activeOpportunities,
  computeDashboardCounts,
  describeWorkflowStatus,
  inFlightRows,
  isPublishedRow,
  needsAttention,
} from "../ia"
import type { ContentOpsRow } from "../../types"

function makeRow(overrides: Partial<ContentOpsRow>): ContentOpsRow {
  return {
    id: "test",
    title: "Test",
    tab: "Existing_Content",
    kind: "post",
    workflowStatus: "live",
    derived: false,
    status: "Live",
    pageClass: "Flagship",
    pillar: "Test",
    cluster: "Test",
    url: "/test",
    format: "Essay",
    priority: "P1",
    impact: "H",
    sourceType: "workbook",
    record: {},
    ...overrides,
  }
}

describe("describeWorkflowStatus", () => {
  it("translates internal codes into plain English", () => {
    expect(describeWorkflowStatus("live")).toBe("Live")
    expect(describeWorkflowStatus("planned")).toBe("Idea")
    expect(describeWorkflowStatus("in_progress")).toBe("In progress")
    expect(describeWorkflowStatus("blocked")).toBe("Blocked")
    expect(describeWorkflowStatus("approved")).toBe("Ready to build")
  })
})

describe("isPublishedRow", () => {
  it("treats live workflow as published", () => {
    expect(isPublishedRow(makeRow({ workflowStatus: "live" }))).toBe(true)
  })
  it("treats existing-content tab rows as published even if workflow differs", () => {
    expect(isPublishedRow(makeRow({ tab: "Existing_Content", workflowStatus: "approved" }))).toBe(true)
  })
  it("does not treat workbook idea rows as published", () => {
    expect(isPublishedRow(makeRow({ tab: "Master_Matrix", workflowStatus: "planned" }))).toBe(false)
  })
})

describe("needsAttention", () => {
  it("returns blocked, review, and pr_open rows", () => {
    const rows = [
      makeRow({ id: "a", workflowStatus: "blocked" }),
      makeRow({ id: "b", workflowStatus: "review" }),
      makeRow({ id: "c", workflowStatus: "pr_open" }),
      makeRow({ id: "d", workflowStatus: "live" }),
    ]
    expect(needsAttention(rows).map((r) => r.id)).toEqual(["a", "b", "c"])
  })
})

describe("activeOpportunities", () => {
  it("returns planned, research_ready, and queued rows", () => {
    const rows = [
      makeRow({ id: "a", workflowStatus: "planned" }),
      makeRow({ id: "b", workflowStatus: "research_ready" }),
      makeRow({ id: "c", workflowStatus: "queued" }),
      makeRow({ id: "d", workflowStatus: "live" }),
    ]
    expect(activeOpportunities(rows).map((r) => r.id)).toEqual(["a", "b", "c"])
  })
})

describe("inFlightRows", () => {
  it("returns in_progress, approved, and pr_open rows", () => {
    const rows = [
      makeRow({ id: "a", workflowStatus: "in_progress" }),
      makeRow({ id: "b", workflowStatus: "approved" }),
      makeRow({ id: "c", workflowStatus: "pr_open" }),
      makeRow({ id: "d", workflowStatus: "live" }),
    ]
    expect(inFlightRows(rows).map((r) => r.id)).toEqual(["a", "b", "c"])
  })
})

describe("computeDashboardCounts", () => {
  it("aggregates defensible counts from row states", () => {
    const rows = [
      makeRow({ id: "1", tab: "Master_Matrix", workflowStatus: "blocked" }),
      makeRow({ id: "2", tab: "Master_Matrix", workflowStatus: "planned" }),
      makeRow({ id: "3", tab: "Existing_Content", workflowStatus: "live" }),
      makeRow({ id: "4", tab: "Master_Matrix", workflowStatus: "approved" }),
      makeRow({ id: "5", tab: "Existing_Content", workflowStatus: "live" }),
    ]
    const counts = computeDashboardCounts(rows)
    expect(counts.needsAttention).toBe(1)
    expect(counts.opportunities).toBe(1)
    expect(counts.liveTracked).toBe(2)
    expect(counts.inFlight).toBe(1)
  })
})

describe("PRIMARY_TABS", () => {
  it("exposes only the five primary views plus reference, with no workbook sheet names", () => {
    const labels = PRIMARY_TABS.map((tab) => tab.label)
    expect(labels).toEqual(["Overview", "Content", "Opportunities", "Drafts", "Analytics", "Reference data"])
    for (const forbidden of ["Master Matrix", "Existing Content", "Title Decisions", "Topic Graph", "Programmatic"]) {
      expect(labels).not.toContain(forbidden)
    }
  })
})

describe("REFERENCE_TABS", () => {
  it("keeps every original workbook sheet reachable under Reference data", () => {
    expect(REFERENCE_TABS).toContain("Master_Matrix")
    expect(REFERENCE_TABS).toContain("Title_Decisions")
    expect(REFERENCE_TABS).toContain("Topic_Graph")
    expect(REFERENCE_TABS).toContain("Programmatic")
    expect(REFERENCE_TABS).toContain("Interactive_Assets")
    expect(REFERENCE_TABS).toContain("Sources")
  })
})
