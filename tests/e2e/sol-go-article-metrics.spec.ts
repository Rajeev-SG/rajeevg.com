import fs from "node:fs/promises"
import path from "node:path"

import { expect, test } from "@playwright/test"

const artifactRoot = path.resolve(
  process.cwd(),
  process.env.SOL_GO_ARTICLE_ARTIFACT_ROOT ||
    "output/acceptance/sol-go-article-directional-metrics-20260824",
)

test("explains the Codex and OpenCode split clearly without browser errors or overflow", async ({
  page,
}, testInfo) => {
  await fs.mkdir(artifactRoot, { recursive: true })

  const consoleErrors: string[] = []
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text())
  })

  await page.goto("/blog/how-i-split-sol-planning-from-opencode-go-execution", {
    waitUntil: "domcontentloaded",
  })

  const necessaryOnly = page.getByRole("button", { name: "Necessary only" }).last()
  await necessaryOnly.click({ timeout: 4_000 }).catch(() => undefined)

  await expect(
    page.getByRole("heading", {
      name: "Can I Make Codex Last Longer Without Lowering the Quality?",
    }),
  ).toBeVisible()

  const verdictHeading = page.getByRole("heading", {
    name: "The short verdict",
  })
  await verdictHeading.scrollIntoViewIfNeeded()
  await expect(verdictHeading).toBeVisible()
  await expect(page.getByText(/Promising, but only partly proven/)).toBeVisible()
  await expect(page.getByText("0 Codex subscription tokens", { exact: true })).toBeVisible()
  await expect(page.getByText(/3.13x more tokens/)).toBeVisible()
  await expect(page.getByText(/620 tool calls/)).toBeVisible()
  await expect(page.getByRole("heading", { name: "The manager and the workshop" })).toBeVisible()
  await expect(page.getByRole("heading", { name: "What needs to happen next" })).toBeVisible()

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  expect(overflow).toBeLessThanOrEqual(1)
  expect(consoleErrors).toEqual([])

  await page.screenshot({
    path: path.join(artifactRoot, `plain-language-article-${testInfo.project.name}.png`),
    fullPage: false,
  })
})
