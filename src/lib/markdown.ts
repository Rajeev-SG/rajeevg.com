import fs from "node:fs/promises"
import path from "node:path"

import matter from "gray-matter"

import { getVisiblePostSummaryBySlug, getVisiblePostsLive } from "@/lib/server-posts"
import { getPortfolioProjects } from "@/lib/portfolio-projects"
import { site } from "@/lib/site"

type MarkdownPage = { status: number; body: string }

const email = "rajeev.sgill@gmail.com"
const github = "https://github.com/Rajeev-SG"
const linkedin = "https://www.linkedin.com/in/rajeev-gill/"

function canonicalUrl(pathname: string) {
  return `${site.siteUrl.replace(/\/$/, "")}${pathname === "/" ? "" : pathname}`
}

function page(title: string, pathname: string, content: string, status = 200): MarkdownPage {
  return {
    status,
    body: `# ${title}\n\nCanonical: ${canonicalUrl(pathname)}\n\n${content.trim()}\n`,
  }
}

function projectList() {
  return getPortfolioProjects()
    .map((project) => {
      const links = [`[Live site](${project.liveUrl})`]
      if (project.githubUrl) links.push(`[Source](${project.githubUrl})`)
      return `## ${project.title}\n\n**${project.category}.** ${project.tagline}\n\n${project.summary}\n\n${links.join(" | ")}`
    })
    .join("\n\n")
}

function postList() {
  return getVisiblePostsLive()
    .sort((a, b) => new Date(b.updated || b.date).getTime() - new Date(a.updated || a.date).getTime())
    .map((post) => `- [${post.title}](/blog/${post.slug}) - ${post.description || post.excerpt}`)
    .join("\n")
}

function homePage() {
  return page(
    "Rajeev Gill",
    "/",
    `I build practical software around AI, data, analytics, and adtech. My work sits between product thinking and implementation, with a bias toward systems that make real work less messy.

## Selected projects

${getPortfolioProjects()
  .filter((project) => ["open-gtm-index", "local-llm-lab", "hackathon-voting-app"].includes(project.slug))
  .map((project) => `- [${project.title}](${project.liveUrl}) - ${project.tagline}`)
  .join("\n")}

## Recent writing

${postList()}

## Contact

Interested in useful AI, clearer measurement, or software that holds up outside a demo? [Email ${email}](mailto:${email}) or read the [contact page](/contact).`,
  )
}

function aboutPage() {
  return page(
    "About Rajeev Gill",
    "/about",
    `I build practical software around AI, data, analytics, and adtech, usually with one question in mind: does this make the work less messy?

I am more interested in useful systems than AI theatre. The work that keeps my attention is usually somewhere between product thinking and operations: AI-assisted software development, analytics and data platforms, adtech workflows, and tools that help a team stop improvising every week.

This site is where I share the working version of that thinking: shipped projects, practical guides, and honest accounts of what held up once the software was running.

## Elsewhere

- [GitHub](${github})
- [LinkedIn](${linkedin})
- [Email ${email}](mailto:${email})`,
  )
}

function developersPage() {
  return page(
    "Rajeev G. developer resources",
    "/developers",
    `This is the practical index for developers, researchers, and agents trying to understand or cite work published on rajeevg.com.

## Canonical resources

- [Projects](/projects) - public products, source repositories, and live deployments.
- [Writing](/blog) - technical notes and build accounts.
- [GitHub profile](${github}) - public repositories and source history.
- [LinkedIn profile](${linkedin}) - professional profile.
- [Machine-readable site map](/llms.txt) - concise guidance for agents.

## Public interface status

rajeevg.com has no public site-wide API, OAuth, webhooks, or MCP server. Treat the canonical HTML, Markdown negotiation, sitemap, and linked public resources as the supported ways to read this site. Do not infer an undocumented integration from a page or repository.

## Selected live resources

${getPortfolioProjects()
  .filter((project) => project.githubUrl)
  .slice(0, 6)
  .map((project) => `- [${project.title}](${project.liveUrl}) | [GitHub source](${project.githubUrl})`)
  .join("\n")}`,
  )
}

function contactPage() {
  return page(
    "Contact Rajeev Gill",
    "/contact",
    `For project conversations, practical AI and analytics work, collaboration, or questions about something published here, email [${email}](mailto:${email}).

## Useful context to include

- What you are trying to build, measure, or understand.
- The relevant project, article, or live URL.
- The outcome, constraint, or decision you need help with.
- A realistic timeframe if the request is time-sensitive.

I can give a more useful reply when the question includes its context. Please do not send passwords, private customer data, or confidential credentials. For privacy questions or corrections, use the same public email address and mention the relevant page.

You can also review the [projects](/projects), [writing](/blog), [developer resources](/developers), and [privacy policy](/privacy).`,
  )
}

function privacyPage() {
  return page(
    "Privacy policy",
    "/privacy",
    `This site uses consented analytics to understand what people read and interact with. Advertising-related consent stays denied, and analytics storage only turns on after you explicitly allow it.

## What gets collected

- Page views, referrers, device, and viewport context.
- Site interactions such as navigation, searches, tag filters, and scroll depth.
- Consent state changes so measurement reflects your preference.

## What does not happen

- Advertising consent is not enabled through this site.
- Analytics storage is not granted until you opt in.
- Visitor data is not sold through this site.

For privacy questions, requests, or corrections, contact [${email}](mailto:${email}). See the [full HTML privacy policy](/privacy).`,
  )
}

function unknownPage(pathname: string) {
  return page(
    "Page not found",
    pathname,
    `The requested page does not exist. The server returned HTTP 404.

## Find your way

- [Home](/)
- [Projects](/projects)
- [Writing](/blog)
- [Sitemap](/sitemap.xml)
- [Agent guide](/llms.txt)`,
    404,
  )
}

async function getPostMarkdown(slug: string) {
  const sourcePath = path.join(process.cwd(), "content", "posts", `${slug}.mdx`)

  try {
    const source = await fs.readFile(sourcePath, "utf8")
    return matter(source).content.trim()
  } catch {
    return null
  }
}

export async function renderMarkdownPage(pathname: string): Promise<MarkdownPage> {
  const normalizedPath = pathname === "/" ? "/" : pathname.replace(/\/$/, "")
  if (normalizedPath === "/") return homePage()
  if (normalizedPath === "/about") return aboutPage()
  if (normalizedPath === "/projects") return page("Projects", normalizedPath, `Products, research tools, and public systems built, adapted, or operated by Rajeev Gill.\n\n${projectList()}`)
  if (normalizedPath === "/blog") return page("Writing", normalizedPath, `Practical accounts of what I built, what made the work difficult, and what I would do differently next time.\n\n## Published posts\n\n${postList()}`)
  if (normalizedPath === "/privacy") return privacyPage()
  if (normalizedPath === "/contact") return contactPage()
  if (normalizedPath === "/developers") return developersPage()

  if (normalizedPath.startsWith("/blog/")) {
    const slug = normalizedPath.slice("/blog/".length)
    const post = getVisiblePostSummaryBySlug(slug)
    if (post) {
      const postMarkdown = await getPostMarkdown(slug)
      if (postMarkdown) {
        return page(post.title, normalizedPath, `${post.description ? `${post.description}\n\n` : ""}${postMarkdown}\n\n[Back to writing](/blog)`)
      }

      return page(post.title, normalizedPath, `${post.description ? `${post.description}\n\n` : ""}## Summary\n\n${post.excerpt || "This published post is available in its canonical HTML form."}\n\n[Back to writing](/blog)`)
    }
  }

  return unknownPage(normalizedPath)
}
