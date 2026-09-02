import { describe, expect, it } from "vitest";
import { fetchArenaAllRows, mapArenaModels } from "../arena";
import type { ArenaBradleyTerryRow, ArenaIpsRow } from "../arena";

const PAGE = 100;

function mkBtRows(count: number, startName: number = 0): ArenaBradleyTerryRow[] {
  return Array.from({ length: count }, (_, i) => ({
    model_name: i === 0 ? "GPT-5" : `Unknown BT Model ${startName + i}`,
    organization: "Test",
    rating: 1400 - i,
    rating_lower: 1380 - i,
    rating_upper: 1420 - i,
    variance: 10,
    vote_count: 10000 - i,
    rank: i + 1,
    category: "text",
    leaderboard_publish_date: "2026-08-31",
  }));
}

function mkIpsRows(count: number, startName: number = 0): ArenaIpsRow[] {
  return Array.from({ length: count }, (_, i) => ({
    model_name: i === 0 ? "GPT-5" : `Unknown IPS Model ${startName + i}`,
    organization: "Test",
    score: 0.2 - i * 0.001,
    score_ci_lower: 0.19 - i * 0.001,
    score_ci_upper: 0.21 - i * 0.001,
    observation_count: 5000 - i,
    session_count: 500 - i,
    rank: i + 1,
    category: "agent",
    leaderboard_publish_date: "2026-08-31",
  }));
}

function mkFetchPage(config: string, rows: ArenaBradleyTerryRow[] | ArenaIpsRow[]) {
  return async (calledConfig: string, offset: number) => {
    if (calledConfig !== config) throw new Error("wrong config");
    const slice = rows.slice(offset, offset + PAGE);
    return {
      response: { num_rows_total: rows.length, rows: slice.map((row) => ({ row: row as unknown as Record<string, unknown> })) },
      headers: { get: () => null } as unknown as Headers,
    };
  };
}

describe("Arena Dataset Viewer pagination", () => {
  it("paginates until fewer than 100 rows returned", async () => {
    const rows = mkBtRows(230);
    let calls = 0;
    const fetchPage = mkFetchPage("webdev", rows);
    const all = await fetchArenaAllRows("webdev", { fetchPage: async (c, o) => { calls++; return fetchPage(c, o); } });
    expect(calls).toBe(3); // 100 + 100 + 30
    expect(all).toHaveLength(230);
  });

  it("stops immediately when first page has fewer than 100", async () => {
    const rows = mkIpsRows(50);
    let calls = 0;
    const fetchPage = mkFetchPage("agent", rows);
    await fetchArenaAllRows("agent", { fetchPage: async (c, o) => { calls++; return fetchPage(c, o); } });
    expect(calls).toBe(1);
  });
});

describe("Arena Bradley-Terry vs IPS field distinction", () => {
  it("maps BT webdev rows to rating fields and IPS agent rows to score fields", async () => {
    const webdevRows = mkBtRows(1);
    const agentRows = mkIpsRows(1);
    const snapshot = {
      webdev: webdevRows,
      agent: agentRows,
      fetchedAt: "2026-09-02T00:00:00Z",
    };
    const { matched } = mapArenaModels(snapshot);
    const gpt5 = matched.get("openai-gpt-5");
    expect(gpt5).toBeTruthy();
    expect(gpt5!.arena!.webdev!.rating).toBe(1400);
    expect(gpt5!.arena!.webdev!.ratingLower).toBe(1380);
    expect(gpt5!.arena!.webdev!.ratingUpper).toBe(1420);
    expect(gpt5!.arena!.webdev!.voteCount).toBe(10000);
    // IPS semantics preserved separately
    expect(gpt5!.arena!.agent!.score).toBeCloseTo(0.2, 10);
    expect(gpt5!.arena!.agent!.scoreLower).toBeCloseTo(0.19, 10);
    expect(gpt5!.arena!.agent!.scoreUpper).toBeCloseTo(0.21, 10);
    expect(gpt5!.arena!.agent!.observationCount).toBe(5000);
    expect(gpt5!.arena!.agent!.sessionCount).toBe(500);
  });

  it("surfaces unmatched Arena models", async () => {
    const snapshot = {
      webdev: mkBtRows(2) as ArenaBradleyTerryRow[],
      agent: mkIpsRows(1) as ArenaIpsRow[],
      fetchedAt: "2026-09-02T00:00:00Z",
    };
    const { matched, unmatched } = mapArenaModels(snapshot);
    expect(matched.get("openai-gpt-5")).toBeTruthy();
    expect(unmatched.length).toBeGreaterThanOrEqual(1);
    expect(unmatched.some((u) => u.reason.includes("webdev"))).toBe(true);
  });
});
