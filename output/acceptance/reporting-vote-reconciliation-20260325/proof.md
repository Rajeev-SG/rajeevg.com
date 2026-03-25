# Hackathon Vote Reconciliation Proof

Generated: 2026-03-25 20:19 UTC

## Goal

Prove that the public reporting pages on `rajeevg.com` now show the real persisted vote total from the voting app, and prove that GA4 `vote_submitted` is treated as analytics coverage rather than the authoritative vote count.

## Sources exercised

- Voting app source-of-truth endpoint: [public-summary](https://vote.rajeevg.com/api/reporting/public-summary)
- Public scoreboard: [vote.rajeevg.com](https://vote.rajeevg.com)
- BigQuery reporting route: [hackathon-voting-analytics](https://rajeevg.com/projects/hackathon-voting-analytics)
- GA4 reporting route: [hackathon-voting-analytics/google-analytics](https://rajeevg.com/projects/hackathon-voting-analytics/google-analytics)
- Direct GA4 Data API query for `hostName = vote.rajeevg.com` and `eventName = vote_submitted`

## Observed values

- Voting app public summary:
  - persisted votes: `297`
  - unique judges: `37`
  - total entries: `9`
  - open entries: `9`
  - remaining votes: `15`
- Public scoreboard:
  - visible entry rows: `9`
  - summed visible vote counts: `297`
- Direct GA4:
  - `vote_submitted`: `20`
- `rajeevg.com` BigQuery route:
  - `Persisted votes`: `297`
  - `Tracked submits`: `20`
  - `GA4 coverage`: `6.7%`
- `rajeevg.com` GA4 route:
  - `Persisted votes`: `297`
  - `Tracked submits`: `20`
  - `GA4 coverage`: `6.7%`

## Assertions

- Source-of-truth endpoint total matched the summed visible public scoreboard vote counts.
- Source-of-truth endpoint total matched the `Persisted votes` card on the BigQuery route.
- Source-of-truth endpoint total matched the `Persisted votes` card on the GA4 route.
- Both reporting routes showed the same tracked GA4 submit count and the same coverage percentage.
- The gap stayed explicit on-page instead of being hidden behind a misleading `Vote submits` label.

## Artifacts

- JSON reconciliation snapshot: [reconciliation.json](/Users/rajeev/Code/rajeevg.com/output/playwright/hackathon-vote-reconciliation-20260325/reconciliation.json)
- Proof runner: [reconcile.mjs](/Users/rajeev/Code/rajeevg.com/output/playwright/hackathon-vote-reconciliation-20260325/reconcile.mjs)
- Scoreboard desktop: [scoreboard-desktop.png](/Users/rajeev/Code/rajeevg.com/output/playwright/hackathon-vote-reconciliation-20260325/scoreboard-desktop.png)
- BigQuery desktop: [bigquery-desktop.png](/Users/rajeev/Code/rajeevg.com/output/playwright/hackathon-vote-reconciliation-20260325/bigquery-desktop.png)
- GA4 desktop: [ga4-desktop.png](/Users/rajeev/Code/rajeevg.com/output/playwright/hackathon-vote-reconciliation-20260325/ga4-desktop.png)
- BigQuery mobile: [bigquery-mobile.png](/Users/rajeev/Code/rajeevg.com/output/playwright/hackathon-vote-reconciliation-20260325/bigquery-mobile.png)
- GA4 mobile: [ga4-mobile.png](/Users/rajeev/Code/rajeevg.com/output/playwright/hackathon-vote-reconciliation-20260325/ga4-mobile.png)

## Validation

- `pnpm check` in `hackathon-voting-prototype`
- `pnpm build` in `hackathon-voting-prototype`
- `pnpm lint` in `rajeevg.com`
- `pnpm build` in `rajeevg.com`
- `E2E_BASE_URL=https://rajeevg.com pnpm exec playwright test tests/e2e/hackathon-analytics.spec.ts tests/e2e/hackathon-ga4.spec.ts tests/e2e/hackathon-reporting-consistency.spec.ts --reporter=list --workers=1`

## Verdict

Pass. The public reporting pages now use the real persisted vote total from the voting app and clearly label GA4 submit counts as partial analytics coverage. The only remaining discrepancy is intentional and evidenced: GA4 tracked `20` submits while the voting app had `297` persisted votes at the proof timestamp, so GA4 is no longer presented as the actual vote ledger.
