# Measurement Article Proof

- Date: 2026-03-26
- Target URL: `https://rajeevg.com/blog/why-browser-consent-and-source-blending-make-marketing-measurement-harder`
- Local proof URL: `http://127.0.0.1:3028/blog/why-browser-consent-and-source-blending-make-marketing-measurement-harder`
- Production deployment: `https://rajeevg.com`

## User journey

Open the new article, confirm the hard-quant stat cards render, confirm the SVG figures render, confirm the Mermaid diagrams render, confirm the sources section is present, and confirm the page has no horizontal overflow on desktop or mobile.

## Expected behavior

- The article headline and description are visible.
- The opening stat grid shows the `297`, `172`, `163`, and `0` hard-quant metrics.
- The two SVG figures load successfully.
- The two Mermaid diagrams render to SVG.
- The sources section is visible with the cited links.
- Desktop and mobile both keep the article readable without overflow.

## Observed behavior

- Local Playwright proof passed on desktop and mobile after the final content update.
- Production Playwright proof passed on desktop and mobile after the final redeploy.
- The article rendered the stat grid, SVG figures, Mermaid diagrams, and sources section correctly on both viewports.
- No horizontal overflow was detected in either viewport.

## Validation

- `pnpm lint`
- `pnpm build`
- `PORT=3028 pnpm exec playwright test tests/e2e/measurement-article.spec.ts --reporter=list --workers=1`
  - Result: `2 passed`
- `E2E_BASE_URL=https://rajeevg.com MEASUREMENT_ARTICLE_ARTIFACT_ROOT=output/acceptance/measurement-article-20260326/prod-playwright pnpm exec playwright test tests/e2e/measurement-article.spec.ts --reporter=list --workers=1`
  - Result: `2 passed`
- `vercel deploy --prod --yes`
  - Result: production alias updated to `https://rajeevg.com`

## Artifacts

- Local desktop full page:
  - `/Users/rajeev/Code/rajeevg.com/output/acceptance/measurement-article-20260326/local-playwright/measurement-article-full-desktop-light.png`
- Local mobile full page:
  - `/Users/rajeev/Code/rajeevg.com/output/acceptance/measurement-article-20260326/local-playwright/measurement-article-full-mobile-dark.png`
- Local mid-page desktop:
  - `/Users/rajeev/Code/rajeevg.com/output/acceptance/measurement-article-20260326/local-playwright/measurement-article-mid-desktop-light.png`
- Local mid-page mobile:
  - `/Users/rajeev/Code/rajeevg.com/output/acceptance/measurement-article-20260326/local-playwright/measurement-article-mid-mobile-dark.png`
- Production desktop full page:
  - `/Users/rajeev/Code/rajeevg.com/output/acceptance/measurement-article-20260326/prod-playwright/measurement-article-full-desktop-light.png`
- Production mobile full page:
  - `/Users/rajeev/Code/rajeevg.com/output/acceptance/measurement-article-20260326/prod-playwright/measurement-article-full-mobile-dark.png`
- Production mid-page desktop:
  - `/Users/rajeev/Code/rajeevg.com/output/acceptance/measurement-article-20260326/prod-playwright/measurement-article-mid-desktop-light.png`
- Production mid-page mobile:
  - `/Users/rajeev/Code/rajeevg.com/output/acceptance/measurement-article-20260326/prod-playwright/measurement-article-mid-mobile-dark.png`

## Pass / fail

- Pass

## Residual risk

- The article cites live hackathon metrics from a specific event day. Those numbers are intentionally frozen in the article narrative and may differ from future live dashboard totals if new data is later added to the property or application.
