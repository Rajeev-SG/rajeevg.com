/**
 * Deterministic alias resolution.
 *
 * Hierarchy:
 * 1. Explicit authoritative source ID mappings (checked-in map).
 * 2. Conservative normalisation only when provably unambiguous:
 *    AA slug equal to an alias-map AA slug (case-insensitive exact match),
 *    OR model id equal to an alias-map OpenRouter id (case-insensitive exact match),
 *    Arena name exactly equal to an alias-map arenaNames entry (case-insensitive).
 * 3. Everything else is UNMATCHED.
 *
 * NEVER fuzzy, never LLM, never edit-distance.
 */
import aliasMap from "@/data/model-aliases.json";

export interface AliasEntry {
  displayName: string;
  organisation: string;
  aaSlug?: string;
  openrouterId?: string;
  arenaNames?: string[];
}

export interface CanonicalEntry {
  canonicalId: string;
  displayName: string;
  organisation: string;
  aaSlug: string | null;
  openrouterId: string | null;
  arenaNames: string[];
}

const entries = Object.entries(aliasMap as unknown as Record<string, AliasEntry>).filter(
  ([key]) => !key.startsWith("$")
);

export function canonicalEntries(): CanonicalEntry[] {
  return entries.map(([id, v]) => ({
    canonicalId: id,
    displayName: v.displayName,
    organisation: v.organisation,
    aaSlug: v.aaSlug ?? null,
    openrouterId: v.openrouterId ?? null,
    arenaNames: v.arenaNames ?? [],
  }));
}

const byAaSlug = new Map<string, CanonicalEntry>();
const byOrId = new Map<string, CanonicalEntry>();
const byArenaName = new Map<string, CanonicalEntry>();

for (const entry of canonicalEntries()) {
  if (entry.aaSlug) byAaSlug.set(entry.aaSlug.toLowerCase(), entry);
  if (entry.openrouterId) byOrId.set(entry.openrouterId.toLowerCase(), entry);
  for (const name of entry.arenaNames) {
    byArenaName.set(name.toLowerCase(), entry);
  }
}

/** Resolve an AA slug (or raw source record name) deterministically. */
export function resolveAaSlug(slug: string): CanonicalEntry | null {
  return byAaSlug.get(slug.toLowerCase()) ?? null;
}

/** Resolve an OpenRouter model id deterministically. */
export function resolveOpenRouterId(id: string): CanonicalEntry | null {
  return byOrId.get(id.toLowerCase()) ?? null;
}

/** Resolve an Arena model_name deterministically (case-insensitive exact). */
export function resolveArenaName(name: string): CanonicalEntry | null {
  return byArenaName.get(name.toLowerCase()) ?? null;
}
