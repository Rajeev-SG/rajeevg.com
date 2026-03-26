# Hackathon GA4 consent summary proof

Date: 2026-03-26
Surface: `/projects/hackathon-voting-analytics/google-analytics`
Base URL: `http://127.0.0.1:3027`

## Target flow

Open the hackathon GA4 dashboard, dismiss the consent banner if present, and verify that the consent summary shows consented versus non-consented action percentages with the raw formula spelled out.

## Expected behavior

- The consent card shows only `Consented actions` and `Non-consented actions`.
- The supporting copy explains the exact numerator and denominator behind both percentages.
- Desktop and mobile layouts remain readable and scroll without horizontal overflow.

## Observed behavior

- Both desktop and mobile runs passed.
- The consent card rendered the action-based percentage model.
- The rendered copy spelled out the live local math: `81%` from `1,337 / 1,650` and `19%` from `313 / 1,650`, with `96` unknown-consent actions excluded.
- The topline vote coverage card rendered a raw ratio first, with the percentage moved into the supporting sentence.
- The dashboard continued to render the rest of the GA4 route correctly, with no reappearance of the removed fallback controls.
- Screenshot review passed for the top section in both tested viewports.

## Evidence

- Playwright run:
  - `E2E_BASE_URL=http://127.0.0.1:3027 pnpm exec playwright test tests/e2e/hackathon-ga4.spec.ts --reporter=list --workers=1`
- Screenshots:
  - `/Users/rajeev/Code/rajeevg.com/output/playwright/hackathon-ga4-dashboard-20260325/desktop-light-top.png`
  - `/Users/rajeev/Code/rajeevg.com/output/playwright/hackathon-ga4-dashboard-20260325/mobile-dark-top.png`

## Verdict

Pass. The consent summary now uses action-based percentages with an explicit formula, and the updated dashboard remains usable on desktop and mobile.
