import { expect, test } from "@playwright/test"

test("hackathon report is pinned to the event date and official totals", async ({ page }) => {
  await page.goto("/projects/hackathon-voting-analytics/google-analytics")
  await expect(page.getByText("25 March 2026")).toBeVisible()
  await expect(page.getByText(/complete vote records from the application/i)).toBeVisible()
  await expect(page.getByText(/application recorded all 297 official votes/i)).toBeVisible()
  await expect(page.getByText(/overall tracked total of 172/i)).toBeVisible()
  await expect(page.getByText(/current|today/i)).toHaveCount(0)
})
