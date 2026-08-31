import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const imageDir = path.join(root, "public/images/editorial")
const dlDir = path.join(root, "public/downloads")
fs.mkdirSync(imageDir, { recursive: true })
fs.mkdirSync(dlDir, { recursive: true })

// ---------------------------------------------------------------------------
// Figure 1 — boundary map (native draw.io model + faithful SVG render)
// Teaching objective: what can actually reach what, with real service names —
// prose lists the parts but cannot show the connectivity and its direction.
// ---------------------------------------------------------------------------

const W = 1280
const H = 850
const INK = "#334155"
const LABEL = "#475569"

const bands = [
  { id: "loop", title: "THE MAC · 127.0.0.1 — nothing here is reachable from outside", x: 40, y: 120, w: 640, h: 400, fill: "#dbeafe", stroke: "#2563eb" },
  { id: "cont", title: "CONTAINERS · OrbStack — isolated, state in volumes", x: 40, y: 570, w: 640, h: 200, fill: "#ede9fe", stroke: "#7c3aed" },
  { id: "mesh", title: "TAILSCALE MESH · private · credential-gated", x: 720, y: 120, w: 250, h: 650, fill: "#dcfce7", stroke: "#16a34a" },
  { id: "pub", title: "PUBLIC · the only\ninternet-facing surface", x: 1010, y: 120, w: 240, h: 650, fill: "#fef3c7", stroke: "#d97706" },
]

const nodes = [
  { id: "keeper", x: 60, y: 160, w: 250, h: 110, title: "launchd keepers", lines: ["start at boot · restart what dies", "the layer every other service trusts"], stroke: "#2563eb" },
  { id: "agents", x: 380, y: 160, w: 270, h: 140, title: "Agent sessions", lines: ["Codex · OpenClaw · Hermes · OMP", "A2A endpoints 127.0.0.1:8391–8394", "bounded tools · worktree writes"], stroke: "#2563eb" },
  { id: "listeners", x: 60, y: 320, w: 250, h: 160, title: "Local listeners", lines: ["ops board · session index ·", "local APIs — every one bound", "to 127.0.0.1 only"], stroke: "#2563eb" },
  { id: "coolify", x: 70, y: 620, w: 580, h: 120, title: "Coolify stack", lines: ["VictoriaMetrics · Grafana · small apps", "ports published to loopback only · volumes persist state"], stroke: "#7c3aed" },
  { id: "devices", x: 740, y: 160, w: 210, h: 110, title: "Your devices", lines: ["phone · laptop", "tailnet members"], stroke: "#16a34a" },
  { id: "ssh", x: 740, y: 310, w: 200, h: 90, title: "SSH", lines: ["terminal into the Mac,", "key-based"], stroke: "#16a34a" },
  { id: "boards", x: 740, y: 440, w: 200, h: 120, title: "Ops boards", lines: ["Grafana · agent mail", "reachable over the tailnet,", "nowhere else"], stroke: "#16a34a" },
  { id: "vercel", x: 1030, y: 160, w: 200, h: 110, title: "Vercel", lines: ["rajeevg.com · static + serverless", "nothing here can open a connection", "to the Mac"], stroke: "#d97706" },
  { id: "telegram", x: 1030, y: 310, w: 200, h: 130, title: "Telegram", lines: ["operator chat surface,", "reached by outbound connection", "only"], stroke: "#d97706" },
]

// Orthogonal routes: [ [x,y] ... ] — first point is the start, last the arrowhead.
const edges = [
  { id: "e_boot", pts: [[310, 215], [380, 215]], label: "boot +\nrestart", lx: 345, ly: 196, anchor: "middle" },
  { id: "e_call", pts: [[430, 300], [430, 390], [310, 390]], label: "call local APIs", lx: 442, ly: 352, anchor: "start" },
  { id: "e_dash", pts: [[560, 300], [560, 620]], label: "query dashboards", lx: 572, ly: 474, anchor: "start" },
  { id: "e_pub", pts: [[200, 620], [200, 480]], label: "publish to 127.0.0.1", lx: 212, ly: 558, anchor: "start" },
  { id: "e_ssh", pts: [[790, 270], [790, 310]], label: "credentials", lx: 798, ly: 298, anchor: "start" },
  { id: "e_boards", pts: [[895, 270], [895, 405], [840, 405], [840, 440]], label: "credentials", lx: 907, ly: 414, anchor: "start" },
  { id: "e_tg", pts: [[650, 280], [700, 280], [700, 690], [1130, 690], [1130, 440]], label: "outbound long-poll — Telegram never dials in", lx: 905, ly: 678, anchor: "middle" },
]

const esc = (v) => v.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")

function buildBoundarySvg() {
  const bandSvg = bands.map((b) => `<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" rx="12" fill="${b.fill}" fill-opacity="0.55" stroke="${b.stroke}" stroke-width="2"/>
  <text x="${b.x + 16}" y="${b.y + 24}" font-family="Helvetica, Arial, sans-serif" font-size="13" font-weight="700" fill="${b.stroke}">${esc(b.title).replace("\n", " ")}</text>`).join("\n")

  const nodeSvg = nodes.map((n) => `<rect x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" rx="10" fill="#ffffff" stroke="${n.stroke}" stroke-width="2"/>
  <text x="${n.x + n.w / 2}" y="${n.y + 28}" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="16" font-weight="700" fill="#0f172a">${esc(n.title)}</text>
${n.lines.map((l, i) => `  <text x="${n.x + n.w / 2}" y="${n.y + 54 + i * 20}" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="12.5" fill="#334155">${esc(l)}</text>`).join("\n")}`).join("\n")

  const edgeSvg = edges.map((e) => {
    const d = e.pts.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x} ${y}`).join(" ")
    const lines = e.label.split("\n")
    return `<path d="${d}" fill="none" stroke="${INK}" stroke-width="2" marker-end="url(#arrowEnd)"/>
${lines.map((l, i) => `  <text x="${e.lx}" y="${e.ly + i * 15}" text-anchor="${e.anchor}" font-family="Helvetica, Arial, sans-serif" font-size="11.5" fill="${LABEL}" paint-order="stroke" stroke="#ffffff" stroke-width="4">${esc(l)}</text>`).join("\n")}`
  }).join("\n")

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-labelledby="t d">
<title id="t">What can reach what — the Mac operations-centre boundary</title>
<desc id="d">Four reachability zones. The Mac's own services, agents and OrbStack containers live on loopback; the Tailscale mesh is the only credentialed way in; Vercel and Telegram face the internet, and Telegram is reached by outbound connection only.</desc>
<defs><marker id="arrowEnd" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto"><path d="M 0 0 L 9 5 L 0 10 z" fill="${INK}"/></marker></defs>
<rect width="${W}" height="${H}" fill="#ffffff"/>
<rect x="40" y="30" width="1200" height="56" rx="8" fill="#0f172a"/>
<text x="60" y="65" font-family="Helvetica, Arial, sans-serif" font-size="20" font-weight="700" fill="#ffffff">What can reach what — the Mac operations-centre boundary</text>
<text x="42" y="106" font-family="Helvetica, Arial, sans-serif" font-size="12.5" fill="#64748b">Every listener is reachable only along the paths drawn. If a path is not drawn, it does not exist.</text>
${bandSvg}
${edgeSvg}
${nodeSvg}
<text x="${W / 2}" y="825" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="14" font-style="italic" fill="#64748b">Bands show reachability zones · solid arrows are real network paths · absence of an arrow means no path exists · Evidence date: 31 Aug 2026</text>
</svg>
`
}

function buildBoundaryDrawio() {
  const cells = []
  cells.push(`<mxCell id="header" value="&lt;b&gt;What can reach what — the Mac operations-centre boundary&lt;/b&gt;" style="rounded=1;whiteSpace=wrap;html=1;align=left;spacingLeft=20;fillColor=#0f172a;strokeColor=#0f172a;fontColor=#ffffff;fontSize=19;" vertex="1" parent="1"><mxGeometry x="40" y="30" width="1200" height="56" as="geometry"/></mxCell>`)
  for (const b of bands) {
    cells.push(`<mxCell id="band_${b.id}" value="&lt;b&gt;${esc(b.title)}&lt;/b&gt;" style="rounded=1;whiteSpace=wrap;html=1;align=left;verticalAlign=top;spacingTop=10;spacingLeft=16;fillColor=${b.fill};strokeColor=${b.stroke};strokeWidth=2;fontSize=13;opacity=60;" vertex="1" parent="1"><mxGeometry x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" as="geometry"/></mxCell>`)
  }
  for (const e of edges) {
    const points = e.pts.slice(1, -1).map(([x, y]) => `<mxPoint x="${x}" y="${y}"/>`).join("")
    cells.push(`<mxCell id="${e.id}" value="" style="edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;strokeColor=${INK};strokeWidth=2;endArrow=classic;endFill=1;exitX=0.5;exitY=0.5;entryX=0.5;entryY=0.5;" edge="1" parent="1" source="n_${e.id.slice(2)}_a" target="n_${e.id.slice(2)}_b"><mxGeometry relative="1" as="geometry"><Array as="points">${points}</Array></mxGeometry></mxCell>`)
  }
  for (const n of nodes) {
    const lines = n.lines.map((l) => esc(l)).join("&lt;br&gt;")
    cells.push(`<mxCell id="n_${n.id}" value="&lt;b&gt;${esc(n.title)}&lt;/b&gt;&lt;br&gt;${lines}" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=${n.stroke};strokeWidth=2;fontSize=13;labelBackgroundColor=#ffffff;align=center;" vertex="1" parent="1"><mxGeometry x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" as="geometry"/></mxCell>`)
  }
  for (const e of edges) {
    const lines = e.label.split("\n").map((l) => esc(l)).join("&lt;br&gt;")
    cells.push(`<mxCell id="lbl_${e.id}" value="${lines}" style="text;html=1;align=${e.anchor};fontSize=11;fontColor=${LABEL};labelBackgroundColor=#ffffff;" vertex="1" parent="1"><mxGeometry x="${e.lx - 80}" y="${e.ly - 14}" width="160" height="30" as="geometry"/></mxCell>`)
  }
  return `<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="app.diagrams.net" modified="2026-08-31T00:00:00.000Z" agent="Codex" version="24.7.17"><diagram id="mac-ops-boundary-map" name="mac-ops-boundary-map"><mxGraphModel dx="1480" dy="860" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="${W}" pageHeight="${H}" math="0" shadow="0"><root>
<mxCell id="0"/><mxCell id="1" parent="0"/>
${cells.join("\n")}
<mxCell id="legend" value="Bands show reachability zones · solid arrows are real network paths · absence of an arrow means no path exists · Evidence date: 31 Aug 2026" style="rounded=1;whiteSpace=wrap;html=1;align=center;fillColor=#f8fafc;strokeColor=#cbd5e1;fontSize=13;fontStyle=2;labelBackgroundColor=#f8fafc;" vertex="1" parent="1"><mxGeometry x="40" y="800" width="1200" height="44" as="geometry"/></mxCell>
</root></mxGraphModel></diagram></mxfile>
`
}

// ---------------------------------------------------------------------------
// Figure 2 — alarm journey (bespoke Excalidraw concept + wobble SVG render)
// Teaching objective: the journey only works because every stage has a named
// stall point and a named bound — prose narrates the happy path, the figure
// shows where it breaks and what holds it together.
// ---------------------------------------------------------------------------

const palette = {
  ink: "#172033", muted: "#566174", paper: "#fbfaf5",
  blue: "#dce8ff", blueStroke: "#4f6fad",
  green: "#dcf3e5", greenStroke: "#3f8460",
  amber: "#fff0c9", amberStroke: "#a97921",
  rose: "#ffe1de", roseStroke: "#a45350",
  purple: "#e9e1ff", purpleStroke: "#7459a8",
}

const journey = {
  slug: "mac-ops-alarm-journey",
  title: "The alarm journey — and where it actually stalls",
  subtitle: "Six steps every incident walks. Each one has a named stall point and a named bound.",
  stages: [
    { title: "1 · Alarm fires", stall: "alert fatigue — everything looks urgent", bound: "one human channel · severity = blast radius", fill: "blue" },
    { title: "2 · Phone receives", stall: "the Mac is asleep, or the bot token rotated", bound: "launchd restarts the keeper · outbound long-poll needs no open port", fill: "green" },
    { title: "3 · Board read", stall: "tailnet down, or a dashboard left public", bound: "the tailnet reconnects · loopback keeps the mistake private", fill: "purple" },
    { title: "4 · Runbook matched", stall: "no runbook exists for this failure yet", bound: "write it during the incident — once", fill: "amber" },
    { title: "5 · Fix delegated", stall: "the agent lost scope or drowned in context", bound: "worktree + contract bound the blast radius", fill: "blue" },
    { title: "6 · Recovery confirmed", stall: "counters look green but the cause is unfixed", bound: "check the telemetry, not the vibe", fill: "green" },
  ],
  footer: "Every stage can stall; each stall has a named bound · conceptual model of how alarms fail, not a measured failure rate · Evidence date: 31 Aug 2026",
}

function wrap(text, max) {
  const words = text.split(" ")
  const lines = []
  let line = ""
  for (const w of words) {
    if ((line + " " + w).trim().length > max) { lines.push(line.trim()); line = w } else { line = (line + " " + w).trim() }
  }
  if (line) lines.push(line)
  return lines
}

function buildJourneySvg() {
  const canvasW = 1280
  const canvasH = 720
  const body = journey.stages.map((s, i) => {
    const x = 40 + i * 205, y = 210, w = 185
    const fill = palette[s.fill], stroke = palette[s.fill + "Stroke"]
    const stallLines = wrap(s.stall, 24)
    const boundLines = wrap(s.bound, 24)
    return `<g transform="rotate(${i % 2 === 0 ? -0.3 : 0.3} ${x + w / 2} ${y + 140})">
<rect x="${x}" y="${y}" width="${w}" height="280" rx="18" fill="${fill}" stroke="${stroke}" stroke-width="3" filter="url(#wobble)"/>
<text x="${x + w / 2}" y="${y + 36}" text-anchor="middle" font-size="17" font-weight="700" fill="${palette.ink}" font-family="'Comic Sans MS','Bradley Hand',cursive">${esc(s.title)}</text>
<text x="${x + 14}" y="${y + 68}" font-size="11" font-weight="700" fill="${palette.roseStroke}" font-family="'Comic Sans MS','Bradley Hand',cursive">STALLS WHEN</text>
${stallLines.map((l, j) => `<text x="${x + 14}" y="${y + 88 + j * 19}" font-size="13" fill="${palette.roseStroke}" font-family="'Comic Sans MS','Bradley Hand',cursive">${esc(l)}</text>`).join("\n")}
<text x="${x + 14}" y="${y + 160}" font-size="11" font-weight="700" fill="${palette.greenStroke}" font-family="'Comic Sans MS','Bradley Hand',cursive">BOUND BY</text>
${boundLines.map((l, j) => `<text x="${x + 14}" y="${y + 180 + j * 19}" font-size="13" fill="${palette.greenStroke}" font-family="'Comic Sans MS','Bradley Hand',cursive">${esc(l)}</text>`).join("\n")}
</g>`
  }).join("\n")
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${canvasW} ${canvasH}" role="img" aria-labelledby="jt jd">
<title id="jt">${esc(journey.title)}</title><desc id="jd">${esc(journey.subtitle)}</desc>
<defs>
<pattern id="dots" width="28" height="28" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.1" fill="#e7e2d5"/></pattern>
<filter id="wobble" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="2" seed="11" result="noise"/><feDisplacementMap in="SourceGraphic" in2="noise" scale="0.85"/></filter>
<marker id="jArrow" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto"><path d="M 0 0 L 9 5 L 0 10 z" fill="${palette.ink}"/></marker>
</defs>
<rect width="${canvasW}" height="${canvasH}" fill="${palette.paper}"/>
<rect width="${canvasW}" height="${canvasH}" fill="url(#dots)" opacity=".68"/>
<text x="48" y="60" font-size="28" font-weight="700" fill="${palette.ink}" font-family="Georgia, serif">${esc(journey.title)}</text>
<text x="48" y="92" font-size="16" fill="${palette.muted}" font-family="Georgia, serif">${esc(journey.subtitle)}</text>
<path d="M 60 165 C 380 160, 700 172, 1220 164" fill="none" stroke="${palette.ink}" stroke-width="2.5" marker-end="url(#jArrow)" filter="url(#wobble)"/>
${body}
<text x="${canvasW / 2}" y="660" text-anchor="middle" font-size="14" font-style="italic" fill="${palette.muted}" font-family="Georgia, serif">${esc(journey.footer)}</text>
</svg>
`
}

let ec = 0
function el(type, x, y, w, h, seed, extra = {}) {
  ec += 1
  return {
    id: `mj${ec.toString(36)}${seed}`, type, x, y, width: w, height: h, angle: 0,
    strokeColor: extra.stroke || palette.ink, backgroundColor: extra.bg || "transparent",
    fillStyle: "solid", strokeWidth: extra.sw || 2, strokeStyle: extra.dashed ? "dashed" : "solid",
    roughness: 1, opacity: 100, groupIds: [], frameId: null,
    roundness: type === "rectangle" ? { type: 3 } : null, seed, version: 1, versionNonce: seed * 7,
    isDeleted: false, boundElements: [], updated: 1798800000000, link: null, locked: false,
  }
}
function txt(t, x, y, s, color = palette.ink, align = "left", width) {
  const e = el("text", x, y, width ?? Math.max(60, t.length * s * 0.55), s * 1.25, 1000 + ec, { strokeColor: color })
  return { ...e, text: t, fontSize: s, fontFamily: 1, textAlign: align, verticalAlign: "top", containerId: null, originalText: t, autoResize: true, lineHeight: 1.25, baseline: s }
}

function buildJourneyExcalidraw() {
  ec = 0
  const elements = []
  elements.push(txt(journey.title, 48, 38, 28))
  elements.push(txt(journey.subtitle, 48, 78, 16, palette.muted))
  elements.push({ ...el("arrow", 60, 158, 1160, 8, 90), points: [[0, 0], [1160, -2]], startBinding: null, endBinding: null, lastCommittedPoint: null, startArrowhead: null, endArrowhead: "arrow", elbowed: false })
  journey.stages.forEach((s, i) => {
    const x = 40 + i * 205, y = 210, w = 185
    const fill = palette[s.fill], stroke = palette[s.fill + "Stroke"]
    elements.push({ ...el("rectangle", x, y, w, 280, 30 + ec, { stroke, bg: fill, sw: 3 }) })
    elements.push(txt(s.title, x + 12, y + 24, 16, palette.ink, "center", w - 24))
    elements.push(txt("STALLS WHEN", x + 14, y + 58, 11, palette.roseStroke))
    wrap(s.stall, 24).forEach((l, j) => elements.push(txt(l, x + 14, y + 76 + j * 19, 13, palette.roseStroke)))
    elements.push(txt("BOUND BY", x + 14, y + 150, 11, palette.greenStroke))
    wrap(s.bound, 24).forEach((l, j) => elements.push(txt(l, x + 14, y + 168 + j * 19, 13, palette.greenStroke)))
  })
  elements.push(txt(journey.footer, 48, 648, 14, palette.muted))
  return JSON.stringify({ type: "excalidraw", version: 2, source: "https://excalidraw.com", elements, appState: { gridSize: null, viewBackgroundColor: palette.paper }, files: {} }, null, 2) + "\n"
}

fs.writeFileSync(path.join(imageDir, "mac-ops-boundary-map.svg"), buildBoundarySvg())
fs.writeFileSync(path.join(dlDir, "mac-ops-boundary-map.drawio"), buildBoundaryDrawio())
fs.writeFileSync(path.join(imageDir, "mac-ops-alarm-journey.svg"), buildJourneySvg())
fs.writeFileSync(path.join(dlDir, "mac-ops-alarm-journey.excalidraw"), buildJourneyExcalidraw())
console.log("OK mac-ops figures")
