import { expect, test, type Browser } from "@playwright/test"

const viewports = [
  { width: 1575, height: 1000 },
  { width: 820, height: 1180 },
  { width: 430, height: 932 },
  { width: 390, height: 844 },
]

test("public projects and event report hold up across screen sizes", async ({ browser }: { browser: Browser }) => {
  test.skip(test.info().project.name !== "desktop-light", "This test manages its own viewports.")

  for (const viewport of viewports) {
    const context = await browser.newContext({ viewport })
    const page = await context.newPage()
    const errors: string[] = []
    page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()) })
    page.on("pageerror", (error) => errors.push(error.message))

    await page.goto("/projects")
    try { await page.getByRole("button", { name: "Necessary only" }).click({ timeout: 1_000 }) } catch {}
    await expect(page.getByRole("heading", { name: "Software built for real work" })).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1)

    await page.goto("/projects/hackathon-voting-analytics/google-analytics")
    await expect(page.getByRole("heading", { name: "Hackathon event-day analytics" })).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1)
    expect(errors).toEqual([])
    await context.close()
  }
})
