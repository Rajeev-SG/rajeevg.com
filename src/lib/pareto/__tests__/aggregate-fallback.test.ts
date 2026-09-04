import { describe, expect, it, vi } from "vitest";
import { buildParetoSnapshot } from "../aggregate";

/**
 * Scheduled-snapshot contract:
 * - BOTH page and API source use the validated bundled AA snapshot.
 * - Normal page/API traffic never calls AA and therefore consumes no quota.
 * - No Arena fetch happens on the Pareto critical path.
 */
const getAaModelsCached = vi.fn();
vi.mock("../aa-cache", () => ({
  getAaModelsCached,
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
  it("serves bundled AA scores without making a live AA request", async () => {
    const { snapshot, errors } = await buildParetoSnapshot();
    const scored = snapshot.models.filter((m) => m.aa.intelligenceIndex != null);
    expect(scored.length).toBeGreaterThan(0);
    expect(snapshot.freshness.aaStatus).toBe("ok");
    expect(errors).toEqual([]);
    expect(getAaModelsCached).not.toHaveBeenCalled();
  });

  it("does not fetch Arena on the critical path", async () => {
    const arena = await import("../arena");
    const spy = vi.spyOn(arena, "fetchArenaSnapshot").mockImplementation(async () => { throw new Error("must not be called"); });
    await buildParetoSnapshot();
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});
