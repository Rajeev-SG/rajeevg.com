#!/usr/bin/env node
import { mkdirSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

/* ── palette (verbatim from generate-a2a-article-diagrams.mjs) ── */
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
};

/* ── helpers ── */
function esc(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/* ── SVG skeleton ── */
function svgFor(title, subtitle, footer, bodyContent) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" width="1280" height="720">
  <title>${esc(title)}</title>
  <desc>${esc(subtitle)}</desc>
  <defs>
    <pattern id="dotgrid" width="24" height="24" patternUnits="userSpaceOnUse">
      <circle cx="12" cy="12" r="1" fill="${palette.grid}"/>
    </pattern>
    <filter id="wobble" x="-2%" y="-2%" width="104%" height="104%">
      <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" result="noise"/>
      <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.5" xChannelSelector="R" yChannelSelector="G"/>
    </filter>
  </defs>
  <style>
    .title { font: 700 30px/1 "Inter", "Segoe UI", sans-serif; fill: ${palette.ink}; }
    .subtitle { font: 400 14.5px/1 "Inter", "Segoe UI", sans-serif; fill: ${palette.muted}; }
    .node-title { font: 700 17px/1 "Inter", "Segoe UI", sans-serif; fill: ${palette.ink}; }
    .node-body { font: 400 14.5px/1 "Inter", "Segoe UI", sans-serif; fill: ${palette.muted}; }
    .arrow-label { font: 600 15px/1 "Inter", "Segoe UI", sans-serif; fill: ${palette.ink}; text-anchor: middle; paint-order: stroke; stroke: ${palette.paper}; stroke-width: 6px; stroke-linejoin: round; }
    .annotation { font: italic 400 15px/1 "Inter", "Segoe UI", sans-serif; fill: ${palette.muted}; }
    .footer { font: 400 14px/1 "Inter", "Segoe UI", sans-serif; fill: ${palette.muted}; text-anchor: middle; }
  </style>
  <rect width="1280" height="720" fill="${palette.paper}"/>
  <rect width="1280" height="720" fill="url(#dotgrid)"/>
  <text x="48" y="60" class="title">${esc(title)}</text>
  <text x="48" y="91" class="subtitle">${esc(subtitle)}</text>
  <line x1="48" y1="101" x2="1232" y2="101" stroke="${palette.grid}" stroke-width="1"/>
  <line x1="48" y1="674" x2="1232" y2="674" stroke="${palette.grid}" stroke-width="1"/>
  <text x="640" y="700" class="footer">${esc(footer)}</text>
  <g filter="url(#wobble)">
${bodyContent}
  </g>
</svg>`;
}

/* ── diagram data ── */
const nodes = [
  {
    id: "driver",
    label: "Driver script (Python)",
    fill: palette.amber,
    stroke: palette.amberStroke,
    x: 48, y: 140, w: 230,
    body: ["builds the loop", "passes url + goal", "calls agent.run()"],
  },
  {
    id: "agent",
    label: "Jev Agent loop",
    fill: palette.purple,
    stroke: palette.purpleStroke,
    x: 360, y: 210, w: 300,
    body: ["the only piece that talks", "to both Jev and the browser", "repeats until DONE or BLOCKED"],
  },
  {
    id: "jev",
    label: "Jev (model over HTTP)",
    fill: palette.blue,
    stroke: palette.blueStroke,
    x: 740, y: 130, w: 260,
    body: ["picks the next action", "returns ONE index", "never touches the browser"],
  },
  {
    id: "bridge",
    label: "BridgeBrowser",
    fill: palette.green,
    stroke: palette.greenStroke,
    x: 300, y: 470, w: 280,
    body: ["re-checks the chosen node", "builds a CSS selector", "never guesses"],
  },
  {
    id: "transport",
    label: "Transport",
    fill: palette.rose,
    stroke: palette.roseStroke,
    x: 690, y: 470, w: 300,
    body: ["Playwriter or Browser Relay", "one per run, set by an env var", "performs the native action"],
  },
  {
    id: "chrome",
    label: "Your Chrome",
    fill: palette.amber,
    stroke: palette.amberStroke,
    x: 1080, y: 470, w: 180,
    body: ["the tab you are logged into", "real click, real typing"],
  },
];

// Single source for vertical metrics, so a font change cannot desync the boxes.
const M = { titleBase: 46, firstBody: 40, line: 26, padBottom: 18 };
for (const n of nodes) {
  n.h = M.titleBase + M.firstBody + n.body.length * M.line + M.padBottom;
}

const arrows = [
  {
    num: 1,
    label: "starts the loop",
    from: "driver",
    to: "agent",
    x1: 270, y1: 200,
    x2: 366, y2: 232,
    labelDx: -26, labelDy: -18,
  },
  {
    num: 2,
    label: "decide",
    from: "agent",
    to: "jev",
    x1: 660, y1: 215,
    x2: 736, y2: 205,
    labelDx: -2, labelDy: -20,
  },
  {
    num: 3,
    label: "act",
    from: "agent",
    to: "bridge",
    x1: 440, y1: 392,
    x2: 440, y2: 466,
    labelDx: 46, labelDy: -2,
  },
  {
    num: 4,
    label: "selector",
    from: "bridge",
    to: "transport",
    x1: 580, y1: 520,
    x2: 690, y2: 520,
    labelDx: 0, labelDy: -14,
  },
  {
    num: 5,
    label: "drives",
    from: "transport",
    to: "chrome",
    x1: 996, y1: 524,
    x2: 1056, y2: 524,
    labelDx: 0, labelDy: -22,
  },
];

/* ── build SVG body ── */
let body = "";

// Nodes
for (const n of nodes) {
  body += `    <rect x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" rx="10" fill="${n.fill}" stroke="${n.stroke}" stroke-width="2"/>\n`;
  body += `    <text x="${n.x + 14}" y="${n.y + M.titleBase}" class="node-title">${esc(n.label)}</text>\n`;
  n.body.forEach((line, i) => {
    const ly = n.y + M.titleBase + M.firstBody + i * M.line;
    body += `    <text x="${n.x + 14}" y="${ly}" class="node-body">${esc(line)}</text>\n`;
  });
}

// Arrows
for (const a of arrows) {
  const mx = (a.x1 + a.x2) / 2 + (a.labelDx || 0);
  const my = (a.y1 + a.y2) / 2 + (a.labelDy || 0);
  body += `    <line x1="${a.x1}" y1="${a.y1}" x2="${a.x2}" y2="${a.y2}" stroke="${palette.ink}" stroke-width="2" marker-end="url(#arrowhead)"/>\n`;
  body += `    <text x="${mx}" y="${my}" class="arrow-label">${a.num}. ${esc(a.label)}</text>\n`;
}

// Annotation
body += `    <text x="700" y="410" class="annotation">Jev and the transport never communicate directly.</text>\n`;
body += `    <text x="700" y="430" class="annotation">The Agent loop sits between them.</text>\n`;

// Arrowhead marker (add to defs via body trick - actually we need it in defs)
// We'll inject it into the svgFor by modifying the approach slightly

const title = "Jev Call Chain: Who Calls What, In Order";
const subtitle = "The Agent loop is the only piece that talks to both Jev and the browser. Jev never touches the transport.";
const footer = "jev-browser-bridge · call-chain diagram";

// Build full SVG with arrowhead marker
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" width="1280" height="720">
  <title>${esc(title)}</title>
  <desc>${esc(subtitle)}</desc>
  <defs>
    <pattern id="dotgrid" width="24" height="24" patternUnits="userSpaceOnUse">
      <circle cx="12" cy="12" r="1" fill="${palette.grid}"/>
    </pattern>
    <filter id="wobble" x="-2%" y="-2%" width="104%" height="104%">
      <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" result="noise"/>
      <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.5" xChannelSelector="R" yChannelSelector="G"/>
    </filter>
    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
      <polygon points="0 0, 10 3.5, 0 7" fill="${palette.ink}"/>
    </marker>
  </defs>
  <style>
    .title { font: 700 30px/1 "Inter", "Segoe UI", sans-serif; fill: ${palette.ink}; }
    .subtitle { font: 400 14.5px/1 "Inter", "Segoe UI", sans-serif; fill: ${palette.muted}; }
    .node-title { font: 700 17px/1 "Inter", "Segoe UI", sans-serif; fill: ${palette.ink}; }
    .node-body { font: 400 14.5px/1 "Inter", "Segoe UI", sans-serif; fill: ${palette.muted}; }
    .arrow-label { font: 600 15px/1 "Inter", "Segoe UI", sans-serif; fill: ${palette.ink}; text-anchor: middle; paint-order: stroke; stroke: ${palette.paper}; stroke-width: 6px; stroke-linejoin: round; }
    .annotation { font: italic 400 15px/1 "Inter", "Segoe UI", sans-serif; fill: ${palette.muted}; }
    .footer { font: 400 14px/1 "Inter", "Segoe UI", sans-serif; fill: ${palette.muted}; text-anchor: middle; }
  </style>
  <rect width="1280" height="720" fill="${palette.paper}"/>
  <rect width="1280" height="720" fill="url(#dotgrid)"/>
  <text x="48" y="60" class="title">${esc(title)}</text>
  <text x="48" y="91" class="subtitle">${esc(subtitle)}</text>
  <line x1="48" y1="101" x2="1232" y2="101" stroke="${palette.grid}" stroke-width="1"/>
  <line x1="48" y1="674" x2="1232" y2="674" stroke="${palette.grid}" stroke-width="1"/>
  <text x="640" y="700" class="footer">${esc(footer)}</text>
  <g filter="url(#wobble)">
${body}  </g>
</svg>`;

/* ── Excalidraw builder ── */
let seedCounter = 1000;
function baseElement(type, x, y, width, height, seed) {
  return {
    id: `el_${seed}`,
    type,
    x,
    y,
    width,
    height,
    angle: 0,
    strokeColor: palette.ink,
    backgroundColor: "transparent",
    fillStyle: "solid",
    strokeWidth: 2,
    strokeStyle: "solid",
    roughness: 1,
    opacity: 100,
    groupIds: [],
    frameId: null,
    roundness: { type: 3 },
    seed: seed || seedCounter++,
    version: 1,
    versionNonce: seedCounter++,
    isDeleted: false,
    boundElements: null,
    updated: Date.now(),
    link: null,
    locked: false,
  };
}

function makeRect(x, y, w, h, bgColor, strokeColor) {
  const el = baseElement("rectangle", x, y, w, h, seedCounter++);
  el.backgroundColor = bgColor;
  el.strokeColor = strokeColor;
  return el;
}

function makeText(x, y, text, fontSize = 16) {
  const el = baseElement("text", x, y, text.length * fontSize * 0.6, fontSize * 1.4, seedCounter++);
  el.text = text;
  el.fontSize = fontSize;
  el.fontFamily = 1;
  el.textAlign = "left";
  el.verticalAlign = "top";
  el.baseline = fontSize;
  el.containerId = null;
  el.originalText = text;
  return el;
}

function makeArrow(x1, y1, x2, y2) {
  const el = baseElement("arrow", x1, y1, x2 - x1, y2 - y1, seedCounter++);
  el.points = [[0, 0], [x2 - x1, y2 - y1]];
  el.lastCommittedPoint = null;
  el.startBinding = null;
  el.endBinding = null;
  el.startArrowhead = null;
  el.endArrowhead = "arrow";
  return el;
}

const elements = [];

for (const n of nodes) {
  elements.push(makeRect(n.x, n.y, n.w, n.h, n.fill, n.stroke));
  elements.push(makeText(n.x + 14, n.y + 28, n.label, 15));
  n.body.forEach((line, i) => {
    elements.push(makeText(n.x + 14, n.y + M.titleBase + M.firstBody + i * M.line - 13, line, 14));
  });
}

for (const a of arrows) {
  elements.push(makeArrow(a.x1, a.y1, a.x2, a.y2));
  const mx = (a.x1 + a.x2) / 2 + (a.labelDx || 0);
  const my = (a.y1 + a.y2) / 2 + (a.labelDy || 0);
  elements.push(makeText(mx, my - 14, `${a.num}. ${a.label}`, 12));
}

elements.push(makeText(700, 396, "Jev and the transport never communicate directly.", 13));
elements.push(makeText(700, 416, "The Agent loop sits between them.", 13));

const excalidrawData = {
  type: "excalidraw",
  version: 2,
  source: "https://excalidraw.com",
  elements,
  appState: { gridSize: null, viewBackgroundColor: palette.paper },
  files: {},
};

/* ── write outputs ── */
const svgDir = join(root, "public", "images", "blog", "jev-browser-bridge");
const dlDir = join(root, "public", "downloads");
mkdirSync(svgDir, { recursive: true });
mkdirSync(dlDir, { recursive: true });

writeFileSync(join(svgDir, "jev-call-chain.svg"), svgContent, "utf-8");
writeFileSync(join(dlDir, "jev-call-chain.excalidraw"), JSON.stringify(excalidrawData, null, 2), "utf-8");

console.log("✓ wrote public/images/blog/jev-browser-bridge/jev-call-chain.svg");
console.log("✓ wrote public/downloads/jev-call-chain.excalidraw");
