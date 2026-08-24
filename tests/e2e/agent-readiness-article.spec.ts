import { expect, test } from "@playwright/test"

const articlePath = "/blog/what-a-75-100-agent-readiness-score-means-for-rajeevg-com"
const screenshotPath = "/images/blog/agent-readiness-75/is-agentic-score-75.png"
const diagramPath = "/images/blog/agent-readiness-75/visibility-vs-operability.svg"
const diagramSourcePath = "/images/blog/agent-readiness-75/visibility-vs-operability.drawio"

test.describe("agent-readiness article", () => {
  test("publishes the selected article and its visual evidence", async ({ page, request }) => {
    const response = await page.goto(articlePath)
    expect(response?.status()).toBe(200)

    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "What a 75/100 Agent-Readiness Score Means for rajeevg.com",
    )
    await expect(page.locator("h1")).toHaveCount(1)
    await expect(page.getByText("A practical audit, not a universal SEO score")).toBeVisible()
    await expect(page.getByText("The decision rule")).toBeVisible()

    const auditImage = page.getByAltText(/Is Agentic report for rajeevg\.com showing a score of 75/i)
    const diagramImage = page.getByAltText(/visibility as the path for every content site/i)
    await auditImage.scrollIntoViewIfNeeded()
    await expect(auditImage).toBeVisible()
    await diagramImage.scrollIntoViewIfNeeded()
    await expect(diagramImage).toBeVisible()
    await expect(page.getByRole("link", { name: "Download the editable draw.io source" })).toHaveAttribute(
      "href",
      diagramSourcePath,
    )

    for (const assetPath of [screenshotPath, diagramPath, diagramSourcePath]) {
      const asset = await request.get(assetPath)
      expect(asset.status(), assetPath).toBe(200)
      expect((await asset.body()).byteLength, assetPath).toBeGreaterThan(500)
    }

    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    )
    expect(hasHorizontalOverflow).toBe(false)
  })

  test("exposes the article through Markdown negotiation", async ({ request }) => {
    const response = await request.get(articlePath, { headers: { Accept: "text/markdown" } })
    expect(response.status()).toBe(200)
    expect(response.headers()["content-type"]).toMatch(/^text\/markdown;\s*charset=utf-8/i)
    const body = await response.text()
    expect(body).toContain("## Visibility and operability are different jobs")
    expect(body).toContain("a trustworthy 75 is better than a fictional 100")
    expect(body).not.toContain("title: What a 75/100")
  })
})
