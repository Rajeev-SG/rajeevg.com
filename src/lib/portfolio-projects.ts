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
      "Workflow Garden turns a fairly opinionated software workflow into something a newcomer can actually browse. It mixes evergreen articles, project pages, concept pages, and a generated activity diary, so the site feels alive rather than frozen in one explanatory moment.",
    howItWorks:
      "The site is built with Next.js and Velite, then fed with generated content from local repo activity. A refresh pipeline creates static JSON and search indices before deploy, which lets Vercel serve the whole thing without runtime access to the local Code workspace.",
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
      "Choice Compass is a small app with a very specific job: help someone compare a few real options without sliding straight into spreadsheet sprawl. It is deliberately simple, fast, and browser-local.",
    howItWorks:
      "The app lets a user define options, add weighted criteria, score each option, and review the winner with a shareable summary. Everything runs in the browser, with `localStorage` handling persistence, so there is no backend to look after.",
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
      "This site is both a public homepage and a small publishing system. It is where I publish writing, explain projects, and turn technical work into something readable for people who were not in the terminal with me.",
    howItWorks:
      "The site runs on Next.js with Velite as a typed content layer, shadcn/ui components for reusable UI, and MDX for long-form posts. That makes it easy to mix structured React components with essays, diagrams, and code-heavy write-ups.",
    liveUrl: "https://rajeevg.com",
    githubUrl: "https://github.com/Rajeev-SG/rajeevg.com",
    tech: ["Next.js", "React 19", "Velite", "MDX", "shadcn/ui", "Tailwind CSS", "Vercel"],
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
