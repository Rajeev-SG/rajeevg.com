import { describe, expect, it } from "vitest";
import { validateSnapshot } from "@/lib/agent-benchmarks/validation";
import { seedSnapshot } from "@/lib/agent-benchmarks/registry";
import type { BenchmarkSnapshot } from "@/lib/agent-benchmarks/types";

const base = seedSnapshot();

function clone(): BenchmarkSnapshot {
  return JSON.parse(JSON.stringify(base)) as BenchmarkSnapshot;
}

describe("validateSnapshot", () => {
  it("accepts the bundled seed", () => {
    const result = validateSnapshot(base);
    expect(result.errors).toEqual([]);
    expect(result.ok).toBe(true);
  });

  it("rejects an unknown benchmark id", () => {
    const snapshot = clone();
    snapshot.results[0].benchmarkId = "does-not-exist";
    const result = validateSnapshot(snapshot);
    expect(result.ok).toBe(false);
    expect(result.errors.join(" ")).toContain("unknown benchmarkId");
  });

  it("rejects an unknown model id", () => {
    const snapshot = clone();
    snapshot.results[0].modelCanonicalId = "ghost-model";
    expect(validateSnapshot(snapshot).errors.join(" ")).toContain("unknown modelCanonicalId");
  });

  it("rejects a score outside the metric range", () => {
    const snapshot = clone();
    snapshot.results[0].score = 500;
    expect(validateSnapshot(snapshot).errors.join(" ")).toContain("outside");
  });

  it("rejects a reported result with no source URL", () => {
    const snapshot = clone();
    snapshot.results[0].sourceUrl = "";
    expect(validateSnapshot(snapshot).errors.join(" ")).toContain("sourceUrl");
  });

  it("rejects duplicate evaluation identity", () => {
    const snapshot = clone();
    snapshot.results.push({ ...snapshot.results[0] });
    expect(validateSnapshot(snapshot).errors.join(" ")).toContain("duplicate");
  });

  it("fails a suspicious shrink against a previous count", () => {
    const snapshot = clone();
    const reported = snapshot.results.filter((r) => r.scoreState === "reported").length;
    const result = validateSnapshot(snapshot, { previousReportedCount: reported * 4 });
    expect(result.ok).toBe(false);
    expect(result.errors.join(" ")).toContain("shrink");
  });
});
