# Content Ops

## Purpose

The site now has two coordinated surfaces:

- the public site, organised around strategic hubs, proof, playbooks, glossary nodes, and preserved long-form posts
- the internal `/dashboard` surface, which turns the workbook and the existing site archive into an operational content system

The implementation keeps published content repo-backed and MDX-first while moving planning, research, workflow, analytics, and drafting into an app-backed content OS.

## Strategic inputs

The strategic source material is:

- [content-strat.md](/Users/rajeev/Code/rajeevg.com/docs/content-strat.md)
- [ppSEO.md](/Users/rajeev/Code/rajeevg.com/docs/ppSEO.md)
- [rajeevg_master_content_matrix_system_view.xlsx](/Users/rajeev/Code/rajeevg.com/docs/rajeevg_master_content_matrix_system_view.xlsx)

The workbook is imported with:

```bash
python3 scripts/generate_content_ops_workbook.py
```

That script writes:

- [workbook.json](/Users/rajeev/Code/rajeevg.com/src/data/content-ops/workbook.json)

The JSON is the typed seed used by the dashboard tabs. It preserves the workbook's conceptual sheets:

- `Dashboard`
- `Master_Matrix`
- `Title_Decisions`
- `Topic_Graph`
- `Programmatic`
- `Interactive_Assets`
- `Sources`

## Content classification model

Existing public content is audited in [content-audit.ts](/Users/rajeev/Code/rajeevg.com/src/lib/content-ops/content-audit.ts).

Each asset is classified with fields such as:

- `pageClass`
- `pillar`
- `cluster`
- `audienceSegment`
- `intent`
- `discoveryMode`
- `workflowStatus`
- `indexation`
- `relatedIds`
- `parentHubs`
- `nextSteps`

The current classification model supports these strategic roles:

- flagship / pillar
- concept / glossary node
- workflow / playbook
- proof / case study / build log
- interactive asset
- programmatic candidate
- supporting / bridge content
- archive / keep-live but de-emphasize

The audit does not delete existing substance. Instead, it maps each post, dashboard, and portfolio asset into a better graph so the public site can route readers from essays to proof, tools, and next steps.

## Public IA

The public architecture is implemented with these major routes:

- `/` for hub-first discovery
- `/blog` for the preserved article archive organised by strategy
- `/ai`, `/analytics`, `/playbooks`, `/proof` for flagship hub pages
- `/glossary` and `/glossary/[slug]` for concept nodes
- `/projects` plus the existing analytics dashboards for proof and interactive assets

Existing post URLs remain under `/blog/[slug]`. Those articles now include internal next-step modules so they can connect into hubs, glossary nodes, proof assets, and related projects without breaking the original content.

## Storage model

Published content remains repo-backed:

- MD and MDX source lives in [content/posts](/Users/rajeev/Code/rajeevg.com/content/posts)
- Velite compiles it using [velite.config.ts](/Users/rajeev/Code/rajeevg.com/velite.config.ts)

Operational state is separate from published content:

- local default state lives in [state.json](/Users/rajeev/Code/rajeevg.com/data/content-ops/state.json)
- the adapter is implemented in [state-store.ts](/Users/rajeev/Code/rajeevg.com/src/lib/content-ops/state-store.ts)
- production durability can switch to Postgres with `CONTENT_OPS_DATABASE_URL`

The state layer stores:

- workflow status
- derived-content flags
- research packs
- draft metadata

This split keeps repo history authoritative for what ships, while the app can still hold operational editorial state that should not depend on a writable production filesystem.

## Dashboard model

The dashboard entry point is [page.tsx](/Users/rajeev/Code/rajeevg.com/src/app/dashboard/page.tsx) and the primary UI lives in:

- [content-ops-dashboard.tsx](/Users/rajeev/Code/rajeevg.com/src/components/content-ops/content-ops-dashboard.tsx)
- [content-data-table.tsx](/Users/rajeev/Code/rajeevg.com/src/components/content-ops/content-data-table.tsx)
- [content-row-sheet.tsx](/Users/rajeev/Code/rajeevg.com/src/components/content-ops/content-row-sheet.tsx)

Implementation notes:

- shadcn/ui primitives are used for layout, tabs, sheets, cards, buttons, inputs, and badges
- TanStack Table powers the workbook-like grid surfaces
- the `Dashboard` tab uses summary cards instead of a literal sheet dump
- `Master_Matrix` merges imported workbook rows with audited live content so the strategy system can see both planned and existing assets together

Row actions currently support:

- generate research pack
- queue content item
- mark as derived
- open in editor
- view SEO/programmatic suggestions
- view deployment timeline/status

## Editor model

The editor route is:

- `/dashboard/editor/[id]`

The editor is implemented with:

- [editor-shell.tsx](/Users/rajeev/Code/rajeevg.com/src/components/content-ops/editor-shell.tsx)
- [tiptap-editor.tsx](/Users/rajeev/Code/rajeevg.com/src/components/content-ops/tiptap-editor.tsx)
- [editor.ts](/Users/rajeev/Code/rajeevg.com/src/lib/content-ops/editor.ts)

Design choices:

- Tiptap handles common rich-text authoring
- raw MDX mode is always available for advanced authoring
- files containing JSX components, Mermaid, or MDX import/export are forced into raw mode to avoid unsafe round-tripping
- existing frontmatter fields are preserved: `title`, `slug`, `date`, `updated`, `description`, `draft`, `tags`, `excerpt`, `image`, and MDX body content

Draft saving behavior:

- existing repo files save in place when opened through a source path
- new queued ideas save to `content/posts/drafts/<slug>.mdx`

## Workflow model

The operational workflow is:

- `planned`
- `queued`
- `research_ready`
- `in_progress`
- `review`
- `approved`
- `pr_open`
- `merged`
- `deployed`
- `live`
- `blocked`
- `archived`

This workflow is intentionally more operational than the workbook's raw asset-status column. It is what the dashboard and row sheets use to show progress and release readiness.

## Research pack providers

Research generation is abstracted in [research.ts](/Users/rajeev/Code/rajeevg.com/src/lib/content-ops/research.ts).

Supported providers:

- Brave
- OpenRouter
- MiniMax
- local fallback synthesizer

The fallback path is always available and is used when provider credentials are not configured or a remote request fails.

Research packs contain:

- query clusters
- competing angles
- source summaries with URLs
- recommended structure
- risks
- related internal content
- recommended internal links
- SEO suggestions

## Programmatic SEO guardrails

The programmatic system is workbook-driven and approval-gated:

- `Programmatic` workbook rows appear in the dashboard
- suggestions are visible before publication
- state and review happen inside the content workflow rather than publishing directly
- existing content and proof assets are used as grounding so candidates stay bounded and high-delta

The system is designed to avoid thin mass generation or doorway-style page creation. Strategy rows can be queued and researched, but publication still depends on human approval and repo-backed content review.

## Analytics sync

The content OS can enrich assets with Search Console and GA4 data.

GA4:

- [ga4-site-reporting.ts](/Users/rajeev/Code/rajeevg.com/src/lib/ga4-site-reporting.ts)
- used to populate content and blog performance summaries

Search Console:

- [search-console.ts](/Users/rajeev/Code/rajeevg.com/src/lib/content-ops/search-console.ts)
- used for page-level impressions, clicks, CTR, and average position

The content data layer merges those metrics in:

- [data.ts](/Users/rajeev/Code/rajeevg.com/src/lib/content-ops/data.ts)

## Publish and deployment flow

Current implementation split:

- published articles remain repo-backed MDX through Velite
- workflow state and release-timeline visibility live in the dashboard UI
- editor and row sheet surfaces expose approval and timeline status so each asset can move toward a GitHub-based publishing flow

The intended durable production model is:

1. Draft and approve inside the dashboard.
2. Persist operational state in Postgres.
3. Publish by creating or updating repo-backed MDX through GitHub PR flow.
4. Reflect PR, merge, deploy, and live states back onto the same asset record.

The current codebase implements the workflow rails and status surfaces needed for that flow, while keeping the shipped content source of truth in the repository.

## Environment variables

Core site:

```bash
NEXT_PUBLIC_SITE_URL=https://rajeevg.com
NEXT_PUBLIC_HOME_CANONICAL=self
NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX
```

Content ops durability:

```bash
CONTENT_OPS_DATABASE_URL=postgres://...
```

Research providers:

```bash
BRAVE_API_KEY=...
OPENROUTER_API_KEY=...
OPENROUTER_API_URL=https://openrouter.ai/api/v1/chat/completions
OPENROUTER_MODEL=openai/gpt-4o-mini
MINIMAX_API_KEY=...
MINIMAX_API_URL=https://...
```

Search Console:

```bash
GSC_CLIENT_EMAIL=...
GSC_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GSC_SITE_URL=https://rajeevg.com/
```

GA4:

```bash
GA4_PROPERTY_ID=498363924
GA4_SITE_STREAM_ID=11542983613
GA4_SITE_HOSTNAME=rajeevg.com
GA4_SERVICE_ACCOUNT_PATH=/absolute/path/to/service-account.json
```

Alternative GA4 auth is also supported with `GA4_SERVICE_ACCOUNT_JSON` or `GOOGLE_APPLICATION_CREDENTIALS_JSON`.

## Validation

Recommended validation commands:

```bash
pnpm exec tsc --noEmit
pnpm build
pnpm exec playwright test tests/e2e/content-ops-ia.spec.ts
```

The focused Playwright proof writes fresh screenshots under:

- `output/acceptance/content-ops-ia-20260328/local-playwright`

That spec validates:

- homepage hub-first IA
- blog organisation
- article next-step modules
- dashboard tabs and row actions
- editor availability
- desktop and mobile overflow safety
