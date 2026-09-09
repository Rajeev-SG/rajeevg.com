import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const imageDir = path.join(root, "public/images/blog/local-ci-token-savings")
const downloadDir = path.join(root, "public/downloads")
fs.mkdirSync(imageDir, { recursive: true })
fs.mkdirSync(downloadDir, { recursive: true })

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

function esc(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
}

// ---------------------------------------------------------------- diagram 1
// Why a tiny status check consumes a huge amount of context processing.
const contextLoop = {
  slug: "wait-loop-context",
  w: 1280,
  h: 720,
  title: "One tiny question, one enormous re-read",
  subtitle: "Every \u201Cdone yet?\u201D drags the whole accumulated conversation back through the model. The answer changes nothing; the input is everything.",
  footer: "Evidence: AgentSessions audit of 632 Codex sessions since 1 Aug 2026 \u00B7 figure drawn 9 Sep 2026",
  stack: {
    x: 64, y: 150, w: 330, h: 398,
    title: "The conversation so far",
    layers: [
      "the task instructions",
      "every file it has read",
      "every edit and test run",
      "every previous turn",
      "\u2026and it keeps growing",
    ],
    badge: "hundreds of thousands of tokens",
  },
  rows: [
    { y: 166, n: 1 },
    { y: 262, n: 2 },
    { y: 358, n: 3 },
    { y: 454, n: 4 },
  ],
  rowBox: { x: 520, w: 470, h: 72 },
  banner: {
    x: 64, y: 596, w: 1152, h: 76,
    line1: "One observed sequence: four status checks \u2248 1,184,000 raw processed tokens",
    line2: "raw processed \u2260 billed fresh \u2014 most of that input was cached; the cost is wasted turns, quota and latency",
  },
}

// ---------------------------------------------------------------- diagram 2
// Before vs after: who owns the waiting.
const beforeAfter = {
  slug: "before-after-handoff",
  w: 1280,
  h: 780,
  title: "Same job \u2014 so who owns the waiting?",
  subtitle: "Before: every status check was a model turn that re-read the whole conversation. After: the agent exits, and a normal program waits for free.",
  footer: "Evidence: AgentSessions audit, 632 Codex sessions since 1 Aug 2026 \u00B7 four-wake sequence observed Sep 2026 \u00B7 raw processed tokens, mostly cached input",
  lanes: {
    before: { x: 48, y: 126, w: 1184, h: 262, label: "BEFORE \u2014 the model owns every minute of the wait" },
    after: { x: 48, y: 430, w: 1184, h: 286, label: "AFTER \u2014 CI owns the wait, and waiting is free" },
  },
  beforeNodes: [
    { x: 96, w: 140, fill: "blue", title: "Agent codes", lines: ["the useful work"] },
    { x: 266, w: 140, fill: "blue", title: "Runs checks", lines: ["tests and build"] },
    { x: 436, w: 150, fill: "amber", title: "Waits for CI", lines: ["minutes pass"] },
    { x: 616, w: 200, fill: "rose", title: "Wakes up", lines: ["the whole conversation", "back through the model"] },
    { x: 846, w: 160, fill: "rose", title: "Checks status", lines: ["one tiny answer,", "one full model turn"] },
    { x: 1036, w: 150, fill: "green", title: "Finally done", lines: ["deployment proof,", "after more waiting"] },
  ],
  beforeLoop: {
    from: [926, 286], via: [718, 352], to: [511, 286],
    label1: "not done \u2192 wait, wake, re-read, ask again",
    label2: "\u00D74 wake-ups in one recent sequence",
  },
  divider: "the wake \u2192 re-read \u2192 check loops are exactly what got deleted",
  afterNodes: [
    { x: 96, y: 486, w: 140, h: 104, fill: "blue", title: "Agent codes", lines: ["the useful work"] },
    { x: 266, y: 486, w: 170, h: 104, fill: "blue", title: "Targeted checks", lines: ["just what the", "next edit needs"] },
    { x: 466, y: 486, w: 196, h: 104, fill: "green", title: "CI_HANDOFF", lines: ["commit, hand off,", "agent exits"], strong: true },
    { x: 702, y: 486, w: 252, h: 104, fill: "purple", title: "CI keeps going", lines: ["tests \u00B7 build \u00B7 wait for", "deployment \u00B7 browser proof"] },
    { x: 1010, y: 456, w: 198, h: 72, fill: "green", title: "All green", lines: ["no model ever wakes \u2014", "the proof is the artifact"] },
    { x: 1010, y: 556, w: 198, h: 76, fill: "amber", title: "Failure", lines: ["one cheap worker wakes", "with the failing output"] },
  ],
  ghostLoop: { from: [828, 590], via: [696, 640], to: [564, 590] },
  afterNotes: [
    { x: 564, text: "model tokens after this point: 0", bold: true, color: "greenStroke" },
    { x: 905, text: "waiting costs CPU seconds, not model turns", italic: true, color: "muted" },
  ],
}

// ---------------------------------------------------------------- SVG build
const HAND = `"Comic Sans MS", "Bradley Hand", cursive`
const SERIF = `Georgia, serif`

function marker(color) {
  return `<marker id="arr-${color}" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto"><path d="M 0 0 L 9 5 L 0 10 z" fill="${palette[color] || color}"/></marker>`
}

function defsBlock() {
  return `  <defs>
    <pattern id="dots" width="28" height="28" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.1" fill="${palette.grid}"/></pattern>
    <filter id="wobble" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="2" seed="11" result="noise"/><feDisplacementMap in="SourceGraphic" in2="noise" scale="0.85"/></filter>
${["ink", "roseStroke", "greenStroke", "amberStroke", "purpleStroke", "blueStroke", "muted"].map((c) => `    ${marker(c)}`).join("\n")}
    <style>
      .rough { filter: url(#wobble); }
      .title { font: 700 34px ${SERIF}; fill: ${palette.ink}; }
      .subtitle { font: 18px ${SERIF}; fill: ${palette.muted}; }
      .lane-label { font: 700 17px ${HAND}; letter-spacing: 1px; }
      .node-title { font: 700 17px ${HAND}; fill: ${palette.ink}; }
      .node-title-strong { font: 700 23px ${HAND}; fill: ${palette.ink}; }
      .body { font: 14px ${HAND}; fill: ${palette.ink}; }
      .small { font: 14px ${HAND}; fill: ${palette.muted}; }
      .tag { font: 700 17px ${HAND}; fill: ${palette.ink}; }
      .arrow-label { font: 14px ${HAND}; fill: ${palette.muted}; paint-order: stroke; stroke: ${palette.paper}; stroke-width: 7px; }
      .banner-main { font: 700 20px ${HAND}; fill: ${palette.ink}; }
      .banner-sub { font: 15px ${HAND}; fill: ${palette.muted}; }
      .footer { font: 15px ${SERIF}; font-style: italic; fill: ${palette.muted}; }
    </style>
  </defs>`
}

function header(d) {
  return `  <rect width="${d.w}" height="${d.h}" fill="${palette.paper}"/>
  <rect width="${d.w}" height="${d.h}" fill="url(#dots)" opacity=".68"/>
  <text x="48" y="58" class="title">${esc(d.title)}</text>
  <text x="48" y="90" class="subtitle">${esc(d.subtitle)}</text>
  <path d="M 48 104 C 330 101, 580 108, 846 103 S 1125 106, ${d.w - 50} 102" fill="none" stroke="${palette.ink}" stroke-width="2" stroke-opacity=".18" class="rough"/>`
}

function footerOf(d) {
  return `  <path d="M 48 ${d.h - 30} C 360 ${d.h - 34}, 620 ${d.h - 26}, 950 ${d.h - 32} S 1160 ${d.h - 29}, ${d.w - 50} ${d.h - 33}" fill="none" stroke="${palette.ink}" stroke-width="1.5" stroke-opacity=".18" class="rough"/>
  <text x="48" y="${d.h - 8}" class="footer">${esc(d.footer)}</text>`
}

function arrowPath(a) {
  const [x1, y1] = a.from
  const [x2, y2] = a.to
  const dash = a.dashed ? ' stroke-dasharray="10 9"' : ""
  const color = palette[a.color || "ink"]
  const op = a.opacity ? ` opacity="${a.opacity}"` : ""
  const d = a.via
    ? `M ${x1} ${y1} Q ${a.via[0]} ${a.via[1]}, ${x2} ${y2}`
    : `M ${x1} ${y1} C ${(x1 + x2) / 2} ${y1}, ${(x1 + x2) / 2} ${y2}, ${x2} ${y2}`
  const markerEnd = a.noHead ? "" : ` marker-end="url(#arr-${a.color || "ink"})"`
  const label = a.label
    ? `<text x="${a.labelAt[0]}" y="${a.labelAt[1]}" text-anchor="middle" class="arrow-label"${a.labelColor ? ` fill="${palette[a.labelColor]}"` : ""}>${esc(a.label)}</text>`
    : ""
  return `  <g${op}><path d="${d}" fill="none" stroke="${color}" stroke-width="${a.width || 2.5}"${dash}${markerEnd} class="rough"/>${label}</g>`
}

function nodeBlock(n, y, h, opts = {}) {
  const fill = palette[n.fill]
  const stroke = palette[n.fill + "Stroke"]
  const cx = n.x + n.w / 2
  const lines = n.lines || []
  const contentH = 24 + lines.length * 21
  const top = y + (h - contentH) / 2
  const titleClass = n.strong ? "node-title-strong" : "node-title"
  const sw = n.strong ? 4 : 3
  const texts = [`<text x="${cx}" y="${top + 18}" text-anchor="middle" class="${titleClass}">${esc(n.title)}</text>`]
  lines.forEach((line, i) => {
    texts.push(`<text x="${cx}" y="${top + 18 + (i + 1) * 21}" text-anchor="middle" class="body">${esc(line)}</text>`)
  })
  const rotate = opts.rotate === undefined ? (opts.index ?? 0) % 2 === 0 ? -0.2 : 0.2 : opts.rotate
  return `  <g transform="rotate(${rotate} ${cx} ${y + h / 2})"><rect x="${n.x}" y="${y}" width="${n.w}" height="${h}" rx="16" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" class="rough"/><rect x="${n.x + 4}" y="${y + 4}" width="${n.w - 8}" height="${h - 8}" rx="12" fill="none" stroke="${stroke}" stroke-opacity=".22" stroke-width="1.5"/>
${texts.map((t) => "    " + t).join("\n")}
  </g>`
}

function svgContextLoop(d) {
  const s = d.stack
  const parts = [header(d)]
  // accumulated-context stack
  parts.push(`  <g><rect x="${s.x}" y="${s.y}" width="${s.w}" height="${s.h}" rx="18" fill="${palette.purple}" stroke="${palette.purpleStroke}" stroke-width="3" class="rough"/>
    <text x="${s.x + s.w / 2}" y="${s.y + 36}" text-anchor="middle" class="node-title">${esc(s.title)}</text>`)
  s.layers.forEach((layer, i) => {
    const ly = s.y + 58 + i * 52
    parts.push(`    <rect x="${s.x + 20}" y="${ly}" width="${s.w - 40}" height="42" rx="10" fill="#f6f2ff" stroke="${palette.purpleStroke}" stroke-opacity=".55" stroke-width="1.5" class="rough"/>
    <text x="${s.x + s.w / 2}" y="${ly + 27}" text-anchor="middle" class="body">${esc(layer)}</text>`)
  })
  parts.push(`    <rect x="${s.x + 12}" y="${s.y + s.h - 62}" width="${s.w - 24}" height="44" rx="12" fill="${palette.purpleStroke}" class="rough"/>
    <text x="${s.x + s.w / 2}" y="${s.y + s.h - 34}" text-anchor="middle" class="tag" font-size="15" fill="${palette.paper}">${esc(s.badge)}</text>
  </g>`)
  // wake-up rows
  const rb = d.rowBox
  d.rows.forEach((row, i) => {
    const cy = row.y + rb.h / 2
    parts.push(arrowPath({ from: [s.x + s.w, cy], to: [rb.x, cy], color: "ink", width: 2.5 }))
    parts.push(`  <g><rect x="${rb.x}" y="${row.y}" width="${rb.w}" height="${rb.h}" rx="16" fill="${palette.rose}" stroke="${palette.roseStroke}" stroke-width="3" class="rough"/>
    <text x="${rb.x + rb.w / 2}" y="${row.y + 30}" text-anchor="middle" class="node-title">Wake-up #${row.n}: \u201Cdone yet?\u201D</text>
    <text x="${rb.x + rb.w / 2}" y="${row.y + 54}" text-anchor="middle" class="body">the whole conversation re-processed to answer: \u201Cstill running\u201D</text>
  </g>
  <text x="1006" y="${row.y + 34}" class="tag">\u2248 296K raw tokens</text>
  <text x="1006" y="${row.y + 56}" class="small">(average per wake-up)</text>`)
  })
  // growth loop back to the stack
  const last = d.rows[d.rows.length - 1]
  parts.push(arrowPath({
    from: [rb.x + rb.w / 2, last.y + rb.h],
    via: [500, 564],
    to: [s.x + s.w / 2, s.y + s.h],
    dashed: true,
    color: "purpleStroke",
    width: 2.5,
    label: "each wake makes the pile bigger",
    labelAt: [430, 588],
    labelColor: "purpleStroke",
  }))
  // banner
  const b = d.banner
  parts.push(`  <g><rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" rx="18" fill="${palette.amber}" stroke="${palette.amberStroke}" stroke-width="3" class="rough"/>
    <text x="${b.x + b.w / 2}" y="${b.y + 32}" text-anchor="middle" class="banner-main">${esc(b.line1)}</text>
    <text x="${b.x + b.w / 2}" y="${b.y + 58}" text-anchor="middle" class="banner-sub">${esc(b.line2)}</text>
  </g>`)
  parts.push(footerOf(d))
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${d.w} ${d.h}" role="img" aria-labelledby="title desc">
  <title id="title">${esc(d.title)}</title>
  <desc id="desc">A large stack labelled "the conversation so far" feeds four repeated model wake-ups. Each wake-up re-processes hundreds of thousands of tokens of accumulated context to answer "done yet?" with "still running". One observed sequence of four GitHub Actions status checks processed about 1.184 million raw tokens, mostly cached input.</desc>
${defsBlock()}
${parts.join("\n")}
</svg>
`
}

function svgBeforeAfter(d) {
  const parts = [header(d)]
  const bl = d.lanes.before
  const al = d.lanes.after
  // BEFORE lane
  parts.push(`  <rect x="${bl.x}" y="${bl.y}" width="${bl.w}" height="${bl.h}" rx="20" fill="${palette.rose}" fill-opacity=".22" stroke="${palette.roseStroke}" stroke-width="2" stroke-dasharray="10 8" class="rough"/>
  <text x="72" y="${bl.y + 32}" class="lane-label" fill="${palette.roseStroke}">${esc(bl.label)}</text>`)
  const by = 182
  const bh = 104
  d.beforeNodes.forEach((n, i) => {
    if (i > 0) {
      const prev = d.beforeNodes[i - 1]
      parts.push(arrowPath({ from: [prev.x + prev.w, by + bh / 2], to: [n.x, by + bh / 2], color: "ink", width: 2.5 }))
    }
    parts.push(nodeBlock(n, by, bh, { index: i }))
  })
  const loop = d.beforeLoop
  parts.push(`  <g><path d="M ${loop.from[0]} ${loop.from[1]} Q ${loop.via[0]} ${loop.via[1]}, ${loop.to[0]} ${loop.to[1]}" fill="none" stroke="${palette.roseStroke}" stroke-width="3" stroke-dasharray="10 9" marker-end="url(#arr-roseStroke)" class="rough"/>
    <text x="718" y="348" text-anchor="middle" class="arrow-label" fill="${palette.roseStroke}">${esc(loop.label1)}</text>
    <text x="718" y="370" text-anchor="middle" class="arrow-label" fill="${palette.roseStroke}">${esc(loop.label2)}</text>
  </g>`)
  // divider
  parts.push(arrowPath({ from: [640, bl.y + bl.h + 4], to: [640, al.y - 6], color: "ink", width: 2.5 }))
  parts.push(`  <text x="664" y="${(bl.y + bl.h + al.y) / 2 + 5}" class="small" font-style="italic">${esc(d.divider)}</text>`)
  // AFTER lane
  parts.push(`  <rect x="${al.x}" y="${al.y}" width="${al.w}" height="${al.h}" rx="20" fill="${palette.green}" fill-opacity=".22" stroke="${palette.greenStroke}" stroke-width="2" stroke-dasharray="10 8" class="rough"/>
  <text x="72" y="${al.y + 32}" class="lane-label" fill="${palette.greenStroke}">${esc(al.label)}</text>`)
  const an = d.afterNodes
  const chain = [0, 1, 2, 3]
  chain.forEach((idx, i) => {
    const n = an[idx]
    if (i > 0) {
      const prev = an[chain[i - 1]]
      parts.push(arrowPath({ from: [prev.x + prev.w, n.y + n.h / 2], to: [n.x, n.y + n.h / 2], color: "ink", width: 2.5 }))
    }
    parts.push(nodeBlock(n, n.y, n.h, { index: idx }))
  })
  const a4 = an[3]
  const a5 = an[4]
  const a6 = an[5]
  parts.push(arrowPath({ from: [a4.x + a4.w - 20, a4.y + 18], to: [a5.x, a5.y + a5.h / 2], color: "greenStroke", width: 2.5 }))
  parts.push(arrowPath({ from: [a4.x + a4.w - 20, a4.y + a4.h - 18], to: [a6.x, a6.y + a6.h / 2], color: "amberStroke", width: 2.5 }))
  parts.push(nodeBlock(a5, a5.y, a5.h, { index: 4 }))
  parts.push(nodeBlock(a6, a6.y, a6.h, { index: 5 }))
  // ghost of the deleted loop, crossed out
  const g = d.ghostLoop
  parts.push(`  <g opacity=".5"><path d="M ${g.from[0]} ${g.from[1]} Q ${g.via[0]} ${g.via[1]}, ${g.to[0]} ${g.to[1]}" fill="none" stroke="${palette.roseStroke}" stroke-width="2.5" stroke-dasharray="9 8" class="rough"/>
    <path d="M ${(g.via[0]) - 11} ${g.via[1] - 34} l 22 22 M ${(g.via[0]) + 11} ${g.via[1] - 34} l -22 22" stroke="${palette.roseStroke}" stroke-width="4" stroke-linecap="round"/>
  </g>`)
  d.afterNotes.forEach((note) => {
    const cls = note.bold ? "tag" : "small"
    const style = note.italic ? ' font-style="italic"' : ""
    parts.push(`  <text x="${note.x}" y="676" text-anchor="middle" class="${cls}" fill="${palette[note.color]}"${style}>${esc(note.text)}</text>`)
  })
  parts.push(footerOf(d))
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${d.w} ${d.h}" role="img" aria-labelledby="title desc">
  <title id="title">${esc(d.title)}</title>
  <desc id="desc">Two flows. Before: the agent writes code, runs checks, waits for CI, then repeatedly wakes up, re-reads the whole conversation and checks status again, four times in one observed sequence, before deployment proof. After: the agent writes code, runs targeted checks, emits CI_HANDOFF and exits with zero further model tokens; CI runs tests, build, deployment wait and browser proof for free, green results wake nobody, and only a failure wakes one cheap worker with the failing output.</desc>
${defsBlock()}
${parts.join("\n")}
</svg>
`
}

// ---------------------------------------------------------------- excalidraw
let elementCounter = 0
function baseElement(type, x, y, width, height, seed, extra = {}) {
  elementCounter += 1
  return {
    id: `lci-${elementCounter.toString(36)}-${seed}`,
    type,
    x, y, width, height, angle: 0,
    strokeColor: extra.stroke || palette.ink,
    backgroundColor: extra.bg || "transparent",
    fillStyle: "solid",
    strokeWidth: extra.sw || 2,
    strokeStyle: extra.dashed ? "dashed" : "solid",
    roughness: 1,
    opacity: extra.opacity ?? 100,
    groupIds: [],
    frameId: null,
    roundness: type === "rectangle" ? { type: 3 } : null,
    seed,
    version: 1,
    versionNonce: seed * 17,
    isDeleted: false,
    boundElements: [],
    updated: 1799600000000,
    link: null,
    locked: false,
  }
}

function textElement(text, x, y, size, color = palette.ink, align = "left") {
  const width = Math.max(80, text.length * size * 0.58)
  const element = baseElement("text", x, y, width, size * 1.25, 1000 + elementCounter, { stroke: color })
  return {
    ...element,
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

function arrowElement(from, to, opts = {}) {
  const [x1, y1] = from
  const [x2, y2] = to
  const color = palette[opts.color || "ink"]
  const element = baseElement("arrow", x1, y1, Math.abs(x2 - x1), Math.abs(y2 - y1), 3000 + elementCounter, {
    stroke: color,
    dashed: opts.dashed,
    sw: opts.width || 2,
  })
  const points = opts.via
    ? [[0, 0], [opts.via[0] - x1, opts.via[1] - y1], [x2 - x1, y2 - y1]]
    : [[0, 0], [x2 - x1, y2 - y1]]
  return {
    ...element,
    points,
    startBinding: null,
    endBinding: null,
    lastCommittedPoint: null,
    startArrowhead: null,
    endArrowhead: "arrow",
    elbowed: false,
  }
}

function rectElement(x, y, w, h, fillKey, opts = {}) {
  return baseElement("rectangle", x, y, w, h, 2000 + elementCounter, {
    stroke: palette[fillKey + "Stroke"] || palette.ink,
    bg: palette[fillKey] || "transparent",
    sw: opts.sw || 3,
    dashed: opts.dashed,
    opacity: opts.opacity,
  })
}

function nodeElements(n, y, h, alignCenter = true) {
  const els = [rectElement(n.x, y, n.w, h, n.fill, { sw: n.strong ? 4 : 3 })]
  const lines = n.lines || []
  const contentH = 24 + lines.length * 21
  const top = y + (h - contentH) / 2
  const cx = n.x + n.w / 2
  const place = (text, ty, size, color) => {
    const w = text.length * size * 0.58
    els.push(textElement(text, alignCenter ? cx - w / 2 : n.x + 18, ty, size, color))
  }
  place(n.title, top + 4, n.strong ? 19 : 16)
  lines.forEach((line, i) => place(line, top + 4 + (i + 1) * 21, 13, palette.muted))
  return els
}

function excalidrawContextLoop(d) {
  elementCounter = 0
  const els = [
    textElement(d.title, 48, 30, 30),
    textElement(d.subtitle, 48, 72, 16, palette.muted),
  ]
  const s = d.stack
  els.push(rectElement(s.x, s.y, s.w, s.h, "purple"))
  els.push(textElement(s.title, s.x + 45, s.y + 16, 19))
  s.layers.forEach((layer, i) => {
    const ly = s.y + 58 + i * 52
    els.push(baseElement("rectangle", s.x + 20, ly, s.w - 40, 42, 4000 + elementCounter, { stroke: palette.purpleStroke, bg: "#f6f2ff", sw: 1 }))
    els.push(textElement(layer, s.x + 44, ly + 12, 14, palette.ink))
  })
  els.push(baseElement("rectangle", s.x + 12, s.y + s.h - 62, s.w - 24, 44, 4100 + elementCounter, { stroke: palette.purpleStroke, bg: palette.purpleStroke, sw: 2 }))
  els.push(textElement(s.badge, s.x + 34, s.y + s.h - 50, 15, palette.paper))
  const rb = d.rowBox
  d.rows.forEach((row) => {
    const cy = row.y + rb.h / 2
    els.push(arrowElement([s.x + s.w, cy], [rb.x, cy]))
    els.push(rectElement(rb.x, row.y, rb.w, rb.h, "rose"))
    els.push(textElement(`Wake-up #${row.n}: "done yet?"`, rb.x + 95, row.y + 10, 18))
    els.push(textElement('the whole conversation re-processed to answer: "still running"', rb.x + 22, row.y + 42, 14, palette.muted))
    els.push(textElement("\u2248 296K raw tokens (average)", rb.x + rb.w + 20, row.y + 22, 16))
  })
  const last = d.rows[d.rows.length - 1]
  els.push(arrowElement([rb.x + rb.w / 2, last.y + rb.h], [s.x + s.w / 2, s.y + s.h], { dashed: true, color: "purpleStroke", via: [500, 564] }))
  els.push(textElement("each wake makes the pile bigger", 330, 574, 13, palette.purpleStroke))
  const b = d.banner
  els.push(rectElement(b.x, b.y, b.w, b.h, "amber"))
  els.push(textElement(b.line1, b.x + 200, b.y + 12, 19))
  els.push(textElement(b.line2, b.x + 110, b.y + 46, 14, palette.muted))
  els.push(textElement(d.footer, 48, d.h - 26, 14, palette.muted))
  return JSON.stringify({
    type: "excalidraw",
    version: 2,
    source: "https://excalidraw.com",
    elements: els,
    appState: { gridSize: null, viewBackgroundColor: palette.paper },
    files: {},
  }, null, 2) + "\n"
}

function excalidrawBeforeAfter(d) {
  elementCounter = 0
  const els = [
    textElement(d.title, 48, 30, 30),
    textElement(d.subtitle, 48, 72, 16, palette.muted),
  ]
  const bl = d.lanes.before
  const al = d.lanes.after
  els.push(baseElement("rectangle", bl.x, bl.y, bl.w, bl.h, 5000 + elementCounter, { stroke: palette.roseStroke, bg: palette.rose, dashed: true, sw: 2, opacity: 40 }))
  els.push(textElement(bl.label, 72, bl.y + 12, 16, palette.roseStroke))
  const by = 182
  const bh = 104
  d.beforeNodes.forEach((n, i) => {
    if (i > 0) {
      const prev = d.beforeNodes[i - 1]
      els.push(arrowElement([prev.x + prev.w, by + bh / 2], [n.x, by + bh / 2]))
    }
    els.push(...nodeElements(n, by, bh))
  })
  const loop = d.beforeLoop
  els.push(arrowElement(loop.from, loop.to, { dashed: true, color: "roseStroke", via: loop.via, width: 3 }))
  els.push(textElement(loop.label1, 552, 334, 14, palette.roseStroke))
  els.push(textElement(loop.label2, 580, 356, 14, palette.roseStroke))
  els.push(arrowElement([640, bl.y + bl.h + 4], [640, al.y - 6]))
  els.push(textElement(d.divider, 664, (bl.y + bl.h + al.y) / 2 - 8, 14, palette.muted))
  els.push(baseElement("rectangle", al.x, al.y, al.w, al.h, 5100 + elementCounter, { stroke: palette.greenStroke, bg: palette.green, dashed: true, sw: 2, opacity: 40 }))
  els.push(textElement(al.label, 72, al.y + 12, 16, palette.greenStroke))
  const an = d.afterNodes
  ;[0, 1, 2, 3].forEach((idx, i) => {
    const n = an[idx]
    if (i > 0) {
      const prev = an[[0, 1, 2, 3][i - 1]]
      els.push(arrowElement([prev.x + prev.w, n.y + n.h / 2], [n.x, n.y + n.h / 2]))
    }
    els.push(...nodeElements(n, n.y, n.h))
  })
  els.push(arrowElement([an[3].x + an[3].w - 20, an[3].y + 18], [an[4].x, an[4].y + an[4].h / 2], { color: "greenStroke" }))
  els.push(arrowElement([an[3].x + an[3].w - 20, an[3].y + an[3].h - 18], [an[5].x, an[5].y + an[5].h / 2], { color: "amberStroke" }))
  els.push(...nodeElements(an[4], an[4].y, an[4].h))
  els.push(...nodeElements(an[5], an[5].y, an[5].h))
  const g = d.ghostLoop
  els.push(arrowElement(g.from, g.to, { dashed: true, color: "roseStroke", via: g.via }))
  els.push(textElement("\u2715 deleted loop", g.via[0] - 46, g.via[1] + 4, 13, palette.roseStroke))
  d.afterNotes.forEach((note) => {
    els.push(textElement(note.text, note.x - (note.text.length * (note.bold ? 17 : 14) * 0.58) / 2, 664, note.bold ? 17 : 14, palette[note.color]))
  })
  els.push(textElement(d.footer, 48, d.h - 26, 14, palette.muted))
  return JSON.stringify({
    type: "excalidraw",
    version: 2,
    source: "https://excalidraw.com",
    elements: els,
    appState: { gridSize: null, viewBackgroundColor: palette.paper },
    files: {},
  }, null, 2) + "\n"
}

// ---------------------------------------------------------------- write out
const outputs = [
  { svg: svgContextLoop(contextLoop), ex: excalidrawContextLoop(contextLoop), slug: contextLoop.slug },
  { svg: svgBeforeAfter(beforeAfter), ex: excalidrawBeforeAfter(beforeAfter), slug: beforeAfter.slug },
]

for (const out of outputs) {
  fs.writeFileSync(path.join(imageDir, `${out.slug}.svg`), out.svg)
  fs.writeFileSync(path.join(downloadDir, `local-ci-token-savings-${out.slug}.excalidraw`), out.ex)
  JSON.parse(out.ex) // sanity: editable source must parse
  console.log("OK", out.slug)
}

console.log(`Generated ${outputs.length} SVG diagrams in public/images/blog/local-ci-token-savings/ and ${outputs.length} editable Excalidraw sources in public/downloads/.`)
