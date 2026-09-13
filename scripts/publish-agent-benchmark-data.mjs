#!/usr/bin/env node
/**
 * Publish the validated Agent Benchmark Matrix snapshot to the dedicated
 * `benchmark-data` branch.
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
 */
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const TOKEN = process.env.GITHUB_TOKEN;
const REPO = process.env.GITHUB_REPOSITORY ?? "Rajeev-SG/rajeevg.com";
const DATA_BRANCH = process.env.AGENT_BENCHMARK_DATA_BRANCH ?? "benchmark-data";
const BASE_BRANCH = process.env.AGENT_BENCHMARK_MAIN_BRANCH ?? "main";
const SNAPSHOT_PATH = process.env.AGENT_BENCHMARK_SNAPSHOT_PATH ?? "agent-benchmark-snapshot.json";
const LOCAL_SNAPSHOT = resolve(process.env.AGENT_BENCHMARK_SNAPSHOT_SOURCE ?? "src/data/agent-benchmarks/fallback-snapshot.json");

const API = `https://api.github.com/repos/${REPO}`;
const HEADERS = {
  Accept: "application/vnd.github+json",
  Authorization: `Bearer ${TOKEN}`,
  "Content-Type": "application/json",
  "X-GitHub-Api-Version": "2022-11-28",
};

function fail(message, detail) {
  console.error(`publish-agent-benchmark-data: ${message}${detail ? ` — ${detail}` : ""}`);
  process.exit(1);
}

async function gh(path, init = {}) {
  const res = await fetch(`${API}${path}`, { ...init, headers: { ...HEADERS, ...(init.headers ?? {}) } });
  const text = await res.text();
  let body = null;
  if (text) {
    try { body = JSON.parse(text); } catch { body = text; }
  }
  return { status: res.status, ok: res.ok, body };
}

async function readExistingReportedCount(branch) {
  const file = await gh(`/contents/${SNAPSHOT_PATH}?ref=${branch}`);
  if (!file.ok || !file.body?.content) return 0;
  try {
    const parsed = JSON.parse(Buffer.from(file.body.content, "base64").toString("utf8"));
    return Array.isArray(parsed?.results) ? parsed.results.filter((r) => r?.scoreState === "reported" && r?.score !== null).length : 0;
  } catch {
    return 0;
  }
}

async function main() {
  if (!TOKEN) fail("GITHUB_TOKEN is required");

  const raw = await readFile(LOCAL_SNAPSHOT, "utf8").catch(() => null);
  if (raw === null) fail(`snapshot not found at ${LOCAL_SNAPSHOT}`);

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    fail("snapshot is not valid JSON", error instanceof Error ? error.message : String(error));
  }

  const results = Array.isArray(parsed?.results) ? parsed.results : [];
  const reported = results.filter((r) => r?.scoreState === "reported" && r?.score !== null);
  if (results.length === 0 || reported.length === 0 || !parsed?.generatedAt) {
    fail(`refusing to publish (results=${results.length}, reported=${reported.length}, generatedAt=${parsed?.generatedAt})`);
  }

  const branch = encodeURIComponent(DATA_BRANCH);
  const existingRef = await gh(`/git/ref/heads/${branch}`);
  if (existingRef.status === 404) {
    const baseRef = await gh(`/git/ref/heads/${encodeURIComponent(BASE_BRANCH)}`);
    if (!baseRef.ok) fail(`cannot read base branch ${BASE_BRANCH}`, JSON.stringify(baseRef.body));
    const created = await gh(`/git/refs`, {
      method: "POST",
      body: JSON.stringify({ ref: `refs/heads/${DATA_BRANCH}`, sha: baseRef.body.object.sha }),
    });
    if (!created.ok && created.status !== 422) fail(`cannot create branch ${DATA_BRANCH}`, JSON.stringify(created.body));
  } else if (!existingRef.ok) {
    fail(`cannot read branch ${DATA_BRANCH}`, JSON.stringify(existingRef.body));
  }

  const previousReported = await readExistingReportedCount(branch);
  if (previousReported > 0 && reported.length < previousReported * 0.5) {
    fail(`refusing to publish a suspicious shrink (reported=${reported.length} vs previous=${previousReported})`);
  }

  const existingFile = await gh(`/contents/${SNAPSHOT_PATH}?ref=${branch}`);
  const put = await gh(`/contents/${SNAPSHOT_PATH}`, {
    method: "PUT",
    body: JSON.stringify({
      message: `data(agent-benchmarks): publish validated snapshot ${parsed.generatedAt}`,
      content: Buffer.from(raw, "utf8").toString("base64"),
      branch: DATA_BRANCH,
      ...(existingFile.ok && existingFile.body?.sha ? { sha: existingFile.body.sha } : {}),
    }),
  });
  if (!put.ok) fail(`cannot write ${SNAPSHOT_PATH}`, JSON.stringify(put.body));

  console.log(JSON.stringify({
    published: true,
    branch: DATA_BRANCH,
    path: SNAPSHOT_PATH,
    commit: put.body?.commit?.sha ?? null,
    reported,
    generatedAt: parsed.generatedAt,
    note: "Vercel ignores this branch (vercel.json git.deploymentEnabled), so no deployment is created.",
  }));
}

await main();
