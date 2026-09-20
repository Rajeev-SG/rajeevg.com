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

  // #163: every launch answer states its provenance. It is either built from the
  // live published corpus, or an explicit unresolved state — never reviewed /
  // synthetic provenance presented as live output.
  const provenance = page.getByTestId("adpi-provenance")
  await expect(provenance.first()).toBeVisible()
  const labels = await provenance.allTextContents()
  expect(labels.length).toBeGreaterThanOrEqual(3)
  for (const label of labels) {
    expect([
      "From the live published corpus",
      "Reviewed reference — no live record yet",
      "No source asserted this",
    ]).toContain(label)
  }

  // Any answer asserted as live must carry qualified, non-boolean fields; any
  // answer without a live record must show the explicit abstention card instead.
  for (const label of labels) {
    if (label === "From the live published corpus") {
      const verdicts = await page.getByTestId("adpi-verdict").allTextContents()
      for (const verdict of verdicts) {
        expect(["Supported", "Conditional", "Unknown"]).toContain(verdict)
      }
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
