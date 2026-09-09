// Regenerates the two local-CI token-savings blog diagrams plus their editable
// Excalidraw sources from one shared layout description, so the SVG and the
// editable file can never drift apart.
//
// Design language (issue #133): flat geometry, plain sans typography, short
// labels, restrained palette, self-contained light canvas that reads on both
// light and dark site backgrounds. No hand-drawn wobble, no decorative marks.
//
// Usage: node scripts/generate-local-ci-token-savings-diagrams.mjs
// Output is deterministic: no randomness, no clocks, fixed seeds.

import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const imageDir = path.join(root, "public/images/blog/local-ci-token-savings")
const downloadDir = path.join(root, "public/downloads")
fs.mkdirSync(imageDir, { recursive: true })
fs.mkdirSync(downloadDir, { recursive: true })

// ------------------------------------------------------------------- style

const SANS = `Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`
const MONO = `ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`

const palette = {
  canvas: "#ffffff",
  frame: "#e2e8f0",
  ink: "#111827",
  body: "#334155",
  muted: "#64748b",
  line: "#94a3b8", // arrows, connectors
  faint: "#cbd5e1", // hairlines, secondary connectors
  // accumulated context — violet
  violet: "#f5f3ff",
  violetStroke: "#8b5cf6",
  violetInk: "#5b21b6",
  violetChip: "#ddd6fe",
  violetSolid: "#7c3aed",
  // agent work — blue
  blue: "#eff6ff",
  blueStroke: "#60a5fa",
  // waiting — amber
  amber: "#fffbeb",
  amberStroke: "#f59e0b",
  amberDeep: "#b45309",
  // wasted model turns / before-lane emphasis — rose
  rose: "#fff1f2",
  roseStroke: "#fda4af",
  roseLine: "#f43f5e",
  roseDeep: "#be123c",
  rosePanel: "#ffe4e6",
  rosePanelStroke: "#fb7185",
  rosePanelInk: "#9f123c",
  // CI success / after-lane — green
  green: "#f0fdf4",
  greenStroke: "#4ade80",
  greenLine: "#22c55e",
  greenDeep: "#15803d",
  greenSolid: "#16a34a",
  greenPanel: "#dcfce7",
  greenPanelInk: "#14532d",
  greenHandoffSub: "#dcfce7",
  emeraldPanel: "#ecfdf5",
  emeraldStroke: "#34d399",
  emeraldInk: "#047857",
  // evidence banner — warm amber
  banner: "#fffbeb",
  bannerStroke: "#fcd34d",
  // GitHub — near-black
  dark: "#111827",
  darkText: "#f9fafb",
  // self-hosted runner — indigo
  indigo: "#eef2ff",
  indigoStroke: "#6366f1",
  indigoInk: "#3730a3",
  indigoChip: "#c7d2fe",
  indigoNum: "#818cf8",
  // Vercel — zinc + black triangle
  zinc: "#fafafa",
  zincStroke: "#52525b",
  zincInk: "#18181b",
  zincNum: "#71717a",
  // lane labels
  laneBeforeBg: "#fef2f2",
  laneBeforeStroke: "#fecdd3",
  laneAfterBg: "#f0fdf4",
  laneAfterStroke: "#bbf7d0",
}

function esc(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
}

// -------------------------------------------------------------- primitives
// Both renderers consume the same primitive list:
//   rect   { x,y,w,h, rx, fill, stroke, sw, dashed, svgOnly }
//   text   { x,y,text, size, weight, fill, anchor, mono, opacity }
//   line   { pts:[[x,y],...], stroke, sw, dashed, head, close, fill }
//   circle { cx,cy,r, stroke, sw }

function rect(x, y, w, h, o = {}) {
  return { k: "rect", x, y, w, h, rx: o.rx ?? 10, fill: o.fill ?? "none", stroke: o.stroke ?? "none", sw: o.sw ?? 1.5, dashed: o.dashed ?? null, svgOnly: o.svgOnly ?? false }
}

function text(x, y, str, o = {}) {
  return { k: "text", x, y, text: str, size: o.size ?? 15, weight: o.weight ?? 400, fill: o.fill ?? palette.body, anchor: o.anchor ?? "start", mono: o.mono ?? false, opacity: o.opacity ?? null }
}

function line(pts, o = {}) {
  return { k: "line", pts, stroke: o.stroke ?? palette.line, sw: o.sw ?? 2, dashed: o.dashed ?? null, head: o.head ?? false, close: o.close ?? false, fill: o.fill ?? null }
}

function arrow(x1, y1, x2, y2, o = {}) {
  return line([[x1, y1], [x2, y2]], { ...o, head: true })
}

function circle(cx, cy, r, o = {}) {
  return { k: "circle", cx, cy, r, stroke: o.stroke ?? palette.ink, sw: o.sw ?? 1.6 }
}

// ------------------------------------------------------------- SVG renderer

function svgPrim(p) {
  if (p.k === "rect") {
    const dash = p.dashed ? ` stroke-dasharray="${p.dashed}"` : ""
    return `  <rect x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}" rx="${p.rx}" fill="${p.fill}" stroke="${p.stroke}" stroke-width="${p.sw}"${dash}/>`
  }
  if (p.k === "text") {
    const anchor = p.anchor === "middle" ? ` text-anchor="middle"` : p.anchor === "end" ? ` text-anchor="end"` : ""
    const op = p.opacity !== null ? ` opacity="${p.opacity}"` : ""
    const family = (p.mono ? MONO : SANS).replaceAll(`"`, "&quot;")
    return `  <text x="${p.x}" y="${p.y}" font-family="${family}" font-size="${p.size}" font-weight="${p.weight}" fill="${p.fill}"${anchor}${op}>${esc(p.text)}</text>`
  }
  if (p.k === "line") {
    const d = "M " + p.pts.map((pt) => pt.join(" ")).join(" L ") + (p.close ? " Z" : "")
    const dash = p.dashed ? ` stroke-dasharray="${p.dashed}"` : ""
    const head = p.head ? ` marker-end="url(#head-${p.stroke.slice(1)})"` : ""
    const fill = p.close && p.fill ? p.fill : "none"
    return `  <path d="${d}" fill="${fill}" stroke="${p.stroke}" stroke-width="${p.sw}" stroke-linecap="round" stroke-linejoin="round"${dash}${head}/>`
  }
  if (p.k === "circle") {
    return `  <circle cx="${p.cx}" cy="${p.cy}" r="${p.r}" fill="none" stroke="${p.stroke}" stroke-width="${p.sw}"/>`
  }
  throw new Error(`unknown primitive: ${p.k}`)
}

function renderSvg({ w, h, title, desc, prims }) {
  const headColors = [...new Set(prims.filter((p) => p.k === "line" && p.head).map((p) => p.stroke))]
  const markers = headColors
    .map((c) => `    <marker id="head-${c.slice(1)}" markerWidth="10" markerHeight="8" refX="8.6" refY="4" orient="auto" markerUnits="userSpaceOnUse"><path d="M 0 0.7 L 9 4 L 0 7.3 Z" fill="${c}"/></marker>`)
    .join("\n")
  const body = [
    `  <rect width="${w}" height="${h}" fill="${palette.canvas}"/>`,
    `  <rect x="0.75" y="0.75" width="${w - 1.5}" height="${h - 1.5}" rx="14" fill="none" stroke="${palette.frame}" stroke-width="1.5"/>`,
    ...prims.filter((p) => !p.svgOnly).map(svgPrim),
  ].join("\n")
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-labelledby="title desc">
  <title id="title">${esc(title)}</title>
  <desc id="desc">${esc(desc)}</desc>
  <defs>
${markers}
  </defs>
${body}
</svg>
`
}

// --------------------------------------------------------- Excalidraw renderer
// fontFamily 2 = plain sans (Helvetica-style), 3 = code. roughness 0 = clean
// lines. Everything is deterministic so re-running the generator is a no-op.

function textWidthPx(p) {
  const perChar = p.mono ? 0.6 : p.weight >= 600 ? 0.58 : 0.52
  return p.text.length * p.size * perChar
}

function renderExcalidraw({ prims }) {
  let n = 0
  const base = (type, x, y, w, h, extra = {}) => {
    n += 1
    return {
      id: `lci2-${n.toString(36).padStart(3, "0")}`,
      type,
      x, y,
      width: w,
      height: h,
      angle: 0,
      strokeColor: extra.stroke ?? palette.ink,
      backgroundColor: extra.bg ?? "transparent",
      fillStyle: "solid",
      strokeWidth: extra.sw ?? 2,
      strokeStyle: extra.dashed ? "dashed" : "solid",
      roughness: 0,
      opacity: 100,
      groupIds: [],
      frameId: null,
      roundness: extra.roundness ?? null,
      seed: 10000 + n * 7919,
      version: 1,
      versionNonce: 10000 + n * 104729,
      isDeleted: false,
      boundElements: [],
      updated: 1799600000000,
      link: null,
      locked: false,
    }
  }

  const elements = []
  for (const p of prims) {
    if (p.svgOnly) continue
    if (p.k === "rect") {
      elements.push(base("rectangle", p.x, p.y, p.w, p.h, {
        stroke: p.stroke === "none" ? "transparent" : p.stroke,
        bg: p.fill === "none" ? "transparent" : p.fill,
        sw: p.sw,
        dashed: p.dashed,
        roundness: p.rx > 0 ? { type: 3 } : null,
      }))
    } else if (p.k === "text") {
      const w = textWidthPx(p)
      const x = p.anchor === "middle" ? p.x - w / 2 : p.anchor === "end" ? p.x - w : p.x
      const el = base("text", x, p.y - p.size * 0.88, w, p.size * 1.25, { stroke: p.fill, sw: 1 })
      elements.push({
        ...el,
        text: p.text,
        fontSize: p.size,
        fontFamily: p.mono ? 3 : 2,
        textAlign: "left",
        verticalAlign: "top",
        containerId: null,
        originalText: p.text,
        autoResize: true,
        lineHeight: 1.25,
      })
    } else if (p.k === "line") {
      const [x0, y0] = p.pts[0]
      const rel = p.pts.map(([x, y]) => [x - x0, y - y0])
      const closed = p.close ? [rel[0]] : []
      const xs = p.pts.map((q) => q[0])
      const ys = p.pts.map((q) => q[1])
      const el = base(p.head ? "arrow" : "line", x0, y0, Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys), {
        stroke: p.stroke,
        bg: p.close && p.fill ? p.fill : "transparent",
        sw: p.sw,
        dashed: p.dashed,
      })
      elements.push({
        ...el,
        points: [...rel, ...closed],
        startBinding: null,
        endBinding: null,
        lastCommittedPoint: null,
        startArrowhead: null,
        endArrowhead: p.head ? "arrow" : null,
        elbowed: false,
      })
    } else if (p.k === "circle") {
      elements.push(base("ellipse", p.cx - p.r, p.cy - p.r, p.r * 2, p.r * 2, { stroke: p.stroke, sw: p.sw, roundness: null }))
    } else {
      throw new Error(`unknown primitive: ${p.k}`)
    }
  }

  return JSON.stringify({
    type: "excalidraw",
    version: 2,
    source: "https://excalidraw.com",
    elements,
    appState: { gridSize: null, viewBackgroundColor: palette.canvas },
    files: {},
  }, null, 2) + "\n"
}

// ------------------------------------------------------- shared node builder

// A titled card with optional subtitle lines, all centred.
function nodeCard(x, y, w, h, o) {
  const prims = [rect(x, y, w, h, { rx: o.rx ?? 10, fill: o.fill, stroke: o.stroke, sw: o.sw ?? 1.5, dashed: o.dashed })]
  const cx = x + w / 2
  const lines = o.lines ?? []
  const titleSize = o.titleSize ?? 17
  const lineSize = o.lineSize ?? 14.5
  const block = titleSize + lines.length * (lineSize + 6)
  let ty = y + (h - block) / 2 + titleSize * 0.85
  if (o.title) {
    prims.push(text(cx, ty, o.title, { size: titleSize, weight: 700, fill: o.titleFill ?? palette.ink, anchor: "middle", mono: o.mono }))
  }
  for (const ln of lines) {
    ty += lineSize + 6
    prims.push(text(cx, ty, ln.text, { size: ln.size ?? lineSize, weight: ln.weight ?? 400, fill: ln.fill ?? palette.muted, anchor: "middle", mono: ln.mono }))
  }
  return prims
}

// Vertical connector between stacked boxes.
function downArrow(cx, y1, y2, o = {}) {
  return arrow(cx, y1 + 4, cx, y2 - 5, o)
}

// ================================================================ diagram 1
// Token mechanism: one long context, four status-check model turns.

function diagram1() {
  const W = 720
  const H = 840
  const M = 28
  const prims = []

  // header
  prims.push(text(M, 46, "Why repeated status checks consume so many tokens", { size: 24, weight: 700, fill: palette.ink }))
  prims.push(text(M, 72, "Each status check invokes the model again with the accumulated context.", { size: 15.5, fill: palette.muted }))
  prims.push(line([[M, 90], [W - M, 90]], { stroke: palette.frame, sw: 1 }))

  // left: accumulated-context stack
  const sx = M, sy = 112, sw2 = 224, sh = 508
  prims.push(rect(sx, sy, sw2, sh, { rx: 14, fill: palette.violet, stroke: palette.violetStroke }))
  prims.push(text(sx + sw2 / 2, sy + 32, "The conversation so far", { size: 17, weight: 700, fill: palette.violetInk, anchor: "middle" }))
  const chips = ["Task instructions", "Files it has read", "Edits and test runs", "Every previous turn", "\u2026and it keeps growing"]
  const chipH = 48
  const chipGap = 34
  chips.forEach((label, i) => {
    const cy = sy + 50 + i * (chipH + chipGap)
    prims.push(rect(sx + 14, cy, sw2 - 28, chipH, { rx: 10, fill: palette.canvas, stroke: palette.violetChip, sw: 1.4 }))
    prims.push(text(sx + sw2 / 2, cy + chipH / 2 + 5.5, label, { size: 15, fill: palette.body, anchor: "middle" }))
  })
  const badgeY = sy + sh - 68
  prims.push(rect(sx + 14, badgeY, sw2 - 28, 52, { rx: 10, fill: palette.violetSolid, stroke: "none", sw: 0 }))
  prims.push(text(sx + sw2 / 2, badgeY + 33, "\u2248 296K raw tokens", { size: 17, weight: 700, fill: "#ffffff", anchor: "middle" }))

  // right: four status-check model turns
  const rx = 296, rw = W - M - rx // 396
  const rh = 112
  const rowGap = 20
  const rowYs = [112, 244, 376, 508]
  rowYs.forEach((ry, i) => {
    if (i > 0) {
      prims.push(arrow(rx + rw / 2, ry - rowGap + 3, rx + rw / 2, ry - 4, { stroke: palette.faint, sw: 2 }))
    }
    // context feeds every turn
    prims.push(arrow(sx + sw2, ry + rh / 2, rx - 4, ry + rh / 2, { stroke: palette.line }))
    prims.push(rect(rx, ry, rw, rh, { rx: 12, fill: palette.rose, stroke: palette.roseStroke }))
    prims.push(text(rx + 20, ry + 32, `Status check #${i + 1}`, { size: 17, weight: 700, fill: palette.ink }))
    prims.push(text(rx + rw - 20, ry + 32, "\u2248 296K raw", { size: 16.5, weight: 700, fill: palette.roseDeep, anchor: "end" }))
    prims.push(text(rx + 20, ry + 59, "CI result: \u201Cstill running\u201D", { size: 15, fill: palette.body }))
    prims.push(text(rx + 20, ry + 81, "Model invoked \u2014 full context re-processed", { size: 15, fill: palette.body }))
    prims.push(text(rx + 20, ry + 102, "Answer: \u201Ckeep waiting\u201D", { size: 15, fill: palette.muted }))
  })

  // evidence banner
  const bx = M, by = 656, bw = W - 2 * M, bh = 118
  prims.push(rect(bx, by, bw, bh, { rx: 14, fill: palette.banner, stroke: palette.bannerStroke }))
  prims.push(text(bx + bw / 2, by + 36, "Observed: 4 status-check turns \u2248 1.184M raw processed tokens", { size: 18, weight: 700, fill: palette.ink, anchor: "middle" }))
  prims.push(text(bx + bw / 2, by + 64, "\u2248 296K each \u2014 the conversation was already this long", { size: 15, fill: palette.body, anchor: "middle" }))
  prims.push(text(bx + bw / 2, by + 92, "Mostly cached input \u2014 not equivalent fresh-token billing.", { size: 14.5, fill: palette.muted, anchor: "middle" }))

  // footer
  prims.push(text(M, 812, "Evidence: AgentSessions audit \u00B7 632 Codex sessions since 1 Aug 2026", { size: 15, fill: palette.muted }))

  return {
    slug: "wait-loop-context",
    svg: renderSvg({
      w: W,
      h: H,
      title: "Why repeated status checks consume so many tokens",
      desc: "The accumulated coding-agent context feeds four repeated CI status checks. Each status result invokes the model again and re-processes the full context. One observed sequence of four GitHub Actions status-check turns totalled about 1.184 million raw processed tokens, roughly 296K each, mostly cached input and not equivalent to fresh-token billing.",
      prims,
    }),
    excalidraw: renderExcalidraw({ prims }),
  }
}

// ================================================================ diagram 2
// Before vs after: model status-check loop vs CI handoff.

function diagram2() {
  const W = 720
  const H = 1170
  const M = 28
  const prims = []

  // header
  prims.push(text(M, 46, "Before and after CI_HANDOFF", { size: 24, weight: 700, fill: palette.ink }))
  prims.push(text(M, 72, "Before: status results return to the model. After: CI handles them without a model call.", { size: 15.5, fill: palette.muted }))
  prims.push(line([[M, 90], [W - M, 90]], { stroke: palette.frame, sw: 1 }))

  const laneY = 110
  const laneH = 1000
  const laneW = 320
  const beforeX = M // 28..348
  const afterX = W - M - laneW // 372..692

  // ------------------------------------------------------------- BEFORE lane
  prims.push(rect(beforeX, laneY, laneW, laneH, { rx: 16, fill: palette.laneBeforeBg, stroke: palette.laneBeforeStroke }))
  prims.push(text(beforeX + 18, laneY + 34, "Before \u2014 status checks return to the model", { size: 13.5, weight: 700, fill: palette.roseDeep }))

  const bNodeX = beforeX + 34 // 62
  const bNodeW = 268
  const bCx = bNodeX + bNodeW / 2 // 196
  const bGap = 46
  const bStart = laneY + 56 // 166

  const beforeNodes = [
    { h: 64, fill: palette.blue, stroke: palette.blueStroke, title: "Agent makes the edit", lines: [{ text: "the useful work" }] },
    { h: 64, fill: palette.blue, stroke: palette.blueStroke, title: "Targeted checks", lines: [{ text: "tests that inform the edit" }] },
    { h: 64, fill: palette.amber, stroke: palette.amberStroke, title: "Starts broader validation", lines: [{ text: "CI + Vercel deploy" }] },
    { h: 64, fill: palette.amber, stroke: palette.amberStroke, title: "Waits for CI / deploy", lines: [{ text: "minutes pass" }] },
    { h: 64, fill: palette.rose, stroke: palette.roseStroke, title: "Status returns to model", lines: [{ text: "\u201Cstill running\u201D" }] },
    { h: 64, fill: palette.rosePanel, stroke: palette.rosePanelStroke, sw: 2, title: "Model re-entry", lines: [{ text: "context re-processed \u00B7 \u2248296K raw", fill: palette.roseDeep }] },
    { h: 44, repeat: true },
    { h: 64, fill: palette.green, stroke: palette.greenStroke, title: "Browser / deploy proof", lines: [{ text: "after validation completes" }] },
    { h: 64, panel: true },
  ]

  let by = bStart
  const beforeYs = []
  beforeNodes.forEach((node, i) => {
    beforeYs.push(by)
    if (i > 0) prims.push(downArrow(bCx, beforeYs[i - 1] + beforeNodes[i - 1].h, by))
    if (node.repeat) {
      prims.push(rect(bNodeX, by, bNodeW, node.h, { rx: 10, fill: "none", stroke: palette.roseStroke, dashed: "6 5" }))
      prims.push(text(bCx, by + node.h / 2 + 5, "not done \u2192 check again (\u00D74)", { size: 15, weight: 600, fill: palette.roseDeep, anchor: "middle" }))
    } else if (node.panel) {
      prims.push(rect(bNodeX, by, bNodeW, node.h, { rx: 10, fill: palette.rosePanel, stroke: palette.rosePanelStroke }))
      prims.push(text(bCx, by + 27, "4 status checks, one sequence", { size: 14.5, weight: 600, fill: palette.rosePanelInk, anchor: "middle" }))
      prims.push(text(bCx, by + 49, "\u2248 1.184M raw processed tokens", { size: 14.5, weight: 700, fill: palette.rosePanelInk, anchor: "middle" }))
    } else {
      prims.push(...nodeCard(bNodeX, by, bNodeW, node.h, node))
    }
    by += node.h + bGap
  })

  // repeated-check loop: repeat row -> back up to "Waits for CI / deploy"
  const repeatY = beforeYs[6]
  const waitY = beforeYs[3]
  const loopX = beforeX + 17
  prims.push(line(
    [[bNodeX, repeatY + 22], [loopX, repeatY + 22], [loopX, waitY + 32], [bNodeX - 5, waitY + 32]],
    { stroke: palette.roseLine, sw: 2, dashed: "6 5", head: true },
  ))

  // -------------------------------------------------------------- AFTER lane
  prims.push(rect(afterX, laneY, laneW, laneH, { rx: 16, fill: palette.laneAfterBg, stroke: palette.laneAfterStroke }))
  prims.push(text(afterX + 18, laneY + 34, "After \u2014 CI handles post-handoff work", { size: 13.5, weight: 700, fill: palette.greenDeep }))

  const aNodeX = afterX + 26 // 398
  const aNodeW = 268
  const aCx = aNodeX + aNodeW / 2 // 532

  // model-side chain
  const a1 = { y: laneY + 56, h: 56 } // 166
  const a2 = { y: a1.y + a1.h + 18, h: 60 } // 240
  const a3 = { y: a2.y + a2.h + 18, h: 60 } // 318
  const a4 = { y: a3.y + a3.h + 18, h: 64 } // 396
  prims.push(...nodeCard(aNodeX, a1.y, aNodeW, a1.h, { fill: palette.blue, stroke: palette.blueStroke, title: "Agent makes the edit", lines: [{ text: "the useful work" }] }))
  prims.push(downArrow(aCx, a1.y + a1.h, a2.y))
  prims.push(...nodeCard(aNodeX, a2.y, aNodeW, a2.h, { fill: palette.blue, stroke: palette.blueStroke, title: "Targeted checks", lines: [{ text: "just what the next edit needs" }] }))
  prims.push(downArrow(aCx, a2.y + a2.h, a3.y))
  prims.push(...nodeCard(aNodeX, a3.y, aNodeW, a3.h, {
    fill: palette.greenSolid, stroke: "none", sw: 0,
    title: "CI_HANDOFF", mono: true, titleSize: 19, titleFill: "#ffffff",
    lines: [{ text: "commit \u00B7 hand off \u00B7 stop", fill: palette.greenHandoffSub, size: 14 }],
  }))
  prims.push(downArrow(aCx, a3.y + a3.h, a4.y))
  prims.push(...nodeCard(aNodeX, a4.y, aNodeW, a4.h, {
    fill: palette.emeraldPanel, stroke: palette.emeraldStroke,
    title: "Model exits",
    lines: [{ text: "0 post-handoff model turns", size: 15.5, weight: 700, fill: palette.emeraldInk }],
  }))

  // CI zone
  const zoneX = afterX + 12 // 384
  const zoneW = 296
  const zoneY = a4.y + a4.h + 24 // 484
  const zoneH = 518
  const zoneCx = zoneX + zoneW / 2 // 532
  prims.push(downArrow(aCx, a4.y + a4.h, zoneY))
  prims.push(rect(zoneX, zoneY, zoneW, zoneH, { rx: 14, fill: palette.canvas, stroke: palette.faint }))
  prims.push(text(zoneX + 14, zoneY + 27, "CI \u2014 CPU time, zero model tokens", { size: 14, weight: 700, fill: palette.muted }))

  // GitHub Actions trigger
  const ghY = zoneY + 40 // 524
  const ghX = zoneX + 12 // 396
  const ghW = zoneW - 24 // 272
  prims.push(rect(ghX, ghY, ghW, 48, { rx: 10, fill: palette.dark, stroke: "none", sw: 0 }))
  prims.push(circle(ghX + 22, ghY + 24, 8.5, { stroke: palette.darkText, sw: 1.6 }))
  prims.push(line([[ghX + 19.5, ghY + 19.5], [ghX + 26.5, ghY + 24], [ghX + 19.5, ghY + 28.5]], { stroke: palette.darkText, sw: 1.4, close: true, fill: palette.darkText }))
  prims.push(text(ghX + 44, ghY + 30, "GitHub Actions triggers", { size: 15.5, weight: 600, fill: palette.darkText }))

  // self-hosted Mac runner
  const runY = ghY + 48 + 20 // 592
  const runH = 290
  prims.push(downArrow(zoneCx, ghY + 48, runY, { stroke: palette.line }))
  prims.push(rect(ghX, runY, ghW, runH, { rx: 12, fill: palette.indigo, stroke: palette.indigoStroke }))
  prims.push(text(zoneCx, runY + 25, "Self-hosted Mac runner", { size: 15, weight: 700, fill: palette.indigoInk, anchor: "middle" }))

  const steps = [
    { label: "Locked install" },
    { label: "Broad Vitest + build" },
    { label: "Vercel wait + polling", vercel: true },
    { label: "Live URL wait" },
    { label: "Production Playwright" },
    { label: "Proof artifact \u00B7 screenshots" },
  ]
  const chipX = ghX + 12 // 408
  const chipW = ghW - 24 // 248
  const chipH = 34
  const chipGap = 9
  const chipY0 = runY + 36 // 628
  steps.forEach((step, i) => {
    const cy = chipY0 + i * (chipH + chipGap)
    if (i > 0) {
      prims.push(line([[zoneCx - 4, cy - chipGap + 2], [zoneCx, cy - chipGap / 2 + 1], [zoneCx + 4, cy - chipGap + 2]], { stroke: palette.indigoChip, sw: 1.6 }))
    }
    if (step.vercel) {
      prims.push(rect(chipX, cy, chipW, chipH, { rx: 8, fill: palette.zinc, stroke: palette.zincStroke, sw: 1.4 }))
      prims.push(text(chipX + 12, cy + 22.5, String(i + 1), { size: 13, weight: 700, fill: palette.zincNum }))
      prims.push(line([[chipX + 32, cy + 23], [chipX + 37.5, cy + 12], [chipX + 43, cy + 23]], { stroke: palette.zincInk, sw: 1, close: true, fill: palette.zincInk }))
      prims.push(text(chipX + 51, cy + 22.5, step.label, { size: 14, fill: palette.zincInk }))
    } else {
      prims.push(rect(chipX, cy, chipW, chipH, { rx: 8, fill: palette.canvas, stroke: palette.indigoChip, sw: 1.4 }))
      prims.push(text(chipX + 12, cy + 22.5, String(i + 1), { size: 13, weight: 700, fill: palette.indigoNum }))
      prims.push(text(chipX + 32, cy + 22.5, step.label, { size: 14, fill: palette.body }))
    }
  })
  const runBottom = chipY0 + 6 * chipH + 5 * chipGap + 10 // 882

  // outcomes: green silence vs one repair worker
  const outY = zoneY + zoneH - 14 - 76 // 912
  const outW = 130
  const outLX = ghX // 396
  const outRX = ghX + ghW - outW // 538
  prims.push(line([[zoneCx, runBottom], [zoneCx, outY - 12]], { stroke: palette.line, sw: 2 }))
  prims.push(line([[zoneCx, outY - 12], [outLX + outW / 2, outY - 12], [outLX + outW / 2, outY - 3]], { stroke: palette.greenLine, sw: 2, head: true }))
  prims.push(line([[zoneCx, outY - 12], [outRX + outW / 2, outY - 12], [outRX + outW / 2, outY - 3]], { stroke: palette.amberStroke, sw: 2, head: true }))
  prims.push(...nodeCard(outLX, outY, outW, 76, {
    rx: 10, fill: palette.greenPanel, stroke: palette.greenStroke, titleSize: 15.5, lineSize: 13,
    title: "All green", titleFill: palette.greenPanelInk,
    lines: [{ text: "no model call", size: 13 }, { text: "0 model turns", size: 13, weight: 700, fill: palette.greenDeep }],
  }))
  prims.push(...nodeCard(outRX, outY, outW, 76, {
    rx: 10, fill: palette.amber, stroke: palette.bannerStroke, titleSize: 15.5, lineSize: 13,
    title: "Failure", titleFill: palette.amberDeep,
    lines: [{ text: "repair worker", size: 13, fill: palette.amberDeep }, { text: "compact packet", size: 13, fill: palette.amberDeep }],
  }))

  // after-lane summary panel
  const panelY = zoneY + zoneH + 24 // 1026
  prims.push(rect(aNodeX, panelY, aNodeW, 64, { rx: 10, fill: palette.greenPanel, stroke: palette.greenStroke }))
  prims.push(text(aCx, panelY + 27, "Successful change:", { size: 15, weight: 700, fill: palette.greenPanelInk, anchor: "middle" }))
  prims.push(text(aCx, panelY + 49, "0 post-handoff model turns", { size: 15, weight: 700, fill: palette.greenDeep, anchor: "middle" }))

  // footer
  prims.push(text(M, 1146, "Evidence: AgentSessions audit \u00B7 Codex sessions since 1 Aug 2026", { size: 15, fill: palette.muted }))

  return {
    slug: "before-after-handoff",
    svg: renderSvg({
      w: W,
      h: H,
      title: "Before and after CI_HANDOFF",
      desc: "Two flows side by side. Before: the agent writes code, runs targeted checks, starts broader validation and deploy, waits, the status result returns to the model, and the model re-enters and re-processes the whole conversation, about 296K raw tokens a turn; the check repeats \u2014 four times in one observed sequence, about 1.184 million raw processed tokens \u2014 before browser and deploy proof. After: the agent writes code, runs targeted checks, emits CI_HANDOFF and the model exits with zero post-handoff model turns; GitHub Actions triggers a self-hosted Mac runner that does the locked install, broad Vitest and build, Vercel wait and status polling, live URL wait, production Playwright checks and a proof artifact; an all-green run invokes no model, while a failure can invoke one repair worker with a compact failure packet.",
      prims,
    }),
    excalidraw: renderExcalidraw({ prims }),
  }
}

// ---------------------------------------------------------------- write out

const outputs = [diagram1(), diagram2()]

for (const out of outputs) {
  fs.writeFileSync(path.join(imageDir, `${out.slug}.svg`), out.svg)
  fs.writeFileSync(path.join(downloadDir, `local-ci-token-savings-${out.slug}.excalidraw`), out.excalidraw)
  JSON.parse(out.excalidraw) // sanity: editable source must parse
  console.log("OK", out.slug)
}

console.log(`Generated ${outputs.length} SVG diagrams in public/images/blog/local-ci-token-savings/ and ${outputs.length} editable Excalidraw sources in public/downloads/.`)
