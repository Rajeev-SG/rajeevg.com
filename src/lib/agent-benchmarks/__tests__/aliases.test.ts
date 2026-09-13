import { describe, expect, it } from "vitest";
import { resolveModelName } from "@/lib/agent-benchmarks/registry";

describe("resolveModelName", () => {
  it("resolves exact aliases, case-insensitively", () => {
    expect(resolveModelName("GLM-5.3 Flash")).toBe("glm-5.3-flash");
    expect(resolveModelName("glm-5.3-flash")).toBe("glm-5.3-flash");
    expect(resolveModelName("GLM-5.3")).toBe("glm-5.3");
    expect(resolveModelName("  deepseek v4.1 flash  ")).toBe("deepseek-v4.1-flash");
  });

  it("never leaks one family member's identity into another", () => {
    expect(resolveModelName("GPT-5.6 Luna")).toBe("gpt-5.6-luna");
    expect(resolveModelName("GPT-5.6 Luna")).not.toBe("gpt-5.6-sol");
    expect(resolveModelName("GLM-5.3-Flash")).not.toBe("glm-5.3");
  });

  it("returns null for unknown names rather than guessing", () => {
    expect(resolveModelName("Some Random Model 9000")).toBeNull();
    expect(resolveModelName("")).toBeNull();
  });
});
