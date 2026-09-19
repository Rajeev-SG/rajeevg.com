import { afterEach, describe, expect, it, vi } from "vitest"

import { bundledDataset, getAdpiDataset } from "../dataset"

const REAL_FETCH = globalThis.fetch

afterEach(() => {
  globalThis.fetch = REAL_FETCH
  vi.restoreAllMocks()
})

function mockFetchOnce(handler: () => Promise<Response> | Response) {
  globalThis.fetch = vi.fn(handler) as unknown as typeof fetch
}

describe("getAdpiDataset", () => {
  it("falls back to the bundled reviewed slice when the live fetch fails", async () => {
    mockFetchOnce(() => Promise.reject(new Error("network down")))
    const resolved = await getAdpiDataset()
    expect(resolved.live).toBe(false)
    expect(resolved.dataset.capabilities.length).toBe(bundledDataset.capabilities.length)
    expect(resolved.questions.length).toBe(3)
  })

  it("falls back when the live endpoint returns a non-OK status", async () => {
    mockFetchOnce(() => new Response("nope", { status: 503 }))
    const resolved = await getAdpiDataset()
    expect(resolved.live).toBe(false)
  })

  it("falls back on a malformed or unversioned live payload", async () => {
    mockFetchOnce(() => new Response(JSON.stringify({ hello: "world" }), { status: 200 }))
    const resolved = await getAdpiDataset()
    expect(resolved.live).toBe(false)
  })

  it("falls back when the payload lacks the required record fields", async () => {
    mockFetchOnce(
      () =>
        new Response(
          JSON.stringify({ schema_version: 2, generated_at: "t", capabilities: [{ id: "x" }] }),
          { status: 200 },
        ),
    )
    const resolved = await getAdpiDataset()
    expect(resolved.live).toBe(false)
  })

  it("uses the live payload when it is well-formed and keeps the reviewed records", async () => {
    const liveCapability = {
      id: "some.vendor.new.capability",
      vendor: "Vendor",
      platform: "Product",
      name: "New capability",
      capability_type: "targeting",
      maturity: "live",
      control_mode: "control",
      evidence_basis: "documented",
      availability: "conditional",
      evidence: [{ source_id: "some.vendor", source_url: "https://example.com" }],
    }
    mockFetchOnce(
      () =>
        new Response(
          JSON.stringify({
            schema_version: 2,
            generated_at: "2026-09-19T00:00:00+00:00",
            capabilities: [liveCapability],
          }),
          { status: 200 },
        ),
    )
    const resolved = await getAdpiDataset()
    expect(resolved.live).toBe(true)
    // The reviewed launch records are still present, merged with the live one.
    expect(resolved.dataset.capabilities.some((c) => c.id === liveCapability.id)).toBe(true)
    expect(resolved.dataset.capabilities.length).toBeGreaterThan(bundledDataset.capabilities.length)
    // Questions always come from the reviewed bundle.
    expect(resolved.questions.length).toBe(3)
  })

  it("carries the reviewed provenance through the resolved dataset", async () => {
    mockFetchOnce(() => Promise.reject(new Error("down")))
    const resolved = await getAdpiDataset()
    expect(resolved.dataset.provenance?.kind).toBe("reviewed_launch_slice")
    expect(resolved.dataset.provenance?.reviewed_by).toBeTruthy()
    expect(resolved.dataset.provenance?.extraction_prompt_sha256).toBeTruthy()
  })
})
