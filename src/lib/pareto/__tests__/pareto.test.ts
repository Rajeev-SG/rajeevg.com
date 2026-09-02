import { describe, expect, it } from "vitest";
import { dominates, computePareto } from "../pareto";
import type { CanonicalModel } from "../types";

function mkModel(partial: Partial<CanonicalModel> & { canonicalId: string }): CanonicalModel {
  return {
    displayName: partial.canonicalId,
    organisation: "Test",
    canonicalId: partial.canonicalId,
    releaseDate: null,
    aa: partial.aa ?? { intelligenceIndex: null, codingIndex: null, agenticIndex: null, costPerTaskUsd: null, throughputTokensPerSecond: null, latencyTtfbSeconds: null, intelligenceIndexVersion: null },
    openrouter: partial.openrouter ?? null,
    arena: partial.arena ?? { overall: null, webdev: null, agent: null },
  };
}

describe("Pareto dominance", () => {
  it("clearly dominated model is not on frontier", () => {
    const a = mkModel({ canonicalId: "a", openrouter: { modelId: "a", inputPricePerMillion: 1, outputPricePerMillion: 2, contextLength: null, createdAtUnix: null }, aa: { intelligenceIndex: 50, codingIndex: null, agenticIndex: null, costPerTaskUsd: null, throughputTokensPerSecond: null, latencyTtfbSeconds: null, intelligenceIndexVersion: null } });
    const b = mkModel({ canonicalId: "b", openrouter: { modelId: "b", inputPricePerMillion: 5, outputPricePerMillion: 10, contextLength: null, createdAtUnix: null }, aa: { intelligenceIndex: 40, codingIndex: null, agenticIndex: null, costPerTaskUsd: null, throughputTokensPerSecond: null, latencyTtfbSeconds: null, intelligenceIndexVersion: null } });
    const result = computePareto([a, b], "aa_intelligence", "or_input_per_million");
    expect(result.frontierIds).toEqual(["a"]);
    expect(result.points.find(p => p.canonicalId === "b")?.onFrontier).toBe(false);
  });

  it("same quality but cheaper dominates", () => {
    const a = mkModel({ canonicalId: "a", openrouter: { modelId: "a", inputPricePerMillion: 1, outputPricePerMillion: 2, contextLength: null, createdAtUnix: null }, aa: { intelligenceIndex: 50, codingIndex: null, agenticIndex: null, costPerTaskUsd: null, throughputTokensPerSecond: null, latencyTtfbSeconds: null, intelligenceIndexVersion: null } });
    const b = mkModel({ canonicalId: "b", openrouter: { modelId: "b", inputPricePerMillion: 3, outputPricePerMillion: 2, contextLength: null, createdAtUnix: null }, aa: { intelligenceIndex: 50, codingIndex: null, agenticIndex: null, costPerTaskUsd: null, throughputTokensPerSecond: null, latencyTtfbSeconds: null, intelligenceIndexVersion: null } });
    const result = computePareto([a, b], "aa_intelligence", "or_input_per_million");
    expect(result.frontierIds).toEqual(["a"]);
  });

  it("same cost but higher quality dominates", () => {
    const a = mkModel({ canonicalId: "a", openrouter: { modelId: "a", inputPricePerMillion: 2, outputPricePerMillion: 2, contextLength: null, createdAtUnix: null }, aa: { intelligenceIndex: 55, codingIndex: null, agenticIndex: null, costPerTaskUsd: null, throughputTokensPerSecond: null, latencyTtfbSeconds: null, intelligenceIndexVersion: null } });
    const b = mkModel({ canonicalId: "b", openrouter: { modelId: "b", inputPricePerMillion: 2, outputPricePerMillion: 2, contextLength: null, createdAtUnix: null }, aa: { intelligenceIndex: 50, codingIndex: null, agenticIndex: null, costPerTaskUsd: null, throughputTokensPerSecond: null, latencyTtfbSeconds: null, intelligenceIndexVersion: null } });
    const result = computePareto([a, b], "aa_intelligence", "or_input_per_million");
    expect(result.frontierIds).toEqual(["a"]);
  });

  it("identical points are both on the frontier (no strict dominance either way)", () => {
    const a = mkModel({ canonicalId: "a", openrouter: { modelId: "a", inputPricePerMillion: 2, outputPricePerMillion: 2, contextLength: null, createdAtUnix: null }, aa: { intelligenceIndex: 50, codingIndex: null, agenticIndex: null, costPerTaskUsd: null, throughputTokensPerSecond: null, latencyTtfbSeconds: null, intelligenceIndexVersion: null } });
    const b = mkModel({ canonicalId: "b", openrouter: { modelId: "b", inputPricePerMillion: 2, outputPricePerMillion: 2, contextLength: null, createdAtUnix: null }, aa: { intelligenceIndex: 50, codingIndex: null, agenticIndex: null, costPerTaskUsd: null, throughputTokensPerSecond: null, latencyTtfbSeconds: null, intelligenceIndexVersion: null } });
    const result = computePareto([a, b], "aa_intelligence", "or_input_per_million");
    expect(result.frontierIds).toContain("a");
    expect(result.frontierIds).toContain("b");
  });

  it("models missing metrics do not participate in that frontier", () => {
    const a = mkModel({ canonicalId: "a", openrouter: { modelId: "a", inputPricePerMillion: 1, outputPricePerMillion: 2, contextLength: null, createdAtUnix: null }, aa: { intelligenceIndex: 50, codingIndex: null, agenticIndex: null, costPerTaskUsd: null, throughputTokensPerSecond: null, latencyTtfbSeconds: null, intelligenceIndexVersion: null } });
    const b = mkModel({ canonicalId: "b", openrouter: null, aa: { intelligenceIndex: 90, codingIndex: null, agenticIndex: null, costPerTaskUsd: null, throughputTokensPerSecond: null, latencyTtfbSeconds: null, intelligenceIndexVersion: null } });
    const result = computePareto([a, b], "aa_intelligence", "or_input_per_million");
    expect(result.points).toHaveLength(1);
    expect(result.points[0].canonicalId).toBe("a");
    expect(result.frontierIds).toEqual(["a"]);
  });

  it("dominates() unit cases", () => {
    expect(dominates({ q: 5, c: 1 }, { q: 4, c: 2 })).toBe(true);
    expect(dominates({ q: 4, c: 2 }, { q: 4, c: 2 })).toBe(false);
    expect(dominates({ q: 3, c: 1 }, { q: 4, c: 2 })).toBe(false);
    expect(dominates({ q: 4, c: 1 }, { q: 3, c: 2 })).toBe(true);
    expect(dominates({ q: 4, c: 2 }, { q: 3, c: 1 })).toBe(false);
  });
});
