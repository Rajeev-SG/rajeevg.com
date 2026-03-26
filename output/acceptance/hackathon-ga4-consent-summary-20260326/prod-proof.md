# Hackathon GA4 consent summary production proof

Date: 2026-03-26
Production URL: `https://rajeevg.com/projects/hackathon-voting-analytics/google-analytics`
Production URL checked: `https://rajeevg.com/projects/hackathon-voting-analytics/google-analytics`

## Target flow

Deploy the action-based consent-summary fix and revalidate production.

## Expected behavior

- Production responds successfully on the GA4 route.
- Production accepts a fresh deploy.
- The live card shows `Consented actions` and `Non-consented actions` with the supporting formula text.

## Observed behavior

- Production still returns `HTTP/2 200` on the GA4 route.
- A fresh production deploy succeeded and was aliased to `https://rajeevg.com`.
- The live card now shows the action-based percentage model instead of overlapping user counts.
- The live route passed the GA4 Playwright proof on desktop and mobile after deploy.

## Evidence

- Deploy:
  - `vercel deploy --prod --yes`
  - production alias: `https://rajeevg.com`
  - deployment URL: `https://rajeevg-gsugsskxq-rajeevgills-projects.vercel.app`
- HTML verification:
  - `curl -L --max-time 20 -s https://rajeevg.com/projects/hackathon-voting-analytics/google-analytics | rg -o "max-w-screen-xl|2xl:max-w-\\[1400px\\]"`
- Production browser proof:
  - `E2E_BASE_URL=https://rajeevg.com pnpm exec playwright test tests/e2e/hackathon-ga4.spec.ts --reporter=list --workers=1`
- Live rendered consent copy verification:
  - `81% is 1,337 consented actions out of 1,650 actions with a known consent state. 19% is 313 out of the same 1,650. 96 additional tracked actions arrived without a populated consent flag, so they are excluded from this split.`
- Live rendered vote-coverage verification:
  - the topline card shows a raw tracked-votes-versus-recorded-votes ratio, with the percentage in the supporting sentence rather than as a second topline percentage

## Verdict

Pass. Production now shows the action-based consent summary, and the live GA4 route remains stable on desktop and mobile after deploy.
