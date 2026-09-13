#!/usr/bin/env tsx
/**
 * Publish the validated Agent Benchmark Matrix snapshot to the dedicated
 * `benchmark-data` branch.
 *
 * The snapshot is composed here from the seed registries (exactly what the app
 * renders as its bundled fallback) so there is no second, duplicated copy of
 * the data on disk to drift or to bloat diffs.
 *
 * Same design reasons as the Pareto data publisher:
 *   - Vercel Blob is metered per operation and was suspended team-wide once;
 *     a Git branch has no quota, is versioned, and is free.
 *   - `vercel.json` sets `git.deploymentEnabled["benchmark-data"] = false`, and
 *     the branch is created from the tip of `main` so that file is present when
 *     Vercel evaluates the push. A data refresh therefore never deploys the site.
 *
 * Contract: refuses to publish an empty, malformed or shrunken snapshot, so the
 * last known good data on the branch is never replaced by a bad payload.
 *
 * Run: pnpm exec tsx scripts/publish-agent-benchmark-data.ts
 */
import type { BenchmarkSnapshot } from "../src/lib/agent-benchmarks/types";
import { seedSnapshot } from "../src/lib/agent-benchmarks/registry";
import { validateSnapshot } from "../src/lib/agent-benchmarks/validation";

const TOKEN = process.env.GITHUB_TOKEN;
const REPO = process.env.GITHUB_REPOSITORY ?? "Rajeev-SG/rajeevg.com";
const DATA_BRANCH = process.env.AGENT_BENCHMARK_DATA_BRANCH ?? "benchmark-data";
const BASE_BRANCH = process.env.AGENT_BENCHMARK_MAIN_BRANCH ?? "main";
const SNAPSHOT_PATH = process.env.AGENT_BENCHMARK_SNAPSHOT_PATH ?? "agent-benchmark-snapshot.json";

const API = `https://api.github.com/repos/${REPO}`;

function fail(message: string, detail?: string): never {
  console.error(`publish-agent-benchmark-data: ${message}${detail ? ` — ${detail}` : ""}`);
  process.exit(1);
}

async function gh(path: string, init: RequestInit = {}) {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(init.headers ?? {}),
    },
  });
  const text = await res.text();
  let body: unknown = null;
  if (text) {
    try { body = JSON.parse(text); } catch { body = text; }
  }
  return { status: res.status, ok: res.ok, body: body as Record<string, unknown> };
}

function countReported(snapshot: BenchmarkSnapshot): number {
  return snapshot.results.filter((r) => r.scoreState === "reported" && r.score !== null).length;
}

async function readExistingReportedCount(branch: string): Promise<number> {
  const file = await gh(`/contents/${SNAPSHOT_PATH}?ref=${encodeURIComponent(branch)}`);
  const body = file.body as { content?: string } | null;
  if (!file.ok || !body?.content) return 0;
  try {
    const parsed = JSON.parse(Buffer.from(body.content, "base64").toString("utf8")) as BenchmarkSnapshot;
    return Array.isArray(parsed?.results) ? countReported(parsed) : 0;
  } catch {
    return 0;
  }
}

async function main() {
  if (!TOKEN) fail("GITHUB_TOKEN is required");

  const snapshot = seedSnapshot();
  const validation = validateSnapshot(snapshot);
  if (!validation.ok) fail("snapshot failed validation", validation.errors.join(" · "));

  const reported = countReported(snapshot);
  if (reported === 0 || snapshot.benchmarks.length === 0) {
    fail(`refusing to publish (benchmarks=${snapshot.benchmarks.length}, reported=${reported})`);
  }

  const branch = encodeURIComponent(DATA_BRANCH);
  const existingRef = await gh(`/git/ref/heads/${branch}`);
  if (existingRef.status === 404) {
    const baseRef = await gh(`/git/ref/heads/${encodeURIComponent(BASE_BRANCH)}`);
    const baseObject = (baseRef.body as { object?: { sha?: string } } | null)?.object;
    if (!baseRef.ok || !baseObject?.sha) fail(`cannot read base branch ${BASE_BRANCH}`, JSON.stringify(baseRef.body));
    const created = await gh(`/git/refs`, { method: "POST", body: JSON.stringify({ ref: `refs/heads/${DATA_BRANCH}`, sha: baseObject.sha }) });
    if (!created.ok && created.status !== 422) fail(`cannot create branch ${DATA_BRANCH}`, JSON.stringify(created.body));
  } else if (!existingRef.ok) {
    fail(`cannot read branch ${DATA_BRANCH}`, JSON.stringify(existingRef.body));
  }

  const previousReported = await readExistingReportedCount(DATA_BRANCH);
  if (previousReported > 0 && reported < previousReported * 0.5) {
    fail(`refusing to publish a suspicious shrink (reported=${reported} vs previous=${previousReported})`);
  }

  const raw = JSON.stringify(snapshot, null, 2) + "\n";
  const existingFile = await gh(`/contents/${SNAPSHOT_PATH}?ref=${branch}`);
  const existingSha = (existingFile.body as { sha?: string } | null)?.sha;
  const put = await gh(`/contents/${SNAPSHOT_PATH}`, {
    method: "PUT",
    body: JSON.stringify({
      message: `data(agent-benchmarks): publish validated snapshot ${snapshot.generatedAt}`,
      content: Buffer.from(raw, "utf8").toString("base64"),
      branch: DATA_BRANCH,
      ...(existingFile.ok && existingSha ? { sha: existingSha } : {}),
    }),
  });
  if (!put.ok) fail(`cannot write ${SNAPSHOT_PATH}`, JSON.stringify(put.body));

  const commit = (put.body as { commit?: { sha?: string } } | null)?.commit?.sha ?? null;
  console.log(JSON.stringify({
    published: true,
    branch: DATA_BRANCH,
    path: SNAPSHOT_PATH,
    commit,
    benchmarks: snapshot.benchmarks.length,
    reported,
    generatedAt: snapshot.generatedAt,
    note: "Vercel ignores this branch (vercel.json git.deploymentEnabled), so no deployment is created.",
  }));
}

await main();
