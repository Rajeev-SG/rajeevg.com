import { expect, test } from "@playwright/test"

/**
 * Deploy-time proof that the Visual AI Lab is reachable through /interfaces.
 *
 * These are the failure modes that are silent and user-facing: a broken SPA
 * fallback on a deep link, an asset path that no longer resolves under the
 * proxy base, markdown content negotiation corrupting an app response, and a
 * lab that is no longer same-origin with this site (which would break the
 * compare bench's clock bootstrap).
 */

const LAB_ORIGIN = "https://visual-ai-lab.vercel.app"

test("the lab shell renders through /interfaces with live frames", async ({ page }) => {
  const response = await page.goto("/interfaces/", { waitUntil: "domcontentloaded" })
  expect(response?.ok(), "GET /interfaces/").toBeTruthy()
  expect(await page.title()).toContain("Visual AI Lab")
  await expect(page.locator("iframe").first()).toBeVisible()
})

test("a client-only route survives a hard load", async ({ page }) => {
  const response = await page.goto("/interfaces/gallery", { waitUntil: "domcontentloaded" })
  expect(response?.ok(), "GET /interfaces/gallery").toBeTruthy()
  await expect(page.getByRole("heading", { name: /the gallery/i })).toBeVisible()
})

test("an experiment page and a poster asset are both served", async ({ page }) => {
  const experiment = await page.goto("/interfaces/experiments/hybrid-slack-water/index.html", {
    waitUntil: "domcontentloaded",
  })
  expect(experiment?.ok(), "GET experiment page").toBeTruthy()

  const asset = await page.request.get("/interfaces/posters/hybrid-slack-water.jpg")
  expect(asset.ok(), "GET poster").toBeTruthy()
  expect(asset.headers()["content-type"]).toContain("image/jpeg")
  expect((await asset.body()).byteLength).toBeGreaterThan(10_000)
})

test("the compare bench can inject its clock into the frames", async ({ page }) => {
  await page.goto("/interfaces/compare", { waitUntil: "domcontentloaded" })
  await expect(page.locator("[data-stage] iframe").first()).toBeVisible()

  // Same-origin proof: a cross-origin frame would throw on contentWindow access
  // and would never accept the injected clock bootstrap.
  await expect
    .poll(
      () =>
        page.evaluate(() => {
          const frame = document.querySelector<HTMLIFrameElement>("[data-stage] iframe")
          const win = frame?.contentWindow
          if (!win || !("__labClock" in win)) return false
          return Boolean(win.__labClock)
        }),
      { timeout: 20_000 },
    )
    .toBe(true)
})

test("the rewrite target still serves the lab", async ({ page }) => {
  const response = await page.goto(`${LAB_ORIGIN}/interfaces/`, { waitUntil: "domcontentloaded" })
  expect(response?.ok(), `GET ${LAB_ORIGIN}/interfaces/`).toBeTruthy()
  expect(await page.title()).toContain("Visual AI Lab")
})
