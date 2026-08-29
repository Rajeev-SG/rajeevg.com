You are performing a narrative-only review of eleven flagship articles from rajeevg.com, repositioning the author as an authoritative practitioner in AI/agent systems, martech/measurement, and media-agency operations.

Read the corpus below. Do NOT read, edit, or create any files. Respond inline only.

Provide:
1. Up to three high-impact findings PER ARTICLE (positioning coherence, duplication, audience clarity, credibility, unsupported claims, transitions, marketer relevance).
2. A site-wide synthesis: whether authority comes through without hype, and the top cross-cutting issue.
3. Nothing else: no code, no rewrites, no file output.

Corpus:
# Narrative review corpus — rajeevg.com flagship articles (2026-08)

## the-agent-telemetry-stack
Title: The agent telemetry stack, explained from first principles
Description: A plain-English tour of the modern telemetry stack that measures AI agents: what each piece is, why it exists, and how one Mac's signals become a trustworthy dashboard.
When I first tried to answer "what did my agents actually do today?", the honest answer was: several different logs, three dashboards, and a spreadsheet nobody trusted. The tools existed. The problem was that nobody had explained how they were supposed to fit together.

This article is the explanation I wish I had read first. It walks the whole stack in order — from raw signals leaving an agent, through the collector, into storage, and out onto a dashboard — and says what each piece is actually for.



## Why you should care, even if you run nothing

If you use AI tools at work, someone — you, a vendor, or an engineer down the hall — is making decisions about cost, speed, and reliability with almost no evidence. The telemetry stack is what turns "it feels slow and expensive" into a number you can argue with. You do not need to run it yourself to benefit from knowing what it can and cannot prove.

## The pieces, in plain English

**Agents and apps emit signals.** Every coding agent, chat app, or scripted workflow produces events: a request went out, tokens were spent, a tool was called, something failed. Individually these events are noise. The stack's first job is giving them a common shape.

**The collector (OpenTelemetry Collector) is the traffic controller.** Nothing talks straight to storage. The collector receives signals in a standard format (OTLP), batches them, retries on failure, and routes each type where it belongs. This one decision — everything through one pipe — is what makes the rest of the system maintainable.

**Prometheus stores metrics.** Metrics are counters and gauges: tokens per hour, requests per provider, cost per day. They are cheap to store, fast to query, and perfect for the "how much, how often" questions. Deduplication rules live here, because cumulative counters lie unless you subtract correctly.

**Langfuse stores traces.** A trace is one complete story: a single request, which model answered, how many tokens, what it cost, how long it took. Langfuse runs on ClickHouse, a columnar database built for exactly this kind of analytical querying. This is where cost-per-task answers come from.

**Session stores are the raw truth.** The original JSONL and SQLite files that agents write never get deleted. When two dashboards disagree, these files settle the argument.

**Grafana is the room where it becomes visible.** Metrics from Prometheus and aggregates from Langfuse land as panels on dashboards. One public, privacy-safe summary; one private full-detail view.



## Supporting cast

**Postgres** holds application state — who is allowed into which dashboard, what the ops board records. **Redis** queues work so a slow consumer does not block a fast producer. **MinIO** is S3-compatible blob storage, keeping exports and attachments without an external bill. **VictoriaMetrics** is a drop-in Prometheus-compatible store that keeps long-term private metrics without Prometheus's retention pain. **JSONL and SQLite** are what the agents themselves write — unglamorous, but the only source that never gets rounded or summarised.

## Where one request's telemetry actually travels



This sequence is why the stack is trustworthy: the same request produces a trace and a metric, so a dashboard number can be traced back to the story behind it.

## When the stack quietly lies



Two specific lessons from running this: providers expose cumulative counters that look like per-task totals until you subtract the previous value, and missing data renders as zero unless the pipeline explicitly marks it unknown. Both were caught in my own dashboards; both are the reason the pipeline now deduplicates by provider and session and never renders an unknown as zero.

## Field notes that fed this article

This is the canonical description. Two earlier articles cover pieces of the journey and remain useful as field notes: [One door for every token](/blog/one-door-for-every-token) covers the routing gateway and cost feed, and [why I made my agent token usage public](/blog/why-i-made-my-agent-token-usage-public) covers the public summary pipeline. Where they describe older paths, this article is the current truth.

## Where to go next

- [Agent Ops for people who don't run infrastructure](/blog/agent-ops-for-people-who-dont-run-infrastructure) — what happens when the dashboards raise an alarm
- [Your Mac as an AI operations centre](/blog/your-mac-as-an-ai-operations-centre) — the machine this stack runs on
- [Why agent systems becom

## agent-ops-for-people-who-dont-run-infrastructure
Title: Agent Ops for people who don't run infrastructure
Description: How to keep a fleet of AI agents alive, monitored, and recoverable using launchd, an ops board, alerts, and runbooks — explained for people who have never administered a server.
Most writing about "AI operations" assumes you run Kubernetes and enjoy it. This article is for the other case: you have several agents doing real work on your machine, and you want them to keep working without becoming a second job.

The good news is that the pattern is small. Four pieces — a way to keep things running, a place to see their state, a way to be told when something drifts, and written instructions for fixing it — cover almost everything.



## The four pieces, in plain English

**launchd is the building manager.** On macOS, launchd starts services, restarts them when they crash, and defines what "running" means for each one. If your agent dies at 3am, launchd brings it back before you wake up. No containers required.

**The ops board (Semaphore) is the lobby directory.** One page that shows the state of every service: running, stopped, failing, when it last checked in. When something looks wrong, this is the first place to look, because looking in five places is how incidents get missed.

**Alertmanager is the alarm system.** It watches metrics and decides what deserves your attention. Alarms route to Telegram, which means your phone is the pager. A good alarm says what broke and links to what to do about it; a bad alarm says nothing and trains you to ignore it.

**Runbooks are the SOPs.** A runbook is one document per failure mode: what the alarm means, the exact commands to run, how to verify the fix. Written while the failure is still understood, so the version of you at 3am doesn't have to reconstruct the reasoning.



## From alarm to recovery, in order



The sequence matters more than the tools. Any alerting system that doesn't end in a runbook produces anxiety, not recovery.

## The before and after of having a runbook



This is the highest-leverage habit in the whole discipline, and it costs one document per failure mode.

## What this looks like on a real Mac

The rig this describes runs launchd jobs for each agent, a Semaphore ops board in a local container, Alertmanager wired to Telegram, and runbooks in a docs tree. Grafana gives the context behind each alarm. Nothing here needs a public port — [the Mac operations centre article](/blog/your-mac-as-an-ai-operations-centre) covers how that works.

## Where to go next

- [The agent telemetry stack, explained from first principles](/blog/the-agent-telemetry-stack) — where the metrics that feed the alarms come from
- [What should be an agent — and what should be normal code?](/blog/what-should-be-an-agent) — deciding what deserves this operational care at all

## your-mac-as-an-ai-operations-centre
Title: Your Mac as an AI operations centre
Description: Ports, processes, services, containers, and one honest boundary: how a laptop becomes an operations centre you can reach from your phone without exposing anything to the internet.
A laptop is a surprisingly good operations centre. It has a real Unix underneath, it sleeps when you close it, and it is already with you. The work is understanding what runs on it and where the boundary is.



## The layers, in plain English

**Processes and ports.** Everything running on your Mac is a process, and network services listen on numbered ports. `localhost:3000` means "port 3000 on this machine only". The loopback address 127.0.0.1 is unreachable from outside — which is exactly why most of this system stays there.

**launchd and services.** A service is a process that should keep running. launchd is the macOS mechanism that starts them, restarts them on failure, and records when they did. Containers are optional here, not required.

**OrbStack and containers.** Some things — the VictoriaMetrics store, the Grafana room, a small Coolify stack — run best isolated in containers. OrbStack provides that on a Mac without the ceremony of Docker Desktop. Volumes persist container state across restarts.

**The outside world.** Two ways in: Tailscale, a private mesh network that makes your Mac reachable from your phone from anywhere, and SSH for terminal access. Both require your credentials. No public ports, no firewall holes.



## The phone-to-system journey



This is the practical payoff: an alarm arrives on your phone, you open the board, you read the runbook, you fix or delegate the fix, and you confirm recovery — from anywhere.

## When the boundary is wrong



Three specific mistakes account for most self-hosted exposures: a dashboard bound to 0.0.0.0 instead of loopback, credentials visible in screenshots, and "it sleeps" treated as security. The boundary should be loopback plus your tailnet, with sleep as a bonus rather than a plan.

## Laptop sleep, honestly

Sleep pauses everything — agents, containers, collection. That is a feature, not a bug, for a personal rig: it bounds the bill and the risk. If something must run continuously, it belongs on a small always-on host, not on the machine you close.

## Where to go next

- [Agent Ops for people who don't run infrastructure](/blog/agent-ops-for-people-who-dont-run-infrastructure) — what runs on this machine day to day
- [The agent telemetry stack, explained from first principles](/blog/the-agent-telemetry-stack) — what the dashboards are made of

## the-multi-agent-journey-what-survived-contact-with-reality
Title: The multi-agent journey: what survived contact with reality
Description: Every multi-agent architecture I tried, what the telemetry said about each one, and why the system I actually use now is simpler than anything I built first.
This is the honest version of two years of multi-agent work: what was built, what the measurements said, and why the current system is one agent with two models rather than the orchestration layer I once thought was the point.



## Phase by phase

**Native subagents.** The first instinct was parallelism: spawn a worker per task, let them run. It worked — and produced no evidence. When two workers disagreed, there was no trace to settle it.

**Measurable workers.** The fix was telemetry: per-worker traces, recoverable handoffs, tokens attributed to the worker that spent them. This made the next conclusion possible, because now overhead was visible instead of assumed.

**Codex + OpenCode.** Splitting planner and executor into two tools with two models looked like an architecture win. Per-call traces showed the planning and review layers costing more than the work itself.

**Lifecycle experiments.** Beads, BVR, and NTM added state machines, ticket routing, and formal lifecycle bookkeeping. Every one of them added coordination cost that the traces showed was not being repaid in quality.

**Simplified roles.** The current system: one agent (Codex as operator), a role-aware routing rule to GLM-5.3-Flash as workhorse with frontier escalation, and A2A as an optional discovery capability. Everything else was deleted, deliberately.



## What the middleman tax actually cost



## What survived

Three things: measurement as a first-class citizen (per-call traces so every architectural claim can be checked), role-aware routing instead of model loyalty (cheap workhorse by default, frontier only for genuinely hard work), and A2A as a companion capability — agents that can discover each other without custom plumbing. Everything else — the orchestration layers, the lifecycle bookkeeping, the inbox protocols — was removed after the telemetry showed it cost more than it returned.

## Field notes this consolidates

The long-form evidence lives in earlier articles, which remain valuable as the paper trail: [what 551 Codex sessions revealed](/blog/what-551-codex-sessions-reveal-about-real-ai-work), [the OpenRouter-backed AI team](/blog/how-i-built-an-openrouter-backed-ai-team), [making subagents measurable](/blog/how-i-made-codex-subagents-measurable), [one agent, two models](/blog/one-agent-two-models), [the A2A mesh](/blog/how-i-got-four-ai-agents-talking-to-each-other), and [Sol/OpenCode split](/blog/how-i-split-sol-planning-from-opencode-go-execution). This article is the through-line.

## Where to go next

- [Why agent systems become slow, expensive and fragile](/blog/why-agent-systems-become-slow-expensive-and-fragile) — the mechanism behind the middleman tax
- [What should be an agent — and what should be normal code?](/blog/what-should-be-an-agent) — the decision rule this journey produced

## why-agent-systems-become-slow-expensive-and-fragile
Title: Why agent systems become slow, expensive and fragile
Description: The measured mechanisms behind agent bloat: context resends, oversight cost, cumulative failures, and the attribution traps that make dashboards lie about all of it.
Ask someone why their agent system is slow and they will blame the model. The telemetry says otherwise: in my own measured runs, most of the cost and latency accumulated around the model, not inside it. This article names the mechanisms.



## The mechanisms

**Every hop resends context.** When a planner hands work to a worker, the worker receives its instructions again, plus enough history to act. The reviewer reads the output plus the original context. Each hop re-pays for tokens the previous hop already spent.

**Oversight costs more than work.** Planning tokens, review tokens, and polling waits are all real spend. In the one-agent-two-models comparison, oversight across four orchestration layers exceeded the tokens spent doing the actual task.

**Failures are cumulative, not isolated.** A retry is cheap; a retry culture is not. Inbox errors, browser reconnects, tool-output bloat, and stale duplicate workers each add a little. Together they turn a two-minute task into a twenty-minute session.

**Interruptions and inference-vs-tool bottlenecks.** A cancelled task still bills its tokens. And long tool calls (a browser action, a file write) block the inference loop, so wall-clock time diverges from token cost — which is why "it took ages" and "it cost a lot" are different measurements.



## A request through the cost machine



## The attribution trap



Cumulative-versus-task metrics and unknown-versus-zero are the two quiet ways dashboards lie. Fixing them is what made honest optimisation possible at all.

## What to do about it

The structural fixes are boring and effective: fewer hops (delete layers that don't repay their coordination cost), task-scoped metrics (attribute tokens to the task, not the lifetime counter), bounded tool output (truncate what you would never read), and a stale-worker reaper. The routing rule — cheap workhorse by default, frontier for genuinely hard work — is documented in [the routing benchmark article](/blog/i-made-glm-5-3-flash-faster-but-kept-cheap-routing).

## Where to go next

- [The multi-agent journey](/blog/the-multi-agent-journey-what-survived-contact-with-reality) — the architectural decisions this evidence produced
- [The agent telemetry stack](/blog/the-agent-telemetry-stack) — how to measure your own version of this

## ai-for-agency-operations
Title: AI for agency operations: seven workflows that are already useful
Description: Seven AI workflows running inside real agency operations today — taxonomy governance, tag QA, attribution reconciliation, guidelines, rollouts, scoping, and turning calls into assets — described anonymised.
Most "AI for agencies" content describes pilots. This article describes seven workflows that run inside real operations now, with the unglamorous details: what they replace, what they still need a human for, and where they fall short. Client details are anonymised throughout.



## The seven workflows

**1. Global taxonomy governance.** One event contract — names, properties, owners — maintained across markets. AI drafts and checks taxonomy changes against the contract; humans approve. What it replaced: spreadsheet archaeology and Slack archaeology.

**2. Tag and pixel QA.** Automated browser journeys exercise real consent flows and record what actually fires, compared against the contract. What it replaced: spot checks that missed consent-blocked tags for weeks.

**3. Attribution reconciliation.** Platform-reported conversions versus backend truth, with the gap measured and explained rather than argued about. What it replaced:信任 the platform number by default.

**4. Guidelines maintenance.** Living standards documents with named owners and review dates, checked automatically for drift. What it replaced: PDF guidelines nobody opened twice.

**5. Rollout packs.** One governance change produces the same deployable, auditable artifact set for every market. What it replaced: per-market improvisation.

**6. Product and commercial scoping.** Messy calls and decks become structured PRDs and scoped decisions with explicit open questions. What it replaced: the "we'll figure it out during the build" meeting.

**7. Workshops and calls into operating assets.** A call ends with an artifact, not just minutes. What it replaced: recordings nobody rewatched.



## A rollout end to end



## When platform and backend disagree



## What the human still does

Approve contracts. Decide which discrepancies matter. Sign off anything client-facing. The workflows remove retrieval, checking, and formatting labour; they do not remove judgment. That is the design, not a limitation.

## Where to go next

- [Agentic web analytics implementation](/blog/agentic-web-analytics-implementation) — the deepest of the seven, end to end
- [Proof, not prompts](/blog/proof-not-prompts) — the delivery standard behind all seven

## proof-not-prompts
Title: Proof, not prompts
Description: A delivery standard for AI-assisted work: evidence packs, provenance, editable deliverables, reconciliation, and review gates — so a claim can be checked, not just believed.
The difference between a prompt output and a deliverable is not the words. It is whether someone else can check the claim. This article describes the working method: what gets captured, how provenance attaches, and where the gates are.



## What a proof pack contains



Raw evidence is the unedited capture: the browser recording, the network log, the data export. Provenance attaches source, timestamp, and runner to every claim, so "according to the GA4 export from Tuesday" is checkable rather than rhetorical. The deliverable stays editable — a reviewer can change the wording without breaking the trail. The uncertainty statement says what is not proven and what would change the answer. Most "AI delivered it" failures are missing exactly this last layer.

## From claim to verified deliverable



## The before and after



## Where reconciliation fits

When two sources disagree — platform-reported versus backend-measured, observed versus configured — reconciliation is the step that measures the gap and explains it rather than picking a winner. That is the difference between an evidence pack and a screenshot with a narrative.

## Where to go next

- [AI for agency operations](/blog/ai-for-agency-operations) — the workflows this standard governs
- [Why agent systems become slow, expensive and fragile](/blog/why-agent-systems-become-slow-expensive-and-fragile) — why "it ran successfully" is not evidence

## what-should-be-an-agent
Title: What should be an agent — and what should be normal code?
Description: Four questions — ambiguity, repetition, failure cost, auditability — that decide whether a task deserves an agent or a script, with the measured evidence from this rig's own routing decisions.
The most expensive mistake in agent work is using an agent where a script belongs. It is also the most common one, because agents are exciting and scripts are not. This article offers four questions that settle it, and the evidence from this rig's own decisions.



## The four questions

**Is it ambiguous?** If the input varies in ways rules cannot enumerate — a messy brief, an unclear spec, a weird repo state — judgment is required, and that is an agent's home turf.

**Does it repeat?** Same input, same output, every time. Repetition is a script's home turf. An agent on a deterministic job burns tokens for variance you did not want.

**What does failure cost?** Cheap failure (a draft nobody ships, a suggestion nobody takes) tolerates agents. Expensive failure (payments, publishing, anything client-facing) needs deterministic paths and guardrails.

**Who must audit it?** If a decision needs to be traced after the fact — compliance, billing, client disputes — you need either normal code or a fully logged agent with provenance attached.



## A decision in sequence



## The measured before and after



## The hybrid pattern that usually wins

Most real work is a script with an agent at the edges: deterministic pipeline for the 90% that repeats, agent for the 10% that needs judgment, with the handoff explicit. This is what [the routing system](/solutions/agent-routing-and-lifecycle-system) does — cheap workhorse for routine work, frontier escalation only when the questions above say the judgment is real.

## Where to go next

- [The multi-agent journey](/blog/the-multi-agent-journey-what-survived-contact-with-reality) — the architectural history behind this heuristic
- [Proof, not prompts](/blog/proof-not-prompts) — how auditability attaches to whatever you choose

## building-maintainable-knowledge-systems
Title: Building maintainable knowledge systems from messy business material
Description: Files, email, decks, sheets, and meetings become a governed knowledge layer — with named owners, review dates, and provenance — so answers trace to sources instead of folklore.
Every organisation has the same problem in different clothes: the truth exists, but it is scattered across files nobody can find, email nobody re-reads, decks with stale numbers, and meeting recordings nobody replays. AI makes retrieval cheap. It does not make the knowledge governed — that part is still your job.



## The stack



**Source corpus stays raw.** Files are never edited in place. The corpus is the evidence; the governed layer is the interpretation.

**Extraction attaches provenance.** Every extracted claim keeps its source: which file, which email, which meeting, which date. A claim without provenance is a rumour with formatting.

**The governed layer is canonical.** One version per fact, a named owner, a review date. When two sources disagree, the layer records both and flags the conflict instead of silently picking one.

**Retrieval asks the layer.** Agents and people query the governed layer, not the folder. This is the difference between "the AI said" and "the layer says, and here is the source".

## Material to decision, in order



## Folder versus governed layer



## What AI changes and what it does not

AI makes extraction and retrieval nearly free. It does not decide who owns a fact, when it should be reviewed, or which of two contradictory sources wins. Those are governance decisions, and organisations that skip them get a fast way to be confidently wrong.

## Where to go next

- [AI for agency operations](/blog/ai-for-agency-operations) — where this pipeline does its daily work
- [Proof, not prompts](/blog/proof-not-prompts) — the evidence discipline this layer feeds

## agentic-web-analytics-implementation
Title: Agentic web analytics implementation
Description: How web analytics implementation — consent, GA4, GTM setup, QA, reporting, reconciliation — can be substantially automated while humans keep governance. Marketer-first, proof-backed.
Web analytics implementation has a reputation problem: it is either slow and expensive (agency-led) or quietly broken (self-serve). Agentic implementation changes the economics without removing the governance. This article shows the whole loop — plan, implement, QA, report, reconcile — and what the human still owns.



## Why marketers should care

The value is not "AI did the tags". It is that QA, which used to be the part that got skipped, becomes the part that always runs. A configured-but-broken implementation is worse than none — you make decisions on under-counted data with no signal that anything is wrong. Agentic QA closes exactly that gap.

## The implementation stack



**The measurement contract** comes first: events, properties, owners, and the consent model. AI drafts it from a requirements conversation; humans approve it. Nothing else starts until this exists.

**The GTM workspace** is built against the contract, versioned, and reviewed before publish. Agentic tooling generates tags, triggers, and variables from the contract rather than from memory.

**GA4** receives events with consent-aware gating, so what fires depends on what the visitor allowed.

**The QA harness** is the differentiator: automated browser journeys that exercise the real consent path, record what actually fired, and compare it against the contract.

**Reporting** joins GA4, BigQuery, and vendor data through a reconciliation pass before any number reaches a decision.

## Implementation to verified reporting



## Configured-but-broken versus verified



## What the earlier setup story got right and wrong

The [original GA4 setup write-up](/blog/how-we-finished-the-ga4-property-setup-on-rajeevg-com) documented a one-off property build. The setup itself was correct; the method was not repeatable. This article is the repeatable version — same destination, contract-first, with QA as a stage rather than an afterthought. [The measurement reality article](/blog/why-browser-consent-and-source-blending-make-marketing-measurement-harder) remains the best explanation of why browser-side truth is hard in the first place.

## Where to go next

- [Agentic data collection and warehousing](/blog/agentic-data-collection-and-warehousing) — when the collection layer itself should get heavier
- [Proof, not prompts](/blog/proof-not-prompts) — the delivery standard this loop feeds

## agentic-data-collection-and-warehousing
Title: Agentic data collection and warehousing
Description: Server-side GTM, first-party collection, warehouse destinations, and consent — with an honest account of cost, complexity, and when the heavy stack is the wrong answer.
Server-side tagging and a warehouse are powerful. They are also optional, and the industry's habit of treating them as mandatory has cost more projects than it has helped. This article covers what the heavy stack does, what it costs, and how to decide.



## The stack, honestly



**Consented collection** starts in the browser. Consent state gates what fires; nothing heavy changes that, it only changes where the event goes next.

**Server-side GTM** is a first-party endpoint that receives events, transforms them, and routes them onward. Its real benefits are control (you decide exactly what leaves) and cookie lifetime on your own domain.

**Cloud Run** hosts the sGTM container, and it is where the bill and the operational burden live. It is also the component most teams do not actually need.

**BigQuery** is the warehouse: raw events, queryable, joinable to backend truth. For most organisations this is the component that survives even when sGTM does not.

## One event's full journey



## When NOT to use the heavy stack



The honest criteria: low event volume, no engineering owner, questions answerable by client-side plus the GA4 BigQuery export, and no first-party cookie requirement. The [cost autopsy](/blog/when-not-to-use-server-side-tagging) measured the Cloud Run bill and the maintenance load before removing the stack for exactly these reasons. The [consented first-party stack article](/blog/how-we-built-a-consented-first-party-analytics-stack) documents when the heavy stack was the right call — consent-gated collection into BigQuery with a reporting layer on top — and both lessons are folded in here.

## The backend-truth reconciliation

The point of a warehouse is not storage; it is the join. Platform-reported conversions versus backend-measured outcomes, reconciled so neither is silently overwritten — that is what turns collection into decisions. [The consent and blending article](/blog/why-browser-consent-and-source-blending-make-marketing-measurement-harder) explains why the sources disagree in the first place.

## Where to go next

- [Agentic web analytics implementation](/blog/agentic-web-analytics-implementation) — the lighter half of the measurement loop
- [The agent telemetry stack](/blog/the-agent-telemetry-stack) — the same warehousing logic applied to AI systems
