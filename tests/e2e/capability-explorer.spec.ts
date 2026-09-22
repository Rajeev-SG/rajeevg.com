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

test("the three launch questions are answered honestly, from live records or not at all", async ({ page }) => {
  test.setTimeout(90_000)
  await fs.mkdir(artifactRoot, { recursive: true })
  await preparePage(page)

  // #163: every launch answer states its provenance on its OWN card — never a
  // page-wide label that could be satisfied by one card while another is wrong.
  // Assertions are scoped per card so a regression that flips one answer to a
  // wrong label, or drops its verdict/evidence, fails here.
  const cards = page.locator('section[aria-label="Reviewed launch answers"] article')
  const cardCount = await cards.count()
  expect(cardCount).toBeGreaterThanOrEqual(3)

  const LIVE_LABELS = [
    "From the live published corpus",
    "From the bundled reviewed seed (live feed unavailable)",
  ]

  for (let i = 0; i < cardCount; i++) {
    const card = cards.nth(i)
    const label = (await card.getByTestId("adpi-provenance").textContent())?.trim()
    expect(label, `card ${i} must state its provenance`).toBeTruthy()
    expect([
      ...LIVE_LABELS,
      "Reviewed reference — no live record yet",
      "No source asserted this",
    ]).toContain(label)

    if (label && LIVE_LABELS.includes(label)) {
      // An asserted answer must carry its own qualified, non-boolean fields.
      await expect(card.getByTestId("adpi-verdict")).toBeVisible()
      const verdict = (await card.getByTestId("adpi-verdict").textContent())?.trim()
      expect(["Supported", "Conditional", "Unknown"]).toContain(verdict)
      // `.first()`: a card's rationale line and its per-fact badge can both
      // contain "Evidence basis:", so match the first occurrence rather than
      // tripping Playwright's strict-mode check. The point is that the card
      // *renders* the evidence basis and a verification date, not that there is
      // exactly one occurrence.
      await expect(card.getByText(/Evidence basis:/).first()).toBeVisible()
      await expect(card.getByText(/Verified:/).first()).toBeVisible()
    } else {
      // No live record (yet): the card must show the explicit abstention, not a
      // synthetic assertion.
      await expect(card.getByTestId("adpi-abstention")).toBeVisible()
    }
  }

  // The deliberate abstention proof is always present and honest. Scope it to
  // the abstention section, since a launch answer may also abstain (#163).
  const abstention = page
    .getByRole("region", { name: "Abstention example" })
    .getByTestId("adpi-abstention")
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


test("expanding a row shows its detail panel without clipping", async ({ page }) => {
  test.setTimeout(90_000)
  await preparePage(page)
  await page.getByRole("tab", { name: "Explorer" }).click()

  const firstExpand = page.getByRole("button", { name: "Expand row" }).first()
  await firstExpand.click()

  // The detail panel must be fully visible: its bottom edge inside the scroll
  // container, not clipped/overlapped by the next row.
  const detail = page.getByText("Capability detail").first()
  await expect(detail).toBeVisible()
  // The whole detail panel (not just its label) must fit inside the scroll
  // container: assert its parent panel's bottom edge, and that the next row
  // starts below the panel rather than overlapping it.
  const panel = detail.locator("xpath=ancestor::div[contains(@class,'border-t')][1]")
  const panelBox = await panel.boundingBox()
  const scroll = await page.getByTestId("adpi-table-scroll").boundingBox()
  expect(panelBox).not.toBeNull()
  expect(scroll).not.toBeNull()
  expect(panelBox!.y).toBeGreaterThanOrEqual(scroll!.y - 1)
  expect(panelBox!.y + panelBox!.height).toBeLessThanOrEqual(scroll!.y + scroll!.height + 1)

  // The next rendered row must start at or below the panel's bottom edge.
  const rows = page.locator("[data-index]")
  const nextRow = rows.nth(1)
  const nextBox = await nextRow.boundingBox()
  expect(nextBox).not.toBeNull()
  expect(nextBox!.y).toBeGreaterThanOrEqual(panelBox!.y + panelBox!.height - 1)
})

test("the compare tool can select from the full corpus", async ({ page }) => {
  test.setTimeout(90_000)
  await preparePage(page)
  const optionCount = await page.locator("#adpi-left option").count()
  // 1 placeholder + every published capability; not an arbitrary slice.
  expect(optionCount).toBeGreaterThan(800)
})

test("the explorer keeps the summary to four columns and hides the rest in detail", async ({
  page,
}) => {
  test.setTimeout(90_000)
  await preparePage(page)
  await page.getByRole("tab", { name: "Explorer" }).click()

  // Exactly the four summary headers render (Capability / Surface / Control /
  // Availability), not nine cramped columns (#173).
  const header = page.locator('[data-testid="adpi-table-scroll"]').locator("xpath=preceding-sibling::div[1]")
  await expect(header.getByText("Capability", { exact: true })).toBeVisible()
  await expect(header.getByText("Surface", { exact: true })).toBeVisible()
  await expect(header.getByText("Control", { exact: true })).toBeVisible()
  await expect(header.getByText("Availability", { exact: true })).toBeVisible()
  // The moved columns are NOT in the summary header row.
  await expect(header.getByText("Maturity", { exact: true })).toHaveCount(0)

  // They appear in the expanded detail, with the name wrapped (not truncated).
  const firstName = page.locator('[data-testid="adpi-table-scroll"] [data-index] .break-words .font-medium').first()
  const nameStyle = await firstName.evaluate((el) => getComputedStyle(el).whiteSpace)
  expect(nameStyle).toBe("normal")

  await page.getByRole("button", { name: "Expand row" }).first().click()
  const detail = page.getByText("Capability detail").first()
  await expect(detail).toBeVisible()
  const panel = detail.locator("xpath=ancestor::div[contains(@class,'border-t')][1]")
  for (const term of ["Type", "Basis", "Maturity", "UI / API / Bulk"]) {
    await expect(panel.getByText(term, { exact: true })).toBeVisible()
  }
})

test("filtering narrows the corpus and the sort control reorders rows", async ({ page }) => {
  test.setTimeout(90_000)
  await preparePage(page)
  await page.getByRole("tab", { name: "Explorer" }).click()

  const count = page.getByTestId("adpi-row-count")
  await page.getByTestId("adpi-search").fill("attribution model")
  const filtered = (await count.textContent()) || ""
  const [, shown, total] = filtered.match(/(\d+) of (\d+) capabilities/) as RegExpMatchArray
  expect(Number(shown)).toBeLessThan(Number(total))
  expect(Number(shown)).toBeGreaterThan(0)

  // The sort control offers both directions and actually reorders.
  const sort = page.getByTestId("adpi-sort")
  await expect(sort).toBeVisible()
  await page.getByTestId("adpi-search").fill("attribution")
  const firstAsc = await page
    .locator('[data-testid="adpi-table-scroll"] [data-index] .break-words .font-medium')
    .first()
    .textContent()
  await sort.selectOption("name:desc")
  await expect(sort).toHaveValue("name:desc")
  const firstDesc = await page
    .locator('[data-testid="adpi-table-scroll"] [data-index] .break-words .font-medium')
    .first()
    .textContent()
  expect(firstDesc).not.toBe(firstAsc)
})

test("the explorer has no horizontal page overflow at 390px", async ({ page }) => {
  test.setTimeout(90_000)
  await page.setViewportSize({ width: 390, height: 844 })
  await preparePage(page)
  await page.getByRole("tab", { name: "Explorer" }).click()
  await expect(page.getByTestId("adpi-table-scroll")).toBeVisible()

  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }))
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1)

  // The mobile sort control is present (the header row is hidden below sm).
  await expect(page.getByTestId("adpi-sort")).toBeVisible()
})
