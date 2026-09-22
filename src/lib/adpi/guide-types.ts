/** Feature-guide shapes as published by ad-platform-intelligence (#116/#123). */

export type GuideStatus =
  | "documented"
  | "inferred"
  | "not_documented"
  | "not_applicable"
  | "conflicting";

export type GuideSectionKind =
  | "definition"
  | "mechanism"
  | "use_cases"
  | "setup"
  | "kpis"
  | "relationships"
  | "sources";

export type RelationshipKind =
  | "equivalent_for_use"
  | "partial_alternative"
  | "related_not_equivalent";

export interface GuideEvidenceRef {
  source_id: string;
  source_url: string;
  locator?: string | null;
}

export interface GuideClaim {
  text: string;
  status: GuideStatus;
  evidence: GuideEvidenceRef[];
  conditions?: string[];
}

export interface GuideSection {
  kind: GuideSectionKind;
  summary?: string;
  status: GuideStatus;
  claims: GuideClaim[];
}

export interface GuideRelationship {
  feature_id: string;
  name: string;
  vendor: string;
  kind: RelationshipKind;
  difference: string;
  context: string;
  evidence: GuideEvidenceRef[];
  status: GuideStatus;
}

export interface GuideDependencies {
  grouping_version?: string;
  prompt_version?: string;
  schema_version?: string;
  model?: string;
  verifier_model?: string;
}

export interface Guide {
  feature_id: string;
  name: string;
  vendor: string;
  platform: string;
  capability_ids: string[];
  sections: GuideSection[];
  relationships: GuideRelationship[];
  dependencies?: GuideDependencies;
  schema_version?: number;
  generated_at?: string;
  source_checked_at?: string | null;
  verified_at?: string | null;
}

export interface GuideIndexEntry {
  feature_id: string;
  name: string;
  vendor: string;
  platform: string;
  summary: string;
  availability?: string;
  coverage?: { substantive_count?: number; section_count?: number };
  detail: string;
  generated_at?: string;
  source_checked_at?: string | null;
  verified_at?: string | null;
}

export interface GuideIndex {
  schema_version: number;
  release: string;
  generated_at?: string;
  detail_dir?: string;
  guide_count?: number;
  guides: GuideIndexEntry[];
  withheld_unresolved_capability_ids?: Record<string, string[]>;
}

export interface GuideDetail {
  schema_version: number;
  release: string;
  guide: Guide;
}
