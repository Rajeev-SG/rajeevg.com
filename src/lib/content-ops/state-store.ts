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
}

const FILE_STORE_PATH = path.join(process.cwd(), "data/content-ops/state.json")

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

let adapter: StoreAdapter | null = null

function getAdapter() {
  if (adapter) return adapter

  if (process.env.CONTENT_OPS_DATABASE_URL) {
    adapter = new PostgresStateStore(process.env.CONTENT_OPS_DATABASE_URL)
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
