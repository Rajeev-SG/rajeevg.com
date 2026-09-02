import { describe, expect, it } from "vitest";
import { perTokenToPerMillion } from "../openrouter";

describe("OpenRouter per-token to per-million conversion", () => {
  it("converts per-token to per-million correctly", () => {
    expect(perTokenToPerMillion("0.000003")).toBe(3);
    expect(perTokenToPerMillion("0.00000025")).toBe(0.25);
    expect(perTokenToPerMillion("0.000015")).toBe(15);
  });

  it("handles numeric input", () => {
    expect(perTokenToPerMillion(0.000003)).toBe(3);
  });

  it("handles invalid/missing input", () => {
    expect(perTokenToPerMillion(null)).toBeNull();
    expect(perTokenToPerMillion(undefined)).toBeNull();
    expect(perTokenToPerMillion("abc")).toBeNull();
  });

  it("round-trips through string parse", () => {
    // 0.0000015 per token = $1.50/M
    expect(perTokenToPerMillion("0.0000015")).toBeCloseTo(1.5, 10);
  });
});
