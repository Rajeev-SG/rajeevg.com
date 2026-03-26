# Hackathon GA4 consent summary production proof

Date: 2026-03-26
Production URL: `https://rajeevg.com/projects/hackathon-voting-analytics/google-analytics`
Deployment URL: `https://rajeevg-8lx3ztb8e-rajeevgills-projects.vercel.app`

## Target flow

Verify the live hackathon GA4 dashboard after deploy and confirm the consent summary now shows only `% accepted` and `% denied`, without the extra action-count cards.

## Expected behavior

- Production responds successfully on the GA4 route.
- The consent card shows only `% accepted` and `% denied`.
- Desktop and mobile checks still pass after aliasing to `https://rajeevg.com`.

## Observed behavior

- `curl -I` returned `HTTP/2 200` for both `/projects/hackathon-voting-analytics/google-analytics` and `/projects/hackathon-voting-analytics`.
- The targeted Playwright spec passed in both desktop and mobile viewports against `https://rajeevg.com`.
- The updated consent copy and simpler percentage-only model rendered correctly in production.

## Evidence

- Deploy:
  - `vercel deploy --prod --yes`
- HTTP checks:
  - `curl -I https://rajeevg.com/projects/hackathon-voting-analytics/google-analytics`
  - `curl -I https://rajeevg.com/projects/hackathon-voting-analytics`
- Browser proof:
  - `E2E_BASE_URL=https://rajeevg.com pnpm exec playwright test tests/e2e/hackathon-ga4.spec.ts --reporter=list --workers=1`
- Screenshots refreshed by the Playwright run:
  - `/Users/rajeev/Code/rajeevg.com/output/playwright/hackathon-ga4-dashboard-20260325/desktop-light-top.png`
  - `/Users/rajeev/Code/rajeevg.com/output/playwright/hackathon-ga4-dashboard-20260325/mobile-dark-top.png`

## Verdict

Pass. The production dashboard now uses a simpler percentage-only consent summary and remained stable through post-deploy desktop and mobile validation.
