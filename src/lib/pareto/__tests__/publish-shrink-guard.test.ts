/**
 * gh-198: regression tests for the publish-time never-shrink guard.
 *
 * Failure class: a refresh that loses a chunk of the quality-scored
 * catalogue (upstream pagination hiccup, identity/join regression, missing
 * upstream tier) must refuse publication instead of replacing the
 * last-known-good durable snapshot with a materially incomplete one —
 * even when the timestamp is fresh and all HTTP calls returned 200.
 */
import { describe, expect, it } from "vitest";
import { execFileSync, spawn } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

/**
 * Standalone fake GitHub API server (runs as its own child process).
 *
 * It must be a separate process because execFileSync blocks the parent event
 * loop, and an in-parent HTTP server could not answer the requests made by
 * the publish script while the parent is blocked.
 *
 * Supported endpoints:
 *   GET  .../contents/:path?ref=pareto-data   (existing branch file, base64)
 *   GET/POST .../git/ref/heads/:branch        (branch ref / creation)
 *   POST .../git/refs                         (branch creation)
 *   PUT  .../contents/:path                   (upsert)
 *
 * argv[2] = previously published snapshot JSON, or "NONE" for a fresh branch.
 */
const FAKE_SERVER_PATH = join(tmpdir(), `pareto-fake-gh-${process.pid}.mjs`);

function writeFakeServerFile(): string {
  writeFileSync(
    FAKE_SERVER_PATH,
    `import { readFileSync } from "node:fs";
import { createServer } from "node:http";
const arg = process.argv[2];
const publishedContent = arg === "NONE"
  ? null
  : arg === "EMPTY"
    ? JSON.stringify({ generatedAt: "empty-branch", models: [] })
    : readFileSync(arg, "utf8");
const server = createServer((req, res) => {
  const url = new URL(req.url ?? "/", "http://localhost");
  const respond = (status, body) => {
    res.writeHead(status, { "content-type": "application/json" });
    res.end(JSON.stringify(body));
  };
  if (req.method === "GET" && url.pathname.includes("/contents/") && url.searchParams.get("ref")) {
    if (!publishedContent) return respond(404, { message: "Not Found" });
    return respond(200, { sha: "prevsha", content: Buffer.from(publishedContent, "utf8").toString("base64") });
  }
  if (req.method === "GET" && url.pathname.includes("/git/ref/heads/")) {
    return respond(200, { object: { sha: "branchsha" } });
  }
  if (req.method === "POST" && url.pathname.includes("/git/ref/heads/")) {
    return respond(200, { object: { sha: "mainsha" } });
  }
  if (req.method === "POST" && url.pathname.endsWith("/git/refs")) {
    return respond(201, { ref: "refs/heads/pareto-data" });
  }
  if (req.method === "PUT" && url.pathname.includes("/contents/")) {
    return respond(200, { commit: { sha: "newcommit" } });
  }
  respond(404, { message: "unexpected" });
});
server.listen(0, "127.0.0.1", () => {
  process.stdout.write(\`\${server.address().port}\n\`);
});
`
  );
  return FAKE_SERVER_PATH;
}

/** Start the fake server as its own process; resolve with its port. */
function startFakeServer(publishedContent: string | null, existingBranch: boolean): Promise<{ port: number; stop: () => void }> {
  const path = writeFakeServerFile();
  return new Promise((resolvePromise, rejectPromise) => {
    // The snapshot JSON is passed via a temp file, not argv: a 50-model
    // fixture as a single argv string is fine on macOS but the file route is
    // portable and keeps the fake server's argument surface minimal.
    const mode = existingBranch ? (publishedContent ?? "EMPTY") : "NONE";
    const snapshotFile = mode === "NONE" || mode === "EMPTY" ? null : mkdtempSync(join(tmpdir(), "pareto-fake-payload-"));
    if (snapshotFile) writeFileSync(join(snapshotFile, "payload.json"), mode);
    const child = spawn(
      process.execPath,
      [path, snapshotFile ? join(snapshotFile, "payload.json") : "NONE"],
      { stdio: ["ignore", "pipe", "pipe"] }
    );
    let out = "";
    const timer = setTimeout(() => rejectPromise(new Error("fake server did not start")), 10000);
    child.stdout.on("data", (d) => {
      out += d.toString();
      if (out.includes("\n")) {
        clearTimeout(timer);
        const port = parseInt(out.trim(), 10);
        resolvePromise({ port, stop: () => child.kill() });
      }
    });
    child.stderr.on("data", (d) => process.stderr.write(d));
  });
}

/** Build a snapshot JSON with `n` quality-scored models. */
function snapshotWithQuality(n: number, generatedAt = new Date().toISOString()): string {
  const models = Array.from({ length: n }, (_, i) => ({
    canonicalId: `openai-model-${i}`,
    displayName: `Model ${i}`,
    organisation: "OpenAI",
    releaseDate: null,
    aa: {
      slug: `model-${i}`,
      intelligenceIndex: 30 + i * 0.1,
      codingIndex: null,
      agenticIndex: null,
      costPerTaskUsd: null,
      throughputTokensPerSecond: null,
      latencyTtfbSeconds: null,
      intelligenceIndexVersion: "v3",
    },
    openrouter: null,
    arena: { overall: null, webdev: null, agent: null },
  }));
  return JSON.stringify({
    provenance: { source: "test", fetchedAt: generatedAt, aaStatus: "ok", note: "test fixture" },
    generatedAt,
    freshness: {
      aaFetchedAt: generatedAt,
      aaStatus: "ok",
      openrouterFetchedAt: generatedAt,
      openrouterStatus: "ok",
      arenaFetchedAt: null,
      arenaStatus: "pending",
      arenaPublishedAt: null,
    },
    models,
  });
}

/** Run publish-pareto-data.mjs in a sandbox backed by the fake GitHub API. */
async function runPublish(opts: {
  publishedContent: string | null;
  localSnapshot: string;
  diagnostics?: string;
}): Promise<{ code: number; stdout: string; stderr: string }> {
  const { port, stop } = await startFakeServer(opts.publishedContent, opts.publishedContent !== null);
  const dir = mkdtempSync(join(tmpdir(), "pareto-publish-"));
  writeFileSync(join(dir, "pareto-aa-fallback.json"), opts.localSnapshot);
  if (opts.diagnostics) writeFileSync(join(dir, "pareto-diagnostics.json"), opts.diagnostics);
  let stdout = "";
  let stderr = "";
  let code = 0;
  try {
    stdout = execFileSync(
      process.execPath,
      [join(process.cwd(), "scripts/publish-pareto-data.mjs")],
      {
        cwd: dir,
        timeout: 20000,
        env: {
          ...process.env,
          GITHUB_TOKEN: "test-token",
          GITHUB_API_BASE: `http://127.0.0.1:${port}`,
          PARETO_SNAPSHOT_SOURCE: "pareto-aa-fallback.json",
          PARETO_PUBLISH_SHRINK_GUARD: opts.publishedContent === null ? "0" : "1",
        },
        encoding: "utf8",
      }
    );
  } catch (error) {
    const e = error as { status?: number; stdout?: string; stderr?: string };
    code = e.status ?? 1;
    stdout = e.stdout ?? "";
    stderr = e.stderr ?? "";
  }
  rmSync(dir, { recursive: true, force: true });
  stop();
  return { code, stdout, stderr };
}

describe("publish never-shrink guard (gh-198)", () => {
  it("publishes when the catalogue grew or stayed equal", async () => {
    const result = await runPublish({
      publishedContent: snapshotWithQuality(50),
      localSnapshot: snapshotWithQuality(55),
    });
    expect(result.code).toBe(0);
    expect(result.stdout).toContain('"published":true');
  }, 30000);

  it("REFUSES to publish when the AA-quality catalogue shrank (last-known-good preserved)", async () => {
    const result = await runPublish({
      publishedContent: snapshotWithQuality(50),
      localSnapshot: snapshotWithQuality(35),
    });
    expect(result.code).not.toBe(0);
    expect(result.stderr).toContain("shrank from 50 to 35");
  }, 30000);

  it("publishes without a previous snapshot on a fresh branch (guard skipped)", async () => {
    const result = await runPublish({
      publishedContent: null,
      localSnapshot: snapshotWithQuality(10),
    });
    expect(result.code).toBe(0);
    expect(result.stdout).toContain('"published":true');
  }, 30000);

  it("publishes diagnostics next to the snapshot when present", async () => {
    const diagnostics = JSON.stringify({
      generatedAt: new Date().toISOString(),
      note: "test queue",
      diagnostics: [{ source: "openrouter", sourceId: "z-ai/glm-5.3-flashx", displayName: "GLM-5.3 FlashX", reasonCode: "not_in_alias_map", org: "z-ai" }],
      diagnosticCount: 1,
      truncated: false,
      sources: { aa: { upstreamRecords: 10, upstreamModelCount: 10 }, openrouter: { upstreamRecords: 12 } },
    });
    const result = await runPublish({
      publishedContent: snapshotWithQuality(50),
      localSnapshot: snapshotWithQuality(50),
      diagnostics,
    });
    expect(result.code).toBe(0);
    expect(result.stdout).toContain('"diagnosticsPublished":true');
  }, 30000);
});
