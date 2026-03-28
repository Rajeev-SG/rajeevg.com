import "server-only"

import { promises as fs } from "node:fs"
import path from "node:path"
import matter from "gray-matter"

type SaveDraftInput = {
  slug: string
  title: string
  date: string
  updated?: string
  description?: string
  excerpt?: string
  tags: string[]
  draft: boolean
  image?: string
  body: string
  sourcePath?: string
}

export type MdxEditorDocument = {
  sourcePath: string
  slug: string
  body: string
  frontmatter: Record<string, unknown>
  richModeSafe: boolean
  unsupportedPatterns: string[]
}

const DRAFT_DIRECTORY = path.join(process.cwd(), "content/posts/drafts")

function buildFrontmatter(input: SaveDraftInput) {
  const lines = [
    "---",
    `title: ${JSON.stringify(input.title)}`,
    `slug: ${input.slug}`,
    `date: ${input.date}`,
  ]

  if (input.updated) lines.push(`updated: ${input.updated}`)
  if (input.description) lines.push(`description: ${JSON.stringify(input.description)}`)
  lines.push(`tags: [${input.tags.map((tag) => JSON.stringify(tag)).join(", ")}]`)
  lines.push(`draft: ${input.draft ? "true" : "false"}`)
  if (input.image) lines.push(`image: ${input.image}`)
  lines.push("---", "")
  return lines.join("\n")
}

function getUnsupportedPatterns(body: string) {
  const checks = [
    { label: "JSX component blocks", match: /<[A-Z][A-Za-z0-9]*(\s|>)/ },
    { label: "Mermaid diagrams", match: /```mermaid/ },
    { label: "MDX exports", match: /^export\s+/m },
    { label: "MDX imports", match: /^import\s+/m },
  ]

  return checks.filter((check) => check.match.test(body)).map((check) => check.label)
}

export async function loadEditorDocument(sourcePath: string): Promise<MdxEditorDocument> {
  const raw = await fs.readFile(sourcePath, "utf-8")
  const parsed = matter(raw)
  const unsupportedPatterns = getUnsupportedPatterns(parsed.content)

  return {
    sourcePath,
    slug: String(parsed.data.slug ?? path.basename(sourcePath, path.extname(sourcePath))),
    body: parsed.content.trim(),
    frontmatter: parsed.data,
    richModeSafe: unsupportedPatterns.length === 0,
    unsupportedPatterns,
  }
}

export async function saveDraftDocument(input: SaveDraftInput) {
  const draftPath = input.sourcePath
    ? path.isAbsolute(input.sourcePath)
      ? input.sourcePath
      : path.join(process.cwd(), input.sourcePath)
    : path.join(DRAFT_DIRECTORY, `${input.slug}.mdx`)

  await fs.mkdir(path.dirname(draftPath), { recursive: true })
  const content = `${buildFrontmatter(input)}${input.body.trim()}\n`
  await fs.writeFile(draftPath, content, "utf-8")

  return {
    path: draftPath,
    slug: input.slug,
  }
}
