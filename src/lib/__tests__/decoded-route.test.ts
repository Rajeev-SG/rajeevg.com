import { describe, expect, it } from "vitest";

import nextConfig from "../../../next.config";
import { isNegotiablePublicPath } from "@/lib/negotiable-paths";

// /solutions/decoded is Paid Media Decoded, a separate static deployment. A dropped
// rewrite would let the /solutions/[slug] page 404 it, and negotiation would turn
// its HTML into markdown, so both are pinned here.
const ORIGIN = "https://paid-media-decoded.vercel.app";

type Rule = { source: string; destination: string };

async function beforeFiles(): Promise<Rule[]> {
  const rewrites = nextConfig.rewrites;
  if (typeof rewrites !== "function") throw new Error("rewrites must be a function");
  const result: unknown = await rewrites();
  if (typeof result !== "object" || result === null || !("beforeFiles" in result)) return [];
  const group = (result as { beforeFiles: unknown }).beforeFiles;
  return Array.isArray(group) ? (group as Rule[]) : [];
}

describe("the /solutions/decoded route", () => {
  it("proxies the bare path and every subpath before the filesystem routes", async () => {
    const rules = await beforeFiles();
    expect(rules).toContainEqual({ source: "/solutions/decoded", destination: `${ORIGIN}/` });
    expect(rules).toContainEqual({ source: "/solutions/decoded/:path*", destination: `${ORIGIN}/:path*` });
  });

  it("is never content-negotiated", () => {
    expect(isNegotiablePublicPath("/solutions/decoded")).toBe(false);
    expect(isNegotiablePublicPath("/solutions/decoded/learn/the-ad-auction")).toBe(false);
    expect(isNegotiablePublicPath("/solutions/pareto-frontier")).toBe(true);
  });
});
