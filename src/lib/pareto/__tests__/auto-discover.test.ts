import { describe, expect, it } from "vitest";
import { aaIdentity, autoJoin, orIdentity, orPrimaryId, parseOrId } from "../auto-discover";

describe("deterministic identity normalisation", () => {
  it("Muse 1.3 positive: AA muse-spark-1-3-xhigh joins meta/muse-spark-1.3", () => {
    expect(aaIdentity("muse-spark-1-3-xhigh")).toBe("muse-spark-1-3");
    expect(orIdentity("muse-spark-1.3")).toBe("muse-spark-1-3");
    const joined = autoJoin(
      { slug: "muse-spark-1-3-xhigh", creatorName: "Meta" },
      { id: "meta/muse-spark-1.3", name: "Meta: Muse Spark 1.3" }
    );
    expect(joined).toEqual({
      canonicalId: "meta-muse-spark-1.3",
      displayName: "Muse Spark 1.3",
      organisation: "Meta",
    });
  });

  it("contributor and batch variants never merge with the primary model", () => {
    expect(parseOrId("meta/muse-spark-1.3-contributor")).toBeNull();
    expect(parseOrId("meta/muse-spark-1.3:batch")).toBeNull();
    expect(orPrimaryId("meta/muse-spark-1.3-contributor")).toBeNull();
    const contributor = autoJoin(
      { slug: "muse-spark-1-3-xhigh", creatorName: "Meta" },
      { id: "meta/muse-spark-1.3-contributor", name: "Meta: Muse Spark 1.3 Contributor" }
    );
    expect(contributor).toBeNull();
  });

  it("cross-org or mismatched creator names never join", () => {
    expect(autoJoin(
      { slug: "muse-spark-1-3-xhigh", creatorName: "Anthropic" },
      { id: "meta/muse-spark-1.3", name: "Meta: Muse Spark 1.3" }
    )).toBeNull();
    expect(autoJoin(
      { slug: "muse-spark-1-3-xhigh", creatorName: null },
      { id: "meta/muse-spark-1.3", name: "Meta: Muse Spark 1.3" }
    )).toBeNull();
  });

  it("identities normalise punctuation but never guess", () => {
    expect(aaIdentity("muse_spark_1_3_xhigh")).toBe("muse-spark-1-3");
    expect(aaIdentity("muse-spark-1.3")).toBe("muse-spark-1-3");
    expect(orIdentity("muse-spark-1.3")).toBe("muse-spark-1-3");
    expect(aaIdentity("muse-spark-1-3")).toBe("muse-spark-1-3");
    expect(orIdentity("muse-spark-1-4")).not.toBe(aaIdentity("muse-spark-1-3-xhigh"));
  });

  it("parseOrId rejects malformed ids and variants", () => {
    expect(parseOrId("no-slash")).toBeNull();
    expect(parseOrId("meta/:batch")).toBeNull();
    expect(parseOrId("meta/muse-spark-1.3")).toEqual({ orgSlug: "meta", modelSlug: "muse-spark-1.3" });
  });
});
