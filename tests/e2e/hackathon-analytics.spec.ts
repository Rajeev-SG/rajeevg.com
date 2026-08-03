import { expect, test } from "@playwright/test"

test("retired hackathon warehouse route redirects to the project", async ({ page }) => {
  const response = await page.goto("/projects/hackathon-voting-analytics")
  expect(response?.status()).toBeLessThan(400)
  await expect(page).toHaveURL(/\/projects#hackathon-voting-app$/)
  await expect(page.getByRole("heading", { name: "Software built for real work" })).toBeVisible()
  await expect(page.locator("#hackathon-voting-app")).toBeVisible()
})
