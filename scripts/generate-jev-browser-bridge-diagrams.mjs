import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const imageDir = path.join(root, "public/images/blog/jev-browser-bridge")
const downloadDir = path.join(root, "public/downloads")
fs.mkdirSync(imageDir, { recursive: true })

const palette = {
  ink: "#172033",
  muted: "#566174",
  paper: "#fbfaf5",
  grid: "#e7e2d5",
  blue: "#dce8ff",
  blueStroke: "#4f6fad",
  green: "#dcf3e5",
  greenStroke: "#3f8460",
  amber: "#fff0c9",
  amberStroke: "#a97921",
  rose: "#ffe1de",
  roseStroke: "#a45350",
  purple: "#e9e1ff",
  purpleStroke: "#7459a8",
}

const diagrams = [
  {
    slug: "jev-bridge-loop",
    title: "The loop: Jev picks a number, code does the rest",
    subtitle:
      "One decision per turn. The model never sees a selector, a coordinate, or a line of JavaScript.",
    nodes: [
      {
        id: "agent", x: 48, y: 180, w: 240, h: 210, fill: palette.blue, stroke: palette.blueStroke,
        label: "Jev agent",
        lines: ["holds the goal", "chooses ONE action", "from the menu it", "was handed", "→ CLICK [7]"],
      },
      {
        id: "snapshot", x: 358, y: 180, w: 240, h: 210, fill: palette.amber, stroke: palette.amberStroke,
        label: "snapshot.js",
        lines: ["runs in the page", "builds the element", "table it can see", "", "[1] Search  [2] Go", "[3] link Active"],
      },
      {
        id: "bridge", x: 668, y: 180, w: 240, h: 210, fill: palette.green, stroke: palette.greenStroke,
        label: "BridgeBrowser",
        lines: ["re-checks the chosen", "node is still there,", "stamps a one-use", "attribute on it,", "", "then hands a selector", "to the transport"],
      },
      {
        id: "chrome", x: 978, y: 180, w: 240, h: 210, fill: palette.purple, stroke: palette.purpleStroke,
        label: "Your Chrome",
        lines: ["the tab you already", "have open", "", "real click,", "real typing,", "real scroll"],
      },
    ],
    arrows: [
      { from: [288, 260], to: [358, 260], label: "observe", labelDx: 0, labelDy: -30 },
      { from: [598, 260], to: [668, 260], label: "decide", labelDx: 0, labelDy: -30 },
      { from: [908, 260], to: [978, 260], label: "act", labelDx: 0, labelDy: -30 },
      { from: [1098, 470], to: [168, 470], dashed: true, label: "the page changed → observe again", labelDy: 34 },
    ],
    footer:
      "The model's whole output is an index it saw. Everything that touches the browser is code-owned. Evidence date: 20 Sep 2026.",
  },
  {
    slug: "jev-transport-swap",
    title: "One interface, two transports",
    subtitle:
      "navigate · evaluate · click · fill · key · scroll. Swap the implementation, keep the loop identical.",
    nodes: [
      {
        id: "iface", x: 470, y: 96, w: 340, h: 128, fill: palette.purple, stroke: palette.purpleStroke,
        label: "Transport interface",
        lines: ["navigate · evaluate · click", "fill · key · scroll"],
      },
      {
        id: "relay", x: 130, y: 270, w: 440, h: 225, fill: palette.blue, stroke: palette.blueStroke,
        label: "Browser Relay",
        lines: ["one CLI call per action", "browser-relay click \"<sel>\" --tab t_X", "", "local relay server on :18795", "⇄ WebSocket ⇄ MV3 extension", "⇄ chrome.debugger ⇄ the tab"],
      },
      {
        id: "playwriter", x: 710, y: 270, w: 440, h: 225, fill: palette.green, stroke: palette.greenStroke,
        label: "Playwriter",
        lines: ["one CLI call per action", "playwriter -s 3 -e \"await page...\"", "", "persistent session, held open", "materialises a Playwright page", "object over the same tab"],
      },
      {
        id: "chrome", x: 470, y: 520, w: 340, h: 124, fill: palette.amber, stroke: palette.amberStroke,
        label: "The same Chrome",
        lines: ["profile, cookies, logins"],
      },
    ],
    arrows: [
      { from: [560, 224], to: [350, 270], label: "browser-relay", labelDx: -70, labelDy: 22 },
      { from: [720, 224], to: [930, 270], label: "playwriter", labelDx: 70, labelDy: 22 },
      { from: [360, 495], to: [380, 520], label: "drives", labelDy: -6 },
      { from: [920, 495], to: [900, 520], label: "drives", labelDy: -6 },
    ],
    footer:
      "The bridge does not know which transport it holds. That is what made the two runs comparable. Evidence date: 20 Sep 2026.",
  },
  {
    slug: "jev-stale-target-guard",
    title: "Why the model cannot click the wrong button",
    subtitle:
      "Four checks run between the decision and the input. Any failure means re-observe, never guess.",
    nodes: [
      {
        id: "decide", x: 48, y: 250, w: 270, h: 150, fill: palette.blue, stroke: palette.blueStroke,
        label: "Jev says CLICK [7]",
        lines: ["[7] was true when it", "observed the page"],
      },
      {
        id: "c1", x: 390, y: 132, w: 390, h: 110, fill: palette.amber, stroke: palette.amberStroke,
        label: "1 · still the same page?",
        lines: ["page key + scroll + fields"],
      },
      {
        id: "c2", x: 390, y: 262, w: 390, h: 110, fill: palette.amber, stroke: palette.amberStroke,
        label: "2 · still the same node?",
        lines: ["connected, enabled, visible"],
      },
      {
        id: "c3", x: 390, y: 392, w: 390, h: 110, fill: palette.amber, stroke: palette.amberStroke,
        label: "3 · is anything on top of it?",
        lines: ["hit-test at its centre"],
      },
      {
        id: "c4", x: 390, y: 522, w: 390, h: 110, fill: palette.amber, stroke: palette.amberStroke,
        label: "4 · stamp and act",
        lines: ["one-use attribute → selector"],
      },
      {
        id: "act", x: 930, y: 250, w: 280, h: 150, fill: palette.green, stroke: palette.greenStroke,
        label: "Execute once",
        lines: ["the attribute is", "removed after use"],
      },
      {
        id: "stale", x: 930, y: 470, w: 280, h: 150, fill: palette.rose, stroke: palette.roseStroke,
        label: "StalePage",
        lines: ["nothing is clicked", "observe again"],
      },
    ],
    arrows: [
      { from: [318, 300], to: [390, 187], label: "check", labelDx: -18, labelDy: -14 },
      { from: [585, 242], to: [585, 262] },
      { from: [585, 372], to: [585, 392] },
      { from: [585, 502], to: [585, 522] },
      { from: [785, 590], to: [930, 350], label: "all four pass", labelDx: -60, labelDy: 76 },
      { from: [785, 440], to: [930, 540], dashed: true, label: "any one fails", labelDx: 32, labelDy: -30 },
    ],
    footer:
      "A covered or moved target becomes a failed decision, not a wrong click. Evidence date: 20 Sep 2026.",
  },
]

function esc(value) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
}

function svgFor(diagram) {
  const arrowSvg = diagram.arrows
    .map((arrow) => {
      const [x1, y1] = arrow.from
      const [x2, y2] = arrow.to
      const dash = arrow.dashed ? ' stroke-dasharray="10 9"' : ""
      const start = arrow.both ? ' marker-start="url(#arrowStart)"' : ""
      const labelX = (x1 + x2) / 2 + (arrow.labelDx || 0)
      const labelY = (y1 + y2) / 2 - 9 + (arrow.labelDy || 0)
      return `<g><path d="M ${x1} ${y1} C ${(x1 + x2) / 2} ${y1}, ${(x1 + x2) / 2} ${y2}, ${x2} ${y2}" fill="none" stroke="${palette.ink}" stroke-width="2.5"${dash}${start} marker-end="url(#arrowEnd)" class="rough"/>${
        arrow.label
          ? `<text x="${labelX}" y="${labelY}" text-anchor="middle" class="arrow-label">${esc(arrow.label)}</text>`
          : ""
      }</g>`
    })
    .join("\n")

  const nodeSvg = diagram.nodes
    .map((node, index) => {
      const labelY = node.y + 43
      const lineStart = labelY + 36
      const lines = node.lines
        .map(
          (line, lineIndex) =>
            `<text x="${node.x + node.w / 2}" y="${lineStart + lineIndex * 25}" text-anchor="middle" class="body">${esc(line)}</text>`,
        )
        .join("\n")
      return `<g transform="rotate(${index % 2 === 0 ? -0.25 : 0.25} ${node.x + node.w / 2} ${node.y + node.h / 2})"><rect x="${node.x}" y="${node.y}" width="${node.w}" height="${node.h}" rx="18" fill="${node.fill}" stroke="${node.stroke}" stroke-width="3" class="rough"/><rect x="${node.x + 5}" y="${node.y + 5}" width="${node.w - 10}" height="${node.h - 10}" rx="14" fill="none" stroke="${node.stroke}" stroke-opacity=".22" stroke-width="1.5"/><text x="${node.x + node.w / 2}" y="${labelY}" text-anchor="middle" class="node-title">${esc(node.label)}</text>${lines}</g>`
    })
    .join("\n")

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" role="img" aria-labelledby="title desc">
  <title id="title">${esc(diagram.title)}</title>
  <desc id="desc">${esc(diagram.subtitle)}</desc>
  <defs>
    <pattern id="dots" width="28" height="28" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.1" fill="${palette.grid}"/></pattern>
    <filter id="wobble" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="2" seed="11" result="noise"/><feDisplacementMap in="SourceGraphic" in2="noise" scale="0.85"/></filter>
    <marker id="arrowEnd" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto"><path d="M 0 0 L 9 5 L 0 10 z" fill="${palette.ink}"/></marker>
    <marker id="arrowStart" markerWidth="10" markerHeight="10" refX="2" refY="5" orient="auto-start-reverse"><path d="M 10 0 L 1 5 L 10 10 z" fill="${palette.ink}"/></marker>
    <style>
      .rough { filter: url(#wobble); }
      .title { font: 700 34px Georgia, serif; fill: ${palette.ink}; }
      .subtitle { font: 18px Georgia, serif; fill: ${palette.muted}; }
      .node-title { font: 700 24px "Comic Sans MS", "Bradley Hand", cursive; fill: ${palette.ink}; }
      .body { font: 17px "Comic Sans MS", "Bradley Hand", cursive; fill: ${palette.ink}; }
      .arrow-label { font: 14px "Comic Sans MS", "Bradley Hand", cursive; fill: ${palette.muted}; paint-order: stroke; stroke: ${palette.paper}; stroke-width: 7px; }
      .footer { font: 16px Georgia, serif; font-style: italic; fill: ${palette.muted}; }
    </style>
  </defs>
  <rect width="1280" height="720" fill="${palette.paper}"/>
  <rect width="1280" height="720" fill="url(#dots)" opacity=".68"/>
  <path d="M 48 101 C 330 98, 580 105, 846 100 S 1125 103, 1230 99" fill="none" stroke="${palette.ink}" stroke-width="2" stroke-opacity=".18" class="rough"/>
  <text x="48" y="60" class="title">${esc(diagram.title)}</text>
  <text x="48" y="91" class="subtitle">${esc(diagram.subtitle)}</text>
  ${arrowSvg}
  ${nodeSvg}
  <path d="M 48 674 C 360 670, 620 678, 950 672 S 1160 675, 1230 671" fill="none" stroke="${palette.ink}" stroke-width="1.5" stroke-opacity=".18" class="rough"/>
  <text x="640" y="700" text-anchor="middle" class="footer">${esc(diagram.footer)}</text>
</svg>`.replace(/^[ \t]+$/gm, "")
}

let elementCounter = 0
function baseElement(type, x, y, width, height, seed) {
  elementCounter += 1
  return {
    id: `jev-${elementCounter.toString(36)}-${seed}`,
    type, x, y, width, height, angle: 0,
    strokeColor: palette.ink,
    backgroundColor: "transparent",
    fillStyle: "solid",
    strokeWidth: 2,
    strokeStyle: "solid",
    roughness: 1,
    opacity: 100,
    groupIds: [],
    frameId: null,
    roundness: type === "rectangle" ? { type: 3 } : null,
    seed,
    version: 1,
    versionNonce: seed * 11,
    isDeleted: false,
    boundElements: [],
    updated: 1790000000000,
    link: null,
    locked: false,
  }
}

function excalidrawFor(diagram) {
  elementCounter = 0
  const elements = []
  const text = (t, x, y, size, color = palette.ink) => {
    const width = Math.max(80, t.length * size * 0.56)
    const el = baseElement("text", x, y, width, size * 1.25, 10000 + elementCounter)
    elements.push({ ...el, text: t, fontSize: size, fontFamily: 1, textAlign: "left", verticalAlign: "top", containerId: null, originalText: t, autoResize: true, lineHeight: 1.25 })
  }
  const rect = (x, y, w, h, fill, stroke, seed) => {
    const el = baseElement("rectangle", x, y, w, h, seed)
    elements.push({ ...el, strokeColor: stroke, backgroundColor: fill, strokeWidth: 3 })
  }
  const arrow = (x1, y1, x2, y2, seed, dashed = false) => {
    const el = baseElement("arrow", Math.min(x1, x2), Math.min(y1, y2), Math.abs(x2 - x1), Math.abs(y2 - y1), seed)
    elements.push({ ...el, strokeStyle: dashed ? "dashed" : "solid", points: [[0, 0], [x2 - x1, y2 - y1]], startBinding: null, endBinding: null, lastCommittedPoint: null, startArrowhead: null, endArrowhead: "arrow", elbowed: false })
  }

  text(diagram.title, 48, 36, 30)
  text(diagram.subtitle, 48, 78, 16, palette.muted)
  for (const node of diagram.nodes) {
    rect(node.x, node.y, node.w, node.h, node.fill, node.stroke, 30 + elementCounter)
    text(node.label, node.x + 18, node.y + 16, 20)
    node.lines.forEach((line, i) => text(line, node.x + 18, node.y + 50 + i * 24, 15, palette.muted))
  }
  for (const a of diagram.arrows) {
    arrow(a.from[0], a.from[1], a.to[0], a.to[1], 60 + elementCounter, !!a.dashed)
    if (a.label) {
      const lx = (a.from[0] + a.to[0]) / 2
      const ly = (a.from[1] + a.to[1]) / 2 - 22
      text(a.label, lx, ly, 14, palette.muted)
    }
  }
  text(diagram.footer, 48, 668, 14, palette.muted)

  return (
    JSON.stringify(
      { type: "excalidraw", version: 2, source: "https://excalidraw.com", elements, appState: { gridSize: null, viewBackgroundColor: palette.paper }, files: {} },
      null,
      2,
    ) + "\n"
  )
}

for (const diagram of diagrams) {
  fs.writeFileSync(path.join(imageDir, `${diagram.slug}.svg`), svgFor(diagram))
  fs.writeFileSync(path.join(downloadDir, `${diagram.slug}.excalidraw`), excalidrawFor(diagram))
  console.log("wrote", diagram.slug)
}
console.log(`Generated ${diagrams.length} SVG diagrams and ${diagrams.length} editable Excalidraw sources.`)
