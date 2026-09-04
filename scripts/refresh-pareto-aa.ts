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

const aaResult = await fetchAaAllPages({ apiKey, maxPages: 10, pageSize: 200 });
if (aaResult.pagination.hasMore) {
  throw new Error(`AA catalogue was truncated after page ${aaResult.pagination.page}`);
}

const aaMapped = mapAaModels(aaResult.models, aaResult.intelligenceIndexVersion);
const qualityCount = [...aaMapped.matched.values()].filter(
  (model) => model.aa?.intelligenceIndex != null || model.aa?.codingIndex != null || model.aa?.agenticIndex != null
).length;
if (qualityCount === 0) throw new Error("AA refresh rejected: zero matched quality records");

const orResult = await fetchOpenRouterModels();
const orMapped = mapOpenRouterModels(orResult.models);
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
console.log(JSON.stringify({ generatedAt, aaModels: aaResult.models.length, matchedQuality: qualityCount, models: models.length }));
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
