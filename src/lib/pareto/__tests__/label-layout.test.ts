import { describe, expect, it } from "vitest";
import { computeLabelPlacements } from "../label-layout";

function mk(label: string, x01: number, y01: number, index: number) {
  return { label, x01, y01, index };
}

describe("deterministic label collision avoidance", () => {
  const W = 800;

  it("assigns overlapping close-y labels to distinct lanes (deterministic)", () => {
    const points = [
      mk("GLM-5.3", 0.50, 0.62, 0),
      mk("Kimi K3", 0.505, 0.615, 1),
      mk("Gemini 3.6", 0.51, 0.61, 2),
      mk("Grok 4.6", 0.515, 0.605, 3),
    ];
    const first = computeLabelPlacements(points, W);
    const second = computeLabelPlacements(points, W);
    expect(first).toEqual(second); // deterministic
    const lanes = first.map((p) => p.lane);
    expect(new Set(lanes).size).toBe(4); // all four get distinct lanes
    // association preserved
    expect(first[0].index).toBe(0);
    expect(first[3].index).toBe(3);
  });

  it("far-apart labels share lane 0", () => {
    const points = [
      mk("A", 0.1, 0.9, 0),
      mk("B", 0.5, 0.5, 1),
      mk("C", 0.9, 0.2, 2),
    ];
    const placements = computeLabelPlacements(points, W);
    expect(placements.map((p) => p.lane)).toEqual([0, 0, 0]);
    expect(placements.map((p) => p.dy)).toEqual([-14, -14, -14]);
  });

  it("alternates above/below for two colliding labels", () => {
    const points = [
      mk("LongLabelNameA", 0.5, 0.6, 0),
      mk("LongLabelNameB", 0.51, 0.595, 1),
    ];
    const placements = computeLabelPlacements(points, W);
    expect(placements[0].lane).toBe(0);
    expect(placements[1].lane).toBe(1);
    expect(placements[0].dy).toBeLessThan(0);
    expect(placements[1].dy).toBeGreaterThan(0);
  });
});
