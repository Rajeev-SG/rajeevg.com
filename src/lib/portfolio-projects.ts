export type PortfolioProject = {
  slug: string
  title: string
  category: string
  tagline: string
  summary: string
  howItWorks: string
  liveUrl: string
  githubUrl: string
  tech: string[]
  repoVisibility: "PUBLIC"
  inclusionReason: string
}

export const portfolioProjects: PortfolioProject[] = [
  {
    slug: "workflow-garden",
    title: "Workflow Garden",
    category: "Education product",
    tagline: "A public learning site for issue-driven AI development workflows.",
    summary:
      "Workflow Garden turns a fairly opinionated software workflow into something a newcomer can browse. It mixes evergreen articles, project pages, concept pages, and a generated activity diary so the site feels like a living system instead of a static explainer.",
    howItWorks:
      "The site is built with Next.js and Velite, then enriched with generated content from local repo activity. A refresh pipeline creates static JSON and search indices before deploy, so Vercel can serve everything without needing runtime access to the local Code workspace.",
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
      "Proof Pack is for the moment right before launch, when a page technically works but still needs someone to say whether the hierarchy is clear, the mobile layout makes sense, and the whole thing feels ready to ship.",
    howItWorks:
      "A user submits a public URL and the app assembles a review pack focused on clarity, accessibility, mobile risk, and practical next steps. The product itself is intentionally lightweight, but it is backed by the same proof-minded workflow it recommends.",
    liveUrl: "https://proof-pack.vercel.app",
    githubUrl: "https://github.com/Rajeev-SG/proof-pack",
    tech: ["Next.js", "React 19", "Tailwind CSS", "Vitest", "Vercel"],
    repoVisibility: "PUBLIC",
    inclusionReason: "Public GitHub repo with a public homepage URL.",
  },
  {
    slug: "choice-compass",
    title: "Choice Compass",
    category: "Decision tool",
    tagline: "A weighted decision helper for comparing a small set of options.",
    summary:
      "Choice Compass is a small app with a very specific job: help someone compare a few real options without drifting into spreadsheet sprawl. It is deliberately simple, fast, and browser-local.",
    howItWorks:
      "The app lets a user define options, add weighted criteria, score each option, and review the winner with a shareable summary. Everything runs in the browser, with localStorage handling persistence so there is no backend to maintain.",
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
      "This project pulls together model metadata and benchmark signals from multiple sources, then turns them into a maintainable workbook and a static guide for answering a common practical question: which model should I actually use?",
    howItWorks:
      "A Python pipeline refreshes and normalizes OpenRouter, Artificial Analysis, Vals, and LiveBench data into deterministic datasets, a workbook, and a deployed static site. The repo keeps provenance, cohort rules, and mapping diagnostics visible instead of hiding the hard parts.",
    liveUrl: "https://openrouter-model-workbook-maintaine.vercel.app",
    githubUrl: "https://github.com/Rajeev-SG/openrouter-model-workbook-maintainer-v2",
    tech: ["Python", "uv", "OpenRouter", "Artificial Analysis", "Vals", "LiveBench", "Vercel"],
    repoVisibility: "PUBLIC",
    inclusionReason: "Public GitHub repo with a public homepage URL.",
  },
  {
    slug: "rajeevg-com",
    title: "rajeevg.com",
    category: "Publishing system",
    tagline: "The personal site and publishing system behind this portfolio.",
    summary:
      "This site is both a public homepage and a small content system. It is where I publish writing, explain projects, and package technical work in a way that is readable for someone who was not in the terminal with me.",
    howItWorks:
      "The site runs on Next.js with Velite as a typed content layer, shadcn/ui components for reusable UI, and MDX for long-form posts. That makes it easy to mix structured React components with essays, diagrams, and code-heavy writeups.",
    liveUrl: "https://rajeevg.com",
    githubUrl: "https://github.com/Rajeev-SG/rajeevg.com",
    tech: ["Next.js", "React 19", "Velite", "MDX", "shadcn/ui", "Tailwind CSS", "Vercel"],
    repoVisibility: "PUBLIC",
    inclusionReason: "Public GitHub repo with a public homepage URL.",
  },
  {
    slug: "blog",
    title: "Markdown Blog",
    category: "Legacy app",
    tagline: "An earlier markdown-powered blog built with Express and EJS.",
    summary:
      "This is the older blog project in the workspace: simpler, more traditional, and a good reference point for how my publishing stack has evolved over time.",
    howItWorks:
      "Markdown files are rendered by an Express app using EJS templates, while Highlight.js handles code blocks. It is straightforward server-rendered publishing without the content layer and component model used on the newer site.",
    liveUrl: "https://blog-vr7a.vercel.app/",
    githubUrl: "https://github.com/Rajeev-SG/blog",
    tech: ["Node.js", "Express", "EJS", "Markdown", "Highlight.js", "Vercel"],
    repoVisibility: "PUBLIC",
    inclusionReason: "Public GitHub repo with a public homepage URL.",
  },
]

export function getPortfolioProjects() {
  return portfolioProjects
}

export function getPortfolioProject(slug: string) {
  return portfolioProjects.find((project) => project.slug === slug)
}
