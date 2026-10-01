/**
 * gh-198 regression tests for the completeness/health layer (gh-172).
 *
 * These tests encode the reproduced failure class: a refresh can succeed with
 * a fresh timestamp while the published catalogue is materially incomplete,
 * because upstream-scored models silently fail the canonical join. The guard
 * must reject that class BEFORE publication so the last-known-good snapshot
 * survives.
 */
import { describe, expect, it } from "vitest";
import {
  completenessGuard,
  joinAudit,
  classifyAaUnmatched,
  DEFAULT_THRESHOLDS,
  type CompletenessStats,
} from "../completeness";
import type { CanonicalModel } from "../types";

function canonicalModel(canonicalId: string, overrides: Partial<CanonicalModel> = {}): CanonicalModel {
  return {
    canonicalId,
    displayName: canonicalId,
    organisation: "OpenAI",
    releaseDate: null,
    aa: {
      slug: null,
      intelligenceIndex: null,
      codingIndex: null,
      agenticIndex: null,
      costPerTaskUsd: null,
      throughputTokensPerSecond: null,
      latencyTtfbSeconds: null,
      intelligenceIndexVersion: null,
    },
    openrouter: null,
    arena: { overall: null, webdev: null, agent: null },
    ...overrides,
  };
}

describe("completeness guard (gh-172)", () => {
  it("accepts a healthy catalogue (coverage above threshold)", () => {
    const stats: CompletenessStats = {
      upstreamModelCount: 687,
      canonicalCount: 400,
      qualityScoredCount: 400,
      unmatched: [],
    };
    const result = completenessGuard(stats, { ...DEFAULT_THRESHOLDS, minAaCoverage: 0.5 });
    expect(result.ok).toBe(true);
    expect(result.findings).toEqual([]);
  });

  it("REJECTS the reproduced failure class: fresh timestamp, collapsed coverage", () => {
    // Real-world reproduction (gh-172/gh-198): 687 AA upstream records, only
    // 66 alias-matched → 134 quality-scored published models ≈ 19.5% coverage.
    const stats: CompletenessStats = {
      upstreamModelCount: 687,
      canonicalCount: 159,
      qualityScoredCount: 134,
      unmatched: [],
    };
    const result = completenessGuard(stats, { ...DEFAULT_THRESHOLDS, minAaCoverage: 0.5 });
    expect(result.ok).toBe(false);
    expect(result.findings.map((f) => f.check)).toContain("aa_coverage");
  });

  it("rejects an absolute collapse below the quality floor even when upstream is small", () => {
    const stats: CompletenessStats = {
      upstreamModelCount: 30,
      canonicalCount: 3,
      qualityScoredCount: 3,
      unmatched: [],
    };
    const result = completenessGuard(stats, DEFAULT_THRESHOLDS);
    expect(result.ok).toBe(false);
    expect(result.findings.map((f) => f.check)).toContain("aa_quality_floor");
  });

  it("does not divide by zero when upstream returned nothing", () => {
    const stats: CompletenessStats = {
      upstreamModelCount: 0,
      canonicalCount: 0,
      qualityScoredCount: 0,
      unmatched: [],
    };
    const result = completenessGuard(stats, DEFAULT_THRESHOLDS);
    // No coverage finding; the absolute floor still applies.
    expect(result.findings.map((f) => f.check)).toEqual(["aa_quality_floor"]);
  });
});

describe("join audit (gh-172)", () => {
  it("flags AA quality without an AA slug (join-layer regression)", () => {
    const models = [
      canonicalModel("openai-gpt-6-sol", {
        aa: {
          slug: null,
          intelligenceIndex: 47.5,
          codingIndex: null,
          agenticIndex: null,
          costPerTaskUsd: null,
          throughputTokensPerSecond: null,
          latencyTtfbSeconds: null,
          intelligenceIndexVersion: null,
        },
      }),
    ];
const problems = joinAudit(models);
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain("openai-gpt-6-sol");
    expect(problems[0]).toContain("quality metrics without an AA slug");
  });

  it("flags an OpenRouter record with both prices null (price-join regression)", () => {
    const models = [
      canonicalModel("xiaomi-mimo-v2.6-pro", {
        openrouter: {
          modelId: "xiaomi/mimo-v2.6-pro",
          inputPricePerMillion: null,
          outputPricePerMillion: null,
          contextLength: 200000,
          createdAtUnix: null,
        },
      }),
    ];
    const problems = joinAudit(models);
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain("OpenRouter record with both prices null");
  });

  it("accepts clean models", () => {
    const models = [
      canonicalModel("xiaomi-mimo-v2.6-pro", {
        aa: {
          slug: "mimo-v2-6-pro",
          intelligenceIndex: 46.3,
          codingIndex: null,
          agenticIndex: null,
          costPerTaskUsd: null,
          throughputTokensPerSecond: null,
          latencyTtfbSeconds: null,
          intelligenceIndexVersion: "v3",
        },
        openrouter: {
          modelId: "xiaomi/mimo-v2.6-pro",
          inputPricePerMillion: 0.435,
          outputPricePerMillion: 1.74,
          contextLength: 200000,
          createdAtUnix: 1790021259,
        },
      }),
    ];
    expect(joinAudit(models)).toEqual([]);
  });
});

describe("unmatched diagnostics classification (gh-172)", () => {
  const knownOrgs = new Set(["OpenAI", "Anthropic", "xAI", "Xiaomi", "DeepSeek"]);
  const knownSlugs = new Set(["gpt-6-astra", "claude-opus-5-5"]);

  it("classifies an unmapped org as org_unknown (e.g. Xiaomi before the map fix)", () => {
    const d = classifyAaUnmatched({
      slug: "mimo-v2-6-pro",
      creatorName: "Xiaomi",
      knownOrgDisplayNames: new Set(["OpenAI", "Anthropic", "xAI"]),
      knownAaSlugs: knownSlugs,
    });
    expect(d.reasonCode).toBe("org_unknown");
    expect(d.org).toBe("Xiaomi");
  });

  it("classifies a documented-alias creator as creator_name_mismatch (org is known, name diverged)", () => {
    // Live case: AA renamed the xAI creator to "SpaceXAI". The org resolves
    // through the documented alias table, but the raw creator name no longer
    // equals the org display name — exactly what auto-join's equality check
    // rejects, so the record is classified as a creator-name mismatch.
    const d = classifyAaUnmatched({
      slug: "grok-4-7",
      creatorName: "SpaceXAI",
      knownOrgDisplayNames: knownOrgs,
      knownAaSlugs: knownSlugs,
      knownCreatorAliases: new Map([["xAI", ["SpaceXAI"]]]),
    });
    expect(d.reasonCode).toBe("creator_name_mismatch");
    expect(d.org).toBe("xAI");
  });

  it("classifies a documented creator alias as resolvable (not org_unknown)", () => {
    const d = classifyAaUnmatched({
      slug: "grok-4-7",
      creatorName: "SpaceXAI",
      knownOrgDisplayNames: knownOrgs,
      knownAaSlugs: knownSlugs,
      knownCreatorAliases: new Map([["xAI", ["SpaceXAI"]]]),
    });
    expect(d.reasonCode).not.toBe("org_unknown");
  });

  it("flags a mapped slug that still failed as not_in_alias_map (regression signal)", () => {
    const d = classifyAaUnmatched({
      slug: "gpt-6-astra",
      creatorName: "OpenAI",
      knownOrgDisplayNames: knownOrgs,
      knownAaSlugs: knownSlugs,
    });
    expect(d.reasonCode).toBe("not_in_alias_map");
  });
});
