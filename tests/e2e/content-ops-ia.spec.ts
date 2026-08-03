import { expect, test, type Page, type TestInfo } from "@playwright/test"

async function dismissConsentIfPresent(page: Page) {
  try {
    await page.getByRole("button", { name: "Necessary only" }).click({ timeout: 2_000 })
  } catch {
    // Consent has already been set in this context.
  }
}

async function authorizeDashboard(page: Page, testInfo: TestInfo) {
  const baseURL = (testInfo.project.use.baseURL as string | undefined) || "http://127.0.0.1:3018"
  await page.context().addCookies([{ name: "content_ops_dev_email", value: "rajeev.sgill@gmail.com", url: baseURL }])
}

async function expectNoOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1)
}

test.describe("audience-ready public site", () => {
  test("keeps public navigation and content focused on visitors", async ({ page }, testInfo) => {
    await page.goto("/")
    await dismissConsentIfPresent(page)

    await expect(page.getByRole("heading", { name: /I build practical software around AI, data, analytics, and adtech/i })).toBeVisible()
    await expect(page.getByRole("link", { name: "View selected projects" })).toBeVisible()
    await expect(page.getByRole("link", { name: "Read my writing" })).toBeVisible()

    if (testInfo.project.name === "desktop-light") {
      const primary = page.getByRole("navigation", { name: "Primary navigation" })
      await expect(primary.getByRole("link")).toHaveText(["Home", "Projects", "Writing", "About"])
    } else {
      await page.getByRole("button", { name: "Open navigation" }).click()
      const mobile = page.getByRole("navigation", { name: "Mobile navigation" })
      await expect(mobile.getByRole("link")).toHaveText(["Home", "Projects", "Writing", "About"])
      await mobile.getByRole("link", { name: "Projects" }).click()
      await expect(page).toHaveURL(/\/projects$/)
    }

    await expect(page.getByRole("link", { name: /dashboard/i })).toHaveCount(0)
    const publicText = (await page.locator("body").innerText()).toLowerCase()
    for (const phrase of ["content graph", "concept nodes", "public ia", "queued next content", "workflow status"]) {
      expect(publicText).not.toContain(phrase)
    }
    await expectNoOverflow(page)

    await page.goto("/blog")
    await dismissConsentIfPresent(page)
    await expect(page.getByRole("heading", { name: "Useful notes on AI, analytics, and building software" })).toBeVisible()
    await expect(page.getByRole("textbox", { name: "Search writing" })).toBeVisible()
    await expectNoOverflow(page)

    await page.goto("/blog/how-we-built-the-hackathon-voting-app")
    await dismissConsentIfPresent(page)
    await expect(page.getByRole("heading", { name: "Related reading" })).toBeVisible()
    await expectNoOverflow(page)

    await authorizeDashboard(page, testInfo)
    await page.goto("/dashboard")
    await expect(page.getByRole("heading", { name: "Workbook-backed content OS" })).toBeVisible()
    if (testInfo.project.name === "desktop-light") {
      await expect(page.getByRole("link", { name: "View public site" })).toBeVisible()
    }
  })

  test("redirects retired public routes", async ({ page }) => {
    await page.goto("/proof")
    await expect(page).toHaveURL(/\/projects$/)

    await page.goto("/playbooks")
    await expect(page).toHaveURL(/\/blog$/)

    await page.goto("/glossary/agentic-engineering")
    await expect(page).toHaveURL(/\/blog\/from-ai-pilots-to-business-value$/)

    await page.goto("/projects/hackathon-voting-analytics")
    await expect(page).toHaveURL(/\/projects#hackathon-voting-app$/)
  })
})
