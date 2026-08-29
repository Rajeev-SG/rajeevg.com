import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const imageDir = path.join(root, "public/images/solutions")
const downloadDir = path.join(root, "public/downloads")
fs.mkdirSync(imageDir, { recursive: true })
fs.mkdirSync(downloadDir, { recursive: true })

const palette = {
  ink: "#172033", muted: "#566174", paper: "#fbfaf5", grid: "#e7e2d5",
  blue: "#dce8ff", blueStroke: "#4f6fad",
  green: "#dcf3e5", greenStroke: "#3f8460",
  amber: "#fff0c9", amberStroke: "#a97921",
  rose: "#ffe1de", roseStroke: "#a45350",
  purple: "#e9e1ff", purpleStroke: "#7459a8",
}

// Each diagram: title, subtitle, lastUpdated (real evidence date), nodes, arrows, footer
const diagrams = [
  {
    slug: "agent-operations-control-plane",
    title: "Agent Operations Control Plane",
    subtitle: "Who keeps the fleet running when I am not looking.",
    lastUpdated: "2026-08-29",
    nodes: [
      { x: 70, y: 170, w: 320, h: 165, fill: "blue", label: "launchd", lines: ["starts each agent", "restarts on crash", "runs on this Mac"] },
      { x: 480, y: 170, w: 320, h: 165, fill: "green", label: "Ops board", lines: ["Semaphore view", "state of every service", "what changed and when"] },
      { x: 890, y: 170, w: 320, h: 165, fill: "amber", label: "Alertmanager", lines: ["alarms on drift", "routes to Telegram", "silence when handled"] },
      { x: 480, y: 430, w: 320, h: 165, fill: "rose", label: "Runbooks", lines: ["SOPs per failure mode", "recovery paths", "kept next to the alarms"] },
    ],
    arrows: [
      { from: [390, 252], to: [480, 252], label: "state" },
      { from: [800, 252], to: [890, 252], label: "alerts" },
      { from: [640, 335], to: [640, 430], label: "recover" },
    ],
    footer: "Evidence date: 29 Aug 2026  ·  the plane runs from launchd to runbook without leaving the Mac",
  },
  {
    slug: "coding-agent-observatory",
    title: "Coding Agent Observatory",
    subtitle: "Session stores become public truth and a private control room.",
    lastUpdated: "2026-08-28",
    nodes: [
      { x: 60, y: 190, w: 330, h: 170, fill: "blue", label: "Local session stores", lines: ["Codex · Claude Code", "Hermes · OMP", "OpenClaw · OpenCode"] },
      { x: 480, y: 190, w: 330, h: 170, fill: "purple", label: "Normaliser", lines: ["deduplicates cumulative counters", "never shows unknown as zero"] },
      { x: 900, y: 120, w: 320, h: 140, fill: "green", label: "Public summary", lines: ["tokenmaxxing.rajeevg.com", "allowlisted totals only"] },
      { x: 900, y: 320, w: 320, h: 140, fill: "amber", label: "Private Grafana", lines: ["full detail", "provider and session level"] },
    ],
    arrows: [
      { from: [390, 275], to: [480, 275], label: "JSONL/SQLite" },
      { from: [810, 250], to: [900, 190], label: "publish" },
      { from: [810, 300], to: [900, 390], label: "full detail" },
    ],
    footer: "Evidence date: 28 Aug 2026  ·  public numbers come from the same pipeline as the private room",
  },
  {
    slug: "agent-routing-and-lifecycle-system",
    title: "Agent Routing and Lifecycle",
    subtitle: "The cheap workhorse first. Frontier help when the work is genuinely hard.",
    lastUpdated: "2026-08-29",
    nodes: [
      { x: 80, y: 200, w: 300, h: 160, fill: "blue", label: "Request", lines: ["from user or another agent"] },
      { x: 470, y: 200, w: 330, h: 160, fill: "purple", label: "Routing rule", lines: ["role-aware model choice", "hard? escalate", "cheap? workhorse"] },
      { x: 900, y: 120, w: 310, h: 130, fill: "green", label: "GLM-5.3-Flash", lines: ["default workhorse", "measured cost and speed"] },
      { x: 900, y: 320, w: 310, h: 130, fill: "amber", label: "Frontier model", lines: ["hard architecture only", "bounded delegation"] },
    ],
    arrows: [
      { from: [380, 280], to: [470, 280], label: "route" },
      { from: [800, 250], to: [900, 185], label: "cheap" },
      { from: [800, 310], to: [900, 385], label: "escalate" },
    ],
    footer: "Evidence date: 29 Aug 2026  ·  A2A agent cards make discovery a capability, not a shim",
  },
  {
    slug: "global-measurement-governance-system",
    title: "Global Measurement Governance",
    subtitle: "One contract for taxonomy, QA and reconciliation across markets.",
    lastUpdated: "2026-08-29",
    nodes: [
      { x: 70, y: 180, w: 330, h: 170, fill: "blue", label: "Taxonomy contract", lines: ["events and properties", "named owners per market"] },
      { x: 480, y: 180, w: 320, h: 170, fill: "green", label: "Automated QA", lines: ["live implementation vs contract", "consent-aware checks"] },
      { x: 890, y: 180, w: 320, h: 170, fill: "amber", label: "Reconciliation", lines: ["GA4 · BigQuery · vendor", "backend truth"] },
      { x: 480, y: 430, w: 320, h: 150, fill: "rose", label: "Review gates", lines: ["nothing ships unreviewed", "decisions stay accountable"] },
    ],
    arrows: [
      { from: [400, 265], to: [480, 265], label: "define" },
      { from: [800, 265], to: [890, 265], label: "compare" },
      { from: [640, 350], to: [640, 430], label: "gate" },
    ],
    footer: "Evidence date: 29 Aug 2026  ·  described anonymised from live agency work",
  },
  {
    slug: "media-qa-attribution-toolkit",
    title: "Media QA & Attribution Reconciliation",
    subtitle: "Check what actually fires before believing what platforms claim.",
    lastUpdated: "2026-08-29",
    nodes: [
      { x: 70, y: 190, w: 320, h: 165, fill: "blue", label: "Browser QA", lines: ["real consent journey", "tags and pixels recorded"] },
      { x: 480, y: 190, w: 320, h: 165, fill: "green", label: "Observed vs claimed", lines: ["what fired", "what the platform says"] },
      { x: 890, y: 190, w: 320, h: 165, fill: "amber", label: "Reconciliation", lines: ["source-of-truth comparison", "spend decisions with evidence"] },
      { x: 480, y: 430, w: 320, h: 150, fill: "rose", label: "Proof pack", lines: ["editable deliverable", "provenance visible"] },
    ],
    arrows: [
      { from: [390, 272], to: [480, 272], label: "observe" },
      { from: [800, 272], to: [890, 272], label: "reconcile" },
      { from: [640, 355], to: [640, 430], label: "publish" },
    ],
    footer: "Evidence date: 29 Aug 2026  ·  consent-aware QA from real browser runs",
  },
  {
    slug: "ai-assisted-product-definition-system",
    title: "AI-Assisted Product Definition",
    subtitle: "Messy context in. Scoped, reviewable decisions out.",
    lastUpdated: "2026-08-29",
    nodes: [
      { x: 70, y: 190, w: 320, h: 165, fill: "blue", label: "Source material", lines: ["calls · decks · docs", "commercial context"] },
      { x: 480, y: 190, w: 320, h: 165, fill: "purple", label: "Knowledge layer", lines: ["structured, governed", "traceable to source"] },
      { x: 890, y: 190, w: 320, h: 165, fill: "green", label: "Definition output", lines: ["PRD · plan · scope", "open questions explicit"] },
      { x: 480, y: 430, w: 320, h: 150, fill: "amber", label: "Decision gate", lines: ["review before build", "no generic document"] },
    ],
    arrows: [
      { from: [390, 272], to: [480, 272], label: "structure" },
      { from: [800, 272], to: [890, 272], label: "produce" },
      { from: [640, 355], to: [640, 430], label: "gate" },
    ],
    footer: "Evidence date: 29 Aug 2026  ·  anonymised from agency scoping work",
  },
  {
    slug: "model-routing-performance-lab",
    title: "Model Routing Performance Lab",
    subtitle: "Same task, different routing. Measured, not assumed.",
    lastUpdated: "2026-08-28",
    nodes: [
      { x: 90, y: 200, w: 300, h: 165, fill: "blue", label: "Identical task", lines: ["controlled harness", "same input every run"] },
      { x: 480, y: 200, w: 320, h: 165, fill: "purple", label: "Routing policies", lines: ["GLM-5.3-Flash", "frontier fallback"] },
      { x: 890, y: 200, w: 300, h: 165, fill: "green", label: "Measured result", lines: ["client timing", "provider telemetry", "cost per outcome"] },
      { x: 480, y: 430, w: 320, h: 150, fill: "amber", label: "Decision", lines: ["routing rule updated", "from data"] },
    ],
    arrows: [
      { from: [390, 282], to: [480, 282], label: "run" },
      { from: [800, 282], to: [890, 282], label: "measure" },
      { from: [800, 380], to: [640, 430], label: "compare" },
    ],
    footer: "Evidence date: 28 Aug 2026  ·  benchmark pairs client timing with provider telemetry",
  },
  {
    slug: "local-llm-lab",
    title: "Local LLM Lab",
    subtitle: "What is installed, what it is good at, what it costs to run.",
    lastUpdated: "2026-08-20",
    nodes: [
      { x: 90, y: 190, w: 330, h: 175, fill: "blue", label: "Model inventories", lines: ["Hugging Face · Ollama", "MLX · Apple"] },
      { x: 480, y: 190, w: 320, h: 175, fill: "purple", label: "Benchmark join", lines: ["checked-in results", "exact revisions kept separate"] },
      { x: 890, y: 190, w: 310, h: 175, fill: "green", label: "Static guide", lines: ["quality · speed · memory", "context length"] },
    ],
    arrows: [
      { from: [420, 278], to: [480, 278], label: "inspect" },
      { from: [800, 278], to: [890, 278], label: "publish" },
    ],
    footer: "Evidence date: 20 Aug 2026  ·  local-llm-lab.vercel.app · open source on GitHub",
  },
  {
    slug: "open-gtm-index",
    title: "Open GTM Index",
    subtitle: "Open-source alternatives with a scoring method you can check.",
    lastUpdated: "2026-07-20",
    nodes: [
      { x: 90, y: 190, w: 330, h: 175, fill: "blue", label: "Public project facts", lines: ["GitHub metadata", "licence · activity"] },
      { x: 480, y: 190, w: 320, h: 175, fill: "purple", label: "Documented scoring", lines: ["published weights", "checked-in workbook"] },
      { x: 890, y: 190, w: 310, h: 175, fill: "green", label: "Ranked guide", lines: ["category leaders", "replacement suggestions"] },
    ],
    arrows: [
      { from: [420, 278], to: [480, 278], label: "score" },
      { from: [800, 278], to: [890, 278], label: "publish" },
    ],
    footer: "Evidence date: 20 Jul 2026  ·  open-gtm-index.vercel.app · open source on GitHub",
  },
  {
    slug: "model-intelligence-maintainer",
    title: "Model Intelligence Maintainer",
    subtitle: "Which model, for what, at what cost. Maintained, not guessed.",
    lastUpdated: "2026-07-10",
    nodes: [
      { x: 90, y: 190, w: 330, h: 175, fill: "blue", label: "Benchmark sources", lines: ["OpenRouter · Artificial Analysis", "Vals · LiveBench"] },
      { x: 480, y: 190, w: 320, h: 175, fill: "purple", label: "Normalise", lines: ["deterministic datasets", "provenance visible"] },
      { x: 890, y: 190, w: 310, h: 175, fill: "green", label: "Workbook + guide", lines: ["presets and fits", "deployed static site"] },
    ],
    arrows: [
      { from: [420, 278], to: [480, 278], label: "refresh" },
      { from: [800, 278], to: [890, 278], label: "publish" },
    ],
    footer: "Evidence date: 10 Jul 2026  ·  open source on GitHub",
  },
  {
    slug: "creative-observatory",
    title: "Creative Observatory",
    subtitle: "Evidence and the next decision, kept together.",
    lastUpdated: "2026-06-15",
    nodes: [
      { x: 90, y: 190, w: 330, h: 175, fill: "blue", label: "Ad-library evidence", lines: ["brand coverage", "creative · trust cues"] },
      { x: 480, y: 190, w: 320, h: 175, fill: "purple", label: "Typed pipeline", lines: ["Prisma data contracts", "stored vs live vs demo"] },
      { x: 890, y: 190, w: 310, h: 175, fill: "green", label: "Review workflow", lines: ["inspector tables", "briefing exports"] },
    ],
    arrows: [
      { from: [420, 278], to: [480, 278], label: "structure" },
      { from: [800, 278], to: [890, 278], label: "review" },
    ],
    footer: "Evidence date: 15 Jun 2026  ·  creative-observatory.vercel.app",
  },
  {
    slug: "hackathon-voting-app",
    title: "Hackathon Voting App",
    subtitle: "One screen a live room can trust.",
    lastUpdated: "2026-05-30",
    nodes: [
      { x: 90, y: 190, w: 330, h: 175, fill: "blue", label: "Manager setup", lines: ["XLSX team upload", "self-vote blocking"] },
      { x: 480, y: 190, w: 320, h: 175, fill: "purple", label: "Judging", lines: ["one locked score per judge", "remaining-votes tracker"] },
      { x: 890, y: 190, w: 310, h: 175, fill: "green", label: "Scoreboard + reporting", lines: ["public scoreboard", "GA4 · BigQuery event data"] },
    ],
    arrows: [
      { from: [420, 278], to: [480, 278], label: "configure" },
      { from: [800, 278], to: [890, 278], label: "publish" },
    ],
    footer: "Evidence date: 30 May 2026  ·  vote.rajeevg.com · open source on GitHub",
  },
  {
    slug: "agent-orchestra",
    title: "Agent Orchestra",
    subtitle: "Coordinated agents around a shared task, not a prompt loop.",
    lastUpdated: "2026-05-01",
    nodes: [
      { x: 90, y: 190, w: 330, h: 175, fill: "blue", label: "Shared task", lines: ["one goal,", "not four prompts"] },
      { x: 480, y: 190, w: 320, h: 175, fill: "purple", label: "Coordination pattern", lines: ["each agent contributes", "what it is best at"] },
      { x: 890, y: 190, w: 310, h: 175, fill: "green", label: "Demonstration", lines: ["public demo", "shows the interaction"] },
    ],
    arrows: [
      { from: [420, 278], to: [480, 278], label: "distribute" },
      { from: [800, 278], to: [890, 278], label: "show" },
    ],
    footer: "Evidence date: 1 May 2026  ·  multi-agent-orchestration-demo.vercel.app  ·  companion to the multi-agent journey article",
  },
]

function esc(value) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
}

let elementCounter = 0
function baseElement(type, x, y, width, height, seed) {
  elementCounter += 1
  return {
    id: `sol-${elementCounter.toString(36)}-${seed}`,
    type, x, y, width, height, angle: 0,
    strokeColor: palette.ink, backgroundColor: "transparent",
    fillStyle: "solid", strokeWidth: 2, strokeStyle: "solid",
    roughness: 1, opacity: 100, groupIds: [], frameId: null,
    roundness: type === "rectangle" ? { type: 3 } : null,
    seed, version: 1, versionNonce: seed * 17, isDeleted: false,
    boundElements: [], updated: 1798700000000, link: null, locked: false,
  }
}

function textElement(text, x, y, size, color = palette.ink, align = "left") {
  const width = Math.max(80, text.length * size * 0.58)
  const element = baseElement("text", x, y, width, size * 1.25, 1000 + elementCounter)
  return {
    ...element, strokeColor: color, strokeWidth: 1, roughness: 0,
    text, fontSize: size, fontFamily: 1, textAlign: align, verticalAlign: "top",
    containerId: null, originalText: text, autoResize: true, lineHeight: 1.25, baseline: size,
  }
}

function svgFor(diagram) {
  const arrowSvg = diagram.arrows.map((arrow) => {
    const [x1, y1] = arrow.from
    const [x2, y2] = arrow.to
    const labelX = (x1 + x2) / 2
    const labelY = (y1 + y2) / 2 - 9
    return `<g><path d="M ${x1} ${y1} C ${(x1 + x2) / 2} ${y1}, ${(x1 + x2) / 2} ${y2}, ${x2} ${y2}" fill="none" stroke="${palette.ink}" stroke-width="2.5" marker-end="url(#arrowEnd)" class="rough"/>${arrow.label ? `<text x="${labelX}" y="${labelY}" text-anchor="middle" class="arrow-label">${esc(arrow.label)}</text>` : ""}</g>`
  }).join("\n")

  const nodeSvg = diagram.nodes.map((node) => {
    const fill = palette[node.fill] ?? palette.blue
    const stroke = palette[node.fill + "Stroke"] ?? palette.blueStroke
    const labelY = node.y + 43
    const lineStart = labelY + 36
    const lines = node.lines.map((line, i) => `<text x="${node.x + node.w / 2}" y="${lineStart + i * 25}" text-anchor="middle" class="body">${esc(line)}</text>`).join("\n")
    return `<g><rect x="${node.x}" y="${node.y}" width="${node.w}" height="${node.h}" rx="18" fill="${fill}" stroke="${stroke}" stroke-width="3" class="rough"/><rect x="${node.x + 5}" y="${node.y + 5}" width="${node.w - 10}" height="${node.h - 10}" rx="14" fill="none" stroke="${stroke}" stroke-opacity=".22" stroke-width="1.5"/><text x="${node.x + node.w / 2}" y="${labelY}" text-anchor="middle" class="node-title">${esc(node.label)}</text>${lines}</g>`
  }).join("\n")

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" role="img" aria-labelledby="title desc">
  <title id="title">${esc(diagram.title)}</title>
  <desc id="desc">${esc(diagram.subtitle)}</desc>
  <defs>
    <pattern id="dots" width="28" height="28" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.1" fill="${palette.grid}"/></pattern>
    <filter id="wobble" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="2" seed="11" result="noise"/><feDisplacementMap in="SourceGraphic" in2="noise" scale="0.85"/></filter>
    <marker id="arrowEnd" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto"><path d="M 0 0 L 9 5 L 0 10 z" fill="${palette.ink}"/></marker>
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

function excalidrawFor(diagram) {
  elementCounter = 0
  const elements = [
    textElement(diagram.title, 48, 38, 30),
    textElement(diagram.subtitle, 48, 78, 17, palette.muted),
  ]
  for (const node of diagram.nodes) {
    elements.push({
      ...baseElement("rectangle", node.x, node.y, node.w, node.h, 2000 + elementCounter),
      strokeColor: palette[node.fill + "Stroke"] ?? palette.blueStroke,
      backgroundColor: palette[node.fill] ?? palette.blue,
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
      strokeStyle: "solid",
      points: [[0, 0], [x2 - x1, y2 - y1]],
      startBinding: null, endBinding: null, lastCommittedPoint: null,
      startArrowhead: null, endArrowhead: "arrow", elbowed: false,
    })
    if (arrow.label) elements.push(textElement(arrow.label, (x1 + x2) / 2 - 42, (y1 + y2) / 2 - 26, 13, palette.muted))
  }
  elements.push(textElement(diagram.footer, 48, 675, 15, palette.muted))
  return JSON.stringify({
    type: "excalidraw", version: 2, source: "https://excalidraw.com",
    elements, appState: { gridSize: null, viewBackgroundColor: palette.paper }, files: {},
  }, null, 2) + "\n"
}

for (const diagram of diagrams) {
  fs.writeFileSync(path.join(imageDir, `${diagram.slug}.svg`), svgFor(diagram))
  fs.writeFileSync(path.join(downloadDir, `${diagram.slug}.excalidraw`), excalidrawFor(diagram))
}

console.log(`Generated ${diagrams.length} solution diagrams and ${diagrams.length} editable Excalidraw sources.`)
