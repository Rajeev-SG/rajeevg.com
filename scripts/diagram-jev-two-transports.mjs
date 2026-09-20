import { writeFileSync, mkdirSync } from "fs";
import { dirname } from "path";

/* ── palette (house style) ─────────────────────────────────────────── */
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

/* ── helpers ───────────────────────────────────────────────────────── */
function esc(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/* ── SVG builder ───────────────────────────────────────────────────── */
function svgFor() {
  const W = 1280;
  const H = 720;

  // Box drawing helper
  function box(x, y, w, h, fill, stroke, rx = 8) {
    return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>`;
  }
  function txt(x, y, content, cls) {
    return `<text x="${x}" y="${y}" class="${cls}">${esc(content)}</text>`;
  }
  function arrow(x1, y1, x2, y2, color) {
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="1.5" marker-end="url(#arrowhead)"/>`;
  }

  const parts = [];

  parts.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">`);
  parts.push(`<title>JEV Two Transports</title>`);
  parts.push(`<desc>Diagram showing the same single hop implemented by two different stacks: Browser Relay and Playwriter.</desc>`);

  // Defs
  parts.push(`<defs>`);
  parts.push(`<pattern id="dotgrid" width="20" height="20" patternUnits="userSpaceOnUse">`);
  parts.push(`<circle cx="10" cy="10" r="0.7" fill="${palette.grid}"/>`);
  parts.push(`</pattern>`);
  parts.push(`<filter id="wobble">`);
  parts.push(`<feTurbulence type="turbulence" baseFrequency="0.015" numOctaves="2" result="turb" seed="3"/>`);
  parts.push(`<feDisplacementMap in="SourceGraphic" in2="turb" scale="1.5" xChannelSelector="R" yChannelSelector="G"/>`);
  parts.push(`</filter>`);
  parts.push(`<marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">`);
  parts.push(`<polygon points="0 0, 8 3, 0 6" fill="${palette.muted}"/>`);
  parts.push(`</marker>`);
  parts.push(`</defs>`);

  // Style
  parts.push(`<style>`);
  parts.push(`.title{font:700 28px/1 "Inter",system-ui,sans-serif;fill:${palette.ink}}`);
  parts.push(`.subtitle{font:400 18px/1 "Inter",system-ui,sans-serif;fill:${palette.muted}}`);
  parts.push(`.boxtitle{font:600 18px/1 "Inter",system-ui,sans-serif;fill:${palette.ink}}`);
  parts.push(`.boxbody{font:400 16px/1 "JetBrains Mono","Fira Code",monospace;fill:${palette.muted}}`);
  parts.push(`.stacklabel{font:700 17px/1 "Inter",system-ui,sans-serif;fill:${palette.muted};letter-spacing:0.5px;text-transform:uppercase}`);
  parts.push(`.annotation{font:400 14px/1 "Inter",system-ui,sans-serif;fill:${palette.ink}}`);
  parts.push(`.footer{font:400 14px/1 "Inter",system-ui,sans-serif;fill:${palette.muted}}`);
  parts.push(`</style>`);

  // Background
  parts.push(`<rect width="${W}" height="${H}" fill="${palette.paper}"/>`);
  parts.push(`<rect width="${W}" height="${H}" fill="url(#dotgrid)"/>`);

  // Header
  parts.push(txt(48, 60, "JEV Two Transports", "title"));
  parts.push(txt(48, 91, "Same single hop, two different stacks \u00b7 Browser Relay vs Playwriter", "subtitle"));
  parts.push(`<line x1="48" y1="101" x2="1232" y2="101" stroke="${palette.grid}" stroke-width="1"/>`);

  // ─── Top box (green, shared) ───
  const topX = 340, topY = 112, topW = 600, topH = 70;
  parts.push(`<g filter="url(#wobble)">`);
  parts.push(box(topX, topY, topW, topH, palette.green, palette.greenStroke));
  parts.push(`</g>`);
  parts.push(txt(topX + 15, topY + 28, "BridgeBrowser", "boxtitle"));
  parts.push(txt(topX + 15, topY + 50, "hands over a selector, one action at a time", "boxbody"));

  // ─── Left stack (blue): Browser Relay ───
  const lx = 80, lw = 430;
  parts.push(txt(lx, 204, "BROWSER RELAY", "stacklabel"));

  const leftBoxes = [
    { y: 214, h: 82, title: "browser-relay CLI", body: 'browser-relay click "<sel>" --tab t_X' },
    { y: 302, h: 82, title: "Local relay server", body: "http://127.0.0.1:18795" },
    { y: 390, h: 82, title: "Chrome extension (MV3)", body: "holds a WebSocket to the server" },
    { y: 478, h: 82, title: "chrome.debugger API", body: "attaches to the tab, dispatches input" },
  ];

  for (const b of leftBoxes) {
    parts.push(`<g filter="url(#wobble)">`);
    parts.push(box(lx, b.y, lw, b.h, palette.blue, palette.blueStroke));
    parts.push(`</g>`);
    parts.push(txt(lx + 14, b.y + 28, b.title, "boxtitle"));
    parts.push(txt(lx + 14, b.y + 52, b.body, "boxbody"));
  }

  // Arrows between left boxes
  for (let i = 0; i < leftBoxes.length - 1; i++) {
    const fromY = leftBoxes[i].y + leftBoxes[i].h;
    const toY = leftBoxes[i + 1].y;
    parts.push(arrow(lx + lw / 2, fromY, lx + lw / 2, toY, palette.blueStroke));
  }

  // ─── Right stack (green): Playwriter ───
  const rx = 700, rw = 430;
  parts.push(txt(rx, 204, "PLAYWRITER", "stacklabel"));

  const rightBoxes = [
    { y: 214, h: 82, title: "playwriter CLI", body: 'playwriter -s 3 -e "await page..."' },
    { y: 302, h: 82, title: "Persistent session", body: "keeps a live Page object" },
    { y: 390, h: 95, title: "Playwright API", body: "locator().click() / keyboard.press()", body2: "mouse.wheel()" },
  ];

  for (const b of rightBoxes) {
    parts.push(`<g filter="url(#wobble)">`);
    parts.push(box(rx, b.y, rw, b.h, palette.green, palette.greenStroke));
    parts.push(`</g>`);
    parts.push(txt(rx + 14, b.y + 28, b.title, "boxtitle"));
    parts.push(txt(rx + 14, b.y + 52, b.body, "boxbody"));
    if (b.body2) {
      parts.push(txt(rx + 14, b.y + 72, b.body2, "boxbody"));
    }
  }

  // Arrows between right boxes
  for (let i = 0; i < rightBoxes.length - 1; i++) {
    const fromY = rightBoxes[i].y + rightBoxes[i].h;
    const toY = rightBoxes[i + 1].y;
    parts.push(arrow(rx + rw / 2, fromY, rx + rw / 2, toY, palette.greenStroke));
  }

  // ─── Arrows from top box to stacks ───
  parts.push(arrow(topX + 100, topY + topH, lx + lw / 2, leftBoxes[0].y, palette.muted));
  parts.push(arrow(topX + topW - 100, topY + topH, rx + rw / 2, rightBoxes[0].y, palette.muted));

  // ─── Amber annotation ───
  const amX = 700, amY = 500, amW = 490, amH = 68;
  parts.push(`<g filter="url(#wobble)">`);
  parts.push(box(amX, amY, amW, amH, palette.amber, palette.amberStroke, 6));
  parts.push(`</g>`);
  parts.push(txt(amX + 12, amY + 20, "Spawn per action: ~42 ms (relay), ~109 ms (playwriter).", "annotation"));
  parts.push(txt(amX + 12, amY + 38, "Same task, 5 runs each: 13.1 s versus 16.1 s median.", "annotation"));

  // ─── Bottom box (purple, shared) ───
  const botX = 340, botY = 586, botW = 600, botH = 70;
  parts.push(`<g filter="url(#wobble)">`);
  parts.push(box(botX, botY, botW, botH, palette.purple, palette.purpleStroke));
  parts.push(`</g>`);
  parts.push(txt(botX + 15, botY + 28, "Your Chrome tab", "boxtitle"));
  parts.push(txt(botX + 15, botY + 50, "the profile you are already logged into", "boxbody"));

  // ─── Arrows from stacks to bottom box ───
  const leftLast = leftBoxes[leftBoxes.length - 1];
  const rightLast = rightBoxes[rightBoxes.length - 1];
  parts.push(arrow(lx + lw / 2, leftLast.y + leftLast.h, botX + 120, botY, palette.muted));
  parts.push(arrow(rx + rw / 2, rightLast.y + rightLast.h, botX + botW - 120, botY, palette.muted));

  // ─── Footer ───
  parts.push(`<line x1="48" y1="674" x2="1232" y2="674" stroke="${palette.grid}" stroke-width="1"/>`);
  parts.push(`<text x="640" y="700" text-anchor="middle" class="footer">jev-browser-bridge \u00b7 two transports, one hop</text>`);

  parts.push(`</svg>`);
  return parts.join("\n");
}

/* ── Excalidraw builder ────────────────────────────────────────────── */
function buildExcalidraw() {
  let idCounter = 0;
  function nextId() {
    return `el_${(++idCounter).toString(36).padStart(6, "0")}`;
  }

  const elements = [];

  function addRect(x, y, w, h, bg, stroke) {
    elements.push({
      id: nextId(),
      type: "rectangle",
      x, y, width: w, height: h,
      angle: 0,
      strokeColor: stroke,
      backgroundColor: bg,
      fillStyle: "solid",
      strokeWidth: 1.5,
      strokeStyle: "solid",
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
    });
  }

  function addText(x, y, text, fontSize = 14) {
    elements.push({
      id: nextId(),
      type: "text",
      x, y,
      width: text.length * fontSize * 0.6,
      height: fontSize * 1.35,
      angle: 0,
      strokeColor: palette.ink,
      backgroundColor: "transparent",
      fillStyle: "solid",
      strokeWidth: 1,
      strokeStyle: "solid",
      roughness: 1,
      opacity: 100,
      groupIds: [],
      roundness: null,
      seed: Math.floor(Math.random() * 2 ** 31),
      version: 1,
      versionNonce: Math.floor(Math.random() * 2 ** 31),
      isDeleted: false,
      boundElements: null,
      updated: Date.now(),
      link: null,
      locked: false,
      text,
      fontSize,
      fontFamily: 1,
      textAlign: "left",
      verticalAlign: "top",
      containerId: null,
      originalText: text,
      lineHeight: 1.35,
      baseline: fontSize,
    });
  }

  function addArrow(x1, y1, x2, y2, color) {
    elements.push({
      id: nextId(),
      type: "arrow",
      x: x1, y: y1,
      width: x2 - x1, height: y2 - y1,
      angle: 0,
      strokeColor: color,
      backgroundColor: "transparent",
      fillStyle: "solid",
      strokeWidth: 1.5,
      strokeStyle: "solid",
      roughness: 1,
      opacity: 100,
      groupIds: [],
      roundness: { type: 2 },
      seed: Math.floor(Math.random() * 2 ** 31),
      version: 1,
      versionNonce: Math.floor(Math.random() * 2 ** 31),
      isDeleted: false,
      boundElements: null,
      updated: Date.now(),
      link: null,
      locked: false,
      points: [[0, 0], [x2 - x1, y2 - y1]],
      lastCommittedPoint: null,
      startBinding: null,
      endBinding: null,
      startArrowhead: null,
      endArrowhead: "arrow",
    });
  }

  // Top box
  addRect(340, 112, 600, 70, palette.green, palette.greenStroke);
  addText(355, 126, "BridgeBrowser", 14);
  addText(355, 148, "hands over a selector, one action at a time", 12);

  // Left stack
  const leftBoxes = [
    { y: 214, h: 82, title: "browser-relay CLI", body: 'browser-relay click "<sel>" --tab t_X' },
    { y: 302, h: 82, title: "Local relay server", body: "http://127.0.0.1:18795" },
    { y: 390, h: 82, title: "Chrome extension (MV3)", body: "holds a WebSocket to the server" },
    { y: 478, h: 82, title: "chrome.debugger API", body: "attaches to the tab, dispatches input" },
  ];
  for (const b of leftBoxes) {
    addRect(80, b.y, 430, b.h, palette.blue, palette.blueStroke);
    addText(94, b.y + 12, b.title, 14);
    addText(94, b.y + 36, b.body, 12);
  }
  for (let i = 0; i < leftBoxes.length - 1; i++) {
    addArrow(295, leftBoxes[i].y + leftBoxes[i].h, 295, leftBoxes[i + 1].y, palette.blueStroke);
  }

  // Right stack
  const rightBoxes = [
    { y: 214, h: 82, title: "playwriter CLI", body: 'playwriter -s 3 -e "await page..."' },
    { y: 302, h: 82, title: "Persistent session", body: "keeps a live Page object" },
    { y: 390, h: 95, title: "Playwright API", body: "locator().click() / keyboard.press()\nmouse.wheel()" },
  ];
  for (const b of rightBoxes) {
    addRect(700, b.y, 430, b.h, palette.green, palette.greenStroke);
    addText(714, b.y + 12, b.title, 14);
    addText(714, b.y + 36, b.body, 12);
  }
  for (let i = 0; i < rightBoxes.length - 1; i++) {
    addArrow(915, rightBoxes[i].y + rightBoxes[i].h, 915, rightBoxes[i + 1].y, palette.greenStroke);
  }

  // Arrows from top
  addArrow(440, 182, 295, 214, palette.muted);
  addArrow(840, 182, 915, 214, palette.muted);

  // Amber annotation
  addRect(700, 500, 490, 68, palette.amber, palette.amberStroke);
  addText(712, 510, "Spawn per action: ~42 ms (relay), ~109 ms (playwriter).", 11);
  addText(712, 530, "Same task, 5 runs each: 13.1 s versus 16.1 s median.", 11);

  // Bottom box
  addRect(340, 586, 600, 70, palette.purple, palette.purpleStroke);
  addText(355, 600, "Your Chrome tab", 14);
  addText(355, 622, "the profile you are already logged into", 12);

  // Arrows to bottom
  addArrow(295, 560, 460, 586, palette.muted);
  addArrow(915, 485, 820, 586, palette.muted);

  return {
    type: "excalidraw",
    version: 2,
    source: "diagram-jev-two-transports.mjs",
    elements,
    appState: {
      gridSize: null,
      viewBackgroundColor: palette.paper,
    },
    files: {},
  };
}

/* ── write outputs ─────────────────────────────────────────────────── */
const svgPath = "public/images/blog/jev-browser-bridge/jev-two-transports.svg";
const exPath = "public/downloads/jev-two-transports.excalidraw";

mkdirSync(dirname(svgPath), { recursive: true });
mkdirSync(dirname(exPath), { recursive: true });

writeFileSync(svgPath, svgFor(), "utf-8");
writeFileSync(exPath, JSON.stringify(buildExcalidraw(), null, 2), "utf-8");

console.log(`wrote ${svgPath}`);
console.log(`wrote ${exPath}`);
