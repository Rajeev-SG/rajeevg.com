import fs from "node:fs/promises"
import path from "node:path"

import { expect, test, type Page } from "@playwright/test"

const artifactRoot = path.resolve(
  process.cwd(),
  process.env.CONTENT_OPS_ARTIFACT_ROOT || "output/acceptance/content-ops-ia-20260328/local-playwright",
)

async function ensureArtifactRoot() {
  await fs.mkdir(artifactRoot, { recursive: true })
}

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
    // Banner not visible in this run.
  }

  try {
    await necessaryOnly.click({ timeout: 2_000 })
    await page.waitForTimeout(300)
  } catch {
    // Banner not visible in this run.
  }
}

async function assertNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  expect(overflow).toBeLessThanOrEqual(1)
}

test.describe("content ops IA", () => {
  test("homepage, blog, article, dashboard, and editor all reflect the new content system", async ({
    page,
  }, testInfo) => {
    await ensureArtifactRoot()

    await page.goto("/")
    await dismissConsentIfPresent(page)

    await expect(
      page.getByRole("heading", {
        name: "Practical AI, analytics, and delivery systems that survive contact with real work.",
      }),
    ).toBeVisible()
    await expect(page.getByRole("link", { name: "Explore AI hub" })).toBeVisible()
    await expect(page.getByText("Flagships that define the system")).toBeVisible()
    await page.screenshot({
      path: path.join(artifactRoot, `home-${testInfo.project.name}.png`),
      fullPage: true,
    })
    await assertNoHorizontalOverflow(page)

    await page.goto("/blog")
    await dismissConsentIfPresent(page)
    await expect(page.getByRole("heading", { name: "Writing organised around pillars, proof, and playbooks" })).toBeVisible()
    await expect(page.getByText("Core opinion and operating models")).toBeVisible()
    await expect(page.getByPlaceholder("Search articles…")).toBeVisible()
    await page.screenshot({
      path: path.join(artifactRoot, `blog-${testInfo.project.name}.png`),
      fullPage: true,
    })
    await assertNoHorizontalOverflow(page)

    await page.goto("/blog/how-we-built-the-hackathon-voting-app")
    await dismissConsentIfPresent(page)
    await expect(page.getByText("Move from proof / build log into the rest of the system")).toBeVisible()
    await page.getByText("Move from proof / build log into the rest of the system").scrollIntoViewIfNeeded()
    await page.screenshot({
      path: path.join(artifactRoot, `article-next-steps-${testInfo.project.name}.png`),
      fullPage: false,
    })

    await page.goto("/dashboard")
    await dismissConsentIfPresent(page)
    await expect(page.getByRole("heading", { name: "Workbook-backed content OS" })).toBeVisible()
    await expect(page.getByRole("tab", { name: "Master Matrix" })).toBeVisible()
    await page.getByRole("tab", { name: "Existing Content" }).click()
    await page.getByRole("button", { name: "From AI Pilots to Clear Business Value" }).click()
    await expect(page.getByText("Generate research pack")).toBeVisible()
    await expect(page.getByText("View SEO/programmatic suggestions")).toBeVisible()
    await expect(page.getByText("View deployment timeline/status")).toBeVisible()
    await page.screenshot({
      path: path.join(artifactRoot, `dashboard-sheet-${testInfo.project.name}.png`),
      fullPage: false,
    })

    await page.getByRole("link", { name: "Open in editor" }).click()
    await expect(page.getByRole("heading", { name: "From AI Pilots to Clear Business Value" })).toBeVisible()
    await expect(page.getByRole("tab", { name: "Rich editor" })).toBeVisible()
    await expect(page.getByRole("button", { name: "Save draft" })).toBeVisible()
    await page.screenshot({
      path: path.join(artifactRoot, `editor-${testInfo.project.name}.png`),
      fullPage: true,
    })
    await assertNoHorizontalOverflow(page)
  })
})
