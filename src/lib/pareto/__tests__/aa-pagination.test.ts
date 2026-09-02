import { describe, expect, it } from "vitest";
import { fetchAaAllPages, mapAaModels } from "../artificial-analysis";
import type { Headers } from "node-fetch-native";

function mkHeaders(remaining: string | null = null): Headers {
  const h = new Map<string, string>();
  if (remaining) h.set("X-RateLimit-Remaining", remaining);
  return {
    get: (k: string) => h.get(k) ?? null,
    has: (k: string) => h.has(k),
  } as unknown as Headers;
}

function mkPageResponse(pageNum: number, totalPages: number, hasMore: boolean, slugs: string[]) {
  return {
    tier: "free",
    intelligence_index_version: "4.1",
    pagination: { page: pageNum, page_size: 2, total_pages: totalPages, has_more: hasMore },
    data: slugs.map((slug, i) => ({
      id: slug,
      name: slug,
      slug,
      release_date: "2025-01-01",
      model_creator: { name: "Test" },
      evaluations: { intelligence_index: 40 + i },
      intelligence_index_cost: { cost_per_task: { total_cost: 0.01 * (i + 1) } },
      pricing: { price_1m_input_tokens: 1, price_1m_output_tokens: 2 },
      performance: { median_output_tokens_per_second: 100, median_time_to_first_token_seconds: 0.5 },
    })),
  };
}

describe("AA pagination", () => {
  it("iterates until has_more=false", async () => {
    const pages = [
      mkPageResponse(1, 3, true, ["gpt-5", "gpt-5-mini"]),
      mkPageResponse(2, 3, true, ["claude-opus-4.1", "claude-sonnet-4.5"]),
      mkPageResponse(3, 3, false, ["gemini-2.5-pro"]),
    ];
    let calls = 0;
    const fetchPage = async () => {
      const resp = pages[calls++];
      return { response: resp, headers: mkHeaders(String(100 - calls)) };
    };
    const result = await fetchAaAllPages({ apiKey: "test", fetchPage });
    expect(calls).toBe(3);
    expect(result.models).toHaveLength(5);
    expect(result.pagination.totalPages).toBe(3);
  });

  it("stops when rate limit remaining is exhausted", async () => {
    const pages = [mkPageResponse(1, 2, true, ["gpt-5"])];
    let calls = 0;
    const fetchPage = async () => {
      calls++;
      return { response: pages[0], headers: mkHeaders("0") };
    };
    const result = await fetchAaAllPages({ apiKey: "test", fetchPage });
    expect(calls).toBe(1);
    expect(result.models).toHaveLength(1);
  });

  it("maps AA models into canonical form using alias map", async () => {
    const result = await fetchAaAllPages({ apiKey: "test", fetchPage: async () => ({ response: mkPageResponse(1, 1, false, ["gpt-5", "unknown-model"]), headers: mkHeaders() }) });
    const { matched, unmatched } = mapAaModels(result.models, "4.1");
    expect(matched.get("openai-gpt-5")).toBeTruthy();
    expect(unmatched).toHaveLength(1);
    expect(unmatched[0].sourceId).toBe("unknown-model");
    expect(matched.get("openai-gpt-5")!.aa!.intelligenceIndex).toBe(40);
  });
});
