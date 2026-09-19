/**
 * The reviewed Stage-1 golden slice (#61), surfaced as the product's qualified
 * answers for the three launch questions.
 *
 * This is the deliberately-reviewed layer: a human (see `reviewed_by` /
 * `reviewed_at`) signed off the expected control mode, evidence basis,
 * availability and structured qualifiers for each launch question, against a
 * pinned source (hashes present). It is the honest source of a *qualified*
 * answer while the live extraction pipeline is reconciled with its own gates
 * (#72). It is labelled as reviewed, not as live extraction output.
 */
import goldenJson from "@/data/adpi/reviewed-golden.json";
import type { Availability, ControlMode, EvidenceBasis } from "./types";

export interface ReviewedCase {
  id: string;
  question: string;
  target: string;
  reviewed_by: string;
  reviewed_at: string;
  control_mode: ControlMode;
  evidence_basis: EvidenceBasis;
  availability: Availability;
  markets: string[];
  objectives: string[];
  placements: string[];
  prerequisites: string[];
  exclusions: string[];
  condition_kinds: string[];
  source: {
    source_id: string;
    source_url: string;
    product?: string | null;
    cleaned_sha256: string;
    raw_sha256: string;
  };
}

export interface ReviewedGolden {
  reviewed_by: string;
  reviewed_at: string;
  extraction_prompt_sha256?: string;
  cases: ReviewedCase[];
}

export function reviewedGolden(): ReviewedGolden {
  return goldenJson as ReviewedGolden;
}

export function reviewedCaseForQuestion(question: string): ReviewedCase | null {
  const needle = question.toLowerCase();
  return (
    reviewedGolden().cases.find((entry) =>
      entry.question.toLowerCase().includes(needle.slice(0, 24)) ||
      needle.includes(entry.question.toLowerCase().slice(0, 24)),
    ) ?? null
  );
}
