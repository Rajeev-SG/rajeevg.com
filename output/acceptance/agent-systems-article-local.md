# Acceptance: measurable Codex subagents article (local)

## Expected behavior

- The article route renders with its final title, hero and all 15 level-two sections.
- Desktop, intermediate and mobile layouts have no document overflow.
- Dark mode remains readable.
- The evidence boundary and Sources are reachable after the analytics choice is completed.
- The new hero loads successfully and the external source links are present.

## Executed steps

1. Built the content and production application, then ran lint.
2. Opened `/blog/how-i-made-codex-subagents-measurable` in one isolated, captain-owned Playwright CLI session.
3. Captured full-page screenshots at 1440, 768 and 390 pixels, plus mobile dark mode.
4. Captured focused evidence and Sources screenshots.
5. The first visual review failed because the analytics-consent dialog covered lower-page content.
6. Completed the real reader journey by selecting `Necessary only`.
7. Re-captured the evidence and Sources sections and asserted that the dialog was absent, the sections were visible and document overflow was zero.

## Evidence

- `output/playwright/2026-08-11-agent-systems-article/desktop-1440.png`
- `output/playwright/2026-08-11-agent-systems-article/intermediate-768.png`
- `output/playwright/2026-08-11-agent-systems-article/mobile-390.png`
- `output/playwright/2026-08-11-agent-systems-article/mobile-dark-390.png`
- `output/playwright/2026-08-11-agent-systems-article/proof-section-dismissed-1440.png`
- `output/playwright/2026-08-11-agent-systems-article/sources-dismissed-mobile-390.png`
- Playwright snapshot: `.playwright-cli/page-2026-08-11T10-29-54-087Z.yml`
- Local console: `.playwright-cli/console-2026-08-11T10-26-07-954Z.log`

DOM result after completing consent:

- title and H1 match `How I Made Codex Subagents Measurable and Recoverable`
- hero loaded: true
- H2 count: 15
- source link present: true
- proof section present: true
- mobile dark class: true
- document overflow: 0
- analytics dialog absent: true
- Sources visible: true
- final workload-evidence disclaimer reachable: true

## Result

PASS for local content, layout and reader reachability. The initial overlay failure was resolved by completing the consent journey; the fresh post-consent screenshots pass visual inspection at desktop and mobile widths.

## Remaining risk

- The dev server reports three existing Next.js hydration/script-placement errors from the site's analytics script and shows the dev issue badge. These are not introduced by the article. Production console status must be checked on Vercel after deployment.
- `next start` currently fails with the existing `routesManifest.dataRoutes is not iterable` site-level startup defect, although `pnpm build` succeeds. The deployed Vercel page is therefore the authoritative production acceptance surface.
