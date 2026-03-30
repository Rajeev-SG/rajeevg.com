import "server-only"

import { promises as fs } from "node:fs"
import path from "node:path"
import matter from "gray-matter"

import {
  getComponentUsages,
  validateAllowedMdxComponents,
} from "@/lib/content-ops/component-registry"
import type { EditorFrontmatter } from "@/lib/content-ops/types"

export type SaveDraftInput = {
  frontmatter: EditorFrontmatter
  body: string
  sourcePath?: string
}

export type MdxEditorDocument = {
  sourcePath?: string
  articlePath: string
  slug: string
  body: string
  frontmatter: EditorFrontmatter
  richModeSafe: boolean
  unsupportedPatterns: string[]
  componentUsages: string[]
}

const DRAFT_DIRECTORY = path.join(process.cwd(), "data/content-ops/drafts")

function normalizeOptionalString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined
}

function normalizeTags(value: unknown) {
  if (Array.isArray(value)) {
    return value
      .map((entry) => String(entry).trim())
      .filter(Boolean)
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean)
  }

  return []
}

export function buildArticlePath(slug: string, sourcePath?: string) {
  if (sourcePath?.startsWith("content/posts/") && !sourcePath.startsWith("content/posts/drafts/")) {
    return sourcePath
  }

  return `content/posts/${slug}.mdx`
}

export function buildFrontmatter(frontmatter: EditorFrontmatter) {
  const lines = [
    "---",
    `title: ${JSON.stringify(frontmatter.title)}`,
    `slug: ${frontmatter.slug}`,
    `date: ${frontmatter.date}`,
  ]

  if (frontmatter.updated) lines.push(`updated: ${frontmatter.updated}`)
  if (frontmatter.description) lines.push(`description: ${JSON.stringify(frontmatter.description)}`)
  lines.push(`tags: [${frontmatter.tags.map((tag) => JSON.stringify(tag)).join(", ")}]`)
  lines.push(`draft: ${frontmatter.draft ? "true" : "false"}`)
  if (frontmatter.excerpt) lines.push(`excerpt: ${JSON.stringify(frontmatter.excerpt)}`)
  if (frontmatter.image) lines.push(`image: ${frontmatter.image}`)
  lines.push("---", "")
  return lines.join("\n")
}

export function serializeEditorDocument({ frontmatter, body }: SaveDraftInput) {
  return `${buildFrontmatter(frontmatter)}${body.trim()}\n`
}

function getUnsupportedPatterns(markdown: string) {
  const checks = [
    { label: "MDX exports", match: /^export\s+/m },
    { label: "MDX imports", match: /^import\s+/m },
  ]

  return checks.filter((check) => check.match.test(markdown)).map((check) => check.label)
}

function normalizeFrontmatter(data: Record<string, unknown>, fallbackSlug: string): EditorFrontmatter {
  return {
    title: String(data.title || fallbackSlug),
    slug: String(data.slug || fallbackSlug),
    date: String(data.date || new Date().toISOString().slice(0, 10)),
    updated: normalizeOptionalString(data.updated),
    description: normalizeOptionalString(data.description),
    excerpt: normalizeOptionalString(data.excerpt),
    tags: normalizeTags(data.tags),
    draft: data.draft !== false,
    image: normalizeOptionalString(data.image),
  }
}

function parseDocument(raw: string, sourcePath?: string): MdxEditorDocument {
  const parsed = matter(raw)
  const fallbackSlug = sourcePath
    ? path.basename(sourcePath, path.extname(sourcePath))
    : String(parsed.data.slug || "untitled")
  const frontmatter = normalizeFrontmatter(parsed.data as Record<string, unknown>, fallbackSlug)
  const unsupportedPatterns = getUnsupportedPatterns(parsed.content)
  const componentValidation = validateAllowedMdxComponents(parsed.content)

  return {
    sourcePath,
    articlePath: buildArticlePath(frontmatter.slug, sourcePath),
    slug: frontmatter.slug,
    body: parsed.content.trim(),
    frontmatter,
    richModeSafe: unsupportedPatterns.length === 0 && componentValidation.valid,
    unsupportedPatterns: [
      ...unsupportedPatterns,
      ...(componentValidation.valid ? [] : [`Unknown JSX components: ${componentValidation.unknown.join(", ")}`]),
    ],
    componentUsages: componentValidation.used,
  }
}

async function readLocalDocument(sourcePath: string) {
  const resolvedPath = path.isAbsolute(sourcePath) ? sourcePath : path.join(process.cwd(), sourcePath)
  const raw = await fs.readFile(resolvedPath, "utf-8")
  return parseDocument(raw, sourcePath)
}

async function readGithubDocument(sourcePath: string) {
  const repo = process.env.CONTENT_OPS_GITHUB_REPO || "Rajeev-SG/rajeevg.com"
  const branch = process.env.CONTENT_OPS_GITHUB_BRANCH || "main"
  const response = await fetch(
    `https://api.github.com/repos/${repo}/contents/${encodeURIComponent(sourcePath)}?ref=${branch}`,
    {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${process.env.CONTENT_OPS_GITHUB_TOKEN}`,
      },
      cache: "no-store",
    }
  )

  if (!response.ok) {
    throw new Error(`GitHub source read failed with ${response.status}`)
  }

  const payload = (await response.json()) as { content?: string; encoding?: string }
  if (!payload.content || payload.encoding !== "base64") {
    throw new Error("GitHub source payload was missing base64 content")
  }

  const raw = Buffer.from(payload.content, "base64").toString("utf-8")
  return parseDocument(raw, sourcePath)
}

export async function loadEditorDocument(sourcePath: string): Promise<MdxEditorDocument> {
  try {
    return await readLocalDocument(sourcePath)
  } catch {
    if (process.env.CONTENT_OPS_GITHUB_TOKEN) {
      return readGithubDocument(sourcePath)
    }

    throw new Error(`Could not load editor document at ${sourcePath}`)
  }
}

export function buildEditorDocumentFromDraft({
  frontmatter,
  body,
  sourcePath,
}: SaveDraftInput): MdxEditorDocument {
  const componentValidation = validateAllowedMdxComponents(body)
  const unsupportedPatterns = getUnsupportedPatterns(body)

  return {
    sourcePath,
    articlePath: buildArticlePath(frontmatter.slug, sourcePath),
    slug: frontmatter.slug,
    body: body.trim(),
    frontmatter,
    richModeSafe: unsupportedPatterns.length === 0 && componentValidation.valid,
    unsupportedPatterns: [
      ...unsupportedPatterns,
      ...(componentValidation.valid ? [] : [`Unknown JSX components: ${componentValidation.unknown.join(", ")}`]),
    ],
    componentUsages: getComponentUsages(body),
  }
}

export async function saveDraftDocumentLocally(input: SaveDraftInput) {
  const draftPath = input.sourcePath
    ? path.isAbsolute(input.sourcePath)
      ? input.sourcePath
      : path.join(process.cwd(), input.sourcePath)
    : path.join(DRAFT_DIRECTORY, `${input.frontmatter.slug}.mdx`)

  await fs.mkdir(path.dirname(draftPath), { recursive: true })
  const content = serializeEditorDocument(input)
  await fs.writeFile(draftPath, content, "utf-8")

  return {
    path: draftPath,
    slug: input.frontmatter.slug,
    articlePath: buildArticlePath(input.frontmatter.slug, input.sourcePath),
  }
}
