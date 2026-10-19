import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import nextConfig from "../../../next.config";
import labRelease from "@/lib/interfaces/lab-release.json";
import { isNegotiablePublicPath } from "@/lib/negotiable-paths";

// Guard the shape of the /interfaces route (the Visual AI Lab).
//
// The route is a rewrite to a separate Vercel project. Its failure modes are
// silent: a dropped rewrite 404s the whole lab, a cached rewrite serves a
// stale lab after the lab redeploys, and content negotiation turns the lab's
// HTML into a markdown response. These assertions exist so a future edit
// cannot quietly break any of the three.

const LAB_ORIGIN = "https://visual-ai-lab.vercel.app";

type RewriteRule = { source: string; destination: string };

async function readRewrites(): Promise<RewriteRule[]> {
  const rewrites = nextConfig.rewrites;
  if (typeof rewrites !== "function") {
    throw new Error("next.config.ts must declare rewrites as a function");
  }
  return (await rewrites()) as RewriteRule[];
}

describe("the /interfaces route", () => {
  it("serves the bare path and every subpath from the lab origin", async () => {
    const rules = await readRewrites();
    expect(rules).toContainEqual({
      source: "/interfaces",
      destination: `${LAB_ORIGIN}/`,
    });
    expect(rules).toContainEqual({
      source: "/interfaces/:path*",
      destination: `${LAB_ORIGIN}/:path*`,
    });
  });

  it("pins the lab build the site expects to serve", async () => {
    const rules = await readRewrites();
    const destinations = rules
      .filter((rule) => rule.source.startsWith("/interfaces"))
      .map((rule) => new URL(rule.destination).origin);
    expect(destinations.length).toBeGreaterThan(0);
    // The rewrite and the pin must name the same origin: a pin for one origin
    // next to a rewrite to another would make the deploy-time check prove
    // nothing.
    for (const destination of destinations) {
      expect(destination).toBe(labRelease.origin);
    }
    expect(labRelease.build).toMatch(/^[0-9a-f]{16}$/);
    expect(labRelease.outputs).toBeGreaterThan(0);
  });

  it("does not cache the proxied responses", () => {
    // The origin's Cache-Control is outside this site's control. Caching a
    // rewrite with no staleness budget would serve a stale lab after the lab
    // project is redeployed, so the caching opt-in stays off.
    const config = JSON.parse(readFileSync("vercel.json", "utf8")) as {
      headers?: { source: string; headers: { key: string }[] }[];
    };
    const keys = (config.headers ?? []).flatMap((rule) =>
      rule.headers.map((header) => header.key)
    );
    expect(keys).not.toContain("x-vercel-enable-rewrite-caching");
  });

  it("keeps the lab out of markdown content negotiation", () => {
    expect(isNegotiablePublicPath("/interfaces")).toBe(false);
    expect(isNegotiablePublicPath("/interfaces/")).toBe(false);
    expect(isNegotiablePublicPath("/interfaces/gallery")).toBe(false);
    expect(isNegotiablePublicPath("/interfaces/experiments/lab/index.html")).toBe(false);
  });

  it("still negotiates ordinary articles", () => {
    expect(isNegotiablePublicPath("/blog/a-post")).toBe(true);
  });
});
