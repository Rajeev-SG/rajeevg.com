import { describe, expect, it } from "vitest";

import {
  countInGroup,
  defaultMediaItemId,
  getMediaGroup,
  getMediaItem,
  mediaAssets,
  mediaGroups,
  mediaItems,
  mediaTotals,
} from "../agentic-media";

/**
 * Invariants for the hand-transcribed agentic media wall.
 *
 * The values come from the production notes; the failure mode to guard against is
 * transcription drift. These assertions check the snapshot's own internal
 * consistency (ids, counts, ranks, per-group totals) and the asset URL shape, not
 * the measured render times, which belong to the production record.
 */
describe("agentic media wall snapshot", () => {
  it("publishes five experiments and twenty-nine films", () => {
    expect(mediaGroups).toHaveLength(5);
    expect(mediaItems).toHaveLength(29);
    expect(mediaTotals).toEqual({ films: 29, experiments: 5, enginesAndTools: "20+" });
  });

  it("groups carry the declared film counts", () => {
    const byGroup = mediaGroups.map((group) => [group.id, countInGroup(group.id)] as const);
    expect(byGroup).toEqual([
      ["engines", 14],
      ["foss", 5],
      ["series", 4],
      ["explainers", 3],
      ["brands", 3],
    ]);
    expect(mediaItems.every((item) => getMediaGroup(item.group) !== undefined)).toBe(true);
  });

  it("ids are unique and safe as asset folder names", () => {
    const ids = mediaItems.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      expect(id, `"${id}" must be a lowercase asset path segment`).toMatch(/^[a-z0-9][a-z0-9-]*$/);
    }
  });

  it("only the two ranked experiments carry ranks, one through their count", () => {
    for (const groupId of ["engines", "foss"] as const) {
      const ranks = mediaItems
        .filter((item) => item.group === groupId)
        .map((item) => item.rank)
        .sort((a, b) => (a ?? 0) - (b ?? 0));
      expect(ranks).toEqual(Array.from({ length: countInGroup(groupId) }, (_, index) => index + 1));
    }
    expect(mediaItems.filter((item) => item.group === "series").every((item) => item.rank === undefined)).toBe(true);
    expect(mediaItems.filter((item) => item.group === "explainers").every((item) => item.rank === undefined)).toBe(true);
    expect(mediaItems.filter((item) => item.group === "brands").every((item) => item.rank === undefined)).toBe(true);
  });

  it("every film keeps its engine, duration, size, render note and a written verdict", () => {
    for (const item of mediaItems) {
      expect(item.title.trim(), item.id).not.toBe("");
      expect(item.engine.trim(), item.id).not.toBe("");
      expect(item.dur, item.id).toBeGreaterThan(0);
      expect(item.size, item.id).toMatch(/^\d+(\.\d+)? MB$/);
      expect(item.render.trim(), item.id).not.toBe("");
      expect(item.note.trim(), item.id).not.toBe("");
      expect(item.stack.length, item.id).toBeGreaterThan(0);
      expect(item.fmt, item.id).toBe("1080×1920");
    }
  });

  it("builds one asset path per film on the asset Worker", () => {
    expect(mediaAssets("video-engines--motion-canvas-tokens")).toEqual({
      poster: "https://assets.rajeevg.com/social-influence/video-engines--motion-canvas-tokens/poster.jpg",
      preview: "https://assets.rajeevg.com/social-influence/video-engines--motion-canvas-tokens/preview.mp4",
      contactSheet: "https://assets.rajeevg.com/social-influence/video-engines--motion-canvas-tokens/contact-sheet.jpg",
      master: "https://assets.rajeevg.com/social-influence/video-engines--motion-canvas-tokens/master.mp4",
    });
  });

  it("opens on the top-ranked engine film and can look any film up by id", () => {
    const first = getMediaItem(defaultMediaItemId);
    expect(first?.group).toBe("engines");
    expect(first?.rank).toBe(1);
    expect(getMediaItem("not-a-film")).toBeUndefined();
  });
});