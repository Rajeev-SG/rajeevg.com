import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { mapAaModels, fetchAaAllPages } from "../src/lib/pareto/artificial-analysis";
import { fetchOpenRouterModels, mapOpenRouterModels } from "../src/lib/pareto/openrouter";
import { resolveAaSlug } from "../src/lib/pareto/aliases";
import { autoJoin, parseOrId } from "../src/lib/pareto/auto-discover";
import { mergeCanonicalModels } from "../src/lib/pareto/normalise";
import type { CanonicalModel } from "../src/lib/pareto/types";

async function main() {
const apiKey = process.env.ARTIFICIAL_ANALYSIS_API_KEY_PF;
if (!apiKey) throw new Error("ARTIFICIAL_ANALYSIS_API_KEY_PF is required");

// ── Per-run AA page cap (deterministic budget boundary) ─────────────────
// Enforcement boundary: maxPages below. With 2 scheduled runs/day, the
// hard ceiling is 2 × AA_MAX_PAGES_REFRESH (5) = 10 AA requests/day under
// normal GitHub schedule semantics. No workflow_dispatch exists on this
// workflow; manual diagnosis must use mocked fixtures or a separate
// non-AA path. The .github/pareto-quota.json counter is telemetry only
// (not enforcement) and may undercount if a run fails before persistence.
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

// Observable records for the Action summary / artifact trail.
const unmatchedAa = aaResult.models.filter(
  (m) => !resolveAaSlug(m.slug) && !aaMapped.matched.has(m.slug) && !parseOrId(m.slug)
);
const unmatchedOrOnly = orMapped.unmatched.filter(
  (u) => u.source === "openrouter" && !aaMapped.matched.has(u.sourceId)
);
const astraMissingFromAa = !aaResult.models.some((m) => m.slug === "gpt-6-astra");
const museJoined = !orMapped.unmatched.some((u) => u.sourceId === "meta/muse-spark-1.3");
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

await writeFile(
  resolve(process.cwd(), "src/data/pareto-aa-fallback.json"),
  `${JSON.stringify(snapshot, null, 2)}\n`,
  "utf8"
);
// Telemetry only: records actual pages consumed per day. Not an enforcement
// boundary — the hard cap is AA_MAX_PAGES_PER_RUN in fetchAaAllPages plus
// the 2-run schedule. The file may undercount if a run fails before here.
await writeFile(
  resolve(process.cwd(), ".github/pareto-quota.json"),
  `${JSON.stringify({ date: new Date().toISOString().slice(0, 10), aaRequestsUsed: pagesUsed, perRunPageCap: AA_MAX_PAGES_PER_RUN, note: "telemetry, not enforcement" }, null, 2)}\n`,
  "utf8"
);
console.log(JSON.stringify({
  generatedAt,
  aaModels: aaResult.models.length,
  matchedQuality: qualityCount,
  models: models.length,
  unmatchedAaCount: unmatchedAa.length,
  unmatchedAaSample: unmatchedAa.slice(0, 10).map((m) => m.slug),
  unmatchedOrCount: unmatchedOrOnly.length,
  unmatchedOrSample: unmatchedOrOnly.slice(0, 10).map((u) => u.sourceId),
  astraMissingFromAa,
  museJoined,
}));
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
