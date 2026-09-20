import { describe, expect, it } from "vitest"

import { isPlausibleHistory, summariseHistory, type AdpiHistory } from "../history"

function history(entries: AdpiHistory["entries"]): AdpiHistory {
  return { schema_version: 2, generated_at: "2026-09-21T00:00:00+00:00", entries }
}

describe("isPlausibleHistory", () => {
  it("accepts a well-formed history", () => {
    expect(isPlausibleHistory(history([{ id: "a", change: "added", vendor: "Meta", platform: "x", name: "n" }]))).toBe(true)
  })
  it("rejects a payload with no entries array", () => {
    expect(isPlausibleHistory({ generated_at: "t" })).toBe(false)
    expect(isPlausibleHistory({ generated_at: "t", entries: "nope" })).toBe(false)
  })
  it("rejects entries missing id or change", () => {
    expect(isPlausibleHistory({ schema_version: 2, generated_at: "t", entries: [{ vendor: "x" }] })).toBe(false)
  })
  it("rejects a null entry without throwing (F2)", () => {
    expect(isPlausibleHistory({ schema_version: 2, generated_at: "t", entries: [null] })).toBe(false)
    expect(isPlausibleHistory({ schema_version: 2, generated_at: "t", entries: ["x", 3] })).toBe(false)
  })
  it("rejects an unknown schema version (F3)", () => {
    expect(isPlausibleHistory({ schema_version: 3, generated_at: "t", entries: [] })).toBe(false)
    expect(isPlausibleHistory({ generated_at: "t", entries: [] })).toBe(false)
  })
})

describe("summariseHistory", () => {
  it("counts by change kind and surfaces recent non-added changes newest-first", () => {
    const h = history([
      { id: "a", change: "added", vendor: "Google Ads", platform: "p", name: "A", last_verified_at: "2026-09-18" },
      { id: "b", change: "superseded", vendor: "Meta", platform: "p", name: "B", effective_to: "2026-09-19", last_verified_at: "2026-09-19" },
      { id: "c", change: "retired", vendor: "TikTok", platform: "p", name: "C", effective_to: "2026-09-20", last_verified_at: "2026-09-17" },
      { id: "d", change: "changed", vendor: "Pinterest", platform: "p", name: "D", effective_to: "2026-09-20", last_verified_at: "2026-09-20" },
    ])
    const s = summariseHistory(h)
    expect(s.total).toBe(4)
    expect(s.byChange).toEqual({ added: 1, superseded: 1, retired: 1, changed: 1 })
    // "added" is excluded; newest effective_to first, tiebroken by latest
    // verification — d (verified 09-20) ahead of c (verified 09-17).
    expect(s.recentChanges.map((e) => e.id).slice(0, 2)).toEqual(["d", "c"])
    expect(s.recentChanges.every((e) => e.change !== "added")).toBe(true)
    expect(s.lastVerifiedAt).toBe("2026-09-20")
  })

  it("treats a still-current changed entry as recent (F1)", () => {
    const h = history([
      { id: "old", change: "superseded", vendor: "Meta", platform: "p", name: "Old", effective_to: "2026-08-01", last_verified_at: "2026-08-01" },
      { id: "now", change: "changed", vendor: "Pinterest", platform: "p", name: "Now", effective_to: null, last_verified_at: "2026-09-20" },
    ])
    const s = summariseHistory(h, 5)
    // The still-current changed entry must sort first, not be demoted to last.
    expect(s.recentChanges[0].id).toBe("now")
  })

  it("caps the recent-changes list", () => {
    const entries = Array.from({ length: 9 }, (_, i) => ({
      id: `x${i}`,
      change: "changed",
      vendor: "Meta",
      platform: "p",
      name: `N${i}`,
      effective_to: `2026-09-${String(i + 1).padStart(2, "0")}`,
    }))
    expect(summariseHistory(history(entries), 5).recentChanges).toHaveLength(5)
  })

  it("is honest about an empty history", () => {
    const s = summariseHistory(history([]))
    expect(s.total).toBe(0)
    expect(s.recentChanges).toEqual([])
    expect(s.lastVerifiedAt).toBeNull()
  })
})
