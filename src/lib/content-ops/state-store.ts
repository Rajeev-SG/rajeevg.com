import "server-only"

import { promises as fs } from "node:fs"
import path from "node:path"
import { Pool } from "pg"

import type { ContentOpsState } from "@/lib/content-ops/types"

const DEFAULT_STATE: ContentOpsState = {
  workflow: {},
  derived: {},
  researchPacks: {},
  drafts: {},
  draftDocuments: {},
  publishEvents: {},
  uploads: {},
}

const FILE_STORE_PATH = path.join(process.cwd(), "data/content-ops/state.json")
const GITHUB_STATE_PATH = "data/content-ops/state.json"

type StoreAdapter = {
  read(): Promise<ContentOpsState>
  write(state: ContentOpsState): Promise<void>
}

class FileStateStore implements StoreAdapter {
  async read() {
    try {
      const file = await fs.readFile(FILE_STORE_PATH, "utf-8")
      return { ...DEFAULT_STATE, ...JSON.parse(file) } as ContentOpsState
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return DEFAULT_STATE
      }
      throw error
    }
  }

  async write(state: ContentOpsState) {
    await fs.mkdir(path.dirname(FILE_STORE_PATH), { recursive: true })
    await fs.writeFile(FILE_STORE_PATH, JSON.stringify(state, null, 2), "utf-8")
  }
}

class PostgresStateStore implements StoreAdapter {
  private pool: Pool

  constructor(connectionString: string) {
    this.pool = new Pool({ connectionString })
  }

  private async ensureTable() {
    await this.pool.query(`
      create table if not exists content_ops_state (
        id text primary key,
        payload jsonb not null,
        updated_at timestamptz not null default now()
      )
    `)
  }

  async read() {
    await this.ensureTable()
    const result = await this.pool.query<{ payload: ContentOpsState }>(
      "select payload from content_ops_state where id = $1",
      ["default"]
    )

    if (!result.rowCount) return DEFAULT_STATE
    return { ...DEFAULT_STATE, ...result.rows[0].payload }
  }

  async write(state: ContentOpsState) {
    await this.ensureTable()
    await this.pool.query(
      `
      insert into content_ops_state (id, payload, updated_at)
      values ($1, $2::jsonb, now())
      on conflict (id)
      do update set payload = excluded.payload, updated_at = now()
    `,
      ["default", JSON.stringify(state)]
    )
  }
}

type GithubContentsResponse = {
  sha?: string
  content?: string
  encoding?: string
}

class GitHubStateStore implements StoreAdapter {
  private repo = process.env.CONTENT_OPS_GITHUB_REPO || "Rajeev-SG/rajeevg.com"
  private sourceBranch = process.env.CONTENT_OPS_GITHUB_BRANCH || "main"
  private stateBranch = process.env.CONTENT_OPS_STATE_BRANCH || "content-ops-state"
  private token = process.env.CONTENT_OPS_GITHUB_TOKEN || ""

  private async request<T>(input: string, init?: RequestInit) {
    const response = await fetch(`https://api.github.com${input}`, {
      ...init,
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
        ...(init?.headers || {}),
      },
      cache: "no-store",
    })

    if (!response.ok) {
      const body = await response.text().catch(() => "")
      throw new Error(`GitHub state request failed with ${response.status}${body ? `: ${body}` : ""}`)
    }

    return (await response.json()) as T
  }

  private async ensureBranch() {
    const refPath = `/repos/${this.repo}/git/ref/heads/${this.stateBranch}`
    const baseRefPath = `/repos/${this.repo}/git/ref/heads/${this.sourceBranch}`

    const branchResponse = await fetch(`https://api.github.com${refPath}`, {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${this.token}`,
      },
      cache: "no-store",
    })

    if (branchResponse.ok) return
    if (branchResponse.status !== 404) {
      throw new Error(`GitHub state branch lookup failed with ${branchResponse.status}`)
    }

    const baseRef = await this.request<{ object?: { sha?: string } }>(baseRefPath)
    const sha = baseRef.object?.sha
    if (!sha) {
      throw new Error("Could not resolve the base branch SHA for the content ops state branch.")
    }

    await this.request(`/repos/${this.repo}/git/refs`, {
      method: "POST",
      body: JSON.stringify({
        ref: `refs/heads/${this.stateBranch}`,
        sha,
      }),
    })
  }

  private async readFile() {
    await this.ensureBranch()

    const response = await fetch(
      `https://api.github.com/repos/${this.repo}/contents/${encodeURIComponent(GITHUB_STATE_PATH)}?ref=${this.stateBranch}`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${this.token}`,
        },
        cache: "no-store",
      }
    )

    if (response.status === 404) return null
    if (!response.ok) {
      const body = await response.text().catch(() => "")
      throw new Error(`GitHub state read failed with ${response.status}${body ? `: ${body}` : ""}`)
    }

    return (await response.json()) as GithubContentsResponse
  }

  async read() {
    const payload = await this.readFile()
    if (!payload?.content || payload.encoding !== "base64") {
      return DEFAULT_STATE
    }

    const parsed = JSON.parse(Buffer.from(payload.content, "base64").toString("utf-8")) as ContentOpsState
    return { ...DEFAULT_STATE, ...parsed }
  }

  async write(state: ContentOpsState) {
    const existing = await this.readFile()
    await this.request(`/repos/${this.repo}/contents/${encodeURIComponent(GITHUB_STATE_PATH)}`, {
      method: "PUT",
      body: JSON.stringify({
        message: "content-ops: persist hosted editorial state",
        branch: this.stateBranch,
        content: Buffer.from(JSON.stringify(state, null, 2)).toString("base64"),
        sha: existing?.sha,
      }),
    })
  }
}

let adapter: StoreAdapter | null = null

function getAdapter() {
  if (adapter) return adapter

  if (process.env.CONTENT_OPS_DATABASE_URL) {
    adapter = new PostgresStateStore(process.env.CONTENT_OPS_DATABASE_URL)
    return adapter
  }

  if (process.env.VERCEL && process.env.CONTENT_OPS_GITHUB_TOKEN) {
    adapter = new GitHubStateStore()
    return adapter
  }

  adapter = new FileStateStore()
  return adapter
}

export async function readContentOpsState() {
  return getAdapter().read()
}

export async function writeContentOpsState(state: ContentOpsState) {
  return getAdapter().write(state)
}

export async function updateContentOpsState(
  updater: (state: ContentOpsState) => ContentOpsState | Promise<ContentOpsState>
) {
  const current = await readContentOpsState()
  const next = await updater(current)
  await writeContentOpsState(next)
  return next
}
