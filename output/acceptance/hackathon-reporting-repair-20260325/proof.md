# Hackathon reporting repair proof

Date: 2026-03-25

## Public routes

- `https://rajeevg.com/projects/hackathon-voting-analytics`
- `https://rajeevg.com/projects/hackathon-voting-analytics/google-analytics`

## What was fixed

- The BigQuery route now labels non-warehouse telemetry as `Fallback ...` when modeled tables are empty.
- The schema reference moved to the top of the page and is collapsed by default.
- Source reconciliation is collapsed by default.
- The GA4 route no longer shows the `Dummy preview` toggle.
- The GA4 `Round snapshot surface` was removed.
- The GA4 `Entry surface` was rebuilt around consented dialogs, tracked submits, persisted votes, and coverage.
- The GA4 adapter now derives summary counts from non-truncated totals instead of limited grouped rows.

## Live evidence

### Source-of-truth vote ledger

From `https://vote.rajeevg.com/api/reporting/public-summary`:

- persisted votes: `297`
- unique judges: `37`
- total entries: `9`
- remaining votes: `15`

### Direct GA4 proof

From `analytics_mcp.run_report` against property `498363924`, filtered to `hostName = vote.rajeevg.com`, last 30 days including today:

- `vote_dialog_viewed`: `345`
- `vote_submitted`: `170`
- `judge_auth_completed`: `21`
- `consent_state_updated`: `48`

From direct `page_context` consent-state rows on the same host:

- `granted`: `70`
- `denied`: `211`
- granted page-context share: `24.9%`

### Public page reconciliation

Verified from fresh browser snapshots on production after deploy:

- BigQuery route shows:
  - `Fallback event count: 5,299`
  - `Persisted votes: 297`
  - `Fallback tracked submits: 170`
  - `GA4 coverage: 57%`
  - `Granted page-context share: 25%`
- GA4 route shows:
  - `Event count: 5,299`
  - `Persisted votes: 297`
  - `Tracked submits: 170`
  - `GA4 coverage: 57%`
  - `Granted page-context share: 25%`

These match the direct sources above within normal rounding:

- `170 / 297 = 57.2%`
- `70 / (70 + 211) = 24.9%`

## Browser proof

Fresh production Playwright run:

```bash
E2E_BASE_URL=https://rajeevg.com pnpm exec playwright test tests/e2e/hackathon-analytics.spec.ts tests/e2e/hackathon-ga4.spec.ts tests/e2e/hackathon-reporting-consistency.spec.ts --reporter=list --workers=1
```

Result:

- `6 passed`

What those checks proved:

- desktop and mobile render cleanly on both routes
- the schema disclosure opens and closes
- the source-reconciliation disclosure opens and closes
- the BigQuery route still supports `Dummy preview`
- the GA4 route does not show `Dummy preview`
- the GA4 route no longer contains `Round snapshot surface`
- the GA4 route no longer contains `AVG AGGREGATE`
- the shared top shell remains aligned between routes
- no horizontal overflow was detected

## Screenshot artifacts

- `/Users/rajeev/Code/rajeevg.com/output/playwright/hackathon-dashboard-20260325/desktop-light-top.png`
- `/Users/rajeev/Code/rajeevg.com/output/playwright/hackathon-dashboard-20260325/mobile-dark-top.png`
- `/Users/rajeev/Code/rajeevg.com/output/playwright/hackathon-ga4-dashboard-20260325/desktop-light-top.png`
- `/Users/rajeev/Code/rajeevg.com/output/playwright/hackathon-ga4-dashboard-20260325/mobile-dark-top.png`
- `/Users/rajeev/Code/rajeevg.com/output/playwright/hackathon-reporting-consistency-20260325/desktop-light-bigquery-shell.png`
- `/Users/rajeev/Code/rajeevg.com/output/playwright/hackathon-reporting-consistency-20260325/desktop-light-ga4-shell.png`
- `/Users/rajeev/Code/rajeevg.com/output/playwright/hackathon-reporting-consistency-20260325/mobile-dark-bigquery-shell.png`
- `/Users/rajeev/Code/rajeevg.com/output/playwright/hackathon-reporting-consistency-20260325/mobile-dark-ga4-shell.png`
