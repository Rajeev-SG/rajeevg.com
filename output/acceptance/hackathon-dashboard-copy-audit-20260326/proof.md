## Hackathon Dashboard Copy Audit And IA Repair

Date: 2026-03-26

### Goal

Repair the hackathon dashboard IA and copy so that:

- the BigQuery page is warehouse-first
- the GA4 page no longer shows test-only entries in the visible entry cards
- metric definitions use tooltips instead of jump links
- labels and schema copy are plain-English and defensible

### Implemented

- Removed the cross-page `BigQuery analysis` and `GA4 property` tabs from the shared shell.
- Kept `Dummy preview` only as the source toggle for the BigQuery route.
- Replaced jump-to-definition metric links with tooltip definitions across both dashboard pages.
- Filtered the GA4 entry surface so only entries that match the live competition truth set appear in the visible entry cards.
- Rewrote the BigQuery and GA4 dashboard copy, section names, metric labels, and schema definitions in plainer language.

### Local validation

- `pnpm lint`
- `pnpm build`
- `PORT=3028 pnpm exec playwright test tests/e2e/hackathon-analytics.spec.ts tests/e2e/hackathon-ga4.spec.ts tests/e2e/hackathon-reporting-consistency.spec.ts tests/e2e/projects-dashboard-audit.spec.ts --reporter=list --workers=1`
- Result: `9 passed, 3 skipped`

### Production validation

- Deploy: `vercel deploy --prod --yes`
- Production alias: `https://rajeevg.com`
- `E2E_BASE_URL=https://rajeevg.com pnpm exec playwright test tests/e2e/hackathon-analytics.spec.ts tests/e2e/hackathon-ga4.spec.ts tests/e2e/hackathon-reporting-consistency.spec.ts tests/e2e/projects-dashboard-audit.spec.ts --reporter=list --workers=1`
- Result: `9 passed, 3 skipped`

### Fresh artifact paths

- BigQuery page screenshots: `/Users/rajeev/Code/rajeevg.com/output/playwright/hackathon-dashboard-20260325/`
- GA4 page screenshots: `/Users/rajeev/Code/rajeevg.com/output/playwright/hackathon-ga4-dashboard-20260325/`
- Shared-shell screenshots: `/Users/rajeev/Code/rajeevg.com/output/playwright/hackathon-reporting-consistency-20260325/`
- Section audit screenshots: `/Users/rajeev/Code/rajeevg.com/output/acceptance/projects-dashboard-audit-20260325/prod/`

### Visible outcomes confirmed on production

- The BigQuery route no longer shows cross-page source tabs and reads as a warehouse page.
- The GA4 route no longer shows `Raj test`, `test-1`, `test-2`, or `test-3` in the visible entry cards.
- Tooltip definitions are present on visible metric labels across both pages.
- The revised section titles and metric labels are visible on both desktop and mobile without horizontal overflow.
