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
import type { CanonicalModel } from "./types";

/** Machine-readable failure classes for unmatched upstream records. */
export type UnmatchedReason =
  /** AA record with no OR counterpart: only a curated alias can enter it. */
  | "not_in_alias_map"
  /** Join blocked: the OR org slug is not in the closed auto-join map. */
  | "org_unknown"
  /** Join blocked: the AA creator name diverged from the org display name/aliases. */
  | "creator_name_mismatch"
  /** OR record with no AA identity match: no quality source upstream. */
  | "no_aa_counterpart"
  /** Effort-suffix / batch / contributor variant excluded by design. */
  | "variant_excluded";

/** One upstream record that did not enter the canonical model set. */
export interface UnmatchedDiagnostic {
  source: "aa" | "openrouter";
  sourceId: string;
  displayName: string | null;
  /** Why the canonical join layer could not place this record. */
  reasonCode: UnmatchedReason;
  /** Org hint for triage (AA creator name or OR org slug). */
  org?: string;
}

/** Aggregate completeness counters for one refresh run. */
export interface CompletenessStats {
  upstreamModelCount: number;
  canonicalCount: number;
  qualityScoredCount: number;
  /** Count of unmatched upstream records by reason code, from the diagnostics queue. */
  unmatchedByReason?: Partial<Record<UnmatchedReason, number>>;
}

/** Thresholds for the catalogue completeness guard. */
export interface CompletenessThresholds {
  /** Minimum fraction of AA upstream models with a non-null quality metric. */
  minAaCoverage: number;
  /** Absolute minimum of AA-quality-scored canonical models (small-catalogue backstop). */
  minAaQualityCount: number;
  /**
   * Maximum tolerated creator_name_mismatch records from KNOWN organisations.
   * Default 0: a known org's records failing identity verification is exactly
   * how an entire org's catalogue silently vanished (Grok 4.7). Unknown orgs
   * are not gated — legitimate long-tail orgs appear constantly.
   */
  maxCreatorNameMismatches: number;
}

export const DEFAULT_THRESHOLDS: CompletenessThresholds = {
  minAaCoverage: 0.15,
  minAaQualityCount: 20,
  maxCreatorNameMismatches: 0,
};

/** Failure detail for the completeness guard. */
export interface CompletenessFinding {
  check: "aa_coverage" | "aa_quality_floor" | "creator_name_mismatch";
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

  const mismatches = stats.unmatchedByReason?.creator_name_mismatch ?? 0;
  if (mismatches > thresholds.maxCreatorNameMismatches) {
    findings.push({
      check: "creator_name_mismatch",
      detail:
        `${mismatches} upstream record(s) from known organisations failed creator-name ` +
        `verification — this is the silent-drop signature that removed Grok 4.7; ` +
        `extend the AA creator-alias table (AA_CREATOR_ALIASES) or the alias map`,
      observed: mismatches,
      threshold: thresholds.maxCreatorNameMismatches,
    });
  }

  return { ok: findings.length === 0, findings };
}

/**
 * Canonical-join audit: every record the canonical join layer produced must
 * be internally consistent. These are cheap, deterministic invariants that
 * catch future join-layer regressions.
 */
export function joinAudit(models: CanonicalModel[]): string[] {
  const problems: string[] = [];
  for (const m of models) {
    const quality = m.aa.intelligenceIndex != null || m.aa.codingIndex != null || m.aa.agenticIndex != null;
    if (quality && m.aa.slug == null) {
      problems.push(`${m.canonicalId}: quality metrics without an AA slug`);
    }
    if (!quality && m.aa.slug != null && m.openrouter == null && m.arena.overall == null) {
      // Dead-weight record: published with an AA slug but nothing usable —
      // the shape the alias/backfill merge paths could otherwise produce.
      problems.push(`${m.canonicalId}: AA slug but no quality metrics and no other source data`);
    }
    if (m.openrouter && m.openrouter.inputPricePerMillion == null && m.openrouter.outputPricePerMillion == null) {
      problems.push(`${m.canonicalId}: OpenRouter record with both prices null`);
    }
  }
  return problems;
}

/**
 * Classify why an AA record failed to enter the canonical set, given the
 * deterministic join rules used by auto-discover. Pure and shared by the
 * refresh diagnostics and the alias-drift regression tests.
 *
 * Callers must first exclude records that ARE represented in the published
 * set (via another variant) and deliberate effort-variants — those carry
 * `variant_excluded` and never reach this classifier.
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
    // Alias-mapped yet unmatched — a join-layer regression signal.
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
  // Org resolves (directly or via alias); the join was blocked by the raw
  // creator name diverging from the display name — or, if the name matches
  // exactly, this is a join-layer regression signal.
  return {
    source: "aa",
    sourceId: input.slug,
    displayName: input.creatorName,
    reasonCode: "creator_name_mismatch",
    org: canonicalOrg,
  };
}

/**
 * Classify why an OpenRouter record failed to enter the canonical set, given
 * the AA record with matching identity (when one exists). Pure; used by the
 * refresh diagnostics so OR-only models (e.g. GLM-5.3 FlashX) surface with an
 * honest "no AA quality source upstream" reason instead of a generic blob.
 */
export function classifyOrUnmatched(input: {
  id: string;
  /** OR org slug (already parsed from the id). */
  orgSlug: string;
  /** Creator name of the AA record with matching identity, or null when none exists. */
  aaCreatorName: string | null;
  /** OR org slug (lower-cased) -> display organisation name. */
  orgSlugToDisplay: Map<string, string>;
  /** Documented AA-side aliases per organisation display name. */
  knownCreatorAliases: Map<string, string[]>;
}): UnmatchedDiagnostic {
  if (input.aaCreatorName == null) {
    // No AA record shares this identity: the model has no quality source
    // upstream, so it cannot enter a quality×cost frontier (e.g. GLM-5.3
    // FlashX). Surfaced so the gap is visible, not silent.
    return { source: "openrouter", sourceId: input.id, displayName: null, reasonCode: "no_aa_counterpart" };
  }
  const display = input.orgSlugToDisplay.get(input.orgSlug.toLowerCase());
  if (!display) {
    return { source: "openrouter", sourceId: input.id, displayName: null, reasonCode: "org_unknown", org: input.orgSlug };
  }
  const aliases = input.knownCreatorAliases.get(display) ?? [];
  const acceptable = [display, ...aliases].map((n) => n.toLowerCase());
  if (!acceptable.includes(input.aaCreatorName.toLowerCase())) {
    return { source: "openrouter", sourceId: input.id, displayName: null, reasonCode: "creator_name_mismatch", org: display };
  }
  // Identity, org and creator all verify — reaching here means a join-layer
  // regression (the refresh loop should have matched this record). The
  // remediation is the same as an alias gap: add/repair the curated entry.
  return { source: "openrouter", sourceId: input.id, displayName: null, reasonCode: "not_in_alias_map", org: display };
}
