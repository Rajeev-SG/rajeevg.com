import fs from "node:fs"
const src = fs.readFileSync("src/lib/portfolio-projects.ts", "utf8")
const entries = [...src.matchAll(/slug: "([^"]+)"[\s\S]*?lastUpdated: "([^"]+)"/g)]
  .map(m => ({ slug: m[1], lastUpdated: m[2] }))
const order = entries.filter(e => e.lastUpdated)
let prev = null, ok = true
for (const e of order) {
  const d = new Date(e.lastUpdated).getTime()
  if (prev !== null && d > prev) { ok = false; console.error("OUT OF ORDER after previous:", e) }
  prev = d
}
console.log(JSON.stringify({ count: order.length, strictlyDescending: ok, order: order.map(e => `${e.slug}:${e.lastUpdated}`) }, null, 2))
