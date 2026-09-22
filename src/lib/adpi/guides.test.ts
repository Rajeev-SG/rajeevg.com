import { describe, expect, it } from "vitest"

import {
  SECTION_ORDER,
  guideEntry,
  isPlausibleGuideDetail,
  isPlausibleGuideIndex,
  orderedSections,
} from "./guides"
import type { GuideSection } from "./guide-types"

const sections: GuideSection[] = [
  { kind: "sources", status: "documented", claims: [] },
  { kind: "definition", status: "documented", claims: [] },
  { kind: "setup", status: "not_documented", claims: [] },
]

describe("guide index/detail guards", () => {
  it("accepts a well-formed index and rejects malformed shapes", () => {
    expect(
      isPlausibleGuideIndex({
        schema_version: 1,
        release: "rel1",
        guides: [{ feature_id: "f.one", detail: "guides/rel1/f.one.json" }],
      }),
    ).toBe(true)
    expect(isPlausibleGuideIndex({ release: "", guides: [] })).toBe(false)
    expect(isPlausibleGuideIndex({ release: "r", guides: [{ feature_id: "x" }] })).toBe(false)
  })

  it("accepts a well-formed detail and rejects a missing guide", () => {
    expect(
      isPlausibleGuideDetail({ schema_version: 1, release: "r", guide: { feature_id: "f.one", sections: [] } }),
    ).toBe(true)
    expect(isPlausibleGuideDetail({ release: "r" })).toBe(false)
  })
})

describe("orderedSections", () => {
  it("returns the seven slots in the canonical order", () => {
    expect(SECTION_ORDER).toEqual([
      "definition",
      "mechanism",
      "use_cases",
      "setup",
      "kpis",
      "relationships",
      "sources",
    ])
    const ordered = orderedSections(sections)
    expect(ordered.map((s) => s.kind)).toEqual(["definition", "setup", "sources"])
  })

  it("drops an unrecognised section kind", () => {
    const drifted = [...sections, { kind: "bogus", status: "documented", claims: [] } as unknown as GuideSection]
    expect(orderedSections(drifted).every((s) => SECTION_ORDER.includes(s.kind))).toBe(true)
  })
})

describe("guideEntry", () => {
  it("finds a guide by feature id, else null", () => {
    const index = {
      schema_version: 1,
      release: "r",
      guides: [{ feature_id: "f.one", detail: "d" }],
    } as never
    expect(guideEntry(index, "f.one")).not.toBeNull()
    expect(guideEntry(index, "missing")).toBeNull()
  })
})
