import { describe, expect, it } from "vitest";
import { aaFallback } from "../aa-fallback";
import { computePareto } from "../pareto";
import { resolveAaSlug, resolveOpenRouterId } from "../aliases";
import { parseOrId, orPrimaryId, autoJoin } from "../auto-discover";
import { mapOpenRouterModels } from "../openrouter";
import type { CanonicalModel } from "../types";

const muse: CanonicalModel | undefined = aaFallback.models.find((m) => m.canonicalId === "meta-muse-spark-1.3");
const astra: CanonicalModel | undefined = aaFallback.models.find((m) => m.canonicalId === "openai-gpt-6-astra");

describe("promoted snapshot contract (gh-101)", () => {
  // NOTE: assert the SHAPE of the contract, not upstream metric values. AA
  // re-scores models continuously (Muse Spark 1.3 moved 62.1 -> 48.2 between
  // snapshots), so pinning a literal score turns a routine data refresh into a
  // failing test. The invariants below are what actually must hold.
  it("Muse Spark 1.3 is present with AA quality and OR pricing joined", () => {
    expect(muse).toBeDefined();
    expect(muse!.aa.slug).toBe("muse-spark-1-3");
    expect(typeof muse!.aa.intelligenceIndex).toBe("number");
    expect(muse!.aa.intelligenceIndex).toBeGreaterThan(0);
    expect(muse!.openrouter?.modelId).toBe("meta/muse-spark-1.3");
    expect(muse!.openrouter?.inputPricePerMillion).toBeGreaterThan(0);
    expect(muse!.openrouter?.outputPricePerMillion).toBeGreaterThan(0);
  });

  it("GPT-6 Astra is present as an AA-record-only model (no OpenRouter counterpart)", () => {
    expect(astra).toBeDefined();
    expect(astra!.aa.slug).toBe("gpt-6-astra");
    expect(typeof astra!.aa.intelligenceIndex).toBe("number");
    expect(astra!.aa.intelligenceIndex).toBeGreaterThan(0);
    // AA-record-only: no OpenRouter id maps to it, so pricing must stay null
    // rather than being invented.
    expect(astra!.openrouter).toBeNull();
  });

  it("alias map resolves both models exactly", () => {
    expect(resolveAaSlug("gpt-6-astra")?.canonicalId).toBe("openai-gpt-6-astra");
    expect(resolveAaSlug("muse-spark-1-3")?.canonicalId).toBe("meta-muse-spark-1.3");
    expect(resolveOpenRouterId("meta/muse-spark-1.3")?.canonicalId).toBe("meta-muse-spark-1.3");
    expect(resolveOpenRouterId("openai/gpt-6-astra")).toBeNull();
  });

  it("Muse Spark 1.3 appears on the applicable Pareto frontier", () => {
    const models = aaFallback.models.filter((m) => m.aa.intelligenceIndex != null && (m.openrouter != null || m.aa.costPerTaskUsd != null));
    const result = computePareto(models, "aa_intelligence", "or_blended_per_million");
    const musePoint = result.points.find((p) => p.canonicalId === "meta-muse-spark-1.3");
    expect(musePoint).toBeDefined();
    expect(musePoint!.onFrontier).toBe(true);
  });

  it("GPT-6 Astra is Pareto-efficient on AA cost-per-task frontier", () => {
    const scored = aaFallback.models.filter((m) => m.aa.intelligenceIndex != null && m.aa.costPerTaskUsd != null);
    const result = computePareto(scored, "aa_intelligence", "aa_cost_per_task");
    const astraPoint = result.points.find((p) => p.canonicalId === "openai-gpt-6-astra");
    expect(astraPoint).toBeDefined();
    expect(astraPoint!.onFrontier).toBe(true);
  });

  it("contributor and batch variants are excluded from the promoted snapshot", () => {
    const ids = aaFallback.models.map((m) => m.canonicalId);
    const idsLower = ids.map((id) => id.toLowerCase());
    expect(idsLower.some((id) => id.includes("-contributor") || id.includes(":batch"))).toBe(false);
  });

  it("autoJoin still rejects contributor/batch variants for Muse Spark 1.3", () => {
    expect(parseOrId("meta/muse-spark-1.3-contributor")).toBeNull();
    expect(parseOrId("meta/muse-spark-1.3:batch")).toBeNull();
    const joined = autoJoin(
      { slug: "muse-spark-1-3-xhigh", creatorName: "Meta" },
      { id: "meta/muse-spark-1.3-contributor", name: "Meta: Muse Spark 1.3 Contributor" }
    );
    expect(joined).toBeNull();
  });

  it("mapOpenRouterModels exact-matches alias ids and keeps unknowns unmatched", () => {
    const mapped = mapOpenRouterModels([
      { id: "meta/muse-spark-1.3", name: "Meta: Muse Spark 1.3", canonicalSlug: null, inputPerMillion: 1.25, outputPerMillion: 4.25, contextLength: 1000000, createdAtUnix: 1788378359 },
      { id: "meta/muse-spark-1.3-contributor", name: "Meta: Muse Spark 1.3 Contributor", canonicalSlug: null, inputPerMillion: 0.5, outputPerMillion: 1.5, contextLength: null, createdAtUnix: null },
    ]);
    expect(mapped.matched.has("meta-muse-spark-1.3")).toBe(true);
    expect(mapped.unmatched.some((u) => u.sourceId === "meta/muse-spark-1.3-contributor")).toBe(true);
  });
});
