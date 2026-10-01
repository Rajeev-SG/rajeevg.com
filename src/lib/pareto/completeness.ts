/**
 * Catalogue completeness and canonical-join health checks for the Pareto
 * pipeline (gh-198, implementing gh-172).
 *
 * Background: a refresh can succeed end-to-end — valid HTTP responses, a fresh
 * timestamp, a published durable snapshot — while the resulting catalogue is
 * still materially incomplete, because identity resolution silently drops
 * records that upstream scores. A successful timestamp must not be able to
 * mask a materially incomplete catalogue.
 *
 * This module is pure and synchronous so it is directly testable (vitest) and
 * can be reused by the refresh script, the publish guard, and the aggregate
 * layer. It never decides identity itself — it reports what the join layer
 * produced.
 */
import type { CanonicalModel, UnmatchedRecord } from "./types";

/** Name of the live AA catalogue referenced in provenance. */
export const AA_UPSTREAM_LABEL = "Artificial Analysis API v2 /language/models/free";

/** Machine-readable failure classes for unmatched upstream records. */
export type UnmatchedReason =
  | "not_in_alias_map"
  | "org_unknown"
  | "creator_name_mismatch"
  | "variant_excluded";

/** One upstream record that did not enter the canonical model set. */
export interface UnmatchedDiagnostic {
  source: "aa" | "openrouter";
  sourceId: string;
  displayName: string | null;
  /** Why the canonical join layer could not place this record. */
  reasonCode: UnmatchedReason;
  /** Only the org-related miss exposes which org was rejected (privacy-free telemetry). */
  org?: string;
}

/** Aggregate completeness counters for one refresh run. */
export interface CompletenessStats {
  upstreamModelCount: number;
  canonicalCount: number;
  qualityScoredCount: number;
  unmatched: UnmatchedDiagnostic[];
}

/** Thresholds for the catalogue completeness guard. */
export interface CompletenessThresholds {
  /** Minimum fraction of AA upstream models with a non-null quality metric. */
  minAaCoverage: number;
  /** Absolute minimum of AA-quality-scored canonical models (small-catalogue backstop). */
  minAaQualityCount: number;
}

export const DEFAULT_THRESHOLDS: CompletenessThresholds = {
  minAaCoverage: 0.5,
  minAaQualityCount: 20,
};

/** Failure detail for the completeness guard. */
export interface CompletenessFinding {
  check: "aa_coverage" | "aa_quality_floor";
  detail: string;
  observed: number;
  threshold: number;
}

/**
 * Completeness guard: rejects a snapshot whose AA-quality coverage collapsed
 * relative to the upstream AA catalogue. This is the "successful timestamp
 * must not mask an incomplete catalogue" check — it fails loudly (non-zero
 * exit / thrown error in the refresh workflow) BEFORE publication, so the
 * last-known-good durable snapshot is preserved.
 */
export function completenessGuard(
  stats: CompletenessStats,
  thresholds: CompletenessThresholds = DEFAULT_THRESHOLDS
): { ok: boolean; findings: CompletenessFinding[] } {
  const findings: CompletenessFinding[] = [];
  const { upstreamModelCount, qualityScoredCount } = stats;

  if (upstreamModelCount > 0) {
    const coverage = qualityScoredCount / upstreamModelCount;
    if (coverage < thresholds.minAaCoverage) {
      findings.push({
        check: "aa_coverage",
        detail:
          `only ${qualityScoredCount}/${upstreamModelCount} AA upstream models ` +
          `carried a non-null quality metric into the snapshot (${(coverage * 100).toFixed(1)}% coverage)`,
        observed: qualityScoredCount,
        threshold: Math.ceil(thresholds.minAaCoverage * upstreamModelCount),
      });
    }
  }

  if (qualityScoredCount < thresholds.minAaQualityCount) {
    findings.push({
      check: "aa_quality_floor",
      detail: `quality-scored canonical models fell below the absolute floor`,
      observed: qualityScoredCount,
      threshold: thresholds.minAaQualityCount,
    });
  }

  return { ok: findings.length === 0, findings };
}

/**
 * Canonical-join audit: every record the canonical join layer produced must
 * be internally consistent. A model is "quality orphed" if it carries AA
 * quality metrics but has no AA slug (impossible via auto-join, which always
 * sets the slug) — and a model must not claim an AA slug while every quality
 * metric is null if it also has no other data. These are cheap, deterministic
 * invariants that catch future join-layer regressions.
 */
export function joinAudit(models: CanonicalModel[]): string[] {
  const problems: string[] = [];
  for (const m of models) {
    const quality = m.aa.intelligenceIndex != null || m.aa.codingIndex != null || m.aa.agenticIndex != null;
    if (quality && m.aa.slug == null) {
      problems.push(`${m.canonicalId}: quality metrics without an AA slug`);
    }
    if (!quality && m.aa.slug != null && m.openrouter == null && m.arena.overall == null) {
      problems.push(`${m.canonicalId}: AA slug but no metrics and no other source data`);
    }
    if (m.openrouter && m.openrouter.inputPricePerMillion == null && m.openrouter.outputPricePerMillion == null) {
      problems.push(`${m.canonicalId}: OpenRouter record with both prices null`);
    }
  }
  return problems;
}

/**
 * Structural org metadata: AA creator names keyed by the canonical
 * organisation name (mirrors auto-discover's ORG_BY_OR_SLUG display names).
 * Used to classify unmatched records by failure class and to keep the org
 * map's identity contract visible to the completeness checks.
 */
export const AA_CREATOR_BY_ORG: Record<string, string> = {
  OpenAI: "OpenAI",
  Anthropic: "Anthropic",
  Meta: "Meta",
  Google: "Google",
  "SpaceXAI": "SpaceXAI",
  DeepSeek: "DeepSeek",
  "Z.ai": "Z AI",
  Xiaomi: "Xiaomi",
  Alibaba: "Alibaba",
  Mistral: "Mistral",
  MiniMax: "MiniMax",
  "Moonshot AI": "Kimi",
  NVIDIA: "NVIDIA",
  Perplexity: "Perplexity",
  Amazon: "Amazon",
  Microsoft: "Microsoft",
  Cohere: "Cohere",
  Inception: "Inception",
  OpenRouter: "OpenRouter",
  "Nous Research": "Nous Research",
  "Thinking Machines": "Thinking Machines",
  Upstage: "Upstage",
  Tencent: "Tencent",
  Poolside: "Poolside",
};

/**
 * Classify why an AA record failed to enter the canonical set, given the
 * deterministic join rules used by auto-discover. Pure and shared by the
 * refresh diagnostics and the alias-drift regression tests.
 */
export function classifyAaUnmatched(input: {
  slug: string;
  creatorName: string | null;
  knownOrgDisplayNames: Set<string>;
  /** AA slugs explicitly mapped in the alias map (lower-cased). */
  knownAaSlugs: Set<string>;
  /** Documented AA-side aliases per organisation display name (e.g. xAI: SpaceXAI). */
  knownCreatorAliases?: Map<string, string[]>;
}): UnmatchedDiagnostic {
  if (input.knownAaSlugs.has(input.slug.toLowerCase())) {
    // Should have matched; reaching here means a join-layer regression.
    return { source: "aa", sourceId: input.slug, displayName: input.creatorName, reasonCode: "not_in_alias_map" };
  }
  const creator = input.creatorName ?? "";
  const aliases = input.knownCreatorAliases ?? new Map();
  const canonicalOrg = [...input.knownOrgDisplayNames].find((org) => {
    const acceptable = [org, ...(aliases.get(org) ?? [])].map((n) => n.toLowerCase());
    return acceptable.includes(creator.toLowerCase());
  });
  if (!canonicalOrg) {
    return {
      source: "aa",
      sourceId: input.slug,
      displayName: input.creatorName,
      reasonCode: "org_unknown",
      org: creator || undefined,
    };
  }
  if (creator.toLowerCase() !== canonicalOrg.toLowerCase()) {
    // Org is known but the upstream name diverges — join would reject it.
    return {
      source: "aa",
      sourceId: input.slug,
      displayName: input.creatorName,
      reasonCode: "creator_name_mismatch",
      org: canonicalOrg,
    };
  }
  return {
    source: "aa",
    sourceId: input.slug,
    displayName: input.creatorName,
    reasonCode: "creator_name_mismatch",
    org: canonicalOrg,
  };
}
