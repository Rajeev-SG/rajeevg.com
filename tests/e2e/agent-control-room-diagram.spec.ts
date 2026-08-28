import { expect, test } from "@playwright/test"

const articlePath = "/blog/how-i-built-one-control-room-for-six-ai-agents"
const diagramPath = "/images/blog/agent-control-room/agent-control-room-architecture.svg"
const sourcePath = "/downloads/agent-control-room-architecture.excalidraw"

test("the control-room diagram is readable, editable and responsive", async ({ page, request }) => {
  const consoleErrors: string[] = []
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text())
  })

  for (const assetPath of [diagramPath, sourcePath]) {
    const response = await request.get(assetPath)
    expect(response.status(), assetPath).toBe(200)
    expect((await response.body()).byteLength, assetPath).toBeGreaterThan(1_000)
  }

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
      "How I Built One Control Room for Six AI Agents",
    )

    const diagram = page.getByAltText(/four location-labelled Telegram bots/i)
    await diagram.scrollIntoViewIfNeeded()
    await expect(diagram).toBeVisible()
    await expect(page.getByRole("link", { name: "Download the editable Excalidraw source" })).toHaveAttribute(
      "href",
      sourcePath,
    )

    const bounds = await diagram.boundingBox()
    expect(bounds).not.toBeNull()
    expect(bounds!.x).toBeGreaterThanOrEqual(0)
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(viewport.width)
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth),
    ).toBe(false)

    await diagram.locator("xpath=ancestor::figure").screenshot({
      path: `output/acceptance/gh-26-agent-control-room-diagram/${viewport.name}-figure.png`,
    })
  }

  expect(consoleErrors).toEqual([])
})
