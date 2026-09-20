import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

// ─── House-style palette ────────────────────────────────────────────────────
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

// ─── Helpers ────────────────────────────────────────────────────────────────
function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ─── SVG skeleton ───────────────────────────────────────────────────────────
function svgFor(title, subtitle, bodyContent) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" width="1280" height="720">
<title>${esc(title)}</title>
<desc>${esc(subtitle)}</desc>
<defs>
  <filter id="wobble" x="-2%" y="-2%" width="104%" height="104%">
    <feTurbulence type="fractalNoise" baseFrequency="0.015" numOctaves="2" result="n"/>
    <feDisplacementMap in="SourceGraphic" in2="n" scale="1.5"/>
  </filter>
  <pattern id="dotgrid" width="24" height="24" patternUnits="userSpaceOnUse">
    <circle cx="12" cy="12" r="0.7" fill="${palette.grid}"/>
  </pattern>
</defs>
<style>
  text { font-family: "Inter", "SF Pro Text", system-ui, sans-serif; }
  .title { font-size: 28px; font-weight: 700; fill: ${palette.ink}; }
  .subtitle { font-size: 17px; fill: ${palette.muted}; }
  .footer { font-size: 14px; fill: ${palette.muted}; text-anchor: middle; }
  .box-title { font-size: 18px; font-weight: 700; fill: ${palette.ink}; }
  .box-body { font-size: 16px; fill: ${palette.ink}; font-family: "SF Mono", "Fira Code", monospace; }
  .box-note { font-size: 14px; fill: ${palette.muted}; font-style: italic; }
  .arrow-label { font-size: 15px; fill: ${palette.muted}; }
  .annotation { font-size: 16px; font-weight: 600; fill: ${palette.ink}; }
  .annotation-sub { font-size: 14px; fill: ${palette.muted}; }
</style>
<rect width="1280" height="720" fill="${palette.paper}"/>
<rect width="1280" height="720" fill="url(#dotgrid)"/>
<text class="title" x="48" y="60">${esc(title)}</text>
<text class="subtitle" x="48" y="91">${esc(subtitle)}</text>
<line x1="48" y1="101" x2="1232" y2="101" stroke="${palette.grid}" stroke-width="1"/>
${bodyContent}
<line x1="48" y1="674" x2="1232" y2="674" stroke="${palette.grid}" stroke-width="1"/>
<text class="footer" x="640" y="700">JEV Browser Bridge · Turn Payload Diagram</text>
</svg>`;
}

// ─── Diagram content ────────────────────────────────────────────────────────
const title = "JEV Turn: What Crosses Each Hop";
const subtitle =
  "The model emits an index. The code turns it into a selector. Every payload in one turn.";

function roundedRect(x, y, w, h, r, fill, stroke) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}" stroke-width="1.5" filter="url(#wobble)"/>`;
}

function arrow(x1, y1, x2, y2, color, dashed) {
  const dash = dashed ? ` stroke-dasharray="6 4"` : "";
  const id = `ah_${Math.round(x1)}_${Math.round(y1)}`;
  return `<defs><marker id="${id}" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><path d="M0,0 L8,3 L0,6" fill="${color}"/></marker></defs>
<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="1.5"${dash} marker-end="url(#${id})"/>`;
}

function curvedArrow(path, color, dashed) {
  const dash = dashed ? ` stroke-dasharray="6 4"` : "";
  const id = `ah_c_${Math.round(Math.random() * 9999)}`;
  return `<defs><marker id="${id}" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><path d="M0,0 L8,3 L0,6" fill="${color}"/></marker></defs>
<path d="${path}" fill="none" stroke="${color}" stroke-width="1.5"${dash} marker-end="url(#${id})"/>`;
}

// Box positions
const row1Y = 115;
const row2Y = 365;

const boxes = [
  { x: 48, y: row1Y, w: 300, h: 147, fill: palette.amber, stroke: palette.amberStroke, title: "1. Driver -> Agent Loop", lines: ['Agent(url="...todomvc/",', 'goal="Add two todos, click Active")'] },
  { x: 420, y: row1Y, w: 330, h: 172, fill: palette.blue, stroke: palette.blueStroke, title: "2. Agent -> Jev (HTTP)", lines: ["{goal, page:{url,title,text},", " elements:[...numbered...],", " recent_actions:[...]}"] },
  { x: 830, y: row1Y, w: 390, h: 172, fill: palette.blue, stroke: palette.blueStroke, title: "3. Jev -> Agent Loop", lines: ['Response: "e5"', "An index into the element list.", "Not a selector."] },
  { x: 48, y: row2Y, w: 330, h: 172, fill: palette.green, stroke: palette.greenStroke, title: "4. Agent -> BridgeBrowser", lines: ['act({id:"e5", kind:"click",', " node:5}, page)", "Text fields: also passes text"] },
  { x: 420, y: row2Y, w: 330, h: 172, fill: palette.green, stroke: palette.greenStroke, title: "5. Bridge -> Transport", lines: ['[data-jev-fast-target=', ' "jev-9f2c..."]', "One-use attr on chosen element"] },
  { x: 830, y: row2Y, w: 390, h: 172, fill: palette.purple, stroke: palette.purpleStroke, title: "6. Transport -> Chrome", lines: ['browser-relay click "[sel]"', " --tab t_X", 'page.locator("[sel]").click()'] },
];

let body = "";

// Draw boxes
for (const b of boxes) {
  body += roundedRect(b.x, b.y, b.w, b.h, 8, b.fill, b.stroke) + "\n";
  body += `<text class="box-title" x="${b.x + 14}" y="${b.y + 43}">${esc(b.title)}</text>\n`;
  b.lines.forEach((line, i) => {
    const ly = b.y + 43 + 36 + i * 25;
    body += `<text class="box-body" x="${b.x + 14}" y="${ly}">${esc(line)}</text>\n`;
  });
}

// Arrows between row 1 boxes
const r1mid = row1Y + 80;
body += arrow(348, r1mid, 420, r1mid, palette.amberStroke, false) + "\n";
body += arrow(750, r1mid, 830, r1mid, palette.blueStroke, false) + "\n";

// Connecting arrow from row 1 to row 2 (from bottom of box 3 area down to top of box 4)
body += curvedArrow(
  `M 1025 ${row1Y + 172} C 1025 ${row1Y + 210}, 213 ${row2Y - 40}, 213 ${row2Y}`,
  palette.muted,
  false
) + "\n";

// Arrows between row 2 boxes
const r2mid = row2Y + 86;
body += arrow(378, r2mid, 420, r2mid, palette.greenStroke, false) + "\n";
body += arrow(750, r2mid, 830, r2mid, palette.greenStroke, false) + "\n";

// Return dashed arrow along the bottom
const retY = row2Y + 172 + 28;
body += curvedArrow(
  `M 1200 ${retY} L 100 ${retY}`,
  palette.muted,
  true
) + "\n";
body += `<text class="arrow-label" x="640" y="${retY + 16}" text-anchor="middle">After action: Agent calls browser.observe() -> fresh numbered list -> turn repeats</text>\n`;

// Key annotation
const annY = retY + 42;
body += `<rect x="340" y="${annY - 14}" width="600" height="44" rx="6" fill="${palette.rose}" stroke="${palette.roseStroke}" stroke-width="1"/>\n`;
body += `<text class="annotation" x="640" y="${annY + 4}" text-anchor="middle">The model produced an index; the code produced the selector.</text>\n`;
body += `<text class="annotation-sub" x="640" y="${annY + 22}" text-anchor="middle">Jev outputs "e5" (blue). BridgeBrowser resolves it to a CSS attribute selector (green).</text>\n`;

// Payload labels under row 1 arrows
const pl1y = row1Y + 172 + 12;
body += `<text class="arrow-label" x="384" y="${pl1y}" text-anchor="middle">goal + url</text>\n`;
body += `<text class="arrow-label" x="790" y="${pl1y}" text-anchor="middle">numbered DOM</text>\n`;

// Payload labels under row 2 arrows
const pl2y = row2Y + 172 + 12;
body += `<text class="arrow-label" x="399" y="${pl2y}" text-anchor="middle">resolved node</text>\n`;
body += `<text class="arrow-label" x="790" y="${pl2y}" text-anchor="middle">stamped attr</text>\n`;

const svg = svgFor(title, subtitle, body);

// ─── Excalidraw ─────────────────────────────────────────────────────────────
function excalidrawElement(type, props) {
  return {
    id: `el_${Math.random().toString(36).slice(2, 10)}`,
    type,
    x: props.x ?? 0,
    y: props.y ?? 0,
    width: props.width ?? 100,
    height: props.height ?? 50,
    angle: 0,
    strokeColor: props.strokeColor ?? palette.ink,
    backgroundColor: props.backgroundColor ?? "transparent",
    fillStyle: "solid",
    strokeWidth: 1,
    strokeStyle: props.strokeStyle ?? "solid",
    roughness: 1,
    opacity: 100,
    groupIds: [],
    roundness: { type: 3 },
    seed: Math.floor(Math.random() * 2 ** 31),
    version: 1,
    versionNonce: Math.floor(Math.random() * 2 ** 31),
    isDeleted: false,
    boundElements: null,
    updated: Date.now(),
    link: null,
    locked: false,
    ...(type === "text"
      ? {
          text: props.text ?? "",
          fontSize: props.fontSize ?? 18,
          fontFamily: 1,
          textAlign: "left",
          verticalAlign: "top",
          containerId: null,
          originalText: props.text ?? "",
          lineHeight: 1.25,
          baseline: props.fontSize ?? 18,
        }
      : {}),
    ...(type === "arrow" || type === "line"
      ? {
          points: props.points ?? [[0, 0], [100, 0]],
          lastCommittedPoint: null,
          startBinding: null,
          endBinding: null,
          startArrowhead: null,
          endArrowhead: "arrow",
        }
      : {}),
  };
}

const excalidrawElements = [];

for (const b of boxes) {
  excalidrawElements.push(
    excalidrawElement("rectangle", {
      x: b.x,
      y: b.y,
      width: b.w,
      height: b.h,
      strokeColor: b.stroke,
      backgroundColor: b.fill,
    })
  );
  excalidrawElements.push(
    excalidrawElement("text", {
      x: b.x + 14,
      y: b.y + 12,
      width: b.w - 28,
      height: 20,
      text: b.title,
      fontSize: 17,
      strokeColor: palette.ink,
    })
  );
  const bodyText = b.lines.join("\n");
  excalidrawElements.push(
    excalidrawElement("text", {
      x: b.x + 14,
      y: b.y + 50,
      width: b.w - 28,
      height: b.lines.length * 18,
      text: bodyText,
      fontSize: 16,
      strokeColor: palette.ink,
    })
  );
}

// Arrows
excalidrawElements.push(
  excalidrawElement("arrow", {
    x: 348, y: r1mid, width: 72, height: 0,
    points: [[0, 0], [72, 0]],
    strokeColor: palette.amberStroke,
  })
);
excalidrawElements.push(
  excalidrawElement("arrow", {
    x: 750, y: r1mid, width: 80, height: 0,
    points: [[0, 0], [80, 0]],
    strokeColor: palette.blueStroke,
  })
);
excalidrawElements.push(
  excalidrawElement("arrow", {
    x: 378, y: r2mid, width: 42, height: 0,
    points: [[0, 0], [42, 0]],
    strokeColor: palette.greenStroke,
  })
);
excalidrawElements.push(
  excalidrawElement("arrow", {
    x: 750, y: r2mid, width: 80, height: 0,
    points: [[0, 0], [80, 0]],
    strokeColor: palette.greenStroke,
  })
);
// Return arrow
excalidrawElements.push(
  excalidrawElement("arrow", {
    x: 100, y: retY, width: 1100, height: 0,
    points: [[1100, 0], [0, 0]],
    strokeColor: palette.muted,
    strokeStyle: "dashed",
  })
);

const excalidrawDoc = {
  type: "excalidraw",
  version: 2,
  source: "diagram-jev-turn-payloads.mjs",
  elements: excalidrawElements,
  appState: { gridSize: null, viewBackgroundColor: palette.paper },
  files: {},
};

// ─── Write files ────────────────────────────────────────────────────────────
const svgDir = join(root, "public", "images", "blog", "jev-browser-bridge");
const dlDir = join(root, "public", "downloads");
mkdirSync(svgDir, { recursive: true });
mkdirSync(dlDir, { recursive: true });

writeFileSync(join(svgDir, "jev-turn-payloads.svg"), svg, "utf8");
writeFileSync(
  join(dlDir, "jev-turn-payloads.excalidraw"),
  JSON.stringify(excalidrawDoc, null, 2),
  "utf8"
);

console.log("✓ public/images/blog/jev-browser-bridge/jev-turn-payloads.svg");
console.log("✓ public/downloads/jev-turn-payloads.excalidraw");
