import fs from "node:fs/promises"
import path from "node:path"

import { expect, test, type Page, type TestInfo } from "@playwright/test"

const artifactRoot = path.resolve(
  process.cwd(),
  "output/playwright/qwen-mermaid-dark-theme-20260803",
)

async function dismissConsentIfPresent(page: Page) {
  try {
    await page.getByRole("button", { name: "Necessary only" }).click({ timeout: 2_000 })
    await page.waitForTimeout(250)
  } catch {
    // Consent was already stored or the panel was not shown.
  }
}

test.describe("Qwen article Mermaid theme handling", () => {
  test("keeps every diagram legible after switching from light to dark mode", async ({
    page,
  }, testInfo: TestInfo) => {
    await fs.mkdir(artifactRoot, { recursive: true })
    const consoleErrors: string[] = []
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text())
    })
    page.on("pageerror", (error) => consoleErrors.push(error.message))

    await page.addInitScript(() => localStorage.setItem("theme", "light"))

    await page.goto("/blog/how-i-ran-qwen-locally-inside-codex")
    await dismissConsentIfPresent(page)

    const diagrams = page.locator("pre.mermaid svg[aria-roledescription]")
    await expect(diagrams).toHaveCount(3)

    const sequenceDiagram = page.locator('pre.mermaid:has(svg[aria-roledescription="sequence"])')
    await sequenceDiagram.scrollIntoViewIfNeeded()
    await expect(sequenceDiagram).toBeVisible()

    const lightMessageFill = await sequenceDiagram
      .locator(".messageText")
      .first()
      .evaluate((element) => getComputedStyle(element).fill)

    await page.getByRole("button", { name: "Toggle theme" }).click()
    await expect(page.locator("html")).toHaveClass(/dark/)

    const contrast = await page.evaluate(() => {
      const parseColor = (value: string) => {
        const canvas = document.createElement("canvas")
        canvas.width = 1
        canvas.height = 1
        const context = canvas.getContext("2d")
        if (!context) throw new Error("Canvas color conversion is unavailable")
        context.fillStyle = "#000000"
        context.fillStyle = value
        context.fillRect(0, 0, 1, 1)
        return Array.from(context.getImageData(0, 0, 1, 1).data.slice(0, 3))
      }

      const luminance = (value: string) => {
        const channels = parseColor(value).map((channel) => {
          const normalized = channel / 255
          return normalized <= 0.04045
            ? normalized / 12.92
            : Math.pow((normalized + 0.055) / 1.055, 2.4)
        })
        return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]
      }

      const ratio = (foreground: string, background: string) => {
        const light = Math.max(luminance(foreground), luminance(background))
        const dark = Math.min(luminance(foreground), luminance(background))
        return (light + 0.05) / (dark + 0.05)
      }

      const sequence = document.querySelector<SVGSVGElement>(
        'svg[aria-roledescription="sequence"]',
      )
      const flowchart = document.querySelector<SVGSVGElement>(
        'svg[aria-roledescription="flowchart-v2"]',
      )
      if (!sequence || !flowchart) throw new Error("Expected Mermaid diagrams were not rendered")

      const sequenceContainer = sequence.closest("pre.mermaid")
      const sequenceBackground = getComputedStyle(sequenceContainer!).backgroundColor
      const messageText = getComputedStyle(sequence.querySelector(".messageText")!).fill
      const messageLine = getComputedStyle(sequence.querySelector(".messageLine0")!).stroke
      const actorText = getComputedStyle(sequence.querySelector("text.actor tspan")!).fill
      const actorBackground = getComputedStyle(sequence.querySelector("rect.actor")!).fill

      const nodeText = getComputedStyle(flowchart.querySelector(".nodeLabel")!).color
      const nodeBackground = getComputedStyle(
        flowchart.querySelector(".node .label-container")!,
      ).fill
      const flowchartLine = getComputedStyle(flowchart.querySelector(".flowchart-link")!).stroke
      const flowchartContainer = flowchart.closest("pre.mermaid")
      const flowchartBackground = getComputedStyle(flowchartContainer!).backgroundColor

      return {
        messageText: ratio(messageText, sequenceBackground),
        messageLine: ratio(messageLine, sequenceBackground),
        actorText: ratio(actorText, actorBackground),
        nodeText: ratio(nodeText, nodeBackground),
        flowchartLine: ratio(flowchartLine, flowchartBackground),
        darkMessageFill: messageText,
      }
    })

    expect(contrast.darkMessageFill).not.toBe(lightMessageFill)
    expect(contrast.messageText).toBeGreaterThanOrEqual(4.5)
    expect(contrast.actorText).toBeGreaterThanOrEqual(4.5)
    expect(contrast.nodeText).toBeGreaterThanOrEqual(4.5)
    expect(contrast.messageLine).toBeGreaterThanOrEqual(3)
    expect(contrast.flowchartLine).toBeGreaterThanOrEqual(3)

    await sequenceDiagram.screenshot({
      path: path.join(artifactRoot, `sequence-dark-${testInfo.project.name}.png`),
    })

    const firstFlowchart = page.locator(
      'pre.mermaid:has(svg[aria-roledescription="flowchart-v2"])',
    ).first()
    await firstFlowchart.scrollIntoViewIfNeeded()
    await firstFlowchart.screenshot({
      path: path.join(artifactRoot, `flowchart-dark-${testInfo.project.name}.png`),
    })

    expect(consoleErrors).toEqual([])
  })
})
