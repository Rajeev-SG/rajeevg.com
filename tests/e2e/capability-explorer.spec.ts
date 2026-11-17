import path from "node:path"

import { expect, test, type Page } from "@playwright/test"

const explorer = "/solutions/capability-explorer"
const guideTitle = "Performance Max audience signals"
const artifactRoot = path.resolve(
  process.cwd(),
  process.env.ADPI_ARTIFACT_ROOT || "output/acceptance/capability-explorer-latest",
)

async function expectPageFits(page: Page) {
  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }))
  expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1)
}

test("finds a feature by browsing or search and opens its guide", async ({ page }, testInfo) => {
  const width = testInfo.project.name === "mobile-dark" ? 390 : 1280
  const errors: string[] = []
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text())
  })
  page.on("pageerror", (error) => errors.push(error.message))

  await page.setViewportSize({ width, height: width === 390 ? 844 : 900 })
  await page.goto(explorer)
  const consent = page.getByRole("button", { name: "Necessary only" })
  await consent.click()

  const landing = page.getByRole("main")
  await expect(landing.getByRole("heading", { name: "Ad Platform Capability Explorer", level: 1 })).toBeVisible()
  const browse = landing.getByRole("region", { name: "Browse by platform" })
  await expect(browse.getByRole("heading", { name: "Google Ads" })).toBeVisible()
  await expect(browse.getByRole("heading", { name: "Targeting and audiences" }).first()).toBeVisible()
  await expect(browse.getByRole("link", { name: guideTitle })).toBeVisible()
  await expectPageFits(page)
  await page.screenshot({ path: path.join(artifactRoot, `landing-${width}.png`), fullPage: true, scale: "css" })

  const search = page.getByRole("searchbox", { name: "Search features" })
  await search.fill("no matching feature test")
  await expect(landing.getByText("No matching features.")).toBeVisible()
  await search.fill("lookalike")
  await expect(landing.getByRole("link", { name: "Lookalike segments (Demand Gen)" })).toBeVisible()
  await search.fill("performance max audience")
  const result = landing.getByRole("region", { name: "Search results" }).getByRole("link", { name: guideTitle })
  await expect(result).toHaveAttribute("href", `${explorer}/guides/ga.pmax-audience-signals`)
  await result.click()

  const guide = page.getByRole("article")
  await expect(guide.getByRole("heading", { name: guideTitle, level: 1 })).toBeVisible()
  await expect(guide.getByText("Signal — guides delivery, doesn’t restrict it")).toBeVisible()
  await expect(guide.getByText("Sources checked 17 Nov 2026")).toBeVisible()
  await expect(guide.getByLabel("Quick facts").getByText("Asset group", { exact: true })).toBeVisible()
  for (const name of [
    "What you can give it", "Use it when", "Don’t rely on it when", "Set it up",
    "What it can move", "On other platforms", "Sources",
  ]) {
    await expect(guide.getByRole("heading", { name, level: 2, exact: true })).toBeVisible()
  }
  await expect(guide.locator("ol").filter({ hasText: "Open the Performance Max campaign" }).getByRole("listitem")).toHaveCount(4)
  const comparisons = guide.getByRole("table", { name: "On other platforms" })
  for (const vendor of ["Meta", "TikTok", "Pinterest"]) {
    await expect(comparisons.getByRole("cell", { name: vendor, exact: true })).toBeVisible()
  }
  await guide.getByRole("link", { name: "Source 1" }).click()
  await expect(page).toHaveURL(/#source-1$/)
  await expect(guide.getByRole("link", { name: /Google Ads Help/ })).toBeInViewport()
  await expectPageFits(page)
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.screenshot({ path: path.join(artifactRoot, `pmax-guide-${width}.png`), fullPage: true, scale: "css" })

  await search.fill("audience signals")
  await search.press("Enter")
  await expect(landing.getByRole("region", { name: "Search results" }).getByRole("link", { name: guideTitle })).toBeVisible()
  expect(errors).toEqual([])
})
