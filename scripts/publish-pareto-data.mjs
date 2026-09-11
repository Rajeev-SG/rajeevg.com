#!/usr/bin/env node
/**
 * Publish the validated Pareto snapshot to the dedicated `pareto-data` branch.
 *
 * WHY A GIT BRANCH INSTEAD OF OBJECT STORAGE
 *   Vercel Blob is metered per OPERATION on the Hobby plan:
 *     2,000 advanced ops/month  (put / copy / list)
 *    10,000 simple   ops/month  (URL fetch that is a cache MISS, head)
 *   plus 1 GB storage and 10 GB transfer. The team's shared allowance was
 *   exhausted — 99.5% of the advanced ops came from an unrelated publisher —
 *   and Vercel suspended every Blob store on the team for 30 days, breaking
 *   this refresh with `HTTP 502 ... This store has been suspended`.
 *   A Git branch has no per-operation quota, is versioned and auditable, and
 *   costs nothing.
 *
 * WHY THIS DOES NOT CREATE A VERCEL DEPLOYMENT
 *   `vercel.json` sets `git.deploymentEnabled["pareto-data"] = false`. The
 *   branch is created from the tip of `main` and then has exactly one file
 *   added, so `vercel.json` is always present when Vercel evaluates the push.
 *
 * Contract: refuses to publish an empty/malformed snapshot, so the last known
 * good data on the branch is never replaced by a bad payload.
 */
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const TOKEN = process.env.GITHUB_TOKEN;
const REPO = process.env.GITHUB_REPOSITORY ?? "Rajeev-SG/rajeevg.com";
const DATA_BRANCH = process.env.PARETO_DATA_BRANCH ?? "pareto-data";
const BASE_BRANCH = process.env.PARETO_MAIN_BRANCH ?? "main";
const SNAPSHOT_PATH = process.env.PARETO_SNAPSHOT_PATH ?? "pareto-aa-fallback.json";
const LOCAL_SNAPSHOT = resolve(
  process.cwd(),
  process.env.PARETO_SNAPSHOT_SOURCE ?? "src/data/pareto-aa-fallback.json"
);

const API = `https://api.github.com/repos/${REPO}`;
const HEADERS = {
  Accept: "application/vnd.github+json",
  Authorization: `Bearer ${TOKEN}`,
  "Content-Type": "application/json",
  "X-GitHub-Api-Version": "2022-11-28",
};

/** Exit non-zero with a readable message; used for every failure path. */
function fail(message, detail) {
  console.error(`publish-pareto-data: ${message}${detail ? ` — ${detail}` : ""}`);
  process.exit(1);
}

async function gh(path, init = {}) {
  const res = await fetch(`${API}${path}`, { ...init, headers: { ...HEADERS, ...(init.headers ?? {}) } });
  const text = await res.text();
  let body = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }
  return { status: res.status, ok: res.ok, body };
}

async function main() {
  if (!TOKEN) fail("GITHUB_TOKEN is required");

  const raw = await readFile(LOCAL_SNAPSHOT, "utf8").catch(() => null);
  if (raw === null) fail(`snapshot not found at ${LOCAL_SNAPSHOT}`);

  // Validate before publishing. An empty/partial refresh must never replace the
  // last known good snapshot on the branch.
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    fail("snapshot is not valid JSON", error instanceof Error ? error.message : String(error));
  }
  const models = Array.isArray(parsed?.models) ? parsed.models : [];
  const quality = models.filter((m) => typeof m?.aa?.intelligenceIndex === "number").length;
  if (models.length === 0 || quality === 0 || !parsed?.generatedAt) {
    fail(`refusing to publish (models=${models.length}, quality=${quality}, generatedAt=${parsed?.generatedAt})`);
  }

  // 1. Ensure the data branch exists, branched from the tip of main.
  const branch = encodeURIComponent(DATA_BRANCH);
  const existingRef = await gh(`/git/ref/heads/${branch}`);
  if (existingRef.status === 404) {
    const baseRef = await gh(`/git/ref/heads/${encodeURIComponent(BASE_BRANCH)}`);
    if (!baseRef.ok) fail(`cannot read base branch ${BASE_BRANCH}`, JSON.stringify(baseRef.body));
    const created = await gh(`/git/refs`, {
      method: "POST",
      body: JSON.stringify({ ref: `refs/heads/${DATA_BRANCH}`, sha: baseRef.body.object.sha }),
    });
    if (!created.ok && created.status !== 422) {
      fail(`cannot create branch ${DATA_BRANCH}`, JSON.stringify(created.body));
    }
  } else if (!existingRef.ok) {
    fail(`cannot read branch ${DATA_BRANCH}`, JSON.stringify(existingRef.body));
  }

  // 2. Upsert the snapshot file on that branch (needs the current blob sha).
  const existingFile = await gh(`/contents/${SNAPSHOT_PATH}?ref=${branch}`);
  const put = await gh(`/contents/${SNAPSHOT_PATH}`, {
    method: "PUT",
    body: JSON.stringify({
      message: `data(pareto): publish validated snapshot ${parsed.generatedAt}`,
      content: Buffer.from(raw, "utf8").toString("base64"),
      branch: DATA_BRANCH,
      ...(existingFile.ok && existingFile.body?.sha ? { sha: existingFile.body.sha } : {}),
    }),
  });
  if (!put.ok) fail(`cannot write ${SNAPSHOT_PATH}`, JSON.stringify(put.body));

  console.log(
    JSON.stringify({
      published: true,
      branch: DATA_BRANCH,
      path: SNAPSHOT_PATH,
      commit: put.body?.commit?.sha ?? null,
      models: models.length,
      quality,
      generatedAt: parsed.generatedAt,
      note: "Vercel ignores this branch (vercel.json git.deploymentEnabled), so no deployment is created.",
    })
  );
}

await main();
