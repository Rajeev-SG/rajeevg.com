/**
 * Build the seed evidence registry for /solutions/agent-benchmark-matrix.
 *
 * This is the single source of truth for the *curated* seed rows. It:
 *   1. emits `src/data/agent-benchmarks/results.json` (deterministic order), and
 *   2. emits `src/data/agent-benchmarks/fallback-snapshot.json` (the bundled
 *      last-known-good snapshot the page falls back to).
 *
 * Every row cites an exact source URL and a provenance class. Where a number is
 * quoted from a competitor's comparison table rather than the model's own page,
 * `evidenceQuality` is lowered and the note says so. Rows whose subset differs
 * from another row get an explicit `subset` so they can never be ranked together.
 *
 * Run: pnpm exec tsx scripts/build-agent-benchmark-seed.ts
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import type {
  BenchmarkMeta,
  BenchmarkResult,
  BenchmarkSnapshot,
  CandidateRecord,
  EvidenceQuality,
  HarnessRecord,
  MetricDef,
  ModelRecord,
  SourceFreshness,
  SourceType,
  UnresolvedBenchmark,
  UnresolvedModel,
} from "../src/lib/agent-benchmarks/types";
import { validateSnapshot } from "../src/lib/agent-benchmarks/validation";

const DATA_DIR = resolve(process.cwd(), "src/data/agent-benchmarks");
const readJson = <T>(name: string): T => JSON.parse(readFileSync(resolve(DATA_DIR, name), "utf8")) as T;

const benchmarks = readJson<BenchmarkMeta[]>("benchmarks.json");
const metrics = readJson<MetricDef[]>("metrics.json");
const models = readJson<ModelRecord[]>("models.json");
const harnesses = readJson<HarnessRecord[]>("harnesses.json");
const candidates = readJson<CandidateRecord[]>("candidates.json");
const sources = readJson<SourceFreshness[]>("sources.json");
const unresolved = readJson<{ benchmarks: UnresolvedBenchmark[]; models: UnresolvedModel[] }>("unresolved.json");

// ---------------------------------------------------------------------------
// Sources (exact URLs cited by rows below)
// ---------------------------------------------------------------------------
const S = {
  openai: { url: "https://openai.com/index/gpt-5-6/", publishedAt: "2026-08-06" },
  glm53: { url: "https://huggingface.co/zai-org/GLM-5.3", publishedAt: "2026-06-17" },
  glm53f: { url: "https://huggingface.co/zai-org/GLM-5.3-Flash", publishedAt: "2026-06-17" },
  deepseek: { url: "https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash", publishedAt: "2026-07-10" },
  kimi: { url: "https://huggingface.co/moonshotai/Kimi-K3", publishedAt: "2026-08-01" },
  qwen: { url: "https://qwen.ai/blog?id=qwen3.8-flash-next", publishedAt: "2026-09-11" },
  osworld: { url: "https://os-world.github.io/", publishedAt: "2026-08-08" },
} as const;

type SourceKey = keyof typeof S;

interface Row {
  bench: string;
  version: string;
  subset?: string;
  metric: string;
  model: string;
  harness?: string;
  score: number | null;
  src: SourceKey;
  type?: SourceType;
  evidence?: EvidenceQuality;
  reasoning?: string;
  observation?: string;
  tool?: string;
  maxSteps?: number;
  runDate?: string;
  modelReportedName?: string;
  harnessReportedName?: string;
  notes?: string;
}

const rows: Row[] = [];
const push = (...r: Row[]) => rows.push(...r);

// --- OSWorld 2.0: benchmark-official rows (binary + partial) ---------------
push(
  { bench: "osworld-2.0", version: "v2026.08.08", metric: "binary_completion", model: "claude-opus-4.8", harness: "unspecified", score: 20.6, src: "osworld", type: "benchmark_repo", evidence: "high", runDate: "2026-08-08" },
  { bench: "osworld-2.0", version: "v2026.08.08", metric: "partial_score", model: "claude-opus-4.8", harness: "unspecified", score: 54.8, src: "osworld", type: "benchmark_repo", evidence: "high", runDate: "2026-08-08" },
  { bench: "osworld-2.0", version: "v2026.08.08", metric: "binary_completion", model: "gpt-5.5", harness: "unspecified", score: 16.2, src: "osworld", type: "benchmark_repo", evidence: "high", runDate: "2026-08-08" },
  { bench: "osworld-2.0", version: "v2026.08.08", metric: "partial_score", model: "gpt-5.5", harness: "unspecified", score: 49.5, src: "osworld", type: "benchmark_repo", evidence: "high", runDate: "2026-08-08" },
  { bench: "osworld-2.0", version: "v2026.08.08", metric: "binary_completion", model: "qwen3.8-max", harness: "unspecified", score: 16.6, src: "osworld", type: "benchmark_repo", evidence: "high", runDate: "2026-08-08" },
  { bench: "osworld-2.0", version: "v2026.08.08", metric: "partial_score", model: "qwen3.8-max", harness: "unspecified", score: 57.8, src: "osworld", type: "benchmark_repo", evidence: "high", runDate: "2026-08-08" },
  { bench: "osworld-2.0", version: "v2026.08.08", metric: "binary_completion", model: "muse-spark-1.1", harness: "unspecified", score: 23.2, src: "osworld", type: "benchmark_repo", evidence: "high", runDate: "2026-08-08" },
  { bench: "osworld-2.0", version: "v2026.08.08", metric: "partial_score", model: "muse-spark-1.1", harness: "unspecified", score: 61.9, src: "osworld", type: "benchmark_repo", evidence: "high", runDate: "2026-08-08" },
  { bench: "osworld-2.0", version: "v2026.08.08", metric: "binary_completion", model: "glm-5.2", harness: "unspecified", score: 12.0, src: "osworld", type: "benchmark_repo", evidence: "high", runDate: "2026-08-08" },
  { bench: "osworld-2.0", version: "v2026.08.08", metric: "partial_score", model: "glm-5.2", harness: "unspecified", score: 41.3, src: "osworld", type: "benchmark_repo", evidence: "high", runDate: "2026-08-08" },
  { bench: "osworld-2.0", version: "v2026.08.08", metric: "binary_completion", model: "minimax-m3", harness: "unspecified", score: 9.1, src: "osworld", type: "benchmark_repo", evidence: "high", runDate: "2026-08-08" },
  { bench: "osworld-2.0", version: "v2026.08.08", metric: "partial_score", model: "minimax-m3", harness: "unspecified", score: 38.1, src: "osworld", type: "benchmark_repo", evidence: "high", runDate: "2026-08-08" },
);

// --- OSWorld 2.0: vendor-reported rows (distinct subset, never co-ranked) --
push(
  { bench: "osworld-2.0", version: "v2026.08.08", subset: "vendor-reported progress score", metric: "partial_score", model: "gpt-5.6-sol", harness: "unspecified", score: 62.6, src: "openai", type: "vendor_official", evidence: "medium", notes: "OpenAI-reported computer-use progress score; configuration not fully disclosed, so it is kept out of the benchmark-official group." },
  { bench: "osworld-2.0", version: "v2026.08.08", subset: "vendor-reported progress score", metric: "partial_score", model: "kimi-k3", harness: "kimi-code", score: 58.3, src: "kimi", type: "vendor_official", evidence: "medium", notes: "Moonshot-reported progress score; not the benchmark team's binary completion column." },
);

// --- Terminal-Bench 2.1 (accuracy), system view (model + harness) ----------
push(
  { bench: "terminal-bench-2.1", version: "2.1", metric: "accuracy", model: "gpt-5.6-sol", harness: "codex-cli", score: 88.8, src: "openai", type: "vendor_official", evidence: "medium", runDate: "2026-08-06" },
  { bench: "terminal-bench-2.1", version: "2.1", metric: "accuracy", model: "gpt-5.6-terra", harness: "codex-cli", score: 87.4, src: "openai", type: "vendor_official", evidence: "medium", runDate: "2026-08-06" },
  { bench: "terminal-bench-2.1", version: "2.1", metric: "accuracy", model: "gpt-5.6-luna", harness: "codex-cli", score: 84.7, src: "openai", type: "vendor_official", evidence: "medium", runDate: "2026-08-06" },
  { bench: "terminal-bench-2.1", version: "2.1", metric: "accuracy", model: "gpt-5.5", harness: "codex-cli", score: 85.6, src: "openai", type: "vendor_official", evidence: "medium", runDate: "2026-08-06" },
  { bench: "terminal-bench-2.1", version: "2.1", metric: "accuracy", model: "glm-5.3", harness: "unspecified", score: 88.2, src: "glm53", type: "vendor_official", evidence: "medium" },
  { bench: "terminal-bench-2.1", version: "2.1", metric: "accuracy", model: "glm-5.3-flash", harness: "claude-code", score: 84.3, src: "glm53f", type: "vendor_official", evidence: "medium" },
  { bench: "terminal-bench-2.1", version: "2.1", metric: "accuracy", model: "deepseek-v4.1-flash", harness: "terminus-2", score: 90.6, src: "deepseek", type: "vendor_official", evidence: "medium" },
  { bench: "terminal-bench-2.1", version: "2.1", metric: "accuracy", model: "deepseek-v4-pro", harness: "terminus-2", score: 87.9, src: "deepseek", type: "vendor_official", evidence: "medium" },
  { bench: "terminal-bench-2.1", version: "2.1", metric: "accuracy", model: "kimi-k3", harness: "kimi-code", score: 88.3, src: "kimi", type: "vendor_official", evidence: "medium" },
  { bench: "terminal-bench-2.1", version: "2.1", metric: "accuracy", model: "qwen3.8-max", harness: "unspecified", score: 86.6, src: "qwen", type: "vendor_official", evidence: "medium" },
  { bench: "terminal-bench-2.1", version: "2.1", subset: "Codex CLI harness", metric: "accuracy", model: "gpt-5.6-sol", harness: "codex-cli", score: 79.6, src: "kimi", type: "vendor_official", evidence: "low", notes: "Quoted from Moonshot's comparison table (Codex CLI harness row); cross-vendor attribution." },
  { bench: "terminal-bench-2.1", version: "2.1", subset: "Codex CLI harness", metric: "accuracy", model: "gpt-5.5", harness: "codex-cli", score: 78.9, src: "kimi", type: "vendor_official", evidence: "low", notes: "Quoted from Moonshot's comparison table (Codex CLI harness row)." },
  { bench: "terminal-bench-2.1", version: "2.1", subset: "Claude Code harness", metric: "accuracy", model: "claude-fable-5.1", harness: "claude-code", score: 80.4, src: "kimi", type: "vendor_official", evidence: "low", notes: "Quoted from Moonshot's comparison table (Claude Code harness row)." },
  { bench: "terminal-bench-2.1", version: "2.1", subset: "Claude Code harness", metric: "accuracy", model: "claude-opus-4.8", harness: "claude-code", score: 74.6, src: "kimi", type: "vendor_official", evidence: "low", notes: "Quoted from Moonshot's comparison table (Claude Code harness row)." },
);

// --- BrowseComp (accuracy) -------------------------------------------------
push(
  { bench: "browsecomp", version: "browsecomp", metric: "accuracy", model: "gpt-5.6-sol", harness: "codex", score: 90.4, src: "openai", type: "vendor_official", evidence: "medium", reasoning: "high" },
  { bench: "browsecomp", version: "browsecomp", metric: "accuracy", model: "gpt-5.6-terra", harness: "codex", score: 87.5, src: "openai", type: "vendor_official", evidence: "medium", reasoning: "high" },
  { bench: "browsecomp", version: "browsecomp", metric: "accuracy", model: "gpt-5.6-luna", harness: "codex", score: 83.3, src: "openai", type: "vendor_official", evidence: "medium", reasoning: "high" },
  { bench: "browsecomp", version: "browsecomp", metric: "accuracy", model: "gpt-5.5", harness: "codex", score: 84.4, src: "openai", type: "vendor_official", evidence: "medium", reasoning: "high" },
  { bench: "browsecomp", version: "browsecomp", subset: "ultra effort", metric: "accuracy", model: "gpt-5.6-sol", harness: "codex", score: 92.2, src: "openai", type: "vendor_official", evidence: "medium", reasoning: "ultra", notes: "Higher reasoning budget; separate comparability group from the standard-effort row." },
  { bench: "browsecomp", version: "browsecomp", metric: "accuracy", model: "kimi-k3", harness: "kimi-code", score: 91.2, src: "kimi", type: "vendor_official", evidence: "medium" },
  { bench: "browsecomp", version: "browsecomp", metric: "accuracy", model: "claude-fable-5.1", harness: "claude-code", score: 84.5, src: "kimi", type: "vendor_official", evidence: "low", notes: "Quoted from Moonshot's comparison table." },
  { bench: "browsecomp", version: "browsecomp", metric: "accuracy", model: "claude-opus-4.8", harness: "claude-code", score: 72.4, src: "kimi", type: "vendor_official", evidence: "low", notes: "Quoted from Moonshot's comparison table." },
);

// --- Agents' Last Exam (two protocols: leaderboard vs ALE-CLI) -------------
push(
  { bench: "agents-last-exam", version: "1.0", metric: "accuracy", model: "gpt-5.6-sol", harness: "codex", score: 52.7, src: "openai", type: "vendor_official", evidence: "medium" },
  { bench: "agents-last-exam", version: "1.0", metric: "accuracy", model: "gpt-5.6-terra", harness: "codex", score: 50.4, src: "openai", type: "vendor_official", evidence: "medium" },
  { bench: "agents-last-exam", version: "1.0", metric: "accuracy", model: "gpt-5.6-luna", harness: "codex", score: 50.3, src: "openai", type: "vendor_official", evidence: "medium" },
  { bench: "agents-last-exam", version: "1.0", metric: "accuracy", model: "gpt-5.5", harness: "codex", score: 46.9, src: "openai", type: "vendor_official", evidence: "medium" },
  { bench: "agents-last-exam", version: "1.0", metric: "accuracy", model: "claude-opus-4.8", harness: "claude-code", score: 45.2, src: "openai", type: "vendor_official", evidence: "low", notes: "Quoted from OpenAI's comparison table." },
  { bench: "agents-last-exam", version: "1.0", metric: "accuracy", model: "claude-fable-5.1", harness: "claude-code", score: 40.5, src: "openai", type: "vendor_official", evidence: "low", notes: "Quoted from OpenAI's comparison table." },
  { bench: "agents-last-exam", version: "1.0", metric: "accuracy", model: "gemini-3.1-pro", harness: "unspecified", score: 32.1, src: "openai", type: "vendor_official", evidence: "low", notes: "Quoted from OpenAI's comparison table." },
  { bench: "agents-last-exam", version: "1.0", subset: "ALE-CLI", metric: "accuracy", model: "glm-5.3", harness: "unspecified", score: 28.5, src: "glm53", type: "vendor_official", evidence: "medium", notes: "ALE-CLI protocol; markedly different from the leaderboard protocol, so kept in its own group." },
  { bench: "agents-last-exam", version: "1.0", subset: "ALE-CLI", metric: "accuracy", model: "deepseek-v4.1-flash", harness: "unspecified", score: 31.8, src: "deepseek", type: "vendor_official", evidence: "medium", notes: "ALE-CLI protocol." },
  { bench: "agents-last-exam", version: "1.0", subset: "ALE-CLI", metric: "accuracy", model: "deepseek-v4-pro", harness: "unspecified", score: 35.3, src: "deepseek", type: "vendor_official", evidence: "medium", notes: "ALE-CLI protocol." },
  { bench: "agents-last-exam", version: "1.0", subset: "ALE-CLI", metric: "accuracy", model: "kimi-k3", harness: "kimi-code", score: 27.6, src: "kimi", type: "vendor_official", evidence: "medium", notes: "ALE-CLI protocol." },
);

// --- Toolathlon Verified (pass@1) -----------------------------------------
push(
  { bench: "toolathlon-verified", version: "verified", metric: "pass_at_1", model: "glm-5.3", harness: "unspecified", score: 73.0, src: "glm53", type: "vendor_official", evidence: "medium" },
  { bench: "toolathlon-verified", version: "verified", metric: "pass_at_1", model: "glm-5.3-flash", harness: "unspecified", score: 74.9, src: "glm53f", type: "vendor_official", evidence: "medium" },
  { bench: "toolathlon-verified", version: "verified", metric: "pass_at_1", model: "deepseek-v4.1-flash", harness: "unspecified", score: 71.7, src: "deepseek", type: "vendor_official", evidence: "medium" },
  { bench: "toolathlon-verified", version: "verified", metric: "pass_at_1", model: "deepseek-v4-pro", harness: "unspecified", score: 72.9, src: "deepseek", type: "vendor_official", evidence: "medium" },
  { bench: "toolathlon-verified", version: "verified", metric: "pass_at_1", model: "kimi-k3", harness: "kimi-code", score: 76.5, src: "kimi", type: "vendor_official", evidence: "medium" },
  { bench: "toolathlon-verified", version: "verified", subset: "OpenAI configuration", metric: "pass_at_1", model: "gpt-5.6-sol", harness: "codex", score: 58.0, src: "openai", type: "vendor_official", evidence: "low", notes: "OpenAI reports a substantially different scale; subset/configuration not stated, so it is never ranked against the verified-set rows." },
);

// --- WebArena-Verified (accuracy) -----------------------------------------
push(
  { bench: "webarena-verified", version: "1.0", metric: "accuracy", model: "qwen3.8-max", harness: "browsergym", score: 66.8, src: "qwen", type: "vendor_official", evidence: "medium" },
  { bench: "webarena-verified", version: "1.0", metric: "accuracy", model: "qwen3.8-27b", harness: "browsergym", score: 64.8, src: "qwen", type: "vendor_official", evidence: "medium" },
  { bench: "webarena-verified", version: "1.0", metric: "accuracy", model: "claude-opus-4.8", harness: "browsergym", score: 63.2, src: "qwen", type: "vendor_official", evidence: "low", notes: "Quoted from Alibaba's comparison table." },
  { bench: "webarena-verified", version: "1.0", metric: "accuracy", model: "gemini-3.1-pro", harness: "browsergym", score: 61.3, src: "qwen", type: "vendor_official", evidence: "low", notes: "Quoted from Alibaba's comparison table." },
);

// --- OSWorld-Verified / MCPMark / MCP-Atlas / APEX / AA-Briefcase / SpreadsheetBench 2 (via Moonshot table)
push(
  { bench: "osworld-verified", version: "verified", metric: "binary_completion", model: "kimi-k3", harness: "kimi-code", score: 84.8, src: "kimi", type: "vendor_official", evidence: "medium" },
  { bench: "osworld-verified", version: "verified", metric: "binary_completion", model: "claude-fable-5.1", harness: "claude-code", score: 85.0, src: "kimi", type: "vendor_official", evidence: "low", notes: "Quoted from Moonshot's comparison table." },
  { bench: "osworld-verified", version: "verified", metric: "binary_completion", model: "gpt-5.6-sol", harness: "codex", score: 83.0, src: "kimi", type: "vendor_official", evidence: "low", notes: "Quoted from Moonshot's comparison table." },
  { bench: "osworld-verified", version: "verified", metric: "binary_completion", model: "claude-opus-4.8", harness: "claude-code", score: 83.4, src: "kimi", type: "vendor_official", evidence: "low", notes: "Quoted from Moonshot's comparison table." },
  { bench: "osworld-verified", version: "verified", metric: "binary_completion", model: "gpt-5.5", harness: "codex", score: 79.0, src: "kimi", type: "vendor_official", evidence: "low", notes: "Quoted from Moonshot's comparison table." },

  { bench: "mcpmark-verified", version: "verified", metric: "pass_at_1", model: "kimi-k3", harness: "kimi-code", score: 94.5, src: "kimi", type: "vendor_official", evidence: "medium" },
  { bench: "mcpmark-verified", version: "verified", metric: "pass_at_1", model: "gpt-5.6-sol", harness: "codex", score: 92.9, src: "kimi", type: "vendor_official", evidence: "low", notes: "Quoted from Moonshot's comparison table." },
  { bench: "mcpmark-verified", version: "verified", metric: "pass_at_1", model: "gpt-5.5", harness: "codex", score: 92.9, src: "kimi", type: "vendor_official", evidence: "low", notes: "Quoted from Moonshot's comparison table." },
  { bench: "mcpmark-verified", version: "verified", metric: "pass_at_1", model: "claude-fable-5.1", harness: "claude-code", score: 87.4, src: "kimi", type: "vendor_official", evidence: "low", notes: "Quoted from Moonshot's comparison table." },
  { bench: "mcpmark-verified", version: "verified", metric: "pass_at_1", model: "claude-opus-4.8", harness: "claude-code", score: 76.4, src: "kimi", type: "vendor_official", evidence: "low", notes: "Quoted from Moonshot's comparison table." },

  { bench: "mcp-atlas", version: "1.0", metric: "accuracy", model: "kimi-k3", harness: "kimi-code", score: 84.2, src: "kimi", type: "vendor_official", evidence: "medium" },
  { bench: "mcp-atlas", version: "1.0", metric: "accuracy", model: "claude-fable-5.1", harness: "claude-code", score: 76.4, src: "kimi", type: "vendor_official", evidence: "low", notes: "Quoted from Moonshot's comparison table." },
  { bench: "mcp-atlas", version: "1.0", metric: "accuracy", model: "gpt-5.6-sol", harness: "codex", score: 75.6, src: "kimi", type: "vendor_official", evidence: "low", notes: "Quoted from Moonshot's comparison table." },
  { bench: "mcp-atlas", version: "1.0", metric: "accuracy", model: "gpt-5.5", harness: "codex", score: 75.6, src: "kimi", type: "vendor_official", evidence: "low", notes: "Quoted from Moonshot's comparison table." },
  { bench: "mcp-atlas", version: "1.0", metric: "accuracy", model: "claude-opus-4.8", harness: "claude-code", score: 72.0, src: "kimi", type: "vendor_official", evidence: "low", notes: "Quoted from Moonshot's comparison table." },

  { bench: "apex-agents", version: "apex-agents-v1.1", metric: "accuracy", model: "kimi-k3", harness: "kimi-code", score: 41.0, src: "kimi", type: "vendor_official", evidence: "medium" },
  { bench: "apex-agents", version: "apex-agents-v1.1", metric: "accuracy", model: "claude-fable-5.1", harness: "claude-code", score: 43.3, src: "kimi", type: "vendor_official", evidence: "low", notes: "Quoted from Moonshot's comparison table." },
  { bench: "apex-agents", version: "apex-agents-v1.1", metric: "accuracy", model: "gpt-5.6-sol", harness: "codex", score: 39.9, src: "kimi", type: "vendor_official", evidence: "low", notes: "Quoted from Moonshot's comparison table." },
  { bench: "apex-agents", version: "apex-agents-v1.1", metric: "accuracy", model: "claude-opus-4.8", harness: "claude-code", score: 39.4, src: "kimi", type: "vendor_official", evidence: "low", notes: "Quoted from Moonshot's comparison table." },
  { bench: "apex-agents", version: "apex-agents-v1.1", metric: "accuracy", model: "gpt-5.5", harness: "codex", score: 38.5, src: "kimi", type: "vendor_official", evidence: "low", notes: "Quoted from Moonshot's comparison table." },
  { bench: "apex-agents", version: "apex-agents-v1.1", metric: "accuracy", model: "glm-5.2", harness: "unspecified", score: 35.6, src: "kimi", type: "vendor_official", evidence: "low", notes: "Quoted from Moonshot's comparison table." },

  { bench: "aa-briefcase", version: "1.0", metric: "elo", model: "kimi-k3", harness: "stirrup", score: 1548, src: "kimi", type: "vendor_official", evidence: "medium" },
  { bench: "aa-briefcase", version: "1.0", metric: "elo", model: "claude-fable-5.1", harness: "stirrup", score: 1583, src: "kimi", type: "vendor_official", evidence: "low", notes: "Quoted from Moonshot's comparison table." },
  { bench: "aa-briefcase", version: "1.0", metric: "elo", model: "gpt-5.6-sol", harness: "stirrup", score: 1495, src: "kimi", type: "vendor_official", evidence: "low", notes: "Quoted from Moonshot's comparison table." },
  { bench: "aa-briefcase", version: "1.0", metric: "elo", model: "claude-opus-4.8", harness: "stirrup", score: 1354, src: "kimi", type: "vendor_official", evidence: "low", notes: "Quoted from Moonshot's comparison table." },
  { bench: "aa-briefcase", version: "1.0", metric: "elo", model: "gpt-5.5", harness: "stirrup", score: 1158, src: "kimi", type: "vendor_official", evidence: "low", notes: "Quoted from Moonshot's comparison table." },
  { bench: "aa-briefcase", version: "1.0", metric: "elo", model: "glm-5.2", harness: "stirrup", score: 1260, src: "kimi", type: "vendor_official", evidence: "low", notes: "Quoted from Moonshot's comparison table." },

  { bench: "spreadsheetbench-2", version: "2.0", metric: "accuracy", model: "kimi-k3", harness: "kimi-code", score: 34.8, src: "kimi", type: "vendor_official", evidence: "medium" },
  { bench: "spreadsheetbench-2", version: "2.0", metric: "accuracy", model: "claude-fable-5.1", harness: "claude-code", score: 34.7, src: "kimi", type: "vendor_official", evidence: "low", notes: "Quoted from Moonshot's comparison table." },
  { bench: "spreadsheetbench-2", version: "2.0", metric: "accuracy", model: "gpt-5.6-sol", harness: "codex", score: 32.4, src: "kimi", type: "vendor_official", evidence: "low", notes: "Quoted from Moonshot's comparison table." },
  { bench: "spreadsheetbench-2", version: "2.0", metric: "accuracy", model: "claude-opus-4.8", harness: "claude-code", score: 31.6, src: "kimi", type: "vendor_official", evidence: "low", notes: "Quoted from Moonshot's comparison table." },
  { bench: "spreadsheetbench-2", version: "2.0", metric: "accuracy", model: "gpt-5.5", harness: "codex", score: 29.1, src: "kimi", type: "vendor_official", evidence: "low", notes: "Quoted from Moonshot's comparison table." },
  { bench: "spreadsheetbench-2", version: "2.0", metric: "accuracy", model: "glm-5.2", harness: "unspecified", score: 28.1, src: "kimi", type: "vendor_official", evidence: "low", notes: "Quoted from Moonshot's comparison table." },
);

// --- τ³-Banking and τ² (lineage separation) --------------------------------
push(
  { bench: "tau3-bench", version: "tau3", subset: "banking", metric: "pass_at_1", model: "kimi-k3", harness: "kimi-code", score: 33.4, src: "kimi", type: "vendor_official", evidence: "medium", notes: "τ³ banking domain; not comparable with τ² results." },
  { bench: "tau3-bench", version: "tau3", subset: "banking", metric: "pass_at_1", model: "gpt-5.6-sol", harness: "codex", score: 31.0, src: "kimi", type: "vendor_official", evidence: "low", notes: "Quoted from Moonshot's comparison table." },
  { bench: "tau2-bench", version: "tau2", metric: "pass_at_1", model: "glm-5.2", harness: "unspecified", score: 99.1, src: "glm53", type: "vendor_official", evidence: "medium", notes: "τ² protocol; historical generation, not comparable with τ³." },
);

// --- GDPval: two distinct protocols ---------------------------------------
push(
  { bench: "gdpval-aa-v2", version: "v2", metric: "elo", model: "glm-5.3-flash", harness: "stirrup", score: 1773, src: "glm53f", type: "vendor_official", evidence: "medium" },
  { bench: "gdpval-aa-v2", version: "v2", metric: "elo", model: "glm-5.3", harness: "stirrup", score: 1769, src: "glm53", type: "vendor_official", evidence: "medium" },
  { bench: "gdpval-aa-v2", version: "v2", metric: "elo", model: "kimi-k3", harness: "stirrup", score: 1686, src: "kimi", type: "vendor_official", evidence: "medium" },
  { bench: "gdpval-aa-v2", version: "v2", subset: "OpenAI original GDPval", metric: "elo", model: "gpt-5.6-sol", harness: "codex", score: 1747.8, src: "openai", type: "vendor_official", evidence: "medium", notes: "OpenAI's own GDPval evaluation, a different protocol from AA's GDPval-AA v2; kept in its own group." },
  { bench: "gdpval-aa-v2", version: "v2", subset: "OpenAI original GDPval", metric: "elo", model: "gpt-5.6-terra", harness: "codex", score: 1593.0, src: "openai", type: "vendor_official", evidence: "medium" },
  { bench: "gdpval-aa-v2", version: "v2", subset: "OpenAI original GDPval", metric: "elo", model: "gpt-5.6-luna", harness: "codex", score: 1591.8, src: "openai", type: "vendor_official", evidence: "medium" },
  { bench: "gdpval-aa-v2", version: "v2", subset: "OpenAI original GDPval", metric: "elo", model: "gpt-5.5", harness: "codex", score: 1493.7, src: "openai", type: "vendor_official", evidence: "medium" },
  { bench: "gdpval-aa-v2", version: "v2", subset: "OpenAI original GDPval", metric: "elo", model: "claude-fable-5.1", harness: "claude-code", score: 1759.6, src: "openai", type: "vendor_official", evidence: "low", notes: "Quoted from OpenAI's comparison table." },
);

// --- AutomationBench: two publicly distinct protocols ---------------------
push(
  { bench: "automationbench", version: "1.0.6", subset: "public task set", metric: "pass_at_1", model: "glm-5.3", harness: "unspecified", score: 48.2, src: "glm53", type: "vendor_official", evidence: "medium", notes: "Public GitHub task set; not the same as Zapier's harder held-out set." },
  { bench: "automationbench", version: "1.0.6", subset: "public task set", metric: "pass_at_1", model: "glm-5.3-flash", harness: "unspecified", score: 48.8, src: "glm53f", type: "vendor_official", evidence: "medium" },
  { bench: "automationbench", version: "1.0.6", subset: "public task set", metric: "pass_at_1", model: "deepseek-v4.1-flash", harness: "unspecified", score: 54.8, src: "deepseek", type: "vendor_official", evidence: "medium" },
  { bench: "automationbench", version: "1.0.6", subset: "public task set", metric: "pass_at_1", model: "deepseek-v4-pro", harness: "unspecified", score: 55.7, src: "deepseek", type: "vendor_official", evidence: "medium" },
  { bench: "automationbench", version: "1.0.6", subset: "public task set", metric: "pass_at_1", model: "claude-opus-4.8", harness: "claude-code", score: 41.0, src: "glm53", type: "vendor_official", evidence: "low", notes: "Quoted from Z.ai's comparison table." },
  { bench: "automationbench", version: "1.0.6", subset: "undisclosed subset", metric: "pass_at_1", model: "gpt-5.6-sol", harness: "codex", score: 18.1, src: "openai", type: "vendor_official", evidence: "medium", notes: "OpenAI does not state which task subset; kept separate so it is never ranked against the public task set." },
  { bench: "automationbench", version: "1.0.6", subset: "undisclosed subset", metric: "pass_at_1", model: "gpt-5.6-terra", harness: "codex", score: 15.2, src: "openai", type: "vendor_official", evidence: "medium" },
  { bench: "automationbench", version: "1.0.6", subset: "undisclosed subset", metric: "pass_at_1", model: "gpt-5.6-luna", harness: "codex", score: 14.9, src: "openai", type: "vendor_official", evidence: "medium" },
  { bench: "automationbench", version: "1.0.6", subset: "undisclosed subset", metric: "pass_at_1", model: "gpt-5.5", harness: "codex", score: 12.9, src: "openai", type: "vendor_official", evidence: "medium" },
  { bench: "automationbench", version: "1.0.6", subset: "undisclosed subset", metric: "pass_at_1", model: "claude-fable-5.1", harness: "claude-code", score: 17.4, src: "openai", type: "vendor_official", evidence: "low", notes: "Quoted from OpenAI's comparison table." },
);

// ---------------------------------------------------------------------------
// Materialise
// ---------------------------------------------------------------------------
const slug = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const seenIds = new Set<string>();
const results: BenchmarkResult[] = rows.map((row, index) => {
  const src = S[row.src];
  const base = `${slug(row.bench)}__${slug(row.model)}__${slug(row.metric)}__${slug(row.subset ?? "base")}__${slug(row.harness ?? "unspec")}`;
  let id = base;
  let n = 2;
  while (seenIds.has(id)) id = `${base}-${n++}`;
  seenIds.add(id);
  const higherIsBetter = metrics.find((m) => m.id === row.metric)?.higherIsBetter ?? true;
  return {
    id,
    benchmarkId: row.bench,
    benchmarkVersion: row.version,
    subset: row.subset ?? null,
    metricId: row.metric,
    score: row.score,
    scoreState: (row.score === null ? "not_ingested_yet" : "reported") as BenchmarkResult["scoreState"],
    scoreUnit: metrics.find((m) => m.id === row.metric)?.unit ?? "percent",
    higherIsBetter,
    modelCanonicalId: row.model,
    modelReportedName: row.modelReportedName ?? models.find((m) => m.canonicalId === row.model)?.displayName ?? row.model,
    modelRevision: null,
    organisation: models.find((m) => m.canonicalId === row.model)?.organisation ?? "Unknown",
    harnessCanonicalId: row.harness ?? null,
    harnessReportedName: row.harnessReportedName ?? harnesses.find((h) => h.canonicalId === row.harness)?.name ?? row.harness ?? null,
    agentVersion: null,
    observationMode: row.observation ?? null,
    toolMode: row.tool ?? null,
    reasoningEffort: row.reasoning ?? null,
    maxSteps: row.maxSteps ?? null,
    tokenBudget: null,
    environmentRevision: null,
    runDate: row.runDate ?? null,
    publishedAt: src.publishedAt,
    sourceUrl: src.url,
    sourceType: row.type ?? "vendor_official",
    evidenceQuality: row.evidence ?? "medium",
    officialSubmission: row.type === "benchmark_repo" || row.type === "benchmark_machine_readable" ? true : null,
    notes: row.notes ?? null,
  };
}).sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

const snapshot: BenchmarkSnapshot = {
  generatedAt: "2026-09-13T00:00:00.000Z",
  seedReviewedAt: "2026-09-13",
  benchmarks,
  metrics,
  models,
  harnesses,
  results,
  candidates,
  sources,
  unresolvedBenchmarks: unresolved.benchmarks ?? [],
  unresolvedModels: unresolved.models ?? [],
};

const validation = validateSnapshot(snapshot);
if (!validation.ok) {
  console.error("Seed validation failed:\n- " + validation.errors.join("\n- "));
  process.exit(1);
}
if (validation.warnings.length > 0) {
  console.warn("Seed warnings:\n- " + validation.warnings.join("\n- "));
}

writeFileSync(resolve(DATA_DIR, "results.json"), JSON.stringify(results, null, 2) + "\n");
writeFileSync(resolve(DATA_DIR, "fallback-snapshot.json"), JSON.stringify(snapshot, null, 2) + "\n");
console.log(
  JSON.stringify(
    { results: results.length, benchmarks: benchmarks.length, models: models.length, reported: results.filter((r) => r.scoreState === "reported").length },
    null,
    2
  )
);
