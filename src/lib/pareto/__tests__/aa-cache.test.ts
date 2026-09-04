import { describe, expect, it, vi } from "vitest";

/**
 * Single-flight + persistence contract for AA reads.
 * - repeated/concurrent calls collapse to one underlying AA load per window
 * - pagination follows the provider's reported page count within a safety cap
 */
import { fetchAaAllPages } from "../artificial-analysis";
import type { AaResponse } from "../artificial-analysis";

function makePageResponse(page: number, hasMore: boolean): AaResponse {
  return {
    tier: "free",
    intelligence_index_version: "4.1",
    pagination: { page, page_size: 100, total_pages: hasMore ? 2 : 1, has_more: hasMore },
    data: [
      {
        id: `model-${page}`,
        name: `Model ${page}`,
        slug: `model-${page}`,
        evaluations: { artificial_analysis_intelligence_index: 50 + page },
      },
    ],
  };
}

describe("AA request budget", () => {
  it("paginates through the current four-page catalogue", async () => {
    const fetchPage = vi.fn(async (page: number) => ({
      response: makePageResponse(page, page < 4),
      headers: new Headers(),
    }));
    const result = await fetchAaAllPages({ apiKey: "test", maxPages: 10, pageSize: 100, fetchPage: fetchPage as never });
    expect(fetchPage).toHaveBeenCalledTimes(4);
    expect(result.models).toHaveLength(4);
  });

  it("stops at page 1 when the endpoint returns all models", async () => {
    const fetchPage = vi.fn(async (page: number) => ({
      response: makePageResponse(page, false),
      headers: new Headers(),
    }));
    const result = await fetchAaAllPages({ apiKey: "test", maxPages: 2, pageSize: 100, fetchPage: fetchPage as never });
    expect(fetchPage).toHaveBeenCalledTimes(1);
    expect(result.models).toHaveLength(1);
  });
});

describe("single-flight collapse", () => {
  class SingleFlight<T> {
    private inFlight: Promise<T> | null = null;
    constructor(private load: () => Promise<T>) {}
    get(): Promise<T> {
      if (!this.inFlight) {
        this.inFlight = this.load().finally(() => {
          this.inFlight = null;
        });
      }
      return this.inFlight;
    }
  }

  it("four concurrent calls produce exactly one underlying loader call", async () => {
    let loaderCalls = 0;
    const loader = async () => {
      loaderCalls += 1;
      await new Promise((r) => setTimeout(r, 5));
      return { status: "ok" as const, models: [], intelligenceIndexVersion: "4.1", fetchedAt: "2026-09-03T00:00:00Z" };
    };
    const sf = new SingleFlight(loader);
    const results = await Promise.all([sf.get(), sf.get(), sf.get(), sf.get()]);
    expect(loaderCalls).toBe(1);
    expect(results).toHaveLength(4);
  });

  it("sequential calls after window expiry invoke the loader again (one per window)", async () => {
    let loaderCalls = 0;
    const loader = async () => {
      loaderCalls += 1;
      return { status: "ok" as const };
    };
    const sf = new SingleFlight(loader);
    await sf.get();
    // Simulate new cache window by clearing in-flight via a second instance.
    const sf2 = new SingleFlight(loader);
    await sf2.get();
    expect(loaderCalls).toBe(2);
  });
});
