import { describe, expect, it } from "vitest"

import { answerQuery, compareCapabilities, conditionsFor, tokenise } from "../qualified"
import type { CapabilityRecord } from "../types"

function record(overrides: Partial<CapabilityRecord> = {}): CapabilityRecord {
  return {
    id: "google.pmax.audience_signals.audience-signals-for-performance-max-campaigns",
    vendor: "Google Ads",
    platform: "Performance Max",
    name: "Audience signals for Performance Max campaigns",
    capability_type: "audience",
    maturity: "live",
    control_mode: "signal",
    evidence_basis: "documented",
    availability: "conditional",
    scope: { prerequisites: ["Requires a first-party audience"] },
    evidence: [
      {
        source_id: "google.pmax.audience_signals",
        source_url: "https://support.google.com/google-ads/answer/14530785",
        cleaned_sha256: "f83d10567240df58",
        raw_sha256: "1ea8cd4e47cb2be3",
      },
    ],
    last_verified_at: "2026-09-17",
    ...overrides,
  }
}

describe("tokenise", () => {
  it("drops stopwords and short tokens", () => {
    expect(tokenise("Do audience signals actually restrict who sees my ads?")).toContain("audience")
    expect(tokenise("Do audience signals actually restrict who sees my ads?")).not.toContain("do")
    expect(tokenise("Do audience signals actually restrict who sees my ads?")).not.toContain("ads")
  })
})

describe("answerQuery", () => {
  it("returns a qualified answer with the record's availability, not a boolean", () => {
    const answer = answerQuery([record()], { text: "audience signals performance max" })
    expect(answer.abstained).toBe(false)
    expect(answer.verdict).toBe("conditional")
    expect(answer.facts).toHaveLength(1)
    expect(answer.facts[0].verificationDate).toBe("2026-09-17")
  })

  it("abstains when nothing matches, and never infers an answer", () => {
    const answer = answerQuery([record()], { text: "guaranteed reach forecasting zzqx" })
    expect(answer.abstained).toBe(true)
    expect(answer.verdict).toBe("unknown")
    expect(answer.facts).toHaveLength(0)
    expect(answer.rationale).toMatch(/will not infer/i)
  })

  it("holds the combined answer back when any matched record is unknown", () => {
    const answer = answerQuery(
      [record(), record({ id: "x.y.z", name: "Audience signals variant", availability: "unknown" })],
      { text: "audience signals" },
    )
    // conditional present dominates supported; unknown never becomes supported
    expect(["conditional", "unknown"]).toContain(answer.verdict)
  })

  it("never reports supported when the only evidence is unknown", () => {
    const answer = answerQuery(
      [record({ id: "a.b.c", name: "Audience signal thing", availability: "unknown", control_mode: "control" })],
      { text: "audience signal" },
    )
    expect(answer.verdict).toBe("unknown")
  })
})

describe("conditionsFor", () => {
  it("renders structured qualifiers, including market/objective mismatch", () => {
    const recordWithScope = record({
      scope: {
        markets: ["US", "GB"],
        conditions: [{ kind: "eligibility", detail: "Requires eligibility" }],
        prerequisites: ["Requires a first-party audience"],
      },
    })
    const conditions = conditionsFor(recordWithScope, "JP", "Conversions")
    const kinds = conditions.map((condition) => condition.kind)
    expect(kinds).toContain("eligibility")
    expect(kinds).toContain("prerequisite")
    expect(conditions.some((condition) => /Not evidenced for JP/.test(condition.detail))).toBe(true)
  })
})

describe("compareCapabilities", () => {
  it("requires a caveat when the two surfaces differ", () => {
    const left = record()
    const right = record({ id: "tiktok.x", name: "Search query match types", vendor: "TikTok", platform: "Search Ads Campaign" })
    const comparison = compareCapabilities(left, right)
    expect(comparison.caveatRequired).toBe(true)
    expect(comparison.caveat).toMatch(/not asserted/i)
  })

  it("does not require a caveat for the same surface", () => {
    const comparison = compareCapabilities(record(), record({ id: "same.surface" }))
    expect(comparison.caveatRequired).toBe(false)
  })
})
