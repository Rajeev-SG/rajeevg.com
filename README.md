# rajeevg.com

My personal site: essays, engineering write-ups, and a few live dashboards that
run on real data. It is also the place where I work out how to build software
with AI agents, so parts of the build are unusual on purpose.

**Live:** https://rajeevg.com
**Repo:** https://github.com/Rajeev-SG/rajeevg.com

## What is on the site

| Route | What it is |
| --- | --- |
| [`/blog`](https://rajeevg.com/blog) | Essays and playbooks. 40+ posts, filterable by tag. |
| [`/solutions`](https://rajeevg.com/solutions) | Engineering write-ups, plus live dashboards. |
| [`/solutions/pareto-frontier`](https://rajeevg.com/solutions/pareto-frontier) | The LLM Pareto frontier. Auto-updating quality-vs-cost chart built from Artificial Analysis and OpenRouter data. |
| [`/projects`](https://rajeevg.com/projects) | Portfolio, with links to the repos and live URLs. |
| [`/projects/hackathon-voting-analytics`](https://rajeevg.com/projects/hackathon-voting-analytics) | Voting analytics, backed by BigQuery. |
| [`/projects/site-analytics`](https://rajeevg.com/projects/site-analytics) | GA4 dashboard for this site. |
| [`/ai`](https://rajeevg.com/ai), [`/analytics`](https://rajeevg.com/analytics), [`/playbooks`](https://rajeevg.com/playbooks), [`/proof`](https://rajeevg.com/proof) | Topic hubs that group related writing. |
| [`/glossary`](https://rajeevg.com/glossary) | Concept definitions, one page per term. |
| `/dashboard` | The content CMS. Access-gated, not public. |

The Pareto frontier is the one page with a real data pipeline behind it, so it
gets its own section below.

## How it is built

- **Next.js 15** (App Router, Turbopack) with **React 19**.
- **Tailwind CSS v4** plus **shadcn/ui** for components.
- **Velite** turns Markdown/MDX in `content/posts/` into typed data. Animations
  via **Shiki** (code highlighting) and client-side **Mermaid** diagrams.
- **TypeScript** throughout.

```bash
pnpm install
pnpm dev            # dev server + Velite in watch mode
pnpm build          # production build (runs Velite first)
pnpm content        # rebuild content data only
pnpm pareto:refresh # refresh the Pareto dataset (see below)
```

Put analytics or content-OS keys in `.env.local`. The site runs fine without
any of them; only the features that need a key will be unavailable.

## The Pareto frontier pipeline

This page is the interesting one: it updates itself twice a day with no deploy.

```
GitHub Actions: refresh-pareto-frontier.yml   (05:17 and 17:17 UTC, or manual)
  |
  +-- pnpm pareto:refresh           scripts/refresh-pareto-aa.ts
  |     reads Artificial Analysis (quality) and OpenRouter (price),
  |     joins them by exact model identity, refuses to emit a bad snapshot,
  |     writes src/data/pareto-aa-fallback.json
  |
  +-- node scripts/publish-pareto-data.mjs
        commits that file to the `pareto-data` branch

Your browser
  reads the `pareto-data` branch, falls back to the bundled JSON if that fails
```

Two copies of the data, on purpose:

- **`pareto-data` branch** is what the live site reads. It is refreshed twice a
  day and never triggers a deployment.
- **`src/data/pareto-aa-fallback.json`** on `main` is the last-known-good copy.
  It is committed rarely, by hand, and is what the site shows if the branch
  read fails.

You can see the data yourself:
[`pareto-data` branch](https://github.com/Rajeev-SG/rajeevg.com/blob/pareto-data/pareto-aa-fallback.json)
· [raw file](https://raw.githubusercontent.com/Rajeev-SG/rajeevg.com/pareto-data/pareto-aa-fallback.json)
· [refresh runs](https://github.com/Rajeev-SG/rajeevg.com/actions/workflows/refresh-pareto-frontier.yml)

**How it breaks, and what you would see.** Each of these has actually happened:

- **The Artificial Analysis key runs out of quota.** It is a free tier with a
  100-requests-per-24h limit, and the refresh is capped at 5 pages per run, so
  this is unlikely but not impossible. The refresh aborts rather than writing a
  partial dataset, so the previous snapshot stays up.
- **A data source changes shape.** If Artificial Analysis or OpenRouter rename a
  field, the refresh fails loudly instead of silently publishing nonsense. New
  models that do not match an existing alias simply do not appear, which is the
  failure mode you are most likely to notice: the page looks fine but is missing
  a model.
- **The `pareto-data` branch goes missing.** The site silently falls back to the
  bundled JSON on `main`, so the page keeps working but slowly goes stale. If
  the page looks frozen, compare the two timestamps on
  [`/api/solutions/pareto-frontier/data`](https://rajeevg.com/api/solutions/pareto-frontier/data).
- **Vercel stops deploying the branch.** That is intentional. `vercel.json` sets
  `git.deploymentEnabled` for `pareto-data` to `false`, so a data update never
  triggers a build. If that setting is removed, every refresh would deploy.

The full rationale, including why this used to run on Vercel Blob and no longer
does, is in
[docs/pareto-frontier-data-pipeline.md](./docs/pareto-frontier-data-pipeline.md)
and [docs/vercel-blob-quota-incident-2026-09-11.md](./docs/vercel-blob-quota-incident-2026-09-11.md).

## The article CI

`.github/workflows/article-local-ci.yml` runs on a self-hosted macOS runner when
a post changes. It installs from the lockfile, runs the vitest suite and a
production build, then drives a real browser against the new article and checks
it against the deployed copy. Screenshots from the run are uploaded as
artifacts. It is deliberately heavier than a normal lint-and-test job, because a
broken article is a reader-facing failure and I would rather catch it before
merge than after.

## The content OS

`/dashboard` is a small CMS for the writing: it tracks titles, status,
classification and research, and publishes MDX straight to this repo through the
GitHub contents API.

- The strategy source of truth is the workbook in `docs/`, imported into typed
  app data by `scripts/generate_content_ops_workbook.py`.
- Workflow state lives in Postgres (`CONTENT_OPS_DATABASE_URL`) or on a dedicated
  `content-ops-state` branch (`CONTENT_OPS_GITHUB_TOKEN`).
- Drafts are saved outside the published content tree so slugs cannot collide.
- Media uploads use Vercel Blob (`BLOB_READ_WRITE_TOKEN`). This is the only thing
  on the site that still uses Blob, and it is user-triggered, not scheduled.

Details: [docs/content-ops.md](./docs/content-ops.md).

## Analytics

Google Tag Manager (`GTM-K2VRQS47`) delivers to GA4 (`G-675W3V0C78`), with a raw
BigQuery export. The site pushes a structured `dataLayer` contract rather than
relying on generic click events, and Google Consent Mode defaults to denied until
a visitor makes a choice.

Details: [docs/analytics.md](./docs/analytics.md) and
[docs/google-tagging-stack.md](./docs/google-tagging-stack.md).

## Where things live

```text
src/app/          routes (blog, solutions, projects, dashboard, api)
src/components/   UI, including the Pareto dashboard and MDX renderers
src/lib/          data access, analytics, content-ops logic
content/posts/    the writing, as MDX
docs/             the deep reference material
scripts/          refresh + publish jobs and diagram generators
.github/workflows/ the two automations described above
```

## Documentation

- [Pareto data pipeline](./docs/pareto-frontier-data-pipeline.md)
- [Vercel Blob quota incident (2026-09-11)](./docs/vercel-blob-quota-incident-2026-09-11.md)
- [Content OS](./docs/content-ops.md)
- [Analytics](./docs/analytics.md) · [tagging stack](./docs/google-tagging-stack.md)
- [Content strategy](./docs/content-strat.md) · [programmatic SEO](./docs/ppSEO.md)

## Notes for future me

- **Do not put a scheduled `put()` loop on Vercel Blob.** Blob is billed per
  operation on the Hobby plan, two thousand `put`/`copy`/`list` calls a month
  across the whole account. A five-minute publisher burned through that in a
  fortnight and Vercel suspended every Blob store on the team for thirty days,
  which took down the Pareto refresh as collateral. Scheduled data jobs write to
  a Git branch instead.
- **The `pareto-data` branch is data, not code.** It is force-updated on every
  refresh and is not meant to be read as history.
- **Model identity is matched exactly.** The alias map in
  `src/data/model-aliases.json` plus a deterministic auto-join. No fuzzy
  matching, no edit distance. If a model is missing from the page, add it there.
