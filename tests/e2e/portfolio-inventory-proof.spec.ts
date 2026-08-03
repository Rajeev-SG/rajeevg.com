import fs from "node:fs/promises"
import path from "node:path"

import { expect, test, type Page } from "@playwright/test"

const artifactRoot = path.resolve(
  process.cwd(),
  process.env.PORTFOLIO_INVENTORY_ARTIFACT_ROOT || "output/acceptance/portfolio-inventory-latest",
)

const consoleErrors: string[] = []

async function preparePage(page: Page) {
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(`${page.url()}: ${message.text()}`)
  })
  page.on("pageerror", (error) => consoleErrors.push(`${page.url()}: ${error.message}`))
  await page.goto("/projects")
  try {
    await page.getByRole("button", { name: "Necessary only" }).click({ timeout: 2_000 })
  } catch {
    // Consent was already set for this context.
  }
  await expect(page.getByRole("heading", { name: "Software built for real work" })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1)
}

test("proves the complete ranked public project inventory", async ({ browser }) => {
  test.setTimeout(90_000)
  await fs.mkdir(artifactRoot, { recursive: true })

  const desktop = await browser.newContext({ viewport: { width: 1440, height: 1000 }, colorScheme: "light" })
  const page = await desktop.newPage()
  await preparePage(page)

  const projectCards = page.locator("[data-analytics-item-type='project']")
  await expect(projectCards).toHaveCount(15)
  expect(await projectCards.evaluateAll((cards) => cards.slice(0, 6).map((card) => card.getAttribute("data-analytics-item-id")))).toEqual([
    "open-gtm-index",
    "local-llm-lab",
    "hackathon-voting-app",
    "singulyr",
    "creative-observatory",
    "github-canvas-monitor",
  ])
  await expect(page.getByText("Career Roadmap to Strategic Leadership Roles in Marketing Technology")).toHaveCount(0)

  for (let index = 0; index < await projectCards.count(); index += 1) {
    const image = projectCards.nth(index).locator("img")
    await image.scrollIntoViewIfNeeded()
    await expect(image).toBeVisible()
    expect(await image.evaluate((element) => (element as HTMLImageElement).naturalWidth)).toBeGreaterThan(0)
  }
  await page.evaluate(() => scrollTo(0, 0))

  const localLab = page.locator("article, [data-analytics-item-id='local-llm-lab']").filter({ hasText: "Local LLM Lab" }).first()
  await expect(localLab.getByRole("heading", { name: "Local LLM Lab" })).toBeVisible()
  await expect(localLab.getByRole("link", { name: "GitHub" })).toHaveAttribute("href", "https://github.com/Rajeev-SG/local-llm-lab")
  await expect(localLab.getByRole("link", { name: "Live site" })).toHaveAttribute("href", "https://local-llm-lab.vercel.app")
  const localLabImage = localLab.locator("img")
  await expect(localLabImage).toBeVisible()
  expect(await localLabImage.evaluate((image) => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0)

  const agentOrchestra = page.locator("[data-analytics-item-type='project'][data-analytics-item-id='agent-orchestra']")
  const markNotes = page.locator("[data-analytics-item-type='project'][data-analytics-item-id='mark-notes']")
  await expect(agentOrchestra.getByRole("link", { name: "Live site" })).toHaveAttribute("href", "https://multi-agent-orchestration-demo.vercel.app")
  await expect(agentOrchestra.getByRole("link", { name: "GitHub" })).toHaveCount(0)
  await expect(markNotes.getByRole("link", { name: "Live site" })).toHaveAttribute("href", "https://mark-notes-tau.vercel.app")
  await expect(markNotes.getByRole("link", { name: "GitHub" })).toHaveCount(0)

  const singulyr = page.locator("[data-analytics-item-type='project'][data-analytics-item-id='singulyr']")
  const creativeObservatory = page.locator("[data-analytics-item-type='project'][data-analytics-item-id='creative-observatory']")
  const githubCanvas = page.locator("[data-analytics-item-type='project'][data-analytics-item-id='github-canvas-monitor']")
  const singulyrPact = page.locator("[data-analytics-item-type='project'][data-analytics-item-id='singulyr-pact']")
  const openReview = page.locator("[data-analytics-item-type='project'][data-analytics-item-id='openreview']")
  await expect(singulyr.getByRole("link", { name: "Live site" })).toHaveAttribute("href", "https://singulyr-phase1.vercel.app")
  await expect(creativeObservatory.getByRole("link", { name: "Live site" })).toHaveAttribute("href", "https://creative-observatory.vercel.app")
  await expect(githubCanvas.getByRole("link", { name: "Live site" })).toHaveAttribute("href", "https://github-canvas-monitor.vercel.app")
  await expect(singulyrPact.getByRole("link", { name: "Live site" })).toHaveAttribute("href", "https://singulyr-pact-lp.vercel.app")
  await expect(openReview.getByRole("link", { name: "GitHub" })).toHaveAttribute("href", "https://github.com/Rajeev-SG/openreview")
  await expect(openReview.getByRole("link", { name: "Live site" })).toHaveAttribute("href", "https://openreview-openrouter.vercel.app")

  await page.screenshot({ path: path.join(artifactRoot, "desktop-1440-projects.png"), fullPage: true })
  await githubCanvas.screenshot({ path: path.join(artifactRoot, "desktop-github-canvas-card.png") })

  const [localLabPage] = await Promise.all([
    desktop.waitForEvent("page"),
    localLab.getByRole("link", { name: "Live site" }).click(),
  ])
  await localLabPage.waitForLoadState("domcontentloaded")
  await expect(localLabPage).toHaveURL(/^https:\/\/local-llm-lab\.vercel\.app\/?/)
  await expect(localLabPage.getByText("Every local model on this Mac, in one guide.")).toBeVisible()
  await localLabPage.close()
  await desktop.close()

  const wide = await browser.newContext({ viewport: { width: 1575, height: 1000 }, colorScheme: "light" })
  const widePage = await wide.newPage()
  await preparePage(widePage)
  await widePage.screenshot({ path: path.join(artifactRoot, "wide-1575-projects.png"), fullPage: true })
  await wide.close()

  const tablet = await browser.newContext({ viewport: { width: 820, height: 1180 }, colorScheme: "light" })
  const tabletPage = await tablet.newPage()
  await preparePage(tabletPage)
  await tabletPage.screenshot({ path: path.join(artifactRoot, "tablet-820-projects.png"), fullPage: true })
  await tablet.close()

  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme: "dark", isMobile: true })
  const mobilePage = await mobile.newPage()
  await preparePage(mobilePage)
  const mobileCards = mobilePage.locator("[data-analytics-item-type='project']")
  for (let index = 0; index < await mobileCards.count(); index += 1) {
    const image = mobileCards.nth(index).locator("img")
    await image.scrollIntoViewIfNeeded()
    await expect.poll(() => image.evaluate((element) => (element as HTMLImageElement).naturalWidth)).toBeGreaterThan(0)
  }
  await expect(mobilePage.getByRole("heading", { name: "GitHub Canvas Monitor" })).toBeVisible()
  await expect(mobilePage.getByRole("heading", { name: "OpenReview Deployment" })).toBeVisible()
  await mobilePage.evaluate(() => scrollTo(0, 0))
  await mobilePage.screenshot({ path: path.join(artifactRoot, "mobile-390-projects.png"), fullPage: true })
  await mobile.close()

  await fs.writeFile(path.join(artifactRoot, "console-errors.json"), JSON.stringify(consoleErrors, null, 2))
  expect(consoleErrors).toEqual([])
})
