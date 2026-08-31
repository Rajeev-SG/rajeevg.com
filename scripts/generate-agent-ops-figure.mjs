import fs from "node:fs"
import path from "node:path"
const root = process.cwd()
const imageDir = path.join(root, "public/images/blog/agent-ops")
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

const d = {
  slug: "agent-ops-escalation-decision",
  canvasW: 1280,
  title: "When does an agent failure get your attention?",
  subtitle: "Read down the cost column. The expensive cases are rarer than they feel.",
  date: "2026-08-31",
  type: "tree",
  nodes: [
    { id: "q1", x: 480, y: 110, w: 320, h: 80, label: "1 · Did it produce a wrong answer?", lines: ["not just a delay or a restart"] },
    { id: "q2", x: 120, y: 250, w: 280, h: 80, label: "2 · Is the blast radius contained?", lines: ["one worktree, not production data"] },
    { id: "q3", x: 850, y: 250, w: 280, h: 80, label: "3 · Did telemetry catch it first?", lines: ["before a human or a client did"] },
    { id: "d1", x: 80, y: 430, w: 250, h: 110, label: "NOISE", lines: ["note it, keep the trace,", "keep moving"] },
    { id: "d2", x: 380, y: 430, w: 260, h: 110, label: "WORKER INCIDENT", lines: ["use the runbook, fix in the", "same worktree"] },
    { id: "d3", x: 700, y: 430, w: 260, h: 110, label: "ROUTING INCIDENT", lines: ["model, contract or permission", "chose the wrong path"] },
    { id: "d4", x: 1020, y: 430, w: 220, h: 110, label: "PAGE", lines: ["stop work, use the runbook,", "fix the cause today"] },
  ],
  edges: [
    ["q1","q2","no"],
    ["q1","q3","yes"],
    ["q2","d1","yes"],
    ["q2","d2","no"],
    ["q3","d3","yes"],
    ["q3","d4","no"],
  ],
  footer: "Blast radius, not severity, decides who gets woken up · conceptual model, not a measurement · Evidence date: 31 Aug 2026",
}

function esc(v){return v.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")}
let ec = 0
function el(type,x,y,w,h,seed,extra={}){ec+=1;return{id:`x${ec.toString(36)}${seed}`,type,x,y,width:w,height:h,angle:0,strokeColor:extra.stroke||palette.ink,backgroundColor:extra.bg||"transparent",fillStyle:"solid",strokeWidth:extra.sw||2,strokeStyle:extra.dashed?"dashed":"solid",roughness:1,opacity:100,groupIds:[],frameId:null,roundness:type==="rectangle"?{type:3}:null,seed,version:1,versionNonce:seed*7,isDeleted:false,boundElements:[],updated:1798800000000,link:null,locked:false}}
function txt(t,x,y,s,color=palette.ink){const w=Math.max(60,t.length*s*0.55);const e=el("text",x,y,w,s*1.25,1000+ec,{strokeColor:color});return{...e,text:t,fontSize:s,fontFamily:1,textAlign:"left",verticalAlign:"top",containerId:null,originalText:t,autoResize:true,lineHeight:1.25,baseline:s}}

function buildExcalidraw(){
  ec=0; const elements=[]
  elements.push(txt(d.title,48,36,28))
  elements.push(txt(d.subtitle,48,76,16,palette.muted))
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
  elements.push(txt(d.footer,48,668,14,palette.muted))
  return JSON.stringify({type:"excalidraw",version:2,source:"https://excalidraw.com",elements,appState:{gridSize:null,viewBackgroundColor:palette.paper},files:{},},null,2)+"\n"
}

function buildSvg(){
  const nodes = d.nodes.map(n=>{
    const fill = n.fill ? palette[n.fill] : "#fff"
    const stroke = palette[(n.fill||"blue")+"Stroke"]
    const h = Math.max(n.h, 44 + n.lines.length*22)
    return `<rect x="${n.x}" y="${n.y}" width="${n.w}" height="${h}" rx="14" fill="${fill}" stroke="${stroke}" stroke-width="3"/><text x="${n.x+16}" y="${n.y+28}" font-size="16" font-weight="700" fill="${palette.ink}" font-family="Comic Sans MS, cursive">${esc(n.label)}</text>${n.lines.map((l,i)=>`<text x="${n.x+16}" y="${n.y+52+i*22}" font-size="13" fill="${palette.muted}" font-family="Comic Sans MS, cursive">${esc(l)}</text>`).join("")}`
  }).join("")
  const edges = d.edges.map(([a,b,lab])=>{
    const na=d.nodes.find(n=>n.id===a),nb=d.nodes.find(n=>n.id===b)
    const x1=na.x+na.w/2,y1=na.y+na.h,x2=nb.x+nb.w/2,y2=nb.y
    return `<path d="M ${x1} ${y1} C ${x1} ${(y1+y2)/2}, ${x2} ${(y1+y2)/2}, ${x2} ${y2}" fill="none" stroke="${palette.muted}" stroke-width="2.5" marker-end="url(#arrowEnd)"/><text x="${x2+(x2<x1?-90:12)}" y="${(y1+y2)/2+4}" font-size="13" fill="${palette.muted}" font-family="Comic Sans MS, cursive">${esc(lab)}</text>`
  }).join("")
  const canvasW = d.canvasW
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${canvasW} 720" role="img" aria-labelledby="t d">
<title id="t">${esc(d.title)}</title><desc id="d">${esc(d.subtitle)}</desc>
<defs><pattern id="dots" width="28" height="28" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.1" fill="#e7e2d5"/></pattern><marker id="arrowEnd" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto"><path d="M 0 0 L 9 5 L 0 10 z" fill="${palette.muted}"/></marker></defs>
<rect width="${canvasW}" height="720" fill="${palette.paper}"/><rect width="${canvasW}" height="720" fill="url(#dots)" opacity=".6"/>
<text x="48" y="52" font-size="28" font-weight="700" fill="${palette.ink}" font-family="Georgia, serif">${esc(d.title)}</text>
<text x="48" y="84" font-size="16" fill="${palette.muted}" font-family="Georgia, serif">${esc(d.subtitle)}</text>
${edges}${nodes}
<text x="${canvasW/2}" y="700" text-anchor="middle" font-size="14" font-style="italic" fill="${palette.muted}" font-family="Georgia, serif">${esc(d.footer)}</text>
</svg>`
}

fs.writeFileSync(path.join(imageDir, `${d.slug}.svg`), buildSvg())
fs.writeFileSync(path.join(dlDir, `${d.slug}.excalidraw`), buildExcalidraw())
console.log("OK", d.slug)
