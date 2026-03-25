# Reporting Reconciliation Proof

Date: 2026-03-25

## Goal

Finish the reporting stack for the hackathon voting analytics surfaces, reconcile the live GA4 property against the BigQuery warehouse state, keep all public dashboards truthful when sources disagree, and prove the final state on production.

## Public routes

- `https://rajeevg.com/projects/hackathon-voting-analytics`
- `https://rajeevg.com/projects/hackathon-voting-analytics/google-analytics`
- `https://rajeevg.com/projects/site-analytics`

## What changed

- The BigQuery route now uses shared warehouse helpers in `src/lib/hackathon-bigquery.ts`.
- The hackathon GA4 route and the BigQuery fallback path now share host, stream, property, and date-window helpers in `src/lib/hackathon-ga4-common.ts`.
- The BigQuery route now falls back to a GA4-derived modeled dataset from `src/lib/hackathon-reporting-fallback.ts` when:
  - the modeled warehouse tables are empty
  - or the runtime cannot reach BigQuery
- Both hackathon routes now surface reconciliation notes explaining which source is driving the page and what the warehouse state currently is.
- The GA4 route now includes `today` in its reporting window instead of stopping at `yesterday`.
- The site analytics Observable key-events chart no longer generates a numeric color legend that clipped SVG labels on production.

## Reconciled data sources

### GA4 proof

Direct GA4 reporting for `hostName = vote.rajeevg.com` in the last 30 days including today returned live hackathon rows:

- `competition_state_snapshot`: `159` events, `16` users
- `page_view`: `73` events, `16` users
- `vote_score_selected`: `67` events, `3` users
- `judge_auth_dialog_opened`: `32` events, `13` users
- `vote_submitted`: `8` events, `3` users
- `judge_auth_completed`: `3` events, `3` users
- `workbook_upload_completed`: `3` events, `1` user

This confirms the shared GA4 property has real hackathon traffic and that the host-filtered GA4 route should not be empty.

### BigQuery proof

Direct BigQuery checks against `personal-gws-1` with the reporting service account returned:

- modeled dataset `hackathon_reporting`
  - `auth_funnel_daily`: `0`
  - `daily_overview`: `0`
  - `entry_performance`: `0`
  - `event_breakdown`: `0`
  - `experience_overview_daily`: `0`
  - `manager_operations_daily`: `0`
  - `round_snapshots`: `0`
  - `voting_funnel_daily`: `0`
- raw export dataset `ga4_498363924`
  - landed table count: `0`

This means the discrepancy is real:

- GA4 has live hackathon rows.
- Raw BigQuery export has not landed tables yet.
- The modeled reporting warehouse therefore also has no rows.

## Explanation of the discrepancy

The public BigQuery dashboard is now intentionally truthful about this split.

- If modeled BigQuery rows are available, it reads `personal-gws-1.hackathon_reporting` directly.
- If modeled rows are still `0`, it renders a GA4-derived modeled dataset and says so in the reconciliation notes.
- If BigQuery is unreachable entirely, it also falls back to GA4 and explains the runtime failure.

That gives the site three useful properties at once:

- no silent zero-state when live hackathon traffic exists
- no false claim that BigQuery has landed rows when it has not
- no mixed reading from unrelated `rajeevg.com` page-reporting tables

## Validation

### Repo checks

- `pnpm lint`
  - Passed
- `pnpm build`
  - Passed

### Local proof

- `E2E_BASE_URL=http://127.0.0.1:3334 pnpm exec playwright test tests/e2e/hackathon-analytics.spec.ts tests/e2e/hackathon-ga4.spec.ts tests/e2e/hackathon-reporting-consistency.spec.ts --reporter=list --workers=1`
  - Result: `6 passed`

### Production proof

- Vercel production deployment:
  - `https://rajeevg-d0sokorwb-rajeevgills-projects.vercel.app`
- `E2E_BASE_URL=https://rajeevg.com pnpm exec playwright test tests/e2e/hackathon-analytics.spec.ts tests/e2e/hackathon-ga4.spec.ts tests/e2e/hackathon-reporting-consistency.spec.ts --reporter=list --workers=1`
  - Result: `6 passed`
- `E2E_BASE_URL=https://rajeevg.com pnpm exec playwright test tests/e2e/projects-dashboard-audit.spec.ts --reporter=list --workers=1`
  - Result: `3 passed`, `3 skipped`
  - The skips are expected because that spec runs its own viewport matrix inside the `desktop-light` Playwright project.

## Evidence artifacts

- Shared-shell screenshots:
  - `output/playwright/hackathon-reporting-consistency-20260324/desktop-light-bigquery-shell.png`
  - `output/playwright/hackathon-reporting-consistency-20260324/desktop-light-ga4-shell.png`
  - `output/playwright/hackathon-reporting-consistency-20260324/mobile-dark-bigquery-shell.png`
  - `output/playwright/hackathon-reporting-consistency-20260324/mobile-dark-ga4-shell.png`
- Representative hackathon screenshots:
  - `output/playwright/hackathon-dashboard-20260324/desktop-light-top.png`
  - `output/playwright/hackathon-dashboard-20260324/desktop-light-entry-analysis-observable.png`
  - `output/playwright/hackathon-ga4-dashboard-20260324/desktop-light-top.png`
- Exhaustive production audit artifacts:
  - `output/acceptance/projects-dashboard-audit-20260325/prod`

## Outcome

The reporting surfaces are now reconciled and externally honest:

- the GA4 route shows real host-filtered hackathon activity
- the BigQuery route stays populated by falling back to a GA4-derived modeled view while warehouse export is still empty
- the site analytics route passes the same production audit after the Observable label-clipping fix

The only remaining discrepancy is upstream to the dashboards themselves: Google has not yet landed raw BigQuery export tables for `ga4_498363924`, so the modeled `hackathon_reporting` warehouse remains at zero rows.
