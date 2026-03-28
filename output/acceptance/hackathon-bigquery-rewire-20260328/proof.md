# Hackathon BigQuery Rewire Proof

Date: 2026-03-28

## Root cause fixed

- The reporting stack had been checking `ga4_498363924`.
- The live GA4 export is landing in `analytics_498363924`.
- The warehouse refresh procedure and dashboard status checks were updated to use `analytics_498363924`.

## Raw export evidence

Direct `bq ls` against `personal-gws-1:analytics_498363924` returned these live tables:

- `events_20260324`
- `events_20260325`
- `events_20260326`
- `events_20260327`
- `events_intraday_20260328`
- `pseudonymous_users_20260325`
- `pseudonymous_users_20260326`
- `pseudonymous_users_20260327`

## Modeled warehouse evidence

Direct row counts from `personal-gws-1.hackathon_reporting` after the refresh:

- `auth_funnel_daily`: `10`
- `daily_overview`: `5`
- `entry_performance`: `33`
- `event_breakdown`: `328`
- `experience_overview_daily`: `98`
- `manager_operations_daily`: `4`
- `round_snapshots`: `5`
- `voting_funnel_daily`: `164`

Total modeled rows: `647`

Daily overview rows after the refresh:

- `2026-03-24`: `2435` total events, `31` users, `4` vote submissions, `2` judge auth completions, `35` total score
- `2026-03-25`: `10934` total events, `90` users, `295` vote submissions, `31` judge auth completions, `1874` total score
- `2026-03-26`: `3185` total events, `104` users, `0` vote submissions, `0` judge auth completions, `0` total score
- `2026-03-27`: `445` total events, `9` users, `9` vote submissions, `0` judge auth completions, `55` total score
- `2026-03-28`: `183` total events, `4` users, `0` vote submissions, `0` judge auth completions, `0` total score

## Validation

Local checks:

- `pnpm lint`
- `pnpm build`
- `PORT=3031 pnpm exec playwright test tests/e2e/hackathon-analytics.spec.ts tests/e2e/hackathon-ga4.spec.ts tests/e2e/hackathon-reporting-consistency.spec.ts tests/e2e/projects-dashboard-audit.spec.ts --grep 'hackathon analytics dashboard|hackathon ga4 reporting surface|hackathon reporting shell consistency|hackathon BigQuery dashboard|hackathon GA4 dashboard' --reporter=list --workers=1`
- Result: `8 passed`, `2 skipped`

Production checks after deploy to `https://rajeevg.com`:

- `E2E_BASE_URL=https://rajeevg.com pnpm exec playwright test tests/e2e/hackathon-analytics.spec.ts tests/e2e/hackathon-ga4.spec.ts tests/e2e/hackathon-reporting-consistency.spec.ts tests/e2e/projects-dashboard-audit.spec.ts --grep 'hackathon analytics dashboard|hackathon ga4 reporting surface|hackathon reporting shell consistency|hackathon BigQuery dashboard|hackathon GA4 dashboard' --reporter=list --workers=1`
- Result: `8 passed`, `2 skipped`

Deploy:

- `vercel deploy --prod --yes`
- Production alias updated to `https://rajeevg.com`
