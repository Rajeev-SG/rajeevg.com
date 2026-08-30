export type PortfolioProject = {
  slug: string
  title: string
  category: string
  tagline: string
  summary: string
  howItWorks: string
  imagePath: string
  imageAlt: string
  liveUrl?: string
  githubUrl?: string
  lastUpdated: string
  tech: string[]
  repoVisibility: "PUBLIC" | "PRIVATE"
  inclusionReason: string
  detailLinks?: { label: string; href: string }[]
}

export const portfolioProjects: PortfolioProject[] = [
  {
    slug: "open-gtm-index",
    title: "Open GTM Index",
    category: "Research product",
    tagline: "A transparent guide to open-source sales and marketing software.",
    summary:
      "Open GTM Index helps people compare open-source alternatives to common sales, marketing, analytics, automation, and support tools. The rankings use public project facts and a documented scoring method, so each result can be checked instead of taken on trust.",
    howItWorks:
      "The responsive site is built with TanStack Start, React, TypeScript, Vite, and Nitro. It presents category leaders, sortable rankings, licence details, replacement suggestions, and the score weights used in the research. The public repository also includes the source workbook and project metadata collected on 20 July 2026.",
    imagePath: "/images/projects/open-gtm-index.png",
    imageAlt: "Open GTM Index desktop interface showing category leaders, ranked tools, and the public scoring method.",
    liveUrl: "https://open-gtm-index.vercel.app",
    lastUpdated: "2026-07-20",
    githubUrl: "https://github.com/Rajeev-SG/open-gtm-index",
    tech: ["TanStack Start", "React 19", "TypeScript", "Vite", "Nitro", "Playwright", "Vercel"],
    repoVisibility: "PUBLIC",
    inclusionReason: "Public GitHub repository with a live research and ranking site.",
  },
  {
    slug: "local-llm-lab",
    title: "Local LLM Lab",
    category: "AI research product",
    tagline: "A measured guide to every local AI model installed on my Apple Silicon workstation.",
    summary:
      "Local LLM Lab turns a large collection of local model builds and benchmark evidence into a practical field guide. It shows what is installed now, what each build is good at, which input types and tool features it supports, and how quality, speed, memory use, and context length compare on the same machine.",
    howItWorks:
      "Python scripts inspect the live Hugging Face, Ollama, MLX, and Apple model inventories, join them to checked-in benchmark results, and generate a static React guide. Exact model revisions stay separate because the runtime and quantisation can materially change speed, memory use, and output quality.",
    imagePath: "/images/projects/local-llm-lab.png",
    imageAlt: "Local LLM Lab field guide showing the current installed-model inventory and measured comparison totals.",
    liveUrl: "https://local-llm-lab.vercel.app",
    lastUpdated: "2026-08-20",
    githubUrl: "https://github.com/Rajeev-SG/local-llm-lab",
    tech: ["Python", "React", "Vite", "MLX", "Ollama", "Playwright", "Vercel"],
    repoVisibility: "PUBLIC",
    inclusionReason: "Public GitHub repository with a current production guide and checked-in benchmark evidence.",
    detailLinks: [{ label: "Build write-up", href: "/blog/how-i-ran-qwen-locally-inside-codex" }],
  },
  {
    slug: "hackathon-voting-app",
    title: "Hackathon Voting App",
    category: "Operations product",
    tagline: "A production-ready single-screen judging app built for a live hackathon room.",
    summary:
      "This app was built around a very specific constraint: the judging workflow had to stay operationally simple on the day. That meant one public scoreboard, one manager setup surface, one voting modal for judges, and enough proof and resilience work that the room could trust it when the event actually started.",
    howItWorks:
      "The product runs on Next.js, Clerk, Prisma, and Postgres, with XLSX-driven setup, self-vote blocking from uploaded team emails, one locked score per judge, a manager-only remaining-votes tracker, and a shared GA4 plus BigQuery reporting layer for event-day analysis.",
    imagePath: "/images/projects/hackathon-voting-app.png",
    imageAlt: "Hackathon Voting App showing the live public scoreboard and consent-aware footer controls.",
    liveUrl: "https://vote.rajeevg.com",
    lastUpdated: "2026-05-30",
    githubUrl: "https://github.com/Rajeev-SG/hackathon-voting-prototype",
    tech: ["Next.js 14", "TypeScript", "Clerk", "Prisma", "Postgres", "Playwright", "GA4"],
    repoVisibility: "PUBLIC",
    inclusionReason: "Public GitHub repo with a live production judging surface.",
    detailLinks: [
      {
        label: "Event-day analytics",
        href: "/projects/hackathon-voting-analytics/google-analytics",
      },
      {
        label: "Build write-up",
        href: "/blog/how-we-built-the-hackathon-voting-app",
      },
    ],
  },
  {
    slug: "singulyr",
    title: "Singulyr",
    category: "Property platform",
    tagline: "A Singapore property workflow platform with a production lead and content stack.",
    summary:
      "Singulyr presents a clear product vision for verified identities, structured agreements, maintenance records, and deposit accountability across the rental lifecycle. The public launch site is backed by a real lead-capture, analytics, and publishing system rather than a static landing page.",
    howItWorks:
      "The Astro application combines a responsive public site with server-side lead handling, Neon-backed deduplication, HubSpot contact updates, BigQuery event writes, consent-aware analytics, and a protected content editor that publishes through GitHub and Vercel.",
    imagePath: "/images/projects/singulyr.png",
    imageAlt: "Singulyr launch site showing the Singapore property platform positioning and early-access call to action.",
    liveUrl: "https://singulyr-phase1.vercel.app",
    lastUpdated: "2026-06-20",
    tech: ["Astro", "React 19", "Neon", "HubSpot", "BigQuery", "Vercel"],
    repoVisibility: "PRIVATE",
    inclusionReason: "Public production launch site with a complete visitor journey; source remains private.",
  },
  {
    slug: "creative-observatory",
    title: "Creative Observatory",
    category: "Ad intelligence product",
    tagline: "A source-aware workbench for reviewing public ad-library evidence.",
    summary:
      "Creative Observatory brings brand coverage, creative inspection, trust cues, competitor context, and briefing exports into one analyst workflow. The interface is designed to keep source evidence and the next decision together instead of reducing the work to a generic dashboard.",
    howItWorks:
      "The Next.js application uses a typed research pipeline, Prisma-backed data contracts, seeded evidence states, interactive tables and charts, and Playwright proof flows. Its review model separates stored evidence, live refreshes, and demo data so users can see what each conclusion is based on.",
    imagePath: "/images/projects/creative-observatory.png",
    imageAlt: "Creative Observatory evidence workbench showing brand controls, trust status, and the review workflow.",
    liveUrl: "https://creative-observatory.vercel.app",
    lastUpdated: "2026-06-15",
    tech: ["Next.js 15", "React 19", "Prisma", "Recharts", "Playwright", "Vercel"],
    repoVisibility: "PRIVATE",
    inclusionReason: "Public production workbench with a complete visitor-facing interface; source remains private.",
  },
  {
    slug: "github-canvas-monitor",
    title: "GitHub Canvas Monitor",
    category: "Developer tool",
    tagline: "A spatial monitoring wall for active GitHub repositories.",
    summary:
      "GitHub Canvas Monitor replaces a linear repository list with a zoomable wall of movable project tiles. Each tile surfaces recent commits, pull requests, issues, activity signals, and README context so a large body of work can be scanned and arranged visually.",
    howItWorks:
      "The React application uses tldraw for the infinite canvas, TanStack Query for refresh and caching, and a TypeScript and Express service for GitHub data. Public repositories load without sign-in, while the canvas layout and selected repositories persist locally in the browser.",
    imagePath: "/images/projects/github-canvas-monitor.png",
    imageAlt: "GitHub Canvas Monitor showing a wall of repository tiles with live activity and attention signals.",
    liveUrl: "https://github-canvas-monitor.vercel.app",
    lastUpdated: "2026-04-10",
    tech: ["React 19", "TypeScript", "tldraw", "TanStack Query", "Express", "Vercel"],
    repoVisibility: "PRIVATE",
    inclusionReason: "Public production developer tool with a live GitHub data service; source remains private.",
  },
  {
    slug: "workflow-garden",
    title: "Workflow Garden",
    category: "Education product",
    tagline: "A public learning site for issue-driven AI development workflows.",
    summary:
      "Workflow Garden turns a fairly opinionated software workflow into something a newcomer can actually browse. It mixes evergreen articles, project pages, concept pages, and a generated activity diary, so the site feels alive rather than frozen in one explanatory moment.",
    howItWorks:
      "The site is built with Next.js and Velite, then fed with generated content from local repo activity. A refresh pipeline creates static JSON and search indices before deploy, which lets Vercel serve the whole thing without runtime access to the local Code workspace.",
    imagePath: "/images/projects/workflow-garden.png",
    imageAlt: "Workflow Garden homepage showing its editorial layout and generated activity panel.",
    liveUrl: "https://workflow-garden.vercel.app",
    lastUpdated: "2026-03-15",
    githubUrl: "https://github.com/Rajeev-SG/workflow-garden",
    tech: ["Next.js", "React 19", "Velite", "Tailwind CSS", "Pagefind", "Vercel"],
    repoVisibility: "PUBLIC",
    inclusionReason: "Public GitHub repo with a public homepage URL.",
  },
  {
    slug: "proof-pack",
    title: "Proof Pack",
    category: "Review tool",
    tagline: "A launch-review app that turns a URL into a concise critique pack.",
    summary:
      "Proof Pack is for that annoying moment right before launch, when a page technically works but still needs someone to say whether the hierarchy is clear, the mobile layout holds up, and the whole thing actually feels ready to ship.",
    howItWorks:
      "A user submits a public URL and the app builds a review pack around clarity, accessibility, mobile risk, and concrete next steps. The product is intentionally lightweight, but the thinking behind it is not.",
    imagePath: "/images/projects/proof-pack.png",
    imageAlt: "Proof Pack landing page with the review form and launch feedback messaging.",
    liveUrl: "https://proof-pack.vercel.app",
    lastUpdated: "2026-04-01",
    githubUrl: "https://github.com/Rajeev-SG/proof-pack",
    tech: ["Next.js", "React 19", "Tailwind CSS", "Vitest", "Vercel"],
    repoVisibility: "PUBLIC",
    inclusionReason: "Public GitHub repo with a public homepage URL.",
  },
  {
    slug: "agent-orchestra",
    title: "Agent Orchestra",
    category: "AI demonstrator",
    tagline: "A live comparison of one general AI workflow against a coordinator using specialist workers.",
    summary:
      "Agent Orchestra makes a multi-step AI workflow visible. A coordinator plans the job, assigns focused research tasks, gathers evidence, and produces a final brief while a single-pass baseline runs alongside it for comparison.",
    howItWorks:
      "The Next.js app uses structured model responses, bounded stage times, fallback models, web research tools, and partial-failure handling so a live demonstration can still complete when one worker or provider is slow. The interface exposes the plan, worker progress, evidence, and final synthesis as one connected run.",
    imagePath: "/images/projects/agent-orchestra.png",
    imageAlt: "Agent Orchestra interface showing the mission brief, worker status, evidence count, and orchestration controls.",
    liveUrl: "https://multi-agent-orchestration-demo.vercel.app",
    lastUpdated: "2026-05-01",
    tech: ["Next.js 16", "React 19", "AI SDK", "OpenRouter", "Zod", "Motion", "Vercel"],
    repoVisibility: "PRIVATE",
    inclusionReason: "Public production demonstrator with a complete visitor-facing workflow; source remains private.",
  },
  {
    slug: "agent-usage-observatory",
    title: "Tokenmaxxing",
    category: "AI operations tool",
    tagline: "A public token view backed by a private, full-detail Grafana control room.",
    summary:
      "Tokenmaxxing turns the private telemetry behind my multi-agent setup into a small, public, privacy-safe dashboard. It shows measured totals, provider shares, agent activity and freshness, while a separate authenticated Grafana control room provides the granular operational view without publishing prompts or session identifiers.",
    howItWorks:
      "A local pipeline normalises Codex, Claude Code, Hermes, OMP, OpenClaw and Droid/OpenCode session stores, deduplicates cumulative provider/session values, and sends metrics to local Prometheus plus a private VictoriaMetrics and Grafana deployment on Coolify. A strict allowlist still publishes only a tiny rolling summary to Vercel Blob. Unknown values are never presented as zero.",
    imagePath: "/images/projects/agent-usage-observatory.svg",
    imageAlt: "Agent Usage Observatory graphic showing an 88.9 percent Codex share and an 11.1 percent OpenCode Go share.",
    liveUrl: "https://tokenmaxxing.rajeevg.com",
    lastUpdated: "2026-08-28",
    tech: ["Python", "OpenTelemetry", "Codex", "OpenCode Go", "Vercel Blob", "Playwright"],
    repoVisibility: "PRIVATE",
    inclusionReason: "Public production dashboard backed by measured, privacy-safe session telemetry.",
    detailLinks: [
      { label: "Private control room", href: "/blog/how-i-built-one-control-room-for-six-ai-agents" },
      { label: "How the public feed works", href: "/blog/why-i-made-my-agent-token-usage-public" },
      { label: "Agent architecture", href: "/blog/how-i-split-sol-planning-from-opencode-go-execution" },
    ],
  },
  {
    slug: "mark-notes",
    title: "Mark Notes",
    category: "Productivity product",
    tagline: "A calm, local-first notes workspace with web, desktop, and mobile shells.",
    summary:
      "Mark Notes combines a fast note library with a focused writing surface, folders, search, attachments, diagrams, and optional AI writing help. The product is designed to feel closer to a quiet personal archive than a busy team workspace.",
    howItWorks:
      "A shared TypeScript note model supports the React web app, Electron desktop shell, and Expo mobile shell. Notes remain usable locally, with an API-backed sync layer for moving between devices and Markdown-compatible storage for portability.",
    imagePath: "/images/projects/mark-notes.png",
    imageAlt: "Mark Notes interface showing folders, a note list, and a calm long-form editor with task and diagram content.",
    liveUrl: "https://mark-notes-tau.vercel.app",
    lastUpdated: "2026-06-10",
    tech: ["React", "TypeScript", "Electron", "Expo", "Markdown", "Postgres", "Vercel"],
    repoVisibility: "PRIVATE",
    inclusionReason: "Public production application with web, desktop, and mobile implementations; source remains private.",
  },
  {
    slug: "singulyr-pact",
    title: "Singulyr PACT",
    category: "Product prototype",
    tagline: "An end-to-end rental operating-system prototype for Singapore.",
    summary:
      "Singulyr PACT models the rental relationship after a tenant and landlord have matched. Its navigable prototype covers role-based dashboards, property workspaces, payments, compliance tracking, maintenance, onboarding, and messages for landlords, tenants, agents, and service providers.",
    howItWorks:
      "The Next.js prototype uses a shared route model for four user roles, Prisma and Postgres schema work, simulated Singpass and banking steps, and explicit feedback wherever a transaction is not yet persistent. The live product is intentionally presented as a working prototype rather than a finished financial service.",
    imagePath: "/images/projects/singulyr-pact.png",
    imageAlt: "Singulyr PACT landlord dashboard showing rental totals, active tenancies, compliance, and maintenance status.",
    liveUrl: "https://singulyr-pact-lp.vercel.app",
    lastUpdated: "2026-05-01",
    tech: ["Next.js 14", "TypeScript", "Prisma", "Postgres", "NextAuth", "Vercel"],
    repoVisibility: "PRIVATE",
    inclusionReason: "Public, navigable product prototype with a complete critical path; source remains private.",
  },
  {
    slug: "choice-compass",
    title: "Choice Compass",
    category: "Decision tool",
    tagline: "A weighted decision helper for comparing a small set of options.",
    summary:
      "Choice Compass is a small app with a very specific job: help someone compare a few real options without sliding straight into spreadsheet sprawl. It is deliberately simple, fast, and browser-local.",
    howItWorks:
      "The app lets a user define options, add weighted criteria, score each option, and review the winner with a shareable summary. Everything runs in the browser, with `localStorage` handling persistence, so there is no backend to look after.",
    imagePath: "/images/projects/choice-compass.png",
    imageAlt: "Choice Compass decision app showing criteria weighting and a live recommendation.",
    liveUrl: "https://choice-compass-pi.vercel.app",
    lastUpdated: "2026-04-20",
    githubUrl: "https://github.com/Rajeev-SG/choice-compass",
    tech: ["React", "TypeScript", "Vite", "Vitest", "localStorage", "Vercel"],
    repoVisibility: "PUBLIC",
    inclusionReason: "Public GitHub repo with a public homepage URL.",
  },
  {
    slug: "model-intelligence-maintainer",
    title: "Model Intelligence Maintainer",
    category: "Data product",
    tagline: "A workbook and static guide for comparing model quality, price, and provider coverage.",
    summary:
      "This project pulls together model metadata and benchmark signals from multiple sources, then turns them into a workbook and static guide for a very practical question: which model should I actually use?",
    howItWorks:
      "A Python pipeline refreshes and normalizes OpenRouter, Artificial Analysis, Vals, and LiveBench data into deterministic datasets, a workbook, and a deployed static site. The repo keeps provenance, cohort rules, and mapping diagnostics out in the open instead of pretending that part is easy.",
    imagePath: "/images/projects/model-intelligence-maintainer.png",
    imageAlt: "Model Intelligence Guide interface comparing model presets and recommended fits.",
    liveUrl: "https://openrouter-model-workbook-maintaine.vercel.app",
    lastUpdated: "2026-07-10",
    githubUrl: "https://github.com/Rajeev-SG/openrouter-model-workbook-maintainer-v2",
    tech: ["Python", "uv", "OpenRouter", "Artificial Analysis", "Vals", "LiveBench", "Vercel"],
    repoVisibility: "PUBLIC",
    inclusionReason: "Public GitHub repo with a public homepage URL.",
  },
  {
    slug: "openreview",
    title: "OpenReview Deployment",
    category: "Adapted AI deployment",
    tagline: "A self-hosted pull-request review service configured for model routing.",
    summary:
      "This is my deployed fork of Vercel Labs' OpenReview project. It can respond to pull-request comments, inspect a repository in an isolated workspace, run project checks, and return line-level review suggestions through GitHub.",
    howItWorks:
      "The deployment combines Next.js route handlers, GitHub webhooks, resumable workflows, isolated execution, the AI SDK, and a configurable model provider. The original product comes from Vercel Labs; my public fork and deployment preserve that attribution.",
    imagePath: "/images/projects/openreview.png",
    imageAlt: "OpenReview deployment documentation explaining the pull-request review workflow and setup.",
    liveUrl: "https://openreview-openrouter.vercel.app",
    lastUpdated: "2026-06-01",
    githubUrl: "https://github.com/Rajeev-SG/openreview",
    tech: ["Next.js 16", "AI SDK", "GitHub", "Vercel Workflow", "Vercel Sandbox", "OpenRouter"],
    repoVisibility: "PUBLIC",
    inclusionReason: "Public attributed fork with a live self-hosted deployment.",
  },
  {
    slug: "rajeevg-com",
    title: "rajeevg.com",
    category: "Personal site",
    tagline: "This portfolio and writing site, built for clear technical storytelling.",
    summary:
      "This site is both a public homepage and a small publishing system. It is where I publish writing, explain projects, and turn technical work into something readable for people who were not in the terminal with me.",
    howItWorks:
      "The site runs on Next.js with Velite as a typed content layer, shadcn/ui components for reusable UI, and MDX for long-form posts. That makes it easy to mix structured React components with essays, diagrams, and code-heavy write-ups.",
    imagePath: "/images/projects/rajeevg-com.png",
    imageAlt: "rajeevg.com showing a long-form article and the site navigation shell.",
    liveUrl: "https://rajeevg.com",
    lastUpdated: "2026-08-29",
    githubUrl: "https://github.com/Rajeev-SG/rajeevg.com",
    tech: ["Next.js", "React 19", "Velite", "MDX", "shadcn/ui", "Tailwind CSS", "Vercel"],
    repoVisibility: "PUBLIC",
    inclusionReason: "Public GitHub repo with a public homepage URL.",
    detailLinks: [{ label: "Site analytics", href: "/projects/site-analytics" }],
  },
  {
    slug: "agent-operations-control-plane",
    title: "Agent Operations Control Plane",
    category: "AI & Agent Systems",
    tagline: "Launchd-managed workers, an ops board, alerts, and runbooks for a personal agent fleet.",
    summary:
      "The control plane keeps multiple coding and personal agents running through launchd, exposes their state on a local ops board, raises Alertmanager alerts when something drifts, and puts the runbooks next to the alarms so a fix does not depend on memory.",
    howItWorks:
      "launchd job definitions start and restart each agent, a building-manager job checks readiness and state, Semaphore renders the operations board, Alertmanager routes alarms, and runbooks in the docs tree document the exact recovery path for each failure mode.",
    imagePath: "/images/solutions/agent-operations-control-plane.svg",
    imageAlt: "Diagram of the agent operations control plane showing launchd, the ops board, alerts, and runbooks.",
    liveUrl: "/blog/agent-ops-for-people-who-dont-run-infrastructure",
    lastUpdated: "2026-08-29",
    tech: ["launchd", "Semaphore", "Alertmanager", "Grafana", "Prometheus", "runbooks"],
    repoVisibility: "PRIVATE",
    inclusionReason: "Runs on this Mac today as the operational backbone for the agent fleet.",
    detailLinks: [
      { label: "Read the operations article", href: "/blog/agent-ops-for-people-who-dont-run-infrastructure" },
      { label: "Mac operations centre", href: "/blog/your-mac-as-an-ai-operations-centre" },
    ],
  },
  {
    slug: "coding-agent-observatory",
    title: "Coding Agent Observatory",
    category: "AI & Agent Systems",
    tagline: "Token, cost, latency and session telemetry across every coding agent I run.",
    summary:
      "The observatory normalises Codex, Claude Code, Hermes, OMP, OpenClaw and OpenCode session stores, deduplicates cumulative provider totals, and publishes both a public privacy-safe summary and a private full-detail Grafana room. Unknown values stay unknown instead of becoming zero.",
    howItWorks:
      "Python exporters read local session JSONL and SQLite, reconcile cumulative counters by provider and session, push metrics to local Prometheus and a private VictoriaMetrics deployment, and publish a small allowlisted rolling summary to Vercel Blob.",
    imagePath: "/images/solutions/coding-agent-observatory.svg",
    imageAlt: "Diagram of the coding agent observatory telemetry path from local session stores to public and private views.",
    liveUrl: "https://tokenmaxxing.rajeevg.com",
    lastUpdated: "2026-08-28",
    tech: ["Python", "OpenTelemetry", "Prometheus", "VictoriaMetrics", "Grafana", "Vercel Blob"],
    repoVisibility: "PRIVATE",
    inclusionReason: "Public dashboard backed by measured session telemetry; private control room handles full detail.",
    detailLinks: [
      { label: "Private control room", href: "/blog/how-i-built-one-control-room-for-six-ai-agents" },
      { label: "How the public feed works", href: "/blog/why-i-made-my-agent-token-usage-public" },
      { label: "Cost routing article", href: "/blog/one-door-for-every-token" },
    ],
  },
  {
    slug: "agent-routing-and-lifecycle-system",
    title: "Agent Routing and Lifecycle System",
    category: "AI & Agent Systems",
    tagline: "Role-aware routing from the cheap workhorse to frontier help, with A2A as a discovery capability.",
    summary:
      "A thin routing layer decides which model and which agent handle each request: GLM-5.3-Flash as the workhorse, frontier models for genuinely hard work, and A2A endpoints so agents can discover each other without custom plumbing.",
    howItWorks:
      "Codex stays the primary operator, OpenCode handles fast execution, and a bounded escalation rule moves genuinely hard work to frontier models. A2A agent cards and JSON-RPC complete the discovery path between loopback agents.",
    imagePath: "/images/solutions/agent-routing-and-lifecycle-system.svg",
    imageAlt: "Diagram of the agent routing lifecycle showing role-aware models and A2A discovery.",
    liveUrl: "/blog/why-agent-systems-become-slow-expensive-and-fragile",
    lastUpdated: "2026-08-29",
    tech: ["Codex", "OpenCode", "A2A", "OpenRouter", "GLM-5.3-Flash", "loopback"],
    repoVisibility: "PRIVATE",
    inclusionReason: "Daily routing system, with a public A2A mesh write-up.",
    detailLinks: [
      { label: "Multi-agent journey", href: "/blog/the-multi-agent-journey-what-survived-contact-with-reality" },
      { label: "A2A mesh write-up", href: "/blog/how-i-got-four-ai-agents-talking-to-each-other" },
      { label: "Routing benchmark", href: "/blog/i-made-glm-5-3-flash-faster-but-kept-cheap-routing" },
    ],
  },
  {
    slug: "global-measurement-governance-system",
    title: "Global Measurement Governance System",
    category: "Martech & Measurement",
    tagline: "Taxonomy, QA, and reconciliation for measurement across markets and vendors.",
    summary:
      "A governed layer that keeps taxonomy, consent, QA and vendor reconciliation aligned across markets and analytics tools. Every deployment has an owner, a review gate and a reconciliation path back to the source of truth.",
    howItWorks:
      "Structured governance artifacts define the event and taxonomy contract, automated QA compares the live implementation against it, and reconciliation flows align GA4, BigQuery, vendor pixel data and backend truth before reporting decisions are made.",
    imagePath: "/images/solutions/global-measurement-governance-system.svg",
    imageAlt: "Diagram of the global measurement governance system showing taxonomy, QA, and reconciliation loops.",
    liveUrl: "/blog/agentic-web-analytics-implementation",
    lastUpdated: "2026-08-29",
    tech: ["GA4", "GTM", "BigQuery", "consent QA", "taxonomy governance", "reconciliation"],
    repoVisibility: "PRIVATE",
    inclusionReason: "Core of the agency-side measurement practice, described anonymised in the flagship articles.",
    detailLinks: [
      { label: "Agentic web analytics", href: "/blog/agentic-web-analytics-implementation" },
      { label: "Agentic data collection", href: "/blog/agentic-data-collection-and-warehousing" },
      { label: "Measurement reality", href: "/blog/why-browser-consent-and-source-blending-make-marketing-measurement-harder" },
    ],
  },
  {
    slug: "media-qa-attribution-toolkit",
    title: "Media QA and Attribution Reconciliation Toolkit",
    category: "Martech & Measurement",
    tagline: "Tag QA, pixel checks, and attribution reconciliation that survive consent and real browsers.",
    summary:
      "A repeatable toolkit for checking media tags, pixels and attribution claims against what actually fires in the browser, then reconciling the differences back to source data before anyone makes a spend decision.",
    howItWorks:
      "Automated browser QA exercises the real consent journey, records what tags fire, compares observed data against the vendor story, and feeds the reconciliation flows that close the gap between platform-reported and backend-measured conversions.",
    imagePath: "/images/solutions/media-qa-attribution-toolkit.svg",
    imageAlt: "Diagram of the media QA and attribution reconciliation toolkit from browser checks to reconciled reporting.",
    liveUrl: "/blog/proof-not-prompts",
    lastUpdated: "2026-08-29",
    tech: ["browser QA", "tag QA", "attribution", "GA4", "BigQuery", "reconciliation"],
    repoVisibility: "PRIVATE",
    inclusionReason: "Anonymised practitioner workflow, described in the proof and analytics flagships.",
    detailLinks: [
      { label: "Proof, not prompts", href: "/blog/proof-not-prompts" },
      { label: "Consent and measurement", href: "/blog/why-browser-consent-and-source-blending-make-marketing-measurement-harder" },
    ],
  },
  {
    slug: "ai-assisted-product-definition-system",
    title: "AI-Assisted Product Definition System",
    category: "Products & Operational Tools",
    tagline: "Turns messy commercial context into PRDs, plans and scoped decisions.",
    summary:
      "A governed definition pipeline that turns business material into structured product definitions: PRDs, implementation plans and scoped decisions, each traceable back to the source context and reviewable before work starts.",
    howItWorks:
      "Source material from calls, decks and docs is turned into a knowledge layer, then structured PRD and planning flows produce definitions with explicit scope, open questions and decision gates rather than a generic document.",
    imagePath: "/images/solutions/ai-assisted-product-definition-system.svg",
    imageAlt: "Diagram of the AI-assisted product definition system from source material to reviewed PRD.",
    liveUrl: "/blog/ai-for-agency-operations",
    lastUpdated: "2026-08-29",
    tech: ["PRD workflow", "planning flows", "knowledge layer", "review gates", "AI SDK"],
    repoVisibility: "PRIVATE",
    inclusionReason: "Operational workflow used for client-side scoping, described anonymised in the agency article.",
    detailLinks: [
      { label: "Seven agency workflows", href: "/blog/ai-for-agency-operations" },
      { label: "Knowledge systems article", href: "/blog/building-maintainable-knowledge-systems" },
    ],
  },
  {
    slug: "model-routing-performance-lab",
    title: "Model Routing Performance Lab",
    category: "AI & Agent Systems",
    tagline: "Benchmarked provider routing against measured latency, cost and quality.",
    summary:
      "A repeatable benchmark that measures what actually happens when the same work is routed through different models and provider policies, so routing decisions come from data rather than a leaderboard.",
    howItWorks:
      "A controlled harness runs identical tasks across model and provider policies, records client-side timing and provider telemetry, and produces a comparison that separates measured difference from noise.",
    imagePath: "/images/solutions/model-routing-performance-lab.svg",
    imageAlt: "Diagram of the model routing performance lab comparing provider policies on the same task.",
    liveUrl: "/blog/i-made-glm-5-3-flash-faster-but-kept-cheap-routing",
    lastUpdated: "2026-08-28",
    tech: ["OpenRouter", "benchmarking", "GLM-5.3-Flash", "telemetry", "Node.js"],
    repoVisibility: "PRIVATE",
    inclusionReason: "Measured benchmarking work with a public article.",
    detailLinks: [
      { label: "Routing benchmark article", href: "/blog/i-made-glm-5-3-flash-faster-but-kept-cheap-routing" },
      { label: "One door, one account", href: "/blog/one-door-for-every-token" },
    ],
  },
  {
    slug: "local-llm-lab",
    title: "Local LLM Lab",
    category: "AI & Agent Systems",
    tagline: "A measured field guide to every local model installed on Apple Silicon.",
    summary:
      "Local LLM Lab turns installed local model builds and benchmark evidence into a practical guide: what each build is good at, what it costs to run, and where it beats or loses to the cloud.",
    howItWorks:
      "Python scripts inspect live Hugging Face, Ollama, MLX and Apple model inventories, join them to checked-in benchmark results, and generate a static React guide with exact model revisions kept separate from runtime behaviour.",
    imagePath: "/images/solutions/local-llm-lab.svg",
    imageAlt: "Local LLM Lab guide showing the installed-model inventory and measured comparisons.",
    liveUrl: "https://local-llm-lab.vercel.app",
    lastUpdated: "2026-08-20",
    githubUrl: "https://github.com/Rajeev-SG/local-llm-lab",
    tech: ["Python", "React", "Vite", "MLX", "Ollama", "Vercel"],
    repoVisibility: "PUBLIC",
    inclusionReason: "Public GitHub repository with a current production guide.",
    detailLinks: [{ label: "Local model write-up", href: "/blog/how-i-ran-qwen-locally-inside-codex" }],
  },
  {
    slug: "open-gtm-index",
    title: "Open GTM Index",
    category: "Martech & Measurement",
    tagline: "A transparent guide to open-source go-to-market software.",
    summary:
      "Open GTM Index ranks open-source alternatives to common sales, marketing, analytics and support tools, with a documented scoring method and public project facts behind each result.",
    howItWorks:
      "A TanStack Start site presents category leaders, sortable rankings, licence details and the score weights used, all backed by public project metadata and a checked-in source workbook.",
    imagePath: "/images/solutions/open-gtm-index.svg",
    imageAlt: "Open GTM Index site showing category leaders and ranked open-source tools.",
    liveUrl: "https://open-gtm-index.vercel.app",
    lastUpdated: "2026-07-20",
    githubUrl: "https://github.com/Rajeev-SG/open-gtm-index",
    tech: ["TanStack Start", "React 19", "TypeScript", "Nitro", "Vercel"],
    repoVisibility: "PUBLIC",
    inclusionReason: "Public GitHub repository with a live research and ranking site.",
    detailLinks: [],
  },
  {
    slug: "model-intelligence-maintainer",
    title: "Model Intelligence Maintainer",
    category: "AI & Agent Systems",
    tagline: "A workbook and guide comparing model quality, price and provider coverage.",
    summary:
      "A maintained workbook and static guide that answer one practical question: which model should actually be used, for what, and at what cost, based on multiple public benchmark sources.",
    howItWorks:
      "A Python pipeline refreshes and normalises OpenRouter, Artificial Analysis, Vals and LiveBench data into deterministic datasets, a workbook and a deployed static guide, keeping provenance and cohort rules visible.",
    imagePath: "/images/solutions/model-intelligence-maintainer.svg",
    imageAlt: "Model Intelligence guide comparing model presets and recommended fits.",
    liveUrl: "https://openrouter-model-workbook-maintaine.vercel.app",
    lastUpdated: "2026-07-10",
    githubUrl: "https://github.com/Rajeev-SG/openrouter-model-workbook-maintainer-v2",
    tech: ["Python", "OpenRouter", "Artificial Analysis", "LiveBench", "Vercel"],
    repoVisibility: "PUBLIC",
    inclusionReason: "Public GitHub repo with a public guide and checked-in provenance.",
    detailLinks: [],
  },
  {
    slug: "creative-observatory",
    title: "Creative Observatory",
    category: "Products & Operational Tools",
    tagline: "A source-aware workbench for reviewing public ad-library evidence.",
    summary:
      "Creative Observatory keeps brand coverage, creative inspection, trust cues and briefing exports in one analyst workflow, so evidence and the next decision stay together rather than collapsing into a generic dashboard.",
    howItWorks:
      "A Next.js application uses a typed research pipeline, Prisma-backed data contracts and Playwright proof flows, separating stored evidence, live refreshes and demo data so users can see what each conclusion rests on.",
    imagePath: "/images/solutions/creative-observatory.svg",
    imageAlt: "Creative Observatory workbench showing brand controls and the evidence review workflow.",
    liveUrl: "https://creative-observatory.vercel.app",
    lastUpdated: "2026-06-15",
    tech: ["Next.js 15", "Prisma", "Recharts", "Playwright", "Vercel"],
    repoVisibility: "PRIVATE",
    inclusionReason: "Public production workbench with a complete visitor-facing interface.",
    detailLinks: [],
  },
  {
    slug: "hackathon-voting-app",
    title: "Hackathon Voting App",
    category: "Products & Operational Tools",
    tagline: "A production-ready single-screen judging app built for a live hackathon room.",
    summary:
      "One public scoreboard, one manager setup surface, one voting modal for judges, and the proof and resilience work needed for a room to trust it on the day, backed by GA4 and BigQuery event-day reporting.",
    howItWorks:
      "Next.js, Clerk, Prisma and Postgres run the app, with XLSX-driven setup, self-vote blocking, one locked score per judge, a manager-only remaining-votes tracker and a shared analytics layer.",
    imagePath: "/images/solutions/hackathon-voting-app.svg",
    imageAlt: "Hackathon Voting App showing the public scoreboard and consent-aware controls.",
    liveUrl: "https://vote.rajeevg.com",
    lastUpdated: "2026-05-30",
    githubUrl: "https://github.com/Rajeev-SG/hackathon-voting-prototype",
    tech: ["Next.js 14", "Clerk", "Prisma", "Postgres", "GA4", "Playwright"],
    repoVisibility: "PUBLIC",
    inclusionReason: "Public GitHub repo with a live production judging surface.",
    detailLinks: [
      { label: "Build write-up", href: "/blog/how-we-built-the-hackathon-voting-app" },
      { label: "Event-day analytics", href: "/projects/hackathon-voting-analytics/google-analytics" },
    ],
  },
  {
    slug: "agent-orchestra",
    title: "Agent Orchestra",
    category: "AI & Agent Systems",
    tagline: "A demonstrator for orchestrated multi-agent interaction patterns.",
    summary:
      "A public demonstration of what orchestrated agent interaction looks like when a small set of agents coordinate around a shared task rather than a single prompt loop.",
    howItWorks:
      "A demo deployment walks through the coordination pattern, showing what each agent contributes and what the interaction adds over a single-agent run.",
    imagePath: "/images/solutions/agent-orchestra.svg",
    imageAlt: "Agent Orchestra demonstration interface showing orchestrated agent interaction.",
    liveUrl: "https://multi-agent-orchestration-demo.vercel.app",
    lastUpdated: "2026-05-01",
    tech: ["agents", "orchestration", "Next.js", "Vercel"],
    repoVisibility: "PRIVATE",
    inclusionReason: "Public demonstrator kept as a companion to the multi-agent articles.",
    detailLinks: [{ label: "Multi-agent journey", href: "/blog/the-multi-agent-journey-what-survived-contact-with-reality" }],
  },
]

export function getPortfolioProject(slug: string) {
  return portfolioProjects.find((project) => project.slug === slug)
}

const publicProjectOrder = [
  "agent-operations-control-plane",
  "coding-agent-observatory",
  "agent-routing-and-lifecycle-system",
  "global-measurement-governance-system",
  "media-qa-attribution-toolkit",
  "model-routing-performance-lab",
  "local-llm-lab",
  "open-gtm-index",
  "model-intelligence-maintainer",
  "creative-observatory",
  "hackathon-voting-app",
  "agent-orchestra",
] as const

export function getPortfolioProjects() {
  return publicProjectOrder
    .map((slug) => getPortfolioProject(slug))
    .filter((project): project is PortfolioProject => Boolean(project))
}
