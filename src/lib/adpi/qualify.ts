/**
 * Qualified-answer logic for the planner workflow (#57).
 *
 * The rules here encode the correctness contract the issues require:
 *
 * - availability is never flattened to a boolean: a "supported" answer is an
 *   unqualified yes (only account-observed evidence), documentation yields
 *   "conditional" or "unknown";
 * - control vs signal vs automation is preserved and explained, never reduced
 *   to "targeting: yes";
 * - an unevidenced qualifier renders as unknown, never as a default;
 * - cross-vendor comparison never asserts semantic equivalence.
 */
import type { AvailabilityOutcome, Capability, Condition, EvidenceBasis } from "./types"

export const CONTROL_MODE_LABEL: Record<string, string> = {
  control: "Control (you set it)",
  signal: "Signal (optimisation uses it)",
  recommendation: "Recommendation (you accept it)",
  automatic: "Automatic (platform decides)",
  reporting_only: "Reporting only",
  not_applicable: "Not applicable",
}

export const CONTROL_MODE_PLAIN: Record<string, string> = {
  control: "You set or exclude this yourself.",
  signal: "An input to the platform's optimisation; it does not itself restrict delivery.",
  recommendation: "The platform suggests it and you choose whether to adopt it.",
  automatic: "The platform applies it without an advertiser selection.",
  reporting_only: "It affects reporting/breakdowns, not delivery behaviour.",
  not_applicable: "Not applicable to delivery.",
}

export const EVIDENCE_BASIS_LABEL: Record<EvidenceBasis, string> = {
  documented: "Documented (vendor help page)",
  account_observed: "Account-observed (seen live in an account)",
  vendor_announced: "Vendor-announced (announced, not yet generally available)",
  unknown: "Unknown basis",
}

export const CONDITION_KIND_LABEL: Record<string, string> = {
  allowlist: "Allowlist",
  beta: "Beta",
  eligibility: "Account eligibility",
  prerequisite: "Prerequisite",
  market: "Market limit",
  spend: "Spend requirement",
  other: "Condition",
}

export interface QualifiedAnswer {
  outcome: AvailabilityOutcome
  /** One plain sentence a planner can act on. */
  headline: string
  controlMode: string
  controlModePlain: string
  evidenceBasis: EvidenceBasis
  evidenceBasisLabel: string
  conditions: Condition[]
  /** Free-text prerequisites/exclusions preserved as stated (not structured). */
  prerequisites: string[]
  exclusions: string[]
  markets: string[]
  /** Explicit unresolved states — never blanks. */
  unresolved: string[]
  /** Human-readable evidence reference (source + verification date). */
  evidenceRef: string | null
  verifiedAt: string | null
  capability: Capability
}

/**
 * Answer one capability. `outcome` follows the dataset's `availability`, but
 * the headline and `unresolved` make the *reasoning* explicit:
 * documentation alone can never yield an unqualified yes.
 */
export function qualify(capability: Capability): QualifiedAnswer {
  const conditions = capability.scope?.conditions ?? []
  const prerequisites = capability.scope?.prerequisites ?? []
  const exclusions = capability.scope?.exclusions ?? []
  const markets = capability.scope?.markets ?? []

  const unresolved: string[] = []
  if (capability.evidence_basis === "unknown") {
    unresolved.push("No evidence basis is recorded for this capability.")
  }
  if (capability.evidence_basis === "documented" && capability.availability === "supported") {
    // The dataset gate forbids this, but the UI must never present it as a yes
    // even if a malformed record arrives.
    unresolved.push(
      "Availability is only documented; account-level availability is unverified.",
    )
  }
  if (markets.length === 0) {
    unresolved.push("No market scope is stated, so market applicability is unknown.")
  }
  if (capability.availability === "unknown") {
    unresolved.push("The source does not establish general availability.")
  }

  // Effective outcome: documentation cannot be an unqualified yes.
  let outcome = capability.availability
  if (outcome === "supported" && capability.evidence_basis !== "account_observed") {
    outcome = "conditional"
  }

  const headline = buildHeadline(capability, outcome)
  const evidence = capability.evidence?.[0]
  const verifiedAt = capability.last_verified_at ?? null

  return {
    outcome,
    headline,
    controlMode: CONTROL_MODE_LABEL[capability.control_mode] ?? capability.control_mode,
    controlModePlain: CONTROL_MODE_PLAIN[capability.control_mode] ?? "",
    evidenceBasis: capability.evidence_basis,
    evidenceBasisLabel: EVIDENCE_BASIS_LABEL[capability.evidence_basis] ?? capability.evidence_basis,
    conditions,
    prerequisites,
    exclusions,
    markets,
    unresolved,
    evidenceRef: evidence ? `${evidence.source_id}${evidence.locator ? ` — ${evidence.locator}` : ""}` : null,
    verifiedAt,
    capability,
  }
}

function buildHeadline(capability: Capability, outcome: AvailabilityOutcome): string {
  const mode = CONTROL_MODE_PLAIN[capability.control_mode] ?? ""
  switch (outcome) {
    case "supported":
      return `Yes — ${capability.name} is available, and ${mode.toLowerCase()}`
    case "conditional":
      return `Conditionally — ${capability.name} exists, but availability depends on the conditions below. ${mode}`
    default:
      return `Unknown — the source does not establish whether ${capability.name} is available. ${mode}`
  }
}

/**
 * Cross-vendor comparison. Deliberately does NOT map concepts to each other:
 * it reports each side on its own terms and warns when they are not known to be
 * the same thing.
 */
export interface Comparison {
  left: QualifiedAnswer
  right: QualifiedAnswer
  sameControlMode: boolean
  /** Never true automatically: equivalence is not asserted by this product. */
  equivalent: false
  caveats: string[]
}

export function compare(left: Capability, right: Capability): Comparison {
  const a = qualify(left)
  const b = qualify(right)
  const caveats: string[] = []
  if (a.capability.vendor !== b.capability.vendor) {
    caveats.push(
      "These are different vendors. Vendor concepts are not assumed to be equivalent; " +
        "each is described in its own terms.",
    )
  }
  if (a.capability.control_mode !== b.capability.control_mode) {
    caveats.push(
      `Behaviour differs: ${a.capability.vendor} is ${a.controlMode.toLowerCase()}, ` +
        `${b.capability.vendor} is ${b.controlMode.toLowerCase()}. They are not interchangeable.`,
    )
  }
  if (a.conditions.length !== b.conditions.length) {
    caveats.push("The two capabilities carry different conditions, so eligibility may differ.")
  }
  return {
    left: a,
    right: b,
    sameControlMode: a.capability.control_mode === b.capability.control_mode,
    equivalent: false,
    caveats,
  }
}

/** Group the answer's conditions by kind, in a stable display order. */
export function groupConditions(conditions: Condition[]): { kind: string; label: string; items: Condition[] }[] {
  const order = ["beta", "allowlist", "eligibility", "prerequisite", "market", "spend", "other"]
  const byKind = new Map<string, Condition[]>()
  for (const condition of conditions) {
    const list = byKind.get(condition.kind) ?? []
    list.push(condition)
    byKind.set(condition.kind, list)
  }
  return order
    .filter((kind) => byKind.has(kind))
    .map((kind) => ({ kind, label: CONDITION_KIND_LABEL[kind] ?? kind, items: byKind.get(kind) ?? [] }))
}
