import fs from "node:fs/promises"
import path from "node:path"

import { expect, test, type Page } from "@playwright/test"

const artifactRoot = path.resolve(
  process.cwd(),
  process.env.MEASUREMENT_ARTICLE_ARTIFACT_ROOT ||
    "output/acceptance/measurement-article-20260326/local-playwright",
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

  await page.waitForFunction(
    () =>
      Array.from(document.images).every((image) => image.complete && image.naturalWidth > 0),
    undefined,
    { timeout: 5_000 },
  )

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

async function ensureArtifactRoot() {
  await fs.mkdir(artifactRoot, { recursive: true })
}

test.describe("measurement article proof", () => {
  test("renders the measurement article with quant sections, figures, sources, and stable layout", async ({
    page,
  }, testInfo) => {
    await ensureArtifactRoot()

    await page.goto("/blog/why-browser-consent-and-source-blending-make-marketing-measurement-harder")
    await dismissConsentIfPresent(page)

    await expect(
      page.getByRole("heading", {
        name: "Why Browser Privacy, Consent, And Source Blending Make Marketing Effectiveness Harder To Prove",
      }),
    ).toBeVisible()

    await expect(page.getByText("Persisted votes", { exact: true })).toBeVisible()
    await expect(page.getByText("GA4 raw submits", { exact: true })).toBeVisible()
    await expect(page.getByText("Raw BigQuery tables", { exact: true })).toBeVisible()
    await expect(page.getByText("One event day, four different stories", { exact: true })).toBeVisible()
    await expect(
      page.getByText("A defensible effectiveness read usually comes from calibration, not one dashboard", {
        exact: true,
      }),
    ).toBeVisible()

    const mermaidSvgs = page.locator("pre.mermaid svg")
    await expect(mermaidSvgs.first()).toBeVisible()
    await expect(mermaidSvgs).toHaveCount(2)

    const figures = page.locator("figure")
    await expect(figures).toHaveCount(2)

    await assertImagesLoaded(page)

    const sourcesHeading = page.getByRole("heading", { name: "Sources", exact: true })
    await expect(sourcesHeading).toBeVisible()

    const sourceLinks = sourcesHeading.locator("xpath=following-sibling::ul[1]//a")
    await expect(sourceLinks).toHaveCount(11)

    await assertNoHorizontalOverflow(page)

    await page.screenshot({
      path: path.join(artifactRoot, `measurement-article-full-${testInfo.project.name}.png`),
      fullPage: true,
    })

    await page.getByText(/How GA4 modeled data actually works/i).scrollIntoViewIfNeeded()
    await page.screenshot({
      path: path.join(artifactRoot, `measurement-article-mid-${testInfo.project.name}.png`),
      fullPage: false,
    })
  })
})
