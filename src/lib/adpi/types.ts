/** Ad Platform Intelligence — public dataset types (#54 schema v2, #57 workflow). */

export type ControlMode =
  | "control"
  | "signal"
  | "recommendation"
  | "automatic"
  | "reporting_only"
  | "not_applicable"

export type EvidenceBasis = "documented" | "account_observed" | "vendor_announced" | "unknown"

export type AvailabilityOutcome = "supported" | "conditional" | "unknown"

export type ConditionKind =
  | "allowlist"
  | "beta"
  | "eligibility"
  | "prerequisite"
  | "market"
  | "spend"
  | "other"

export interface Condition {
  kind: ConditionKind
  detail: string
  locator?: string
}

export interface CapabilityScope {
  markets?: string[]
  objectives?: string[]
  placements?: string[]
  campaign_types?: string[]
  prerequisites?: string[]
  exclusions?: string[]
  conditions?: Condition[]
}

export interface EvidenceRef {
  source_id: string
  source_url: string
  locator?: string
  raw_sha256?: string
  cleaned_sha256?: string
}

export interface Capability {
  id: string
  vendor: string
  platform: string
  family?: string
  name: string
  capability_type: string
  description?: string
  maturity: string
  control_mode: ControlMode
  evidence_basis: EvidenceBasis
  availability: AvailabilityOutcome
  vendor_term?: string
  scope?: CapabilityScope
  ui_available?: boolean | null
  api_available?: boolean | null
  bulk_available?: boolean | null
  evidence: EvidenceRef[]
  last_verified_at?: string
  /** Launch-slice only: which planner questions this record answers. */
  question_ids?: string[]
  /** True for reviewed-bundle records; false/absent for live-feed records. */
  reviewed?: boolean
}

export interface PlannerQuestion {
  id: string
  text: string
  cases: string[]
}

export interface DatasetProvenance {
  kind: string
  note: string
  reviewed_by?: string
  reviewed_at?: string
  extraction_prompt_sha256?: string
}

export interface AdpiDataset {
  schema_version: number
  generated_at: string
  provenance?: DatasetProvenance
  questions?: PlannerQuestion[]
  capabilities: Capability[]
}
