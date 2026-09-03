import { describe, expect, it, vi } from "vitest";
import { buildParetoSnapshot } from "../aggregate";
import { mapOpenRouterModels } from "../openrouter";

/**
 * Shared-snapshot fallback contract:
 * - When cached AA is degraded, BOTH page and API source (buildParetoSnapshot)
 *   return non-null AA scores from the bundled official last-known-good data.
 * - Degraded metadata is preserved (aaStatus=error, error message present).
 * - No Arena fetch happens on the Pareto critical path.
 */
vi.mock("../aa-cache", () => ({
  getAaModelsCached: vi.fn(async () => ({
    status: "degraded",
    models: [],
    intelligenceIndexVersion: null,
    fetchedAt: null,
    reason: "AA API rate limited",
    retryAfterSeconds: 60000,
  })),
}));
vi.mock("../openrouter", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../openrouter")>();
  return {
    ...actual,
    fetchOpenRouterModels: vi.fn(async () => ({
      models: [
        { id: "meta/muse-spark-1.3", name: "Meta: Muse Spark 1.3", canonicalSlug: null, inputPerMillion: 1.25, outputPerMillion: 4.25, contextLength: 1000000, createdAtUnix: 1788378359 },
      ],
      fetchedAt: "2026-09-03T00:00:00Z",
    })),
  };
});

describe("aggregate AA fallback (shared snapshot)", () => {
  it("serves bundled AA scores and preserves degraded metadata when cached AA is degraded", async () => {
    const { snapshot, errors } = await buildParetoSnapshot();
    const scored = snapshot.models.filter((m) => m.aa.intelligenceIndex != null);
    expect(scored.length).toBeGreaterThan(0);
    expect(snapshot.freshness.aaStatus).toBe("error");
    expect(errors.some((e) => e.includes("AA API rate limited"))).toBe(true);
  });

  it("does not fetch Arena on the critical path", async () => {
    const arena = await import("../arena");
    const spy = vi.spyOn(arena, "fetchArenaSnapshot").mockImplementation(async () => { throw new Error("must not be called"); });
    await buildParetoSnapshot();
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});
