/**
 * Deterministic Pareto frontier computation.
 *
 * Model A dominates Model B iff:
 *   Q(A) >= Q(B) AND C(A) <= C(B) AND (Q(A) > Q(B) OR C(A) < C(B))
 * Models missing either selected metric do not participate.
 */
import type { CanonicalModel, CostMetric, ParetoPoint, ParetoResult, QualityMetric } from "./types";
import { blendedCostPerMillion } from "./normalise";

export function qualityValue(model: CanonicalModel, metric: QualityMetric): number | null {
  switch (metric) {
    case "aa_intelligence":
      return model.aa.intelligenceIndex;
    case "aa_coding":
      return model.aa.codingIndex;
    case "aa_agentic":
      return model.aa.agenticIndex;
    case "arena_webdev_rating":
      return model.arena.webdev?.rating ?? null;
    case "arena_agent_ips":
      return model.arena.agent?.score ?? null;
    default:
      return null;
  }
}

export function costValue(
  model: CanonicalModel,
  metric: CostMetric,
  inputShare = 0.8,
  outputShare = 0.2
): number | null {
  switch (metric) {
    case "aa_cost_per_task":
      return model.aa.costPerTaskUsd;
    case "or_input_per_million":
      return model.openrouter?.inputPricePerMillion ?? null;
    case "or_output_per_million":
      return model.openrouter?.outputPricePerMillion ?? null;
    case "or_blended_per_million":
      return blendedCostPerMillion(
        model.openrouter?.inputPricePerMillion ?? null,
        model.openrouter?.outputPricePerMillion ?? null,
        inputShare,
        outputShare
      );
    default:
      return null;
  }
}

/** Returns true if A dominates B on (quality, cost). */
export function dominates(a: { q: number; c: number }, b: { q: number; c: number }): boolean {
  return a.q >= b.q && a.c <= b.c && (a.q > b.q || a.c < b.c);
}

/**
 * Compute the Pareto frontier and per-model points for a given quality × cost pair.
 */
export function computePareto(
  models: CanonicalModel[],
  qualityMetric: QualityMetric,
  costMetric: CostMetric,
  inputShare = 0.8,
  outputShare = 0.2
): ParetoResult {
  type Entry = { model: CanonicalModel; q: number; c: number };
  const entries: Entry[] = [];
  for (const m of models) {
    const q = qualityValue(m, qualityMetric);
    const c = costValue(m, costMetric, inputShare, outputShare);
    if (q === null || c === null) continue; // missing metric: excluded from this frontier
    entries.push({ model: m, q, c });
  }

  const frontierSet = new Set<number>();
  for (let i = 0; i < entries.length; i++) {
    let dominated = false;
    for (let j = 0; j < entries.length; j++) {
      if (i === j) continue;
      if (dominates(
        { q: entries[j].q, c: entries[j].c },
        { q: entries[i].q, c: entries[i].c }
      )) {
        dominated = true;
        break;
      }
    }
    if (!dominated) frontierSet.add(i);
  }

  const points: ParetoPoint[] = entries.map((e) => ({
    canonicalId: e.model.canonicalId,
    displayName: e.model.displayName,
    organisation: e.model.organisation,
    aaSlug: e.model.aa.slug,
    openrouterModelId: e.model.openrouter?.modelId ?? null,
    quality: e.q,
    cost: e.c,
    onFrontier: frontierSet.has(entries.indexOf(e)),
    aaIntelligence: e.model.aa.intelligenceIndex,
    aaCoding: e.model.aa.codingIndex,
    aaAgentic: e.model.aa.agenticIndex,
    aaCostPerTask: e.model.aa.costPerTaskUsd,
    arenaWebdevRating: e.model.arena.webdev?.rating ?? null,
    arenaOverallRating: e.model.arena.overall?.rating ?? null,
    arenaAgentIps: e.model.arena.agent?.score ?? null,
    arenaAgentIpsLower: e.model.arena.agent?.scoreLower ?? null,
    arenaAgentIpsUpper: e.model.arena.agent?.scoreUpper ?? null,
    arenaWebdevRatingLower: e.model.arena.webdev?.ratingLower ?? null,
    arenaWebdevRatingUpper: e.model.arena.webdev?.ratingUpper ?? null,
    arenaVoteCount: e.model.arena.webdev?.voteCount ?? e.model.arena.overall?.voteCount ?? null,
    arenaAgentObservations: e.model.arena.agent?.observationCount ?? null,
    orInputPerMillion: e.model.openrouter?.inputPricePerMillion ?? null,
    orOutputPerMillion: e.model.openrouter?.outputPricePerMillion ?? null,
    releaseDate: e.model.releaseDate,
  }));

  return {
    points,
    qualityMetric,
    costMetric,
    frontierIds: points.filter((p) => p.onFrontier).map((p) => p.canonicalId),
  };
}
