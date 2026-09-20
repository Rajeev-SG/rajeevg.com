import { describe, expect, it } from "vitest"

import { answerFromLiveCorpus, isLiveQualified, resolveLiveRecord } from "../qualified"
import type { ReviewedCaseRef } from "../qualified"
import type { CapabilityRecord } from "../types"

function liveRecord(overrides: Partial<CapabilityRecord> = {}): CapabilityRecord {
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
        source_url: "https://support.google.com/google-ads/answer/14545392",
        cleaned_sha256: "aaaaaaaaaaaa",
        raw_sha256: "bbbbbbbbbbbb",
      },
    ],
    last_verified_at: "2026-09-21",
    ...overrides,
  }
}

function reviewedCase(overrides: Partial<ReviewedCaseRef> = {}): ReviewedCaseRef {
  return {
    id: "pmax-audience-signals",
    question: "Does a Performance Max audience signal actually restrict who sees my ads?",
    target: "Audience signals",
    reviewed_by: "rajeev",
    reviewed_at: "2026-09-19",
    control_mode: "control", // REVIEWED SAYS control — live says signal
    evidence_basis: "documented",
    availability: "conditional",
    markets: [],
    objectives: [],
    placements: [],
    prerequisites: ["An audience signal requires a first-party audience or a custom segment"],
    exclusions: [],
    record_id: "google.pmax.audience_signals.audience-signals-for-performance-max-campaigns",
    source: {
      source_id: "google.pmax.audience_signals",
      source_url: "https://support.google.com/ads/answer/14545392",
      product: "Performance Max",
      cleaned_sha256: "cccccccccccc",
      raw_sha256: "dddddddddddd",
    },
    ...overrides,
  }
}

describe("live precedence (#163)", () => {
  it("a live qualified record wins over the reviewed fixture's fields", () => {
    const answer = answerFromLiveCorpus(
      [reviewedCase()],
      { text: "audience signals", vendor: "Google Ads" },
      [liveRecord()],
    )
    expect(answer.provenance).toBe("live")
    expect(answer.abstained).toBe(false)
    // The live record's control_mode (signal) must win; the reviewed fixture said control.
    expect(answer.facts[0].record.control_mode).toBe("signal")
    expect(answer.facts[0].record.availability).toBe("conditional")
    expect(answer.facts[0].verificationDate).toBe("2026-09-21")
    // Evidence comes from the live record, not the reviewed source pointer.
    expect(answer.facts[0].evidence[0].source_id).toBe("google.pmax.audience_signals")
    expect(answer.facts[0].evidence[0].cleaned_sha256).toBe("aaaaaaaaaaaa")
  })

  it("abstains when the pinned live record is missing — no synthetic fact", () => {
    const answer = answerFromLiveCorpus(
      [reviewedCase()],
      { text: "audience signals", vendor: "Google Ads" },
      [], // live corpus carries nothing
    )
    expect(answer.abstained).toBe(true)
    expect(answer.verdict).toBe("unknown")
    expect(answer.facts).toHaveLength(0)
    expect(answer.provenance).toBe("reviewed_reference")
    expect(answer.rationale).toMatch(/no live published capability/i)
  })

  it("abstains when the concept is missing from the live corpus even under another vendor", () => {
    // Reviewed case targets TikTok with no pinned id; the corpus only has Google.
    const answer = answerFromLiveCorpus(
      [reviewedCase({ id: "tiktok-search-campaign", target: "Search Ads Campaign", record_id: null })],
      { text: "search ads campaign", vendor: "TikTok" },
      [liveRecord()],
    )
    expect(answer.abstained).toBe(true)
    expect(answer.facts).toHaveLength(0)
    expect(answer.provenance).toBe("reviewed_reference")
  })

  it("treats a live record with no qualified fields as not establishing the concept", () => {
    const placeholder = liveRecord({
      evidence_basis: "unknown",
      availability: "unknown",
    })
    expect(isLiveQualified(placeholder)).toBe(false)
    const answer = answerFromLiveCorpus(
      [reviewedCase()],
      { text: "audience signals" },
      [placeholder],
    )
    expect(answer.abstained).toBe(true)
    expect(answer.provenance).toBe("reviewed_reference")
  })

  it("resolves a concept by match when the review pinned no record_id", () => {
    const live = liveRecord({ id: "free.surface.record", name: "Audience signals" })
    const frame = reviewedCase({ record_id: null })
    expect(resolveLiveRecord(frame, [live])?.id).toBe("free.surface.record")
  })

  it("does not fall back to a neighbouring record when a pinned id is gone", () => {
    const live = liveRecord({ id: "some.other.record", name: "Audience signals" })
    const frame = reviewedCase() // pins google.pmax... which is absent
    expect(resolveLiveRecord(frame, [live])).toBeNull()
  })

  it("reports both live and unresolved concepts in a multi-capability question", () => {
    const liveCampaign = liveRecord({
      id: "tiktok.search.campaign",
      vendor: "TikTok",
      platform: "Search Ads Campaign",
      name: "Search Ads Campaign",
      control_mode: "control",
    })
    const cases: ReviewedCaseRef[] = [
      reviewedCase({
        id: "tiktok-search-campaign",
        target: "Search Ads Campaign",
        record_id: "tiktok.search.campaign",
      }),
      reviewedCase({
        id: "tiktok-auto-search-placement",
        target: "Automatic Search Placement",
        record_id: "tiktok.search.automatic-placement", // absent live
      }),
    ]
    const answer = answerFromLiveCorpus(cases, { text: "tiktok search", vendor: "TikTok" }, [
      liveCampaign,
    ])
    expect(answer.provenance).toBe("live")
    expect(answer.abstained).toBe(false)
    expect(answer.facts).toHaveLength(1)
    expect(answer.rationale).toMatch(/Automatic Search Placement/)
    expect(answer.rationale).toMatch(/unresolved/i)
  })
})
