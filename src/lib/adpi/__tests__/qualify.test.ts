import { describe, expect, it } from "vitest"

import { bundledDataset } from "../dataset"
import { compare, groupConditions, qualify } from "../qualify"
import type { Capability } from "../types"

function cap(overrides: Partial<Capability>): Capability {
  return {
    id: "x.y.z",
    vendor: "Vendor",
    platform: "Product",
    name: "Thing",
    capability_type: "targeting",
    maturity: "live",
    control_mode: "control",
    evidence_basis: "documented",
    availability: "conditional",
    evidence: [{ source_id: "x.y", source_url: "https://example.com" }],
    last_verified_at: "2026-09-19",
    ...overrides,
  } as Capability
}

describe("qualify", () => {
  it("never returns an unqualified supported answer from documentation alone", () => {
    const answer = qualify(cap({ evidence_basis: "documented", availability: "supported" }))
    expect(answer.outcome).toBe("conditional")
  })

  it("returns supported only for account-observed evidence", () => {
    const answer = qualify(cap({ evidence_basis: "account_observed", availability: "supported" }))
    expect(answer.outcome).toBe("supported")
  })

  it("preserves control vs signal vs automation and explains delivery behaviour", () => {
    const signal = qualify(cap({ control_mode: "signal" }))
    const automatic = qualify(cap({ control_mode: "automatic" }))
    expect(signal.controlMode).toMatch(/signal/i)
    expect(signal.controlModePlain).toMatch(/optimisation/i)
    expect(automatic.controlMode).toMatch(/automatic/i)
    expect(signal.controlMode).not.toBe(automatic.controlMode)
  })

  it("reports unevidenced market scope as unknown, never as a default", () => {
    const answer = qualify(cap({ scope: { markets: [] } }))
    expect(answer.markets).toEqual([])
    expect(answer.unresolved.join(" ")).toMatch(/market/i)
  })

  it("carries evidence basis, reference and verification date", () => {
    const answer = qualify(
      cap({
        evidence: [{ source_id: "google.ads.x", source_url: "https://s", locator: "## Heading" }],
        last_verified_at: "2026-09-15",
      }),
    )
    expect(answer.evidenceBasisLabel).toMatch(/Documented/)
    expect(answer.evidenceRef).toContain("google.ads.x")
    expect(answer.verifiedAt).toBe("2026-09-15")
  })

  it("marks an unknown availability as explicitly unresolved", () => {
    const answer = qualify(cap({ availability: "unknown" }))
    expect(answer.outcome).toBe("unknown")
    expect(answer.unresolved.length).toBeGreaterThan(0)
  })

  it("groups structured conditions by kind in a stable order", () => {
    const grouped = groupConditions([
      { kind: "prerequisite", detail: "p" },
      { kind: "beta", detail: "b" },
      { kind: "eligibility", detail: "e" },
    ])
    expect(grouped.map((g) => g.kind)).toEqual(["beta", "eligibility", "prerequisite"])
  })
})

describe("compare", () => {
  it("never asserts semantic equivalence across vendors", () => {
    const result = compare(
      cap({ vendor: "TikTok", control_mode: "control" }),
      cap({ vendor: "Meta", control_mode: "automatic" }),
    )
    expect(result.equivalent).toBe(false)
    expect(result.caveats.join(" ")).toMatch(/different vendors/i)
    expect(result.caveats.join(" ")).toMatch(/not interchangeable/i)
  })

  it("flags a control-mode difference explicitly", () => {
    const result = compare(
      cap({ vendor: "A", control_mode: "signal" }),
      cap({ vendor: "B", control_mode: "control" }),
    )
    expect(result.sameControlMode).toBe(false)
  })
})

describe("the reviewed launch slice", () => {
  it("covers the three planner questions and exercises control, signal and automation", () => {
    const modes = new Set(bundledDataset.capabilities.map((c) => c.control_mode))
    expect(modes.has("control")).toBe(true)
    expect(modes.has("signal")).toBe(true)
    expect(modes.has("automatic")).toBe(true)
    expect(bundledDataset.questions?.length).toBe(3)
  })

  it("gives every reviewed record a basis, an outcome and a verification date", () => {
    for (const capability of bundledDataset.capabilities) {
      expect(["documented", "account_observed", "vendor_announced", "unknown"]).toContain(
        capability.evidence_basis,
      )
      expect(["supported", "conditional", "unknown"]).toContain(capability.availability)
      expect(capability.last_verified_at).toBeTruthy()
      expect(capability.evidence.length).toBeGreaterThan(0)
    }
  })

  it("does not expose verbatim vendor prose as a locator", () => {
    for (const capability of bundledDataset.capabilities) {
      const locator = capability.evidence[0].locator
      if (locator) expect(locator.length).toBeLessThan(120)
    }
  })
})
