# Acceptance: gh-84 agent-friendly shipping guide revision

## Expected behavior
Live article at https://rajeevg.com/blog/from-idea-to-live-site-with-an-agent-friendly-stack shows the revised content: explainer chips, per-stage agent prompts, three-platform token examples, AGENTS.md section, validated vendor links, dated snapshot retained.

## Executed steps
1. `pnpm run content` (velite) — exit 0.
2. `pnpm run build` (Next.js production) — exit 0.
3. 30 external links curl-checked → all HTTP 200 (two Cloudflare learning pages replaced with documented `/dns/` pages).
4. PR #87 opened → all checks (Vercel, Vercel Preview Comments, CodeRabbit) → merged squash at 23:08 UTC 2026-09-02.
5. Production deploy triggered by merge; waited for Ready.
6. `curl https://rajeevg.com/blog/from-idea-to-live-site-with-an-agent-friendly-stack` → HTTP 200.
7. Grep confirmed on live page: "AGENTS.md: stop repeating yourself" (3), "Explainer" (1), "VERCEL_TOKEN" present, canonical `https://rajeevg.com/blog/from-idea-to-live-site-with-an-agent-friendly-stack`.
8. Static assets 200: jargon-map.svg, control-surface.svg, jargon-map.drawio, control-surface.drawio.

## Result
PASS. Content, canonical metadata, downloadable sources, and rendered diagrams all live at production.

## Remaining risk
None identified. Viewport-level visual QA not rerun because the change is content-only with the same layout components (ArticleDiagramFigure, ArticleExplain, ArticleToc) already proven on the live site.
