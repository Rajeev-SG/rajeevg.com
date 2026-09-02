import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const imageDir = path.join(root, "public/images/blog/agent-friendly-shipping")
const dlDir = path.join(root, "public/downloads")
fs.mkdirSync(imageDir, { recursive: true })
fs.mkdirSync(dlDir, { recursive: true })

const INK = "#334155"
const MUTED = "#64748b"
const PAPER = "#ffffff"

const esc = (v) => v.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")

// ===========================================================================
// Figure 1 — jargon map
// Teaching objective: the reader can see at a glance that a domain name,
// DNS, nameservers, DNS records, hosting and a custom domain are one
// connected path — not six disconnected terms to memorise.
// ===========================================================================

const W1 = 1360
const H1 = 780

const nodes1 = [
  { id: "idea", x: 40, y: 120, w: 230, h: 110, title: "Your idea", lines: ["the thing you want", "people to find"], stroke: "#0f172a" },
  { id: "registrar", x: 330, y: 120, w: 250, h: 110, title: "Registrar", lines: ["where you buy the name", "you pay yearly"], stroke: "#7c3aed" },
  { id: "domain", x: 640, y: 120, w: 220, h: 110, title: "Domain", lines: ["yourname.com", "the address itself"], stroke: "#2563eb" },
  { id: "nameserver", x: 930, y: 120, w: 250, h: 110, title: "Nameservers", lines: ["the phone book keeper", "usually your DNS provider"], stroke: "#0891b2" },
  { id: "dns", x: 640, y: 310, w: 220, h: 110, title: "DNS", lines: ["the phone book", "maps name to a server"], stroke: "#0891b2" },
  { id: "record", x: 930, y: 310, w: 250, h: 110, title: "DNS record", lines: ["one entry:", "yourname.com → IP address"], stroke: "#0891b2" },
  { id: "deploy", x: 330, y: 500, w: 250, h: 110, title: "Deployment", lines: ["your agent sends the", "build result there"], stroke: "#059669" },
  { id: "hosting", x: 640, y: 500, w: 220, h: 110, title: "Hosting", lines: ["the service that keeps", "your site available"], stroke: "#059669" },
  { id: "build", x: 40, y: 500, w: 230, h: 110, title: "Build", lines: ["turns your source files", "into what a browser reads"], stroke: "#059669" },
  { id: "custom", x: 930, y: 500, w: 250, h: 110, title: "Live custom domain", lines: ["the name reaches the site", "and loads securely over TLS"], stroke: "#0d9488" },
]

const edges1 = [
  { from: "idea", to: "registrar" },
  { from: "registrar", to: "domain" },
  { from: "domain", to: "nameserver" },
  { from: "nameserver", to: "dns" },
  { from: "dns", to: "record" },
  { from: "record", to: "custom" },
  { from: "build", to: "deploy" },
  { from: "deploy", to: "hosting" },
  { from: "hosting", to: "custom" },
]

function buildJargonDrawio() {
  const cells = []
  cells.push(`<mxCell id="hdr1" value="&lt;b&gt;The jargon map: one connected path, not six separate terms&lt;/b&gt;" style="rounded=1;whiteSpace=wrap;html=1;align=left;spacingLeft=20;fillColor=#0f172a;strokeColor=#0f172a;fontColor=#ffffff;fontSize=19;" vertex="1" parent="1"><mxGeometry x="40" y="30" width="1280" height="52" as="geometry"/></mxCell>`)
  // edges first (rendered beneath nodes)
  for (let i = 0; i < edges1.length; i++) {
    const e = edges1[i]
    cells.push(`<mxCell id="e1_${i}" value="" style="edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;strokeColor=${INK};strokeWidth=2;endArrow=classic;endFill=1;" edge="1" parent="1" source="${e.from}" target="${e.to}"><mxGeometry relative="1" as="geometry"/></mxCell>`)
  }
  for (const n of nodes1) {
    const lines = n.lines.map((l) => esc(l)).join("&lt;br&gt;")
    cells.push(`<mxCell id="${n.id}" value="&lt;b&gt;${esc(n.title)}&lt;/b&gt;&lt;br&gt;${lines}" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=${n.stroke};strokeWidth=2;fontSize=13;labelBackgroundColor=#ffffff;align=center;" vertex="1" parent="1"><mxGeometry x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" as="geometry"/></mxCell>`)
  }
  cells.push(`<mxCell id="legend1" value="Follow the arrows top-left to bottom-right: buy the name → keep the phone book → add one entry → build and deploy → point the name at the hosting. The arrows are the order you actually do things in, not the order the words appear in a glossary. · Evidence date: 2 Sep 2026" style="rounded=1;whiteSpace=wrap;html=1;align=center;fillColor=#f8fafc;strokeColor=#cbd5e1;fontSize=12;fontStyle=2;labelBackgroundColor=#f8fafc;" vertex="1" parent="1"><mxGeometry x="40" y="710" width="1280" height="46" as="geometry"/></mxCell>`)
  return `<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="app.diagrams.net" modified="2026-09-02T00:00:00.000Z" agent="Codex" version="24.7.17"><diagram id="agent-friendly-jargon-map" name="agent-friendly-jargon-map"><mxGraphModel dx="1480" dy="860" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="${W1}" pageHeight="${H1}" math="0" shadow="0" background="#ffffff"><root>
<mxCell id="0"/><mxCell id="1" parent="0"/>
${cells.join("\n")}
</root></mxGraphModel></diagram></mxfile>
`
}

function buildJargonSvg() {
  const edgeSvg = edges1.map((e) => {
    const a = nodes1.find((n) => n.id === e.from)
    const b = nodes1.find((n) => n.id === e.to)
    // simple orthogonal: exit bottom or right, enter top or left
    let d
    if (a.y === b.y && a.x + a.w < b.x) {
      // horizontal
      d = `M ${a.x + a.w} ${a.y + a.h / 2} L ${b.x} ${b.y + b.h / 2}`
    } else if (a.y + a.h < b.y && a.x === b.x) {
      d = `M ${a.x + a.w / 2} ${a.y + a.h} L ${b.x + b.w / 2} ${b.y}`
    } else if (a.y + a.h < b.y) {
      // route via bottom
      const midY = (a.y + a.h + b.y) / 2
      d = `M ${a.x + a.w / 2} ${a.y + a.h} L ${a.x + a.w / 2} ${midY} L ${b.x + b.w / 2} ${midY} L ${b.x + b.w / 2} ${b.y}`
    } else {
      // backward/vertical fallback: exit bottom, route under, enter left
      const midY = a.y + a.h + 30
      d = `M ${a.x + a.w / 2} ${a.y + a.h} L ${a.x + a.w / 2} ${midY} L ${b.x - 20} ${midY} L ${b.x - 20} ${b.y + b.h / 2} L ${b.x} ${b.y + b.h / 2}`
    }
    return `<path d="${d}" fill="none" stroke="${INK}" stroke-width="2" marker-end="url(#arrowEnd)"/>`
  }).join("\n")
  const nodeSvg = nodes1.map((n) => `<rect x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" rx="10" fill="#ffffff" stroke="${n.stroke}" stroke-width="2"/>
  <text x="${n.x + n.w / 2}" y="${n.y + 28}" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="16" font-weight="700" fill="#0f172a">${esc(n.title)}</text>
${n.lines.map((l, i) => `  <text x="${n.x + n.w / 2}" y="${n.y + 54 + i * 20}" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="12.5" fill="#334155">${esc(l)}</text>`).join("\n")}`).join("\n")
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W1} ${H1}" width="${W1}" height="${H1}" role="img" aria-labelledby="t1 d1">
<title id="t1">The jargon map: one connected path from idea to live site</title>
<desc id="d1">Shows the order: buy the domain name from a registrar, nameservers point to DNS, a DNS record maps the name to a hosting IP, then build, deploy and point the custom domain at the hosting.</desc>
<defs><marker id="arrowEnd" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto"><path d="M 0 0 L 9 5 L 0 10 z" fill="${INK}"/></marker></defs>
<rect width="${W1}" height="${H1}" fill="${PAPER}"/>
<rect x="40" y="30" width="1280" height="52" rx="8" fill="#0f172a"/>
<text x="60" y="65" font-family="Helvetica, Arial, sans-serif" font-size="20" font-weight="700" fill="#ffffff">The jargon map: one connected path, not six separate terms</text>
${edgeSvg}
${nodeSvg}
<text x="${W1 / 2}" y="744" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="13" font-style="italic" fill="${MUTED}">Follow the arrows top-left to bottom-right · buy the name → keep the phone book → add one entry → build and deploy → point the name at the hosting · Evidence date: 2 Sep 2026</text>
</svg>`
}

// ===========================================================================
// Figure 2 — agent control surface
// Teaching objective: the reader can see what an agent actually needs
// (credentials + a reachable endpoint) and what it can then do end to end —
// so "agent-friendly" is a concrete test, not a marketing label.
// ===========================================================================

const W2 = 1400
const H2 = 800

const nodes2 = [
  { id: "you", x: 40, y: 130, w: 220, h: 110, title: "You", lines: ["ask for a change or", "a new deployment"], stroke: "#0f172a" },
  { id: "agent", x: 340, y: 130, w: 260, h: 140, title: "Coding agent", lines: ["CLI · MCP · API", "runs on your machine", "or a cloud runner"], stroke: "#2563eb" },
  { id: "auth", x: 340, y: 360, w: 260, h: 120, title: "Auth token", lines: ["scoped key, stored as an", "environment variable", "never committed to git"], stroke: "#d97706" },
  { id: "cli", x: 700, y: 100, w: 280, h: 100, title: "CLI", lines: ["terminal commands", "e.g. vercel deploy"], stroke: "#7c3aed" },
  { id: "mcp", x: 700, y: 230, w: 280, h: 100, title: "MCP server", lines: ["a tool surface the agent", "discovers and calls"], stroke: "#7c3aed" },
  { id: "api", x: 700, y: 360, w: 280, h: 100, title: "API", lines: ["direct HTTPS calls", "when no CLI or MCP exists"], stroke: "#7c3aed" },
  { id: "vendor", x: 1070, y: 100, w: 280, h: 120, title: "Vendor", lines: ["Vercel · Cloudflare ·", "Hetzner · Coolify", "the service doing the work"], stroke: "#059669" },
  { id: "vercel", x: 1070, y: 260, w: 280, h: 110, title: "Result", lines: ["production URL", "or preview URL"], stroke: "#0d9488" },
  { id: "log", x: 40, y: 360, w: 220, h: 120, title: "Logs", lines: ["what the agent reads", "to know if it worked"], stroke: "#0891b2" },
  { id: "rollback", x: 40, y: 560, w: 220, h: 110, title: "Rollback", lines: ["put the previous good", "version back"], stroke: "#dc2626" },
]

const edges2 = [
  { from: "you", to: "agent" },
  { from: "agent", to: "auth", dashed: true },
  { from: "agent", to: "cli" },
  { from: "agent", to: "mcp" },
  { from: "agent", to: "api" },
  { from: "cli", to: "vendor" },
  { from: "mcp", to: "vendor" },
  { from: "api", to: "vendor" },
  { from: "vendor", to: "vercel" },
  { from: "agent", to: "log", dashed: true },
  { from: "log", to: "rollback", dashed: true },
]

function buildAgentDrawio() {
  const cells = []
  cells.push(`<mxCell id="hdr2" value="&lt;b&gt;What an agent actually needs to ship a site&lt;/b&gt;" style="rounded=1;whiteSpace=wrap;html=1;align=left;spacingLeft=20;fillColor=#0f172a;strokeColor=#0f172a;fontColor=#ffffff;fontSize=19;" vertex="1" parent="1"><mxGeometry x="40" y="30" width="1320" height="52" as="geometry"/></mxCell>`)
  for (let i = 0; i < edges2.length; i++) {
    const e = edges2[i]
    const dash = e.dashed ? "dashed=1;" : ""
    cells.push(`<mxCell id="e2_${i}" value="" style="edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;strokeColor=${INK};strokeWidth=2;endArrow=classic;endFill=1;${dash}" edge="1" parent="1" source="${e.from}" target="${e.to}"><mxGeometry relative="1" as="geometry"/></mxCell>`)
  }
  for (const n of nodes2) {
    const lines = n.lines.map((l) => esc(l)).join("&lt;br&gt;")
    cells.push(`<mxCell id="${n.id}" value="&lt;b&gt;${esc(n.title)}&lt;/b&gt;&lt;br&gt;${lines}" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=${n.stroke};strokeWidth=2;fontSize=13;labelBackgroundColor=#ffffff;align=center;" vertex="1" parent="1"><mxGeometry x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" as="geometry"/></mxCell>`)
  }
  cells.push(`<mxCell id="legend2" value="Solid arrows are the paths that make deployment work. Dashed arrows are the parts that keep it safe: the token is scoped and never committed, logs tell the agent whether the build succeeded, and rollback puts the previous good version back. · Evidence date: 2 Sep 2026" style="rounded=1;whiteSpace=wrap;html=1;align=center;fillColor=#f8fafc;strokeColor=#cbd5e1;fontSize=12;fontStyle=2;labelBackgroundColor=#f8fafc;" vertex="1" parent="1"><mxGeometry x="40" y="730" width="1320" height="46" as="geometry"/></mxCell>`)
  return `<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="app.diagrams.net" modified="2026-09-02T00:00:00.000Z" agent="Codex" version="24.7.17"><diagram id="agent-friendly-control-surface" name="agent-friendly-control-surface"><mxGraphModel dx="1480" dy="860" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="${W2}" pageHeight="${H2}" math="0" shadow="0" background="#ffffff"><root>
<mxCell id="0"/><mxCell id="1" parent="0"/>
${cells.join("\n")}
</root></mxGraphModel></diagram></mxfile>
`
}

function buildAgentSvg() {
  const edgeSvg = edges2.map((e) => {
    const a = nodes2.find((n) => n.id === e.from)
    const b = nodes2.find((n) => n.id === e.to)
    let d
    if (a.y === b.y && a.x + a.w < b.x) {
      d = `M ${a.x + a.w} ${a.y + a.h / 2} L ${b.x} ${b.y + b.h / 2}`
    } else if (a.y + a.h < b.y && Math.abs(a.x + a.w / 2 - (b.x + b.w / 2)) < 20) {
      d = `M ${a.x + a.w / 2} ${a.y + a.h} L ${b.x + b.w / 2} ${b.y}`
    } else if (a.y + a.h < b.y && a.x + a.w > b.x && a.x < b.x + b.w) {
      // exit right, route to target left/top
      const midY = Math.max(a.y + a.h, b.y - 20)
      d = `M ${a.x + a.w / 2} ${a.y + a.h} L ${a.x + a.w / 2} ${midY} L ${b.x + b.w / 2} ${midY} L ${b.x + b.w / 2} ${b.y}`
    } else if (a.y === b.y) {
      d = `M ${a.x + a.w} ${a.y + a.h / 2} L ${b.x} ${b.y + b.h / 2}`
    } else {
      // vertical fallback with route
      const midY = (a.y + a.h + b.y) / 2
      const ax = a.x + a.w / 2
      const bx = b.x + b.w / 2
      d = `M ${ax} ${a.y + a.h} L ${ax} ${midY} L ${bx} ${midY} L ${bx} ${b.y}`
    }
    const dash = e.dashed ? ` stroke-dasharray="8 6"` : ""
    return `<path d="${d}" fill="none" stroke="${INK}" stroke-width="2" marker-end="url(#arrowEnd2)"${dash}/>`
  }).join("\n")
  const nodeSvg = nodes2.map((n) => `<rect x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" rx="10" fill="#ffffff" stroke="${n.stroke}" stroke-width="2"/>
  <text x="${n.x + n.w / 2}" y="${n.y + 28}" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="16" font-weight="700" fill="#0f172a">${esc(n.title)}</text>
${n.lines.map((l, i) => `  <text x="${n.x + n.w / 2}" y="${n.y + 54 + i * 20}" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="12.5" fill="#334155">${esc(l)}</text>`).join("\n")}`).join("\n")
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W2} ${H2}" width="${W2}" height="${H2}" role="img" aria-labelledby="t2 d2">
<title id="t2">What an agent actually needs to ship a site</title>
<desc id="d2">You ask the coding agent. The agent holds a scoped auth token stored as an environment variable. It reaches the vendor through a CLI, MCP server or API. The vendor produces a production or preview URL. Logs let the agent check success. Rollback returns the previous good version if needed.</desc>
<defs><marker id="arrowEnd2" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto"><path d="M 0 0 L 9 5 L 0 10 z" fill="${INK}"/></marker></defs>
<rect width="${W2}" height="${H2}" fill="${PAPER}"/>
<rect x="40" y="30" width="1320" height="52" rx="8" fill="#0f172a"/>
<text x="60" y="65" font-family="Helvetica, Arial, sans-serif" font-size="20" font-weight="700" fill="#ffffff">What an agent actually needs to ship a site</text>
${edgeSvg}
${nodeSvg}
<text x="${W2 / 2}" y="762" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="13" font-style="italic" fill="${MUTED}">Solid arrows: the deployment path · Dashed arrows: the safety path (scoped token, logs, rollback) · Evidence date: 2 Sep 2026</text>
</svg>`
}

// ===========================================================================
// Write files
// ===========================================================================

fs.writeFileSync(path.join(dlDir, "agent-friendly-shipping-jargon-map.drawio"), buildJargonDrawio())
fs.writeFileSync(path.join(imageDir, "agent-friendly-shipping-jargon-map.svg"), buildJargonSvg())
fs.writeFileSync(path.join(dlDir, "agent-friendly-shipping-control-surface.drawio"), buildAgentDrawio())
fs.writeFileSync(path.join(imageDir, "agent-friendly-shipping-control-surface.svg"), buildAgentSvg())

console.log("OK agent-friendly-shipping diagrams")
