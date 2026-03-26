# Hackathon GA4 consent summary proof

Date: 2026-03-26
Surface: `/projects/hackathon-voting-analytics/google-analytics`
Base URL: `http://127.0.0.1:3023`

## Target flow

Open the hackathon GA4 dashboard, dismiss the consent banner if present, and verify that the consent summary shows plain accepted and denied user counts with an overlap explanation.

## Expected behavior

- The consent card shows only `Accepted` and `Denied`.
- The supporting copy explains that the accepted and denied user buckets can overlap.
- Desktop and mobile layouts remain readable and scroll without horizontal overflow.

## Observed behavior

- Both desktop and mobile runs passed.
- The consent card rendered the simpler count-based model.
- The dashboard continued to render the rest of the GA4 route correctly, with no reappearance of the removed fallback controls.
- Screenshot review passed for the top section in both tested viewports.

## Evidence

- Playwright run:
  - `E2E_BASE_URL=http://127.0.0.1:3023 pnpm exec playwright test tests/e2e/hackathon-ga4.spec.ts --reporter=list --workers=1`
- Screenshots:
  - `/Users/rajeev/Code/rajeevg.com/output/playwright/hackathon-ga4-dashboard-20260325/desktop-light-top.png`
  - `/Users/rajeev/Code/rajeevg.com/output/playwright/hackathon-ga4-dashboard-20260325/mobile-dark-top.png`

## Verdict

Pass. The consent summary now uses plain accepted and denied user counts, and the updated dashboard remains usable on desktop and mobile.
