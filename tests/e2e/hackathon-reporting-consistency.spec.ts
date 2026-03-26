import fs from "node:fs/promises"
import path from "node:path"

import { expect, test, type Page } from "@playwright/test"

const artifactRoot = path.resolve(
  process.cwd(),
  "output/playwright/hackathon-reporting-consistency-20260325",
)

async function dismissConsentIfPresent(page: Page) {
  const necessaryOnly = page.getByRole("button", { name: "Necessary only" })
  try {
    await necessaryOnly.click({ timeout: 8_000 })
    await page.waitForTimeout(300)
  } catch {
    // already handled or not present
  }
}

async function capture(page: Page, filename: string) {
  await fs.mkdir(artifactRoot, { recursive: true })
  await page.screenshot({ fullPage: false, path: path.join(artifactRoot, filename) })
}

async function getShellMetrics(page: Page) {
  const shell = page.locator('[data-analytics-reporting-shell="hero"]').first()
  const heading = page.getByRole("heading", { name: "Hackathon reporting dashboard" })
  const sourceToggle = page.getByRole("button", { name: "Live reporting" }).first()

  return {
    shell: await shell.boundingBox(),
    heading: await heading.boundingBox(),
    sourceToggle: await sourceToggle.boundingBox(),
  }
}

test.describe("hackathon reporting shell consistency", () => {
  test("keeps the shared shell stable when switching between BigQuery and GA4 routes", async ({
    page,
  }, testInfo) => {
    await page.goto("/projects/hackathon-voting-analytics")
    await dismissConsentIfPresent(page)

    await expect(
      page.getByRole("heading", { name: "Hackathon reporting dashboard" }),
    ).toBeVisible()

    const bigQueryMetrics = await getShellMetrics(page)
    await capture(page, `${testInfo.project.name}-bigquery-shell.png`)

    await page.goto("/projects/hackathon-voting-analytics/google-analytics")
    await expect(page).toHaveURL(/\/projects\/hackathon-voting-analytics\/google-analytics$/)
    await expect(
      page.getByRole("heading", { name: "Hackathon reporting dashboard" }),
    ).toBeVisible()

    const gaMetrics = await getShellMetrics(page)
    await capture(page, `${testInfo.project.name}-ga4-shell.png`)

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    )
    expect(overflow).toBeLessThanOrEqual(1)

    expect(bigQueryMetrics.shell?.height).toBeTruthy()
    expect(gaMetrics.shell?.height).toBeTruthy()
    expect(Math.abs((bigQueryMetrics.shell?.height ?? 0) - (gaMetrics.shell?.height ?? 0))).toBeLessThanOrEqual(64)
    expect(Math.abs((bigQueryMetrics.heading?.y ?? 0) - (gaMetrics.heading?.y ?? 0))).toBeLessThanOrEqual(8)
    expect(Math.abs((bigQueryMetrics.sourceToggle?.y ?? 0) - (gaMetrics.sourceToggle?.y ?? 0))).toBeLessThanOrEqual(8)
  })
})
