/**
 * Artificial Analysis Data API v2 adapter.
 *
 * Official docs (verified 2026-09-02): https://docs.artificialanalysis.ai
 * - Free-tier endpoint: GET /api/v2/language/models/free
 * - Header: x-api-key
 * - Pagination: response.data has_more flag; iterate page=1..N until has_more=false
 * - Rate limits: Free 100 req/24h fixed window. Headers: X-RateLimit-Limit,
 *   X-RateLimit-Remaining, X-RateLimit-Reset (unix ts), Retry-After on 429.
 *
 * All fetching is server-side only. No key is exposed to the browser.
 */
import type { CanonicalModel, UnmatchedRecord } from "./types";
import { resolveAaSlug } from "./aliases";

const AA_BASE = "https://artificialanalysis.ai/api/v2";
const FREE_ENDPOINT = `${AA_BASE}/language/models/free`;

export interface AaPaginationState {
  page: number;
  totalPages: number | null;
  hasMore: boolean;
  rateLimitRemaining: number | null;
}

export interface AaFetchResult {
  models: Array<{
    id: string;
    name: string;
    slug: string;
    releaseDate: string | null;
    creatorName: string | null;
    intelligenceIndex: number | null;
    codingIndex: number | null;
    agenticIndex: number | null;
    costPerTaskUsd: number | null;
    inputPerMillion: number | null;
    outputPerMillion: number | null;
    throughput: number | null;
    latencyTtfb: number | null;
  }>;
  intelligenceIndexVersion: string | null;
  fetchedAt: string;
  pagination: AaPaginationState;
}

interface AaRawModel {
  id: string;
  name: string;
  slug: string;
  release_date?: string;
  model_creator?: { name?: string };
  evaluations?: {
    artificial_analysis_intelligence_index?: number;
    artificial_analysis_coding_index?: number;
    artificial_analysis_agentic_index?: number;
  };
  artificial_analysis_intelligence_index_cost?: {
    total_cost?: number;
    cost_per_task?: { total_cost?: number };
  };
  pricing?: {
    price_1m_input_tokens?: number;
    price_1m_output_tokens?: number;
  };
  performance?: {
    median_output_tokens_per_second?: number;
    median_time_to_first_token_seconds?: number;
  };
}

interface AaResponse {
  tier?: string;
  intelligence_index_version?: string;
  pagination?: { page: number; page_size: number; total_pages: number; has_more: boolean };
  data?: AaRawModel[];
}

function mapAaModel(raw: AaRawModel): AaFetchResult["models"][number] {
  return {
    id: raw.id,
    name: raw.name,
    slug: raw.slug,
    releaseDate: raw.release_date ?? null,
    creatorName: raw.model_creator?.name ?? null,
    intelligenceIndex: raw.evaluations?.artificial_analysis_intelligence_index ?? null,
    codingIndex: raw.evaluations?.artificial_analysis_coding_index ?? null,
    agenticIndex: raw.evaluations?.artificial_analysis_agentic_index ?? null,
    costPerTaskUsd:
      raw.artificial_analysis_intelligence_index_cost?.cost_per_task?.total_cost ??
      raw.artificial_analysis_intelligence_index_cost?.total_cost ??
      null,
    inputPerMillion: raw.pricing?.price_1m_input_tokens ?? null,
    outputPerMillion: raw.pricing?.price_1m_output_tokens ?? null,
    throughput: raw.performance?.median_output_tokens_per_second ?? null,
    latencyTtfb: raw.performance?.median_time_to_first_token_seconds ?? null,
  };
}

/**
 * Fetch one page of the AA free-tier endpoint.
 * Exposed for pagination tests against fixture responses.
 */
export async function fetchAaPage(
  page: number,
  apiKey: string,
  signal?: AbortSignal
): Promise<{ response: AaResponse; headers: Headers }> {
  const url = new URL(FREE_ENDPOINT);
  url.searchParams.set("page", String(page));
  const res = await fetch(url.toString(), {
    headers: { "x-api-key": apiKey, Accept: "application/json" },
    signal,
    cache: "no-store",
  });
  if (res.status === 429) {
    const retryAfter = res.headers.get("Retry-After");
    throw new AaRateLimitError(retryAfter ? parseInt(retryAfter, 10) : null);
  }
  if (!res.ok) {
    throw new Error(`AA API returned ${res.status}`);
  }
  const json = (await res.json()) as AaResponse;
  return { response: json, headers: res.headers };
}

export class AaRateLimitError extends Error {
  retryAfterSeconds: number | null;
  constructor(retryAfterSeconds: number | null) {
    super("AA API rate limited");
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

/**
 * Paginate through all AA free-tier pages, respecting rate-limit remaining.
 * maxPages is a safety cap (not assumed page count). stopAtRemaining>0 means
 * stop before exhausting quota. Default: stop when remaining <= 1.
 */
export async function fetchAaAllPages(options: {
  apiKey: string;
  maxPages?: number;
  stopAtRemaining?: number;
  fetchPage?: typeof fetchAaPage;
}): Promise<AaFetchResult> {
  const { apiKey, maxPages = 20, stopAtRemaining = 1, fetchPage = fetchAaPage } = options;
  const models: AaFetchResult["models"] = [];
  const fetchedAt = new Date().toISOString();
  let page = 1;
  let hasMore = true;
  let totalPages: number | null = null;
  let rateLimitRemaining: number | null = null;
  let intelligenceIndexVersion: string | null = null;

  while (hasMore && page <= maxPages) {
    if (rateLimitRemaining !== null && rateLimitRemaining <= stopAtRemaining) break;
    const { response, headers } = await fetchPage(page, apiKey);
    const remainingHeader = headers.get("X-RateLimit-Remaining");
    if (remainingHeader !== null) {
      const n = parseInt(remainingHeader, 10);
      if (!Number.isNaN(n)) rateLimitRemaining = n;
    }
    intelligenceIndexVersion = response.intelligence_index_version ?? intelligenceIndexVersion;
    if (response.pagination) {
      totalPages = response.pagination.total_pages;
      hasMore = response.pagination.has_more;
    } else {
      hasMore = false;
    }
    if (response.data) {
      for (const raw of response.data) models.push(mapAaModel(raw));
    }
    page += 1;
  }

  return { models, intelligenceIndexVersion, fetchedAt, pagination: { page: page - 1, totalPages, hasMore, rateLimitRemaining } };
}

/**
 * Map AA model records into canonical models using the alias map.
 * Returns (matched, unmatched) pairs.
 */
export function mapAaModels(
  aaModels: AaFetchResult["models"],
  intelligenceIndexVersion: string | null
): { matched: Map<string, Partial<CanonicalModel>>; unmatched: UnmatchedRecord[] } {
  const matched = new Map<string, Partial<CanonicalModel>>();
  const unmatched: UnmatchedRecord[] = [];

  for (const m of aaModels) {
    const entry = resolveAaSlug(m.slug);
    if (!entry) {
      unmatched.push({
        source: "aa",
        sourceId: m.slug || m.id,
        displayName: m.name,
        reason: `AA slug "${m.slug}" not in explicit alias map`,
      });
      continue;
    }
    matched.set(entry.canonicalId, {
      canonicalId: entry.canonicalId,
      displayName: entry.displayName,
      organisation: entry.organisation,
      releaseDate: m.releaseDate,
      aa: {
        intelligenceIndex: m.intelligenceIndex,
        codingIndex: m.codingIndex,
        agenticIndex: m.agenticIndex,
        costPerTaskUsd: m.costPerTaskUsd,
        throughputTokensPerSecond: m.throughput,
        latencyTtfbSeconds: m.latencyTtfb,
        intelligenceIndexVersion,
      },
    });
  }
  return { matched, unmatched };
}
