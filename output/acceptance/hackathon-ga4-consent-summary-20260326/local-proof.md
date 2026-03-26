# Hackathon GA4 consent summary proof

Date: 2026-03-26
Surface: `/projects/hackathon-voting-analytics/google-analytics`
Base URL: `http://127.0.0.1:3022`

## Target flow

Open the hackathon GA4 dashboard, dismiss the consent banner if present, and verify that the consent summary shows only `% accepted` and `% denied` rather than the older mixed metrics.

## Expected behavior

- The consent card shows only `% accepted` and `% denied`.
- The supporting copy explains that both percentages share the same known-consent page-view denominator.
- Desktop and mobile layouts remain readable and scroll without horizontal overflow.

## Observed behavior

- Both desktop and mobile runs passed.
- The consent card rendered the simpler percentage-only model.
- The dashboard continued to render the rest of the GA4 route correctly, with no reappearance of the removed fallback controls.
- Screenshot review passed for the top section in both tested viewports.

## Evidence

- Playwright run:
  - `E2E_BASE_URL=http://127.0.0.1:3022 pnpm exec playwright test tests/e2e/hackathon-ga4.spec.ts --reporter=list --workers=1`
- Screenshots:
  - `/Users/rajeev/Code/rajeevg.com/output/playwright/hackathon-ga4-dashboard-20260325/desktop-light-top.png`
  - `/Users/rajeev/Code/rajeevg.com/output/playwright/hackathon-ga4-dashboard-20260325/mobile-dark-top.png`

## Verdict

Pass. The consent summary now uses a simpler percentage-only split, and the updated dashboard remains usable on desktop and mobile.
