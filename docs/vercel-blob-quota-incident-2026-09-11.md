# Incident: Pareto Frontier stopped auto-updating (Vercel Blob quota)

**Date:** 2026-09-11 · **Impact:** `/solutions/pareto-frontier` served AA quality
data frozen at 2026-09-06; new models (e.g. `deepseek-v4.1-flash`) missing; the
scheduled refresh workflow failing.

## TL;DR

The page was not broken by its own logic. Vercel **suspended every Blob store on
the team** because the Hobby plan's *operation* allowance was exceeded. The Pareto
store was a bystander: **99.5% of the advanced operations came from a different
project**. Storage was never the issue — the whole team stored ~118 KB against a
1 GB allowance.

## What `rajeevg-content-ops` is

The Vercel Blob store attached to the **rajeevg-com** project (id
`store_yNw8X58vSOd1zoJ5`, created 30 Mar 2026, env prefix `BLOB`, connected to
production/preview/development). It was created for the **content-ops media
upload** feature, and later reused for the Pareto snapshot. It held two objects:

| Object | Size |
|---|---|
| `content-ops/D01/…-live-upload-proof.txt` | 51 B |
| `pareto/pareto-aa-fallback.json` | 81.6 KB |

A second, empty store with the same name (`store_tclilg7yAkAoeFJL`) is a
leftover duplicate.

## The numbers (trailing 30 days, Vercel usage API)

Hobby included allowance: **1 GB storage · 10,000 simple ops · 2,000 advanced ops
· 10 GB transfer**, shared across the whole team.

| Metric | Used | Allowance | |
|---|---|---|---|
| Advanced operations | **2,033** | 2,000 | **102% → suspended** |
| Simple operations | **10,089** | 10,000 | **101%** |
| Storage | ~118 KB | 1 GB | 0.01% |
| Data transfer | negligible | 10 GB | — |

Per Vercel's definitions: **advanced operations** = `put()`, `copy()`, `list()`;
**simple operations** = a URL fetch that is a cache MISS, or `head()`.
Hobby does not bill overage — it **blocks Blob access for 30 days**.

## Attribution — who actually spent the allowance

| Store | Project | Advanced ops (30d) | Share |
|---|---|---|---|
| `tokenmaxxing-usage` (`store_x9dvmcXBQpybRe3A`) | agent-usage-observatory | **2,022** | **99.5%** |
| `rajeevg-content-ops` (`store_yNw8X58vSOd1zoJ5`) | rajeevg-com | 10.6 | 0.5% |

Because the Hobby Blob allowance is shared team-wide, that single noisy project
suspended storage for **all** of them — which is how it broke the Pareto refresh.

## Root cause of the overage

A launchd job, `com.rajeev.tokenmaxxing-publisher`, runs
`codex-session-orchestration-analysis/site/publish_public_snapshot` **every 300 s**
(`StartInterval 300`, ≈288 runs/day). Each run ends with:

```sh
vercel blob put … --pathname tokenmaxxing/current.json --allow-overwrite …
```

`put()` is an **advanced operation**. At the current cadence that is
**~8,800 advanced operations/month — roughly 4.4× the Hobby ceiling.** The
trailing average looked lower only because the job ran at a 2-hour interval for
part of the window and was not running at all from 31 Aug–5 Sep.

Simple operations come from cache-busting reads, which are always cache MISSes:

* the publisher's `curl "$PUBLIC_URL?now=$(date +%s)"` (1 per run), and
* the dashboard's `fetch(`${URL}?t=${Date.now()}`)` on every page load.

## Why the page broke the way it did (three compounding faults)

1. **The refresh could not write.** Blob writes returned
   `HTTP 502 {"error":"blob write failed: Vercel Blob: This store has been suspended."}`
   → the workflow failed (run `34585894820`).
2. **The app never read the durable store anyway.** `PARETO_BLOB_URL` was never
   set in Vercel, so `getDurableAaSnapshot()` returned `null` on every request and
   the site always served the **bundled** snapshot. The live API confirmed it:
   `aaFetchedAt: 2026-09-06` (frozen) while `openrouterFetchedAt` was current —
   OpenRouter was fetched live, AA was not.
3. **The bundled snapshot aged out silently.** Nothing regenerated it, so the
   page drifted further behind with every model release.

## Resolution applied

* Pareto delivery moved off Vercel Blob entirely, to a `pareto-data` Git branch
  (`scripts/publish-pareto-data.mjs`), which has no operation quota and is
  excluded from Vercel deployments. See
  [`pareto-frontier-data-pipeline.md`](./pareto-frontier-data-pipeline.md).
* The Blob refresh endpoint and the `PARETO_REFRESH_*` coupling were removed.
* The bundled snapshot was regenerated (adds `deepseek-v4.1-flash`, AA intel 39.5,
  which auto-joins to `deepseek/deepseek-v4.1-flash`).

## Recommended follow-ups (to get the account back within Hobby limits)

We do not need to pay Vercel. The allowance is exceeded by *operations*, not
storage.

1. **Repoint the tokenmaxxing publisher off Blob** — publish
   `tokenmaxxing/current.json` to a Git branch (the same pattern as
   `pareto-data`), or to the Hetzner/Coolify box. This removes ~8,800 advanced
   ops/month on its own.
2. **Stop cache-busting** that publisher's read (`?now=`) and the dashboard's
   `?t=`. Rely on the blob's `Cache-Control` so reads become CDN cache HITs
   (zero metered operations). This is what removes the simple-op pressure.
3. **Delete the duplicate empty `rajeevg-content-ops` store** to reduce clutter.
4. **Keep Blob for nothing critical.** If content-ops media uploads are still
   wanted, they are low-volume and fine — but no scheduled loop should `put()`
   into Blob.
5. Do **not** upgrade to Pro to "fix" this. Blob access unblocks automatically
   30 days after suspension (~11 Oct); with the changes above, usage stays within
   Hobby limits afterwards.
