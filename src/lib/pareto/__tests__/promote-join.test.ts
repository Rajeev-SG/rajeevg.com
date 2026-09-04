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
  it("Muse Spark 1.3 is present with correct AA quality and OR pricing", () => {
    expect(muse).toBeDefined();
    expect(muse!.aa.slug).toBe("muse-spark-1-3");
    expect(muse!.aa.intelligenceIndex).toBe(62.1);
    expect(muse!.openrouter?.modelId).toBe("meta/muse-spark-1.3");
    expect(muse!.openrouter?.inputPricePerMillion).toBeCloseTo(1.25, 2);
    expect(muse!.openrouter?.outputPricePerMillion).toBeCloseTo(4.25, 2);
  });

  it("GPT-6 Astra is present as an AA-record-only model with provenance-preserved bundled data", () => {
    expect(muse).toBeDefined();
    const astra = aaFallback.models.find((m) => m.canonicalId === "openai-gpt-6-astra");
    expect(astra).toBeDefined();
    expect(astra!.aa.slug).toBe("gpt-6-astra");
    expect(astra!.aa.intelligenceIndex).toBe(61);
    expect(astra!.aa.costPerTaskUsd).toBeCloseTo(1.67, 2);
    expect(astra!.openrouter).toBeNull();
    expect(astra!.releaseDate).toBeNull();
    expect(aaFallback.provenance.bundledRecords?.some((r) => r.canonicalId === "openai-gpt-6-astra")).toBe(true);
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
