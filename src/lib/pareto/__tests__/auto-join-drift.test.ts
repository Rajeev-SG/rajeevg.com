/**
 * gh-198: alias-drift regression tests.
 *
 * Failure class: a brand-new upstream model (a freshness/completeness
 * canary from gh-172) fails the canonical join because an organisation is
 * missing from the auto-join map, or because the upstream creator renamed
 * itself. The models then silently disappear from the published snapshot
 * even though a refresh succeeds with a fresh timestamp.
 *
 * These tests pin the deterministic auto-join contract for exactly those
 * cases, using live-upstream identities verified on 2026-10-01.
 */
import { describe, expect, it } from "vitest";
import { aaIdentity, autoJoin, orIdentity } from "../auto-discover";

describe("auto-join org coverage (gh-198)", () => {
  it("joins Xiaomi MiMo-V2.6 Pro (org previously missing from the map)", () => {
    // Live upstream identity: AA slug "mimo-v2-6-pro", AA creator "Xiaomi",
    // OpenRouter id "xiaomi/mimo-v2.6-pro".
    const joined = autoJoin(
      { slug: "mimo-v2-6-pro", creatorName: "Xiaomi" },
      { id: "xiaomi/mimo-v2.6-pro", name: "Xiaomi: MiMo-V2.6 Pro" }
    );
    expect(joined).not.toBeNull();
    expect(joined!.canonicalId).toBe("xiaomi-mimo-v2.6-pro");
    expect(joined!.organisation).toBe("Xiaomi");
    expect(joined!.displayName).toBe("MiMo-V2.6 Pro");
  });

  it("joins Xiaomi MiMo-V2.6 Flash", () => {
    const joined = autoJoin(
      { slug: "mimo-v2-6-flash", creatorName: "Xiaomi" },
      { id: "xiaomi/mimo-v2.6-flash", name: "Xiaomi: MiMo-V2.6 Flash" }
    );
    expect(joined).not.toBeNull();
    expect(joined!.canonicalId).toBe("xiaomi-mimo-v2.6-flash");
  });

  it("joins xAI Grok 4.7 even after AA renamed the creator to SpaceXAI", () => {
    // Live upstream identity (verified 2026-10-01): AA slug "grok-4-7",
    // AA creator renamed "xAI" -> "SpaceXAI", OpenRouter id "x-ai/grok-4.7".
    // The exact-match org equality previously failed here and silently
    // dropped Grok 4.7 from every published snapshot since 2026-09-21.
    const joined = autoJoin(
      { slug: "grok-4-7", creatorName: "SpaceXAI" },
      { id: "x-ai/grok-4.7", name: "xAI: Grok 4.7" }
    );
    expect(joined).not.toBeNull();
    expect(joined!.canonicalId).toBe("x-ai-grok-4.7");
    expect(joined!.organisation).toBe("xAI");
  });

  it("joins xAI Grok 4.7 with the legacy creator name too", () => {
    const joined = autoJoin(
      { slug: "grok-4-7", creatorName: "xAI" },
      { id: "x-ai/grok-4.7", name: "xAI: Grok 4.7" }
    );
    expect(joined).not.toBeNull();
  });

  it("still rejects a genuinely wrong creator name (identity verification intact)", () => {
    const joined = autoJoin(
      { slug: "grok-4-7", creatorName: "Anthropic" },
      { id: "x-ai/grok-4.7", name: "xAI: Grok 4.7" }
    );
    expect(joined).toBeNull();
  });

  it("still rejects unknown orgs (map stays closed, no fuzzy org matching)", () => {
    const joined = autoJoin(
      { slug: "totally-new-model", creatorName: "Brand New Org" },
      { id: "brand-new-org/totally-new-model", name: "Brand New Org: Totally New Model" }
    );
    expect(joined).toBeNull();
  });

  it("still rejects batch/contributor variants for the new orgs", () => {
    expect(autoJoin(
      { slug: "mimo-v2-6-pro", creatorName: "Xiaomi" },
      { id: "xiaomi/mimo-v2.6-pro:batch", name: "Xiaomi: MiMo-V2.6 Pro (batch)" }
    )).toBeNull();
    expect(autoJoin(
      { slug: "grok-4-7", creatorName: "SpaceXAI" },
      { id: "x-ai/grok-4.7-contributor", name: "xAI: Grok 4.7 Contributor" }
    )).toBeNull();
  });

  it("identity-token keying contract: AA and OR tokens for the same model are directly comparable", () => {
    // The refresh diagnostics key an AA identity map by aaIdentity(slug) and
    // probe it with orIdentity(OR model-slug). Pin that the SAME function
    // semantics hold across sides for the live canary shapes, including dots
    // vs dashes, underscores and effort-suffix stripping.
    const pairs: Array<[string, string]> = [
      ["grok-4-7", "grok-4.7"],
      ["mimo-v2-6-pro", "mimo-v2.6-pro"],
      ["glm-5-3-flash", "glm-5.3-flash"],
      ["gpt-6-1-sol", "gpt-6.1-sol"],
      ["claude-opus-5-5", "claude-opus-5.5"],
      ["deepseek-v4-1-flash", "deepseek-v4.1-flash"],
      ["1-2-3-a10b", "1_2_3-a10b"],
    ];
    expect(pairs.length).toBeGreaterThan(0);
    for (const [aaSlug, orSlug] of pairs) {
      expect(aaIdentity(aaSlug), `aaIdentity(${aaSlug}) vs orIdentity(${orSlug})`).toBe(orIdentity(orSlug));
    }
    // And the effort-suffix strip applies in aaIdentity only:
    expect(aaIdentity("grok-4-7-xhigh")).toBe(orIdentity("grok-4.7"));
  });
});
