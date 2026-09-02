/**
 * OpenRouter Models API adapter.
 *
 * Official docs: https://openrouter.ai/docs/api/reference/list-available-models
 * - GET https://openrouter.ai/api/v1/models (public, no auth required)
 * - pricing.prompt and pricing.completion are per-token STRING values.
 *   Convert: USD_per_1M = parseFloat(price) * 1_000_000.
 *
 * All fetching is server-side only.
 */
import type { CanonicalModel, UnmatchedRecord } from "./types";
import { resolveOpenRouterId } from "./aliases";

const OR_ENDPOINT = "https://openrouter.ai/api/v1/models";

/** Convert OpenRouter per-token price string to USD per 1M tokens. */
export function perTokenToPerMillion(price: string | number | undefined | null): number | null {
  if (price === undefined || price === null) return null;
  const n = typeof price === "string" ? parseFloat(price) : price;
  if (Number.isNaN(n)) return null;
  return n * 1_000_000;
}

export interface OpenRouterModelRaw {
  id: string;
  canonical_slug?: string;
  name: string;
  created?: number;
  context_length?: number;
  architecture?: Record<string, unknown>;
  pricing?: {
    prompt?: string;
    completion?: string;
  };
}

export interface OpenRouterFetchResult {
  models: Array<{
    id: string;
    name: string;
    canonicalSlug: string | null;
    inputPerMillion: number | null;
    outputPerMillion: number | null;
    contextLength: number | null;
    createdAtUnix: number | null;
  }>;
  fetchedAt: string;
}

interface OpenRouterResponse {
  data?: OpenRouterModelRaw[];
}

/**
 * Fetch one page of the OpenRouter models listing. Exposed for tests.
 * OpenRouter uses a flat list (no pagination) in the official v1 API.
 */
export async function fetchOpenRouterModels(signal?: AbortSignal): Promise<OpenRouterFetchResult> {
  const res = await fetch(OR_ENDPOINT, {
    headers: { Accept: "application/json" },
    signal,
    // CDN-cached by OpenRouter; hourly server revalidate is safe and sufficient.
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`OpenRouter API returned ${res.status}`);
  const json = (await res.json()) as OpenRouterResponse;
  const models = (json.data ?? []).map((raw) => ({
    id: raw.id,
    name: raw.name,
    canonicalSlug: raw.canonical_slug ?? null,
    inputPerMillion: perTokenToPerMillion(raw.pricing?.prompt),
    outputPerMillion: perTokenToPerMillion(raw.pricing?.completion),
    contextLength: raw.context_length ?? null,
    createdAtUnix: raw.created ?? null,
  }));
  return { models, fetchedAt: new Date().toISOString() };
}

/**
 * Map OpenRouter model records into canonical models using the alias map.
 * Returns (matched, unmatched) pairs.
 */
export function mapOpenRouterModels(
  orModels: OpenRouterFetchResult["models"]
): { matched: Map<string, Partial<CanonicalModel>>; unmatched: UnmatchedRecord[] } {
  const matched = new Map<string, Partial<CanonicalModel>>();
  const unmatched: UnmatchedRecord[] = [];

  for (const m of orModels) {
    const entry = resolveOpenRouterId(m.id);
    if (!entry) {
      unmatched.push({
        source: "openrouter",
        sourceId: m.id,
        displayName: m.name,
        reason: `OpenRouter id "${m.id}" not in explicit alias map`,
      });
      continue;
    }
    matched.set(entry.canonicalId, {
      canonicalId: entry.canonicalId,
      displayName: entry.displayName,
      organisation: entry.organisation,
      openrouter: {
        modelId: m.id,
        inputPricePerMillion: m.inputPerMillion,
        outputPricePerMillion: m.outputPerMillion,
        contextLength: m.contextLength,
        createdAtUnix: m.createdAtUnix,
      },
    });
  }
  return { matched, unmatched };
}
