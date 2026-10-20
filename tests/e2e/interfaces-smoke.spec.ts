import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

/**
 * Deploy-time proof that the Visual AI Lab is reachable through /interfaces.
 *
 * These are the failure modes that are silent and user-facing: a broken SPA
 * fallback on a deep link, an asset path that no longer resolves under the
 * proxy base, markdown content negotiation corrupting an app response, and a
 * lab that is no longer same-origin with this site (which would break the
 * compare bench's clock bootstrap).
 *
 * The lab's build marker is pinned in src/lib/interfaces/lab-release.json. The
 * origin is a mutable `*.vercel.app` alias, so a title check would not notice
 * an origin that had been re-pointed at a different project; a pinned content
 * hash does.
 */

type LabRelease = { origin: string; build: string; outputs: number };

const release = JSON.parse(
  readFileSync("src/lib/interfaces/lab-release.json", "utf8"),
) as LabRelease;

const ORIGIN_HOST = new URL(release.origin).host;

/** Every request the page makes, so a request that escapes the proxy is caught. */
function trackRequests(page: Page) {
  const requested: string[] = [];
  page.on("request", (request) => requested.push(request.url()));
  return requested;
}

test("the lab shell renders through /interfaces with live frames", async ({ page }) => {
  const requested = trackRequests(page);
  const response = await page.goto("/interfaces/", { waitUntil: "domcontentloaded" });
  expect(response?.ok(), "GET /interfaces/").toBeTruthy();
  expect(await page.title()).toContain("Visual AI Lab");
  await expect(page.locator("iframe").first()).toBeVisible();
  expect(requested.filter((url) => url.includes(ORIGIN_HOST))).toEqual([]);
});

test("a client-only route survives a hard load", async ({ page }) => {
  const requested = trackRequests(page);
  const response = await page.goto("/interfaces/gallery", { waitUntil: "domcontentloaded" });
  expect(response?.ok(), "GET /interfaces/gallery").toBeTruthy();
  await expect(page.getByRole("heading", { name: /the gallery/i })).toBeVisible();
  expect(requested.filter((url) => url.includes(ORIGIN_HOST))).toEqual([]);
});

test("an experiment page and a poster asset are both served", async ({ page }) => {
  const experiment = await page.goto("/interfaces/experiments/hybrid-slack-water/index.html", {
    waitUntil: "domcontentloaded",
  });
  expect(experiment?.ok(), "GET experiment page").toBeTruthy();

  const asset = await page.request.get("/interfaces/posters/hybrid-slack-water.jpg");
  expect(asset.ok(), "GET poster").toBeTruthy();
  expect(asset.headers()["content-type"]).toContain("image/jpeg");
  expect((await asset.body()).byteLength).toBeGreaterThan(10_000);
});

test("the compare bench can inject its clock into every frame", async ({ page }) => {
  const requested = trackRequests(page);
  await page.goto("/interfaces/compare", { waitUntil: "domcontentloaded" });
  await expect(page.locator("[data-stage] iframe").first()).toBeVisible();

  // Same-origin proof for every frame the bench creates: a cross-origin frame
  // would throw on contentWindow access and would never accept the injected
  // clock bootstrap.
  await expect
    .poll(
      () =>
        page.evaluate(() => {
          const frames = Array.from(
            document.querySelectorAll<HTMLIFrameElement>("[data-stage] iframe"),
          );
          if (frames.length === 0) return false;
          return frames.every((frame) => {
            const win = frame.contentWindow;
            return Boolean(win && "__labClock" in win && win.__labClock);
          });
        }),
      { timeout: 20_000 },
    )
    .toBe(true);

  expect(requested.filter((url) => url.includes(ORIGIN_HOST))).toEqual([]);
});

test("the alias is serving the commit under test", async ({ page }) => {
  // The workflow derives the expected build hash from the pushed commit once
  // and passes it in, so the wait loop and this assertion cannot disagree.
  // Locally it falls back to the same derivation from GITHUB_SHA.
  const expected =
    process.env.EXPECTED_BUILD_HASH ??
    (process.env.GITHUB_SHA
      ? createHash("sha256").update(process.env.GITHUB_SHA).digest("hex").slice(0, 16)
      : undefined);
  test.skip(!expected, "no commit under test outside CI");

  const response = await page.request.get("/api/build-info");
  expect(response.ok(), "GET /api/build-info").toBeTruthy();
  const info = JSON.parse(await response.text()) as { build: string };
  expect(info.build, "the alias must serve the commit under test").toBe(expected);
});

test("the served lab is the pinned build", async ({ page }) => {
  const proxied = await page.request.get("/interfaces/build-info.json");
  expect(proxied.ok(), "GET proxied build marker").toBeTruthy();
  const proxiedInfo = JSON.parse(await proxied.text()) as { build: string; outputs: number };
  expect(proxiedInfo.build).toBe(release.build);
  expect(proxiedInfo.outputs).toBe(release.outputs);

  const origin = await page.request.get(`${release.origin}/interfaces/build-info.json`);
  expect(origin.ok(), "GET origin build marker").toBeTruthy();
  const originInfo = JSON.parse(await origin.text()) as { build: string; outputs: number };
  expect(originInfo.build).toBe(release.build);
});

test("the proxied responses carry a zero staleness budget", async ({ page }) => {
  const targets = [
    "/interfaces/",
    "/interfaces/gallery",
    "/interfaces/posters/hybrid-slack-water.jpg",
  ];
  for (const target of targets) {
    const response = await page.request.get(target);
    expect(response.ok(), `GET ${target}`).toBeTruthy();
    const cacheControl = response.headers()["cache-control"] ?? "";
    const age = response.headers()["age"] ?? "0";
    const vercelCache = response.headers()["x-vercel-cache"] ?? "-";
    test.info().annotations.push({
      type: "cache",
      description: `${target} cache-control="${cacheControl}" age=${age} x-vercel-cache=${vercelCache}`,
    });
    // The lab's own responses are `public, max-age=0, must-revalidate`, and the
    // proxy passes them through: every hit is revalidated, so a lab redeploy
    // is visible immediately and no response can be served stale.
    expect(cacheControl, `cache-control on ${target}`).toContain("max-age=0");
    expect(cacheControl, `cache-control on ${target}`).toContain("must-revalidate");
  }
});

test("the rewrite target still serves the lab", async ({ page }) => {
  const response = await page.goto(`${release.origin}/interfaces/`, { waitUntil: "domcontentloaded" });
  expect(response?.ok(), `GET ${release.origin}/interfaces/`).toBeTruthy();
  expect(await page.title()).toContain("Visual AI Lab");
});
