import { expect, test } from "@playwright/test"

const slug = process.env.ARTICLE_SLUG

if (!slug) {
  throw new Error("ARTICLE_SLUG is required")
}

test(`article ${slug} renders as a complete reader surface`, async ({ page }, testInfo) => {
  const response = await page.goto(`/blog/${slug}`, { waitUntil: "networkidle" })
  expect(response?.ok(), `GET /blog/${slug}`).toBeTruthy()

  await expect(page.locator("main")).toBeVisible()
  await expect(page.locator("h1")).toBeVisible()
  const articleText = await page.locator("main").innerText()
  expect(articleText.trim().length).toBeGreaterThan(600)

  await page.screenshot({
    path: testInfo.outputPath(`${slug}-${testInfo.project.name}.png`),
    fullPage: true,
  })
})
