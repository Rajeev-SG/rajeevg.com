# Editorial & Deployment Audit — rajeevg.com

Task: `rajeevg/article-agent-systems-v2`
Packet SHA-256: `0c3260edd5229f74d71cc555778a6a3959da949f239799b76297ee8be1ff9b4f`
Scope: `/Users/rajeev/Code/rajeevg.com` only for site conventions and deployment.
Explicit exclusion: `src/data/content-ops/workbook.json` is historical planning data and is not a source for this article.
Audit type: read-only. Evidence gathered 2026-08-11.

## 1. Repository shape and tech stack

- **Framework:** Next.js 15 (App Router, Turbopack), React 19, TypeScript.
- **Content layer:** Velite compiles `content/posts/*` (`.mdx`/`.md`) from `velite.config.ts` producing `.velite` + `public/static`; alias `#velite`.
- **Styling:** Tailwind CSS v4, `@tailwindcss/typography` (`.prose`), dark mode via `next-themes`.
- **Code:** `rehype-pretty-code` + Shiki (github-light/dark), `MdxPre` copy button, `rehype-autolink-headings`; `remark-gfm`, `rehype-slug`.
- **Diagrams:** `mermaid` + `rehype-mermaid` (blog MDX supports ` ```mermaid ` blocks).
- **SEO:** `next/font` Geist; metadata in `src/app/layout.tsx`; post route at `src/app/blog/[slug]/page.tsx` adds canonical, OG article tags, JSON-LD `Article`, uses optional frontmatter `image`, falls back to `defaultOgImage`.

## 2. Article location and frontmatter convention

Posts live at `content/posts/<slug>.mdx`. Frontmatter fields used across recent posts:

- `title`, `slug`, `date` (YYYY-MM-DD), optional `updated`, `description` (single plain-English sentence), `tags` (kebab list), `draft: false`, optional `image` (absolute path under `public/images/blog/<topic>/…`).

Representative posts inspected:
- `content/posts/how-i-built-an-openrouter-backed-ai-team.mdx` (flagship, published 2026-08-04 — the closest analogue to the new Codex-subagent article)
- `content/posts/how-i-ran-qwen-locally-inside-codex.mdx` (beginner build guide, 2026-08-03)
- `content/posts/from-ai-pilots-to-business-value.mdx`, `how-we-finished-the-ga4-property-setup-on-rajeevg.com.mdx`, `how-we-built-a-consented-first-party-analytics-stack.mdx`

Media convention: images are per-article directories under `public/images/blog/<topic-slug>/`; e.g. `public/images/blog/multi-agent/openrouter-multi-agent-hero.png`, `public/images/blog/local-qwen-codex/model-selector.png`. Stimme: hero + inline `ArticleFigure` figures. A hero is expected for category-topping posts.

## 3. Available MDX components (editorial vocabulary)

Registered in `src/components/mdx-components.tsx` and mirrored in `src/lib/content-ops/component-registry.ts` (allowed set for the in-app MDXEditor):

- `ArticleFigure` — `src`, `alt`, `eyebrow`, `title`, `caption`. Used for hero / evidence figures.
- `ArticleExplain` — `term` + body for inline plain-language definitions (glossary-style in-context explainers).
- `WorkflowFrame` — `eyebrow`, `title`, `tone` wrapper holding ordered steps (used heavily in the Qwen guide).
- `TerminalLine` / `TerminalNote` — scripted terminal UIs inside `WorkflowFrame`.
- `ReviewPill` — accent pills.
- Tailwind `flex`/`badge` chips — a row of colored `span` tag pills directly under the frontmatter (`flex flex-wrap gap-2` with sky/emerald/amber accent classes). This is the standard opening element of long-form posts.
- `ProjectSpotlight`, shadcn `Alert`, `Separator`, and `Table` components.

## 4. Structure, voice, and claim conventions (from flagship posts + docs)

From the two recent Codex-family flagships and `docs/content-strat.md` / `docs/content-ops.md` / `.impeccable.md`:

- **Positioning:** "useful systems, not AI theatre", "work that survives contact with implementation". Brand personality per `.impeccable.md`: practical, candid, assured; plain-spoken and **evidence-led**; never promotional; avoid neon AI styling.
- **Audience (Segment A/D):** AI-for-work operators and tech leaders who distrust hype and generic prompting advice; trust checklists, failure modes, reproducible examples, quantified numbers, and caveats.
- **Recommended flagship essay ingredients** (`docs/content-strat.md`): sharp thesis, a decision framework, explicit **failure modes**, and references to your own tools/projects/builds as proof. Candidates matching this topic: "context/token economics for real teams", "tool vs agent vs automation", "AGENTS.md / MCP / tool maps".
- **Narrative arc observed in `how-i-built-an-openrouter-backed-ai-team.mdx`:**
  1. Hook: named the expensive habit (the lead reading everything).
  2. "The short version" — a four-card "lead / text workers / visual worker / working limit" grid.
  3. Why tokens/context become a cost problem (concept explainers via `ArticleExplain`).
  4. Old flow vs new flow (a two-column before/after comparison box).
  5. Mermaid architecture diagram of the delegation flow.
  6. "How this changes the bill" — boundary/what-lead-receives box; explicit "no magic removal of cost".
  7. **Historical evidence** — stat cards with real measured numbers (257.5m tokens workload, 13 context windows, 1,581 calls, 5.67 MB tool output) each labelled as *measurement/evidence, not an invoice total*.
  8. **Reliability matters more than a clever diagram** — numbered operating rules.
  9. **Acceptance result** block (e.g. "108 / 108 tests passed").
  10. **"What this proves, and what it does not"** — explicit two-column supported-vs-unsupported list.
  11. Personal take ("The part I like most") — honest, qualitative.
  12. Forward-looking note about measurement; related-post link.
- **Caveat discipline (critical, recurring):** claims are explicitly separated into "what I can support" vs "what I cannot support yet". The article refuses to publish a fake percentage/cash saving without repeatable comparable sessions. Terminology like "workload evidence, not an invoice total" and "an approximation, not a provider billing figure" is used. This "categorise claims by certainty" is a named strategic principle in `docs/content-strat.md`.
- **Sources section:** long-form technical posts end with a `## Sources` list of real external links (docs, repos, model cards, issue/PR numbers). The Qwen guide ends with a "What was verified", "limits", "what I learned", and "sources" trio.
- **Verification-first:** quantitative/setup claims cite exact tested versions, hardware config (e.g., Apple M5 Pro, 48 GB), and the local test suites that passed. Never assert an unverified environment.

## 5. Build / test / deploy / live-verify commands

From `package.json`, `README.md`, `playwright.config.ts`, and `.vercel`:

- **Build:** `pnpm build` (runs `velite --clean && next build`) — also `pnpm content` (`velite --clean`) to regenerate content layer, `pnpm dev` (`next dev --turbopack`) for local dev with Velite watch.
- **Lint:** `pnpm lint` (`next lint`).
- **Tests:** Playwright — config at `playwright.config.ts`; specs under `tests/` (e.g. `tests/e2e/projects-dashboard-audit.spec.ts`); run via `npx playwright test`. Result artifacts under `test-results/` and screenshots under `output/…`.
- **Deploy:** Vercel project at `.vercel/` (project.json). Standard flow: commit → push to `main` → Vercel preview/prod build. Recent publish commit is `2b426c6 "SITE-ARTICLE: publish OpenRouter multi-agent article"` (added the `.mdx` + hero `.png` only — a minimal publish footprint).
- **Live verification pattern:** repository has a `.playwright-cli/` history and `output/playwright/<descriptor>/…` screenshots at desktop/tablet/mobile widths plus dark-mode and Mermaid renders — the team's norm is screenshot-verified live QA across breakpoints before/after ship. See `acceptance-proof`/`qa-only` runbooks (not rajeevg-internal) for the browser-captain pattern; locally the site is verified at `http://localhost:3000` then against the production Vercel URL.

Recommended local check sequence for a new article only (no deploy in this packet):
1. `pnpm content` (or rely on build) to regenerate Velite/typed content.
2. `pnpm build` to catch MDX/frontmatter/type errors; if the article drafts, set `draft: true` and confirm Velite excludes it.
3. `pnpm lint`.
4. `pnpm dev` and open `/blog/<slug>` at 3000; use Playwright to capture desktop/tablet/mobile + dark-mode screenshots (see existing `output/playwright/` style) and verify the Mermaid diagram renders (dark-mode Mermaid had a past fix commit `bda4558`).

## 6. Recommendations for the new "Codex subagent system" article

Structure (mirroring the proven `openrouter-multi-agent` flagship — its direct successor):

1. Frontmatter: unique `slug`, `date` (current), `description` as one plain sentence, `tags` (include `codex`, `multi-agent`, `agents`, `delegation`, `openrouter`), `image` hero at `public/images/blog/codex-subagent-system/…png`.
2. Opening tag-chip row.
3. `ArticleFigure` hero + a hook naming the concrete problem (delegation/context economics).
4. "The short version" card grid (roles: lead, text workers, visual worker, queue/limits) using the same four-card grid style.
5. Concept explainers (`ArticleExplain` for token, context, worker, checkpoints, queue, lease).
6. Before/after two-column comparison (that it works vs. where it broke / without delegation).
7. Mermaid flowchart of the delegation loop (lead → workers → lead with evidence).
8. Operating rules (bounded packet, evidence not "done", replacement on stall, immediate close).
9. **Evidence section with real measured numbers** held to the site's standard: label everything as measurement, never an invoice/percentage figure unless backed by repeatable runs. If only one session exists, say so explicitly and defer the percentage claim.
10. **"What this proves / what it does not"** two-column section (non-negotiable for this site).
11. Reliability and failure modes section (stalls, retries, replacement, fallback disclosure).
12. Personal take and forward "measurement stage" note.
13. `## Sources` with real links; keep caveats — do NOT publish a fake cost-reduction percentage, do NOT claim OpenRouter tokens are free, do NOT overstate generalisation from a handful of sessions.

Voice guardrails: first person behind the build, candid, evidence-led, hype-free; "useful, not AI theatre". Reuse existing components (`ArticleFigure`, `ArticleExplain`, `WorkflowFrame`, `ReviewPill`, `Mermaid`) — all registered in the editor's component registry.

## 7. Key evidence paths

- Posts: `content/posts/how-i-built-an-openrouter-backed-ai-team.mdx`, `content/posts/how-i-ran-qwen-locally-inside-codex.mdx`
- Strategy/voice: `docs/content-strat.md`, `docs/content-ops.md`, `.impeccable.md`
- Components: `src/components/mdx-components.tsx`, `src/lib/content-ops/component-registry.ts`
- Build/scripts: `package.json`, `velite.config.ts`, `playwright.config.ts`, `.vercel/project.json`
- Last publish: git commit `2b426c6`
