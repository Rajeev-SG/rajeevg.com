/**
 * Canonical data model for the Ad Platform Intelligence capability explorer.
 *
 * Mirrors the published `dataset.json` (schema v2) from `Rajeev-SG/adpi-data`.
 * Design rules carried from the pipeline (docs/DATA_MODEL.md):
 *
 * - A capability is a *qualified* fact, never a boolean. Availability is
 *   `supported` / `conditional` / `unknown`, and `unknown` is a real value,
 *   never a missing field to be read as "works".
 * - `control_mode` keeps control / signal / automatic / recommendation /
 *   reporting-only distinct. It is never flattened to a yes/no.
 * - `evidence_basis` says how the claim was established and is kept separate
 *   from maturity and market scope.
 * - Empty scope fields mean "not evidenced", never "unrestricted".
 */

/** How a claim was established. `unknown` is a real value, never a default to documented. */
export type EvidenceBasis = "documented" | "account_observed" | "vendor_announced" | "unknown";

/** The qualified outcome for a planner. `supported` is an unqualified yes. */
export type Availability = "supported" | "conditional" | "unknown";

/** Where the advertiser's lever sits. Distinct semantics, never a boolean. */
export type ControlMode =
  | "control"
  | "signal"
  | "recommendation"
  | "automatic"
  | "reporting_only"
  | "not_applicable";

export type Maturity =
  | "live"
  | "beta"
  | "pilot"
  | "allowlist"
  | "deprecated"
  | "migrating"
  | "unknown";

/** Structured kind of an eligibility/qualifier the source states. */
export type ConditionKind =
  | "allowlist"
  | "beta"
  | "eligibility"
  | "prerequisite"
  | "market"
  | "spend"
  | "other";

export interface Condition {
  kind: ConditionKind;
  detail: string;
  locator?: string | null;
}

export interface Scope {
  markets?: string[];
  objectives?: string[];
  placements?: string[];
  campaign_types?: string[];
  prerequisites?: string[];
  exclusions?: string[];
  conditions?: Condition[];
}

export interface EvidencePointer {
  source_id: string;
  source_url: string;
  cleaned_sha256: string;
  raw_sha256: string;
  locator?: string;
}

export interface CapabilityRecord {
  id: string;
  vendor: string;
  platform: string;
  family?: string;
  name: string;
  capability_type: string;
  description?: string;
  maturity: Maturity;
  control_mode: ControlMode;
  /** Always present in schema v2; a missing value is treated as `unknown`. */
  evidence_basis: EvidenceBasis;
  availability: Availability;
  vendor_term?: string;
  scope?: Scope;
  ui_available?: boolean;
  api_available?: boolean;
  bulk_available?: boolean;
  evidence: EvidencePointer[];
  /** Day-precision observation date, e.g. "2026-09-17". */
  last_verified_at?: string;
}

export interface CapabilityDataset {
  schema_version: number;
  /** Publication time — never evidence freshness. */
  generated_at: string;
  capabilities: CapabilityRecord[];
}

/** A platform/product pairing is a "surface": concepts are not comparable across vendors. */
export interface SurfaceKey {
  vendor: string;
  platform: string;
}

/**
 * A planner's question: can I do X on platform Y, in market Z, with this
 * objective, and under what conditions?
 */
export interface PlannerQuery {
  text: string;
  market?: string;
  objective?: string;
  vendor?: string;
  platform?: string;
}

export type QualifiedVerdict = Availability;

/** One structured qualifier rendered next to the answer. */
export interface AnswerCondition {
  kind: ConditionKind | "market" | "objective";
  detail: string;
}

export interface AnswerFact {
  record: CapabilityRecord;
  conditions: AnswerCondition[];
  evidence: EvidencePointer[];
  verificationDate: string | null;
}

export interface QualifiedAnswer {
  query: PlannerQuery;
  verdict: QualifiedVerdict;
  /** Matched capabilities across the requested surface, ranked. */
  facts: AnswerFact[];
  /** Plain-English reason, always populated — including for abstention. */
  rationale: string;
  /** True when the explorer deliberately declines to assert an outcome. */
  abstained: boolean;
}
