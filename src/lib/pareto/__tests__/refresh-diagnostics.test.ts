/**
 * Offline smoke test for scripts/refresh-pareto-aa.ts: verifies the full
 * refresh pipeline (fetch → map → auto-join → guard → diagnostics) runs and
 * produces the new diagnostics artefacts, using injected fetch fixtures.
 *
 * The AA upstream returns an artificially small catalogue in this fixture so
 * the test stays fast and quota-free.
 */
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import type { AaResponse } from "../../lib/pareto/artificial-analysis";

const AA_FIXTURE: AaResponse = {
  tier: "free",
  intelligence_index_version: "v3",
  pagination: { page: 1, page_size: 200, total_pages: 1, has_more: false },
  data: [
    {
      id: "aa-mimo",
      name: "MiMo-V2.6-Pro",
      slug: "mimo-v2-6-pro",
      release_date: "2026-09-21",
      model_creator: { name: "Xiaomi" },
      evaluations: { artificial_analysis_intelligence_index: 46.32 },
      pricing: { price_1m_input_tokens: 0.435, price_1m_output_tokens: 1.74 },
    },
    {
      id: "aa-grok",
      name: "Grok 4.7 (Xhigh)",
      slug: "grok-4-7",
      release_date: "2026-09-21",
      model_creator: { name: "SpaceXAI" },
      evaluations: { artificial_analysis_intelligence_index: 46.45 },
      pricing: { price_1m_input_tokens: 2, price_1m_output_tokens: 6 },
    },
    {
      // One explicitly aliased model so the pre-join quality gate has a
      // matched record (mirrors the real catalogue, where a stable core of
      // alias-mapped models coexists with newly-discovered ones).
      id: "aa-astra",
      name: "GPT-6 Astra (Max)",
      slug: "gpt-6-astra",
      release_date: "2026-09-03",
      model_creator: { name: "OpenAI" },
      evaluations: { artificial_analysis_intelligence_index: 52.7 },
      pricing: { price_1m_input_tokens: 1.25, price_1m_output_tokens: 10 },
    },
  ],
};

const OR_FIXTURE = {
  data: [
    {
      id: "xiaomi/mimo-v2.6-pro",
      name: "Xiaomi: MiMo-V2.6 Pro",
      created: 1790021259,
      context_length: 200000,
      pricing: { prompt: "0.000000435", completion: "0.00000174" },
    },
    {
      id: "x-ai/grok-4.7",
      name: "xAI: Grok 4.7",
      created: 1790007541,
      context_length: 500000,
      pricing: { prompt: "0.000002", completion: "0.000006" },
    },
    {
      // gh-198 pricing-merge regression: the alias entry openai-gpt-6-astra
      // carries no openrouterId, so the AA-side alias match used to skip the
      // join and silently lose this pricing.
      id: "openai/gpt-6-astra",
      name: "OpenAI: GPT-6 Astra",
      created: 1788500000,
      context_length: 400000,
      pricing: { prompt: "0.00000125", completion: "0.00001" },
    },
    {
      // OR-only model (no AA record): must surface as no_aa_counterpart.
      id: "z-ai/glm-5.3-flashx",
      name: "Z.ai: GLM-5.3 FlashX",
      created: 1789744020,
      context_length: 1000000,
      pricing: { prompt: "0.00000037", completion: "0.00000148" },
    },
  ],
};

describe("refresh script end-to-end (gh-198)", () => {
  beforeEach(() => {
    process.env.ARTIFICIAL_ANALYSIS_API_KEY_PF = "test-key";
    // Small fixture: relax the quality floor for this offline smoke test.
    process.env.PARETO_MIN_AA_QUALITY = "1";
    process.env.PARETO_MIN_AA_COVERAGE = "0.3";
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string | URL) => {
        const u = String(url);
        if (u.includes("artificialanalysis.ai")) {
          return new Response(JSON.stringify(AA_FIXTURE), {
            status: 200,
            headers: { "content-type": "application/json", "X-RateLimit-Remaining": "90" },
          });
        }
        return new Response(JSON.stringify(OR_FIXTURE), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      })
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.ARTIFICIAL_ANALYSIS_API_KEY_PF;
    delete process.env.PARETO_MIN_AA_QUALITY;
    delete process.env.PARETO_MIN_AA_COVERAGE;
  });

  it("auto-joins MiMo-V2.6 and Grok 4.7, merges alias-model pricing, and classifies OR-only records", async () => {
    vi.resetModules();
    const mod = await import("../../../../../scripts/refresh-pareto-aa");
    // The script's main() writes files relative to cwd; run it and then read
    // the artefacts back.
    await expect(mod.refreshMain()).resolves.toBeUndefined();
    const { readFile } = await import("node:fs/promises");
    const { resolve } = await import("node:path");
    const snapshot = JSON.parse(await readFile(resolve(process.cwd(), "src/data/pareto-aa-fallback.json"), "utf8"));
    const diagnostics = JSON.parse(await readFile(resolve(process.cwd(), "pareto-diagnostics.json"), "utf8"));
    const byId = new Map(snapshot.models.map((m: { canonicalId: string }) => [m.canonicalId, m]));
    // The two live canary join misses are fixed.
    const mimo = byId.get("xiaomi-mimo-v2.6-pro");
    expect(mimo).toBeDefined();
    expect(mimo.aa.intelligenceIndex).toBe(46.32);
    expect(mimo.openrouter.inputPricePerMillion).toBeCloseTo(0.435, 5);
    expect(byId.get("x-ai-grok-4.7")).toBeDefined();
    // gh-198 pricing merge: alias-matched GPT-6 Astra gains OR pricing.
    const astra = byId.get("openai-gpt-6-astra");
    expect(astra).toBeDefined();
    expect(astra.openrouter.modelId).toBe("openai/gpt-6-astra");
    expect(astra.openrouter.inputPricePerMillion).toBeCloseTo(1.25, 5);
    // Diagnostics: the OR-only FlashX surfaces with its honest upstream reason.
    const flashx = diagnostics.diagnostics.find(
      (d: { sourceId: string }) => d.sourceId === "z-ai/glm-5.3-flashx"
    );
    expect(flashx).toBeDefined();
    expect(flashx.reasonCode).toBe("no_aa_counterpart");
    // Everything else in this fixture matched — no undifferentiated blob.
    const unexplained = diagnostics.diagnostics.filter(
      (d: { reasonCode: string }) => d.reasonCode === "not_in_alias_map"
    );
    expect(unexplained).toHaveLength(0);
  });
});
