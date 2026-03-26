import fs from "node:fs/promises"
import path from "node:path"

import { expect, test, type Browser, type BrowserContextOptions, type ConsoleMessage, type Page } from "@playwright/test"

const artifactRoot = path.resolve(
  process.cwd(),
  "output/acceptance/article-visual-audit-20260326/local-playwright",
)

type PostRecord = {
  slug: string
  title: string
  draft?: boolean
}

type ViewportPreset = {
  name: string
  width: number
  height: number
  colorScheme: "light" | "dark"
  isMobile?: boolean
  hasTouch?: boolean
  deviceScaleFactor?: number
}

const viewports: ViewportPreset[] = [
  { name: "desktop-light", width: 1440, height: 1200, colorScheme: "light" },
  { name: "desktop-wide-light", width: 1575, height: 1200, colorScheme: "light" },
  { name: "tablet-light", width: 838, height: 1194, colorScheme: "light", hasTouch: true },
  {
    name: "mobile-dark",
    width: 390,
    height: 844,
    colorScheme: "dark",
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 3,
  },
]

async function loadPublishedPosts() {
  const manifestPath = path.resolve(process.cwd(), ".velite/posts.json")
  const raw = await fs.readFile(manifestPath, "utf8")
  const posts = JSON.parse(raw) as PostRecord[]

  return posts
    .filter((post) => !post.draft)
    .sort((left, right) => left.slug.localeCompare(right.slug))
}

async function dismissConsentIfPresent(page: Page) {
  const allowAnalytics = page.getByRole("button", { name: "Allow analytics" })
  const necessaryOnly = page.getByRole("button", { name: "Necessary only" })

  try {
    if (await allowAnalytics.isVisible({ timeout: 2_000 })) {
      await allowAnalytics.click()
      await page.waitForTimeout(300)
      return
    }
  } catch {
    // Banner not present in this run.
  }

  try {
    await necessaryOnly.click({ timeout: 2_000 })
    await page.waitForTimeout(300)
  } catch {
    // Banner not present in this run.
  }
}

async function assertImagesLoaded(page: Page) {
  const images = page.locator("img")
  const count = await images.count()

  for (let index = 0; index < count; index += 1) {
    await images.nth(index).scrollIntoViewIfNeeded()
    await page.waitForTimeout(100)
  }

  await page.waitForFunction(
    () =>
      Array.from(document.images).every((image) => image.complete && image.naturalWidth > 0),
    undefined,
    { timeout: 7_500 },
  )

  const brokenImages = await page.evaluate(() =>
    Array.from(document.images)
      .filter((image) => !image.complete || image.naturalWidth === 0)
      .map((image) => image.getAttribute("src") || image.currentSrc),
  )

  expect(brokenImages).toEqual([])
}

async function assertNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  expect(overflow).toBeLessThanOrEqual(1)
}

async function assertMermaidRenderedIfPresent(page: Page) {
  const mermaidBlocks = page.locator("pre.mermaid")
  const mermaidCount = await mermaidBlocks.count()

  for (let index = 0; index < mermaidCount; index += 1) {
    await mermaidBlocks.nth(index).scrollIntoViewIfNeeded()
    await expect(mermaidBlocks.nth(index).locator("svg")).toBeVisible()
  }

  return mermaidCount
}

function pageConsoleCollector(messages: ConsoleMessage[]) {
  return (message: ConsoleMessage) => {
    if (message.type() === "error") {
      messages.push(message)
    }
  }
}

async function captureFigures(page: Page, articleDir: string) {
  const figures = page.locator("figure")
  const figureCount = await figures.count()

  for (let index = 0; index < figureCount; index += 1) {
    const figure = figures.nth(index)
    await figure.scrollIntoViewIfNeeded()
    await page.waitForTimeout(150)
    await figure.screenshot({
      path: path.join(articleDir, `desktop-figure-${String(index + 1).padStart(2, "0")}.png`),
    })
  }

  return figureCount
}

async function createContext(browser: Browser, preset: ViewportPreset) {
  const contextOptions: BrowserContextOptions = {
    colorScheme: preset.colorScheme,
    viewport: { width: preset.width, height: preset.height },
    isMobile: preset.isMobile,
    hasTouch: preset.hasTouch,
    deviceScaleFactor: preset.deviceScaleFactor ?? 1,
  }

  return browser.newContext(contextOptions)
}

test.describe.configure({ mode: "serial" })

test("all published articles render cleanly across article visuals and responsive breakpoints", async ({
  browser,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-light", "This audit manages its own viewport matrix.")
  test.setTimeout(10 * 60_000)

  const posts = await loadPublishedPosts()

  await fs.rm(artifactRoot, { recursive: true, force: true })
  await fs.mkdir(artifactRoot, { recursive: true })

  const summaryRows: string[] = []
  summaryRows.push("# Article Visual Audit")
  summaryRows.push("")
  summaryRows.push("- Surface: local production build via Playwright")
  summaryRows.push(`- Articles checked: ${posts.length}`)
  summaryRows.push(`- Viewports: ${viewports.map((preset) => preset.name).join(", ")}`)
  summaryRows.push("")
  summaryRows.push("| Article | Figures | Mermaid | Viewports | Console | Result |")
  summaryRows.push("| --- | ---: | ---: | --- | --- | --- |")

  for (const post of posts) {
    const articleDir = path.join(artifactRoot, post.slug)
    await fs.mkdir(articleDir, { recursive: true })

    let figureCount = 0
    let mermaidCount = 0
    const viewportResults: string[] = []

    for (const preset of viewports) {
      const context = await createContext(browser, preset)
      const page = await context.newPage()
      const consoleErrors: ConsoleMessage[] = []
      page.on("console", pageConsoleCollector(consoleErrors))

      await page.goto(`/blog/${post.slug}`, { waitUntil: "domcontentloaded" })
      await dismissConsentIfPresent(page)

      await expect(page.getByRole("heading", { name: post.title })).toBeVisible()
      await assertImagesLoaded(page)
      const currentMermaidCount = await assertMermaidRenderedIfPresent(page)
      await assertNoHorizontalOverflow(page)

      if (preset.name === "desktop-light") {
        figureCount = await captureFigures(page, articleDir)
        mermaidCount = currentMermaidCount
      }

      await page.screenshot({
        path: path.join(articleDir, `${preset.name}-full.png`),
        fullPage: true,
      })

      const articleContent = page.locator("#article-content")
      await articleContent.scrollIntoViewIfNeeded()
      await page.waitForTimeout(150)
      await page.screenshot({
        path: path.join(articleDir, `${preset.name}-top.png`),
        fullPage: false,
      })

      if (figureCount === 0 && preset.name === "desktop-light") {
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.5))
        await page.waitForTimeout(150)
        await page.screenshot({
          path: path.join(articleDir, "desktop-mid.png"),
          fullPage: false,
        })
      }

      const errorTexts = consoleErrors.map((message) => message.text())
      expect(errorTexts).toEqual([])

      viewportResults.push(preset.name)
      await context.close()
    }

    summaryRows.push(
      `| ${post.slug} | ${figureCount} | ${mermaidCount} | ${viewportResults.join(", ")} | clean | pass |`,
    )
  }

  summaryRows.push("")
  summaryRows.push("## What was checked")
  summaryRows.push("")
  summaryRows.push("- every published article route loaded in a real browser")
  summaryRows.push("- every `img` resolved with non-zero natural width")
  summaryRows.push("- every Mermaid block rendered to SVG when present")
  summaryRows.push("- no article introduced horizontal overflow at any tested breakpoint")
  summaryRows.push("- console output stayed clean during the audited routes")
  summaryRows.push("- fresh full-page screenshots were captured for desktop, wide desktop, tablet, and mobile")
  summaryRows.push("- every article `figure` was captured individually on desktop for visual inspection")

  await fs.writeFile(path.join(artifactRoot, "proof.md"), `${summaryRows.join("\n")}\n`, "utf8")
})
