# Hackathon BigQuery Link Investigation Proof

Generated: 2026-03-25

## Scope

This proof records the admin-side investigation for the live GA4 to BigQuery export behind:

- `https://rajeevg.com/projects/hackathon-voting-analytics`
- `https://rajeevg.com/projects/hackathon-voting-analytics/google-analytics`

## Admin API findings

Fresh live Admin API evidence confirmed:

- property: `498363924`
- link: `properties/498363924/bigQueryLinks/QW0m3ZzhTl2jFYPJO2MIzA`
- linked project: `projects/401448512581`
- created: `2026-03-23T22:07:07.294Z`
- dataset location: `EU`
- daily export: enabled
- streaming export: enabled
- selected streams:
  - `properties/498363924/dataStreams/11542983613`
  - `properties/498363924/dataStreams/14214480224`
- excluded events:
  - none returned by the live Admin API response

## BigQuery findings

Fresh direct BigQuery checks confirmed:

- raw export dataset `personal-gws-1:ga4_498363924`
  - landed table count: `0`
- modeled dataset `personal-gws-1:hackathon_reporting`
  - landed table count: `8`
  - total row count: `0`

That proves the break is upstream of warehouse modeling. The export link exists and is enabled, but no raw export tables have landed.

## Event-day evidence

Fresh source-of-truth voting summary:

- persisted votes: `297`
- unique judges: `37`
- total entries: `9`
- started at: `2026-03-25T15:18:40.027Z`

Fresh direct GA4 event-day counts for `hostName = vote.rajeevg.com`:

- `vote_dialog_viewed = 342`
- `page_context = 215`
- `vote_submitted = 172`
- `consent_state_updated = 33`
- `judge_auth_completed = 19`

Fresh direct GA4 consent-state counts for `page_context`:

- `denied = 172`
- `granted = 43`
- no unknown row returned

Fresh direct GA4 consent-state counts for `vote_dialog_viewed`:

- `granted = 278`
- `denied = 5`
- blank = `59`

That blank dialog-state bucket is not a third consent state. It means those dialog events did not carry a populated `analytics_consent_state` custom dimension. The public GA4 page now stops presenting that as a standalone UX metric and instead uses `page_context` as the consent-rate proxy.

## Public-page proof

Fresh production proof after deploy:

- `E2E_BASE_URL=https://rajeevg.com pnpm exec playwright test tests/e2e/hackathon-analytics.spec.ts tests/e2e/hackathon-ga4.spec.ts tests/e2e/hackathon-reporting-consistency.spec.ts --reporter=list --workers=1`
  - `6 passed`
- `E2E_BASE_URL=https://rajeevg.com pnpm exec playwright test tests/e2e/projects-dashboard-audit.spec.ts --reporter=list --workers=1`
  - `3 passed, 3 skipped`

Fresh production screenshots:

- BigQuery warehouse-status desktop:
  - [/Users/rajeev/Code/rajeevg.com/output/acceptance/projects-dashboard-audit-20260325/prod/hackathon-bigquery-desktop-light-warehouse-status.png](/Users/rajeev/Code/rajeevg.com/output/acceptance/projects-dashboard-audit-20260325/prod/hackathon-bigquery-desktop-light-warehouse-status.png)
- BigQuery warehouse-status mobile:
  - [/Users/rajeev/Code/rajeevg.com/output/acceptance/projects-dashboard-audit-20260325/prod/hackathon-bigquery-mobile-dark-warehouse-status.png](/Users/rajeev/Code/rajeevg.com/output/acceptance/projects-dashboard-audit-20260325/prod/hackathon-bigquery-mobile-dark-warehouse-status.png)
- GA4 event-day surface desktop:
  - [/Users/rajeev/Code/rajeevg.com/output/acceptance/projects-dashboard-audit-20260325/prod/hackathon-ga4-desktop-light-event-day-event-surface.png](/Users/rajeev/Code/rajeevg.com/output/acceptance/projects-dashboard-audit-20260325/prod/hackathon-ga4-desktop-light-event-day-event-surface.png)
- GA4 entry surface mobile:
  - [/Users/rajeev/Code/rajeevg.com/output/acceptance/projects-dashboard-audit-20260325/prod/hackathon-ga4-mobile-dark-entry-surface.png](/Users/rajeev/Code/rajeevg.com/output/acceptance/projects-dashboard-audit-20260325/prod/hackathon-ga4-mobile-dark-entry-surface.png)

## Raw evidence file

- [/Users/rajeev/Code/rajeevg.com/output/acceptance/hackathon-bigquery-link-investigation-20260325/live-evidence.json](/Users/rajeev/Code/rajeevg.com/output/acceptance/hackathon-bigquery-link-investigation-20260325/live-evidence.json)
