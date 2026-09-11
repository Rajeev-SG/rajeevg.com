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
  truncating it.
* **Validation gates**: a refresh with zero quality-scored models, non-finite
  metrics, or a failed schema check never replaces the durable snapshot.
* **Never-shrink guarantee**: the runtime falls back to the bundled snapshot on
  any durable-read failure, and `getDurableAaSnapshot()` retains its last good
  value rather than caching a failure.
* **Alias discipline**: model identity is resolved by an explicit alias map plus
  exact, deterministic auto-join. Never fuzzy, never LLM, never edit-distance.
