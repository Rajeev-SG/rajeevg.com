import fs from "node:fs/promises"
import path from "node:path"

import { expect, test } from "@playwright/test"

const artifactRoot = path.resolve(
  process.cwd(),
  process.env.OBSERVABLE_STACK_ARTIFACT_ROOT ||
    "output/playwright/observable-worker-stack-20260825",
)

const viewports = [
  { name: "mobile", width: 402, height: 874 },
  { name: "desktop", width: 1440, height: 1100 },
  { name: "wide", width: 1728, height: 1117 },
]

test("renders the proven identity join article and native draw.io architecture cleanly", async ({
  page,
}) => {
  await fs.mkdir(artifactRoot, { recursive: true })

  const consoleErrors: string[] = []
  const requestFailures: string[] = []
  const unexpectedRequestFailures: string[] = []
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text())
  })
  page.on("requestfailed", (request) => {
    const failure = `${request.method()} ${request.url()} ${request.failure()?.errorText || "failed"}`
    requestFailures.push(failure)
    if (request.failure()?.errorText !== "net::ERR_ABORTED") unexpectedRequestFailures.push(failure)
  })

  for (const viewport of viewports) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    await page.goto("/blog/how-i-split-sol-planning-from-opencode-go-execution", {
      waitUntil: "networkidle",
    })

    const necessaryOnly = page.getByRole("button", { name: "Necessary only" }).last()
    await necessaryOnly.click({ timeout: 2_000 }).catch(() => undefined)

    await expect(
      page.getByRole("heading", {
        name: "Can I Make Codex Last Longer Without Lowering the Quality?",
      }),
    ).toBeVisible()
    await expect(page.getByText(/The fresh-task seam is now proven/)).toBeVisible()
    await expect(page.getByText(/605,429 measured OpenCode Go tokens/)).toBeVisible()
    await expect(page.getByText(/five-hour Codex subscription limit is draining rapidly/)).toBeVisible()

    const diagramFrame = page.locator('iframe[title*="Interactive architecture diagram"]')
    await diagramFrame.scrollIntoViewIfNeeded()
    await expect(diagramFrame).toBeVisible()
    const frame = page.frameLocator('iframe[title*="Interactive architecture diagram"]')
    await expect(frame.locator("svg").first()).toBeVisible({ timeout: 15_000 })
    await expect(frame.getByText(/PROVEN fresh-task join/)).toBeVisible()
    await expect(frame.getByText(/605,429 tokens joined/)).toBeVisible()

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(overflow).toBeLessThanOrEqual(1)

    await page.screenshot({
      path: path.join(artifactRoot, `${viewport.name}-top.png`),
      fullPage: false,
    })
    await diagramFrame.screenshot({
      path: path.join(artifactRoot, `${viewport.name}-diagram.png`),
    })
  }

  expect(consoleErrors).toEqual([])
  expect(unexpectedRequestFailures).toEqual([])
  await fs.writeFile(
    path.join(artifactRoot, "browser-signals.json"),
    JSON.stringify({ consoleErrors, requestFailures, unexpectedRequestFailures, viewports }, null, 2) + "\n",
  )
})
