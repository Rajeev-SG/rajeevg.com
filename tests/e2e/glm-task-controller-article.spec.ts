import { expect, test } from "@playwright/test"

const articlePath = "/blog/how-i-moved-codex-work-onto-glm-workers"
const diagramPath = "/images/blog/glm-task-controller/controller-worker-architecture.svg"
const evidenceDir = "output/acceptance/glm-task-controller-20260904"

test("the GLM task-controller article is readable and responsive", async ({ page, request }) => {
  const consoleErrors: string[] = []
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text())
  })

  const asset = await request.get(diagramPath)
  expect(asset.status()).toBe(200)
  expect((await asset.body()).byteLength).toBeGreaterThan(10_000)

  const viewports = [
    { name: "wide", width: 1536, height: 1100 },
    { name: "desktop", width: 1440, height: 1000 },
    { name: "intermediate", width: 768, height: 900 },
    { name: "mobile", width: 402, height: 874 },
  ]

  for (const viewport of viewports) {
    await page.setViewportSize(viewport)
    const response = await page.goto(articlePath)
    expect(response?.status()).toBe(200)

    const necessaryOnly = page.getByRole("button", { name: "Necessary only" })
    if (await necessaryOnly.isVisible()) await necessaryOnly.click()

    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "We Finally Moved the Work Off Sol and Onto GLM",
    )
    await expect(page.getByText("92.2% of the uncached prompt volume on GLM")).toBeVisible()

    const diagram = page.getByAltText(/compact Sol task controller/i)
    await diagram.scrollIntoViewIfNeeded()
    await expect(diagram).toBeVisible()

    const bounds = await diagram.boundingBox()
    expect(bounds).not.toBeNull()
    expect(bounds!.x).toBeGreaterThanOrEqual(0)
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(viewport.width)
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth),
    ).toBe(false)

    await page.screenshot({ path: `${evidenceDir}/${viewport.name}-page.png`, fullPage: true })
    await diagram.locator("xpath=ancestor::figure").screenshot({
      path: `${evidenceDir}/${viewport.name}-figure.png`,
    })
  }

  const markdown = await request.get(articlePath, { headers: { Accept: "text/markdown" } })
  expect(markdown.status()).toBe(200)
  expect(markdown.headers()["content-type"]).toMatch(/^text\/markdown;/i)
  expect(await markdown.text()).toContain("GLM share of uncached prompt volume")

  expect(consoleErrors).toEqual([])
})
