import fs from "node:fs/promises"
import path from "node:path"

import { expect, test, type Page } from "@playwright/test"

const artifactRoot = path.resolve(
  process.cwd(),
  process.env.ADPI_ARTIFACT_ROOT || "output/acceptance/capability-explorer-latest",
)

const consoleErrors: string[] = []

async function preparePage(page: Page, url = "/solutions/capability-explorer") {
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(`${page.url()}: ${message.text()}`)
  })
  page.on("pageerror", (error) => consoleErrors.push(`${page.url()}: ${error.message}`))
  await page.goto(url)
  try {
    await page.getByRole("button", { name: "Necessary only" }).click({ timeout: 2_000 })
  } catch {
    // Consent was already set for this context.
  }
  await expect(
    page.getByRole("heading", { name: "Ad Platform Capability Explorer", level: 1 }),
  ).toBeVisible()
}

test("the three launch questions return qualified answers, not booleans", async ({ page }) => {
  test.setTimeout(90_000)
  await fs.mkdir(artifactRoot, { recursive: true })
  await preparePage(page)

  const verdicts = await page.getByTestId("adpi-verdict").allTextContents()
  expect(verdicts.length).toBeGreaterThanOrEqual(3)
  for (const verdict of verdicts) {
    expect(["Supported", "Conditional", "Unknown"]).toContain(verdict)
  }

  await expect(page.getByText("Optimisation signal (guides it)").first()).toBeVisible()
  await expect(page.getByText("Automatic (platform decides)").first()).toBeVisible()
  await expect(page.getByText("Hard control (you set it)").first()).toBeVisible()

  await expect(page.getByText("Evidence basis: Documented").first()).toBeVisible()
  await expect(page.getByText(/Verified: 2026-09-19/).first()).toBeVisible()

  const abstention = page.getByTestId("adpi-abstention").first()
  await expect(abstention).toBeVisible()
  await expect(abstention).toContainText("No published capability matched")

  await page.screenshot({ path: path.join(artifactRoot, "planner.png"), fullPage: true })
  expect(consoleErrors).toEqual([])
})

test("the master explorer browses the full published corpus with search", async ({ page }) => {
  test.setTimeout(90_000)
  await preparePage(page)
  await page.getByRole("tab", { name: "Explorer" }).click()

  const count = page.getByTestId("adpi-row-count")
  await expect(count).toBeVisible()
  const total = (await count.textContent()) || ""
  const [, totalCount] = total.match(/(\d+) of (\d+) capabilities/) as RegExpMatchArray
  expect(Number(totalCount)).toBeGreaterThan(100)

  await page.getByTestId("adpi-search").fill("audience signal")
  await expect(count).not.toHaveText(total)
})

test("cross-platform comparison warns that concepts are not equivalent", async ({ page }) => {
  test.setTimeout(90_000)
  await preparePage(page)

  const all = await page.locator("#adpi-left option").allTextContents()
  const tiktok = all.find((option) => option.includes("TikTok"))
  const google = all.find((option) => option.includes("Google Ads"))
  expect(tiktok && google).toBeTruthy()

  await page.locator("#adpi-left").selectOption({ label: google })
  await page.locator("#adpi-right").selectOption({ label: tiktok })
  await expect(page.getByTestId("adpi-comparison-caveat").first()).toBeVisible()
})
