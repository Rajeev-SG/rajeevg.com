export type PortfolioProject = {
  slug: string
  title: string
  category: string
  tagline: string
  summary: string
  howItWorks: string
  imagePath: string
  imageAlt: string
  liveUrl: string
  githubUrl?: string
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
    tech: ["Next.js 16", "React 19", "AI SDK", "OpenRouter", "Zod", "Motion", "Vercel"],
    repoVisibility: "PRIVATE",
    inclusionReason: "Public production demonstrator with a complete visitor-facing workflow; source remains private.",
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
    githubUrl: "https://github.com/Rajeev-SG/rajeevg.com",
    tech: ["Next.js", "React 19", "Velite", "MDX", "shadcn/ui", "Tailwind CSS", "Vercel"],
    repoVisibility: "PUBLIC",
    inclusionReason: "Public GitHub repo with a public homepage URL.",
    detailLinks: [{ label: "Site analytics", href: "/projects/site-analytics" }],
  },
]

export function getPortfolioProject(slug: string) {
  return portfolioProjects.find((project) => project.slug === slug)
}

const publicProjectOrder = [
  "open-gtm-index",
  "local-llm-lab",
  "hackathon-voting-app",
  "singulyr",
  "creative-observatory",
  "github-canvas-monitor",
  "agent-orchestra",
  "mark-notes",
  "model-intelligence-maintainer",
  "workflow-garden",
  "singulyr-pact",
  "proof-pack",
  "choice-compass",
  "openreview",
  "rajeevg-com",
] as const

export function getPortfolioProjects() {
  return publicProjectOrder
    .map((slug) => getPortfolioProject(slug))
    .filter((project): project is PortfolioProject => Boolean(project))
}
