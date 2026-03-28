import fs from "node:fs/promises"
import path from "node:path"

import { expect, test, type Browser, type Locator, type Page } from "@playwright/test"

const auditTarget =
  process.env.E2E_BASE_URL && /rajeevg\.com/.test(process.env.E2E_BASE_URL) ? "prod" : "local"
const artifactRoot = path.resolve(
  process.cwd(),
  "output/acceptance/projects-dashboard-audit-20260325",
  auditTarget,
)

type AuditViewport = {
  key: string
  width: number
  height: number
  colorScheme: "light" | "dark"
  isMobile?: boolean
}

const viewports: AuditViewport[] = [
  { key: "desktop-light", width: 1440, height: 1200, colorScheme: "light" },
  { key: "desktop-wide-light", width: 1600, height: 1200, colorScheme: "light" },
  { key: "tablet-light", width: 820, height: 1180, colorScheme: "light" },
  { key: "mobile-dark", width: 390, height: 844, colorScheme: "dark", isMobile: true },
]

async function ensureArtifactDir() {
  await fs.mkdir(artifactRoot, { recursive: true })
}

async function dismissConsentIfPresent(page: Page) {
  const allowAnalytics = page.getByRole("button", { name: "Allow analytics" })
  const necessaryOnly = page.getByRole("button", { name: "Necessary only" })

  try {
    if (await allowAnalytics.isVisible({ timeout: 1_500 })) {
      await allowAnalytics.click()
      await page.waitForTimeout(250)
      return
    }
  } catch {
    // Banner not present in this run.
  }

  try {
    await necessaryOnly.click({ timeout: 1_500 })
    await page.waitForTimeout(250)
  } catch {
    // Banner not present in this run.
  }
}

async function captureViewport(page: Page, name: string, locator?: Locator) {
  await ensureArtifactDir()

  if (locator) {
    await locator.scrollIntoViewIfNeeded()
    await page.waitForTimeout(250)
  }

  await page.screenshot({
    path: path.join(artifactRoot, `${name}.png`),
    fullPage: false,
  })
}

async function assertNoHorizontalOverflow(page: Page, label: string) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  expect(overflow, `${label} has horizontal overflow of ${overflow}px`).toBeLessThanOrEqual(1)
}

async function assertNoVisibleTextClipping(page: Page, label: string) {
  const offenders = await page.evaluate(() => {
    const isIgnored = (element: Element, style: CSSStyleDeclaration) => {
      if (!(element instanceof HTMLElement)) return true
      if (!element.textContent?.trim()) return true
      if (element.closest("svg, canvas")) return true
      if (style.position === "fixed" || style.position === "sticky") return true
      if (element.clientWidth < 48 || element.clientHeight < 16) return true
      return false
    }

    return Array.from(document.querySelectorAll("main *"))
      .flatMap((element) => {
        const style = getComputedStyle(element)
        if (isIgnored(element, style)) return []

        const horizontalOverflow = element.scrollWidth - element.clientWidth > 1
        const verticalOverflow = element.scrollHeight - element.clientHeight > 1
        const isClipped =
          style.overflowX !== "visible" ||
          style.overflowY !== "visible" ||
          style.textOverflow === "ellipsis" ||
          style.webkitLineClamp !== "none"

        if (!(horizontalOverflow || verticalOverflow) || !isClipped) return []

        return [
          {
            tag: element.tagName.toLowerCase(),
            text: element.textContent?.trim().slice(0, 120),
            width: element.clientWidth,
            scrollWidth: element.scrollWidth,
            height: element.clientHeight,
            scrollHeight: element.scrollHeight,
          },
        ]
      })
      .slice(0, 10)
  })

  expect(offenders, `${label} has clipped text elements`).toEqual([])
}

async function assertNoObservableTextCollisions(page: Page, label: string) {
  const issues = await page.evaluate(() => {
    const intersects = (a: DOMRect, b: DOMRect) =>
      !(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom)

    const snippets: string[] = []

    document.querySelectorAll("svg").forEach((svg, svgIndex) => {
      const svgRect = svg.getBoundingClientRect()
      const texts = Array.from(svg.querySelectorAll("text"))
        .map((node) => ({
          text: node.textContent?.trim() ?? "",
          rect: node.getBoundingClientRect(),
        }))
        .filter(({ text, rect }) => text && rect.width > 4 && rect.height > 4)

      texts.forEach(({ text, rect }) => {
        if (
          rect.left < svgRect.left - 2 ||
          rect.right > svgRect.right + 2 ||
          rect.top < svgRect.top - 2 ||
          rect.bottom > svgRect.bottom + 2
        ) {
          snippets.push(`svg-${svgIndex}: clipped text "${text}"`)
        }
      })

      for (let index = 0; index < texts.length; index += 1) {
        for (let candidate = index + 1; candidate < texts.length; candidate += 1) {
          const left = texts[index]
          const right = texts[candidate]
          if (intersects(left.rect, right.rect)) {
            snippets.push(`svg-${svgIndex}: overlap "${left.text}" vs "${right.text}"`)
          }
        }
      }
    })

    return snippets.slice(0, 12)
  })

  expect(issues, `${label} has overlapping or clipped SVG text`).toEqual([])
}

function trackConsoleErrors(page: Page) {
  const errors: string[] = []

  page.on("console", (message) => {
    if (message.type() === "error") {
      errors.push(message.text())
    }
  })

  page.on("pageerror", (error) => {
    errors.push(error.message)
  })

  return errors
}

async function createAuditPage(browser: Browser, viewport: AuditViewport) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    colorScheme: viewport.colorScheme,
    isMobile: viewport.isMobile ?? false,
  })
  const page = await context.newPage()
  const consoleErrors = trackConsoleErrors(page)

  return { context, page, consoleErrors }
}

async function openBigQueryDashboard(page: Page) {
  await page.goto("/projects/hackathon-voting-analytics")
  await dismissConsentIfPresent(page)
  await expect(
    page.getByRole("heading", { name: "Hackathon reporting dashboard" }),
  ).toBeVisible()
}

async function openGa4Dashboard(page: Page) {
  await page.goto("/projects/hackathon-voting-analytics/google-analytics")
  await dismissConsentIfPresent(page)
  await expect(
    page.getByRole("heading", { name: "Hackathon reporting dashboard" }),
  ).toBeVisible()
}

async function openSiteAnalytics(page: Page) {
  await page.goto("/projects/site-analytics")
  await dismissConsentIfPresent(page)
  await expect(
    page.getByRole("heading", { name: "GA4 content and instrumentation dashboard" }),
  ).toBeVisible()
}

test.describe("projects dashboard audit", () => {
  test("audits the hackathon BigQuery dashboard across sections, renderers, and viewports", async ({
    browser,
  }) => {
    test.skip(test.info().project.name !== "desktop-light", "This audit manages its own viewport matrix.")
    test.setTimeout(120_000)

    for (const viewport of viewports) {
      const { context, page, consoleErrors } = await createAuditPage(browser, viewport)

      try {
        await openBigQueryDashboard(page)
        await assertNoHorizontalOverflow(page, `bigquery ${viewport.key}`)

        await captureViewport(
          page,
          `hackathon-bigquery-${viewport.key}-hero`,
          page.locator('[data-analytics-reporting-shell="hero"]').first(),
        )
        await captureViewport(
          page,
          `hackathon-bigquery-${viewport.key}-primary-surface`,
          page
            .getByRole("heading", { name: "Daily volume" })
            .or(page.getByRole("heading", { name: "Warehouse status" }))
            .first(),
        )

        await page.getByRole("button", { name: "Dummy preview" }).click()
        const previewHeadings = [
          "Daily momentum",
          "Voting funnel",
          "Auth mix",
          "Leaderboard by total score",
          "Vote conversion by entry",
          "Tracked event mix",
        ]

        for (const heading of previewHeadings) {
          await captureViewport(
            page,
            `hackathon-bigquery-${viewport.key}-preview-echarts-${heading.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
            page.getByRole("heading", { name: heading }).first(),
          )
        }

        await page.getByRole("button", { name: "Observable Plot" }).click()
        await expect(page.locator("svg").first()).toBeVisible()
        await assertNoObservableTextCollisions(page, `bigquery observable ${viewport.key}`)

        for (const heading of previewHeadings) {
          await captureViewport(
            page,
            `hackathon-bigquery-${viewport.key}-preview-observable-${heading.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
            page.getByRole("heading", { name: heading }).first(),
          )
        }

        await assertNoVisibleTextClipping(page, `bigquery ${viewport.key}`)
        expect(consoleErrors, `bigquery ${viewport.key} has console errors`).toEqual([])
      } finally {
        await context.close()
      }
    }
  })

  test("audits the hackathon GA4 dashboard rows and schema cards across viewports", async ({
    browser,
  }) => {
    test.skip(test.info().project.name !== "desktop-light", "This audit manages its own viewport matrix.")
    test.setTimeout(120_000)

    for (const viewport of viewports) {
      const { context, page, consoleErrors } = await createAuditPage(browser, viewport)

      try {
        await openGa4Dashboard(page)
        await assertNoHorizontalOverflow(page, `ga4 ${viewport.key}`)

        const surfaces = [
          {
            name: "hero",
            locator: page.locator('[data-analytics-reporting-shell="hero"]').first(),
          },
          { name: "consent-and-measurement", locator: page.getByRole("heading", { name: "Consent and measurement" }).first() },
          { name: "top-tracked-events", locator: page.getByRole("heading", { name: "Top tracked events" }).first() },
          { name: "entry-by-entry-tracking", locator: page.getByRole("heading", { name: "Entry-by-entry tracking" }).first() },
          { name: "metric-and-field-definitions", locator: page.getByText("Metric and field definitions", { exact: true }).first() },
        ]

        for (const surface of surfaces) {
          await captureViewport(page, `hackathon-ga4-${viewport.key}-${surface.name}`, surface.locator)
        }

        await assertNoVisibleTextClipping(page, `ga4 ${viewport.key}`)
        expect(consoleErrors, `ga4 ${viewport.key} has console errors`).toEqual([])
      } finally {
        await context.close()
      }
    }
  })

  test("audits the site analytics dashboard across sections, renderers, and viewports", async ({
    browser,
  }) => {
    test.skip(test.info().project.name !== "desktop-light", "This audit manages its own viewport matrix.")
    test.setTimeout(180_000)

    for (const viewport of viewports) {
      const { context, page, consoleErrors } = await createAuditPage(browser, viewport)

      try {
        await openSiteAnalytics(page)
        await assertNoHorizontalOverflow(page, `site analytics ${viewport.key}`)

        const sharedSections = [
          {
            name: "hero",
            locator: page.getByRole("heading", { name: "GA4 content and instrumentation dashboard" }).first(),
          },
          { name: "live-reporting-boundaries", locator: page.getByRole("heading", { name: "Live reporting boundaries" }).first() },
          { name: "top-blog-pages-chart", locator: page.getByRole("heading", { name: "Top blog pages" }).first() },
          { name: "device-mix-chart", locator: page.getByRole("heading", { name: "Device mix" }).first() },
          { name: "realtime-custom-events-chart", locator: page.getByRole("heading", { name: "Realtime custom events" }).first() },
          { name: "portfolio-key-events-chart", locator: page.getByRole("heading", { name: "Portfolio key events" }).first() },
          { name: "top-blog-pages-list", locator: page.getByRole("heading", { name: "Top blog pages" }).nth(1) },
          { name: "realtime-custom-events-list", locator: page.getByRole("heading", { name: "Realtime custom events" }).nth(1) },
          { name: "portfolio-key-events-list", locator: page.getByRole("heading", { name: "Portfolio key events" }).nth(1) },
          { name: "full-site-page-leaders", locator: page.getByRole("heading", { name: "Full-site page leaders" }).first() },
          { name: "device-mix-list", locator: page.getByRole("heading", { name: "Device mix" }).nth(1) },
          { name: "promoted-site-dimensions", locator: page.getByRole("heading", { name: "Promoted site dimensions" }).first() },
          { name: "promoted-site-metrics", locator: page.getByRole("heading", { name: "Promoted site metrics" }).first() },
          { name: "why-this-route-exists", locator: page.getByRole("heading", { name: "Why this route exists" }).first() },
        ]

        for (const section of sharedSections) {
          await captureViewport(page, `site-analytics-${viewport.key}-echarts-${section.name}`, section.locator)
        }

        await page.getByRole("button", { name: "Observable Plot" }).click()
        await expect(page.locator("svg").first()).toBeVisible()
        await assertNoObservableTextCollisions(page, `site analytics observable ${viewport.key}`)

        for (const section of sharedSections) {
          await captureViewport(page, `site-analytics-${viewport.key}-observable-${section.name}`, section.locator)
        }

        await assertNoVisibleTextClipping(page, `site analytics ${viewport.key}`)
        expect(consoleErrors, `site analytics ${viewport.key} has console errors`).toEqual([])
      } finally {
        await context.close()
      }
    }
  })
})
