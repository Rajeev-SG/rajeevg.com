import { expect, test } from "@playwright/test"

const articlePath = "/blog/chatgpt-controller-github-memory-glm-worker"
const diagrams = [
  "/images/blog/remote-coding-workflow/remote-coding-workflow-end-to-end.svg",
  "/images/blog/remote-coding-workflow/remote-coding-workflow-responsibility-split.svg",
  "/images/blog/remote-coding-workflow/remote-coding-workflow-rdc-recovery.svg",
]
const evidenceDir = "output/acceptance/remote-coding-workflow-20260906"

test.setTimeout(120_000)
test("the remote coding workflow article is readable and responsive", async ({ page, request }) => {
  const consoleErrors: string[] = []
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text())
  })

  for (const diagramPath of diagrams) {
    const asset = await request.get(diagramPath)
    expect(asset.status()).toBe(200)
    expect((await asset.body()).byteLength).toBeGreaterThan(4_000)
    expect((await asset.body().then((b) => b.toString()))).toContain("</svg>")
  }

  const source = await request.get("/downloads/remote-coding-workflow-end-to-end.excalidraw")
  expect(source.status()).toBe(200)
  const parsed = await source.json()
  expect(parsed.type).toBe("excalidraw")
  expect(parsed.elements.length).toBeGreaterThan(10)

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
      "ChatGPT as Controller, GitHub as Memory, a Local GLM Worker as the Workforce",
    )
    await expect(page.getByText("GitHub holds the task state so nothing depends on anyone's memory")).toBeVisible()

    const diagramsOnPage = page.locator("figure img[src*='remote-coding-workflow']")
    await expect(diagramsOnPage).toHaveCount(3)
    for (let i = 0; i < 3; i += 1) {
      const diagram = diagramsOnPage.nth(i)
      await diagram.scrollIntoViewIfNeeded()
      await expect(diagram).toBeVisible()
      // Diagrams live in a swipeable container by design; the img may be wider
      // than a phone viewport. The figure chrome itself must fit, and the page
      // must not scroll sideways.
      const figure = diagram.locator("xpath=ancestor::figure")
      const figureBounds = await figure.boundingBox()
      expect(figureBounds).not.toBeNull()
      expect(figureBounds!.x).toBeGreaterThanOrEqual(0)
      expect(figureBounds!.x + figureBounds!.width).toBeLessThanOrEqual(viewport.width)
      if (viewport.name === "desktop") {
        await figure.screenshot({ path: `${evidenceDir}/figure-${i + 1}.png` })
      }
    }

    expect(
      await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth),
    ).toBe(false)

    await page.screenshot({ path: `${evidenceDir}/${viewport.name}-page.png`, fullPage: true })
  }

  const markdown = await request.get(articlePath, { headers: { Accept: "text/markdown" } })
  expect(markdown.status()).toBe(200)
  expect(markdown.headers()["content-type"]).toMatch(/^text\/markdown;/i)
  expect(await markdown.text()).toContain("ChatGPT stays the controller")
})
