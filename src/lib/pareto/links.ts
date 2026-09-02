/**
 * Deterministic link builders for the Pareto table.
 * No network requests: all links come from source IDs/slugs in the snapshot
 * plus the checked-in creator homepage map. Unknown values yield null.
 */
import creatorHomepages from "@/data/creator-homepages.json";

export function openRouterModelUrl(modelId: string | null | undefined): string | null {
  if (!modelId) return null;
  // modelId is OpenRouter's canonical "creator/model" id; URL-safe characters only.
  if (!/^[a-z0-9._/-]+$/i.test(modelId)) return null;
  return `https://openrouter.ai/${modelId}`;
}

export function artificialAnalysisModelUrl(slug: string | null | undefined): string | null {
  if (!slug) return null;
  if (!/^[a-z0-9.-]+$/i.test(slug)) return null;
  return `https://artificialanalysis.ai/models/${slug}`;
}

const homepages = creatorHomepages as unknown as Record<string, string>;

export function creatorHomepageUrl(organisation: string | null | undefined): string | null {
  if (!organisation) return null;
  const url = homepages[organisation];
  if (!url) return null;
  if (!/^https:\/\/[a-z0-9.-]+(\/|$)/.test(url)) return null; // https-only allowlist
  return url;
}
