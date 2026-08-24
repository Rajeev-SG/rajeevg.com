import fs from "node:fs/promises"
import path from "node:path"

import { expect, test } from "@playwright/test"

const artifactRoot = path.resolve(
  process.cwd(),
  process.env.SOL_GO_ARTICLE_ARTIFACT_ROOT ||
    "output/acceptance/sol-go-article-directional-metrics-20260824",
)

test("renders the new directional metrics without browser errors or overflow", async ({ page }, testInfo) => {
  await fs.mkdir(artifactRoot, { recursive: true })

  const consoleErrors: string[] = []
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text())
  })

  await page.goto("/blog/how-i-split-sol-planning-from-opencode-go-execution", {
    waitUntil: "domcontentloaded",
  })

  const consentButton = page.getByRole("button", { name: /Allow analytics|Necessary only/ }).first()
  if (await consentButton.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await consentButton.click()
  }

  const metricsHeading = page.getByRole("heading", {
    name: "A first directional reading from the build itself",
  })
  await metricsHeading.scrollIntoViewIfNeeded()
  await expect(metricsHeading).toBeVisible()
  await expect(page.getByText(/5,166,631 Go tokens/)).toBeVisible()
  await expect(page.getByText(/3.13 times as many provider tokens/)).toBeVisible()
  await expect(page.getByText(/620 parent tool calls/)).toBeVisible()

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  expect(overflow).toBeLessThanOrEqual(1)
  expect(consoleErrors).toEqual([])

  await page.screenshot({
    path: path.join(artifactRoot, `directional-metrics-${testInfo.project.name}.png`),
    fullPage: false,
  })
})
