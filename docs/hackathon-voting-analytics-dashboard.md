# Hackathon Voting Analytics Dashboard

Last updated: 2026-03-24

## Purpose

This route is the primary reporting surface for the hackathon voting app:

- Production route: `https://rajeevg.com/projects/hackathon-voting-analytics`
- Source repo for the voting product: `https://github.com/Rajeev-SG/hackathon-voting-prototype`

It exists because the Looker Studio artifact was not trustworthy enough for the event-memory use case. The fallback dashboard lives inside `rajeevg.com`, reads only from the dedicated hackathon BigQuery reporting dataset, and keeps a full dummy-data mode so the visual shell can still be reviewed before export rows land.

## What the route does

- Reads live reporting rows from `personal-gws-1.hackathon_reporting`
- Never reads the main `rajeevg.com` page-reporting tables
- Lets the viewer switch between:
  - `ECharts`
  - `Observable Plot`
- Lets the viewer switch between:
  - `Live reporting`
  - `Dummy preview`

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

The live adapter is implemented in:

- [/Users/rajeev/Code/rajeevg.com/src/lib/hackathon-reporting.ts](/Users/rajeev/Code/rajeevg.com/src/lib/hackathon-reporting.ts)

The dummy dataset is implemented in:

- [/Users/rajeev/Code/rajeevg.com/src/lib/hackathon-reporting-dummy.ts](/Users/rajeev/Code/rajeevg.com/src/lib/hackathon-reporting-dummy.ts)

## Verified status on 2026-03-24

The route is live and production-verified.

Production proof:

- `curl -I https://rajeevg.com/projects/hackathon-voting-analytics` returned `200`
- Desktop Playwright proof passed on production
- Mobile Playwright proof passed on production

Current table-row counts in `personal-gws-1.hackathon_reporting`:

- `auth_funnel_daily`: `0`
- `daily_overview`: `0`
- `entry_performance`: `0`
- `event_breakdown`: `0`
- `experience_overview_daily`: `0`
- `manager_operations_daily`: `0`
- `round_snapshots`: `0`
- `voting_funnel_daily`: `0`

That means the live route is wired correctly, but the dashboard is still shell-first until the raw export starts landing rows.

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

## Commands to reuse

Local validation:

```bash
pnpm lint
pnpm build
E2E_BASE_URL=http://127.0.0.1:3018 pnpm exec playwright test tests/e2e/hackathon-analytics.spec.ts --reporter=list --workers=1
```

Production validation:

```bash
curl -I https://rajeevg.com/projects/hackathon-voting-analytics
E2E_BASE_URL=https://rajeevg.com pnpm exec playwright test tests/e2e/hackathon-analytics.spec.ts --reporter=list --workers=1
```
