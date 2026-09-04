# Acceptance Manifest: GLM task-controller article

**Date:** 2026-09-04

**Agent:** Codex task `01a069a7-9e64-7343-88ac-dedfebcb1acf`

**Status:** PASS

## Checks

| Check | Method | Evidence | Result |
|---|---|---|---|
| Article compiles and is statically generated | `pnpm run build` | Build output includes `/blog/how-i-moved-codex-work-onto-glm-workers` | PASS |
| SVG is valid XML and served as a public asset | `xmllint` and Playwright request | `public/images/blog/glm-task-controller/controller-worker-architecture.svg` | PASS |
| Article loads with the expected title and evidence | Playwright browser assertion | Four viewport page captures in this directory | PASS |
| Diagram is visible without horizontal page overflow | Playwright bounding-box and document-width assertions | `wide-figure.png`, `desktop-figure.png`, `intermediate-figure.png`, `mobile-figure.png` | PASS |
| Desktop and wide composition use the available width without clipping or dead zones | Screenshot review at 1440 and 1536 | `desktop-page.png`, `wide-page.png` | PASS |
| Intermediate and mobile reflow remain coherent | Screenshot review at 768 and 402 | `intermediate-page.png`, `mobile-page.png` | PASS |
| No browser console errors | Playwright console listener | Test result: one passed, zero console errors | PASS |
| Markdown representation is available | Playwright `Accept: text/markdown` request | Response contains `GLM share of uncached prompt volume` | PASS |

## Visual review

- Art direction: a restrained control-room diagram with a visibly thin controller, a larger persistent execution workspace, and a separate routing/evidence foundation.
- Teaching objective: show task persistence, policy boundaries, provider routing and separate measurement in one view; the prose cannot communicate those simultaneous relationships as quickly.
- Desktop width is used well and the wide viewport avoids dead zones.
- The 768 px breakpoint holds together without clipping or broken reflow.
- The 402 px article remains usable with no horizontal overflow. Fine-grained labels are dense at phone width, while the hierarchy and evidence headline remain visible.
- No panel is accidentally tall and narrow. Whitespace is intentional and the execution plane is visually dominant.
- No below-the-fold section shows overlap or clipping.

## Repro steps

1. Run `pnpm run build`.
2. Run `pnpm start -p 4173`.
3. Run `E2E_BASE_URL=http://127.0.0.1:4173 pnpm exec playwright test tests/e2e/glm-task-controller-article.spec.ts --project=desktop-light`.
4. Inspect the page and figure screenshots in this directory.

## Risks / known gaps

- The telemetry proves token placement for one paired controller/worker run, not causal savings against a matched Sol-only run. The article states this explicitly.
- Provider cost was not directly measured for the paired task, so the article does not present a cost-saving percentage.
- Existing unused-variable warnings in the Pareto code remain outside this change.
