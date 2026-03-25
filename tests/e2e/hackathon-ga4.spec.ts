import fs from "node:fs/promises"
import path from "node:path"

import { expect, test, type Locator, type Page } from "@playwright/test"

const artifactRoot = path.resolve(
  process.cwd(),
  "output/playwright/hackathon-ga4-dashboard-20260324",
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
    // already handled or not present
  }
}

test.describe("hackathon ga4 reporting surface", () => {
  test("supports live and dummy GA reporting modes", async ({ page }, testInfo) => {
    await page.goto("/projects/hackathon-voting-analytics/google-analytics")
    await dismissConsentIfPresent(page)

    await expect(
      page.getByRole("heading", { name: "Hackathon reporting dashboard" }),
    ).toBeVisible()

    await expect(page.getByRole("link", { name: "BigQuery analysis", exact: true })).toBeVisible()
    await expect(page.getByRole("link", { name: "GA4 property", exact: true })).toHaveAttribute("aria-current", "page")
    await expect(page.getByText("Host vote.rajeevg.com")).toBeVisible()

    const liveNote = page.getByText(
      /Live mode is reading directly from the shared GA4 property|The GA4 property is reachable, but no hackathon-host rows were returned|Live GA mode could not complete the report request/i,
    ).first()
    await expect(liveNote).toBeVisible()

    await page.getByRole("button", { name: "Dummy preview" }).click()
    await expect(
      page.getByText(/Dummy preview is active, so this GA surface shows the intended reporting layout/i).first(),
    ).toBeVisible()

    await capture(
      testInfo.project.name === "desktop-light"
        ? page.getByRole("main").last()
        : page.locator("section").first(),
      `${testInfo.project.name}-top.png`,
    )

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    )
    expect(overflow).toBeLessThanOrEqual(1)

    if (testInfo.project.name === "desktop-light") {
      await page.goto("/projects")
      await expect(page.getByRole("link", { name: "Open GA4 surface" })).toBeVisible()
    }
  })
})
