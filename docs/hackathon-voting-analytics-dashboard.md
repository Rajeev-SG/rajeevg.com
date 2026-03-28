# Hackathon Voting Analytics Dashboard

Last updated: 2026-03-26

## Purpose

These routes are the in-site reporting surfaces for the hackathon voting app:

- Production BigQuery route: `https://rajeevg.com/projects/hackathon-voting-analytics`
- Production GA4 route: `https://rajeevg.com/projects/hackathon-voting-analytics/google-analytics`
- Voting app source repo: `https://github.com/Rajeev-SG/hackathon-voting-prototype`

They now separate three things clearly:

- the authoritative vote ledger from the voting app
- direct GA4 telemetry from the shared property
- warehouse status for the GA4-to-BigQuery export and the modeled `hackathon_reporting` dataset

## Current route behavior

### BigQuery route

Live mode on `/projects/hackathon-voting-analytics` is now strictly warehouse-scoped.

- It defaults to `Live reporting`, even when the warehouse is empty.
- It no longer shows GA4 route comparison toggles or GA4-derived metric cards.
- When modeled tables are empty, it renders warehouse evidence only:
  - warehouse row count
  - warehouse tables with data
  - raw GA4 export table count
  - daily BigQuery export status
  - streaming BigQuery export status
- It shows the Admin API BigQuery-link proof directly on the page:
  - link name
  - creation time
  - dataset location
  - selected streams
  - excluded events response
- `Dummy preview` only exists on this route, and only as an explicit preview mode.

### GA4 route

The GA4 route stays telemetry-focused and event-day scoped.

- It reads the shared GA4 property `498363924` through `@google-analytics/data`.
- It filters all report queries to `hostName = vote.rajeevg.com`.
- It is limited to the live event day derived from the voting app summary, not the older rolling window.
- It now shows only:
  - `Consent and measurement`
  - `Top tracked events`
  - `Entry-by-entry tracking`
- The consent summary now shows only two plain counts:
  - `Accepted`
  - `Denied`
- It no longer shows:
  - `Dummy preview`
  - `Experience`
  - `Manager operations`
  - `Round snapshot surface`
  - `Granted consent signals`
  - `Denied consent signals`
  - `Explicit accept actions`
  - `competition_state_snapshot`
  - `Measurement quality checks`
  - unmatched test-only entries in the visible entry cards
  - the old “GA4 closeness” framing that implied sign-in counts, tracked users, and vote telemetry could be collapsed into one definitive quality panel

## Interaction and layout rules now enforced

- The schema panel sits between the hero and the topline metrics.
- The schema panel is collapsed by default.
- The source-reconciliation panel is collapsed by default.
- Individual schema cards are collapsed by default.
- Visible metric labels now use tap-friendly inline popovers instead of anchor links, so readers can get definitions without jumping around the page on desktop or mobile.
- Panels expose at most five visible cards at once.
- Extra cards are moved behind a disclosure such as `More derived metrics`, `More schema fields`, `More event groups`, `More entries`, or `More modeled tables`.

## Admin-side BigQuery link investigation

Fresh admin-side evidence on 2026-03-25 confirmed the following for GA4 property `498363924`:

- BigQuery link: `properties/498363924/bigQueryLinks/QW0m3ZzhTl2jFYPJO2MIzA`
- Linked project: `projects/401448512581` (`personal-gws-1`)
- Created: `2026-03-23T22:07:07.294Z`
- Dataset location: `EU`
- `dailyExportEnabled = true`
- `streamingExportEnabled = true`
- Selected streams:
  - `properties/498363924/dataStreams/11542983613`
  - `properties/498363924/dataStreams/14214480224`
- Excluded events:
  - none returned by the live Admin API response

Fresh BigQuery checks at the same time showed:

- raw export dataset `personal-gws-1:analytics_498363924`
  - landed table count: active `events_*`, `events_intraday_*`, and `pseudonymous_users_*` tables are present
- modeled dataset `personal-gws-1:hackathon_reporting`
  - landed tables: `8`
  - total landed modeled rows: `0`

That means the export path itself is live. The real break was that the dashboard and warehouse SQL were querying `ga4_498363924`, while Google was exporting into `analytics_498363924`.

## Event-day truth and telemetry

The reporting routes now pin themselves to the archived 25 March 2026 hackathon snapshot whenever the live voting app summary has reset back to a new `PREPARING` state. Without that guard, the public dashboard would incorrectly show zero recorded votes and today's empty app state instead of the finished event ledger.

Fresh source-of-truth summary from `https://vote.rajeevg.com/api/reporting/public-summary` on 2026-03-25:

- generated at: `2026-03-25T23:13:44.893Z`
- started at: `2026-03-25T15:18:40.027Z`
- finalized at: `null`
- persisted votes: `297`
- unique judges: `37`
- total entries: `9`

Fresh direct GA4 event-day proof for `hostName = vote.rajeevg.com` on 2026-03-25:

- `vote_dialog_viewed = 342`
- `page_context = 215`
- `vote_submitted = 172`
- `consent_state_updated = 33`
- `judge_auth_completed = 19`

Fresh direct consent-state proof for `page_context` on 2026-03-25:

- `accepted users = 32`
- `denied users = 34`

Fresh direct consent-state proof for `vote_dialog_viewed` on 2026-03-25:

- `granted = 278`
- `denied = 5`
- blank consent-state value = `59`

Important interpretation:

- `unknown` or blank consent state is not a third user consent state.
- It means the event row did not carry a populated `analytics_consent_state` custom dimension.
- The consent card now counts tracked `page_context` rows with a granted versus denied analytics state.
- Those counts describe telemetry state on tracked page loads, not people and not explicit accept-or-deny actions.
- The GA4 entry cards now exclude rows that do not match the live competition slate, so test entries such as `raj-test` or `test-2` do not appear in the visible entry analysis.

## Verified status on production

The live production routes were redeployed on 2026-03-25 and again on 2026-03-26, then revalidated directly against `https://rajeevg.com`.

Fresh consent-summary deploy validation on 2026-03-26:

- `vercel deploy --prod --yes`
  - deployment URL: `https://rajeevg-2w15uhum4-rajeevgills-projects.vercel.app`
- `curl -I https://rajeevg.com/projects/hackathon-voting-analytics/google-analytics`
  - result: `HTTP/2 200`
- `curl -I https://rajeevg.com/projects/hackathon-voting-analytics`
  - result: `HTTP/2 200`
- `E2E_BASE_URL=https://rajeevg.com pnpm exec playwright test tests/e2e/hackathon-ga4.spec.ts --reporter=list --workers=1`
  - result: `2 passed`

Production validation passed:

- `E2E_BASE_URL=https://rajeevg.com pnpm exec playwright test tests/e2e/hackathon-analytics.spec.ts tests/e2e/hackathon-ga4.spec.ts tests/e2e/hackathon-reporting-consistency.spec.ts --reporter=list --workers=1`
  - result: `6 passed`
- `E2E_BASE_URL=https://rajeevg.com pnpm exec playwright test tests/e2e/projects-dashboard-audit.spec.ts --reporter=list --workers=1`
  - result: `3 passed, 3 skipped`
  - the skips are expected because that spec manages its own viewport matrix inside the desktop project

Local validation also passed:

- `pnpm lint`
- `pnpm build`
- `E2E_BASE_URL=http://127.0.0.1:3020 pnpm exec playwright test tests/e2e/hackathon-analytics.spec.ts tests/e2e/hackathon-ga4.spec.ts tests/e2e/hackathon-reporting-consistency.spec.ts --reporter=list --workers=1`
  - result: `6 passed`
- `E2E_BASE_URL=http://127.0.0.1:3020 pnpm exec playwright test tests/e2e/projects-dashboard-audit.spec.ts --reporter=list --workers=1`
  - result: `3 passed, 3 skipped`

## Evidence

- BigQuery desktop top proof:
  - [/Users/rajeev/Code/rajeevg.com/output/playwright/hackathon-dashboard-20260325/desktop-light-top.png](/Users/rajeev/Code/rajeevg.com/output/playwright/hackathon-dashboard-20260325/desktop-light-top.png)
- BigQuery mobile top proof:
  - [/Users/rajeev/Code/rajeevg.com/output/playwright/hackathon-dashboard-20260325/mobile-dark-top.png](/Users/rajeev/Code/rajeevg.com/output/playwright/hackathon-dashboard-20260325/mobile-dark-top.png)
- GA4 desktop top proof:
  - [/Users/rajeev/Code/rajeevg.com/output/playwright/hackathon-ga4-dashboard-20260325/desktop-light-top.png](/Users/rajeev/Code/rajeevg.com/output/playwright/hackathon-ga4-dashboard-20260325/desktop-light-top.png)
- GA4 mobile top proof:
  - [/Users/rajeev/Code/rajeevg.com/output/playwright/hackathon-ga4-dashboard-20260325/mobile-dark-top.png](/Users/rajeev/Code/rajeevg.com/output/playwright/hackathon-ga4-dashboard-20260325/mobile-dark-top.png)
- Production warehouse-status audit screenshot:
  - [/Users/rajeev/Code/rajeevg.com/output/acceptance/projects-dashboard-audit-20260325/prod/hackathon-bigquery-desktop-light-warehouse-status.png](/Users/rajeev/Code/rajeevg.com/output/acceptance/projects-dashboard-audit-20260325/prod/hackathon-bigquery-desktop-light-warehouse-status.png)
- Production GA4 event-day audit screenshot:
  - [/Users/rajeev/Code/rajeevg.com/output/acceptance/projects-dashboard-audit-20260325/prod/hackathon-ga4-desktop-light-event-day-event-surface.png](/Users/rajeev/Code/rajeevg.com/output/acceptance/projects-dashboard-audit-20260325/prod/hackathon-ga4-desktop-light-event-day-event-surface.png)
- Production GA4 mobile entry-surface audit screenshot:
  - [/Users/rajeev/Code/rajeevg.com/output/acceptance/projects-dashboard-audit-20260325/prod/hackathon-ga4-mobile-dark-entry-surface.png](/Users/rajeev/Code/rajeevg.com/output/acceptance/projects-dashboard-audit-20260325/prod/hackathon-ga4-mobile-dark-entry-surface.png)
- 2026-03-26 consent-summary local proof:
  - [/Users/rajeev/Code/rajeevg.com/output/acceptance/hackathon-ga4-consent-summary-20260326/local-proof.md](/Users/rajeev/Code/rajeevg.com/output/acceptance/hackathon-ga4-consent-summary-20260326/local-proof.md)
- 2026-03-26 consent-summary production proof:
  - [/Users/rajeev/Code/rajeevg.com/output/acceptance/hackathon-ga4-consent-summary-20260326/prod-proof.md](/Users/rajeev/Code/rajeevg.com/output/acceptance/hackathon-ga4-consent-summary-20260326/prod-proof.md)
- Admin-side investigation proof:
  - [/Users/rajeev/Code/rajeevg.com/output/acceptance/hackathon-bigquery-link-investigation-20260325/proof.md](/Users/rajeev/Code/rajeevg.com/output/acceptance/hackathon-bigquery-link-investigation-20260325/proof.md)
  - [/Users/rajeev/Code/rajeevg.com/output/acceptance/hackathon-bigquery-link-investigation-20260325/live-evidence.json](/Users/rajeev/Code/rajeevg.com/output/acceptance/hackathon-bigquery-link-investigation-20260325/live-evidence.json)

## Commands to reuse

Local:

```bash
pnpm lint
pnpm build
E2E_BASE_URL=http://127.0.0.1:3020 pnpm exec playwright test tests/e2e/hackathon-analytics.spec.ts tests/e2e/hackathon-ga4.spec.ts tests/e2e/hackathon-reporting-consistency.spec.ts --reporter=list --workers=1
E2E_BASE_URL=http://127.0.0.1:3020 pnpm exec playwright test tests/e2e/projects-dashboard-audit.spec.ts --reporter=list --workers=1
```

Production:

```bash
vercel deploy --prod --yes
E2E_BASE_URL=https://rajeevg.com pnpm exec playwright test tests/e2e/hackathon-analytics.spec.ts tests/e2e/hackathon-ga4.spec.ts tests/e2e/hackathon-reporting-consistency.spec.ts --reporter=list --workers=1
E2E_BASE_URL=https://rajeevg.com pnpm exec playwright test tests/e2e/projects-dashboard-audit.spec.ts --reporter=list --workers=1
```
