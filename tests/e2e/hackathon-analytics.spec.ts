import fs from "node:fs/promises"
import path from "node:path"

import { expect, test, type Locator, type Page } from "@playwright/test"

const artifactRoot = path.resolve(
  process.cwd(),
  "output/playwright/hackathon-dashboard-20260324",
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
    await expect(page.getByRole("link", { name: "BigQuery analysis", exact: true })).toHaveAttribute(
      "aria-current",
      "page",
    )
    await expect(page.getByRole("link", { name: "GA4 property", exact: true })).toBeVisible()

    const sourceToggle = page.getByRole("button", { name: "Dummy preview" })
    await sourceToggle.click()

    await expect(page.getByText(/Dummy preview mode is turned on/i)).toBeVisible()
    await expect(page.locator("canvas").first()).toBeVisible()

    await capture(
      testInfo.project.name === "desktop-light"
        ? page.getByRole("main").last()
        : page.locator("section").first(),
      `${testInfo.project.name}-top.png`,
    )
    if (testInfo.project.name === "desktop-light") {
      await capture(
        page.locator("#voting-funnel-and-judge-access"),
        `${testInfo.project.name}-voting-funnel.png`,
      )
    }

    await page.getByRole("button", { name: "Observable Plot" }).click()
    await expect(page.locator("svg").first()).toBeVisible()

    await capture(
      testInfo.project.name === "desktop-light"
        ? page.locator("#entry-analysis")
        : page.locator("#voting-funnel-and-judge-access"),
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
          /Live mode is reading directly from the dedicated hackathon_reporting dataset|The reporting tables are reachable, but they do not yet contain landed rows|Live mode could not reach the reporting dataset from this runtime/i,
        ),
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
