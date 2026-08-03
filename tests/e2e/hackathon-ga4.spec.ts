import { expect, test, type Page } from "@playwright/test"

async function dismissConsentIfPresent(page: Page) {
  try {
    await page.getByRole("button", { name: "Necessary only" }).click({ timeout: 2_000 })
  } catch {}
}

test("shows the fixed hackathon event-day report", async ({ page }) => {
  await page.goto("/projects/hackathon-voting-analytics/google-analytics")
  await dismissConsentIfPresent(page)

  await expect(page.getByRole("heading", { name: "Hackathon event-day analytics" })).toBeVisible()
  await expect(page.getByText("25 March 2026")).toBeVisible()
  await expect(page.getByRole("heading", { name: "297", exact: true })).toBeVisible()
  await expect(page.getByRole("heading", { name: "172", exact: true })).toBeVisible()
  await expect(page.getByRole("heading", { name: "58%", exact: true })).toBeVisible()
  await expect(page.getByRole("heading", { name: "Entry comparison" })).toBeVisible()
  await expect(page.getByRole("columnheader", { name: "Official votes" })).toBeVisible()
  await expect(page.getByText("Dummy preview")).toHaveCount(0)
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1)
})
