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

function esc(v){return String(v).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")}

let ec = 0
function el(type,x,y,w,h,seed,extra={}){
  ec+=1
  return {
    id:`x${ec.toString(36)}${seed}`, type, x, y, width:w, height:h, angle:0,
    strokeColor: extra.stroke || palette.ink,
    backgroundColor: extra.bg || "transparent",
    fillStyle:"solid", strokeWidth: extra.sw || 2,
    strokeStyle: extra.dashed ? "dashed" : "solid",
    roughness:1, opacity:100, groupIds:[], frameId:null,
    roundness: type==="rectangle" ? {type:3} : null,
    seed, version:1, versionNonce: seed*7, isDeleted:false,
    boundElements:[], updated:1798800000000, link:null, locked:false
  }
}
function txt(t,x,y,s,color=palette.ink){
  const w = Math.max(60, t.length*s*0.55)
  const e = el("text",x,y,w,s*1.25,1000+ec,{strokeColor:color})
  return {...e, text:t, fontSize:s, fontFamily:1, textAlign:"left", verticalAlign:"top", containerId:null, originalText:t, autoResize:true, lineHeight:1.25, baseline:s}
}

const rows = [
  { label: "1 · Context resend", detail: "each hop re-reads what earlier hops paid for", cost: "more input tokens", fix: "bounded packets, task-scoped context", fill: "blue" },
  { label: "2 · Oversight layer", detail: "planning and review re-read the same material again", cost: "oversight > work", fix: "delete layers that do not repay coordination", fill: "amber" },
  { label: "3 · Retry culture", detail: "small failures stack until a short task runs long", cost: "compounding wall time", fix: "stale-worker reaper and owner-checked release", fill: "rose" },
  { label: "4 · Tool-output bloat", detail: "machine output nobody reads is carried every turn", cost: "~60% of the heaviest transcript", fix: "truncate what you would never read", fill: "purple" },
  { label: "5 · Cumulative counters", detail: "lifetime totals look like per-task bills until subtracted", cost: "double-counted dashboards", fix: "sum per-window counts by provider and session", fill: "blue" },
  { label: "6 · Missing data as zero", detail: "unpriced models render as £0 instead of unknown", cost: "false confidence", fix: "label unknowns explicitly, never render as zero", fill: "green" },
]

function buildExcalidraw(){
  ec = 0
  const elements = []
  elements.push(txt("One orchestration request, six named cost points", 48, 36, 28))
  elements.push(txt("Each cost has a specific repair. The figure exists so the reader can see the mapping, not memorise six things.", 48, 76, 16, palette.muted))
  let y = 130
  for (const r of rows){
    const stroke = palette[r.fill+"Stroke"], fill = palette[r.fill]
    elements.push({...el("rectangle", 100, y, 300, 76, 20+ec, {stroke, bg: fill, sw: 3})})
    elements.push(txt(r.label, 116, y+16, 15))
    elements.push(txt(r.detail, 116, y+42, 12, palette.muted))
    elements.push({...el("rectangle", 470, y, 220, 76, 30+ec, {stroke: palette.muted, sw: 2})})
    elements.push(txt(r.cost, 486, y+26, 13, palette.muted))
    elements.push({...el("rectangle", 760, y, 330, 76, 40+ec, {stroke: palette.greenStroke, bg: "#ffffff", sw: 2})})
    elements.push(txt(r.fix, 776, y+26, 13, palette.greenStroke))
    elements.push({...el("arrow", 400, y+38, 60, 0, 50+ec, {stroke: palette.muted}), points: [[0,0],[60,0]], startBinding: null, endBinding: null, lastCommittedPoint: null, startArrowhead: null, endArrowhead: "arrow", elbowed: false})
    elements.push({...el("arrow", 700, y+38, 50, 0, 60+ec, {stroke: palette.muted, dashed: true}), points: [[0,0],[50,0]], startBinding: null, endBinding: null, lastCommittedPoint: null, startArrowhead: null, endArrowhead: "arrow", elbowed: false})
    y += 96
  }
  elements.push(txt("solid arrow = where the cost shows up · dashed arrow = the fix that removes it · Evidence date: 31 Aug 2026", 48, 700, 14, palette.muted))
  return JSON.stringify({type:"excalidraw",version:2,source:"https://excalidraw.com",elements,appState:{gridSize:null,viewBackgroundColor:palette.paper},files:{}},null,2)+"\n"
}

function buildSvg(){
  let body = ""
  let y = 130
  for (const r of rows){
    const stroke = palette[r.fill+"Stroke"], fill = palette[r.fill]
    body += `<rect x="100" y="${y}" width="300" height="76" rx="12" fill="${fill}" stroke="${stroke}" stroke-width="3"/>`
    body += `<text x="116" y="${y+26}" font-size="15" font-weight="700" fill="${palette.ink}" font-family="Comic Sans MS, cursive">${esc(r.label)}</text>`
    body += `<text x="116" y="${y+54}" font-size="12" fill="${palette.muted}" font-family="Comic Sans MS, cursive">${esc(r.detail)}</text>`
    body += `<line x1="404" y1="${y+38}" x2="466" y2="${y+38}" stroke="${palette.muted}" stroke-width="2" marker-end="url(#arrowEnd)"/>`
    body += `<rect x="470" y="${y}" width="220" height="76" rx="12" fill="#ffffff" stroke="${palette.muted}" stroke-width="2"/>`
    body += `<text x="486" y="${y+44}" font-size="13" fill="${palette.muted}" font-family="Comic Sans MS, cursive">${esc(r.cost)}</text>`
    body += `<line x1="696" y1="${y+38}" x2="756" y2="${y+38}" stroke="${palette.muted}" stroke-width="2" stroke-dasharray="7 6" marker-end="url(#arrowEnd)"/>`
    body += `<rect x="760" y="${y}" width="330" height="76" rx="12" fill="#ffffff" stroke="${palette.greenStroke}" stroke-width="2"/>`
    body += `<text x="776" y="${y+44}" font-size="13" font-weight="600" fill="${palette.greenStroke}" font-family="Comic Sans MS, cursive">${esc(r.fix)}</text>`
    y += 96
  }
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 760" role="img" aria-labelledby="t d">
<title id="t">One orchestration request, six named cost points</title><desc id="d">Each cost mechanism mapped to the specific fix that removes it, with solid arrows for cost surfaces and dashed arrows for repairs.</desc>
<defs><pattern id="dots" width="28" height="28" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.1" fill="#e7e2d5"/></pattern><marker id="arrowEnd" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto"><path d="M 0 0 L 9 5 L 0 10 z" fill="${palette.muted}"/></marker></defs>
<rect width="1280" height="760" fill="${palette.paper}"/><rect width="1280" height="760" fill="url(#dots)" opacity=".6"/>
<text x="48" y="52" font-size="28" font-weight="700" fill="${palette.ink}" font-family="Georgia, serif">One orchestration request, six named cost points</text>
<text x="48" y="84" font-size="16" fill="${palette.muted}" font-family="Georgia, serif">Each cost has a specific repair. The figure exists so the reader can see the mapping, not memorise six things.</text>
<text x="470" y="118" font-size="13" font-weight="700" fill="${palette.muted}" font-family="Georgia, serif">WHERE IT SHOWS UP</text>
<text x="760" y="118" font-size="13" font-weight="700" fill="${palette.greenStroke}" font-family="Georgia, serif">WHAT REMOVES IT</text>
${body}
<text x="640" y="740" text-anchor="middle" font-size="14" font-style="italic" fill="${palette.muted}" font-family="Georgia, serif">solid arrow = where the cost shows up · dashed arrow = the fix that removes it · Evidence date: 31 Aug 2026</text>
</svg>
`
}

fs.writeFileSync(path.join(imageDir, "agent-cost-anatomy.svg"), buildSvg())
fs.writeFileSync(path.join(dlDir, "agent-cost-anatomy.excalidraw"), buildExcalidraw())
console.log("OK agent-cost-anatomy")
