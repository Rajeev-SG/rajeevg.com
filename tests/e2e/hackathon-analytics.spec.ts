import fs from "node:fs/promises"
import path from "node:path"

import { expect, test, type Locator, type Page } from "@playwright/test"

const artifactRoot = path.resolve(
  process.cwd(),
  "output/playwright/hackathon-dashboard-20260325",
)

async function capture(locator: Locator, filename: string) {
  await fs.mkdir(artifactRoot, { recursive: true })
  await locator.screenshot({ path: path.join(artifactRoot, filename) })
}

async function dismissConsentIfPresent(page: Page) {
  const necessaryOnly = page.getByRole("button", { name: "Necessary only" })
  try {
    await necessaryOnly.click({ timeout: 8_000 })
    await page.waitForTimeout(300)
  } catch {
    // The sheet does not always appear in every run, especially once storage is already set.
  }
}

test.describe("hackathon analytics dashboard", () => {
  test("supports dummy preview and both chart renderers", async ({ page }, testInfo) => {
    await page.goto("/projects/hackathon-voting-analytics")
    await dismissConsentIfPresent(page)

    await expect(
      page.getByRole("heading", {
        name: "Hackathon reporting dashboard",
      }),
    ).toBeVisible()
    await expect(page.getByRole("link", { name: "BigQuery analysis", exact: true })).toHaveCount(0)
    await expect(page.getByRole("link", { name: "GA4 property", exact: true })).toHaveCount(0)
    await expect(page.getByText("Metric and field definitions")).toBeVisible()
    await expect(page.getByText("What this page includes")).toBeVisible()
    await expect(
      page
        .getByRole("heading", { name: "Daily volume" })
        .or(page.getByRole("heading", { name: "Warehouse status" })),
    ).toBeVisible()

    await page.getByText("What this page includes", { exact: true }).click()
    await expect(
      page.getByText(/No GA4-derived fallback metrics are rendered on this route anymore|Live mode is reading directly from the dedicated hackathon_reporting dataset/i).first(),
    ).toBeVisible()
    await page.getByText("What this page includes", { exact: true }).click()

    await page.getByText("Metric and field definitions", { exact: true }).click()
    await expect(page.locator("#schema-warehouse-rows summary").first()).toBeVisible()

    const sourceToggle = page.getByRole("button", { name: "Dummy preview" })
    await sourceToggle.click()

    await expect(page.getByText(/Dummy preview mode is turned on/i).first()).toBeVisible()
    await expect(page.getByRole("heading", { name: "Daily volume" })).toBeVisible()
    await expect(page.locator("canvas").first()).toBeVisible()

    await capture(
      testInfo.project.name === "desktop-light"
        ? page.getByRole("main").last()
        : page.locator("section").first(),
      `${testInfo.project.name}-top.png`,
    )
    if (testInfo.project.name === "desktop-light") {
      await capture(
        page.locator("#judge-access-and-vote-flow"),
        `${testInfo.project.name}-voting-funnel.png`,
      )
    }

    await page.getByRole("button", { name: "Observable Plot" }).click()
    await expect(page.locator("svg").first()).toBeVisible()

    await capture(
      testInfo.project.name === "desktop-light"
        ? page.locator("#entry-performance")
        : page.locator("#judge-access-and-vote-flow"),
      `${testInfo.project.name}-entry-analysis-observable.png`,
    )

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    )
    expect(overflow).toBeLessThanOrEqual(1)

    const liveButton = page.getByRole("button", { name: "Live reporting" })
    if (await liveButton.isEnabled()) {
      await liveButton.click()
      await expect(
        page.getByText(
          /Live mode is reading directly from the dedicated hackathon_reporting dataset|BigQuery modeled tables are still empty, so this route is currently showing warehouse status only|Live mode could not reach the reporting dataset from this runtime/i,
        ).first(),
      ).toBeVisible()
      await expect(
        page
          .getByRole("heading", { name: "Daily volume" })
          .or(page.getByRole("heading", { name: "Warehouse status" })),
      ).toBeVisible()
    } else {
      await expect(liveButton).toBeDisabled()
    }

    if (testInfo.project.name === "desktop-light") {
      await page.goto("/projects")
      await expect(
        page.getByRole("link", { name: "Open BigQuery dashboard" }),
      ).toBeVisible()
      await expect(
        page.getByRole("link", { name: "Open GA4 surface" }),
      ).toBeVisible()
    }
  })
})
