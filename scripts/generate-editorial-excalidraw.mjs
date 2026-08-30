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

// Hand-designed conceptual diagrams — varied, teaching-value-driven
const diagrams = [
  // Multi-agent journey — a real timeline with rise/fall, not boxes
  {
    slug: "multi-agent-journey-map",
    title: "Two years of multi-agent work on one map",
    subtitle: "What was built, what the telemetry said, and what was deliberately deleted.",
    date: "2026-08-29",
    type: "timeline",
    phases: [
      { label: "Native subagents", detail: "parallel workers, no shared memory — it worked but produced no evidence", verdict: "kept the instinct", fill: "blue", y: 200 },
      { label: "Measurable workers", detail: "per-worker traces, recoverable handoffs — overhead became visible", verdict: "kept: measurement", fill: "green", y: 280 },
      { label: "Codex + OpenCode split", detail: "planner and executor as two tools — traces showed oversight > work", verdict: "deleted", fill: "rose", y: 360 },
      { label: "Lifecycle experiments", detail: "Beads · BVR · NTM — bookkeeping cost more than it returned", verdict: "deleted", fill: "rose", y: 440 },
      { label: "Role-aware routing", detail: "cheap workhorse, frontier escalation, A2A as optional discovery", verdict: "current system", fill: "amber", y: 520 },
    ],
    footer: "Evidence date: 29 Aug 2026 · 551 sessions, public token data, one deleted middleman",
  },
  // Why agents get slow — a cost-multiplier waterfall
  {
    slug: "agent-cost-waterfall",
    title: "How one request becomes four bills",
    subtitle: "Each orchestration hop resends context. The work is the same; the bill multiplies.",
    date: "2026-08-29",
    type: "waterfall",
    steps: [
      { label: "Actual work", cost: "1×", detail: "the tokens the task itself needed", fill: "green", y: 500 },
      { label: "+ Planning layer", cost: "2×", detail: "the planner re-read the whole context", fill: "amber", y: 420 },
      { label: "+ Review layer", cost: "3×", detail: "the reviewer re-read output plus context", fill: "amber", y: 340 },
      { label: "+ Polling & retries", cost: "4×", detail: "waiting, failed hops, stale workers", fill: "rose", y: 260 },
    ],
    footer: "Orchestration layers observed in per-call traces · the 1×→4× staircase is conceptual, not a measured multiplier · Evidence date: 29 Aug 2026",
  },
  // Agent or code — real decision tree
  {
    slug: "agent-or-code-tree",
    title: "Agent, or normal code? Work the tree honestly",
    subtitle: "Four questions, in order. Most tasks resolve before the third.",
    date: "2026-08-29",
    type: "tree",
    nodes: [
      { id: "q1", x: 520, y: 110, w: 240, h: 90, label: "Is the input ambiguous?", lines: ["does it vary in ways rules", "cannot enumerate?"], fill: "blue" },
      { id: "q2", x: 120, y: 270, w: 240, h: 90, label: "No → does it repeat?", lines: ["same input, same output,", "every time?"], fill: "purple" },
      { id: "code1", x: 90, y: 450, w: 220, h: 88, label: "NORMAL CODE", lines: ["deterministic · fast", "cheap · auditable"], fill: "green" },
      { id: "q3", x: 470, y: 270, w: 240, h: 90, label: "Yes → failure cost?", lines: ["who notices, how fast,", "what breaks?"] },
      { id: "agent1", x: 400, y: 450, w: 210, h: 88, label: "AGENT OK", lines: ["cheap failure tolerates", "nondeterminism"], fill: "amber" },
      { id: "guard", x: 650, y: 450, w: 230, h: 88, label: "CODE + GUARDRAILS", lines: ["expensive failure needs", "deterministic paths"], fill: "green" },
      { id: "audit", x: 860, y: 270, w: 240, h: 90, label: "Who must audit it?", lines: ["traceable after the fact?"], fill: "blue" },
      { id: "logged", x: 920, y: 450, w: 230, h: 88, label: "LOGGED AGENT", lines: ["full provenance attached", "or plain code"], fill: "amber" },
    ],
    edges: [["q1","q2","no"],["q1","q3","yes"],["q2","code1","yes"],["q3","agent1","cheap"],["q3","guard","expensive"],["q1","audit","skip to audit"]],
    footer: "The honest answer is usually code, with an agent at the edges · Evidence date: 29 Aug 2026",
  },
  // Proof loop — circular, not linear
  {
    slug: "proof-loop-circle",
    title: "The proof loop — a claim is not a deliverable",
    subtitle: "Evidence with provenance, an editable artefact, and a gate where uncertainty is stated.",
    date: "2026-08-29",
    type: "loop",
    stages: [
      { label: "1 · Capture", detail: "real browser runs, real data paths", x: 520, y: 120, fill: "blue" },
      { label: "2 · Attach provenance", detail: "source · timestamp · runner", x: 860, y: 280, fill: "purple" },
      { label: "3 · Draft deliverable", detail: "editable, traces back to raw", x: 520, y: 460, fill: "green" },
      { label: "4 · Review gate", detail: "uncertainty stated, nothing silent", x: 180, y: 280, fill: "amber" },
    ],
    footer: "Reconciliation closes the loop when sources disagree · Evidence date: 29 Aug 2026",
  },
  // Seven agency workflows — grouped grid with reality annotations
  {
    slug: "seven-agency-workflows-map",
    title: "Seven workflows, grouped by what they replace",
    subtitle: "Running in live agency operations. Anonymised. The human keeps judgment.",
    date: "2026-08-29",
    type: "grid",
    groups: [
      { title: "DATA TRUST", items: [["1 · Taxonomy governance", "one contract, many markets"], ["2 · Tag & pixel QA", "consent-aware, browser-real"], ["3 · Attribution reconciliation", "platform story vs backend truth"]], fill: "blue" },
      { title: "CONSISTENCY AT SCALE", items: [["4 · Guidelines maintenance", "living standards, not PDFs"], ["5 · Rollout packs", "deploy once, audit everywhere"]], fill: "purple" },
      { title: "COMMERCIAL CLARITY", items: [["6 · Product & commercial scoping", "messy context → scoped PRD"], ["7 · Calls into operating assets", "a call ends with an artifact"]], fill: "green" },
    ],
    footer: "All seven: AI removes retrieval and checking labour; humans keep contracts, discrepancies, and client-facing sign-off · Evidence date: 29 Aug 2026",
  },
]

function esc(v){return v.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")}
let ec = 0
function el(type,x,y,w,h,seed,extra={}){ec+=1;return{id:`x${ec.toString(36)}${seed}`,type,x,y,width:w,height:h,angle:0,strokeColor:extra.stroke||palette.ink,backgroundColor:extra.bg||"transparent",fillStyle:"solid",strokeWidth:extra.sw||2,strokeStyle:extra.dashed?"dashed":"solid",roughness:1,opacity:100,groupIds:[],frameId:null,roundness:type==="rectangle"?{type:3}:null,seed,version:1,versionNonce:seed*7,isDeleted:false,boundElements:[],updated:1798800000000,link:null,locked:false}}
function txt(t,x,y,s,color=palette.ink){const w=Math.max(60,t.length*s*0.55);const e=el("text",x,y,w,s*1.25,1000+ec,{strokeColor:color});return{...e,text:t,fontSize:s,fontFamily:1,textAlign:"left",verticalAlign:"top",containerId:null,originalText:t,autoResize:true,lineHeight:1.25,baseline:s}}

function buildExcalidraw(d){
  ec=0; const elements=[]
  elements.push(txt(d.title,48,36,28))
  elements.push(txt(d.subtitle,48,76,16,palette.muted))

  if(d.type==="timeline"){
    elements.push(el("line",120,170,20,420,1,{stroke:palette.muted,sw:3}))
    d.phases.forEach((p,i)=>{
      const fill=palette[p.fill],stroke=palette[p.fill+"Stroke"]
      elements.push({...el("ellipse",96,p.y-16,48,32,10+i,{stroke,bg:fill,sw:3}),text:"",fontSize:1,fontFamily:1,textAlign:"left",verticalAlign:"top",containerId:null,originalText:"",autoResize:true,lineHeight:1.25,baseline:1})
      elements.push(txt(p.label,180,p.y-16,18))
      elements.push(txt(p.detail,180,p.y+8,14,palette.muted))
      elements.push(txt(p.verdict,760,p.y-8,14,stroke))
    })
  }
  if(d.type==="waterfall"){
    d.steps.forEach((s,i)=>{
      const fill=palette[s.fill],stroke=palette[s.fill+"Stroke"]
      const w=250, x=100+i*280
      elements.push({...el("rectangle",x,s.y,w,490-s.y,20+i,{stroke,bg:fill,sw:3})})
      elements.push(txt(s.label,x+16,s.y+18,17))
      elements.push(txt(s.cost,x+w/2-24,s.y+52,30,stroke))
      elements.push(txt(s.detail,x+16,s.y+96,13,palette.muted))
    })
  }
  if(d.type==="tree"){
    d.nodes.forEach(n=>{
      const fill=palette[n.fill]||"transparent",stroke=palette[(n.fill||"blue")+"Stroke"]
      elements.push({...el("rectangle",n.x,n.y,n.w,n.h,30+ec,{stroke,bg:fill,sw:3})})
      elements.push(txt(n.label,n.x+16,n.y+14,16))
      n.lines.forEach((l,i)=>elements.push(txt(l,n.x+16,n.y+42+i*20,13,palette.muted)))
    })
    d.edges.forEach(([a,b,lab],i)=>{
      const na=d.nodes.find(n=>n.id===a),nb=d.nodes.find(n=>n.id===b)
      const x1=na.x+na.w/2,y1=na.y+na.h,x2=nb.x+nb.w/2,y2=nb.y
      elements.push({...el("arrow",Math.min(x1,x2),y1,Math.abs(x2-x1),Math.abs(y2-y1),40+i,{dashed:false}),points:[[0,0],[x2-x1,y2-y1]],startBinding:null,endBinding:null,lastCommittedPoint:null,startArrowhead:null,endArrowhead:"arrow",elbowed:false})
      elements.push(txt(lab,(x1+x2)/2-14,(y1+y2)/2-18,12,palette.muted))
    })
  }
  if(d.type==="loop"){
    // circle path
    elements.push({...el("ellipse",300,180,700,340,50,{stroke:palette.muted,sw:2,dashed:true})})
    d.stages.forEach(s=>{
      const fill=palette[s.fill],stroke=palette[s.fill+"Stroke"]
      elements.push({...el("rectangle",s.x,s.y,260,120,60+ec,{stroke,bg:fill,sw:3})})
      elements.push(txt(s.label,s.x+18,s.y+18,18))
      elements.push(txt(s.detail,s.x+18,s.y+52,14,palette.muted))
    })
  }
  if(d.type==="grid"){
    let gx=60
    d.groups.forEach(g=>{
      const fill=palette[g.fill],stroke=palette[g.fill+"Stroke"]
      const gw=380, gh=80+g.items.length*90
      elements.push({...el("rectangle",gx,140,gw,gh,70+ec,{stroke,bg:fill,sw:2})})
      elements.push(txt(g.title,gx+20,160,17,stroke))
      g.items.forEach((it,i)=>{
        elements.push({...el("rectangle",gx+20,190+i*92,gw-40,80,80+ec,{stroke,bg:"#ffffff",sw:2})})
        elements.push(txt(it[0],gx+36,200+i*92,15))
        elements.push(txt(it[1],gx+36,224+i*92,13,palette.muted))
      })
      gx+=gw+40
    })
  }
  elements.push(txt(d.footer,48,668,14,palette.muted))
  return JSON.stringify({type:"excalidraw",version:2,source:"https://excalidraw.com",elements,appState:{gridSize:null,viewBackgroundColor:palette.paper},files:{},},null,2)+"\n"
}

// SVG render
function esc2(v){return esc(v)}
function buildSvg(d){
  const body = (()=>{
    if(d.type==="timeline") return d.phases.map((p,i)=>`<line x1="120" y1="170" x2="140" y2="590" stroke="${palette.muted}" stroke-width="3"/>` ).slice(0,1).join("") + d.phases.map(p=>`<circle cx="120" cy="${p.y}" r="18" fill="${palette[p.fill]}" stroke="${palette[p.fill+"Stroke"]}" stroke-width="3"/><text x="180" y="${p.y-8}" font-size="18" font-weight="700" fill="${palette.ink}" font-family="Comic Sans MS, cursive">${esc(p.label)}</text><text x="180" y="${p.y+16}" font-size="14" fill="${palette.muted}" font-family="Comic Sans MS, cursive">${esc(p.detail)}</text><text x="760" y="${p.y}" font-size="14" font-weight="700" fill="${palette[p.fill+"Stroke"]}" font-family="Comic Sans MS, cursive">${esc(p.verdict)}</text>`).join("") + `<line x1="120" y1="170" x2="120" y2="560" stroke="${palette.muted}" stroke-width="3"/>`
    if(d.type==="waterfall") return d.steps.map((s,i)=>{const x=100+i*280,w=250;return `<rect x="${x}" y="${s.y}" width="${w}" height="${490-s.y}" rx="10" fill="${palette[s.fill]}" stroke="${palette[s.fill+"Stroke"]}" stroke-width="3"/><text x="${x+16}" y="${s.y+28}" font-size="16" font-weight="700" fill="${palette.ink}" font-family="Comic Sans MS, cursive">${esc(s.label)}</text><text x="${x+w/2-24}" y="${s.y+62}" font-size="26" font-weight="700" fill="${palette[s.fill+"Stroke"]}" font-family="Comic Sans MS, cursive">${esc(s.cost)}</text><text x="${x+16}" y="${s.y+104}" font-size="13" fill="${palette.muted}" font-family="Comic Sans MS, cursive">${esc(s.detail)}</text>`}).join("")
    if(d.type==="tree") return d.edges.map(([a,b,lab])=>{const na=d.nodes.find(n=>n.id===a),nb=d.nodes.find(n=>n.id===b);const x1=na.x+na.w/2,y1=na.y+na.h,x2=nb.x+nb.w/2,y2=nb.y;return `<path d="M ${x1} ${y1} C ${x1} ${(y1+y2)/2}, ${x2} ${(y1+y2)/2}, ${x2} ${y2}" fill="none" stroke="${palette.muted}" stroke-width="2.5" marker-end="url(#arrowEnd)"/><text x="${(x1+x2)/2-30}" y="${(y1+y2)/2-8}" font-size="13" fill="${palette.muted}" font-family="Comic Sans MS, cursive">${esc(lab)}</text>`}).join("") + d.nodes.map(n=>{const h=Math.max(n.h, 44+n.lines.length*22);return `<rect x="${n.x}" y="${n.y}" width="${n.w}" height="${h}" rx="14" fill="${palette[n.fill]||"#fff"}" stroke="${palette[(n.fill||"blue")+"Stroke"]}" stroke-width="3"/><text x="${n.x+16}" y="${n.y+28}" font-size="16" font-weight="700" fill="${palette.ink}" font-family="Comic Sans MS, cursive">${esc(n.label)}</text>${n.lines.map((l,i)=>`<text x="${n.x+16}" y="${n.y+52+i*22}" font-size="13" fill="${palette.muted}" font-family="Comic Sans MS, cursive">${esc(l)}</text>`).join("")}`}).join("")
    if(d.type==="loop") return `<ellipse cx="650" cy="350" rx="350" ry="170" fill="none" stroke="${palette.muted}" stroke-width="2" stroke-dasharray="10 9"/>` + d.stages.map(s=>`<rect x="${s.x}" y="${s.y}" width="260" height="120" rx="14" fill="${palette[s.fill]}" stroke="${palette[s.fill+"Stroke"]}" stroke-width="3"/><text x="${s.x+18}" y="${s.y+32}" font-size="18" font-weight="700" fill="${palette.ink}" font-family="Comic Sans MS, cursive">${esc(s.label)}</text><text x="${s.x+18}" y="${s.y+64}" font-size="14" fill="${palette.muted}" font-family="Comic Sans MS, cursive">${esc(s.detail)}</text>`).join("")
    if(d.type==="grid") return d.groups.map((g,gi)=>{const gx=60+gi*420,gh=80+g.items.length*90;return `<rect x="${gx}" y="140" width="380" height="${gh}" rx="16" fill="${palette[g.fill]}" stroke="${palette[g.fill+"Stroke"]}" stroke-width="2" opacity=".5"/><text x="${gx+20}" y="170" font-size="17" font-weight="700" fill="${palette[g.fill+"Stroke"]}" font-family="Comic Sans MS, cursive">${esc(g.title)}</text>`+g.items.map((it,i)=>`<rect x="${gx+20}" y="${190+i*92}" width="340" height="80" rx="12" fill="#ffffff" stroke="${palette[g.fill+"Stroke"]}" stroke-width="2"/><text x="${gx+36}" y="${212+i*92}" font-size="15" font-weight="700" fill="${palette.ink}" font-family="Comic Sans MS, cursive">${esc(it[0])}</text><text x="${gx+36}" y="${238+i*92}" font-size="13" fill="${palette.muted}" font-family="Comic Sans MS, cursive">${esc(it[1])}</text>`).join("")}).join("")
    return ""
  })()
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" role="img" aria-labelledby="t d">
<title id="t">${esc(d.title)}</title><desc id="d">${esc(d.subtitle)}</desc>
<defs><pattern id="dots" width="28" height="28" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.1" fill="#e7e2d5"/></pattern><marker id="arrowEnd" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto"><path d="M 0 0 L 9 5 L 0 10 z" fill="${palette.muted}"/></marker></defs>
<rect width="1280" height="720" fill="${palette.paper}"/><rect width="1280" height="720" fill="url(#dots)" opacity=".6"/>
<text x="48" y="52" font-size="28" font-weight="700" fill="${palette.ink}" font-family="Georgia, serif">${esc(d.title)}</text>
<text x="48" y="84" font-size="16" fill="${palette.muted}" font-family="Georgia, serif">${esc(d.subtitle)}</text>
${body}
<text x="640" y="700" text-anchor="middle" font-size="14" font-style="italic" fill="${palette.muted}" font-family="Georgia, serif">${esc(d.footer)}</text>
</svg>`
}

for(const d of diagrams){
  fs.writeFileSync(path.join(imageDir, `${d.slug}.svg`), buildSvg(d))
  fs.writeFileSync(path.join(dlDir, `${d.slug}.excalidraw`), buildExcalidraw(d))
  console.log("OK", d.slug, d.type)
}
