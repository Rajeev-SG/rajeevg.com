import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const queryMock = vi.fn()

vi.mock("googleapis", () => ({
  google: {
    auth: {
      JWT: class {
        email: string
        key: string
        scopes: string[]
        constructor(opts: { email: string; key: string; scopes: string[] }) {
          this.email = opts.email
          this.key = opts.key
          this.scopes = opts.scopes
        }
      },
    },
    searchconsole: () => ({
      searchanalytics: { query: queryMock },
    }),
  },
}))

import {
  getSearchConsoleMetricsByPage,
  getSearchConsolePeriodMetrics,
  getSearchConsoleStatus,
  resolveSearchConsoleCredentials,
} from "../search-console"

const GA4_JSON = JSON.stringify({
  client_email: "sa@project.iam.gserviceaccount.com",
  private_key: "ga4-key",
})

beforeEach(() => {
  queryMock.mockReset()
  vi.unstubAllEnvs()
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe("resolveSearchConsoleCredentials", () => {
  it("prefers dedicated GSC env vars", () => {
    vi.stubEnv("GSC_CLIENT_EMAIL", "gsc@sa")
    vi.stubEnv("GSC_PRIVATE_KEY", "gsc-key")
    const creds = resolveSearchConsoleCredentials()
    expect(creds).toEqual({ clientEmail: "gsc@sa", privateKey: "gsc-key", source: "gsc" })
  })

  it("falls back to the shared GA4 service-account JSON", () => {
    vi.stubEnv("GA4_SERVICE_ACCOUNT_JSON", GA4_JSON)
    const creds = resolveSearchConsoleCredentials()
    expect(creds?.source).toBe("ga4")
    expect(creds?.clientEmail).toBe("sa@project.iam.gserviceaccount.com")
  })

  it("returns null when neither source is present", () => {
    expect(resolveSearchConsoleCredentials()).toBeNull()
  })

  it("returns null when the shared JSON is malformed", () => {
    vi.stubEnv("GA4_SERVICE_ACCOUNT_JSON", "not-json")
    expect(resolveSearchConsoleCredentials()).toBeNull()
  })
})

describe("getSearchConsoleStatus", () => {
  it("reports not_configured without credentials", () => {
    expect(getSearchConsoleStatus()).toEqual({ state: "not_configured", reason: "missing_credentials" })
  })

  it("reports ready with the shared GA4 credential", () => {
    vi.stubEnv("GA4_SERVICE_ACCOUNT_JSON", GA4_JSON)
    expect(getSearchConsoleStatus()).toEqual({ state: "ready" })
  })
})

describe("getSearchConsolePeriodMetrics", () => {
  it("returns an explicit not_configured status instead of throwing", async () => {
    const result = await getSearchConsolePeriodMetrics({ days: 28 })
    expect(result.status).toEqual({ state: "not_configured", reason: "missing_credentials" })
    expect(result.rows).toEqual([])
  })

  it("maps API rows to privacy-safe aggregates", async () => {
    vi.stubEnv("GA4_SERVICE_ACCOUNT_JSON", GA4_JSON)
    queryMock.mockResolvedValueOnce({
      data: {
        rows: [
          { keys: ["https://rajeevg.com/blog/a"], clicks: 3, impressions: 30, ctr: 0.1, position: 12.4 },
        ],
      },
    })
    const result = await getSearchConsolePeriodMetrics({ days: 28 })
    expect(result.status).toEqual({ state: "ready" })
    expect(result.rows[0]).toMatchObject({
      key: "https://rajeevg.com/blog/a",
      clicks: 3,
      impressions: 30,
      ctr: 0.1,
      averagePosition: 12.4,
    })
    expect(queryMock.mock.calls[0][0].requestBody.dimensions).toEqual(["page"])
  })

  it("surfaces API errors without throwing or leaking payloads", async () => {
    vi.stubEnv("GA4_SERVICE_ACCOUNT_JSON", GA4_JSON)
    queryMock.mockRejectedValueOnce(new Error("403 permission denied"))
    const result = await getSearchConsolePeriodMetrics({ days: 28 })
    expect(result.rows).toEqual([])
    expect(result.error).toContain("403")
  })

  it("clamps absurd day ranges to the retention window", async () => {
    vi.stubEnv("GA4_SERVICE_ACCOUNT_JSON", GA4_JSON)
    queryMock.mockResolvedValueOnce({ data: { rows: [] } })
    const result = await getSearchConsolePeriodMetrics({ days: 9999 })
    const start = new Date(result.startDate)
    const end = new Date(result.endDate)
    expect((end.getTime() - start.getTime()) / 86_400_000).toBeLessThanOrEqual(480)
  })
})

describe("getSearchConsoleMetricsByPage", () => {
  it("normalizes page URLs to paths and merges as ContentOpsMetrics", async () => {
    vi.stubEnv("GA4_SERVICE_ACCOUNT_JSON", GA4_JSON)
    queryMock.mockResolvedValueOnce({
      data: {
        rows: [
          { keys: ["https://www.rajeevg.com/blog/x"], clicks: 5, impressions: 50, ctr: 0.1, position: 8 },
        ],
      },
    })
    const byPage = await getSearchConsoleMetricsByPage()
    expect(byPage).toEqual({
      "/blog/x": { clicks: 5, impressions: 50, ctr: 0.1, averagePosition: 8 },
    })
  })

  it("returns an empty map on API error (dashboard keeps working)", async () => {
    vi.stubEnv("GA4_SERVICE_ACCOUNT_JSON", GA4_JSON)
    queryMock.mockRejectedValueOnce(new Error("boom"))
    expect(await getSearchConsoleMetricsByPage()).toEqual({})
  })
})
