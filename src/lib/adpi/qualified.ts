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
  AnswerProvenance,
  Availability,
  CapabilityRecord,
  EvidencePointer,
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
export function answerQuery(
  records: CapabilityRecord[],
  query: PlannerQuery,
  options?: { limit?: number; source?: "durable" | "bundled" },
): QualifiedAnswer {
  const limit = options?.limit ?? 5;
  const tokens = tokenise(query.text);
  if (tokens.length === 0) {
    return {
      query,
      verdict: "unknown",
      facts: [],
      rationale: "The question had no searchable terms; nothing was asserted.",
      abstained: true,
      provenance: "none",
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
      provenance: "none",
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
    provenance: options?.source === "bundled" ? "bundled" : "live",
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

/**
 * Live-precedence resolver (#163).
 *
 * The product promise: a launch answer is built from the *live published
 * corpus* whenever a qualified record for the concept exists. The reviewed
 * fixture supplies the question framing and the distinction a planner must not
 * flatten — never the qualified fields, and never a synthetic record whose
 * provenance would read as live output.
 *
 * Two rules:
 *  1. Live first. Match the reviewed case to a live record (exact `record_id`
 *     when the review pinned one, else a concept match) and build the answer
 *     from that live record's own control_mode / evidence_basis / availability
 *     / scope / last_verified_at.
 *  2. Explicit abstention when the live record is missing. A concept the
 *     published corpus does not carry yet resolves to `unknown` with an honest
 *     "no live record yet" rationale — never a synthetic fact. A live record
 *     that exists but carries no qualified fields (they would normalise to
 *     `unknown`) is treated as *not* establishing the concept, so the answer
 *     abstains rather than presenting a placeholder as an assertion.
 */
/** Minimal shape the resolver needs from a reviewed case (avoids a cyclic import). */
export interface ReviewedCaseRef {
  id: string;
  question: string;
  target: string;
  reviewed_by: string;
  reviewed_at: string;
  control_mode: CapabilityRecord["control_mode"];
  evidence_basis: CapabilityRecord["evidence_basis"];
  availability: CapabilityRecord["availability"];
  markets: string[];
  objectives: string[];
  placements: string[];
  prerequisites: string[];
  exclusions: string[];
  /** The dataset record this reviewed case is attributed to, when one exists. */
  record_id?: string | null;
  source: {
    source_id: string;
    source_url: string;
    product?: string | null;
    cleaned_sha256: string;
    raw_sha256: string;
  };
}

/**
 * Does a record assert a qualified outcome, or is it a bare unknown placeholder?
 *
 * Two ways a record fails to establish anything — and both must abstain rather
 * than be presented as an answer:
 *  - its qualified fields normalise to the "not evidenced" default; and
 *  - it carries no evidence pointer, so there is nothing to attribute the claim
 *    to. Every published capability must carry provenance, so a live record with
 *    no evidence is a defect, not a fact.
 */
export function isLiveQualified(record: CapabilityRecord): boolean {
  const basisKnown = record.evidence_basis !== undefined && record.evidence_basis !== "unknown";
  const availabilityKnown =
    record.availability !== undefined && record.availability !== "unknown";
  const hasEvidence = (record.evidence ?? []).length > 0;
  return basisKnown && availabilityKnown && hasEvidence;
}

/** Concept tokens a reviewer used, for the fallback match when no record_id is pinned. */
function conceptTokens(caseRef: ReviewedCaseRef): string[] {
  return tokenise(`${caseRef.target} ${caseRef.source.product ?? ""}`);
}

/**
 * Find the live record a reviewed case is about.
 * - exact `record_id` when the review pinned one and it is present live;
 * - otherwise the best-scoring live record on the reviewed concept, but only
 *   when it clears the same relevance bar `answerQuery` uses.
 */
export function resolveLiveRecord(
  caseRef: ReviewedCaseRef,
  records: CapabilityRecord[],
  filter?: { vendor?: string; platform?: string },
): CapabilityRecord | null {
  if (caseRef.record_id) {
    const exact = records.find((record) => record.id === caseRef.record_id);
    if (exact) return exact;
    // A pinned record that is no longer live is an explicit miss: do not fall
    // back to a neighbouring record, which would answer from another concept.
    return null;
  }
  const tokens = conceptTokens(caseRef);
  if (tokens.length === 0) return null;
  // A concept match must stay on the surface the planner named: matching across
  // vendors would bind the reviewed concept to an unrelated platform's record.
  const candidates = records.filter(
    (record) =>
      (filter?.vendor ? record.vendor === filter.vendor : true) &&
      (filter?.platform ? record.platform === filter.platform : true),
  );
  const scored = candidates
    .map((record) => ({ record, value: score(record, tokens) }))
    .filter((entry) => entry.value >= 0.5)
    .sort((a, b) => b.value - a.value || a.record.name.localeCompare(b.record.name));
  return scored.length > 0 ? scored[0].record : null;
}

/**
 * Evidence for a fact. A matched record's own pointers only: falling back to the
 * reviewed case's pointer (with the reviewer's hashes) under a live label would
 * be a provenance mix. A record with no pointers is not usable in the first
 * place (see ``isLiveQualified``), so this never has to invent one.
 */
function evidenceFor(record: CapabilityRecord): EvidencePointer[] {
  return record.evidence;
}

/** Build one launch answer from the live corpus, with the reviewed fixture as framing only. */
export function answerFromLiveCorpus(
  cases: ReviewedCaseRef[],
  query: PlannerQuery,
  records: CapabilityRecord[],
  /** Where `records` came from: "durable" is the live published feed, "bundled"
   * is the reviewed seed fallback. The label must follow the records, not the
   * code path. */
  source: "durable" | "bundled" = "durable",
): QualifiedAnswer {
  const resolved = cases.map((caseRef) => {
    const live = resolveLiveRecord(caseRef, records, { vendor: query.vendor, platform: query.platform });
    return { caseRef, live, qualified: live ? isLiveQualified(live) : false };
  });

  const established = resolved.filter((entry) => entry.live && entry.qualified);
  // The records here are the bundled reviewed seed, not the live feed: the
  // qualified fields are real, but the provenance is the seed. Label it as such
  // so a seed-rendered answer is never shown as live published output.
  const provenanced: AnswerProvenance = source === "bundled" ? "bundled" : "live";

  if (established.length === 0) {
    // No live qualified record for any concept in this question. Abstain, and
    // say exactly why: this is the honesty rule, not a failure.
    const reviewedOnly = resolved.map((entry) => entry.caseRef.target).join(", ");
    return {
      query,
      verdict: "unknown",
      facts: [],
      rationale:
        (source === "bundled"
          ? `The published corpus is unavailable and the bundled reviewed seed has no ` +
            `qualified record for ${reviewedOnly}. The explorer will not assert an ` +
            "answer from the seed alone, so this stays unresolved."
          : `No live published capability currently evidences ${reviewedOnly}. The ` +
            "reviewed reference describes the concept, but the explorer will not " +
            "present reviewed provenance as live output, so this stays unresolved."),
      abstained: true,
      provenance: "reviewed_reference",
    };
  }

  const facts = established.map(({ caseRef, live }) => ({
    record: {
      ...live!,
      // The reviewed case names the concept the planner typed; the qualified
      // fields are the live record's own, never the fixture's.
      name: live!.name,
    },
    conditions: conditionsFor(live!, query.market, query.objective),
    evidence: evidenceFor(live!),
    verificationDate: live!.last_verified_at ?? null,
  }));

  const verdict = combineVerdicts(facts.map((fact) => fact.record.availability));
  const basisNote = describeBasis(facts.map((fact) => fact.record.evidence_basis));
  const missing = resolved.filter((entry) => !(entry.live && entry.qualified)).map((entry) => entry.caseRef.target);

  return {
    query,
    verdict,
    facts,
    rationale:
      `${VERDICT_REASON[verdict]} Matched ${facts.length} live published capability${facts.length === 1 ? "" : "ies"}` +
      (missing.length > 0
        ? `; ${missing.length} concept${missing.length === 1 ? "" : "s"} (${missing.join(", ")}) has no live record and stays unresolved.`
        : "") +
      ` ${basisNote}`,
    abstained: false,
    provenance: provenanced,
  };
}
