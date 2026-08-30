import fs from "node:fs"
import path from "node:path"
const root = process.cwd()
const imageDir = path.join(root, "public/images/editorial")
const dlDir = path.join(root, "public/downloads")
fs.mkdirSync(imageDir, { recursive: true })

const palette = {
  ink: "#172033", muted: "#566174", paper: "#fbfaf5",
  blue: "#dce8ff", blueStroke: "#4f6fad",
  green: "#dcf3e5", greenStroke: "#3f8460",
  amber: "#fff0c9", amberStroke: "#a97921",
  rose: "#ffe1de", roseStroke: "#a45350",
  purple: "#e9e1ff", purpleStroke: "#7459a8",
}

let ec = 0
function el(type, x, y, w, h, seed, extra = {}) {
  ec += 1
  return {
    id: `m${ec.toString(36)}${seed}`, type, x, y, width: w, height: h, angle: 0,
    strokeColor: extra.stroke || palette.ink, backgroundColor: extra.bg || "transparent",
    fillStyle: "solid", strokeWidth: extra.sw || 2, strokeStyle: extra.dashed ? "dashed" : "solid",
    roughness: 1, opacity: 100, groupIds: [], frameId: null,
    roundness: type === "rectangle" ? { type: 3 } : null, seed, version: 1,
    versionNonce: seed * 7, isDeleted: false, boundElements: [], updated: 1798800000000,
    link: null, locked: false,
  }
}
function txt(t, x, y, s, color = palette.ink) {
  const w = Math.max(60, t.length * s * 0.55)
  const e = el("text", x, y, w, s * 1.25, 1000 + ec, { strokeColor: color })
  return { ...e, text: t, fontSize: s, fontFamily: 1, textAlign: "left", verticalAlign: "top", containerId: null, originalText: t, autoResize: true, lineHeight: 1.25, baseline: s }
}
function arrow(x1, y1, x2, y2, dashed = false) {
  ec += 1
  return {
    ...el("arrow", Math.min(x1, x2), Math.min(y1, y2), Math.abs(x2 - x1), Math.abs(y2 - y1), 40 + ec, { dashed }),
    points: [[0, 0], [x2 - x1, y2 - y1]], startBinding: null, endBinding: null,
    lastCommittedPoint: null, startArrowhead: null, endArrowhead: "arrow", elbowed: false,
  }
}

function buildExcalidraw(elements) {
  return JSON.stringify({
    type: "excalidraw", version: 2, source: "https://excalidraw.com",
    elements, appState: { gridSize: null, viewBackgroundColor: palette.paper }, files: {},
  }, null, 2) + "\n"
}

function svgShell(title, subtitle, body, footer) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" role="img" aria-labelledby="t d">
<title id="t">${esc(title)}</title><desc id="d">${esc(subtitle)}</desc>
<defs><pattern id="dots" width="28" height="28" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.1" fill="#e7e2d5"/></pattern><marker id="arrowEnd" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto"><path d="M 0 0 L 9 5 L 0 10 z" fill="${palette.muted}"/></marker></defs>
<rect width="1280" height="720" fill="${palette.paper}"/><rect width="1280" height="720" fill="url(#dots)" opacity=".6"/>
<text x="48" y="52" font-size="28" font-weight="700" fill="${palette.ink}" font-family="Georgia, serif">${esc(title)}</text>
<text x="48" y="84" font-size="16" fill="${palette.muted}" font-family="Georgia, serif">${esc(subtitle)}</text>
${body}
<text x="640" y="700" text-anchor="middle" font-size="14" font-style="italic" fill="${palette.muted}" font-family="Georgia, serif">${esc(footer)}</text>
</svg>`
}
function esc(v) { return String(v).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;") }

// ---------------------------------------------------------------- Figure 1
// Execution topology — the actual build/review loop with write scopes
const f1title = "The execution loop behind one rebuild"
const f1sub = "A supervisor that never edits, a workhorse in an isolated worktree, a read-only frontier review, and an independent acceptance gate."
const boxes1 = [
  { x: 60, y: 150, w: 280, h: 130, label: "Sol supervisor (Codex)", fill: "blue", model: "gpt-5.6-sol", scope: "plans, contracts, accepts — edits nothing" },
  { x: 500, y: 150, w: 280, h: 130, label: "GLM implementation thread", fill: "green", model: "z-ai/glm-5.3-flash", scope: "writes inside worktree 18cc only" },
  { x: 500, y: 420, w: 280, h: 130, label: "Opus narrative review", fill: "purple", model: "claude-opus-5 · OpenCode", scope: "read-only, no files touched" },
  { x: 940, y: 150, w: 280, h: 130, label: "Parent acceptance gate", fill: "amber", model: "fresh supervisor eyes", scope: "independent QA, then merge" },
]
function fig1Svg() {
  const boxes = boxes1
  let b = ""
  b += boxes.map(n => `<rect x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" rx="16" fill="${palette[n.fill]}" stroke="${palette[n.fill + "Stroke"]}" stroke-width="3"/><text x="${n.x + 18}" y="${n.y + 34}" font-size="18" font-weight="700" fill="${palette.ink}" font-family="Comic Sans MS, cursive">${esc(n.label)}</text><text x="${n.x + 18}" y="${n.y + 60}" font-size="13" fill="${palette.muted}" font-family="Comic Sans MS, cursive">${esc(n.model)}</text><text x="${n.x + 18}" y="${n.y + 92}" font-size="13" font-weight="700" fill="${palette[n.fill + "Stroke"]}" font-family="Comic Sans MS, cursive">${esc(n.scope)}</text>`).join("")
  // Sol -> GLM : contract
  b += `<path d="M 345 215 L 492 215" fill="none" stroke="${palette.muted}" stroke-width="2.5" marker-end="url(#arrowEnd)"/><text x="348" y="200" font-size="13" fill="${palette.muted}" font-family="Comic Sans MS, cursive">contract + runbook paths</text>`
  // GLM -> Parent acceptance : PRs
  b += `<path d="M 785 215 L 932 215" fill="none" stroke="${palette.muted}" stroke-width="2.5" marker-end="url(#arrowEnd)"/><text x="790" y="196" font-size="13" fill="${palette.muted}" font-family="Comic Sans MS, cursive">PR #31 · #33 · #35</text>`
  // GLM -> Opus : rendered articles for review
  b += `<path d="M 640 285 L 640 412" fill="none" stroke="${palette.muted}" stroke-width="2.5" stroke-dasharray="9 7" marker-end="url(#arrowEnd)"/><text x="652" y="330" font-size="13" fill="${palette.muted}" font-family="Comic Sans MS, cursive">rendered articles out for review</text>`
  // Opus -> GLM : verdicts
  b += `<path d="M 608 412 C 558 360, 558 340, 608 292" fill="none" stroke="${palette.roseStroke}" stroke-width="2.5" marker-end="url(#arrowEnd)"/><text x="336" y="368" font-size="13" fill="${palette.roseStroke}" font-family="Comic Sans MS, cursive">verdicts back — GLM amended</text>`
  // Loop back from acceptance: rejection would return (dashed) - draw annotation instead
  b += `<text x="958" y="330" font-size="13" fill="${palette.amberStroke}" font-family="Comic Sans MS, cursive">merge only after</text><text x="958" y="350" font-size="13" fill="${palette.amberStroke}" font-family="Comic Sans MS, cursive">independent pass</text>`
  b += `<text x="60" y="620" font-size="14" fill="${palette.muted}" font-family="Comic Sans MS, cursive">Sessions: supervisor 01a04e0b…cb6 · GLM thread 01a04ecb…d58a · Opus ses_fb10c0ea…oBhd</text>`
  return svgShell(f1title, f1sub, b, "No agent talks to another directly — every hop passes through the supervisor · Evidence date: 30 Aug 2026")
}
function fig1Excalidraw() {
  ec = 0; const e = []
  e.push(txt(f1title, 48, 36, 26))
  e.push(txt(f1sub, 48, 74, 15, palette.muted))
  boxes1.forEach((n, i) => {
    e.push(el("rectangle", n.x, n.y, n.w, n.h, 30 + ec, { stroke: palette[n.fill + "Stroke"], bg: palette[n.fill], sw: 3 }))
    e.push(txt(n.label, n.x + 18, n.y + 16, 16))
    e.push(txt(n.model, n.x + 18, n.y + 42, 12, palette.muted))
    e.push(txt(n.scope, n.x + 18, n.y + 66, 12, palette[n.fill + "Stroke"]))
  })
  e.push(arrow(345, 215, 492, 215))
  e.push(txt("contract + runbook paths", 348, 190, 11, palette.muted))
  e.push(arrow(785, 215, 932, 215))
  e.push(txt("PR #31 · #33 · #35", 790, 196, 11, palette.muted))
  e.push(arrow(640, 282, 640, 414, true))
  e.push(txt("rendered articles out for review", 652, 330, 11, palette.muted))
  e.push(arrow(608, 414, 608, 296))
  e.push(txt("verdicts back — GLM amended", 338, 366, 11, palette.roseStroke))
  e.push(txt("merge only after independent pass", 950, 320, 11, palette.amberStroke))
  e.push(txt("Sessions: supervisor 01a04e0b…cb6 · GLM thread 01a04ecb…d58a · Opus ses_fb10c0ea…oBhd", 60, 612, 12, palette.muted))
  e.push(txt("No agent talks to another directly — every hop passes through the supervisor · Evidence date: 30 Aug 2026", 48, 660, 12, palette.muted))
  return buildExcalidraw(e)
}

// ---------------------------------------------------------------- Figure 2
// Responsibility boundaries — three columns, what crosses each boundary
const f2title = "Who is allowed to do what"
const f2sub = "The boundaries are the design: supervision, bounded implementation, and review are separated so failures stay local."
const cols2 = [
  { x: 60, fill: "blue", title: "SUPERVISOR", items: [["Writes the contract", "scope, runbook paths, acceptance checks"], ["Never edits article files", "keeps judgment independent of the build"], ["Creates the worker task", "native Codex task, its own thread"]], cross: "sends in: contract + scope" },
  { x: 480, fill: "green", title: "GLM WORKER", items: [["Isolated worktree checkout", "cannot disturb the main tree"], ["Bounded writes", "article, figures, index integration only"], ["Opens the PR", "build + typecheck must pass first"]], cross: "sends out: PR + evidence" },
  { x: 900, fill: "purple", title: "REVIEWER", items: [["Reads the rendered site", "articles as a reader sees them"], ["No file access, no edits", "cannot silently change the output"], ["Returns verdicts", "problems, not patches"]], cross: "sends back: verdicts" },
]
function fig2Svg() {
  let b = ""
  cols2.forEach(c => {
    const gh = 440
    b += `<rect x="${c.x}" y="130" width="320" height="${gh}" rx="18" fill="${palette[c.fill]}" stroke="${palette[c.fill + "Stroke"]}" stroke-width="2.5" opacity=".45"/><text x="${c.x + 22}" y="164" font-size="18" font-weight="700" fill="${palette[c.fill + "Stroke"]}" font-family="Comic Sans MS, cursive">${esc(c.title)}</text>`
    c.items.forEach((it, i) => {
      const iy = 190 + i * 96
      b += `<rect x="${c.x + 18}" y="${iy}" width="284" height="84" rx="12" fill="#ffffff" stroke="${palette[c.fill + "Stroke"]}" stroke-width="2"/><text x="${c.x + 34}" y="${iy + 28}" font-size="15" font-weight="700" fill="${palette.ink}" font-family="Comic Sans MS, cursive">${esc(it[0])}</text><text x="${c.x + 34}" y="${iy + 54}" font-size="13" fill="${palette.muted}" font-family="Comic Sans MS, cursive">${esc(it[1])}</text>`
    })
    b += `<text x="${c.x + 22}" y="556" font-size="13" font-weight="700" fill="${palette[c.fill + "Stroke"]}" font-family="Comic Sans MS, cursive">${esc(c.cross)}</text>`
  })
  b += `<path d="M 382 320 L 474 320" fill="none" stroke="${palette.muted}" stroke-width="2.5" marker-end="url(#arrowEnd)"/>`
  b += `<path d="M 802 320 L 894 320" fill="none" stroke="${palette.muted}" stroke-width="2.5" marker-end="url(#arrowEnd)"/>`
  b += `<path d="M 905 400 C 810 500, 720 500, 640 385" fill="none" stroke="${palette.roseStroke}" stroke-width="2.5" stroke-dasharray="9 7" marker-end="url(#arrowEnd)"/><text x="628" y="516" font-size="13" fill="${palette.roseStroke}" font-family="Comic Sans MS, cursive">verdicts re-enter via the worker only</text>`
  return svgShell(f2title, f2sub, b, "Review findings can never become edits by themselves — the worker applies them inside its scope · Evidence date: 30 Aug 2026")
}
function fig2Excalidraw() {
  ec = 0; const e = []
  e.push(txt(f2title, 48, 36, 26))
  e.push(txt(f2sub, 48, 74, 15, palette.muted))
  cols2.forEach(c => {
    e.push(el("rectangle", c.x, 130, 320, 440, 30 + ec, { stroke: palette[c.fill + "Stroke"], bg: palette[c.fill], sw: 2 }))
    e.push(txt(c.title, c.x + 22, 148, 16, palette[c.fill + "Stroke"]))
    c.items.forEach((it, i) => {
      const iy = 190 + i * 96
      e.push(el("rectangle", c.x + 18, iy, 284, 84, 40 + ec, { stroke: palette[c.fill + "Stroke"], bg: "#ffffff", sw: 2 }))
      e.push(txt(it[0], c.x + 34, iy + 14, 13))
      e.push(txt(it[1], c.x + 34, iy + 38, 11, palette.muted))
    })
    e.push(txt(c.cross, c.x + 22, 544, 11, palette[c.fill + "Stroke"]))
  })
  e.push(arrow(382, 320, 474, 320))
  e.push(arrow(802, 320, 894, 320))
  e.push(arrow(905, 400, 640, 385, true))
  e.push(txt("verdicts re-enter via the worker only", 620, 498, 11, palette.roseStroke))
  e.push(txt("Review findings can never become edits by themselves — the worker applies them inside its scope · Evidence date: 30 Aug 2026", 48, 660, 12, palette.muted))
  return buildExcalidraw(e)
}

// ---------------------------------------------------------------- Figure 3
// Economics — bounded measurement vs lifetime counters, honestly scoped
const f3title = "Measured economics, honestly scoped"
const f3sub = "Only one number in this execution is a clean per-task delta. The rest are lifetime counters — shown, but not comparable."
function fig3Svg() {
  let b = ""
  // Panel A: bounded Opus review
  b += `<rect x="60" y="120" width="480" height="480" rx="18" fill="${palette.purple}" stroke="${palette.purpleStroke}" stroke-width="2.5" opacity=".35"/><text x="84" y="156" font-size="17" font-weight="700" fill="${palette.purpleStroke}" font-family="Comic Sans MS, cursive">BOUNDED REVIEW — CLEAN DELTA</text>`
  b += `<rect x="100" y="260" width="380" height="150" rx="12" fill="#ffffff" stroke="${palette.purpleStroke}" stroke-width="3"/><text x="118" y="292" font-size="15" font-weight="700" fill="${palette.ink}" font-family="Comic Sans MS, cursive">Opus narrative review</text><text x="118" y="322" font-size="26" font-weight="700" fill="${palette.purpleStroke}" font-family="Comic Sans MS, cursive">56,747 tokens · $0.47</text><text x="118" y="352" font-size="13" fill="${palette.muted}" font-family="Comic Sans MS, cursive">one session, one task: review 13 articles,</text><text x="118" y="374" font-size="13" fill="${palette.muted}" font-family="Comic Sans MS, cursive">return verdicts, change nothing</text><text x="100" y="460" font-size="13" fill="${palette.muted}" font-family="Comic Sans MS, cursive">verified against OpenCode SQLite session ses_fb10c0ea…oBhd</text>`
  b += `<text x="84" y="540" font-size="13" fill="${palette.muted}" font-family="Comic Sans MS, cursive">the expensive model spent less than $0.50 by staying bounded</text>`
  // Panel B: lifetime counters
  b += `<rect x="580" y="120" width="640" height="480" rx="18" fill="${palette.amber}" stroke="${palette.amberStroke}" stroke-width="2.5" opacity=".3"/><text x="604" y="156" font-size="17" font-weight="700" fill="${palette.amberStroke}" font-family="Comic Sans MS, cursive">LIFETIME COUNTERS — NOT COMPARABLE</text>`
  const rows = [
    { label: "GLM implementation thread", sub: "prompt 202.2M · completion 157K", w: 520, fill: "green" },
    { label: "Sol supervisor session", sub: "prompt 76.7M · completion 86K", w: 197, fill: "blue" },
    { label: "Opus (inside the same execution)", sub: "bounded delta: unknown", w: 0, fill: "rose" },
  ]
  rows.forEach((r, i) => {
    const y = 210 + i * 108
    b += `<text x="604" y="${y}" font-size="14" font-weight="700" fill="${palette.ink}" font-family="Comic Sans MS, cursive">${esc(r.label)}</text>`
    b += `<text x="604" y="${y + 20}" font-size="12" fill="${palette.muted}" font-family="Comic Sans MS, cursive">${esc(r.sub)}</text>`
    if (r.w > 0) {
      b += `<rect x="604" y="${y + 32}" width="${r.w}" height="34" rx="8" fill="${palette[r.fill]}" stroke="${palette[r.fill + "Stroke"]}" stroke-width="2.5"/>`
      b += `<text x="${604 + r.w + 12}" y="${y + 55}" font-size="12" fill="${palette.muted}" font-family="Comic Sans MS, cursive">includes all other work these sessions ever did</text>`
    } else {
      b += `<rect x="604" y="${y + 32}" width="520" height="34" rx="8" fill="none" stroke="${palette.roseStroke}" stroke-width="2" stroke-dasharray="8 6"/><text x="618" y="${y + 55}" font-size="12" fill="${palette.roseStroke}" font-family="Comic Sans MS, cursive">no clean per-task number — reported as unknown, not zero</text>`
    }
  })
  b += `<text x="604" y="560" font-size="13" fill="${palette.ink}" font-family="Comic Sans MS, cursive">Directional claim only: the workhorse absorbed the bulk of implementation</text>`
  b += `<text x="604" y="580" font-size="13" fill="${palette.ink}" font-family="Comic Sans MS, cursive">volume; the frontier model was capped at one small, expensive-worthy review.</text>`
  return svgShell(f3title, f3sub, b, "Lifetime counters come from the local Prometheus stack; cost is measured only where scoped · Evidence date: 30 Aug 2026")
}
function fig3Excalidraw() {
  ec = 0; const e = []
  e.push(txt(f3title, 48, 36, 26))
  e.push(txt(f3sub, 48, 74, 15, palette.muted))
  e.push(el("rectangle", 60, 120, 480, 480, 30, { stroke: palette.purpleStroke, bg: palette.purple, sw: 2 }))
  e.push(txt("BOUNDED REVIEW — CLEAN DELTA", 84, 140, 14, palette.purpleStroke))
  e.push(el("rectangle", 100, 250, 380, 150, 40, { stroke: palette.purpleStroke, bg: "#ffffff", sw: 3 }))
  e.push(txt("Opus narrative review", 118, 268, 13))
  e.push(txt("56,747 tokens · $0.47", 118, 292, 20, palette.purpleStroke))
  e.push(txt("one session, one task: review 13 articles,", 118, 330, 11, palette.muted))
  e.push(txt("return verdicts, change nothing", 118, 348, 11, palette.muted))
  e.push(txt("verified against OpenCode SQLite ses_fb10c0ea…oBhd", 100, 440, 11, palette.muted))
  e.push(txt("the expensive model spent under $0.50 by staying bounded", 84, 524, 12, palette.muted))
  e.push(el("rectangle", 580, 120, 640, 480, 50, { stroke: palette.amberStroke, bg: palette.amber, sw: 2 }))
  e.push(txt("LIFETIME COUNTERS — NOT COMPARABLE", 604, 140, 14, palette.amberStroke))
  const rows = [
    { label: "GLM implementation thread", sub: "prompt 202.2M · completion 157K", w: 520, fill: "green" },
    { label: "Sol supervisor session", sub: "prompt 76.7M · completion 86K", w: 197, fill: "blue" },
    { label: "Opus (inside the same execution)", sub: "bounded delta: unknown", w: 0, fill: "rose" },
  ]
  rows.forEach((r, i) => {
    const y = 190 + i * 108
    e.push(txt(r.label, 604, y, 12))
    e.push(txt(r.sub, 604, y + 20, 10, palette.muted))
    if (r.w > 0) {
      e.push(el("rectangle", 604, y + 40, r.w, 34, 60 + ec, { stroke: palette[r.fill + "Stroke"], bg: palette[r.fill], sw: 2 }))
      e.push(txt("includes all other work these sessions ever did", 604 + r.w + 12, y + 50, 9, palette.muted))
    } else {
      e.push(el("rectangle", 604, y + 40, 520, 34, 60 + ec, { stroke: palette.roseStroke, sw: 2, dashed: true }))
      e.push(txt("no clean per-task number — reported as unknown, not zero", 618, y + 50, 10, palette.roseStroke))
    }
  })
  e.push(txt("Directional claim only: the workhorse absorbed the bulk of implementation volume;", 604, 540, 11))
  e.push(txt("the frontier model was capped at one small, expensive-worthy review.", 604, 558, 11))
  e.push(txt("Lifetime counters from the local Prometheus stack; cost measured only where scoped · Evidence date: 30 Aug 2026", 48, 660, 12, palette.muted))
  return buildExcalidraw(e)
}

const figures = [
  { slug: "ma-execution-topology", svg: fig1Svg(), ex: fig1Excalidraw() },
  { slug: "ma-execution-boundaries", svg: fig2Svg(), ex: fig2Excalidraw() },
  { slug: "ma-execution-economics", svg: fig3Svg(), ex: fig3Excalidraw() },
]
for (const f of figures) {
  fs.writeFileSync(path.join(imageDir, `${f.slug}.svg`), f.svg)
  fs.writeFileSync(path.join(dlDir, `${f.slug}.excalidraw`), f.ex)
  // sanity: excalidraw must parse
  JSON.parse(f.ex)
  console.log("OK", f.slug)
}
