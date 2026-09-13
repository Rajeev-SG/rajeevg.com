import fs from "node:fs/promises"
import path from "node:path"

import { expect, test, type Page } from "@playwright/test"

const artifactRoot = path.resolve(process.env.AGENT_BENCHMARK_ARTIFACT_ROOT || "/tmp/agent-benchmark-matrix-qa")
const consoleErrors: string[] = []

async function preparePage(page: Page, url = "/solutions/agent-benchmark-matrix") {
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
  await expect(page.getByRole("heading", { name: "Agent Benchmark Matrix", level: 1 })).toBeVisible()
}

const matrix = (page: Page) => page.getByRole("region", { name: "Agent benchmark coverage matrix" })

test("defaults to the dense Compare view with a data-driven benchmark set", async ({ page }, testInfo) => {
  test.setTimeout(90_000)
  await fs.mkdir(artifactRoot, { recursive: true })
  await preparePage(page)

  // Default page is Compare, not the sparse coverage map.
  await expect(page.getByRole("button", { name: "Compare", exact: true })).toHaveAttribute("aria-pressed", "true")
  await expect(page.getByRole("heading", { name: "Comparable evidence" })).toBeVisible()
  await expect(page.getByRole("heading", { name: "Coverage map" })).toHaveCount(0)

  // Default cohort is My models.
  await expect(page.getByRole("button", { name: "My models" })).toHaveAttribute("aria-pressed", "true")

  // 8 tracked models × 7 benchmarks, ~68% dense.
  const density = page.getByText(/models × \d+ benchmarks · \d+\/\d+ cells populated/)
  await expect(density).toBeVisible()
  const densityText = (await density.textContent()) || ""
  const [, models, benchmarks, filled, total, pct] = densityText.match(
    /(\d+) models × (\d+) benchmarks · (\d+)\/(\d+) cells populated \((\d+)%\)/
  ) as RegExpMatchArray
  expect(Number(models)).toBe(8)
  expect(Number(benchmarks)).toBe(7)
  expect(Number(filled) / Number(total)).toBeGreaterThanOrEqual(0.6)
  expect(Number(pct)).toBeGreaterThanOrEqual(60)

  // OSWorld 2.0 stays in the default comparison.
  await expect(matrix(page).getByRole("button", { name: /OSWorld 2\.0/ }).first()).toBeVisible()

  // Few dashes: the default comparison is deliberately dense.
  const filledCells = matrix(page).locator("tbody td button").filter({ hasText: /^\d/ })
  const dashCells = matrix(page).locator("tbody td button").filter({ hasText: /^—$/ })
  expect(await filledCells.count()).toBe(Number(filled))
  expect(await dashCells.count()).toBeLessThan(Number(filled))

  // Benchmarks with no current-model evidence are called out, not shown as empty columns.
  const awaiting = page.getByRole("region", { name: "Tracked, awaiting current results" })
  await expect(awaiting).toBeVisible()
  await expect(awaiting.getByRole("button", { name: /WorkArena\+\+/ })).toBeVisible()
  await expect(awaiting.getByRole("button", { name: /AppWorld/ })).toBeVisible()

  expect(consoleErrors).toEqual([])
  await page.screenshot({ path: path.join(artifactRoot, `${testInfo.project.name}-compare.png`), fullPage: false })
})

test("selecting a benchmark heading drives the benchmark-specific leaderboard", async ({ page }) => {
  await preparePage(page)

  const leaderboard = page.getByRole("region", { name: "Benchmark leaderboard" })
  await expect(leaderboard).toBeVisible()

  // Pick a different benchmark column and confirm the leaderboard follows.
  const osworld = matrix(page).getByRole("button", { name: /OSWorld 2\.0/ }).first()
  await osworld.click()
  await expect(page.locator('select[aria-label="Benchmark"]')).toHaveValue("osworld-2.0")
  // Ranked entries render as a table on wide screens and as cards on narrow ones,
  // so assert the entry exists in whichever layout is active.
  expect(await leaderboard.locator("tbody tr:visible, ul > li:visible").count()).toBeGreaterThan(1)

  // The leaderboard ranks only directly comparable runs, in labelled groups.
  await expect(leaderboard.getByText(/Ranked leaderboard/)).toBeVisible()

  // An audited benchmark surfaces its caveat in the leaderboard context.
  await expect(leaderboard.getByText(/independent audit of v2026\.08\.08/i)).toBeVisible()

  // Provenance and an exact source link are always inspectable.
  await expect(leaderboard.getByRole("link", { name: "Source" }).first()).toBeVisible()
})

test("Coverage view exposes the full sparse evidence map", async ({ page }, testInfo) => {
  await preparePage(page)
  await page.getByRole("button", { name: "Coverage", exact: true }).click()

  await expect(page.getByRole("heading", { name: "Coverage map" })).toBeVisible()
  // The full registry: far more models than the dense comparison shows.
  expect(await matrix(page).locator("tbody th").count()).toBeGreaterThan(8)
  // Sparsity is the information here.
  const dashes = matrix(page).locator("tbody td button").filter({ hasText: /^—$/ })
  expect(await dashes.count()).toBeGreaterThan(100)
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1)

  await page.screenshot({ path: path.join(artifactRoot, `${testInfo.project.name}-coverage.png`), fullPage: false })
})

test("advanced controls still expose Model/System and comparability", async ({ page }) => {
  await preparePage(page)
  await page.locator("details", { hasText: "Advanced controls" }).locator("summary").click()

  await page.getByRole("button", { name: "System", exact: true }).click()
  // System rows are labelled "model + harness", so the harness stays visible.
  await expect(matrix(page).locator("tbody th span").filter({ hasText: /^\+ / }).first()).toBeVisible()
  await page.getByRole("button", { name: "Model", exact: true }).click()

  await page.getByRole("button", { name: "Strict comparable" }).click()
  await expect(matrix(page)).toBeVisible()
})

test("solutions index links to the matrix", async ({ page }) => {
  await page.goto("/solutions")
  try {
    await page.getByRole("button", { name: "Necessary only" }).click({ timeout: 2_000 })
  } catch {
    // Consent already set.
  }
  const card = page.locator("[data-analytics-item-id='agent-benchmark-matrix']").first()
  await expect(card).toBeVisible()
  await expect(card.getByRole("link", { name: /Open the matrix/ })).toHaveAttribute("href", "/solutions/agent-benchmark-matrix")
})

test("small screens use readable cards instead of sideways-scrolling tables", async ({ page }, testInfo) => {
  test.setTimeout(90_000)
  await fs.mkdir(artifactRoot, { recursive: true })
  // Narrow viewport regardless of the project, so this asserts the mobile layout.
  await page.setViewportSize({ width: 390, height: 844 })
  await preparePage(page)

  const visible = (selector: string) => page.evaluate(
    (sel) => [...document.querySelectorAll(sel)].filter((el) => (el as HTMLElement).offsetParent !== null).length,
    selector
  )

  // The page itself never scrolls sideways.
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1)

  // The dense comparison and the leaderboard render as card lists, not tables.
  await expect(page.getByRole("region", { name: "Benchmark leaderboard" }).locator("ul li").first()).toBeVisible()
  expect(await visible("section[aria-label='Benchmark leaderboard'] table")).toBe(0)

  // The coverage summary is cards too, so no figure is cut off.
  await expect(page.getByText(/benchmark-official · \d+ vendor-reported/).first()).toBeVisible()
  expect(await visible("section[aria-label='Coverage summary'] table")).toBe(0)

  // The long explanation is a disclosure, keeping the header short.
  const built = page.locator("details", { hasText: "How this page is built" })
  await expect(built).toBeVisible()
  expect(await built.evaluate((el) => (el as HTMLDetailsElement).open)).toBe(false)
  await built.locator("summary").click()
  expect(await built.evaluate((el) => (el as HTMLDetailsElement).open)).toBe(true)

  // Coverage keeps the full evidence map, and it scrolls inside its own container.
  await page.getByRole("button", { name: "Coverage", exact: true }).click()
  const matrix = page.getByRole("region", { name: "Agent benchmark coverage matrix" })
  await matrix.scrollIntoViewIfNeeded()
  expect(await matrix.evaluate((el) => { el.scrollLeft = 300; return el.scrollLeft; })).toBeGreaterThan(0)
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1)

  await page.screenshot({ path: path.join(artifactRoot, `${testInfo.project.name}-narrow.png`), fullPage: false })

  // The sticky header cell must be opaque: no scrolled content bleeding through.
  const headerBg = await matrix.locator("thead th").first().evaluate((el) => getComputedStyle(el).backgroundColor)
  expect(headerBg).not.toMatch(/rgba\(.*,\s*0(\.\d+)?\)$/)

  expect(consoleErrors).toEqual([])
})
