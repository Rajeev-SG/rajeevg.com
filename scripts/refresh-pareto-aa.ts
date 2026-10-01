import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { mapAaModels, fetchAaAllPages } from "../src/lib/pareto/artificial-analysis";
import { fetchOpenRouterModels, mapOpenRouterModels } from "../src/lib/pareto/openrouter";
import { canonicalEntries, resolveAaSlug } from "../src/lib/pareto/aliases";
import { AA_CREATOR_ALIASES, ORG_BY_OR_SLUG, autoJoin, aaIdentity, orIdentity, parseOrId } from "../src/lib/pareto/auto-discover";
import { mergeCanonicalModels } from "../src/lib/pareto/normalise";
import { classifyAaUnmatched, classifyOrUnmatched, completenessGuard, joinAudit, DEFAULT_THRESHOLDS } from "../src/lib/pareto/completeness";
import type { UnmatchedDiagnostic } from "../src/lib/pareto/completeness";
import type { CanonicalModel } from "../src/lib/pareto/types";

/**
 * gh-198 (gh-172): diagnostics are part of the refresh contract, not a
 * best-effort log line. Every upstream record the canonical join layer could
 * not place is written to the published snapshot so a successful timestamp
 * can never silently mask a dropped record. The unmatched-models queue is
 * automatically visible to whoever reads the durable snapshot, and the
 * completeness guard below fails the refresh BEFORE publication when the
 * catalogue collapses.
 */

/** Hard budget for the diagnostics queue: bounded file size on every run. */
const UNMATCHED_QUEUE_CAP = 150;

/** AA slugs are published with effort suffixes; plain slugs are the default tier. */
function isEffortVariantSuffix(slug: string): boolean {
  return /-(xhigh|high|medium|low)$/.test(slug);
}

/** Structured outcome of one refresh run (exported for the smoke test). */
export interface RefreshOutcome {
  generatedAt: string;
  aaModels: number;
  matchedQuality: number;
  models: number;
  aaQualityModels: number;
  astraMissingFromAa: boolean;
  diagnosticCount: number;
  diagnosticsByReason: Record<string, number>;
  newUpstreamModelIds: string[];
}

async function main(): Promise<void> {
const apiKey = process.env.ARTIFICIAL_ANALYSIS_API_KEY_PF;
if (!apiKey) throw new Error("ARTIFICIAL_ANALYSIS_API_KEY_PF is required");

// ── Per-run AA page cap (deterministic budget boundary) ─────────────────
// Enforcement boundary: maxPages below. With 2 scheduled runs/day, the
// hard ceiling is 2 × AA_MAX_PAGES_REFRESH (5) = 10 AA requests/day under
// normal GitHub schedule semantics. Manual dispatch exists for diagnosis
// (gh-198); it consumes the same quota and must be used deliberately.
const AA_MAX_PAGES_PER_RUN = 5; // observed 4; small safe growth headroom

const aaResult = await fetchAaAllPages({ apiKey, maxPages: AA_MAX_PAGES_PER_RUN, pageSize: 200 });
if (aaResult.pagination.hasMore) {
  throw new Error(
    `AA catalogue exceeded ${AA_MAX_PAGES_PER_RUN} pages (page=${aaResult.pagination.page}); ` +
    `raise AA_MAX_PAGES_PER_RUN with a bounded review. Refresh aborted.`
  );
}

const pagesUsed = aaResult.pagination.page;

const aaMapped = mapAaModels(aaResult.models, aaResult.intelligenceIndexVersion);
const qualityCount = [...aaMapped.matched.values()].filter(
  (model) => model.aa?.intelligenceIndex != null || model.aa?.codingIndex != null || model.aa?.agenticIndex != null
).length;
if (qualityCount === 0) throw new Error("AA refresh rejected: zero matched quality records");

const orResult = await fetchOpenRouterModels();
const orMapped = mapOpenRouterModels(orResult.models);

// Soft guard: abort before further work if AA's remaining quota cannot
// cover this run. Enforcement boundary is AA_MAX_PAGES_PER_RUN + schedule,
// but this gives an early signal if the provider reports low quota.
const quotaRemaining = aaResult.pagination.rateLimitRemaining;
if (quotaRemaining != null && quotaRemaining <= 0) {
  throw new Error(`AA quota exhausted (remaining=${quotaRemaining}); aborting refresh`);
}

const astraMissingFromAa = !aaResult.models.some((m) => m.slug === "gpt-6-astra");
const aaCandidates = new Map(
  aaResult.models
    .filter((model) => !resolveAaSlug(model.slug))
    .map((model) => [model.slug, model])
);
const orCandidates = new Map(
  orResult.models
    .filter((model) => parseOrId(model.id) !== null)
    .map((model) => [model.id, model])
);

for (const [aaSlug, aaModel] of aaCandidates) {
  for (const [orId, orModel] of orCandidates) {
    const joined = autoJoin(
      { slug: aaSlug, creatorName: aaModel.creatorName },
      { id: orId, name: orModel.name }
    );
    if (!joined) continue;
    // Canonical already claimed (e.g. by an explicit alias entry): skip here.
    // OpenRouter pricing for such canonicals is handled by the single pricing
    // backfill pass below (gh-198: one merge implementation, one winner rule).
    if (aaMapped.matched.has(joined.canonicalId)) break;
    const partial: Partial<CanonicalModel> = {
      canonicalId: joined.canonicalId,
      displayName: joined.displayName,
      organisation: joined.organisation,
      releaseDate: aaModel.releaseDate,
      aa: {
        slug: aaModel.slug,
        intelligenceIndex: aaModel.intelligenceIndex,
        codingIndex: aaModel.codingIndex,
        agenticIndex: aaModel.agenticIndex,
        costPerTaskUsd: aaModel.costPerTaskUsd,
        throughputTokensPerSecond: aaModel.throughput,
        latencyTtfbSeconds: aaModel.latencyTtfb,
        intelligenceIndexVersion: aaResult.intelligenceIndexVersion,
      },
      openrouter: {
        modelId: orModel.id,
        inputPricePerMillion: orModel.inputPerMillion,
        outputPricePerMillion: orModel.outputPerMillion,
        contextLength: orModel.contextLength,
        createdAtUnix: orModel.createdAtUnix,
      },
    };
    aaMapped.matched.set(joined.canonicalId, partial);
    orMapped.matched.set(joined.canonicalId, partial);
    break;
  }
}

// ── Pricing backfill for alias-matched AA-only canonicals (gh-198) ──────
// The auto-join loop above only sees AA records that are NOT in the alias
// map. An alias entry without an openrouterId (e.g. GPT-6 Astra) therefore
// never picked up OpenRouter pricing even when a deterministic join existed —
// the same silent-drop class as the canary join misses. Backfill: for every
// AA-backed canonical still missing OpenRouter data, attempt the exact join
// against the OR catalogue.
const aaModelBySlug = new Map(aaResult.models.map((m) => [m.slug, m]));
for (const [canonicalId, partial] of [...aaMapped.matched]) {
  if (partial.openrouter || orMapped.matched.has(canonicalId)) continue;
  const slug = partial.aa?.slug;
  const aaModel = slug ? aaModelBySlug.get(slug) : undefined;
  if (!aaModel || aaModel.creatorName == null) continue;
  for (const [orId, orModel] of orCandidates) {
    const joined = autoJoin(
      { slug: aaModel.slug, creatorName: aaModel.creatorName },
      { id: orId, name: orModel.name }
    );
    if (!joined || joined.canonicalId !== canonicalId) continue;
    const merged: Partial<CanonicalModel> = {
      ...partial,
      openrouter: {
        modelId: orModel.id,
        inputPricePerMillion: orModel.inputPerMillion,
        outputPricePerMillion: orModel.outputPerMillion,
        contextLength: orModel.contextLength,
        createdAtUnix: orModel.createdAtUnix,
      },
    };
    aaMapped.matched.set(canonicalId, merged);
    orMapped.matched.set(canonicalId, merged);
    break;
  }
}

const models = mergeCanonicalModels(aaMapped.matched, orMapped.matched, new Map());
const invalidMetric = models.find((model) =>
  [
    model.aa.intelligenceIndex,
    model.aa.codingIndex,
    model.aa.agenticIndex,
    model.aa.costPerTaskUsd,
    model.openrouter?.inputPricePerMillion,
    model.openrouter?.outputPricePerMillion,
  ].some((value) => value != null && (typeof value !== "number" || !Number.isFinite(value)))
);
if (invalidMetric) throw new Error(`Refresh rejected: non-numeric metric for ${invalidMetric.canonicalId}`);

// ── Unmatched/new-model diagnostics queue (gh-172) ──────────────────────
// Every upstream record the join layer could not place, with a machine
// readable reason code produced by the real classifiers in
// src/lib/pareto/completeness.ts (classifyAaUnmatched / classifyOrUnmatched).
// Records already represented in the published set through another variant,
// and deliberate effort-variants, are classified variant_excluded.
const diagnostics: UnmatchedDiagnostic[] = [];

// Identity state derived from the FINAL published model set — the same state
// the join layer produced, so diagnostics can never contradict the snapshot.
const matchedAaSlugs = new Set(models.map((m) => m.aa.slug).filter((s): s is string => s != null));
const matchedOrIds = new Set(models.map((m) => m.openrouter?.modelId).filter((s): s is string => s != null));
const matchedOrTokens = new Set(
  [...matchedOrIds]
    .map((id) => parseOrId(id))
    .filter((p): p is NonNullable<ReturnType<typeof parseOrId>> => p != null)
    .map((p) => orIdentity(p.modelSlug))
);
const aaIdentityByToken = new Map<string, { slug: string; creatorName: string | null }>();
for (const m of aaResult.models) {
  const token = aaIdentity(m.slug);
  if (!aaIdentityByToken.has(token)) aaIdentityByToken.set(token, { slug: m.slug, creatorName: m.creatorName });
}
const orIdentityTokens = new Set(
  orResult.models
    .map((m) => parseOrId(m.id))
    .filter((p): p is NonNullable<ReturnType<typeof parseOrId>> => p != null)
    .map((p) => orIdentity(p.modelSlug))
);
const orgSlugToDisplay = new Map(Object.entries(ORG_BY_OR_SLUG).map(([slug, display]) => [slug.toLowerCase(), display]));
const creatorAliases = new Map(Object.entries(AA_CREATOR_ALIASES));
const knownOrgDisplays = new Set(orgSlugToDisplay.values());
const aliasAaSlugs = new Set(canonicalEntries().filter((e) => e.aaSlug).map((e) => e.aaSlug.toLowerCase()));

for (const m of aaResult.models) {
  if (matchedAaSlugs.has(m.slug)) continue;
  const token = aaIdentity(m.slug);
  const displayName = m.creatorName ? `${m.name} (${m.creatorName})` : m.name;
  if (matchedOrTokens.has(token) || isEffortVariantSuffix(m.slug)) {
    // The model family is published through another variant, or this is a
    // deliberate effort-tier record excluded by the variant-safety rule.
    diagnostics.push({ source: "aa", sourceId: m.slug, displayName, reasonCode: "variant_excluded", org: m.creatorName ?? undefined });
    continue;
  }
  if (!orIdentityTokens.has(token)) {
    // No OpenRouter counterpart exists; only a curated alias can enter it.
    diagnostics.push({ source: "aa", sourceId: m.slug, displayName, reasonCode: "not_in_alias_map", org: m.creatorName ?? undefined });
    continue;
  }
  diagnostics.push({
    ...classifyAaUnmatched({
      slug: m.slug,
      creatorName: m.creatorName,
      knownOrgDisplayNames: knownOrgDisplays,
      knownAaSlugs: aliasAaSlugs,
      knownCreatorAliases: creatorAliases,
    }),
    displayName,
    org: m.creatorName ?? undefined,
  });
}
for (const m of orResult.models) {
  if (matchedOrIds.has(m.id)) continue;
  const parsed = parseOrId(m.id);
  if (!parsed) {
    // Batch/contributor or malformed ids are excluded by design.
    diagnostics.push({ source: "openrouter", sourceId: m.id, displayName: m.name, reasonCode: "variant_excluded", org: undefined });
    continue;
  }
  if (matchedOrTokens.has(orIdentity(parsed.modelSlug))) {
    // The model family is published through another variant.
    diagnostics.push({ source: "openrouter", sourceId: m.id, displayName: m.name, reasonCode: "variant_excluded", org: parsed.orgSlug });
    continue;
  }
  // Cross-source lookup: the AA record whose identity token equals this OR
  // record's model-slug token. Tokens are produced by the same identity
  // functions on both sides (aaIdentity / orIdentity — both identityNormalise
  // plus the reasoning-suffix strip), so equality here means "same model,
  // opposite source". The keying contract is pinned in auto-join-drift.test.ts.
  const aaMatch = aaIdentityByToken.get(orIdentity(parsed.modelSlug));
  diagnostics.push({
    ...classifyOrUnmatched({
      id: m.id,
      orgSlug: parsed.orgSlug,
      aaCreatorName: aaMatch?.creatorName ?? null,
      orgSlugToDisplay,
      knownCreatorAliases: creatorAliases,
    }),
    displayName: m.name,
  });
}

const generatedAt = new Date().toISOString();

const snapshot = {
  provenance: {
    source: "Artificial Analysis API v2 /language/models/free + OpenRouter /api/v1/models",
    fetchedAt: aaResult.fetchedAt,
    aaStatus: "ok" as const,
    note: "Validated automatic snapshot. Empty or incomplete refreshes never replace this file.",
  },
  generatedAt,
  freshness: {
    aaFetchedAt: aaResult.fetchedAt,
    aaStatus: "ok" as const,
    openrouterFetchedAt: orResult.fetchedAt,
    openrouterStatus: "ok" as const,
    arenaFetchedAt: null,
    arenaStatus: "pending" as const,
    arenaPublishedAt: null,
  },
  models,
};

// Unmatched/new-model diagnostics file: published NEXT TO the durable
// snapshot on the pareto-data branch (same commit), giving an automatic,
// always-current queue of newly seen / unmatched upstream model ids.
// Written BEFORE the completeness guard so a guard rejection still leaves
// the full triage trail — the diagnostics are the tool for investigating it.
const unmatchedQueue = {
  generatedAt,
  note: "Upstream records the canonical join layer could not place. Reason codes: not_in_alias_map (needs a curated alias; also the regression signal when identity fully verifies), org_unknown (new org), creator_name_mismatch (upstream renamed a creator), no_aa_counterpart (OpenRouter-only, no AA quality source), variant_excluded (effort-variant or batch/contributor record excluded by design).",
  sources: {
    aa: {
      upstreamRecords: aaResult.models.length,
      upstreamModelCount: aaResult.models.length,
    },
    openrouter: {
      upstreamRecords: orResult.models.length,
    },
  },
  diagnostics: diagnostics.slice(0, UNMATCHED_QUEUE_CAP),
  diagnosticCount: diagnostics.length,
  truncated: diagnostics.length > UNMATCHED_QUEUE_CAP,
};

// Diagnostics artefact for the workflow summary/audit trail — written BEFORE
// the guard below, so a completeness-guard rejection still leaves the full
// triage trail on disk.
const diagnosticsPath = resolve(process.cwd(), "pareto-diagnostics.json");
await mkdir(dirname(diagnosticsPath), { recursive: true });
await writeFile(
  diagnosticsPath,
  `${JSON.stringify(unmatchedQueue, null, 2)}\n`,
  "utf8"
);


// ── Completeness guard (gh-172) ─────────────────────────────────────────
// Fails the refresh BEFORE publication when (a) the AA-quality coverage of
// the snapshot collapses relative to the upstream AA catalogue, or (b)
// records from a KNOWN organisation were rejected by creator-name
// verification (the silent-drop signature that removed Grok 4.7).
//
// Calibration (verified against the live catalogue, gh-198): only ~21% of
// AA's 688-record free-tier catalogue is dashboard-calibre frontier models —
// the rest are long-tail/small/effort-variant records that legitimately stay
// unmatched. The gate therefore exists to catch CATASTROPHIC collapse
// (empty/degraded/truncated fetch), not absolute share; the relative
// per-model protection is the publish step's never-shrink guard, which
// compares against the currently published snapshot. Unknown orgs are NOT
// gated (legitimate long-tail orgs appear constantly); they surface in the
// diagnostics queue instead. Publication does not run on failure and the
// previous last-known-good durable snapshot survives.
const aaQualityModels = models.filter(
  (m) => m.aa.intelligenceIndex != null || m.aa.codingIndex != null || m.aa.agenticIndex != null
);
const unmatchedByReason = diagnostics.reduce<Record<string, number>>((acc, d) => {
  acc[d.reasonCode] = (acc[d.reasonCode] ?? 0) + 1;
  return acc;
}, {});
const guard = completenessGuard(
  {
    upstreamModelCount: aaResult.models.length,
    canonicalCount: models.length,
    qualityScoredCount: aaQualityModels.length,
    unmatchedByReason,
  },
  {
    // Environment-overridable for offline fixtures/tests; production runs use
    // the defaults (≥15% coverage backstop, ≥20 quality-scored models,
    // 0 creator mismatches from known orgs).
    minAaCoverage: Number(process.env.PARETO_MIN_AA_COVERAGE ?? DEFAULT_THRESHOLDS.minAaCoverage),
    minAaQualityCount: Number(process.env.PARETO_MIN_AA_QUALITY ?? DEFAULT_THRESHOLDS.minAaQualityCount),
    maxCreatorNameMismatches: Number(
      process.env.PARETO_MAX_CREATOR_MISMATCHES ?? DEFAULT_THRESHOLDS.maxCreatorNameMismatches
    ),
  }
);
if (!guard.ok) {
  for (const f of guard.findings) console.error(`completeness-guard: ${f.check}: ${f.detail}`);
  throw new Error(`Refresh rejected by completeness guard: ${guard.findings.map((f) => f.check).join(", ")}`);
}

// Canonical-join audit: invariants every joined model must satisfy,
// including "no dead-weight records" (AA slug but no quality, pricing or
// arena data) — the shape the alias/backfill paths could otherwise produce.
const auditProblems = joinAudit(models);
if (auditProblems.length > 0) {
  throw new Error(`Refresh rejected by join audit: ${auditProblems.slice(0, 5).join("; ")}`);
}

// Local copy stays as the repo's bundled last-known-good dataset (committed
// rarely, on meaningful schema/model-set changes, not per refresh).
const snapshotPath = resolve(process.cwd(), "src/data/pareto-aa-fallback.json");
await mkdir(dirname(snapshotPath), { recursive: true });
await writeFile(
  snapshotPath,
  `${JSON.stringify(snapshot, null, 2)}\n`,
  "utf8"
);

// Delivery is deliberately NOT done here. The scheduled workflow publishes the
// validated snapshot above to the `pareto-data` Git branch (see
// scripts/publish-pareto-data.mjs and docs/pareto-frontier-data-pipeline.md).
// Keeping publish out of this script means a local run only ever writes the
// repo-local artefact and can never clobber the published snapshot.
//
// This replaced a Vercel Blob POST delivery. Blob is metered per *operation* on
// the Hobby plan (put/copy/list are "advanced" operations, 2,000/month); the
// shared allowance was exhausted and Vercel suspended the team's Blob stores for
// 30 days, which is what broke this refresh. Git has no such quota.
console.log(JSON.stringify({ delivered: false, delivery: "handled by the workflow publish step" }));

// Telemetry only: records actual pages consumed per day. Not an enforcement
// boundary — the hard cap is AA_MAX_PAGES_PER_RUN in fetchAaAllPages plus
// the 2-run schedule. The file may undercount if a run fails before here.
const quotaPath = resolve(process.cwd(), ".github/pareto-quota.json");
await mkdir(dirname(quotaPath), { recursive: true });
await writeFile(
  quotaPath,
  `${JSON.stringify({ date: new Date().toISOString().slice(0, 10), aaRequestsUsed: pagesUsed, perRunPageCap: AA_MAX_PAGES_PER_RUN, note: "telemetry, not enforcement" }, null, 2)}\n`,
  "utf8"
);

const byReason = diagnostics.reduce<Record<string, number>>((acc, d) => {
  acc[d.reasonCode] = (acc[d.reasonCode] ?? 0) + 1;
  return acc;
}, {});
const outcome: RefreshOutcome = {
  generatedAt,
  aaModels: aaResult.models.length,
  matchedQuality: qualityCount,
  models: models.length,
  aaQualityModels: aaQualityModels.length,
  astraMissingFromAa,
  diagnosticCount: diagnostics.length,
  diagnosticsByReason: byReason,
  newUpstreamModelIds: diagnostics.filter((d) => d.reasonCode !== "variant_excluded").slice(0, 15).map((d) => d.sourceId),
};
console.log(JSON.stringify(outcome));
}

export { main as refreshMain };

// Only auto-run when executed as the entry script (never on import).
const isEntry = process.argv[1] && import.meta.url.endsWith(process.argv[1].split("/").pop() ?? "");
if (isEntry) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
