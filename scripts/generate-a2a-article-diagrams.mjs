import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const imageDir = path.join(root, "public/images/blog/a2a-agent-mesh")
const downloadDir = path.join(root, "public/downloads")

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
    slug: "a2a-protocol-in-one-minute",
    title: "A2A in one minute",
    subtitle: "Discovery, one standard request, and a task you can follow to completion.",
    nodes: [
      { id: "client", x: 65, y: 175, w: 250, h: 165, fill: palette.blue, stroke: palette.blueStroke, label: "Originating agent", lines: ["1. Fetch agent card", "2. Choose a skill", "3. Send a message"] },
      { id: "card", x: 390, y: 125, w: 300, h: 115, fill: palette.amber, stroke: palette.amberStroke, label: "Agent card", lines: ["/.well-known/agent-card.json", "name · skills · endpoint"] },
      { id: "rpc", x: 390, y: 300, w: 300, h: 145, fill: palette.purple, stroke: palette.purpleStroke, label: "JSON-RPC", lines: ["message/send", "messageId + contextId", "parts: text, files, data"] },
      { id: "dest", x: 805, y: 175, w: 360, h: 270, fill: palette.green, stroke: palette.greenStroke, label: "Destination agent", lines: ["accepts the task", "does the real work", "returns its actual response", "taskId · state · artifacts"] },
    ],
    arrows: [
      { from: [315, 225], to: [390, 185], label: "GET" },
      { from: [690, 185], to: [805, 225], label: "capabilities" },
      { from: [315, 315], to: [390, 365], label: "POST" },
      { from: [690, 365], to: [805, 350], label: "task" },
    ],
    footer: "submitted → working → completed   •   stable task ID   •   response stays attributable to the destination",
  },
  {
    slug: "a2a-four-agent-mesh",
    title: "The network I proved on my Mac",
    subtitle: "Four loopback endpoints. Every agent can discover and call every other agent.",
    nodes: [
      { id: "codex", x: 465, y: 115, w: 350, h: 125, fill: palette.blue, stroke: palette.blueStroke, label: "Codex", lines: ["primary operator · 127.0.0.1:8391"] },
      { id: "openclaw", x: 80, y: 340, w: 350, h: 125, fill: palette.green, stroke: palette.greenStroke, label: "OpenClaw", lines: ["broad personal/general agent · :8392"] },
      { id: "omp", x: 850, y: 340, w: 350, h: 125, fill: palette.amber, stroke: palette.amberStroke, label: "OMP", lines: ["fast executor · :8393"] },
      { id: "hermes", x: 465, y: 525, w: 350, h: 125, fill: palette.rose, stroke: palette.roseStroke, label: "Hermes", lines: ["work and engineering · :8394"] },
      { id: "standard", x: 500, y: 320, w: 280, h: 100, fill: palette.purple, stroke: palette.purpleStroke, label: "A2A v1.0", lines: ["agent cards + JSON-RPC"] },
    ],
    arrows: [
      { from: [520, 240], to: [400, 340], both: true },
      { from: [760, 240], to: [880, 340], both: true },
      { from: [430, 402], to: [500, 370], both: true },
      { from: [780, 370], to: [850, 402], both: true },
      { from: [430, 440], to: [520, 525], both: true },
      { from: [850, 440], to: [760, 525], both: true },
    ],
    footer: "6 bidirectional links = 12 directed routes tested   •   12/12 completed   •   all listeners stayed on 127.0.0.1",
  },
  {
    slug: "a2a-edges-and-limitations",
    title: "The edges are operational, not conceptual",
    subtitle: "The protocol path works. These are the places where a production version still needs care.",
    nodes: [
      { id: "ephemeral", x: 70, y: 150, w: 515, h: 180, fill: palette.amber, stroke: palette.amberStroke, label: "Ephemeral endpoints", lines: ["The four servers launch per session.", "A login service or launchd job would make", "discovery continuously available."] },
      { id: "omp", x: 695, y: 150, w: 515, h: 180, fill: palette.blue, stroke: palette.blueStroke, label: "OMP streams chunks", lines: ["Final text is complete, but token-sized", "artifacts make raw responses noisy.", "This is cosmetic, not lost work."] },
      { id: "hermes", x: 70, y: 405, w: 515, h: 180, fill: palette.rose, stroke: palette.roseStroke, label: "Hermes executor hiccup", lines: ["One originator run hit a transient", "DaemonThreadPoolExecutor error and passed", "after the Hermes process recovered."] },
      { id: "trust", x: 695, y: 405, w: 515, h: 180, fill: palette.green, stroke: palette.greenStroke, label: "Loopback is the trust boundary", lines: ["The A2A plane has no extra authentication.", "That is acceptable on 127.0.0.1, not for", "an internet-facing listener."] },
    ],
    arrows: [],
    footer: "A2A supplies the language. Persistence, authentication, routing policy and quality control remain system decisions.",
  },
  {
    slug: "a2a-codex-coordination-hypothesis",
    title: "My coordination hypothesis",
    subtitle: "Keep the technical mesh. Add one lightweight decision rule before adding more infrastructure.",
    nodes: [
      { id: "codex", x: 425, y: 115, w: 430, h: 145, fill: palette.blue, stroke: palette.blueStroke, label: "Codex decides and unblocks", lines: ["primary delegator · not a compulsory relay", "generally not the destination"] },
      { id: "openclaw", x: 70, y: 390, w: 335, h: 150, fill: palette.green, stroke: palette.greenStroke, label: "OpenClaw", lines: ["broad capability", "personal/general default"] },
      { id: "hermes", x: 472, y: 430, w: 335, h: 150, fill: palette.rose, stroke: palette.roseStroke, label: "Hermes", lines: ["substantive work", "work/engineering default"] },
      { id: "omp", x: 875, y: 390, w: 335, h: 150, fill: palette.amber, stroke: palette.amberStroke, label: "OMP", lines: ["fast bounded work", "execution default"] },
    ],
    arrows: [
      { from: [515, 260], to: [300, 390], label: "delegate" },
      { from: [640, 260], to: [640, 430], label: "delegate" },
      { from: [765, 260], to: [980, 390], label: "delegate" },
      { from: [405, 475], to: [472, 500], both: true, dashed: true },
      { from: [807, 500], to: [875, 475], both: true, dashed: true },
      { from: [300, 390], to: [515, 260], dashed: true, label: "stuck? report evidence" },
      { from: [980, 390], to: [765, 260], dashed: true, label: "stuck? report evidence" },
    ],
    footer: "Try one reasonable alternative → report what failed and what is needed → Codex makes the decision. If Codex is unavailable, continue and log the question.",
  },
]

function esc(value) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
}

function svgFor(diagram) {
  const arrowSvg = diagram.arrows.map((arrow) => {
    const [x1, y1] = arrow.from
    const [x2, y2] = arrow.to
    const dash = arrow.dashed ? ' stroke-dasharray="10 9"' : ""
    const start = arrow.both ? ' marker-start="url(#arrowStart)"' : ""
    const labelX = (x1 + x2) / 2
    const labelY = (y1 + y2) / 2 - 9
    return `<g><path d="M ${x1} ${y1} C ${(x1 + x2) / 2} ${y1}, ${(x1 + x2) / 2} ${y2}, ${x2} ${y2}" fill="none" stroke="${palette.ink}" stroke-width="2.5"${dash}${start} marker-end="url(#arrowEnd)" class="rough"/>${arrow.label ? `<text x="${labelX}" y="${labelY}" text-anchor="middle" class="arrow-label">${esc(arrow.label)}</text>` : ""}</g>`
  }).join("\n")

  const nodeSvg = diagram.nodes.map((node, index) => {
    const labelY = node.y + 43
    const lineStart = labelY + 36
    const lines = node.lines.map((line, lineIndex) => `<text x="${node.x + node.w / 2}" y="${lineStart + lineIndex * 25}" text-anchor="middle" class="body">${esc(line)}</text>`).join("\n")
    return `<g transform="rotate(${index % 2 === 0 ? -0.25 : 0.25} ${node.x + node.w / 2} ${node.y + node.h / 2})"><rect x="${node.x}" y="${node.y}" width="${node.w}" height="${node.h}" rx="18" fill="${node.fill}" stroke="${node.stroke}" stroke-width="3" class="rough"/><rect x="${node.x + 5}" y="${node.y + 5}" width="${node.w - 10}" height="${node.h - 10}" rx="14" fill="none" stroke="${node.stroke}" stroke-opacity=".22" stroke-width="1.5"/><text x="${node.x + node.w / 2}" y="${labelY}" text-anchor="middle" class="node-title">${esc(node.label)}</text>${lines}</g>`
  }).join("\n")

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
    id: `a2a-${elementCounter.toString(36)}-${seed}`,
    type,
    x, y, width, height, angle: 0,
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
    versionNonce: seed * 17,
    isDeleted: false,
    boundElements: [],
    updated: 1788002400000,
    link: null,
    locked: false,
  }
}

function textElement(text, x, y, size, color = palette.ink, align = "left") {
  const width = Math.max(80, text.length * size * 0.58)
  const element = baseElement("text", x, y, width, size * 1.25, 1000 + elementCounter)
  return {
    ...element,
    strokeColor: color,
    strokeWidth: 1,
    roughness: 0,
    text,
    fontSize: size,
    fontFamily: 1,
    textAlign: align,
    verticalAlign: "top",
    containerId: null,
    originalText: text,
    autoResize: true,
    lineHeight: 1.25,
    baseline: size,
  }
}

function excalidrawFor(diagram) {
  elementCounter = 0
  const elements = [
    textElement(diagram.title, 48, 38, 30),
    textElement(diagram.subtitle, 48, 78, 17, palette.muted),
  ]
  for (const node of diagram.nodes) {
    elements.push({
      ...baseElement("rectangle", node.x, node.y, node.w, node.h, 2000 + elementCounter),
      strokeColor: node.stroke,
      backgroundColor: node.fill,
      strokeWidth: 3,
    })
    elements.push(textElement(node.label, node.x + 22, node.y + 22, 22))
    node.lines.forEach((line, index) => elements.push(textElement(line, node.x + 22, node.y + 59 + index * 24, 15, palette.ink)))
  }
  for (const arrow of diagram.arrows) {
    const [x1, y1] = arrow.from
    const [x2, y2] = arrow.to
    const element = baseElement("arrow", x1, y1, Math.abs(x2 - x1), Math.abs(y2 - y1), 3000 + elementCounter)
    elements.push({
      ...element,
      strokeStyle: arrow.dashed ? "dashed" : "solid",
      points: [[0, 0], [x2 - x1, y2 - y1]],
      startBinding: null,
      endBinding: null,
      lastCommittedPoint: null,
      startArrowhead: arrow.both ? "arrow" : null,
      endArrowhead: "arrow",
      elbowed: false,
    })
    if (arrow.label) elements.push(textElement(arrow.label, (x1 + x2) / 2 - 42, (y1 + y2) / 2 - 26, 13, palette.muted))
  }
  elements.push(textElement(diagram.footer, 48, 675, 15, palette.muted))
  return JSON.stringify({
    type: "excalidraw",
    version: 2,
    source: "https://excalidraw.com",
    elements,
    appState: { gridSize: null, viewBackgroundColor: palette.paper },
    files: {},
  }, null, 2) + "\n"
}

for (const diagram of diagrams) {
  fs.writeFileSync(path.join(imageDir, `${diagram.slug}.svg`), svgFor(diagram))
  fs.writeFileSync(path.join(downloadDir, `${diagram.slug}.excalidraw`), excalidrawFor(diagram))
}

console.log(`Generated ${diagrams.length} SVG diagrams and ${diagrams.length} editable Excalidraw sources.`)
