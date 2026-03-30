import "server-only"

import { promises as fs } from "node:fs"
import path from "node:path"
import matter from "gray-matter"
import { unified } from "unified"
import remarkMdx from "remark-mdx"
import remarkParse from "remark-parse"
import { visit } from "unist-util-visit"

import {
  ALLOWED_MDX_COMPONENTS,
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
  editingMode: "rich" | "raw_only"
  editingModeReason: string | null
  richModeSafe: boolean
  unsupportedPatterns: string[]
  componentUsages: string[]
}

const DRAFT_DIRECTORY = path.join(process.cwd(), "data/content-ops/drafts")

function normalizeOptionalString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined
}

function normalizeDateInput(value: unknown) {
  if (!value) return undefined

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10)
  }

  const input = typeof value === "string" ? value.trim() : String(value)
  if (!input) return undefined

  const isoMatch = input.match(/^\d{4}-\d{2}-\d{2}/)
  if (isoMatch) return isoMatch[0]

  const parsed = new Date(input)
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10)
  }

  return undefined
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
  const sourceBasename = sourcePath ? path.basename(sourcePath, path.extname(sourcePath)) : null

  if (
    sourcePath?.startsWith("content/posts/") &&
    !sourcePath.startsWith("content/posts/drafts/") &&
    sourceBasename === slug
  ) {
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
  const reasons = new Set<string>()
  const checks = [
    { label: "MDX exports", match: /^export\s+/m },
    { label: "MDX imports", match: /^import\s+/m },
  ]

  for (const check of checks) {
    if (check.match.test(markdown)) reasons.add(check.label)
  }

  const tree = unified().use(remarkParse).use(remarkMdx).parse(markdown)
  const unsupportedNodeTypes = new Set<string>()

  visit(tree, (node) => {
    switch (node.type) {
      case "code":
        reasons.add("Fenced code blocks")
        return
      case "html":
        reasons.add("HTML blocks")
        return
      case "mdxjsEsm":
        reasons.add("MDX module syntax")
        return
      case "mdxFlowExpression":
      case "mdxTextExpression":
        reasons.add("MDX expressions")
        return
      case "mdxJsxFlowElement":
      case "mdxJsxTextElement": {
        const name = "name" in node ? String(node.name || "") : ""
        if (!name) {
          reasons.add("Unnamed JSX nodes")
          return
        }

        if (name[0] === name[0]?.toLowerCase()) {
          reasons.add("HTML-style JSX blocks")
          return
        }

        if (!ALLOWED_MDX_COMPONENTS.includes(name as (typeof ALLOWED_MDX_COMPONENTS)[number])) {
          reasons.add(`Unknown JSX components: ${name}`)
        }
        return
      }
      case "root":
      case "paragraph":
      case "heading":
      case "text":
      case "emphasis":
      case "strong":
      case "delete":
      case "inlineCode":
      case "blockquote":
      case "list":
      case "listItem":
      case "link":
      case "image":
      case "table":
      case "tableRow":
      case "tableCell":
      case "thematicBreak":
      case "break":
        return
      default:
        unsupportedNodeTypes.add(node.type)
    }
  })

  if (unsupportedNodeTypes.size) {
    reasons.add(`Unsupported nodes: ${Array.from(unsupportedNodeTypes).sort().join(", ")}`)
  }

  return Array.from(reasons)
}

function normalizeFrontmatter(data: Record<string, unknown>, fallbackSlug: string): EditorFrontmatter {
  return {
    title: String(data.title || fallbackSlug),
    slug: String(data.slug || fallbackSlug),
    date: normalizeDateInput(data.date) || new Date().toISOString().slice(0, 10),
    updated: normalizeDateInput(data.updated),
    description: normalizeOptionalString(data.description),
    excerpt: normalizeOptionalString(data.excerpt),
    tags: normalizeTags(data.tags),
    draft: data.draft !== false,
    image: normalizeOptionalString(data.image),
  }
}

function buildEditorCapability(markdown: string) {
  const unsupportedPatterns = getUnsupportedPatterns(markdown)
  const componentValidation = validateAllowedMdxComponents(markdown)

  if (!componentValidation.valid) {
    unsupportedPatterns.push(`Unknown JSX components: ${componentValidation.unknown.join(", ")}`)
  }

  const uniqueUnsupportedPatterns = [...new Set(unsupportedPatterns)]
  const richModeSafe = uniqueUnsupportedPatterns.length === 0 && componentValidation.valid

  return {
    componentUsages: componentValidation.used,
    editingMode: richModeSafe ? ("rich" as const) : ("raw_only" as const),
    editingModeReason: richModeSafe
      ? null
      : `Rich editing is disabled for this document because it includes ${uniqueUnsupportedPatterns.join(", ").toLowerCase()}.`,
    richModeSafe,
    unsupportedPatterns: uniqueUnsupportedPatterns,
  }
}

function parseDocument(raw: string, sourcePath?: string): MdxEditorDocument {
  const parsed = matter(raw)
  const fallbackSlug = sourcePath
    ? path.basename(sourcePath, path.extname(sourcePath))
    : String(parsed.data.slug || "untitled")
  const frontmatter = normalizeFrontmatter(parsed.data as Record<string, unknown>, fallbackSlug)
  const capability = buildEditorCapability(parsed.content)

  return {
    sourcePath,
    articlePath: buildArticlePath(frontmatter.slug, sourcePath),
    slug: frontmatter.slug,
    body: parsed.content.trim(),
    frontmatter,
    editingMode: capability.editingMode,
    editingModeReason: capability.editingModeReason,
    richModeSafe: capability.richModeSafe,
    unsupportedPatterns: capability.unsupportedPatterns,
    componentUsages: capability.componentUsages,
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
  const normalizedFrontmatter = normalizeFrontmatter(frontmatter, frontmatter.slug)
  const capability = buildEditorCapability(body)

  return {
    sourcePath,
    articlePath: buildArticlePath(normalizedFrontmatter.slug, sourcePath),
    slug: normalizedFrontmatter.slug,
    body: body.trim(),
    frontmatter: normalizedFrontmatter,
    editingMode: capability.editingMode,
    editingModeReason: capability.editingModeReason,
    richModeSafe: capability.richModeSafe,
    unsupportedPatterns: capability.unsupportedPatterns,
    componentUsages: capability.componentUsages.length ? capability.componentUsages : getComponentUsages(body),
  }
}

export async function saveDraftDocumentLocally(input: SaveDraftInput) {
  const sourceBasename = input.sourcePath ? path.basename(input.sourcePath, path.extname(input.sourcePath)) : null
  const shouldReuseSourcePath = Boolean(input.sourcePath && sourceBasename === input.frontmatter.slug)
  const draftPath =
    input.sourcePath && shouldReuseSourcePath
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
