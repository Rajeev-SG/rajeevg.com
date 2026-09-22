import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  SECTION_ORDER,
  guideEntry,
  isPlausibleGuideDetail,
  isPlausibleGuideIndex,
  isSafeDetailPointer,
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

  it("rejects a detail pointer that is not guides/<release>/<file>.json", () => {
    // Traversal, absolute URL, bare filename, query string — all refused.
    expect(isSafeDetailPointer("guides/rel1/f.one.json")).toBe(true)
    expect(isSafeDetailPointer("../../secrets.json")).toBe(false)
    expect(isSafeDetailPointer("/etc/passwd")).toBe(false)
    expect(isSafeDetailPointer("https://attacker/x.json")).toBe(false)
    expect(isSafeDetailPointer("guides/rel1/f.one.json?x=1")).toBe(false)
    expect(isSafeDetailPointer("f.json")).toBe(false)
  })

  it("rejects an index whose detail pointer is unsafe (SSRF guard)", () => {
    expect(
      isPlausibleGuideIndex({
        schema_version: 1,
        release: "rel1",
        guides: [{ feature_id: "f.one", detail: "http://169.254.169.254/latest/meta-data" }],
      }),
    ).toBe(false)
    expect(
      isPlausibleGuideIndex({
        schema_version: 1,
        release: "rel1",
        guides: [{ feature_id: "f.one", detail: "../../x.json" }],
      }),
    ).toBe(false)
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
      guides: [{ feature_id: "f.one", detail: "guides/r/f.one.json" }],
    } as never
    expect(guideEntry(index, "f.one")).not.toBeNull()
    expect(guideEntry(index, "missing")).toBeNull()
  })
})

describe("loader fallback and safety", () => {
  const originalFetch = globalThis.fetch

  afterEach(() => {
    globalThis.fetch = originalFetch
    vi.restoreAllMocks()
  })

  it("falls back to the bundled seed and warns when the live index is unreachable", async () => {
    vi.resetModules()
    globalThis.fetch = vi.fn().mockRejectedValue(new Error("network down")) as never
    const { getGuideIndexOutcome } = await import("./guides")
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    const outcome = await getGuideIndexOutcome()
    expect(outcome.source).toBe("bundled")
    expect(outcome.index.release).toBeTruthy()
    expect(warn).toHaveBeenCalled()
  })

  it("never calls fetch for an unsafe detail pointer", async () => {
    const fetchSpy = vi.fn()
    globalThis.fetch = fetchSpy as never
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    const { getGuideDetail } = await import("./guides")
    expect(await getGuideDetail("../../etc/passwd")).toBeNull()
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(warn).toHaveBeenCalled()
  })
})
