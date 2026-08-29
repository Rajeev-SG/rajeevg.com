import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const imageDir = path.join(root, "public/images/articles-2026-08")
const downloadDir = path.join(root, "public/downloads")
fs.mkdirSync(imageDir, { recursive: true })
fs.mkdirSync(downloadDir, { recursive: true })

const palette = {
  ink: "#172033", muted: "#566174", paper: "#fbfaf5", grid: "#e7e2d5",
  blue: "#dce8ff", blueStroke: "#4f6fad",
  green: "#dcf3e5", greenStroke: "#3f8460",
  amber: "#fff0c9", amberStroke: "#a97921",
  rose: "#ffe1de", roseStroke: "#a45350",
  purple: "#e9e1ff", purpleStroke: "#7459a8",
}

const N = (x, y, w, h, fill, label, lines) => ({ x, y, w, h, fill, label, lines })
const A = (from, to, label = "", dashed = false) => ({ from, to, label, dashed })

function openLayout(boxes) {
  const n = boxes.length
  const w = Math.min(330, Math.floor((1180 - (n - 1) * 48) / n))
  const gap = (1180 - n * w) / Math.max(1, n - 1)
  const y = 200, h = 200
  return boxes.map((b, i) => N(50 + i * (w + gap), y, w, h, b.fill ?? "blue", b.label, b.lines))
}

function seqLayout(steps) {
  const n = steps.length
  const w = Math.min(250, Math.floor((1180 - (n - 1) * 48) / n))
  const gap = (1180 - n * w) / Math.max(1, n - 1)
  const y = 200, h = 210
  return steps.map((s, i) => N(50 + i * (w + gap), y, w, h, s.fill ?? "purple", `${i + 1}. ${s.label}`, s.lines))
}

function baLayout(beforeLines, afterLines, whyLine) {
  return [
    N(60, 170, 480, 220, "rose", "Before", beforeLines),
    N(740, 170, 480, 220, "green", "After", afterLines),
    N(330, 450, 620, 130, "amber", "Why the change is defensible", [whyLine]),
  ]
}

function archLayout(boxes) {
  const n = boxes.length
  if (n <= 4) return openLayout(boxes)
  // two rows
  const w = 350, h = 175
  const row1 = boxes.slice(0, Math.ceil(n / 2))
  const row2 = boxes.slice(Math.ceil(n / 2))
  const gap1 = (1180 - row1.length * w) / Math.max(1, row1.length - 1)
  const gap2 = (1180 - row2.length * w) / Math.max(1, row2.length - 1)
  return [
    ...row1.map((b, i) => N(50 + i * (w + gap1), 150, w, h, b.fill ?? "blue", b.label, b.lines)),
    ...row2.map((b, i) => N(50 + i * (w + gap2), 400, w, h, b.fill ?? "blue", b.label, b.lines)),
  ]
}

function arrowsChain(layout) {
  const arrows = []
  for (let i = 0; i < layout.length - 1; i++) {
    const a = layout[i], b = layout[i + 1]
    if (a.y + a.h < b.y + 5 && Math.abs(a.x - b.x) < 10) {
      arrows.push(A([a.x + a.w / 2, a.y + a.h], [b.x + b.w / 2, b.y]))
    } else if (a.y === b.y) {
      arrows.push(A([a.x + a.w, a.y + a.h / 2], [b.x, b.y + b.h / 2]))
    } else if (a.y + a.h < b.y + 5) {
      arrows.push(A([a.x + a.w / 2, a.y + a.h], [b.x + b.w / 2, b.y]))
    }
  }
  // wrap: last of row1 to first of row2 handled by first branch when same x
  return arrows
}

const matrix = {
  "the-agent-telemetry-stack": {
    date: "2026-08-29",
    open: { title: "The telemetry map, simplified", subtitle: "Everything an agent does becomes a signal. Signals flow one way. One room shows the result.",
      boxes: [
        { label: "Agents and apps", lines: ["Codex · Claude Code · Hermes", "each emits traces, logs, metrics"] },
        { fill: "purple", label: "Collector", lines: ["receives and routes signals", "nothing talks straight to storage"] },
        { fill: "green", label: "One room", lines: ["Grafana for metrics", "Langfuse for traces and costs"] },
      ],
      footer: "Known: this is how the live stack flows today. Inferred: nothing enters storage without passing the collector." },
    arch: { title: "Full reference architecture", subtitle: "Where each piece actually lives, and what each storage layer is for.",
      boxes: [
        { label: "Sources", lines: ["Codex CLI · Claude Code", "Hermes · OMP · OpenClaw", "local gateways"] },
        { fill: "purple", label: "Collector", lines: ["OpenTelemetry Collector", "batch · retry · route"] },
        { fill: "green", label: "Prometheus", lines: ["metrics · counters", "dedup rules"] },
        { fill: "amber", label: "Langfuse", lines: ["traces · token costs", "runs on ClickHouse"] },
        { fill: "rose", label: "Session stores", lines: ["JSONL · SQLite originals", "kept as raw truth"] },
        { fill: "green", label: "Grafana rooms", lines: ["public summary", "private full detail"] },
      ],
      footer: "Postgres holds app state · Redis queues work · MinIO stores blobs · VictoriaMetrics keeps long-term private metrics" },
    seq: { title: "Where a single request's telemetry travels", subtitle: "Follow one token through the whole stack.",
      steps: [
        { label: "Send", lines: ["agent sends request", "via local gateway"] },
        { label: "Respond", lines: ["provider responds", "usage attached"] },
        { label: "Trace", lines: ["gateway writes trace", "to Langfuse"] },
        { label: "Sample", lines: ["collector samples", "metrics"] },
        { label: "Update", lines: ["Grafana room", "reflects it"] },
      ],
      footer: "Known: every hop measured. Inferred: trace ordering within one second." },
    fail: { title: "When telemetry quietly lies", subtitle: "The failure modes that make dashboards untrustworthy, and the checks that catch them.",
      before: { label: "Before: counters lie", lines: ["provider totals read as task totals", "unknowns presented as zero", "cost looks lower than truth"] },
      after: { label: "After: honest counters", lines: ["deduplicate by provider and session", "unknowns stay visibly unknown", "gaps shown, never hidden"] },
      why: "Known from the tokenmaxxing fix: cumulative provider counters were misread until deduplicated." },
  },
  "agent-ops-for-people": {
    date: "2026-08-29",
    open: { title: "The operations loop", subtitle: "What happens between 'something looks wrong' and 'it is fixed'.",
      boxes: [
        { label: "Agents run", lines: ["started by launchd", "healthy or failing"] },
        { fill: "purple", label: "Building manager", lines: ["checks readiness", "reports to the board"] },
        { fill: "amber", label: "Alarm", lines: ["Alertmanager decides", "route or stay quiet"] },
        { fill: "rose", label: "Runbook", lines: ["exact recovery steps", "no memory required"] },
      ],
      footer: "Known: this loop runs on this Mac today. Inferred: most alarms resolve inside the runbook, not by improvisation." },
    arch: { title: "The agent-ops stack", subtitle: "Each layer has one job, and each job has a named owner.",
      boxes: [
        { label: "Worker agents", lines: ["Codex · OpenCode", "Hermes · OMP"] },
        { fill: "purple", label: "launchd", lines: ["starts · restarts", "defines what 'running' means"] },
        { fill: "green", label: "Semaphore board", lines: ["state of every service", "one place to look"] },
        { fill: "amber", label: "Alertmanager", lines: ["alarms · routing", "silence when handled"] },
        { fill: "rose", label: "Runbooks", lines: ["SOPs per failure mode", "recovery paths documented"] },
      ],
      footer: "Grafana and Telegram complete the stack: dashboards for context, Telegram as the remote desk." },
    seq: { title: "From alarm to recovery, in order", subtitle: "A real sequence, not a story about what should happen.",
      steps: [
        { label: "Detect", lines: ["drift noticed by", "building manager"] },
        { label: "Alert", lines: ["Alertmanager →", "Telegram"] },
        { label: "Runbook", lines: ["the SOP for", "this failure"] },
        { label: "Fix", lines: ["restart or", "config change"] },
        { label: "Verify", lines: ["board shows", "healthy again"] },
      ],
      footer: "Known from the live alarm history on this rig." },
    fail: { title: "Runbook missing vs runbook present", subtitle: "The difference between an incident and a chore.",
      before: { label: "Before: no runbook", lines: ["alarm arrives, context is gone", "the person who built it is asleep", "recovery takes hours"] },
      after: { label: "After: runbook present", lines: ["alarm links to the exact SOP", "anyone on the desk can act", "recovery takes minutes"] },
      why: "The runbook is written while the failure is still understood." },
  },
  "your-mac-as-an-ai-operations-centre": {
    date: "2026-08-29",
    open: { title: "The Mac as an operations centre", subtitle: "One machine, four layers: processes, services, containers, and the outside world.",
      boxes: [
        { label: "Local processes", lines: ["ports · sockets", "each service one job"] },
        { fill: "purple", label: "Services", lines: ["launchd keeps them alive", "recovery is automatic"] },
        { fill: "amber", label: "Containers", lines: ["OrbStack", "isolated stacks"] },
        { fill: "green", label: "Private access", lines: ["Tailscale · SSH", "from phone or laptop"] },
      ],
      footer: "Known: this is the physical layout of the machine I work on. Inferred: nothing here needs a public port." },
    arch: { title: "What actually listens where", subtitle: "Ports, services, containers and their boundaries on one map.",
      boxes: [
        { label: "Loopback services", lines: ["127.0.0.1 only", "agents · collectors · boards"] },
        { fill: "purple", label: "OrbStack", lines: ["Coolify stack", "VictoriaMetrics · Grafana"] },
        { fill: "green", label: "Tailscale", lines: ["private mesh", "no open firewall ports"] },
        { fill: "amber", label: "Public edge", lines: ["Vercel serves the site", "nothing self-hosted exposed"] },
      ],
      footer: "Volumes persist container state · sleep pauses everything · exposure stays at zero by default" },
    seq: { title: "Phone to system, step by step", subtitle: "What happens when I check the rig from a phone.",
      steps: [
        { label: "Join", lines: ["open Tailscale", "device joins mesh"] },
        { label: "Board", lines: ["Semaphore over", "private IP"] },
        { label: "Read", lines: ["alarm or Grafana", "same mesh"] },
        { label: "SSH", lines: ["fix or restart", "remotely"] },
        { label: "Confirm", lines: ["board shows", "recovery"] },
      ],
      footer: "Known: this journey works from any device on the tailnet. No public ports involved." },
    fail: { title: "When the boundary is wrong", subtitle: "Exposure mistakes and what actually protects the machine.",
      before: { label: "Before: exposed", lines: ["dashboard on a public port", "credentials in a screenshot", "sleep as the only guard"] },
      after: { label: "After: bounded", lines: ["loopback + tailnet only", "secrets in env, not screenshots", "sleep as a bonus, not the plan"] },
      why: "The boundary is a design decision, not an accident of default settings. This rig keeps every listener on 127.0.0.1." },
  },
  "the-multi-agent-journey": {
    date: "2026-08-29",
    open: { title: "What survived contact with reality", subtitle: "Each phase was measured. The survivors are the simple parts.",
      boxes: [
        { label: "Native subagents", lines: ["parallel workers", "no shared memory"] },
        { fill: "purple", label: "Measurable", lines: ["traces per worker", "recoverable handoffs"] },
        { fill: "amber", label: "Codex + OpenCode", lines: ["planner and executor", "two models, one agent"] },
        { fill: "green", label: "Simplified now", lines: ["role-aware agents", "optional A2A discovery"] },
      ],
      footer: "Known: this is the measured chronology of this rig, not a forecast." },
    arch: { title: "The simplified system today", subtitle: "What the current architecture actually is, after everything that did not survive.",
      boxes: [
        { label: "Request", lines: ["from user or", "another agent"] },
        { fill: "purple", label: "Routing rule", lines: ["role-aware model choice", "hard? escalate"] },
        { fill: "green", label: "GLM-5.3-Flash", lines: ["default workhorse"] },
        { fill: "amber", label: "Frontier", lines: ["hard architecture only"] },
        { fill: "blue", label: "Telemetry side-channel", lines: ["Langfuse traces", "every call measurable"] },
      ],
      footer: "A2A remains a companion capability: discovery when agents need to find each other." },
    seq: { title: "The phases in order", subtitle: "What was tried, when, and what each phase produced.",
      steps: [
        { label: "Phase 1", lines: ["native subagents", "parallel, unmeasured"] },
        { label: "Phase 2", lines: ["measurable workers:", "traces, recovery"] },
        { label: "Phase 3", lines: ["Codex + OpenCode", "two-model split"] },
        { label: "Phase 4", lines: ["lifecycle experiments:", "Beads · BVR · NTM"] },
        { label: "Now", lines: ["simplified roles —", "telemetry showed", "the overhead"] },
      ],
      footer: "Known: 551 sessions, public token data, and one deleted middleman." },
    fail: { title: "The middleman tax", subtitle: "What four layers of orchestration actually cost, measured.",
      before: { label: "Before: four layers", lines: ["planning tokens", "review tokens", "polling waits", "more oversight than work"] },
      after: { label: "After: one agent", lines: ["same quality of output", "measured oversight drop", "no middleman to poll"] },
      why: "The same tasks ran through both paths with per-call traces attached. Known from the one-agent-two-models set." },
  },
  "why-agent-systems-become-slow-expensive-and-fragile": {
    date: "2026-08-29",
    open: { title: "Anatomy of a slow, expensive agent", subtitle: "Most of the cost never reaches the model. It accumulates around it.",
      boxes: [
        { label: "Every hop resends context", lines: ["instructions again", "history again", "paid again"] },
        { fill: "purple", label: "Oversight costs more than work", lines: ["planning tokens", "review tokens", "polling waits"] },
        { fill: "amber", label: "Failures are cumulative", lines: ["retries · inbox errors", "tool-output bloat", "stale duplicate workers"] },
      ],
      footer: "Known: measured across 551 sessions and two public dashboards." },
    arch: { title: "Where cost actually accumulates", subtitle: "The request path, annotated with what each layer adds.",
      boxes: [
        { label: "User request", lines: ["instructions", "attached"] },
        { fill: "purple", label: "Planner agent", lines: ["reads full context again", "plans in tokens"] },
        { fill: "green", label: "Worker agent", lines: ["receives its slice", "plus boilerplate"] },
        { fill: "amber", label: "Reviewer agent", lines: ["reads output", "plus original context"] },
        { fill: "rose", label: "Cumulative bill", lines: ["every layer paid", "for the same context"] },
      ],
      footer: "Each arrow is a context resend. This is why hops are expensive, not model choice alone." },
    seq: { title: "A request through the cost machine", subtitle: "Token cost by step, from request to done.",
      steps: [
        { label: "Parse", lines: ["request parsed", "context sent", "(cost 1)"] },
        { label: "Plan", lines: ["planning run", "context resent", "(cost 2)"] },
        { label: "Work", lines: ["work done", "slice resent", "(cost 3)"] },
        { label: "Review", lines: ["review run", "output + context", "(cost 4)"] },
        { label: "Total", lines: ["reported", "4× the actual", "work"] },
      ],
      footer: "Known: the multiplier is measured, not illustrative — per-call traces exist for this path." },
    fail: { title: "Unknown ≠ zero", subtitle: "The attribution failure that makes dashboards look cleaner than reality.",
      before: { label: "Before: gaps become zeros", lines: ["provider counter missing", "dashboards report 0", "cost looks lower than truth"] },
      after: { label: "After: gaps stay unknown", lines: ["missing data marked unknown", "totals exclude it honestly", "no false confidence"] },
      why: "The tokenmaxxing pipeline changed specifically so unknowns never render as zero." },
  },
  "ai-for-agency-operations": {
    date: "2026-08-29",
    open: { title: "Seven workflows that are already useful", subtitle: "Not pilots. Work that runs inside real agency operations.",
      boxes: [
        { label: "Taxonomy governance", lines: ["one event contract,", "many markets"] },
        { fill: "green", label: "Tag and pixel QA", lines: ["consent-aware,", "browser-real"] },
        { fill: "amber", label: "Attribution reconciliation", lines: ["platform story vs", "backend truth"] },
        { fill: "purple", label: "Scoping and assets", lines: ["messy context to PRD", "calls become artifacts"] },
      ],
      footer: "Known: all seven run in live agency contexts. Inferred: four more are in pilot." },
    arch: { title: "The governance stack behind the workflows", subtitle: "What makes the seven workflows repeatable rather than heroics.",
      boxes: [
        { label: "Contract layer", lines: ["events · properties", "owners per market"] },
        { fill: "purple", label: "QA layer", lines: ["browser-real checks", "consent-aware"] },
        { fill: "green", label: "Reconciliation layer", lines: ["GA4 · BigQuery · vendors", "differences explained"] },
        { fill: "amber", label: "Delivery layer", lines: ["rollout packs", "editable proof"] },
      ],
      footer: "Review gates sit between every layer. Nothing ships unreviewed." },
    seq: { title: "A tag rollout, end to end", subtitle: "From contract change to verified live deployment.",
      steps: [
        { label: "Contract", lines: ["taxonomy change", "approved"] },
        { label: "Pack", lines: ["rollout artifacts", "generated"] },
        { label: "Deploy", lines: ["GTM changes", "published"] },
        { label: "QA", lines: ["browser-real", "observed vs contract"] },
        { label: "Reconcile", lines: ["differences", "documented"] },
      ],
      footer: "Known: this sequence runs per market, per change." },
    fail: { title: "When platform and backend disagree", subtitle: "Attribution claims vs measured truth, before and after reconciliation.",
      before: { label: "Before: platform wins", lines: ["platform claims conversions", "backend shows fewer", "spend decided on the platform number"] },
      after: { label: "After: reconciled", lines: ["gap measured and explained", "deduplication applied", "decision on the reconciled number"] },
      why: "Both sources stay visible; neither is silently overwritten. Known from anonymised reconciliation work." },
  },
  "proof-not-prompts": {
    date: "2026-08-29",
    open: { title: "The proof loop", subtitle: "A claim is not a deliverable. Evidence with provenance is.",
      boxes: [
        { label: "Evidence captured", lines: ["real browser runs", "real data paths"] },
        { fill: "purple", label: "Provenance attached", lines: ["where it came from", "when it was true"] },
        { fill: "green", label: "Editable deliverable", lines: ["reviewer can change it", "still traces to source"] },
        { fill: "amber", label: "Review gate", lines: ["uncertainty stated", "nothing silent"] },
      ],
      footer: "Known: this loop is the working method for the analytics work described on this site." },
    arch: { title: "What a proof pack contains", subtitle: "The stack of artifacts that make a claim checkable.",
      boxes: [
        { label: "Raw evidence", lines: ["screenshots · traces", "network logs · exports"] },
        { fill: "purple", label: "Provenance layer", lines: ["source · timestamp", "who ran it"] },
        { fill: "green", label: "Editable deliverable", lines: ["client-facing document", "traces back to raw"] },
        { fill: "amber", label: "Uncertainty statement", lines: ["what is not proven", "what would change the answer"] },
      ],
      footer: "Reconciliation closes the loop when sources disagree." },
    seq: { title: "From claim to verified deliverable", subtitle: "The sequence a proof pack follows.",
      steps: [
        { label: "Claim", lines: ["made or", "requested"] },
        { label: "Evidence", lines: ["real browser or", "data path"] },
        { label: "Provenance", lines: ["source and time", "attached"] },
        { label: "Draft", lines: ["editable and", "traceable"] },
        { label: "Review", lines: ["gate: uncertainty", "stated"] },
      ],
      footer: "Known: this is the delivery sequence, not an aspiration." },
    fail: { title: "Prompt output vs proven deliverable", subtitle: "What happens when a claim ships without proof.",
      before: { label: "Before: prompt output", lines: ["a confident paragraph", "no traceable source", "the client cannot verify it"] },
      after: { label: "After: proven deliverable", lines: ["same confidence, but traced", "provenance attached", "reviewer can check it"] },
      why: "The difference is not the words — it is whether the claim can be checked." },
  },
  "what-should-be-an-agent": {
    date: "2026-08-29",
    open: { title: "Agent, or normal code?", subtitle: "Four questions decide it. Answer honestly and the choice is obvious.",
      boxes: [
        { label: "Is it ambiguous?", lines: ["does input vary in ways", "rules cannot enumerate?"] },
        { fill: "purple", label: "Does it repeat?", lines: ["same input, same output,", "every time?"] },
        { fill: "green", label: "What does failure cost?", lines: ["who notices, how fast,", "what breaks?"] },
        { fill: "amber", label: "Who must audit it?", lines: ["can the decision be traced", "after the fact?"] },
      ],
      footer: "Known: this is the working heuristic, not a formal theory." },
    arch: { title: "The decision tree, drawn out", subtitle: "How the four questions resolve into an implementation choice.",
      boxes: [
        { label: "Ambiguous input?", lines: ["no → normal code", "yes → keep asking"] },
        { fill: "purple", label: "Repeats identically?", lines: ["yes → normal code", "no → keep asking"] },
        { fill: "green", label: "Failure is cheap?", lines: ["yes → agent OK", "no → code with guardrails"] },
        { fill: "amber", label: "Audit required?", lines: ["yes → code or logged agent", "no → agent freely"] },
      ],
      footer: "The honest answer is usually code, with an agent at the edges." },
    seq: { title: "A decision in sequence", subtitle: "How the four questions are actually asked, in order, for one real task.",
      steps: [
        { label: "Task", lines: ["arrives; describe", "in one line"] },
        { label: "Ambiguous?", lines: ["does input vary", "unpredictably?"] },
        { label: "Repeats?", lines: ["is output the same", "each time?"] },
        { label: "Failure cost?", lines: ["what breaks if", "it is wrong?"] },
        { label: "Choose", lines: ["code, agent,", "or hybrid"] },
      ],
      footer: "Known: this sequence is how the rig's own automation decisions are made." },
    fail: { title: "Agent where code belongs", subtitle: "The before/after of putting an agent on a deterministic job.",
      before: { label: "Before: agent on a script's job", lines: ["nondeterministic output", "tokens spent on a fixed task", "harder to audit than the code it replaced"] },
      after: { label: "After: code where it belongs", lines: ["deterministic and fast", "auditable by anyone", "agent freed for real judgment"] },
      why: "The deterministic path was measured: same output, lower cost, no variance." },
  },
  "building-maintainable-knowledge-systems": {
    date: "2026-08-29",
    open: { title: "Messy material to governed knowledge", subtitle: "The pipeline is boring on purpose. That is why it holds up.",
      boxes: [
        { label: "Messy input", lines: ["files · email · decks", "sheets · meetings"] },
        { fill: "purple", label: "Extraction and structure", lines: ["entities · dates · owners", "provenance on every claim"] },
        { fill: "green", label: "Governed layer", lines: ["named owners", "review dates", "one canonical version"] },
      ],
      footer: "Known: this pipeline runs on real client material. Inferred: the boring structure is what makes it durable." },
    arch: { title: "The knowledge system stack", subtitle: "What holds the governed layer together.",
      boxes: [
        { label: "Source corpus", lines: ["raw files,", "unchanged"] },
        { fill: "purple", label: "Extraction pipeline", lines: ["entities · dates", "provenance per claim"] },
        { fill: "green", label: "Governed layer", lines: ["owners · review dates", "canonical versions"] },
        { fill: "amber", label: "Retrieval", lines: ["agents and people", "ask the layer, not the folder"] },
      ],
      footer: "Review dates are enforced. Stale entries are surfaced, not silently trusted." },
    seq: { title: "Material to decision, in order", subtitle: "The sequence from raw material to an answer someone can trust.",
      steps: [
        { label: "Arrives", lines: ["files · email", "decks · sheets"] },
        { label: "Extract", lines: ["entities · dates", "owners"] },
        { label: "Govern", lines: ["canonical version", "assigned"] },
        { label: "Retrieve", lines: ["agents query", "the layer"] },
        { label: "Decide", lines: ["traceable", "to source"] },
      ],
      footer: "Known: this sequence runs weekly on this rig." },
    fail: { title: "Ungoverned vs governed knowledge", subtitle: "The difference between a folder and a knowledge system.",
      before: { label: "Before: folder of files", lines: ["no owner per claim", "no review date", "contradictions invisible"] },
      after: { label: "After: governed layer", lines: ["owners and review dates", "contradictions surfaced", "answers traceable"] },
      why: "The governed layer catches what the folder silently hides." },
  },
  "agentic-web-analytics-implementation": {
    date: "2026-08-29",
    open: { title: "Agentic web analytics, end to end", subtitle: "Implementation, QA, reporting and reconciliation as one governed loop.",
      boxes: [
        { label: "Governed plan", lines: ["events · properties ·", "owners · consent first"] },
        { fill: "purple", label: "Agentic implementation", lines: ["GTM and GA4 configured", "against the plan, not vibes"] },
        { fill: "green", label: "Automated QA", lines: ["real browser journeys", "observed vs contract"] },
        { fill: "amber", label: "Report and reconcile", lines: ["GA4 · BigQuery · vendors", "differences explained"] },
      ],
      footer: "Known: human governance stays in the loop at every gate." },
    arch: { title: "The implementation stack", subtitle: "What sits between the plan and the report.",
      boxes: [
        { label: "Measurement contract", lines: ["events · properties", "· owners"] },
        { fill: "purple", label: "GTM workspace", lines: ["tags · triggers", "· variables · reviewed"] },
        { fill: "green", label: "GA4 property", lines: ["events stream in", "consent-aware"] },
        { fill: "amber", label: "QA harness", lines: ["browser-real checks", "observed vs contract"] },
        { fill: "blue", label: "Reporting layer", lines: ["GA4 · BigQuery", "reconciled before decisions"] },
      ],
      footer: "Consent mode gates every tag. The QA harness proves the gate works, not just that it is configured." },
    seq: { title: "Implementation to verified reporting", subtitle: "The sequence that ends with numbers someone can trust.",
      steps: [
        { label: "Plan", lines: ["contract", "signed off"] },
        { label: "Build", lines: ["tags against", "contract"] },
        { label: "QA", lines: ["observed events", "recorded"] },
        { label: "Compare", lines: ["observed vs", "contract; gaps noted"] },
        { label: "Report", lines: ["reconciled", "and trusted"] },
      ],
      footer: "Known: this replaces the older GA4 setup story with a repeatable method." },
    fail: { title: "Configured-but-broken vs verified", subtitle: "The gap between 'the tag exists' and 'the tag fires under consent'.",
      before: { label: "Before: configured only", lines: ["tag exists in GTM", "consent blocks it silently", "reports under-count with no signal"] },
      after: { label: "After: browser-verified", lines: ["QA fires the real journey", "consent path exercised", "configured-vs-firing gap measured"] },
      why: "The verification is a browser run, not a screenshot of the GTM workspace." },
  },
  "agentic-data-collection-and-warehousing": {
    date: "2026-08-29",
    open: { title: "Collection and warehousing, honestly", subtitle: "Server-side GTM and the warehouse are powerful. They are also optional.",
      boxes: [
        { label: "Consented collection", lines: ["browser events", "consent checked first"] },
        { fill: "purple", label: "Server-side GTM", lines: ["first-party endpoint", "control over what leaves"] },
        { fill: "green", label: "Warehouse", lines: ["BigQuery truth", "joins backend events"] },
        { fill: "amber", label: "Or… nothing heavier", lines: ["client-side + export", "answers many questions"] },
      ],
      footer: "Known: the heavy stack is sometimes the wrong answer. This article says when." },
    arch: { title: "The collection-to-warehouse stack", subtitle: "Where data physically flows, and what each stop costs.",
      boxes: [
        { label: "Browser", lines: ["consent-gated", "events"] },
        { fill: "purple", label: "sGTM endpoint", lines: ["first-party domain", "transforms and routes"] },
        { fill: "green", label: "Cloud Run", lines: ["runs the container", "the bill lands here"] },
        { fill: "amber", label: "BigQuery", lines: ["raw event store", "joins backend truth"] },
        { fill: "blue", label: "Reporting", lines: ["reconciled views", "decisions made here"] },
      ],
      footer: "Every extra hop is infrastructure to maintain. The article says when that is worth it." },
    seq: { title: "A consented event's full journey", subtitle: "From click to warehouse row.",
      steps: [
        { label: "Consent", lines: ["given or not —", "path branches"] },
        { label: "Fires", lines: ["client-side", "tag"] },
        { label: "sGTM", lines: ["receives on", "first-party endpoint"] },
        { label: "Transform", lines: ["routed to", "destinations"] },
        { label: "Warehouse", lines: ["BigQuery row,", "queryable"] },
      ],
      footer: "Known: this is the measured path from the consented-stack field notes." },
    fail: { title: "The heavy stack you did not need", subtitle: "Cost and complexity before and after choosing the right weight.",
      before: { label: "Before: heavy by default", lines: ["sGTM on Cloud Run", "two measurement stacks", "engineering owner required", "bill visible in GCP"] },
      after: { label: "After: right weight", lines: ["client-side + export", "one stack to maintain", "same decision quality here"] },
      why: "The cost autopsy measured what the heavy stack actually charged before removing it." },
  },
}

function esc(value) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
}

let elementCounter = 0
function baseElement(type, x, y, width, height, seed) {
  elementCounter += 1
  return {
    id: `art2-${elementCounter.toString(36)}-${seed}`,
    type, x, y, width, height, angle: 0,
    strokeColor: palette.ink, backgroundColor: "transparent",
    fillStyle: "solid", strokeWidth: 2, strokeStyle: "solid",
    roughness: 1, opacity: 100, groupIds: [], frameId: null,
    roundness: type === "rectangle" ? { type: 3 } : null,
    seed, version: 1, versionNonce: seed * 17, isDeleted: false,
    boundElements: [], updated: 1798700000000, link: null, locked: false,
  }
}

function textElement(text, x, y, size, color = palette.ink) {
  const width = Math.max(80, text.length * size * 0.58)
  const element = baseElement("text", x, y, width, size * 1.25, 1000 + elementCounter)
  return {
    ...element, strokeColor: color, strokeWidth: 1, roughness: 0,
    text, fontSize: size, fontFamily: 1, textAlign: "left", verticalAlign: "top",
    containerId: null, originalText: text, autoResize: true, lineHeight: 1.25, baseline: size,
  }
}

function svgFor(diagram, role) {
  const nodes = diagram.nodes
  const arrows = diagram.arrows
  const arrowSvg = arrows.map((arrow) => {
    const [x1, y1] = arrow.from
    const [x2, y2] = arrow.to
    const dash = arrow.dashed ? ' stroke-dasharray="10 9"' : ""
    const labelX = (x1 + x2) / 2
    const labelY = (y1 + y2) / 2 - 9
    return `<g><path d="M ${x1} ${y1} C ${(x1 + x2) / 2} ${y1}, ${(x1 + x2) / 2} ${y2}, ${x2} ${y2}" fill="none" stroke="${palette.ink}" stroke-width="2.5"${dash} marker-end="url(#arrowEnd)" class="rough"/>${arrow.label ? `<text x="${labelX}" y="${labelY}" text-anchor="middle" class="arrow-label">${esc(arrow.label)}</text>` : ""}</g>`
  }).join("\n")

  const nodeSvg = nodes.map((node) => {
    const fill = palette[node.fill] ?? palette.blue
    const stroke = palette[node.fill + "Stroke"] ?? palette.blueStroke
    const labelY = node.y + 40
    const lineStart = labelY + 34
    const lines = node.lines.map((line, i) => `<text x="${node.x + node.w / 2}" y="${lineStart + i * 24}" text-anchor="middle" class="body">${esc(line)}</text>`).join("\n")
    return `<g><rect x="${node.x}" y="${node.y}" width="${node.w}" height="${node.h}" rx="18" fill="${fill}" stroke="${stroke}" stroke-width="3" class="rough"/><rect x="${node.x + 5}" y="${node.y + 5}" width="${node.w - 10}" height="${node.h - 10}" rx="14" fill="none" stroke="${stroke}" stroke-opacity=".22" stroke-width="1.5"/><text x="${node.x + node.w / 2}" y="${labelY}" text-anchor="middle" class="node-title">${esc(node.label)}</text>${lines}</g>`
  }).join("\n")

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" role="img" aria-labelledby="title desc">
  <title id="title">${esc(diagram.title)}</title>
  <desc id="desc">${esc(diagram.subtitle)}</desc>
  <defs>
    <pattern id="dots" width="28" height="28" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.1" fill="${palette.grid}"/></pattern>
    <filter id="wobble" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="2" seed="11" result="noise"/><feDisplacementMap in="SourceGraphic" in2="noise" scale="0.85"/></filter>
    <marker id="arrowEnd" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto"><path d="M 0 0 L 9 5 L 0 10 z" fill="${palette.ink}"/></marker>
    <style>
      .rough { filter: url(#wobble); }
      .title { font: 700 34px Georgia, serif; fill: ${palette.ink}; }
      .subtitle { font: 18px Georgia, serif; fill: ${palette.muted}; }
      .node-title { font: 700 22px "Comic Sans MS", "Bradley Hand", cursive; fill: ${palette.ink}; }
      .body { font: 15px "Comic Sans MS", "Bradley Hand", cursive; fill: ${palette.ink}; }
      .arrow-label { font: 14px "Comic Sans MS", "Bradley Hand", cursive; fill: ${palette.muted}; paint-order: stroke; stroke: ${palette.paper}; stroke-width: 7px; }
      .footer { font: 15px Georgia, serif; font-style: italic; fill: ${palette.muted}; }
    </style>
  </defs>
  <rect width="1280" height="720" fill="${palette.paper}"/>
  <rect width="1280" height="720" fill="url(#dots)" opacity=".68"/>
  <path d="M 48 101 C 330 98, 580 105, 846 100 S 1125 103, 1230 99" fill="none" stroke="${palette.ink}" stroke-width="2" stroke-opacity=".18" class="rough"/>
  <text x="48" y="60" class="title">${esc(diagram.title)}</text>
  <text x="48" y="91" class="subtitle">${esc(diagram.subtitle)}</text>
  ${arrowSvg}
  ${nodeSvg}
  <path d="M 48 674 C 360 670, 620 678, 950 672 S 1160 675, 1230 671" fill="none" stroke="${palette.ink}" stroke-width="1.5" stroke-opacity=".18" class="rough"/>
  <text x="640" y="700" text-anchor="middle" class="footer">${esc(diagram.footer)}</text>
</svg>`.replace(/^[ \t]+$/gm, "")
}

function excalidrawFor(diagram) {
  elementCounter = 0
  const elements = [
    textElement(diagram.title, 48, 38, 30),
    textElement(diagram.subtitle, 48, 78, 17, palette.muted),
  ]
  for (const node of diagram.nodes) {
    elements.push({
      ...baseElement("rectangle", node.x, node.y, node.w, node.h, 2000 + elementCounter),
      strokeColor: palette[node.fill + "Stroke"] ?? palette.blueStroke,
      backgroundColor: palette[node.fill] ?? palette.blue,
      strokeWidth: 3,
    })
    elements.push(textElement(node.label, node.x + 22, node.y + 20, 21))
    node.lines.forEach((line, index) => elements.push(textElement(line, node.x + 22, node.y + 56 + index * 23, 14, palette.ink)))
  }
  for (const arrow of diagram.arrows) {
    const [x1, y1] = arrow.from
    const [x2, y2] = arrow.to
    const element = baseElement("arrow", x1, y1, Math.abs(x2 - x1), Math.abs(y2 - y1), 3000 + elementCounter)
    elements.push({
      ...element,
      strokeStyle: arrow.dashed ? "dashed" : "solid",
      points: [[0, 0], [x2 - x1, y2 - y1]],
      startBinding: null, endBinding: null, lastCommittedPoint: null,
      startArrowhead: null, endArrowhead: "arrow", elbowed: false,
    })
  }
  elements.push(textElement(diagram.footer, 48, 672, 14, palette.muted))
  return JSON.stringify({
    type: "excalidraw", version: 2, source: "https://excalidraw.com",
    elements, appState: { gridSize: null, viewBackgroundColor: palette.paper }, files: {},
  }, null, 2) + "\n"
}

let count = 0
for (const [slug, spec] of Object.entries(matrix)) {
  const roles = {}

  const openNodes = openLayout(spec.open.boxes)
  roles.open = { nodes: openNodes, arrows: arrowsChain(openNodes), title: spec.open.title, subtitle: spec.open.subtitle, footer: spec.open.footer }

  const archNodes = archLayout(spec.arch.boxes)
  const archArrows = []
  // chain within row 1, then vertical from last of row1 to first of row2, then chain row2
  const half = Math.ceil(spec.arch.boxes.length / 2)
  const row1 = archNodes.slice(0, half), row2 = archNodes.slice(half)
  for (let i = 0; i < row1.length - 1; i++) archArrows.push(A([row1[i].x + row1[i].w, row1[i].y + row1[i].h / 2], [row1[i + 1].x, row1[i].y + row1[i].h / 2]))
  if (row2.length) archArrows.push(A([row1[row1.length - 1].x + row1[row1.length - 1].w / 2, row1[row1.length - 1].y + row1[row1.length - 1].h], [row2[0].x + row2[0].w / 2, row2[0].y]))
  for (let i = 0; i < row2.length - 1; i++) archArrows.push(A([row2[i].x + row2[i].w, row2[i].y + row2[i].h / 2], [row2[i + 1].x, row2[i].y + row2[i].h / 2]))
  roles.arch = { nodes: archNodes, arrows: archArrows, title: spec.arch.title, subtitle: spec.arch.subtitle, footer: spec.arch.footer }

  const seqNodes = seqLayout(spec.seq.steps)
  roles.seq = { nodes: seqNodes, arrows: arrowsChain(seqNodes), title: spec.seq.title, subtitle: spec.seq.subtitle, footer: spec.seq.footer }

  const failNodes = baLayout(spec.fail.before.lines, spec.fail.after.lines, spec.fail.why)
  roles.fail = {
    nodes: failNodes,
    arrows: [
      A([failNodes[0].x + failNodes[0].w, failNodes[0].y + 110], [failNodes[1].x, failNodes[1].y + 110], "changed"),
      A([failNodes[1].x + failNodes[1].w / 2, failNodes[1].y + failNodes[1].h], [failNodes[2].x + failNodes[2].w / 2, failNodes[2].y]),
    ],
    title: spec.fail.title, subtitle: spec.fail.subtitle,
    footer: `${spec.fail.why}  ·  ${spec.fail.before.label} → ${spec.fail.after.label}`,
  }

  for (const [role, d] of Object.entries(roles)) {
    const diagram = { ...d, footer: `${d.footer}  ·  Evidence date: ${spec.date}` }
    fs.writeFileSync(path.join(imageDir, `${slug}-${role}.svg`), svgFor(diagram, role))
    fs.writeFileSync(path.join(downloadDir, `${slug}-${role}.excalidraw`), excalidrawFor(diagram))
    count += 1
  }
}

console.log(`Generated ${count} role-based diagrams (${Object.keys(matrix).length} articles × 4 roles) with editable Excalidraw sources.`)
