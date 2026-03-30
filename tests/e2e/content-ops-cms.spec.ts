import fs from "node:fs/promises"
import path from "node:path"

import { expect, test, type Page, type TestInfo } from "@playwright/test"

const artifactRoot = path.resolve(
  process.cwd(),
  process.env.CONTENT_OPS_CMS_ARTIFACT_ROOT || "output/acceptance/content-ops-cms-20260330/local-playwright",
)

async function ensureArtifactRoot() {
  await fs.mkdir(artifactRoot, { recursive: true })
}

async function setDashboardCookie(page: Page, testInfo: TestInfo, email: string) {
  const baseURL = (testInfo.project.use.baseURL as string | undefined) || "http://127.0.0.1:3018"
  await page.context().addCookies([
    {
      name: "content_ops_dev_email",
      value: email,
      url: baseURL,
    },
  ])
}

async function dismissConsentIfPresent(page: Page) {
  for (const name of ["Allow analytics", "Necessary only"]) {
    try {
      await page.getByRole("button", { name }).click({ timeout: 1_500 })
      await page.waitForTimeout(300)
      return
    } catch {
      // Consent banner was not visible in this run.
    }
  }
}

test.describe("content ops cms", () => {
  test("wrong email is blocked from the dashboard", async ({ page }, testInfo) => {
    await ensureArtifactRoot()
    await setDashboardCookie(page, testInfo, "not-rajeev@example.com")

    await page.goto("/dashboard")
    await expect(page.getByRole("heading", { name: "Dashboard access denied" })).toBeVisible()
    await expect(page.getByText("not allowlisted for this dashboard")).toBeVisible()
    await page.screenshot({
      path: path.join(artifactRoot, `dashboard-denied-${testInfo.project.name}.png`),
      fullPage: true,
    })
  })

  test("existing published MDX opens in raw-only mode without parser failure and derived state is visible", async ({
    page,
  }, testInfo) => {
    await ensureArtifactRoot()
    await setDashboardCookie(page, testInfo, "rajeev.sgill@gmail.com")

    await page.goto("/dashboard")
    await dismissConsentIfPresent(page)
    await page.getByRole("tab", { name: "Existing Content" }).click()
    await page.getByRole("button", { name: "From AI Pilots to Clear Business Value" }).click()
    const markDerivedButton = page.getByRole("button", { name: "Mark as derived" })
    if (await markDerivedButton.isVisible().catch(() => false)) {
      await markDerivedButton.click()
    }
    await expect(page.getByRole("button", { name: "Marked derived" })).toBeDisabled()
    await page.getByRole("link", { name: "Open in editor" }).click()

    await expect(page.getByRole("heading", { name: "From AI Pilots to Clear Business Value" })).toBeVisible()
    await expect(page.getByRole("tab", { name: "Raw MDX (required)" })).toHaveAttribute("aria-selected", "true")
    await expect(page.getByText(/Rich editing is disabled for this document because it includes/i)).toBeVisible()
    await expect(page.getByLabel("Raw MDX source")).toBeVisible()
    await expect(page.getByText("Parsing of the following markdown structure failed")).toHaveCount(0)
    await expect(page.getByText("Derived from existing content")).toBeVisible()

    const dateValues = await page.locator('input[type="date"]').evaluateAll((elements) =>
      elements.map((element) => (element as HTMLInputElement).value)
    )
    for (const value of dateValues) {
      expect(value).toMatch(/^\d{4}-\d{2}-\d{2}$|^$/)
    }

    await page.screenshot({
      path: path.join(artifactRoot, `editor-e01-raw-only-${testInfo.project.name}.png`),
      fullPage: true,
    })
  })

  test("authorized editor flow supports FAQ normalization, uploads, preview, and local publish plus republish", async ({
    page,
  }, testInfo) => {
    await ensureArtifactRoot()
    await setDashboardCookie(page, testInfo, "rajeev.sgill@gmail.com")

    const uniqueSuffix = `${Date.now()}-${testInfo.project.name}`.replace(/[^a-zA-Z0-9-]+/g, "-")
    const slug = `audit-proof-${uniqueSuffix.toLowerCase()}`
    const title = `Audit proof ${uniqueSuffix}`
    const firstMarker = `Local publish marker ${uniqueSuffix}`
    const secondMarker = `Local republish marker ${uniqueSuffix}`
    const uploadFilename = `upload-${uniqueSuffix}.txt`
    const uploadFilePath = path.join(artifactRoot, uploadFilename)

    await fs.writeFile(uploadFilePath, `Upload proof ${uniqueSuffix}\n`, "utf-8")

    await page.goto("/dashboard/editor/D01")
    await dismissConsentIfPresent(page)
    await expect(page.getByRole("heading", { name: /The AI workflow review: how to find the first use case worth automating/i }).first()).toContainText(
      "The AI workflow review: how to find the first use case worth automating"
    )

    const addFaqButton = page.getByRole("button", { name: "Add FAQ" })
    await addFaqButton.scrollIntoViewIfNeeded()
    await addFaqButton.evaluate((element) => (element as HTMLButtonElement).click())
    const assistantTextarea = page.locator("textarea[readonly]").first()
    await expect(assistantTextarea).toBeVisible()
    await expect(assistantTextarea).toHaveValue(/## Frequently asked questions/)
    await page.getByRole("button", { name: "Apply to draft" }).click()

    await page.getByRole("tab", { name: "Editor" }).click()
    await page.locator('input[placeholder="Article title"]').fill(title)
    await page.locator('input[placeholder="slug"]').fill(slug)

    await page.locator('input[type="file"]').setInputFiles(uploadFilePath)
    const uploadCard = page.getByText(uploadFilename, { exact: true }).locator("xpath=..")
    await expect(uploadCard).toBeVisible()
    const uploadUrl = (await uploadCard.getByText("/uploads/content-ops/D01/").textContent())?.trim()
    expect(uploadUrl).toBeTruthy()

    await page.getByRole("tab", { name: "Raw MDX" }).click()
    const rawEditor = page.getByLabel("Raw MDX source")
    const uploadMarkdown = await rawEditor.inputValue()
    expect(uploadMarkdown).toContain("/uploads/content-ops/D01/")
    await rawEditor.fill(`# ${title}\n\n${firstMarker}\n\n![Upload proof](${uploadUrl})\n`)

    const uploadResponse = await page.request.get(uploadUrl!)
    expect(uploadResponse.status()).toBe(200)
    expect(await uploadResponse.text()).toContain(`Upload proof ${uniqueSuffix}`)

    await page.getByRole("tab", { name: "Preview" }).click()
    await page.getByRole("button", { name: "Refresh preview" }).click()
    await expect(page.getByText(firstMarker)).toBeVisible()

    const publishButton = page.getByRole("button", { name: "Publish or republish" })
    await publishButton.scrollIntoViewIfNeeded()
    await Promise.all([
      page.waitForResponse(
        (response) => response.url().includes("/api/content-ops/publish") && response.request().method() === "POST" && response.ok()
      ),
      publishButton.click(),
    ])
    await expect(page.getByText("The local runtime overlay can render the updated article immediately.").first()).toBeVisible()

    await page.goto(`/blog/${slug}`)
    await dismissConsentIfPresent(page)
    await expect(page.getByText(firstMarker)).toBeVisible()

    await page.goto("/dashboard/editor/D01")
    await page.locator('input[placeholder="Article title"]').fill(title)
    await page.locator('input[placeholder="slug"]').fill(slug)
    await page.getByRole("tab", { name: "Raw MDX" }).click()
    await rawEditor.fill(`# ${title}\n\n${secondMarker}\n`)
    const republishButton = page.getByRole("button", { name: "Publish or republish" })
    await republishButton.scrollIntoViewIfNeeded()
    await Promise.all([
      page.waitForResponse(
        (response) => response.url().includes("/api/content-ops/publish") && response.request().method() === "POST" && response.ok()
      ),
      republishButton.click(),
    ])
    await expect(page.getByText("The local runtime overlay can render the updated article immediately.").first()).toBeVisible()

    await page.goto(`/blog/${slug}`)
    await dismissConsentIfPresent(page)
    await expect(page.getByText(secondMarker)).toBeVisible()
    await expect(page.getByText(firstMarker)).toHaveCount(0)

    await page.screenshot({
      path: path.join(artifactRoot, `editor-publish-proof-${testInfo.project.name}.png`),
      fullPage: true,
    })
  })
})
