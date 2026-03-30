import "server-only"

import { randomUUID } from "node:crypto"
import { promises as fs } from "node:fs"
import path from "node:path"

import { put } from "@vercel/blob"

import { buildArticlePath, serializeEditorDocument, type SaveDraftInput } from "@/lib/content-ops/editor"
import type { ContentAssetUpload, PublishEvent } from "@/lib/content-ops/types"

type GitHubFileResponse = {
  content?: {
    sha?: string
    path?: string
  }
  commit?: {
    sha?: string
    html_url?: string
  }
}

export type PublishResult = {
  articlePath: string
  workflowStatus: "merged" | "deployed"
  event: PublishEvent
}

function getGithubRepo() {
  return process.env.CONTENT_OPS_GITHUB_REPO || "Rajeev-SG/rajeevg.com"
}

function getGithubBranch() {
  return process.env.CONTENT_OPS_GITHUB_BRANCH || "main"
}

async function fetchExistingGithubSha(articlePath: string) {
  const response = await fetch(
    `https://api.github.com/repos/${getGithubRepo()}/contents/${encodeURIComponent(articlePath)}?ref=${getGithubBranch()}`,
    {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${process.env.CONTENT_OPS_GITHUB_TOKEN}`,
      },
      cache: "no-store",
    }
  )

  if (response.status === 404) {
    return undefined
  }

  if (!response.ok) {
    throw new Error(`GitHub file lookup failed with ${response.status}`)
  }

  const payload = (await response.json()) as { sha?: string }
  return payload.sha
}

async function publishViaGithub(input: SaveDraftInput) {
  const articlePath = buildArticlePath(input.frontmatter.slug, input.sourcePath)
  const sha = await fetchExistingGithubSha(articlePath)
  const response = await fetch(
    `https://api.github.com/repos/${getGithubRepo()}/contents/${encodeURIComponent(articlePath)}`,
    {
      method: "PUT",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${process.env.CONTENT_OPS_GITHUB_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: `${sha ? "Update" : "Publish"} ${articlePath}`,
        branch: getGithubBranch(),
        content: Buffer.from(serializeEditorDocument(input)).toString("base64"),
        sha,
      }),
      cache: "no-store",
    }
  )

  if (!response.ok) {
    throw new Error(`GitHub publish failed with ${response.status}`)
  }

  const payload = (await response.json()) as GitHubFileResponse
  return {
    articlePath,
    commitSha: payload.commit?.sha,
    commitUrl:
      payload.commit?.html_url ||
      (payload.commit?.sha ? `https://github.com/${getGithubRepo()}/commit/${payload.commit.sha}` : undefined),
    contentSha: payload.content?.sha,
  }
}

async function publishLocally(input: SaveDraftInput) {
  const articlePath = buildArticlePath(input.frontmatter.slug, input.sourcePath)
  const absolutePath = path.join(process.cwd(), articlePath)
  await fs.mkdir(path.dirname(absolutePath), { recursive: true })
  await fs.writeFile(absolutePath, serializeEditorDocument(input), "utf-8")

  return {
    articlePath,
  }
}

export async function publishEditorDocument(input: SaveDraftInput): Promise<PublishResult> {
  if (process.env.CONTENT_OPS_GITHUB_TOKEN) {
    const published = await publishViaGithub(input)
    return {
      articlePath: published.articlePath,
      workflowStatus: "merged",
      event: {
        id: randomUUID(),
        assetId: "",
        type: "published",
        status: "success",
        createdAt: new Date().toISOString(),
        message: "Published repo-backed MDX through the GitHub contents API.",
        details: {
          articlePath: published.articlePath,
          commitSha: published.commitSha,
          commitUrl: published.commitUrl,
        },
      },
    }
  }

  const published = await publishLocally(input)
  return {
    articlePath: published.articlePath,
    workflowStatus: "deployed",
    event: {
      id: randomUUID(),
      assetId: "",
      type: "published",
      status: "success",
      createdAt: new Date().toISOString(),
      message: "Published repo-backed MDX into the local working tree.",
      details: {
        articlePath: published.articlePath,
      },
    },
  }
}

export async function uploadContentAsset({
  assetId,
  file,
}: {
  assetId: string
  file: File
}): Promise<ContentAssetUpload> {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(`content-ops/${assetId}/${Date.now()}-${file.name}`, file, {
      access: "public",
      addRandomSuffix: false,
    })

    return {
      id: randomUUID(),
      assetId,
      filename: file.name,
      contentType: file.type || "application/octet-stream",
      provider: "vercel_blob",
      pathname: blob.pathname,
      url: blob.url,
      size: file.size,
      createdAt: new Date().toISOString(),
    }
  }

  const bytes = Buffer.from(await file.arrayBuffer())
  const uploadDirectory = path.join(process.cwd(), "public/uploads/content-ops", assetId)
  await fs.mkdir(uploadDirectory, { recursive: true })

  const filename = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`
  const absolutePath = path.join(uploadDirectory, filename)
  await fs.writeFile(absolutePath, bytes)

  return {
    id: randomUUID(),
    assetId,
    filename: file.name,
    contentType: file.type || "application/octet-stream",
    provider: "local",
    pathname: `/uploads/content-ops/${assetId}/${filename}`,
    url: `/uploads/content-ops/${assetId}/${filename}`,
    size: file.size,
    createdAt: new Date().toISOString(),
  }
}
