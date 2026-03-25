# Hackathon Voting Analytics Dashboard

Last updated: 2026-03-25

## Purpose

These routes are the in-site reporting surfaces for the hackathon voting app:

- Production route: `https://rajeevg.com/projects/hackathon-voting-analytics`
- GA4 API route: `https://rajeevg.com/projects/hackathon-voting-analytics/google-analytics`
- Source repo for the voting product: `https://github.com/Rajeev-SG/hackathon-voting-prototype`

They exist because the Looker Studio artifact was not trustworthy enough for the event-memory use case. The BigQuery dashboard lives inside `rajeevg.com`, reads only from the dedicated hackathon reporting dataset, and keeps a full dummy-data mode so the visual shell can still be reviewed before export rows land. The GA4 route uses the official Google Analytics Data API client against the shared property, pinned to the hackathon hostname.

Both routes now share the same reporting shell: the same hero, route tabs, source toggle, summary cards, and source card all stay in the same position so switching between BigQuery and GA4 does not cause a visible re-layout at the top of the page.

Both routes now also reconcile against the voting app's public source-of-truth summary endpoint at `https://vote.rajeevg.com/api/reporting/public-summary`. That endpoint is backed by the same competition snapshot that powers the public scoreboard, so the `Persisted votes` card reflects real stored votes instead of GA4 event coverage.

As of 2026-03-25, the BigQuery route is also warehouse-aware:

- if modeled BigQuery rows are available, it reads `personal-gws-1.hackathon_reporting`
- if the modeled tables are still empty, it renders a GA4-derived modeled fallback and says so in the notes card
- if the runtime cannot reach BigQuery at all, it also falls back to GA4 and exposes the runtime failure in the notes

The production GA4 path also now trims env-derived hostname and stream values before using them in exact filters. That matters because the Vercel env values for the hackathon hostname and stream had trailing newlines during the post-event audit, which otherwise caused a false-zero GA4 result.

## What the routes do

- BigQuery dashboard:
  - reads live reporting rows from `personal-gws-1.hackathon_reporting` when modeled rows exist
  - never reads the main `rajeevg.com` page-reporting tables
  - falls back to a GA4-derived modeled dataset when the warehouse is empty or unreachable
  - keeps `Persisted votes` pinned to the live voting-app summary even while the warehouse is empty
  - labels GA4-derived submit counts as tracked telemetry instead of actual votes
  - surfaces warehouse reconciliation notes so the viewer can see whether the page is using modeled BigQuery rows or fallback GA4 rows
  - lets the viewer switch between:
  - `ECharts`
  - `Observable Plot`
  - lets the viewer switch between:
  - `Live reporting`
  - `Dummy preview`
- GA4 API surface:
  - reads the shared GA4 property `498363924` through `@google-analytics/data`
  - filters all report queries to `hostName = vote.rajeevg.com`
  - uses the promoted hackathon dimensions and metrics directly from the property
  - keeps persisted vote totals separate from GA4 `vote_submitted`, which is shown as tracked analytics coverage only
  - keeps its own `Dummy preview` so the shell stays reviewable while property rows are still sparse

The dummy mode is intentional. It lets the reporting shell stay reviewable even while Google is still populating raw export rows.

## Reporting sections

The route is designed to go beyond simple topline metrics. The current sections are:

- `Round pulse and volume`
  - Daily usage, vote volume, and manager-action context
- `Voting funnel and judge access`
  - Auth-to-vote funnel, auth mix, and submission completion quality
- `Entry analysis`
  - Per-project dialog demand, blockage, score totals, average score, and conversion rate
- `Manager operations`
  - Workbook uploads, round starts, per-entry voting control, reset/finalize activity, and failure counters
- `Experience, devices, and board behavior`
  - Viewport mix, consent state, board-view usage, interaction depth, and engagement quality
- `Event taxonomy and promoted schema`
  - Event-family breakdown and a data dictionary for the promoted reporting dimensions and metrics

## BigQuery model

The route expects the following reporting tables inside `hackathon_reporting`:

- `daily_overview`
- `event_breakdown`
- `entry_performance`
- `round_snapshots`
- `auth_funnel_daily`
- `voting_funnel_daily`
- `manager_operations_daily`
- `experience_overview_daily`

## Runtime configuration

The `rajeevg.com` Vercel project needs these env vars:

- `BIGQUERY_PROJECT_ID=personal-gws-1`
- `BIGQUERY_DATASET_ID=hackathon_reporting`
- `BIGQUERY_SERVICE_ACCOUNT_JSON=<service account json>`
- `GA4_PROPERTY_ID=498363924`
- `GA4_SERVICE_ACCOUNT_JSON=<service account json>`
- `GA4_HACKATHON_HOSTNAME=vote.rajeevg.com`
- `GA4_HACKATHON_STREAM_ID=14214480224`
- `HACKATHON_VOTING_APP_URL=https://vote.rajeevg.com`

The live adapter is implemented in:

- [/Users/rajeev/Code/rajeevg.com/src/lib/hackathon-reporting.ts](/Users/rajeev/Code/rajeevg.com/src/lib/hackathon-reporting.ts)
- [/Users/rajeev/Code/rajeevg.com/src/lib/hackathon-ga4-reporting.ts](/Users/rajeev/Code/rajeevg.com/src/lib/hackathon-ga4-reporting.ts)

The dummy dataset is implemented in:

- [/Users/rajeev/Code/rajeevg.com/src/lib/hackathon-reporting-dummy.ts](/Users/rajeev/Code/rajeevg.com/src/lib/hackathon-reporting-dummy.ts)

## Verified status on 2026-03-25

Both routes are live, verified, and now reconcile the source discrepancy honestly instead of collapsing to an empty shell.

Production proof:

- `curl -I https://rajeevg.com/projects/hackathon-voting-analytics` returned `200`
- `curl -I https://rajeevg.com/projects/hackathon-voting-analytics/google-analytics` returned `200`
- Desktop Playwright proof passed on production
- Mobile Playwright proof passed on production
- Desktop and mobile shared-shell consistency proof passed on production
- Exhaustive production dashboard audit passed for:
  - `/projects/hackathon-voting-analytics`
  - `/projects/hackathon-voting-analytics/google-analytics`
  - `/projects/site-analytics`
- `analytics_mcp.run_report` accepted the exact hackathon GA query shapes used by the GA4 route:
  - `eventName + customEvent:viewer_role + customEvent:competition_status`
  - `customEvent:competition_status + averageCustomEvent:entry_count/open_entry_count/participating_judge_count/total_remaining_votes`

Reconciliation proof on 2026-03-25 now records the current live snapshot explicitly instead of treating GA4 `vote_submitted` as the real vote total:

- live voting-app public summary:
  - persisted votes: `297`
  - unique judges: `37`
  - total entries: `9`
- direct GA4 proof for `hostName = vote.rajeevg.com`:
  - `vote_submitted`: `20`
- public dashboard reconciliation:
  - `/projects/hackathon-voting-analytics` persisted votes: `297`
  - `/projects/hackathon-voting-analytics/google-analytics` persisted votes: `297`
  - both routes show `Tracked submits: 20` and `GA4 coverage: 6.7%`

Current warehouse state:

- Raw export dataset `personal-gws-1:ga4_498363924`
  - landed table count: `0`
- Modeled dataset `personal-gws-1:hackathon_reporting`
  - landed table count: `8`
  - total row count: `0`

Current modeled table-row counts in `personal-gws-1.hackathon_reporting`:

- `auth_funnel_daily`: `0`
- `daily_overview`: `0`
- `entry_performance`: `0`
- `event_breakdown`: `0`
- `experience_overview_daily`: `0`
- `manager_operations_daily`: `0`
- `round_snapshots`: `0`
- `voting_funnel_daily`: `0`

That means the current discrepancy is real and explained:

- the shared GA4 property has live hackathon rows
- raw BigQuery export has not landed tables yet
- the modeled warehouse therefore also has no rows

Because of that, the public BigQuery route currently renders a GA4-derived modeled fallback and says so in the live notes card. The GA4 API route reads the host-filtered property directly and now includes `today`, so it shows the real hackathon traffic instead of the earlier false-empty window.

## Evidence

- Production desktop top screenshot:
  - [/Users/rajeev/Code/rajeevg.com/output/playwright/hackathon-dashboard-20260324/desktop-light-top.png](/Users/rajeev/Code/rajeevg.com/output/playwright/hackathon-dashboard-20260324/desktop-light-top.png)
- Production desktop voting funnel screenshot:
  - [/Users/rajeev/Code/rajeevg.com/output/playwright/hackathon-dashboard-20260324/desktop-light-voting-funnel.png](/Users/rajeev/Code/rajeevg.com/output/playwright/hackathon-dashboard-20260324/desktop-light-voting-funnel.png)
- Production desktop Observable entry-analysis screenshot:
  - [/Users/rajeev/Code/rajeevg.com/output/playwright/hackathon-dashboard-20260324/desktop-light-entry-analysis-observable.png](/Users/rajeev/Code/rajeevg.com/output/playwright/hackathon-dashboard-20260324/desktop-light-entry-analysis-observable.png)
- Production mobile top screenshot:
  - [/Users/rajeev/Code/rajeevg.com/output/playwright/hackathon-dashboard-20260324/mobile-dark-top.png](/Users/rajeev/Code/rajeevg.com/output/playwright/hackathon-dashboard-20260324/mobile-dark-top.png)
- Production mobile Observable screenshot:
  - [/Users/rajeev/Code/rajeevg.com/output/playwright/hackathon-dashboard-20260324/mobile-dark-entry-analysis-observable.png](/Users/rajeev/Code/rajeevg.com/output/playwright/hackathon-dashboard-20260324/mobile-dark-entry-analysis-observable.png)
- GA4 desktop screenshot:
  - [/Users/rajeev/Code/rajeevg.com/output/playwright/hackathon-ga4-dashboard-20260324/desktop-light-top.png](/Users/rajeev/Code/rajeevg.com/output/playwright/hackathon-ga4-dashboard-20260324/desktop-light-top.png)
- GA4 mobile screenshot:
  - [/Users/rajeev/Code/rajeevg.com/output/playwright/hackathon-ga4-dashboard-20260324/mobile-dark-top.png](/Users/rajeev/Code/rajeevg.com/output/playwright/hackathon-ga4-dashboard-20260324/mobile-dark-top.png)
- Shared-shell consistency screenshots:
  - [/Users/rajeev/Code/rajeevg.com/output/playwright/hackathon-reporting-consistency-20260324/desktop-light-bigquery-shell.png](/Users/rajeev/Code/rajeevg.com/output/playwright/hackathon-reporting-consistency-20260324/desktop-light-bigquery-shell.png)
  - [/Users/rajeev/Code/rajeevg.com/output/playwright/hackathon-reporting-consistency-20260324/desktop-light-ga4-shell.png](/Users/rajeev/Code/rajeevg.com/output/playwright/hackathon-reporting-consistency-20260324/desktop-light-ga4-shell.png)
  - [/Users/rajeev/Code/rajeevg.com/output/playwright/hackathon-reporting-consistency-20260324/mobile-dark-bigquery-shell.png](/Users/rajeev/Code/rajeevg.com/output/playwright/hackathon-reporting-consistency-20260324/mobile-dark-bigquery-shell.png)
  - [/Users/rajeev/Code/rajeevg.com/output/playwright/hackathon-reporting-consistency-20260324/mobile-dark-ga4-shell.png](/Users/rajeev/Code/rajeevg.com/output/playwright/hackathon-reporting-consistency-20260324/mobile-dark-ga4-shell.png)
- Exhaustive local dashboard audit artifacts:
  - [/Users/rajeev/Code/rajeevg.com/output/acceptance/projects-dashboard-audit-20260325/local](/Users/rajeev/Code/rajeevg.com/output/acceptance/projects-dashboard-audit-20260325/local)
- Exhaustive production dashboard audit artifacts:
  - [/Users/rajeev/Code/rajeevg.com/output/acceptance/projects-dashboard-audit-20260325/prod](/Users/rajeev/Code/rajeevg.com/output/acceptance/projects-dashboard-audit-20260325/prod)
- Reconciliation proof:
  - [/Users/rajeev/Code/rajeevg.com/output/acceptance/reporting-reconciliation-20260325/proof.md](/Users/rajeev/Code/rajeevg.com/output/acceptance/reporting-reconciliation-20260325/proof.md)
  - [/Users/rajeev/Code/rajeevg.com/output/acceptance/reporting-vote-reconciliation-20260325/proof.md](/Users/rajeev/Code/rajeevg.com/output/acceptance/reporting-vote-reconciliation-20260325/proof.md)

The exhaustive audit covers every chart, chart label region, summary block, and long-form list surface on:

- `/projects/hackathon-voting-analytics`
- `/projects/hackathon-voting-analytics/google-analytics`
- `/projects/site-analytics`

It captures desktop, wide-desktop, tablet, and mobile-dark viewports, and it checks for horizontal overflow, clipped text, Observable SVG text collisions, and console errors before preserving the screenshots.

## Commands to reuse

Local validation:

```bash
pnpm lint
pnpm build
E2E_BASE_URL=http://127.0.0.1:3020 pnpm exec playwright test tests/e2e/projects-dashboard-audit.spec.ts --reporter=list --workers=1
E2E_BASE_URL=http://127.0.0.1:3020 pnpm exec playwright test tests/e2e/hackathon-analytics.spec.ts --reporter=list --workers=1
```

Production validation:

```bash
curl -I https://rajeevg.com/projects/hackathon-voting-analytics
E2E_BASE_URL=https://rajeevg.com pnpm exec playwright test tests/e2e/projects-dashboard-audit.spec.ts --reporter=list --workers=1
E2E_BASE_URL=https://rajeevg.com pnpm exec playwright test tests/e2e/hackathon-analytics.spec.ts --reporter=list --workers=1
curl -I https://rajeevg.com/projects/hackathon-voting-analytics/google-analytics
E2E_BASE_URL=https://rajeevg.com pnpm exec playwright test tests/e2e/hackathon-ga4.spec.ts --reporter=list --workers=1
E2E_BASE_URL=https://rajeevg.com pnpm exec playwright test tests/e2e/hackathon-reporting-consistency.spec.ts --reporter=list --workers=1
```
