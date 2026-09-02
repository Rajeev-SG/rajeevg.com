/**
 * Automatic latest-model discovery and deterministic cross-source joining.
 *
 * Join rule (exact, never fuzzy):
 * - OpenRouter model ids follow "<org-slug>/<model-slug>" (e.g. meta/muse-spark-1.3).
 * - AA slugs follow "<model-slug>[-variant]" (e.g. muse-spark-1-3-xhigh).
 * - Two source records are the same model iff BOTH of these hold:
 *   1. AA slug, with dashes normalised to the OR-style separator, is a
 *      case-insensitive exact match of the OR model slug (the id path),
 *      AND
 *   2. the OR id's org prefix matches the AA creator name by exact
 *      case-insensitive comparison against a small explicit org-slug map
 *      (e.g. "meta" -> "Meta"), because org naming is a closed, human-curated
 *      set — this is identity verification, not fuzzy matching.
 *
 * Variant safety: OR contributor/batch variants (":contributor", ":batch")
 * never merge with the primary model; they are excluded from auto-join and
 * stay unmatched. Explicit aliases still win over auto-join.
 */
import type { CanonicalModel } from "./types";

/**
 * Closed, documented terminal AA reasoning-configuration suffixes.
 * AA slugs carry a reasoning tier suffix; OpenRouter ids do not. Strip only
 * these exact terminal tokens on the AA side before identity comparison.
 */
const AA_TERMINAL_REASONING_SUFFIXES = ["-xhigh", "-high", "-medium", "-low"] as const;

/** Deterministic identity normalisation: lowercase; . _ / and - all become -. */
function identityNormalise(s: string): string {
  return s.toLowerCase().replace(/[._/]/g, "-");
}

/** AA identity token: normalised, with a closed terminal reasoning suffix stripped. */
export function aaIdentity(slug: string): string {
  const id = identityNormalise(slug);
  for (const suffix of AA_TERMINAL_REASONING_SUFFIXES) {
    if (id.endsWith(suffix)) return id.slice(0, -suffix.length);
  }
  return id;
}

/** OR model-slug identity (after org prefix split, no reasoning suffix). */
export function orIdentity(modelSlug: string): string {
  return identityNormalise(modelSlug);
}

/** Closed, case-insensitive OR org-slug -> display organisation map. */
const ORG_BY_OR_SLUG: Record<string, string> = {
  "meta": "Meta",
  "meta-llama": "Meta",
  "openai": "OpenAI",
  "anthropic": "Anthropic",
  "google": "Google",
  "x-ai": "xAI",
  "qwen": "Alibaba",
  "deepseek": "DeepSeek",
  "z-ai": "Z.ai",
  "moonshotai": "Moonshot AI",
  "mistralai": "Mistral",
  "cohere": "Cohere",
  "amazon": "Amazon",
  "microsoft": "Microsoft",
  "nvidia": "NVIDIA",
  "perplexity": "Perplexity",
  "ai21": "AI21",
  "liquid": "Liquid AI",
  "minimax": "MiniMax",
  "nousresearch": "Nous Research",
  "tngtech": "TNG",
  "inception": "Inception",
  "openrouter": "OpenRouter",
};

/**
 * Strips known OpenRouter variant segments; returns null for contributor or
 * batch variants so they can never merge with the primary model.
 */
export function orPrimaryId(id: string): string | null {
  const lower = id.toLowerCase();
  if (lower.endsWith(":contributor") || lower.endsWith(":batch")) return null;
  if (lower.includes("-contributor")) return null;
  return id;
}

/** OR id -> (orgSlug, modelSlug). Returns null for malformed ids or variants. */
export function parseOrId(id: string): { orgSlug: string; modelSlug: string } | null {
  if (!id.includes("/")) return null;
  const primary = orPrimaryId(id);
  if (primary === null) return null;
  const [orgSlug, ...rest] = primary.split("/");
  const modelSlug = rest.join("/");
  if (!orgSlug || !modelSlug) return null;
  return { orgSlug, modelSlug };
}

/**
 * Deterministic auto-join of one AA record to one OR record.
 * Returns the canonical id "<org>-<modelSlug-dots>" and display fields, or null.
 */
export function autoJoin(
  aa: { slug: string; creatorName: string | null },
  or: { id: string; name: string }
): { canonicalId: string; displayName: string; organisation: string } | null {
  const parsed = parseOrId(or.id);
  if (!parsed) return null;
  // Deterministic identity comparison: normalise separators on both sides,
  // then strip the closed AA reasoning suffix from the AA identity only.
  if (aaIdentity(aa.slug) !== orIdentity(parsed.modelSlug)) return null;
  const org = ORG_BY_OR_SLUG[parsed.orgSlug.toLowerCase()];
  if (!org) return null;
  if (!aa.creatorName || aa.creatorName.toLowerCase() !== org.toLowerCase()) return null;
  return {
    canonicalId: `${parsed.orgSlug}-${parsed.modelSlug}`,
    displayName: or.name.replace(/^[^:]+:\s*/, ""),
    organisation: org,
  };
}
