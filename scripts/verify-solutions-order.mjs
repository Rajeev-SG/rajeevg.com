import fs from "node:fs"

const src = fs.readFileSync("src/lib/portfolio-projects.ts", "utf8")

const fail = (msg) => {
  console.error("FAIL:", msg)
  process.exitCode = 1
}

function blockSlugs(name) {
  const start = src.indexOf(`export const ${name}`)
  if (start === -1) {
    fail(`missing export ${name}`)
    return []
  }
  const nextExport = src.indexOf("export ", start + 1)
  const block = src.slice(start, nextExport === -1 ? src.length : nextExport)
  return [...block.matchAll(/slug: "([^"]+)"/g)].map((m) => m[1])
}

const current = blockSlugs("currentSolutions")
const earlier = blockSlugs("earlierPortfolioProjects")

const all = [...current, ...earlier]
const dupes = all.filter((slug, i) => all.indexOf(slug) !== i)
if (dupes.length > 0) fail(`duplicate slugs: ${[...new Set(dupes)].join(", ")}`)

const publicProjectOrder = [
  "agent-operations-control-plane",
  "coding-agent-observatory",
  "global-measurement-governance-system",
  "agent-routing-and-lifecycle-system",
  "media-qa-attribution-toolkit",
  "ai-assisted-product-definition-system",
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
