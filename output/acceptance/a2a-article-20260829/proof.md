# Acceptance: A2A article build and responsive render

## Expected behavior

The new public article should render at its final blog route, explain the proven Codex/OpenClaw/OMP/Hermes A2A setup in the site's editorial voice, show four readable diagrams, and expose four valid editable Excalidraw downloads. The page must avoid body-level horizontal overflow and keep diagrams inspectable on mobile.

## Executed steps

1. Ran `pnpm build` after the final content and diagram changes.
2. Served the production build on `127.0.0.1:43128` for a bounded browser proof.
3. Opened `/blog/how-i-got-four-ai-agents-talking-to-each-other` in a fresh Playwright session.
4. Inspected 1440×1100, 1575×1100, 768×1024 and 402×874 viewports.
5. Captured all four diagram sections at desktop width.
6. Proved the first mobile diagram can scroll from `0` to its exact maximum `336px` while the page body remains `402px` wide.
7. Checked the browser console and all four `.excalidraw` download URLs.

## Evidence

- Desktop full page: `output/playwright/a2a-article-20260829T1235/desktop-1440-full.png`
- Wide desktop: `output/playwright/a2a-article-20260829T1235/wide-1575-full.png`
- Intermediate: `output/playwright/a2a-article-20260829T1235/intermediate-768-full.png`
- Mobile full page: `output/playwright/a2a-article-20260829T1235/mobile-402-full.png`
- Mobile scroll completion: `output/playwright/a2a-article-20260829T1235/mobile-protocol-scroll-end.png`
- Section captures: `output/playwright/a2a-article-20260829T1235/section-*.png`
- Console: `.playwright-cli/console-2026-08-29T11-31-18-696Z.log` (0 errors, 0 warnings)
- Download checks: all four editable Excalidraw URLs returned HTTP 200.

## Result

- **PASS**
- The production build generated the article as a static blog route.
- Normal desktop uses width well; the diagrams deliberately break beyond the reading column without creating page overflow.
- Wide desktop avoids dead zones by keeping prose readable and giving diagrams a larger editorial canvas.
- The 768px breakpoint holds together with no clipping or overlap.
- Mobile keeps the article at viewport width and makes every diagram a labelled horizontal canvas; the tested diagram reached both ends.
- The visual result passes screenshot review. Whitespace is intentional, panels are not tall and narrow, and all sections below the hero remain reachable without overlap.

## Remaining risk

This proves the final local production build, not the eventual Vercel deployment. The site-wide floating privacy-settings control remains visible in screenshots by design.
