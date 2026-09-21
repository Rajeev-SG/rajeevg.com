import { describe, expect, it } from "vitest";
import {
  capabilityRows,
  corpusTasks,
  jevFastPathRows,
  latencyRows,
  microbench,
} from "../web-automation-microbench";

/**
 * Invariants for the hand-transcribed leaderboard snapshot (frontier review of #171).
 *
 * The site's leaderboard is transcribed from the microbench + jev-tests repos, so the
 * failure mode to guard against is drift: a declared count that no longer matches the
 * rows, or a capability row whose passes exceed its reps. These assertions check the
 * SNAPSHOT'S OWN INTERNAL CONSISTENCY and the counting rule, not the upstream metric
 * values (those change when the benchmark re-runs; pinning them would break a refresh).
 */
describe("web-automation leaderboard snapshot invariants", () => {
  it("harness count matches the latency rows", () => {
    expect(microbench.harnesses).toBe(latencyRows.length);
  });

  it("declared runs equal reps x corpus tasks summed over capabilityRows", () => {
    // Counting rule: a "reps" value lists the rep labels a harness was run at, and each
    // rep covers every corpus task. So runs = reps-labels x number of tasks.
    const runs = capabilityRows.reduce((sum, row) => {
      const n = row.reps.split(",").filter((s) => s.trim() !== "").length;
      return sum + n * corpusTasks.length;
    }, 0);
    expect(microbench.runs).toBe(runs);
  });

  it("every capability pass count is within its rep count", () => {
    for (const row of capabilityRows) {
      const match = row.capability.match(/^(\d+)\/(\d+)$/);
      expect(match, `capability "${row.capability}" must be passes/reps`).not.toBeNull();
      const [, passes, reps] = match!;
      expect(Number(passes)).toBeLessThanOrEqual(Number(reps));
      expect(Number(reps)).toBeGreaterThan(0);
    }
  });

  it("every corpus task pass count is within its denominator", () => {
    for (const task of corpusTasks) {
      const match = task.passes.match(/^(\d+)\/(\d+)$/);
      expect(match, `passes "${task.passes}" must be passes/total`).not.toBeNull();
      const [, passes, total] = match!;
      expect(Number(passes)).toBeLessThanOrEqual(Number(total));
      expect(Number(total)).toBeGreaterThan(0);
    }
  });

  it("Jev fast-path rows carry a 5-run denominator and a pass count within it", () => {
    expect(jevFastPathRows.length).toBeGreaterThan(0);
    for (const row of jevFastPathRows) {
      const match = row.pass.match(/^(\d+)\/(\d+)$/);
      expect(match, `pass "${row.pass}" must be passes/runs`).not.toBeNull();
      const [, passes, runs] = match!;
      expect(Number(runs)).toBe(5);
      expect(Number(passes)).toBeLessThanOrEqual(Number(runs));
    }
  });

  it("the adaptive-ui-runtime row is present at 0 passes on real work", () => {
    const row = capabilityRows.find((r) => r.harness === "adaptive-ui-runtime");
    expect(row).toBeDefined();
    expect(row!.capability.startsWith("0/")).toBe(true);
  });
});
