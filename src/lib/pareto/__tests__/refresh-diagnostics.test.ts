/**
 * Offline smoke tests for scripts/refresh-pareto-aa.ts: verifies the full
 * refresh pipeline (fetch → map → auto-join → backfill → guard → diagnostics)
 * runs end-to-end with injected fetch fixtures, and that the real wiring —
 * not hand-fed values — produces the classified reason codes.
 *
 * The script writes its artefacts relative to process.cwd(); every test runs
 * inside its own temporary directory, so the checked-in bundled fallback
 * (src/data/pareto-aa-fallback.json) is never touched.
 */
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, existsSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
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
    {
      // AA counterpart for the unknown-org OR record: identity matches
      // brand-new-org/mystery-model but the creator is not in any map.
      id: "aa-mystery",
      name: "Mystery Model (Max)",
      slug: "mystery-model",
      release_date: "2026-09-30",
      model_creator: { name: "Brand New Org" },
      evaluations: { artificial_analysis_intelligence_index: 40.0 },
      pricing: { price_1m_input_tokens: 1, price_1m_output_tokens: 4 },
    },
    {
      // AA counterpart for the OR creator-mismatch case: org slug "x-ai" is
      // known (xAI) but the creator name matches neither "xAI" nor the
      // documented "SpaceXAI" alias.
      id: "aa-grok-4-8",
      name: "Grok 4.8 (Xhigh)",
      slug: "grok-4-8",
      release_date: "2026-09-30",
      model_creator: { name: "xAI Legacy Group" },
      evaluations: { artificial_analysis_intelligence_index: 44.0 },
      pricing: { price_1m_input_tokens: 2, price_1m_output_tokens: 6 },
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
      // gh-198 pricing-backfill regression: the alias entry openai-gpt-6-astra
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
    {
      // OR record whose AA counterpart exists but whose org is unknown: must
      // surface as org_unknown (the pre-fix Xiaomi shape, through real wiring).
      id: "brand-new-org/mystery-model",
      name: "Brand New Org: Mystery Model",
      created: 1790700000,
      context_length: 200000,
      pricing: { prompt: "0.000001", completion: "0.000004" },
    },
    {
      // OR record whose AA counterpart exists, org known, but the AA creator
      // name matches neither the display name nor a documented alias: must
      // surface as creator_name_mismatch through real wiring.
      id: "x-ai/grok-4.8",
      name: "xAI: Grok 4.8",
      created: 1790800000,
      context_length: 500000,
      pricing: { prompt: "0.000002", completion: "0.000006" },
    },
  ],
};

let workDir: string;
const originalCwd = process.cwd();

describe("refresh script end-to-end (gh-198)", () => {
  beforeEach(() => {
    workDir = mkdtempSync(join(tmpdir(), "pareto-refresh-"));
    process.chdir(workDir);
    process.env.ARTIFICIAL_ANALYSIS_API_KEY_PF = "test-key";
    // Small fixture: relax the quality floor for these offline smoke tests.
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
    delete process.env.PARETO_MAX_CREATOR_MISMATCHES;
    process.chdir(originalCwd);
    if (workDir) rmSync(workDir, { recursive: true, force: true });
  });

  it("auto-joins canaries, backfills alias-model pricing, and classifies every unmatched record", async () => {
    // Tolerate the deliberate creator-mismatch fixture record so the
    // classification paths can be observed without failing the guard.
    process.env.PARETO_MAX_CREATOR_MISMATCHES = "99";
    vi.resetModules();
    const mod = await import("../../../../../scripts/refresh-pareto-aa");
    await expect(mod.refreshMain()).resolves.toBeUndefined();
    const snapshot = JSON.parse(readFileSync(join(workDir, "src/data/pareto-aa-fallback.json"), "utf8"));
    const diagnostics = JSON.parse(readFileSync(join(workDir, "pareto-diagnostics.json"), "utf8"));
    const byId = new Map(snapshot.models.map((m: { canonicalId: string }) => [m.canonicalId, m]));

    // The two live canary join misses are fixed.
    const mimo = byId.get("xiaomi-mimo-v2.6-pro");
    expect(mimo).toBeDefined();
    expect(mimo.aa.intelligenceIndex).toBe(46.32);
    expect(mimo.openrouter.inputPricePerMillion).toBeCloseTo(0.435, 5);
    expect(byId.get("x-ai-grok-4.7")).toBeDefined();

    // gh-198 pricing backfill: alias-matched GPT-6 Astra gains OR pricing
    // through the single backfill merge site.
    const astra = byId.get("openai-gpt-6-astra");
    expect(astra).toBeDefined();
    expect(astra.openrouter.modelId).toBe("openai/gpt-6-astra");
    expect(astra.openrouter.inputPricePerMillion).toBeCloseTo(1.25, 5);

    // Diagnostics classification through the REAL wiring:
    const reasonOf = (id: string) => diagnostics.diagnostics.find((d: { sourceId: string }) => d.sourceId === id)?.reasonCode;
    expect(reasonOf("z-ai/glm-5.3-flashx")).toBe("no_aa_counterpart");
    expect(reasonOf("brand-new-org/mystery-model")).toBe("org_unknown");
    expect(reasonOf("x-ai/grok-4.8")).toBe("creator_name_mismatch");
    // No undifferentiated blobs anywhere in the queue.
    expect(diagnostics.diagnostics.filter((d: { reasonCode: string }) => d.reasonCode === "not_in_alias_map")).toHaveLength(0);
  });

  it("REJECTS the refresh when a known org's records fail creator verification (production defaults)", async () => {
    // No threshold overrides: maxCreatorNameMismatches defaults to 0. The
    // Grok-4.8 fixture record reproduces the Grok-4.7 silent-drop class.
    vi.resetModules();
    const mod = await import("../../../../../scripts/refresh-pareto-aa");
    await expect(mod.refreshMain()).rejects.toThrow(/creator_name_mismatch/);
    // The snapshot never publishes on rejection (last-known-good preserved)…
    expect(existsSync(join(workDir, "src/data/pareto-aa-fallback.json"))).toBe(false);
    // …but the triage trail is always written, even on rejection.
    const diagnostics = JSON.parse(readFileSync(join(workDir, "pareto-diagnostics.json"), "utf8"));
    const reasonOf = (id: string) => diagnostics.diagnostics.find((d: { sourceId: string }) => d.sourceId === id)?.reasonCode;
    expect(reasonOf("x-ai/grok-4.8")).toBe("creator_name_mismatch");
  });
});
