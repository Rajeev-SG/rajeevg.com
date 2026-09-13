// Leaderboard data for the web-automation microbench.
// Source of truth: https://github.com/Rajeev-SG/web-automation-microbench (README master + capability tables).
// Transcribed by hand from the repo README; the repo is authoritative if the two ever disagree.

export type LatencyRow = {
  harness: string
  repo: string
  url: string
  round: number
  pass: string
  median: string
  tokens: string
  cost: string
  note?: string
}

export type CapabilityRow = {
  harness: string
  repo: string
  url: string
  fastPath: string
  capability: string
  reps: string
  note?: string
}

export type CorpusTask = {
  task: string
  capability: string
  passes: string
}

export const microbench = {
  repoUrl: "https://github.com/Rajeev-SG/web-automation-microbench",
  model: "z-ai/glm-5.3-flash",
  evidenceDate: "2026-09-13",
  updated: "2026-09-13",
  harnesses: 34,
  runs: 110,
} as const

/** TodoMVC fast-path leaderboard — speed and cost on one controlled instrument. Sorted by median time. */
export const latencyRows: LatencyRow[] = [
  { harness: "BrowserSkill", repo: "Tencent/BrowserSkill", url: "https://github.com/Tencent/BrowserSkill", round: 3, pass: "2/2", median: "4.1s", tokens: "~6.2k / ~97", cost: "~$0.0005" },
  { harness: "browser-relay", repo: "reliefeai/browser-relay", url: "https://github.com/reliefeai/browser-relay", round: 3, pass: "2/2", median: "4.3s", tokens: "~5.9k / ~95", cost: "~$0.0005" },
  { harness: "browser-control", repo: "keon/browser-control", url: "https://github.com/keon/browser-control", round: 3, pass: "1/2", median: "5.5s", tokens: "~13.2k / ~180", cost: "~$0.0007" },
  { harness: "browser-cli", repo: "six-ddc/browser-cli", url: "https://github.com/six-ddc/browser-cli", round: 3, pass: "2/2", median: "6.2s", tokens: "~8.6k / ~128", cost: "~$0.0007" },
  { harness: "pinchtab", repo: "pinchtab/pinchtab", url: "https://github.com/pinchtab/pinchtab", round: 3, pass: "2/2", median: "8.3s", tokens: "~5.1k / ~200", cost: "~$0.0003" },
  { harness: "browser-use", repo: "browser-use/browser-use", url: "https://github.com/browser-use/browser-use", round: 1, pass: "2/2", median: "8.7s", tokens: "n/a", cost: "n/a", note: "Round 1 timing-only (tokens not recorded)" },
  { harness: "Browser Harness", repo: "browser-use/browser-harness", url: "https://github.com/browser-use/browser-harness", round: 2, pass: "2/2", median: "9.9s", tokens: "~6.2k / ~190", cost: "~$0.0005" },
  { harness: "agent-browser", repo: "vercel-labs/agent-browser", url: "https://github.com/vercel-labs/agent-browser", round: 3, pass: "2/2", median: "10.1s", tokens: "~20.8k / ~120", cost: "~$0.0010" },
  { harness: "Playwriter", repo: "remorses/playwriter", url: "https://github.com/remorses/playwriter", round: 1, pass: "2/2", median: "10.1s", tokens: "n/a", cost: "n/a", note: "Round 1 timing-only (tokens not recorded)" },
  { harness: "cdp-browser", repo: "sids/cdp-browser", url: "https://github.com/sids/cdp-browser", round: 3, pass: "2/2", median: "10.7s", tokens: "~6.3k / ~250", cost: "~$0.0003" },
  { harness: "jarvis-browser", repo: "bridge25/jarvis-browser", url: "https://github.com/bridge25/jarvis-browser", round: 3, pass: "2/2", median: "11.2s", tokens: "~8.5k / ~100", cost: "~$0.0005" },
  { harness: "chrome-cdp-skill", repo: "pasky/chrome-cdp-skill", url: "https://github.com/pasky/chrome-cdp-skill", round: 6, pass: "3/5", median: "11.5s", tokens: "~21.1k / ~323", cost: "~$0.0083", note: "Fastest new arrival, least reliable once promoted to 5 reps" },
  { harness: "chrome-devtools-mcp", repo: "ChromeDevTools/chrome-devtools-mcp", url: "https://github.com/ChromeDevTools/chrome-devtools-mcp", round: 6, pass: "5/5", median: "11.8s", tokens: "~12.6k / ~89", cost: "~$0.0048", note: "Strongest Round 6 row once reliability is counted" },
  { harness: "Stagehand v4", repo: "browserbase/stagehand", url: "https://github.com/browserbase/stagehand", round: 2, pass: "1/4", median: "13.1s", tokens: "~6.6k / 300–3,400", cost: "~$0.0007" },
  { harness: "ego-browser", repo: "citrolabs/ego-lite", url: "https://github.com/citrolabs/ego-lite", round: 6, pass: "5/5", median: "14.2s", tokens: "~12.3k / ~99", cost: "~$0.0048" },
  { harness: "webctl", repo: "cosinusalpha/webctl", url: "https://github.com/cosinusalpha/webctl", round: 3, pass: "2/2", median: "14.5s", tokens: "~8.2k / ~100", cost: "~$0.0006" },
  { harness: "playwright-cli", repo: "microsoft/playwright-cli", url: "https://github.com/microsoft/playwright-cli", round: 6, pass: "5/5", median: "14.7s", tokens: "~21.7k / ~113", cost: "~$0.0083" },
  { harness: "agent-chrome-cli", repo: "gxbvc/agent-chrome-cli", url: "https://github.com/gxbvc/agent-chrome-cli", round: 3, pass: "2/2", median: "17.4s", tokens: "~7.6k / ~180", cost: "~$0.0004" },
  { harness: "browser-act-skills", repo: "browser-act/skills", url: "https://github.com/browser-act/skills", round: 6, pass: "2/2", median: "18.5s", tokens: "~6.0k / ~76", cost: "~$0.0009" },
  { harness: "lightpanda", repo: "lightpanda-io/browser", url: "https://github.com/lightpanda-io/browser", round: 3, pass: "2/2", median: "22.7s", tokens: "~7.1k / ~590", cost: "~$0.0006" },
  { harness: "page-agent (patched: send_keys)", repo: "alibaba/page-agent", url: "https://github.com/alibaba/page-agent", round: 5, pass: "2/2", median: "25.3s", tokens: "n/a", cost: "n/a", note: "Patched build; stock ships no key-press action and scores 0/2" },
  { harness: "hyperagent (perform)", repo: "hyperbrowserai/HyperAgent", url: "https://github.com/hyperbrowserai/HyperAgent", round: 6, pass: "3/4", median: "28.3s", tokens: "~20.8k / ~3.4k", cost: "~$0.0096" },
  { harness: "opencli", repo: "jackwener/OpenCLI", url: "https://github.com/jackwener/OpenCLI", round: 6, pass: "0/2", median: "30.4s", tokens: "~20.8k / ~234", cost: "~$0.0032", note: "Scored failure: key event carries no keyCode, so React never commits the todo" },
  { harness: "surf-cli", repo: "nicobailon/surf-cli", url: "https://github.com/nicobailon/surf-cli", round: 6, pass: "2/2", median: "31.8s", tokens: "~28.6k / ~519", cost: "~$0.0046" },
  { harness: "browser-agent", repo: "visnia-ai/browser-agent", url: "https://github.com/visnia-ai/browser-agent", round: 4, pass: "2/2", median: "32.5s", tokens: "~43.1k / ~1,360", cost: "~$0.0036" },
  { harness: "bb-browser", repo: "epiral/bb-browser", url: "https://github.com/epiral/bb-browser", round: 6, pass: "0/2", median: "32.7s", tokens: "~12.6k / ~380", cost: "~$0.0021", note: "Scored failure: native key event carries no keyCode" },
  { harness: "midscene", repo: "web-infra-dev/midscene", url: "https://github.com/web-infra-dev/midscene", round: 6, pass: "2/2", median: "33.4s", tokens: "~444k / ~62k", cost: "~$0.074", note: "Vision-first; belongs to the capability suite, not the speed ranking" },
  { harness: "raw-playwright baseline", repo: "microsoft/playwright", url: "https://github.com/microsoft/playwright", round: 3, pass: "3/4", median: "42.7s", tokens: "~18.1k / ~410", cost: "~$0.0010" },
  { harness: "Magnitude", repo: "magnitudedev/magnitude", url: "https://github.com/magnitudedev/magnitude", round: 2, pass: "4/4", median: "52.6s", tokens: "~18.3k / ~2.9k", cost: "~$0.0021", note: "Vision-first: most reliable on messy JS sites, slower and pricier" },
  { harness: "Browser Use Pi", repo: "browser-use/browser-use-pi", url: "https://github.com/browser-use/browser-use-pi", round: 7, pass: "7/10", median: "53.5s", tokens: "~6.6k / ~0.7k", cost: "~$0.0010", note: "Own loop: Pi Mono agent + persistent V8 REPL + raw CDP. Three failures are false successes caught by the verifier" },
  { harness: "BrowserCode", repo: "uuuuytgg/browser-code", url: "https://github.com/uuuuytgg/browser-code", round: 2, pass: "2/2", median: "153.0s", tokens: "~55.6k / ~3.0k", cost: "~$0.026", note: "Own heavyweight agent loop; 10–100x more wall-clock for no accuracy gain" },
  { harness: "notte", repo: "nottelabs/notte", url: "https://github.com/nottelabs/notte", round: 3, pass: "2/2", median: "171.8s", tokens: "n/a", cost: "n/a" },
  { harness: "skyvern", repo: "Skyvern-AI/skyvern", url: "https://github.com/Skyvern-AI/skyvern", round: 6, pass: "2/2", median: "186.5s", tokens: "~29.0k / ~4.2k", cost: "~$0.0055", note: "Autonomous multi-agent; capability suite" },
  { harness: "browser-agent (Taylor-Bayouth)", repo: "Taylor-Bayouth/browser-agent", url: "https://github.com/Taylor-Bayouth/browser-agent", round: 5, pass: "1/2", median: "200.1s", tokens: "~19k–782k / ~0.5k–25k", cost: "n/a", note: "Unrelated project that shares the visnia-ai name" },
]

/** Real-work capability leaderboard — 11 harvested browser tasks, 6 harness architectures, 110 runs. */
export const capabilityRows: CapabilityRow[] = [
  { harness: "browser-relay", repo: "reliefeai/browser-relay", url: "https://github.com/reliefeai/browser-relay", fastPath: "2/2 · 4.3s", capability: "22/33", reps: "1, 2, 3", note: "Strongest on real work; promoted past screening" },
  { harness: "raw-playwright baseline", repo: "microsoft/playwright", url: "https://github.com/microsoft/playwright", fastPath: "3/4 · 42.7s", capability: "17/33", reps: "1, 2, 3", note: "Promoted past screening" },
  { harness: "agent-browser", repo: "vercel-labs/agent-browser", url: "https://github.com/vercel-labs/agent-browser", fastPath: "2/2 · 10.1s", capability: "6/11", reps: "1" },
  { harness: "cdp-browser", repo: "sids/cdp-browser", url: "https://github.com/sids/cdp-browser", fastPath: "2/2 · 10.7s", capability: "6/11", reps: "1" },
  { harness: "Browser Use Pi", repo: "browser-use/browser-use-pi", url: "https://github.com/browser-use/browser-use-pi", fastPath: "7/10 · 53.5s", capability: "4/11", reps: "1", note: "Own-loop. The only harness in the set to pass chanel-gb-pdp-tag-inspection — the anti-bot boundary" },
  { harness: "BrowserSkill", repo: "Tencent/BrowserSkill", url: "https://github.com/Tencent/BrowserSkill", fastPath: "2/2 · 4.1s", capability: "2/11", reps: "1", note: "Fastest fast-path, weakest real work — the orderings invert" },
]

/** Per-task pass counts across all harnesses on the harvested corpus. */
export const corpusTasks: CorpusTask[] = [
  { task: "allbirds-uk-add-to-cart-tag-check", capability: "consent → add to cart → tags", passes: "0/10" },
  { task: "gymshark-uk-add-to-cart-tag-check", capability: "consent → add to cart → tags", passes: "1/10" },
  { task: "puma-uk-seo-metadata-audit", capability: "SEO / structured data", passes: "1/10" },
  { task: "tldraw-three-shape-diagram", capability: "canvas UI creation", passes: "2/10" },
  { task: "chanel-gb-pdp-tag-inspection", capability: "tag inspection (anti-bot boundary)", passes: "3/10" },
  { task: "rajeevg-crawlability-audit", capability: "robots.txt + sitemap", passes: "8/10" },
  { task: "porsche-uk-script-inventory", capability: "third-party script inventory", passes: "8/10" },
  { task: "puma-uk-script-inventory", capability: "third-party script inventory", passes: "8/10" },
  { task: "puma-uk-tag-inspection", capability: "tag inspection", passes: "8/10" },
  { task: "porsche-uk-tag-inspection", capability: "tag inspection", passes: "9/10" },
  { task: "rajeevg-seo-metadata-audit", capability: "SEO / structured data", passes: "9/10" },
]
