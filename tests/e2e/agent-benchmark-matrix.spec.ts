import fs from "node:fs/promises"
import path from "node:path"

import { expect, test, type Page } from "@playwright/test"

const artifactRoot = path.resolve(process.env.AGENT_BENCHMARK_ARTIFACT_ROOT || "/tmp/agent-benchmark-matrix-qa")
const consoleErrors: string[] = []

async function preparePage(page: Page) {
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(`${page.url()}: ${message.text()}`)
  })
  page.on("pageerror", (error) => consoleErrors.push(`${page.url()}: ${error.message}`))
  await page.goto("/solutions/agent-benchmark-matrix")
  try {
    await page.getByRole("button", { name: "Necessary only" }).click({ timeout: 2_000 })
  } catch {
    // Consent was already set for this context.
  }
  await expect(page.getByRole("heading", { name: "Agent Benchmark Matrix", level: 1 })).toBeVisible()
}

test("agent benchmark matrix renders, filters and exposes provenance", async ({ page }, testInfo) => {
  test.setTimeout(90_000)
  await fs.mkdir(artifactRoot, { recursive: true })
  await preparePage(page)

  const matrix = page.getByRole("region", { name: "Agent benchmark coverage matrix" })
  await expect(matrix).toBeVisible()

  // Real scores with a provenance badge are present.
  const scoreCells = matrix.locator("tbody button").filter({ hasText: /^#?\d/ })
  expect(await scoreCells.count()).toBeGreaterThan(5)

  // Missing data is shown as an explicit dash, not a zero or a blank.
  await expect(matrix.getByText("—", { exact: true }).first()).toBeVisible()

  // Clicking a score cell opens the detail panel with an exact source URL and provenance.
  await scoreCells.first().click()
  const detail = page.getByRole("region", { name: "Detail" })
  await expect(detail).toBeVisible()
  await expect(detail.getByRole("link", { name: /https:\/\// }).first()).toBeVisible()
  await expect(detail.getByText(/Provenance classes/)).toBeVisible()
  await detail.getByRole("button", { name: "Close detail panel" }).click()

  // System view separates model + harness.
  await page.getByRole("button", { name: "System", exact: true }).click()
  await expect(matrix.locator("th button").filter({ hasText: /^\+/ }).first()).toBeVisible()

  // Strict comparable mode must not crash and must still render a matrix.
  await page.getByRole("button", { name: "Model", exact: true }).click()
  await page.getByRole("button", { name: "Strict comparable" }).click()
  await expect(matrix).toBeVisible()

  // Coverage + audit caveat sections are present.
  await expect(page.getByRole("heading", { name: "Coverage" })).toBeVisible()
  await expect(page.getByText(/Known audit caveats/)).toBeVisible()
  await expect(page.getByText(/independent audit of v2026.08.08/i)).toBeVisible()

  // The page itself never overflows horizontally (the matrix scrolls inside its own container).
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1)

  await page.screenshot({ path: path.join(artifactRoot, `${testInfo.project.name}-top.png`), fullPage: false })
  await page.locator("section[aria-label='Coverage']").scrollIntoViewIfNeeded()
  await page.screenshot({ path: path.join(artifactRoot, `${testInfo.project.name}-coverage.png`), fullPage: false })

  expect(consoleErrors).toEqual([])
})

test("solutions index links to the matrix", async ({ page }) => {
  await page.goto("/solutions")
  try {
    await page.getByRole("button", { name: "Necessary only" }).click({ timeout: 2_000 })
  } catch {
    // Consent already set.
  }
  const card = page.locator("[data-analytics-item-id='agent-benchmark-matrix']")
  await expect(card).toBeVisible()
  await expect(card.getByRole("link", { name: /Open the matrix/ })).toHaveAttribute("href", "/solutions/agent-benchmark-matrix")
})
