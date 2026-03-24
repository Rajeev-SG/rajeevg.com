import fs from "node:fs/promises"
import path from "node:path"

import { expect, test, type Page } from "@playwright/test"

const artifactRoot = path.resolve(
  process.cwd(),
  "output/acceptance/hackathon-post-20260324/local-playwright",
)

async function dismissConsentIfPresent(page: Page) {
  const allowAnalytics = page.getByRole("button", { name: "Allow analytics" })
  const necessaryOnly = page.getByRole("button", { name: "Necessary only" })

  try {
    if (await allowAnalytics.isVisible({ timeout: 2_000 })) {
      await allowAnalytics.click()
      await page.waitForTimeout(300)
      return
    }
  } catch {
    // Banner not present in this run.
  }

  try {
    await necessaryOnly.click({ timeout: 2_000 })
    await page.waitForTimeout(300)
  } catch {
    // Banner not present in this run.
  }
}

async function assertImagesLoaded(page: Page) {
  const images = page.locator("img")
  const count = await images.count()

  for (let index = 0; index < count; index += 1) {
    await images.nth(index).scrollIntoViewIfNeeded()
    await page.waitForTimeout(150)
  }

  const brokenImages = await page.evaluate(() =>
    Array.from(document.images)
      .filter((image) => !image.complete || image.naturalWidth === 0)
      .map((image) => image.getAttribute("src") || image.currentSrc),
  )

  expect(brokenImages).toEqual([])
}

async function assertNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  expect(overflow).toBeLessThanOrEqual(1)
}

async function capturePage(page: Page, filename: string) {
  await fs.mkdir(artifactRoot, { recursive: true })
  await page.screenshot({
    path: path.join(artifactRoot, filename),
    fullPage: true,
  })
}

test.describe("hackathon editorial proof", () => {
  test("renders the hackathon article with loaded visuals and truthful figure structure", async ({
    page,
  }, testInfo) => {
    await page.goto("/blog/how-we-built-the-hackathon-voting-app")
    await dismissConsentIfPresent(page)

    await expect(
      page.getByRole("heading", { name: "How We Built The Hackathon Voting App" }),
    ).toBeVisible()
    await expect(page.getByText(/one public scoreboard, one sign-in path, one vote modal/i)).toBeVisible()

    const figureCount = await page.locator("figure").count()
    expect(figureCount).toBeGreaterThanOrEqual(5)

    await assertImagesLoaded(page)
    await assertNoHorizontalOverflow(page)
    await capturePage(page, `hackathon-article-${testInfo.project.name}.png`)
  })

  test("renders the site analytics route with GA4 reporting context intact", async ({
    page,
  }, testInfo) => {
    await page.goto("/projects/site-analytics")
    await dismissConsentIfPresent(page)

    await expect(
      page.getByRole("heading", { name: "GA4 content and instrumentation dashboard" }),
    ).toBeVisible()
    await expect(page.getByText(/Live reporting boundaries/i)).toBeVisible()
    await expect(page.getByText(/Realtime custom events/i)).toBeVisible()

    await assertNoHorizontalOverflow(page)
    await capturePage(page, `site-analytics-${testInfo.project.name}.png`)
  })
})
