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

  test("authorized editor flow supports component insertion, preview, and AI drafting", async ({
    page,
  }, testInfo) => {
    await ensureArtifactRoot()
    await setDashboardCookie(page, testInfo, "rajeev.sgill@gmail.com")

    await page.goto("/dashboard/editor/D01")
    await expect(page.locator("h1")).toContainText(
      "The AI workflow review: how to find the first use case worth automating"
    )

    await page.getByRole("tab", { name: "Raw MDX" }).click()
    const rawEditor = page.getByLabel("Raw MDX source")
    const currentMarkdown = await rawEditor.inputValue()
    await rawEditor.fill(
      `${currentMarkdown}\n\n<ArticleExplain term="Term to explain">Explain the concept inline for the preview.</ArticleExplain>\n`
    )

    await page.getByRole("tab", { name: "Preview" }).click()
    await page.getByRole("button", { name: "Refresh preview" }).click()
    await expect(page.getByText("Term to explain")).toBeVisible()

    await page.getByRole("button", { name: "Generate first draft" }).click()
    await expect(page.getByRole("button", { name: "Apply to draft" })).toBeVisible()
    await page.getByRole("button", { name: "Apply to draft" }).click()
    await expect(page.getByRole("tab", { name: "Preview" })).toBeVisible()

    await page.screenshot({
      path: path.join(artifactRoot, `editor-flow-${testInfo.project.name}.png`),
      fullPage: true,
    })
  })
})
