import { describe, expect, it } from "vitest";
import { formatDate } from "../format-date";

describe("Pareto freshness dates", () => {
  it("renders in a deterministic timezone for server/client hydration", () => {
    expect(formatDate("2026-09-04T00:49:48.037Z")).toBe("4 Sept 2026, 00:49 UTC");
  });
});
