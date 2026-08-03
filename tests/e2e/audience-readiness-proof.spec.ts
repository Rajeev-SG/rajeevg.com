import fs from "node:fs/promises"
import path from "node:path"

import { expect, test, type BrowserContext, type Page } from "@playwright/test"

const artifactRoot = path.resolve(
  process.cwd(),
  process.env.AUDIENCE_READINESS_ARTIFACT_ROOT || "output/acceptance/audience-readiness-latest",
)

const consoleErrors: { viewport: string; url: string; message: string }[] = []

async function preparePage(context: BrowserContext, viewport: string) {
  const page = await context.newPage()
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push({ viewport, url: page.url(), message: message.text() })
  })
  page.on("pageerror", (error) => consoleErrors.push({ viewport, url: page.url(), message: error.message }))
  return page
}

async function dismissConsent(page: Page) {
  try {
    await page.getByRole("button", { name: "Necessary only" }).click({ timeout: 2_000 })
  } catch {
    // Consent already set for this context.
  }
}

async function assertPageReady(page: Page) {
  await expect(page.locator("main")).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1)
  const images = page.locator("img")
  for (let index = 0; index < await images.count(); index += 1) {
    await images.nth(index).scrollIntoViewIfNeeded()
  }
  await page.waitForTimeout(150)
  const brokenImages = await page.evaluate(() =>
    Array.from(document.images)
      .filter((image) => !image.complete || image.naturalWidth === 0)
      .map((image) => image.currentSrc || image.src),
  )
  expect(brokenImages).toEqual([])
  await page.evaluate(() => scrollTo(0, 0))
}

test("captures audience-readiness acceptance proof", async ({ browser }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-light", "This proof manages its own viewport matrix.")
  test.setTimeout(120_000)
  await fs.mkdir(artifactRoot, { recursive: true })

  const desktop = await browser.newContext({ viewport: { width: 1440, height: 1000 }, colorScheme: "light" })
  const desktopPage = await preparePage(desktop, "desktop-1440")
  await desktopPage.goto("/")
  await dismissConsent(desktopPage)
  await assertPageReady(desktopPage)
  await desktopPage.screenshot({ path: path.join(artifactRoot, "desktop-1440-home-top.png"), fullPage: false })
  await desktopPage.screenshot({ path: path.join(artifactRoot, "desktop-1440-home-full.png"), fullPage: true })

  await desktopPage.goto("/projects")
  await assertPageReady(desktopPage)
  await desktopPage.evaluate(() => scrollTo(0, 0))
  await desktopPage.screenshot({ path: path.join(artifactRoot, "desktop-project-list.png"), fullPage: true })

  await desktopPage.goto("/blog")
  await assertPageReady(desktopPage)
  await desktopPage.evaluate(() => scrollTo(0, 0))
  await desktopPage.screenshot({ path: path.join(artifactRoot, "desktop-writing-list.png"), fullPage: true })

  await desktopPage.goto("/blog/how-we-built-the-hackathon-voting-app")
  await desktopPage.locator("#related-reading").scrollIntoViewIfNeeded()
  await assertPageReady(desktopPage)
  await desktopPage.locator("section[aria-labelledby='related-reading']").screenshot({ path: path.join(artifactRoot, "desktop-related-reading.png") })

  await desktopPage.goto("/projects/hackathon-voting-analytics/google-analytics")
  await assertPageReady(desktopPage)
  await expect(desktopPage.getByText("25 March 2026")).toBeVisible()
  await desktopPage.screenshot({ path: path.join(artifactRoot, "desktop-hackathon-event-report.png"), fullPage: true })
  await desktop.close()

  const wide = await browser.newContext({ viewport: { width: 1575, height: 1000 }, colorScheme: "light" })
  const widePage = await preparePage(wide, "wide-1575")
  await widePage.goto("/")
  await dismissConsent(widePage)
  await assertPageReady(widePage)
  await widePage.screenshot({ path: path.join(artifactRoot, "wide-1575-home.png"), fullPage: false })
  await wide.close()

  const tablet = await browser.newContext({ viewport: { width: 820, height: 1180 }, colorScheme: "light" })
  const tabletPage = await preparePage(tablet, "tablet-820")
  await tabletPage.goto("/projects")
  await dismissConsent(tabletPage)
  await assertPageReady(tabletPage)
  await tabletPage.screenshot({ path: path.join(artifactRoot, "tablet-820-projects.png"), fullPage: true })
  await tablet.close()

  const mobile390 = await browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme: "dark", isMobile: true })
  const mobile390Page = await preparePage(mobile390, "mobile-390")
  await mobile390Page.goto("/")
  await dismissConsent(mobile390Page)
  await assertPageReady(mobile390Page)
  await mobile390Page.screenshot({ path: path.join(artifactRoot, "mobile-390-home.png"), fullPage: true })
  await mobile390.close()

  const mobile430 = await browser.newContext({ viewport: { width: 430, height: 932 }, colorScheme: "dark", isMobile: true })
  const mobile430Page = await preparePage(mobile430, "mobile-430")
  await mobile430Page.goto("/")
  await dismissConsent(mobile430Page)
  await mobile430Page.getByRole("button", { name: "Open navigation" }).click()
  const mobileNavigation = mobile430Page.getByRole("navigation", { name: "Mobile navigation" })
  await expect(mobileNavigation.getByRole("link")).toHaveText(["Home", "Projects", "Writing", "About"])
  await mobile430Page.screenshot({ path: path.join(artifactRoot, "mobile-430-menu-open.png"), fullPage: false })
  await mobileNavigation.getByRole("link", { name: "Writing" }).click()
  await expect(mobile430Page).toHaveURL(/\/blog$/)
  await expect(mobile430Page.getByRole("heading", { name: "Useful notes on AI, analytics, and building software" })).toBeVisible()
  await assertPageReady(mobile430Page)
  await mobile430Page.screenshot({ path: path.join(artifactRoot, "mobile-430-writing.png"), fullPage: true })
  await mobile430.close()

  const baseURL = String(testInfo.project.use.baseURL)
  const linkContext = await browser.newContext({ baseURL })
  const linkPage = await preparePage(linkContext, "link-check")
  const sourceRoutes = ["/", "/projects", "/blog", "/about", "/ai", "/analytics", "/privacy", "/projects/hackathon-voting-analytics/google-analytics"]
  const discovered = new Set(sourceRoutes)
  for (const route of sourceRoutes) {
    await linkPage.goto(route)
    for (const href of await linkPage.locator("a[href^='/']").evaluateAll((links) => links.map((link) => link.getAttribute("href")).filter(Boolean) as string[])) {
      discovered.add(href.split("#")[0] || "/")
    }
  }
  const linkResults = []
  for (const route of [...discovered].sort()) {
    const response = await linkContext.request.get(route)
    linkResults.push({ route, status: response.status(), finalUrl: response.url() })
    expect(response.status(), `${route} returned ${response.status()}`).toBeLessThan(400)
  }
  await linkContext.close()

  await fs.writeFile(path.join(artifactRoot, "console-errors.json"), JSON.stringify(consoleErrors, null, 2))
  await fs.writeFile(path.join(artifactRoot, "internal-links.json"), JSON.stringify(linkResults, null, 2))
  await fs.writeFile(
    path.join(artifactRoot, "interaction-proof.json"),
    JSON.stringify({ mobileMenuOpened: true, navigationLabels: ["Home", "Projects", "Writing", "About"], navigationCompletedAt: "/blog" }, null, 2),
  )
  expect(consoleErrors).toEqual([])
})
