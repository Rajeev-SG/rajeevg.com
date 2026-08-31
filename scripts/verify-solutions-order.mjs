import fs from "node:fs"

const src = fs.readFileSync("src/lib/portfolio-projects.ts", "utf8")

const fail = (msg) => {
  console.error("FAIL:", msg)
  process.exitCode = 1
}

function blockEntries(name) {
  const start = src.indexOf(`export const ${name}`)
  if (start === -1) {
    fail(`missing export ${name}`)
    return []
  }
  const nextExport = src.indexOf("export ", start + 1)
  const block = src.slice(start, nextExport === -1 ? src.length : nextExport)
  return [...block.matchAll(/slug: "([^"]+)"[\s\S]*?lastUpdated: "([^"]+)"/g)]
    .map((m) => ({ slug: m[1], lastUpdated: m[2] }))
}

const currentEntries = blockEntries("currentSolutions")
const earlierEntries = blockEntries("earlierPortfolioProjects")
const current = currentEntries.map((e) => e.slug)
const earlier = earlierEntries.map((e) => e.slug)

const all = [...current, ...earlier]
const dupes = all.filter((slug, i) => all.indexOf(slug) !== i)
if (dupes.length > 0) fail(`duplicate slugs: ${[...new Set(dupes)].join(", ")}`)

const publicProjectOrder = [
  "agent-operations-control-plane",
  "agent-routing-and-lifecycle-system",
  "global-measurement-governance-system",
  "media-qa-attribution-toolkit",
  "ai-assisted-product-definition-system",
  "coding-agent-observatory",
  "model-routing-performance-lab",
  "local-llm-lab",
  "open-gtm-index",
  "model-intelligence-maintainer",
  "creative-observatory",
  "hackathon-voting-app",
  "agent-orchestra",
]

const expectedEarlier = [
  "workflow-garden",
  "github-canvas-monitor",
  "proof-pack",
  "choice-compass",
  "mark-notes",
  "singulyr-pact",
  "openreview",
  "singulyr",
  "rajeevg-com",
]

if (current.length !== 13) fail(`expected 13 current solutions, found ${current.length}`)
if (earlier.length !== 9) fail(`expected 9 earlier products, found ${earlier.length}`)
if (all.length !== 22) fail(`expected 22 total projects, found ${all.length}`)

if (current.join(",") !== publicProjectOrder.join(","))
  fail(`currentSolutions order does not match publicProjectOrder:\n  got:      ${current.join(", ")}\n  expected: ${publicProjectOrder.join(", ")}`)

if (earlier.join(",") !== expectedEarlier.join(","))
  fail(`earlierPortfolioProjects slugs mismatch:\n  got:      ${earlier.join(", ")}\n  expected: ${expectedEarlier.join(", ")}`)

let prevDate = null
for (const e of currentEntries) {
  const d = new Date(e.lastUpdated).getTime()
  if (Number.isNaN(d)) fail(`invalid lastUpdated for ${e.slug}: ${e.lastUpdated}`)
  if (prevDate !== null && d > prevDate) fail(`recency order violated: ${e.slug} (${e.lastUpdated}) is newer than the previous entry`)
  prevDate = d
}

for (const m of src.matchAll(/liveUrl: "([^"]+)"[\s\S]*?detailLinks: \[([\s\S]*?)\]\s*,?\n\s*\}/g)) {
  const [, liveUrl, links] = m
  if (links.includes(`href: "${liveUrl}"`))
    fail(`detailLinks duplicates liveUrl ${liveUrl}`)
}

const counts = { current: current.length, earlier: earlier.length, total: all.length, duplicateSlugs: dupes }
if (process.exitCode === 1) {
  console.error(JSON.stringify(counts))
  process.exit(1)
}
console.log(JSON.stringify({ ok: true, ...counts }, null, 2))
