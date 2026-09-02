/**
 * LM Arena official HF Dataset Viewer adapter.
 *
 * Dataset: lmarena-ai/leaderboard-dataset (public, CC-BY-4.0).
 * Interface: https://datasets-server.huggingface.co/rows
 *   ?dataset=lmarena-ai/leaderboard-dataset&config=<c>&split=latest&offset=<n>&length=100
 * Slices max 100 rows; paginate until fewer than `length` rows return.
 *
 * Methodology distinction (critical):
 * - webdev / text_style_control configs: Bradley-Terry Arena Scores.
 *   Fields: rating, rating_lower, rating_upper, vote_count, rank.
 * - agent config: IPS scores (NOT Bradley-Terry/Elo).
 *   Fields: score, score_ci_lower, score_ci_upper, observation_count, session_count, rank.
 *
 * All fetching is server-side only.
 */
import type { CanonicalModel, UnmatchedRecord } from "./types";
import { resolveArenaName } from "./aliases";

const DATASET_SERVER = "https://datasets-server.huggingface.co";
export const ARENA_CONFIGS = ["webdev", "text_style_control", "agent"] as const;
export type ArenaConfig = (typeof ARENA_CONFIGS)[number];
const PAGE_LENGTH = 100;

export interface ArenaBradleyTerryRow {
  model_name: string;
  organization?: string;
  rating: number;
  rating_lower: number;
  rating_upper: number;
  variance?: number;
  vote_count: number;
  rank: number;
  category: string;
  leaderboard_publish_date: string;
}

export interface ArenaIpsRow {
  model_name: string;
  organization?: string;
  score: number;
  score_ci_lower: number;
  score_ci_upper: number;
  observation_count: number;
  session_count: number;
  rank: number;
  category: string;
  leaderboard_publish_date: string;
}

interface ArenaRowsResponse {
  num_rows_total?: number;
  rows?: Array<{ row: Record<string, unknown> }>;
}

export type ArenaFetchPage = typeof fetchArenaPage;

/**
 * Fetch one page of the Dataset Viewer rows endpoint. Exposed for pagination tests.
 */
export async function fetchArenaPage(
  config: string,
  offset: number,
  signal?: AbortSignal
): Promise<{ response: ArenaRowsResponse; headers: Headers }> {
  const url = `${DATASET_SERVER}/rows?dataset=lmarena-ai/leaderboard-dataset&config=${encodeURIComponent(config)}&split=latest&offset=${offset}&length=${PAGE_LENGTH}`;
  const maxAttempts = 4;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal,
      cache: "no-store",
    });
    if (res.status === 429 && attempt < maxAttempts) {
      const retryAfter = res.headers.get("Retry-After");
      const delayMs = (retryAfter ? parseInt(retryAfter, 10) : 30) * 1000;
      await new Promise((r) => setTimeout(r, delayMs));
      continue;
    }
    if (!res.ok) throw new Error(`Arena Dataset Viewer returned ${res.status}`);
    const json = (await res.json()) as ArenaRowsResponse;
    return { response: json, headers: res.headers };
  }
  throw new Error(`Arena Dataset Viewer: retries exhausted`);
}

/**
 * Paginate through all rows for a config, up to safety cap maxPages.
 * Stops when the returned row count is < PAGE_LENGTH or num_rows_total is reached.
 */
export async function fetchArenaAllRows(
  config: string,
  options?: { maxPages?: number; fetchPage?: ArenaFetchPage }
): Promise<ArenaRowsResponse["rows"] extends undefined ? never[] : Array<{ row: Record<string, unknown> }>> {
  const { maxPages = 100, fetchPage = fetchArenaPage } = options ?? {};
  const allRows: Array<{ row: Record<string, unknown> }> = [];
  let offset = 0;
  for (let page = 0; page < maxPages; page++) {
    // Datasets-server rate-limits rapid sequential page requests; space them out.
    if (page > 0) await new Promise((r) => setTimeout(r, 1200));
    const { response } = await fetchPage(config, offset);
    const rows = response.rows ?? [];
    allRows.push(...rows);
    if (rows.length < PAGE_LENGTH) break;
    if (typeof response.num_rows_total === "number" && allRows.length >= response.num_rows_total) break;
    offset += PAGE_LENGTH;
  }
  return allRows as never[];
}

/**
 * Fetch all three required latest subsets and return structured data.
 */
export async function fetchArenaSnapshot(): Promise<ArenaSnapshotData> {
  // Space out configs as well as pages: datasets-server enforces per-IP quota.
  const webdevRows = await fetchArenaAllRows("webdev");
  await new Promise((r) => setTimeout(r, 2000));
  const textStyleRows = await fetchArenaAllRows("text_style_control");
  await new Promise((r) => setTimeout(r, 2000));
  const agentRows = await fetchArenaAllRows("agent");
  return {
    webdev: webdevRows.map((r) => r.row as unknown as ArenaBradleyTerryRow),
    textStyleControl: textStyleRows.map((r) => r.row as unknown as ArenaBradleyTerryRow),
    agent: agentRows.map((r) => r.row as unknown as ArenaIpsRow),
    fetchedAt: new Date().toISOString(),
  };
}

export interface ArenaSnapshotData {
  webdev: ArenaBradleyTerryRow[];
  textStyleControl: ArenaBradleyTerryRow[];
  agent: ArenaIpsRow[];
  fetchedAt: string;
}

/**
 * Map Arena rows into canonical models. Preserves BT vs IPS semantics.
 */
export function mapArenaModels(
  snapshot: ArenaSnapshotData
): { matched: Map<string, Partial<CanonicalModel>>; unmatched: UnmatchedRecord[]; arenaPublishedAt: string | null } {
  const matched = new Map<string, Partial<CanonicalModel>>();
  const unmatched: UnmatchedRecord[] = [];
  let arenaPublishedAt: string | null = null;

  const mergeBt = (
    canonicalId: string,
    row: ArenaBradleyTerryRow,
    slot: "overall" | "webdev"
  ) => {
    const existing = matched.get(canonicalId);
    const arena = existing?.arena ?? { overall: null, webdev: null, agent: null };
    const bt = {
      rating: row.rating,
      ratingLower: row.rating_lower,
      ratingUpper: row.rating_upper,
      voteCount: row.vote_count,
      rank: row.rank,
      category: row.category,
      publishedAt: row.leaderboard_publish_date,
    };
    arena[slot] = bt;
    if (slot === "webdev" && row.leaderboard_publish_date) {
      arenaPublishedAt = arenaPublishedAt ?? row.leaderboard_publish_date;
    }
    matched.set(canonicalId, { ...existing, canonicalId, arena });
  };

  for (const row of snapshot.textStyleControl) {
    const entry = resolveArenaName(row.model_name);
    if (!entry) {
      unmatched.push({
        source: "arena",
        sourceId: row.model_name,
        displayName: row.model_name,
        reason: `Arena name "${row.model_name}" (text_style_control) not in explicit alias map`,
      });
      continue;
    }
    mergeBt(entry.canonicalId, row, "overall");
  }

  for (const row of snapshot.webdev) {
    const entry = resolveArenaName(row.model_name);
    if (!entry) {
      unmatched.push({
        source: "arena",
        sourceId: row.model_name,
        displayName: row.model_name,
        reason: `Arena name "${row.model_name}" (webdev) not in explicit alias map`,
      });
      continue;
    }
    mergeBt(entry.canonicalId, row, "webdev");
  }

  for (const row of snapshot.agent) {
    const entry = resolveArenaName(row.model_name);
    if (!entry) {
      unmatched.push({
        source: "arena",
        sourceId: row.model_name,
        displayName: row.model_name,
        reason: `Arena name "${row.model_name}" (agent) not in explicit alias map`,
      });
      continue;
    }
    const existing = matched.get(entry.canonicalId);
    const arena = existing?.arena ?? { overall: null, webdev: null, agent: null };
    arena.agent = {
      score: row.score,
      scoreLower: row.score_ci_lower,
      scoreUpper: row.score_ci_upper,
      observationCount: row.observation_count,
      sessionCount: row.session_count,
      rank: row.rank,
      category: row.category,
      publishedAt: row.leaderboard_publish_date,
    };
    if (row.leaderboard_publish_date) {
      arenaPublishedAt = arenaPublishedAt ?? row.leaderboard_publish_date;
    }
    matched.set(entry.canonicalId, { ...existing, canonicalId: entry.canonicalId, arena });
  }

  return { matched, unmatched, arenaPublishedAt };
}
