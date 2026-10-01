# Pareto Frontier data pipeline

Reference for how `/solutions/pareto-frontier` gets its data, and why it is built
this way. For the incident that forced this design, see
[`vercel-blob-quota-incident-2026-09-11.md`](./vercel-blob-quota-incident-2026-09-11.md).

## Shape

```
GitHub Actions (.github/workflows/refresh-pareto-frontier.yml)
  cron: 17 5,17 * * *          →  refresh twice a day, plus manual dispatch
        │
        ├─ pnpm pareto:refresh            (scripts/refresh-pareto-aa.ts)
        │    ├─ Artificial Analysis  /api/v2/language/models/free   (≤5 pages/run)
        │    ├─ OpenRouter           /api/v1/models
        │    ├─ deterministic alias + exact auto-join (no fuzzy matching)
        │    ├─ validation: ≥1 quality-scored model, finite metrics, zero-quality abort
        │    └─ writes src/data/pareto-aa-fallback.json  (repo-local artefact)
        │
        └─ node scripts/publish-pareto-data.mjs
             └─ upserts pareto-aa-fallback.json on the `pareto-data` branch
                (GitHub Contents API; branch created from main's tip on first run)

Runtime  (src/lib/pareto/aggregate.ts → src/lib/pareto/aa-fallback.ts)
  1. durable  : raw.githubusercontent.com/<repo>/pareto-data/pareto-aa-fallback.json
  2. bundled  : src/data/pareto-aa-fallback.json  (last-known-good, committed rarely)
  OpenRouter is fetched live per request (1h revalidate); Arena is off the critical path.
```

Two snapshots, two jobs:

| Layer | Path | Updated | Purpose |
|---|---|---|---|
| **Durable** | `pareto-data` branch, `pareto-aa-fallback.json` | every refresh (2×/day) | live data the site reads |
| **Bundled** | `src/data/pareto-aa-fallback.json` on `main` | rarely, deliberately | guaranteed render path + test fixture |

## Why Git instead of Vercel Blob

The refresh originally published to Vercel Blob. Blob is metered by
**operation count** on the Hobby plan — 2,000 advanced ops/month (`put`, `copy`,
`list`) and 10,000 simple ops/month — and the team-wide allowance was exhausted,
which suspended **every** Blob store on the team for 30 days and broke this
refresh with `HTTP 502 ... This store has been suspended`.

A Git branch has no per-operation quota, is versioned and auditable, is free,
and — critically — does not have to create a deployment.

## Why this creates no Vercel deployment

`vercel.json` declares:

```json
{ "git": { "deploymentEnabled": { "pareto-data": false } } }
```

* The `pareto-data` branch is created from the tip of `main` and then has exactly
  one file added, so `vercel.json` is present when Vercel evaluates the push.
* `main` is never written to by the refresh, so a data update can never trigger
  the production build that PR #114 set out to remove.

## Operating it

Refresh now (local — writes the repo-local artefact only, never publishes):

```bash
ARTIFICIAL_ANALYSIS_API_KEY_PF=... pnpm pareto:refresh
```

Publish the current artefact to the data branch:

```bash
GITHUB_TOKEN=... node scripts/publish-pareto-data.mjs
```

Required configuration:

| Where | Name | Purpose |
|---|---|---|
| GitHub Actions secret | `ARTIFICIAL_ANALYSIS_API_KEY_PF` | AA free-tier key (100 req/24h) |
| Actions default token | `GITHUB_TOKEN` (`contents: write`) | create/update the `pareto-data` branch |
| Vercel env (optional) | `PARETO_SNAPSHOT_URL` | override the durable snapshot URL |

To move or re-host the durable snapshot, set `PARETO_SNAPSHOT_URL` in Vercel and
change the publish target — no application code changes are required.

## Deliberate limits

* **AA quota**: ≤5 pages/run, 2 runs/day (≈10 requests/day of a 100/24h budget).
  A catalogue larger than the page cap aborts the refresh rather than silently
  truncating it. The workflow also accepts `workflow_dispatch` for manual
  diagnosis; it consumes the same quota, so use it deliberately.
* **Validation gates**: a refresh with zero quality-scored models, non-finite
  metrics, or a failed schema check never replaces the durable snapshot.
* **Completeness gates (gh-198)**: the refresh also aborts when AA-quality
  coverage of the snapshot collapses relative to the upstream catalogue
  (`src/lib/pareto/completeness.ts`: ≥50% coverage, ≥20 scored models by
  default), and the publish step refuses any snapshot whose quality-scored
  count is lower than the one currently live on `pareto-data`. A successful
  timestamp can therefore never mask a materially incomplete catalogue.
* **Never-shrink guarantee**: the runtime falls back to the bundled snapshot on
  any durable-read failure, and `getDurableAaSnapshot()` retains its last good
  value rather than caching a failure.
* **Alias discipline**: model identity is resolved by an explicit alias map plus
  exact, deterministic auto-join. Never fuzzy, never LLM, never edit-distance.

## Freshness vs completeness incident (gh-172 → gh-198)

On 2026-10-01 the dashboard was provably fresh — the twice-daily refresh had
run green 40 minutes earlier — yet three current frontier models were absent.
The refresh log explained it immediately: `aaModels:687 → matchedQuality:66`
(the explicit alias map covered ~10% of the AA catalogue) and
`unmatchedAaCount:621` records silently dropped by the identity layer.

Per-canary classification (all verified against live upstream data):

| Canary | Upstream state (verified 2026-10-01) | Classification | Fixed by |
|---|---|---|---|
| GPT-6 Sol / GPT-6 Luna | AA scored (47.5 / 37.3), OR priced | present (auto-joined) | — |
| Claude Opus 5.5 | AA scored (57.6), OR priced | present | — |
| DeepSeek V4.1 Flash | AA scored (39.5), OR priced | present | — |
| GLM-5.3 Flash | AA scored (41.8), OR priced | present (explicit alias) | — |
| MiMo-V2.6 Pro / Flash | AA scored 46.3 / unevaluated; OR priced | **join miss**: `xiaomi` missing from the auto-join org map | org map + regression tests |
| Grok 4.7 | AA scored (46.5); AA renamed its creator to "SpaceXAI" | **join miss**: creator-name equality broke | AA creator-alias table |
| GLM-5.3 FlashX / Prime | OR priced; **AA has no record** | legitimate exclusion from the quality×cost frontier (no quality source); surfaced in the diagnostics queue | diagnostics |

Root causes fixed:

1. `ORG_BY_OR_SLUG` had no `xiaomi` entry, so Xiaomi models could never
   auto-join even when both sources carried them.
2. AA renamed the xAI creator (`xAI` → `SpaceXAI`), which broke the exact
   creator-name equality for every future xAI model; the join now accepts
   documented creator aliases (`AA_CREATOR_ALIASES` in `auto-discover.ts`).

Structural safeguards added by gh-198:

* **Unmatched/new-model queue**: every refresh publishes
  `pareto-diagnostics.json` next to the snapshot on `pareto-data` — every
  upstream record the join layer could not place, with a machine-readable
  reason (`not_in_alias_map`, `org_unknown`, `creator_name_mismatch`,
  `variant_excluded`). New upstream model ids are therefore always visible
  even when they cannot join yet.
* **Completeness guard**: the refresh fails before publication when AA-quality
  coverage collapses (see `completenessGuard`).
* **Publish never-shrink guard**: `publish-pareto-data.mjs` reads the currently
  published snapshot and refuses a smaller quality-scored catalogue, so the
  last-known-good durable snapshot survives a partial upstream.

### Freshness SLA

Measured end-to-end path: upstream change → next scheduled refresh (cron
`17 5,17 * * *`, ≤12h) → AA+OR fetch and publish (<60s) → `raw.githubusercontent`
CDN (`max-age=300`, ≤5min) → runtime durable read (`next: { revalidate: 3600 }`)
→ page ISR (`revalidate = 3600`). **Worst case upstream-change → published
dashboard ≈ 13–14h; typical ≈ 6h.** The refresh is quota-bound (2 runs/day);
tightening the SLA means raising the schedule, not adding new infrastructure.

### changedetection.io decision (not adopted, with evidence)

The failure was not a trigger problem: the scheduled refresh ran successfully
twice a day, on time, and still dropped 90% of the AA catalogue at the
identity/join step. A tripwire would have detected "the AA models page
changed" and triggered a refresh that would have produced the same incomplete
snapshot. The structured APIs already provide everything the pipeline needs;
the gap was identity resolution plus silent drops, which no trigger layer
fixes. changedetection/RSS remains an optional accelerator if the SLA above is
ever tightened below what the cron schedule delivers, and the existing
intelligence-project deployment could be reused for that — but it is not
added now, and no second corpus is created. The cheaper, more targeted
signals (AA sitemap `lastmod`, OpenRouter `created` timestamps) are already
consumable by the refresh itself if needed.
