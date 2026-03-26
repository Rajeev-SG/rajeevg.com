import fs from "node:fs/promises"
import path from "node:path"

import { expect, test, type Locator, type Page } from "@playwright/test"

const artifactRoot = path.resolve(
  process.cwd(),
  "output/playwright/hackathon-ga4-dashboard-20260325",
)

async function capture(locator: Locator, filename: string) {
  await fs.mkdir(artifactRoot, { recursive: true })
  await locator.screenshot({ path: path.join(artifactRoot, filename) })
}

async function dismissConsentIfPresent(page: Page) {
  const necessaryOnly = page.getByRole("button", { name: "Necessary only" })
  try {
    await necessaryOnly.click({ timeout: 8_000 })
    await page.waitForTimeout(300)
  } catch {
    // already handled or not present
  }
}

test.describe("hackathon ga4 reporting surface", () => {
  test("shows reconciled GA reporting without the broken fallback controls", async ({ page }, testInfo) => {
    await page.goto("/projects/hackathon-voting-analytics/google-analytics")
    await dismissConsentIfPresent(page)

    await expect(
      page.getByRole("heading", { name: "Hackathon reporting dashboard" }),
    ).toBeVisible()

    await expect(page.getByRole("link", { name: "BigQuery analysis", exact: true })).toHaveCount(0)
    await expect(page.getByRole("link", { name: "GA4 property", exact: true })).toHaveCount(0)
    await expect(page.getByText("Host vote.rajeevg.com")).toBeVisible()
    await expect(page.getByRole("button", { name: "Dummy preview" })).toHaveCount(0)
    await expect(page.getByText("Consent and measurement")).toBeVisible()
    await expect(page.getByText("Top tracked events")).toBeVisible()
    await expect(page.getByText("Measurement quality checks")).toHaveCount(0)
    await expect(page.getByText("Round snapshot surface")).toHaveCount(0)
    await expect(page.getByText("Manager operations")).toHaveCount(0)

    const liveNote = page.getByText(
      /Live mode is reading directly from the shared GA4 property|The GA4 property is reachable, but no hackathon-host rows were returned|Live GA mode could not complete the report request/i,
    ).first()
    await expect(liveNote).toBeVisible()

    await expect(
      page.getByText(/consented actions out of .*actions with a known consent state|clean consented-versus-non-consented action split is not available yet/i).first(),
    ).toBeVisible()

    await page.getByText("Metric and field definitions", { exact: true }).click()
    await page.getByText(/More derived metrics/).click()
    await expect(page.getByText("Consented actions", { exact: true }).last()).toBeVisible()
    await expect(page.getByText("Non-consented actions", { exact: true }).last()).toBeVisible()

    const recordedVotesExplain = page.getByRole("button", { name: "Explain Recorded votes" }).first()
    await recordedVotesExplain.click()
    await expect(page.getByText("Votes saved by the voting app itself. This is the source-of-truth total.")).toBeVisible()

    await page.getByText("What this page includes", { exact: true }).click()
    await expect(page.getByText(/Tracked analytics coverage/i).first()).toBeVisible()

    await capture(
      testInfo.project.name === "desktop-light"
        ? page.getByRole("main").last()
        : page.locator("section").first(),
      `${testInfo.project.name}-top.png`,
    )

    await expect(page.getByText("AVG AGGREGATE")).toHaveCount(0)
    await expect(page.getByText("Granted dialog share")).toHaveCount(0)
    await expect(page.getByText("Denied dialogs")).toHaveCount(0)
    await expect(page.getByText(/unknown consent state/i)).toHaveCount(0)
    await expect(page.getByText("Raj test")).toHaveCount(0)
    await expect(page.getByText("test-2")).toHaveCount(0)
    await expect(page.getByText("test-3")).toHaveCount(0)
    await expect(page.getByText("test 1")).toHaveCount(0)

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    )
    expect(overflow).toBeLessThanOrEqual(1)

    if (testInfo.project.name === "desktop-light") {
      await page.goto("/projects")
      await expect(page.getByRole("link", { name: "Open GA4 surface" })).toBeVisible()
    }
  })
})
