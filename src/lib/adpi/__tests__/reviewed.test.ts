import { describe, expect, it } from "vitest"

import capabilities from "@/data/adpi/capabilities.json"
import { reviewedGolden } from "../reviewed"
import type { CapabilityRecord } from "../types"

const records = (capabilities as { capabilities: CapabilityRecord[] }).capabilities
const byId = new Map(records.map((record) => [record.id, record]))

describe("reviewed golden slice", () => {
  it("every record_id resolves to a record whose name is consistent with the case", () => {
    for (const entry of reviewedGolden().cases) {
      if (!entry.record_id) continue // deliberately unattributed: synthetic record
      const record = byId.get(entry.record_id)
      expect(record, `${entry.id} -> ${entry.record_id} must exist`).toBeDefined()
      // The reviewed target must share meaningful tokens with the record name,
      // so a provenance-first answer is never bound to an unrelated capability.
      const target = entry.target.toLowerCase()
      const name = record!.name.toLowerCase()
      const shared = target.split(/\s+/).filter((word) => word.length > 3 && name.includes(word))
      expect(
        shared.length,
        `${entry.id}: reviewed target "${entry.target}" does not match record "${record!.name}"`,
      ).toBeGreaterThan(0)
    }
  })

  it("does not bind two reviewed cases to the same record", () => {
    const used = reviewedGolden()
      .cases.map((entry) => entry.record_id)
      .filter((id): id is string => Boolean(id))
    expect(new Set(used).size).toBe(used.length)
  })
})
