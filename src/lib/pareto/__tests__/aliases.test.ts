import { describe, expect, it } from "vitest";
import { canonicalEntries, resolveAaSlug, resolveOpenRouterId, resolveArenaName } from "../aliases";

describe("deterministic alias resolution", () => {
  it("resolves a known AA slug", () => {
    expect(resolveAaSlug("gpt-5")?.canonicalId).toBe("openai-gpt-5");
    expect(resolveAaSlug("GPT-5")?.canonicalId).toBe("openai-gpt-5"); // case-insensitive
  });

  it("resolves a known OpenRouter id", () => {
    expect(resolveOpenRouterId("openai/gpt-5")?.canonicalId).toBe("openai-gpt-5");
    expect(resolveOpenRouterId("x-ai/grok-4.5")?.canonicalId).toBe("xai-grok-4.5");
  });

  it("resolves a known Arena name", () => {
    expect(resolveArenaName("GPT-5")?.canonicalId).toBe("openai-gpt-5");
  });

  it("returns null for unknown values (no fuzzy matching)", () => {
    expect(resolveAaSlug("gpt-5-turbo")).toBeNull();
    expect(resolveOpenRouterId("openai/gpt-6")).toBeNull();
    expect(resolveArenaName("gpt-5-mini-2024")).toBeNull();
  });

  it("returns null for near-miss strings (edit distance should never match)", () => {
    expect(resolveAaSlug("gpt-5-mini")).not.toBeNull(); // exact match allowed
    expect(resolveAaSlug("gpt5")).toBeNull(); // no punctuation normalisation guessing
    expect(resolveOpenRouterId("openai/gpt-5-mini")).not.toBeNull();
  });

  it("all canonical entries have display names and organisations", () => {
    for (const e of canonicalEntries()) {
      expect(e.displayName).toBeTruthy();
      expect(e.organisation).toBeTruthy();
    }
  });
});

describe("Meta Muse canary (official structured data, verified 2026-09-02)", () => {
  it("Muse Spark 1.2 resolves across AA, OpenRouter and Arena", () => {
    expect(resolveAaSlug("muse-spark-1-2")?.canonicalId).toBe("meta-muse-spark-1.2");
    expect(resolveOpenRouterId("meta/muse-spark-1.2")?.canonicalId).toBe("meta-muse-spark-1.2");
    expect(resolveArenaName("Muse Spark 1.2 (xHigh)")?.canonicalId).toBe("meta-muse-spark-1.2");
expect(resolveArenaName("muse-spark-1.2")?.canonicalId).toBe("meta-muse-spark-1.2");
  });
  it("Muse Glimmer resolves across AA, OpenRouter and Arena", () => {
    expect(resolveAaSlug("muse-glimmer")?.canonicalId).toBe("meta-muse-glimmer-30b");
    expect(resolveOpenRouterId("meta/muse-glimmer-30b")?.canonicalId).toBe("meta-muse-glimmer-30b");
    expect(resolveArenaName("Muse Glimmer")?.canonicalId).toBe("meta-muse-glimmer-30b");
  });
  it("unknown near-miss Muse ids stay unmatched", () => {
    expect(resolveOpenRouterId("meta/muse-spark-1.3-contributor")).toBeNull();
    expect(resolveAaSlug("muse-spark")).toBeNull();
  });
});
