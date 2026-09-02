/**
 * Canonical normalised data model for the Pareto Frontier dashboard.
 *
 * Design rules:
 * - Missing values are `null` (never fake-imputed).
 * - AA Intelligence/Coding/Agentic indices use AA's current index version.
 * - Arena metrics preserve methodology semantics: BT ratings vs IPS scores.
 */

export type Mode = "general" | "coding" | "agentic";

export type QualityMetric =
  | "aa_intelligence"
  | "aa_coding"
  | "aa_agentic"
  | "arena_webdev_rating"
  | "arena_agent_ips";

export type CostMetric =
  | "aa_cost_per_task"
  | "or_input_per_million"
  | "or_output_per_million"
  | "or_blended_per_million";

export interface ArenaBradleyTerryMetric {
  /** BT Arena score (rating). Higher is better. */
  rating: number | null;
  ratingLower: number | null;
  ratingUpper: number | null;
  voteCount: number | null;
  rank: number | null;
  category: string | null;
  publishedAt: string | null;
}

export interface ArenaIpsMetric {
  /** IPS score (0-1 range typically). Higher is better. */
  score: number | null;
  scoreLower: number | null;
  scoreUpper: number | null;
  observationCount: number | null;
  sessionCount: number | null;
  rank: number | null;
  category: string | null;
  publishedAt: string | null;
}

export interface AaData {
  slug: string | null;
  intelligenceIndex: number | null;
  codingIndex: number | null;
  agenticIndex: number | null;
  costPerTaskUsd: number | null;
  throughputTokensPerSecond: number | null;
  latencyTtfbSeconds: number | null;
  intelligenceIndexVersion: string | null;
}

export interface OpenRouterData {
  modelId: string;
  inputPricePerMillion: number | null;
  outputPricePerMillion: number | null;
  contextLength: number | null;
  createdAtUnix: number | null;
}

export interface ArenaData {
  overall: ArenaBradleyTerryMetric | null;
  webdev: ArenaBradleyTerryMetric | null;
  agent: ArenaIpsMetric | null;
}

export interface SourceFreshness {
  aaFetchedAt: string | null;
  aaStatus: "ok" | "stale" | "error" | "pending";
  openrouterFetchedAt: string | null;
  openrouterStatus: "ok" | "stale" | "error" | "pending";
  arenaFetchedAt: string | null;
  arenaStatus: "ok" | "stale" | "error" | "pending";
  arenaPublishedAt: string | null;
}

export interface CanonicalModel {
  canonicalId: string;
  displayName: string;
  organisation: string;
  releaseDate: string | null;
  aa: AaData;
  openrouter: OpenRouterData | null;
  arena: ArenaData;
}

export interface MatchConfidence {
  /** How the canonical id was resolved for each source record. */
  method: "explicit_alias" | "aa_slug" | "or_id" | "unmatched";
  aaMatched: boolean;
  openrouterMatched: boolean;
  arenaMatched: boolean;
}

export interface UnmatchedRecord {
  source: "aa" | "openrouter" | "arena";
  sourceId: string;
  displayName: string;
  reason: string;
}

export interface ParetoSnapshot {
  generatedAt: string;
  freshness: SourceFreshness;
  models: CanonicalModel[];
  unmatched: UnmatchedRecord[];
}

export interface ParetoPoint {
  canonicalId: string;
  displayName: string;
  organisation: string;
  aaSlug: string | null;
  openrouterModelId: string | null;
  quality: number | null;
  cost: number | null;
  onFrontier: boolean;
  // Useful tooltip details
  aaIntelligence: number | null;
  aaCoding: number | null;
  aaAgentic: number | null;
  aaCostPerTask: number | null;
  arenaWebdevRating: number | null;
  arenaOverallRating: number | null;
  arenaAgentIps: number | null;
  arenaAgentIpsLower: number | null;
  arenaAgentIpsUpper: number | null;
  arenaWebdevRatingLower: number | null;
  arenaWebdevRatingUpper: number | null;
  arenaVoteCount: number | null;
  arenaAgentObservations: number | null;
  orInputPerMillion: number | null;
  orOutputPerMillion: number | null;
  releaseDate: string | null;
}

export interface ParetoResult {
  points: ParetoPoint[];
  qualityMetric: QualityMetric;
  costMetric: CostMetric;
  frontierIds: string[];
}
