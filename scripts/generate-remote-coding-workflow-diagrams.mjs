import fs from "node:fs"
import path from "node:path"

// Generates the diagrams for the remote coding workflow article (issue #116).
// Each figure is authored once as layout data and emitted twice:
//   1. a genuine, editable .excalidraw source  -> public/downloads/
//   2. a static web-ready SVG export           -> public/images/blog/remote-coding-workflow/
// No runtime dependency for the site: both outputs are plain static files.

const root = process.cwd()
const imageDir = path.join(root, "public/images/blog/remote-coding-workflow")
const dlDir = path.join(root, "public/downloads")
fs.mkdirSync(imageDir, { recursive: true })
fs.mkdirSync(dlDir, { recursive: true })

// Palette (matches the site's recent diagram exports: warm paper, dark ink)
const PAPER = "#F7F5F0"
const INK = "#12213D"
const BODY = "#5A6479"
const BLUE = "#2B5FD9"
const BLUE_BG = "#EEF2FD"
const TEAL = "#1E8F86"
const TEAL_BG = "#E9F5F3"
const AMBER = "#A9670F"
const AMBER_STROKE = "#D98A2B"
const AMBER_BG = "#FFF7EC"
const MUTED_STROKE = "#8B93A3"
const MUTED_BG = "#F1EEE7"

const esc = (v) => v.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")

// Approximate text width so centered titles land sensibly in both formats.
const estWidth = (text, fontSize, bold = false) =>
  text.length * fontSize * (bold ? 0.62 : 0.56)

// ---------------------------------------------------------------------------
// Figure definitions
// ---------------------------------------------------------------------------

const figures = [
  // =========================================================================
  // Figure 1 — end-to-end control and data flow
  // =========================================================================
  {
    name: "remote-coding-workflow-end-to-end",
    svgTitle:
      "One loop: ChatGPT plans, GitHub remembers, a local GLM worker ships",
    svgDesc:
      "End-to-end control and data flow. You discuss and plan with ChatGPT, which creates a GitHub issue and launches a worker session through Remote Desktop Commander. The OMP worker on GLM-5.3-Flash via OpenRouter reads the issue, implements, validates, commits and pushes an issue-linked branch, and opens a pull request. ChatGPT reviews the diff and evidence, merges, and the result returns to you. GitHub is the only durable state in the loop.",
    width: 1600,
    height: 810,
    nodes: [
      {
        id: "you",
        x: 60,
        y: 170,
        w: 240,
        h: 140,
        title: "You",
        lines: ["describe the outcome,", "review the plan"],
        stroke: INK,
        bg: "#FFFFFF",
      },
      {
        id: "chatgpt",
        x: 450,
        y: 170,
        w: 250,
        h: 140,
        title: "ChatGPT (controller)",
        lines: ["plan · file issues", "launch · review · merge"],
        stroke: BLUE,
        bg: BLUE_BG,
      },
      {
        id: "gissue",
        x: 850,
        y: 170,
        w: 280,
        h: 140,
        title: "GitHub issue",
        lines: ["scope + acceptance criteria", "the durable task state"],
        stroke: AMBER_STROKE,
        bg: AMBER_BG,
        titleColor: AMBER,
      },
      {
        id: "gpr",
        x: 1250,
        y: 170,
        w: 290,
        h: 140,
        title: "GitHub pull request",
        lines: ["issue-linked branch", "Closes #N", "the only way work lands"],
        stroke: AMBER_STROKE,
        bg: AMBER_BG,
        titleColor: AMBER,
      },
      {
        id: "rdc",
        x: 450,
        y: 560,
        w: 280,
        h: 150,
        title: "Remote Desktop\nCommander",
        lines: ["bridge to local tools;", "carries commands,", "never writes code"],
        stroke: MUTED_STROKE,
        bg: MUTED_BG,
      },
      {
        id: "worker",
        x: 850,
        y: 540,
        w: 310,
        h: 190,
        title: "OMP worker",
        lines: ["GLM-5.3-Flash via OpenRouter", "implements + validates", "commits + pushes", "never merges"],
        stroke: TEAL,
        bg: TEAL_BG,
        titleColor: TEAL,
      },
    ],
    arrows: [
      {
        pts: [[450, 200], [300, 200]],
        color: INK,
        dashed: true,
        label: "merged result",
        labelAt: [375, 186],
      },
      {
        pts: [[300, 240], [450, 240]],
        color: INK,
        label: "discuss & plan",
        labelAt: [375, 262],
      },
      {
        pts: [[700, 240], [850, 240]],
        color: BLUE,
        label: "files the issue",
        labelAt: [775, 262],
      },
      {
        pts: [[575, 310], [575, 560]],
        color: BLUE,
        label: "launches worker session",
        labelAt: [590, 440],
        labelAnchor: "start",
      },
      {
        pts: [[730, 635], [850, 635]],
        color: MUTED_STROKE,
        label: "starts session",
        labelAt: [790, 658],
      },
      {
        pts: [[990, 310], [990, 540]],
        color: AMBER_STROKE,
        label: "reads the issue",
        labelAt: [1005, 430],
        labelAnchor: "start",
      },
      {
        pts: [[1160, 635], [1395, 635], [1395, 310]],
        color: TEAL,
        label: "commits, pushes, opens PR",
        labelAt: [1277, 618],
      },
      {
        pts: [[1395, 170], [1395, 110], [575, 110], [575, 170]],
        color: AMBER_STROKE,
        label: "review the diff + evidence, merge",
        labelAt: [985, 98],
      },
    ],
    footer:
      "Solid arrows: work and commands. Dashed: the result returning to you. GitHub is the only durable state — every session in the loop is replaceable.",
  },

  // =========================================================================
  // Figure 2 — responsibility split: control plane vs worker plane
  // =========================================================================
  {
    name: "remote-coding-workflow-responsibility-split",
    svgTitle: "Who owns what: control plane, worker plane, shared memory",
    svgDesc:
      "Responsibility split. The control plane, ChatGPT on a frontier model, keeps a small context and owns judgment: scope, issues, launching workers, reviewing pull requests, deciding what merges. The worker plane, OMP on GLM-5.3-Flash, keeps a long context and owns the implementation: reading the issue, editing, validating, committing, pushing and opening the pull request. GitHub sits between the planes as shared durable memory. Issue triage, required CI checks, scheduled workers and auto-merge are deliberately not automated.",
    width: 1520,
    height: 820,
    nodes: [
      {
        id: "control",
        x: 40,
        y: 110,
        w: 660,
        h: 330,
        title: "Control plane — ChatGPT",
        lines: [
          "frontier model, small context, owns judgment",
          "",
          "· discusses scope and priorities with you",
          "· creates and updates GitHub issues",
          "· launches and observes worker sessions",
          "· reviews the PR diff and its evidence",
          "· decides what merges; closes the loop",
          "· never writes the implementation",
        ],
        stroke: BLUE,
        bg: BLUE_BG,
        align: "left",
      },
      {
        id: "worker",
        x: 820,
        y: 110,
        w: 660,
        h: 330,
        title: "Worker plane — OMP on GLM-5.3-Flash",
        lines: [
          "cheap model, long context, owns the middle",
          "",
          "· reads the issue — not the chat history",
          "· inspects the repo and implements",
          "· runs validation before committing",
          "· commits, pushes, opens the PR",
          "· reports evidence; never merges",
          "· never redefines scope",
        ],
        stroke: TEAL,
        bg: TEAL_BG,
        align: "left",
      },
      {
        id: "github",
        x: 40,
        y: 530,
        w: 1440,
        h: 120,
        title: "GitHub — the shared memory between the planes",
        lines: [
          "issues hold scope and acceptance · branches hold progress · PRs hold the review and the decision",
          "if a session dies, both planes rebuild from here — not from anyone's memory",
        ],
        stroke: AMBER_STROKE,
        bg: AMBER_BG,
        titleColor: AMBER,
      },
      {
        id: "manual",
        x: 40,
        y: 690,
        w: 1440,
        h: 90,
        title: "Deliberately not automated",
        lines: [
          "issue triage · required CI checks · scheduled workers · auto-merge — the controller stays in the loop on purpose",
        ],
        stroke: MUTED_STROKE,
        bg: MUTED_BG,
      },
    ],
    arrows: [
      {
        pts: [[370, 440], [370, 530]],
        color: BLUE,
        both: true,
        label: "issues + review targets",
        labelAt: [385, 490],
        labelAnchor: "start",
      },
      {
        pts: [[1150, 440], [1150, 530]],
        color: TEAL,
        both: true,
        label: "task spec + PRs",
        labelAt: [1165, 490],
        labelAnchor: "start",
      },
    ],
    footer: null,
  },

  // =========================================================================
  // Figure 3 — the RDC launchd / supervisor recovery pattern
  // =========================================================================
  {
    name: "remote-coding-workflow-rdc-recovery",
    svgTitle: "The bridge is supervised: launchd keeps the supervisor alive",
    svgDesc:
      "Remote Desktop Commander recovery pattern. A per-user LaunchAgent with KeepAlive runs a small supervisor script at login and relaunches it if it dies. The supervisor launches the Desktop Commander remote process, watches its log for exits and explicit fatal messages, and restarts it. ChatGPT reaches the Mac only through that bridge, so a dead bridge stops the whole loop; the recovery was verified live by killing the child and watching it come back within seconds. Durable task state lives in GitHub, so a restart costs at most one uncommitted step.",
    width: 1480,
    height: 920,
    nodes: [
      {
        id: "launchd",
        x: 60,
        y: 140,
        w: 520,
        h: 150,
        title: "launchd — LaunchAgent, KeepAlive",
        lines: [
          "starts the supervisor at login;",
          "if the supervisor itself dies,",
          "launchd starts it again",
        ],
        stroke: BLUE,
        bg: BLUE_BG,
      },
      {
        id: "supervisor",
        x: 60,
        y: 390,
        w: 520,
        h: 170,
        title: "Supervisor script",
        lines: [
          "launches: npx @wonderwhy-er/",
          "desktop-commander remote",
          "watches the run's log lines for exits",
          "and for RDC's explicit fatal messages",
        ],
        stroke: BLUE,
        bg: BLUE_BG,
      },
      {
        id: "rdc",
        x: 60,
        y: 670,
        w: 520,
        h: 150,
        title: "Desktop Commander remote (RDC)",
        lines: [
          "the bridge ChatGPT uses to run local",
          "tools and terminal commands on the Mac",
        ],
        stroke: TEAL,
        bg: TEAL_BG,
      },
      {
        id: "chatgpt",
        x: 760,
        y: 140,
        w: 660,
        h: 150,
        title: "Why it matters",
        lines: [
          "ChatGPT reaches the Mac only through RDC.",
          "If the bridge dies, the whole loop stops —",
          "not just one task. So the bridge is treated",
          "as replaceable machinery, never as storage.",
        ],
        stroke: INK,
        bg: "#FFFFFF",
      },
      {
        id: "verified",
        x: 760,
        y: 390,
        w: 660,
        h: 170,
        title: "Verified live",
        lines: [
          "the active RDC child was killed on purpose",
          "→ device offline → back online within seconds,",
          "no manual restart → a real RDC tool call",
          "after recovery succeeded",
        ],
        stroke: TEAL,
        bg: TEAL_BG,
      },
      {
        id: "github",
        x: 760,
        y: 670,
        w: 660,
        h: 150,
        title: "So state lives in GitHub, not in the session",
        lines: [
          "issues, branches, pushed commits, PR",
          "descriptions — a restart costs at most the",
          "current uncommitted step",
        ],
        stroke: AMBER_STROKE,
        bg: AMBER_BG,
        titleColor: AMBER,
      },
    ],
    arrows: [
      {
        pts: [[320, 290], [320, 390]],
        color: BLUE,
        label: "keeps alive",
        labelAt: [335, 345],
        labelAnchor: "start",
      },
      {
        pts: [[320, 560], [320, 670]],
        color: BLUE,
        label: "launches + watches",
        labelAt: [335, 620],
        labelAnchor: "start",
      },
      {
        pts: [[580, 475], [655, 475], [655, 745], [580, 745]],
        color: TEAL,
        dashed: true,
        label: "restart on exit or fatal log line",
        labelAt: [668, 610],
        labelAnchor: "start",
      },
      {
        pts: [[1090, 290], [1090, 390]],
        color: MUTED_STROKE,
      },
      {
        pts: [[1090, 560], [1090, 670]],
        color: MUTED_STROKE,
      },
    ],
    footer:
      "Manual override, from any shell: launchctl print gui/$(id -u)/<label> · tail -f <rdc log> · launchctl kickstart -k gui/$(id -u)/<label>",
  },
]

// ---------------------------------------------------------------------------
// Excalidraw emission (schema mirrors the working .excalidraw files in this repo)
// ---------------------------------------------------------------------------

let seedCounter = 100_000_000
const nextSeed = () => (seedCounter = (seedCounter * 1103515245 + 12345) % 2_147_483_647)
const updatedTs = 1_788_790_000_000

function excText(id, index, x, y, text, fontSize, color, opts = {}) {
  const lines = text.split("\n")
  const width = Math.max(...lines.map((l) => estWidth(l, fontSize, opts.bold)))
  return {
    id,
    type: "text",
    x,
    y,
    width: Math.round(width),
    height: Math.round(lines.length * fontSize * 1.25),
    angle: 0,
    autoResize: true,
    backgroundColor: "transparent",
    boundElements: null,
    containerId: null,
    fillStyle: "solid",
    fontFamily: opts.bold ? 7 : 5,
    fontSize,
    frameId: null,
    groupIds: [],
    index,
    isDeleted: false,
    lineHeight: 1.25,
    link: null,
    locked: false,
    opacity: 100,
    originalText: text,
    roughness: 1,
    roundness: null,
    seed: nextSeed(),
    strokeColor: color,
    strokeStyle: "solid",
    strokeWidth: 2,
    text,
    textAlign: opts.align ?? "left",
    updated: updatedTs,
    version: 1,
    versionNonce: nextSeed(),
    verticalAlign: "top",
  }
}

function excRect(id, index, n) {
  return {
    id,
    type: "rectangle",
    x: n.x,
    y: n.y,
    width: n.w,
    height: n.h,
    angle: 0,
    backgroundColor: n.bg,
    boundElements: null,
    fillStyle: "solid",
    frameId: null,
    groupIds: [],
    index,
    isDeleted: false,
    link: null,
    locked: false,
    opacity: 100,
    roughness: 1,
    roundness: { type: 3 },
    seed: nextSeed(),
    strokeColor: n.stroke,
    strokeStyle: "solid",
    strokeWidth: 2,
    updated: updatedTs,
    version: 1,
    versionNonce: nextSeed(),
  }
}

function excArrow(id, index, a) {
  const [x0, y0] = a.pts[0]
  return {
    id,
    type: "arrow",
    x: x0,
    y: y0,
    angle: 0,
    backgroundColor: "transparent",
    boundElements: null,
    elbowed: false,
    endArrowhead: "arrow",
    endBinding: null,
    fillStyle: "solid",
    frameId: null,
    groupIds: [],
    index,
    isDeleted: false,
    lastCommittedPoint: null,
    link: null,
    locked: false,
    opacity: 100,
    points: a.pts.map(([px, py]) => [px - x0, py - y0]),
    roughness: 1,
    roundness: null,
    seed: nextSeed(),
    startArrowhead: a.both ? "arrow" : null,
    startBinding: null,
    strokeColor: a.color,
    strokeStyle: a.dashed ? "dashed" : "solid",
    strokeWidth: 2.5,
    updated: updatedTs,
    version: 1,
    versionNonce: nextSeed(),
  }
}

function buildExcalidraw(fig) {
  const elements = []
  let i = 0
  const idx = () => {
    const s = i.toString(36)
    i += 1
    return `a${s}`
  }

  if (fig.svgTitle) {
    elements.push(
      excText("title", idx(), 48, 40, fig.svgTitle, 30, INK, { bold: true }),
    )
  }
  for (const n of fig.nodes) {
    elements.push(excRect(`rect-${n.id}`, idx(), n))
    const titleColor = n.titleColor ?? INK
    const titleFontSize = 19
    const titleLines = n.title.split("\n")
    const titleW = Math.max(...titleLines.map((l) => estWidth(l, titleFontSize, true)))
    const titleX = n.align === "left" ? n.x + 28 : n.x + n.w / 2 - titleW / 2
    elements.push(
      excText(`t-${n.id}`, idx(), Math.round(titleX), n.y + 22, n.title, titleFontSize, titleColor, {
        bold: true,
      }),
    )
    const bodyFontSize = 14.5
    const bodyY = n.y + 22 + titleLines.length * titleFontSize * 1.25 + 14
    const bodyText = n.lines.join("\n")
    const bodyW = Math.max(
      ...n.lines.map((l) => estWidth(l, bodyFontSize)),
    )
    const bodyX = n.align === "left" ? n.x + 28 : n.x + n.w / 2 - bodyW / 2
    if (bodyText.trim().length > 0) {
      elements.push(
        excText(`b-${n.id}`, idx(), Math.round(bodyX), Math.round(bodyY), bodyText, bodyFontSize, BODY, {
          align: n.align === "left" ? "left" : "center",
        }),
      )
    }
  }
  for (const [j, a] of fig.arrows.entries()) {
    elements.push(excArrow(`arrow-${j}`, idx(), a))
    if (a.label) {
      elements.push(
        excText(`al-${j}`, idx(), a.labelAt[0], a.labelAt[1], a.label, 13.5, a.color, {
          align: a.labelAnchor === "start" ? "left" : "center",
        }),
      )
    }
  }
  if (fig.footer) {
    elements.push(
      excText("footer", idx(), 48, fig.height - 42, fig.footer, 15, BODY),
    )
  }

  return JSON.stringify(
    {
      type: "excalidraw",
      version: 2,
      source: "rajeevg.com diagram generator (scripts/generate-remote-coding-workflow-diagrams.mjs)",
      elements,
      appState: {
        gridSize: null,
        viewBackgroundColor: "#ffffff",
      },
      files: {},
    },
    null,
    2,
  )
}

// ---------------------------------------------------------------------------
// SVG emission
// ---------------------------------------------------------------------------

function buildSvg(fig) {
  const defs = []
  const markerIds = new Map()
  const arrowMarker = (id, color) =>
    `<marker id="${id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${color}"/></marker>`
  const markerFor = (color, suffix) => {
    const key = `${color}-${suffix}`
    if (!markerIds.has(key)) {
      const id = `arw-${markerIds.size}`
      markerIds.set(key, id)
      defs.push(arrowMarker(id, color))
    }
    return markerIds.get(key)
  }

  const arrowSvg = fig.arrows
    .map((a) => {
      const startId = a.both ? markerFor(a.color, "s") : null
      const endId = markerFor(a.color, "e")
      const d = a.pts.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x} ${y}`).join(" ")
      const dash = a.dashed ? ' stroke-dasharray="7 6"' : ""
      const start = startId ? ` marker-start="url(#${startId})"` : ""
      const label = a.label
        ? `\n  <text x="${a.labelAt[0]}" y="${a.labelAt[1]}"${a.labelAnchor === "start" ? "" : ' text-anchor="middle"'} font-family="Helvetica, Arial, sans-serif" font-size="14" fill="${a.color}" paint-order="stroke" stroke="#F7F5F0" stroke-width="5">${esc(a.label)}</text>`
        : ""
      return `<path d="${d}" fill="none" stroke="${a.color}" stroke-width="2.5"${dash} marker-end="url(#${endId})"${start}/>${label}`
    })
    .join("\n")

  const nodeSvg = fig.nodes
    .map((n) => {
      const titleColor = n.titleColor ?? INK
      const titleSize = 20
      const bodySize = 15
      const bodyLineHeight = 24
      const titleLines = n.title.split("\n")
      const bodyStartY = n.y + 22 + titleLines.length * 26 + 22
      const titleText = (x, anchor) =>
        titleLines
          .map(
            (l, i) =>
              `<text x="${x}" y="${n.y + 40 + i * 26}"${anchor} font-family="Helvetica, Arial, sans-serif" font-size="${titleSize}" font-weight="700" fill="${titleColor}">${esc(l)}</text>`,
          )
          .join("\n")
      if (n.align === "left") {
        const title = titleText(n.x + 28, "")
        const body = n.lines
          .map(
            (l, i) =>
              `<text x="${n.x + 28}" y="${bodyStartY + i * bodyLineHeight}" font-family="Helvetica, Arial, sans-serif" font-size="${bodySize}" fill="${BODY}">${esc(l)}</text>`,
          )
          .join("\n")
        return `<rect x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" rx="12" fill="${n.bg}" stroke="${n.stroke}" stroke-width="2"/>\n${title}\n${body}`
      }
      const title = titleText(n.x + n.w / 2, ' text-anchor="middle"')
      const body = n.lines
        .map(
          (l, i) =>
            `<text x="${n.x + n.w / 2}" y="${bodyStartY + i * bodyLineHeight}" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="${bodySize}" fill="${BODY}">${esc(l)}</text>`,
        )
        .join("\n")
      return `<rect x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" rx="12" fill="${n.bg}" stroke="${n.stroke}" stroke-width="2"/>\n${title}\n${body}`
    })
    .join("\n")

  const footerSvg = fig.footer
    ? `\n<text x="48" y="${fig.height - 24}" font-family="Helvetica, Arial, sans-serif" font-size="14.5" font-style="italic" fill="${BODY}">${esc(fig.footer)}</text>`
    : ""

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${fig.width} ${fig.height}" width="100%" role="img" aria-labelledby="ttl dsc">
  <title id="ttl">${esc(fig.svgTitle)}</title>
  <desc id="dsc">${esc(fig.svgDesc)}</desc>
  <defs>
${[...new Set(defs)].join("\n")}
  </defs>
  <rect x="0" y="0" width="${fig.width}" height="${fig.height}" fill="${PAPER}"/>
${arrowSvg}
  ${fig.svgTitle ? `<text x="48" y="64" font-family="Helvetica, Arial, sans-serif" font-size="30" font-weight="700" fill="${INK}">${esc(fig.svgTitle)}</text>` : ""}
${nodeSvg}${footerSvg}
</svg>`
}

// ---------------------------------------------------------------------------
// Write everything
// ---------------------------------------------------------------------------

for (const fig of figures) {
  fs.writeFileSync(path.join(dlDir, `${fig.name}.excalidraw`), buildExcalidraw(fig) + "\n")
  fs.writeFileSync(path.join(imageDir, `${fig.name}.svg`), buildSvg(fig))
  console.log(`OK ${fig.name}: excalidraw + svg`)
}
