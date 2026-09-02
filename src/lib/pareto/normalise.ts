/**
 * Assemble canonical models from per-source matches, computing blended cost
 * and exposing the formula explicitly.
 */
import type { CanonicalModel, SourceFreshness } from "./types";

export const DEFAULT_INPUT_SHARE = 0.8;
export const DEFAULT_OUTPUT_SHARE = 0.2;

export function blendedCostPerMillion(
  inputPerMillion: number | null,
  outputPerMillion: number | null,
  inputShare: number,
  outputShare: number
): number | null {
  if (inputPerMillion === null || outputPerMillion === null) return null;
  return inputShare * inputPerMillion + outputShare * outputPerMillion;
}

export interface SnapshotBuilderInput {
  aa: ReturnType<typeof import("./artificial-analysis").mapAaModels>["matched"] extends Map<string, infer V> ? V : never;
  openrouter: Map<string, Partial<CanonicalModel>>;
  arena: Map<string, Partial<CanonicalModel>>;
  aaFetchedAt: string | null;
  aaStatus: SourceFreshness["aaStatus"];
  openrouterFetchedAt: string | null;
  openrouterStatus: SourceFreshness["openrouterStatus"];
  arenaFetchedAt: string | null;
  arenaStatus: SourceFreshness["arenaStatus"];
  arenaPublishedAt: string | null;
}

/**
 * Merge per-source matched partials into a single canonical model list.
 * Only models matched in the alias map participate; per-source records not
 * matching stay in UNMATCHED (handled by each adapter's map function).
 */
export function mergeCanonicalModels(
  aaMatched: Map<string, Partial<CanonicalModel>>,
  orMatched: Map<string, Partial<CanonicalModel>>,
  arenaMatched: Map<string, Partial<CanonicalModel>>
): CanonicalModel[] {
  const canonicalIds = new Set<string>([...aaMatched.keys(), ...orMatched.keys(), ...arenaMatched.keys()]);
  const models: CanonicalModel[] = [];

  for (const id of canonicalIds) {
    const aa = aaMatched.get(id);
    const or = orMatched.get(id);
    const ar = arenaMatched.get(id);
    if (!aa && !or && !ar) continue;

    const fallbackName =
      aa?.displayName ?? or?.displayName ?? ar?.displayName ?? id;
    const fallbackOrg = aa?.organisation ?? or?.organisation ?? ar?.organisation ?? "Unknown";

    models.push({
      canonicalId: id,
      displayName: fallbackName,
      organisation: fallbackOrg,
      releaseDate: aa?.releaseDate ?? null,
      aa: aa?.aa ?? {
        intelligenceIndex: null,
        codingIndex: null,
        agenticIndex: null,
        costPerTaskUsd: null,
        throughputTokensPerSecond: null,
        latencyTtfbSeconds: null,
        intelligenceIndexVersion: null,
      },
      openrouter: or?.openrouter ?? null,
      arena: ar?.arena ?? { overall: null, webdev: null, agent: null },
    });
  }
  return models.sort((a, b) => a.canonicalId.localeCompare(b.canonicalId));
}
