/**
 * Qualified capability answering (#57, inside #11).
 *
 * The product promise is a *qualified* answer, never a boolean: supported /
 * conditional / unknown, with structured conditions, evidence basis, an
 * evidence reference and a verification date — or an explicit abstention when
 * the evidence does not establish an outcome.
 *
 * Deterministic and client-side: it ranks and explains the published facts; it
 * never invents a fact. Abstention is a first-class result.
 */
import type {
  AnswerCondition,
  AnswerFact,
  Availability,
  CapabilityRecord,
  PlannerQuery,
  QualifiedAnswer,
} from "./types";

/** Lowercase token match over the fields a planner would actually type. */
function haystack(record: CapabilityRecord): string {
  return [
    record.name,
    record.vendor_term ?? "",
    record.vendor,
    record.platform,
    record.family ?? "",
    record.capability_type,
    record.id,
    ...(record.scope?.placements ?? []),
  ]
    .join(" ")
    .toLowerCase();
}

/** Split a question into meaningful tokens, dropping stopwords. */
const STOPWORDS = new Set([
  "do", "does", "can", "i", "is", "are", "the", "a", "an", "on", "in", "with",
  "for", "to", "of", "my", "me", "it", "and", "or", "if", "how", "what", "that",
  "this", "give", "get", "use", "using", "actually", "really", "same", "as",
  "campaign", "campaigns", "ads", "ad",
]);

export function tokenise(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 1 && !STOPWORDS.has(token));
}

function score(record: CapabilityRecord, tokens: string[]): number {
  const text = haystack(record);
  let hits = 0;
  for (const token of tokens) {
    // Prefix match so "optimisation" matches "optimization"/"optimising".
    if (token.length >= 4 ? text.includes(token.slice(0, 4)) : text.includes(token)) hits += 1;
  }
  return tokens.length === 0 ? 0 : hits / tokens.length;
}

/** Market match: canonical alpha-2 codes, "global" is not a market. */
function marketMatches(record: CapabilityRecord, market: string): boolean {
  const markets = record.scope?.markets ?? [];
  if (markets.length === 0) return true; // not-evidenced is not a mismatch
  return markets.some((entry) => entry.toUpperCase() === market.toUpperCase());
}

function objectiveMatches(record: CapabilityRecord, objective: string): boolean {
  const objectives = record.scope?.objectives ?? [];
  if (objectives.length === 0) return true;
  const needle = objective.toLowerCase();
  return objectives.some((entry) => entry.toLowerCase().includes(needle) || needle.includes(entry.toLowerCase()));
}

/** Render every structured qualifier next to the answer, never prose. */
export function conditionsFor(record: CapabilityRecord, market?: string, objective?: string): AnswerCondition[] {
  const conditions: AnswerCondition[] = [];
  const scope = record.scope ?? {};
  for (const condition of scope.conditions ?? []) {
    conditions.push({ kind: condition.kind, detail: condition.detail });
  }
  for (const prerequisite of scope.prerequisites ?? []) {
    conditions.push({ kind: "prerequisite", detail: prerequisite });
  }
  for (const exclusion of scope.exclusions ?? []) {
    conditions.push({ kind: "other", detail: `Excluded: ${exclusion}` });
  }
  const markets = scope.markets ?? [];
  if (markets.length > 0 && markets.length <= 12) {
    conditions.push({ kind: "market", detail: `Evidenced markets: ${markets.join(", ")}` });
  }
  if (market && markets.length > 0 && !marketMatches(record, market)) {
    conditions.push({ kind: "market", detail: `Not evidenced for ${market}` });
  }
  const objectives = scope.objectives ?? [];
  if (objectives.length > 0 && objectives.length <= 12) {
    conditions.push({ kind: "objective", detail: `Evidenced objectives: ${objectives.join(", ")}` });
  }
  if (objective && objectives.length > 0 && !objectiveMatches(record, objective)) {
    conditions.push({ kind: "objective", detail: `Not evidenced for objective “${objective}”` });
  }
  return conditions;
}

/** The worst (most honest) verdict across a set: any unknown holds the answer back. */
function combineVerdicts(verdicts: Availability[]): Availability {
  if (verdicts.includes("conditional")) return "conditional";
  if (verdicts.every((verdict) => verdict === "supported")) return "supported";
  if (verdicts.every((verdict) => verdict === "unknown")) return "unknown";
  return "conditional";
}

const VERDICT_REASON: Record<Availability, string> = {
  supported: "The evidence states this is generally available with no conditions.",
  conditional: "The evidence states this exists, but with conditions that may not hold for a given account.",
  unknown: "The evidence does not establish availability; it is not safe to assume this works.",
};

/**
 * Answer a planner question. Deterministic ranking over the published
 * capabilities; the top matches are qualified together, and an empty match set
 * abstains.
 */
export function answerQuery(records: CapabilityRecord[], query: PlannerQuery, options?: { limit?: number }): QualifiedAnswer {
  const limit = options?.limit ?? 5;
  const tokens = tokenise(query.text);
  if (tokens.length === 0) {
    return {
      query,
      verdict: "unknown",
      facts: [],
      rationale: "The question had no searchable terms; nothing was asserted.",
      abstained: true,
    };
  }

  const scored = records
    .filter((record) => (query.vendor ? record.vendor === query.vendor : true))
    .filter((record) => (query.platform ? record.platform === query.platform : true))
    .map((record) => ({ record, value: score(record, tokens) }))
    .filter((entry) => entry.value >= 0.5)
    .sort((a, b) => b.value - a.value || a.record.name.localeCompare(b.record.name))
    .slice(0, limit);

  if (scored.length === 0) {
    return {
      query,
      verdict: "unknown",
      facts: [],
      rationale:
        "No published capability matched this question. The explorer will not infer an answer from a neighbouring platform or capability.",
      abstained: true,
    };
  }

  const facts: AnswerFact[] = scored.map(({ record }) => ({
    record,
    conditions: conditionsFor(record, query.market, query.objective),
    evidence: record.evidence ?? [],
    verificationDate: record.last_verified_at ?? null,
  }));

  const verdicts = facts.map((fact) => fact.record.availability ?? "unknown");
  const verdict = combineVerdicts(verdicts);
  const basisNote = describeBasis(facts.map((fact) => fact.record.evidence_basis));
  const conditionalCount = verdicts.filter((entry) => entry === "conditional").length;

  return {
    query,
    verdict,
    facts,
    rationale:
      `${VERDICT_REASON[verdict]} Matched ${facts.length} published capability${facts.length === 1 ? "" : "ies"}` +
      (conditionalCount > 0 ? `, ${conditionalCount} conditional` : "") +
      `. ${basisNote}`,
    abstained: false,
  };
}

function describeBasis(bases: string[]): string {
  const unique = [...new Set(bases)];
  const label: Record<string, string> = {
    documented: "vendor documentation",
    account_observed: "account observation",
    vendor_announced: "a vendor announcement",
    unknown: "no stated basis",
  };
  return `Evidence basis: ${unique.map((basis) => label[basis] ?? basis).join(", ")}.`;
}

/**
 * Cross-platform comparison. Two capabilities on different vendors are never
 * asserted to be the same concept: the caller must render the caveat.
 */
export interface ComparisonResult {
  left: CapabilityRecord;
  right: CapabilityRecord;
  /** True when the two vendor concepts are not asserted to be identical. */
  caveatRequired: boolean;
  caveat: string | null;
}

export function compareCapabilities(left: CapabilityRecord, right: CapabilityRecord): ComparisonResult {
  const sameVendor = left.vendor === right.vendor;
  const samePlatform = left.platform === right.platform;
  const caveatRequired = !(sameVendor && samePlatform);
  return {
    left,
    right,
    caveatRequired,
    caveat: caveatRequired
      ? `“${left.name}” (${left.platform}) and “${right.name}” (${right.platform}) come from different ` +
        "surfaces. Similar wording does not mean the same control, and any apparent equivalence is not asserted."
      : null,
  };
}
