import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { mapAaModels, fetchAaAllPages } from "../src/lib/pareto/artificial-analysis";
import { fetchOpenRouterModels, mapOpenRouterModels } from "../src/lib/pareto/openrouter";
import { canonicalEntries, resolveAaSlug } from "../src/lib/pareto/aliases";
import { autoJoin, parseOrId } from "../src/lib/pareto/auto-discover";
import { mergeCanonicalModels } from "../src/lib/pareto/normalise";
import { completenessGuard, joinAudit, DEFAULT_THRESHOLDS } from "../src/lib/pareto/completeness";
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
    if (!joined || aaMapped.matched.has(joined.canonicalId)) continue;
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

// ── Completeness guard (gh-172) ─────────────────────────────────────────
// Fails the refresh BEFORE publication when the AA-quality coverage of the
// snapshot collapses relative to the upstream AA catalogue. Publication then
// does not run, and the previous last-known-good durable snapshot survives.
const aaQualityModels = models.filter(
  (m) => m.aa.intelligenceIndex != null || m.aa.codingIndex != null || m.aa.agenticIndex != null
);
const guard = completenessGuard(
  {
    upstreamModelCount: aaResult.models.length,
    canonicalCount: models.length,
    qualityScoredCount: aaQualityModels.length,
    unmatched: [],
  },
  {
    // Environment-overridable for offline fixtures/tests; production runs use
    // the defaults (50% coverage, ≥20 quality-scored models).
    minAaCoverage: Number(process.env.PARETO_MIN_AA_COVERAGE ?? DEFAULT_THRESHOLDS.minAaCoverage),
    minAaQualityCount: Number(process.env.PARETO_MIN_AA_QUALITY ?? DEFAULT_THRESHOLDS.minAaQualityCount),
  }
);
if (!guard.ok) {
  for (const f of guard.findings) console.error(`completeness-guard: ${f.check}: ${f.detail}`);
  throw new Error(`Refresh rejected by completeness guard: ${guard.findings.map((f) => f.check).join(", ")}`);
}

// Canonical-join audit: invariants every joined model must satisfy.
const auditProblems = joinAudit(models);
if (auditProblems.length > 0) {
  throw new Error(`Refresh rejected by join audit: ${auditProblems.slice(0, 5).join("; ")}`);
}

// ── Unmatched/new-model diagnostics queue (gh-172) ──────────────────────
// Every upstream record the join layer could not place, with a machine
// readable reason code. Effort-variant suffixed slugs (-high/-low/…) are a
// deliberate product of the variant-safety rule and are grouped, not
// enumerated, so the queue stays small and readable.
const diagnostics: UnmatchedDiagnostic[] = [];
for (const m of aaResult.models) {
  if (aaMapped.matched.has(m.slug)) continue;
  const isVariant = isEffortVariantSuffix(m.slug);
  diagnostics.push({
    source: "aa",
    sourceId: m.slug,
    displayName: m.creatorName ? `${m.name} (${m.creatorName})` : m.name,
    reasonCode: isVariant ? "variant_excluded" : "not_in_alias_map",
    org: m.creatorName ?? undefined,
  });
}
for (const m of orResult.models) {
  if (orMapped.matched.has(m.id)) continue;
  const parsed = parseOrId(m.id);
  diagnostics.push({
    source: "openrouter",
    sourceId: m.id,
    displayName: m.name,
    reasonCode: "not_in_alias_map",
    org: parsed?.orgSlug,
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
const unmatchedQueue = {
  generatedAt,
  note: "Upstream records the canonical join layer could not place. Reason codes: not_in_alias_map (needs a curated alias or a supported org), org_unknown (new org), creator_name_mismatch (upstream renamed a creator), variant_excluded (effort-variant slug excluded by design).",
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

// Local copy stays as the repo's bundled last-known-good dataset (committed
// rarely, on meaningful schema/model-set changes, not per refresh).
await writeFile(
  resolve(process.cwd(), "src/data/pareto-aa-fallback.json"),
  `${JSON.stringify(snapshot, null, 2)}\n`,
  "utf8"
);

// Diagnostics artefact for the workflow summary/audit trail.
await writeFile(
  resolve(process.cwd(), "pareto-diagnostics.json"),
  `${JSON.stringify(unmatchedQueue, null, 2)}\n`,
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
await writeFile(
  resolve(process.cwd(), ".github/pareto-quota.json"),
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
