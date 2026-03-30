import "server-only"

import fs from "node:fs"
import path from "node:path"
import matter from "gray-matter"

import { posts, type Post } from "#velite"

import { compilePreviewMdx } from "@/lib/content-ops/preview"

type PostSummary = Pick<
  Post,
  "title" | "slug" | "date" | "updated" | "description" | "draft" | "tags" | "excerpt" | "image"
> & {
  sourcePath?: string
}

type RenderablePost = PostSummary & {
  code: string
}

const CONTENT_POSTS_DIRECTORY = path.join(process.cwd(), "content/posts")
const includeDrafts = process.env.NODE_ENV !== "production"

export function isLocalRuntimeOverlayEnabled() {
  return !process.env.VERCEL
}

function walkMarkdownFiles(directory: string): string[] {
  if (!fs.existsSync(directory)) return []

  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name)

    if (entry.isDirectory()) {
      return walkMarkdownFiles(entryPath)
    }

    if (/\.(md|mdx)$/i.test(entry.name)) {
      return [entryPath]
    }

    return []
  })
}

function parseLocalPostSummary(absolutePath: string): PostSummary | null {
  const raw = fs.readFileSync(absolutePath, "utf-8")
  const parsed = matter(raw)
  const fallbackSlug = path.basename(absolutePath, path.extname(absolutePath))
  const slug = String(parsed.data.slug || fallbackSlug)
  const date =
    typeof parsed.data.date === "string" && parsed.data.date.trim()
      ? parsed.data.date.slice(0, 10)
      : new Date().toISOString().slice(0, 10)
  const updated =
    typeof parsed.data.updated === "string" && parsed.data.updated.trim()
      ? parsed.data.updated.slice(0, 10)
      : undefined
  const draft = parsed.data.draft === true

  if (!includeDrafts && draft) return null

  return {
    title: String(parsed.data.title || fallbackSlug),
    slug,
    date,
    updated,
    description: typeof parsed.data.description === "string" ? parsed.data.description : undefined,
    draft,
    tags: Array.isArray(parsed.data.tags) ? parsed.data.tags.map((tag) => String(tag)) : [],
    excerpt: typeof parsed.data.excerpt === "string" ? parsed.data.excerpt : "",
    image: typeof parsed.data.image === "string" ? parsed.data.image : undefined,
    sourcePath: absolutePath,
  }
}

function getLocalPostSummaryBySlug(slug: string) {
  if (!isLocalRuntimeOverlayEnabled()) return null

  const summaries = walkMarkdownFiles(CONTENT_POSTS_DIRECTORY)
    .map((absolutePath) => parseLocalPostSummary(absolutePath))
    .filter((post): post is PostSummary => Boolean(post))

  return summaries.find((post) => post.slug === slug) || null
}

function buildVisiblePostMap() {
  const map = new Map<string, PostSummary>()

  for (const post of posts as Post[]) {
    if (includeDrafts || !post.draft) {
      map.set(post.slug, {
        title: post.title,
        slug: post.slug,
        date: post.date,
        updated: post.updated,
        description: post.description,
        draft: post.draft,
        tags: post.tags ?? [],
        excerpt: post.excerpt,
        image: post.image,
      })
    }
  }

  if (isLocalRuntimeOverlayEnabled()) {
    for (const absolutePath of walkMarkdownFiles(CONTENT_POSTS_DIRECTORY)) {
      const summary = parseLocalPostSummary(absolutePath)
      if (summary) {
        map.set(summary.slug, summary)
      }
    }
  }

  return map
}

export function getVisiblePostsLive() {
  return Array.from(buildVisiblePostMap().values())
}

export function getSortedVisiblePostsLive() {
  return [...getVisiblePostsLive()].sort((a, b) => {
    const aDate = new Date(a.updated || a.date).getTime()
    const bDate = new Date(b.updated || b.date).getTime()
    return bDate - aDate
  })
}

export function getVisiblePostSummaryBySlug(slug: string) {
  return buildVisiblePostMap().get(slug) || null
}

export async function getRenderablePostBySlug(slug: string): Promise<RenderablePost | null> {
  const localSummary = getLocalPostSummaryBySlug(slug)

  if (localSummary?.sourcePath) {
    const raw = await fs.promises.readFile(localSummary.sourcePath, "utf-8")
    const parsed = matter(raw)
    const code = await compilePreviewMdx(parsed.content)

    return {
      ...localSummary,
      code,
    }
  }

  const builtPost = (posts as Post[]).find((post) => post.slug === slug)
  if (!builtPost || (!includeDrafts && builtPost.draft)) {
    return null
  }

  return builtPost
}
