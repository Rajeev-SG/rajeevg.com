# Dashboard Clarity Audit

Last updated: 2026-03-26

## Scope

Audited live dashboards on `https://rajeevg.com`:

- `/projects/hackathon-voting-analytics`
- `/projects/hackathon-voting-analytics/google-analytics`
- `/projects/site-analytics`
- `/dashboard`

## Evidence used

- Live Playwright audit run:
  - `E2E_BASE_URL=https://rajeevg.com pnpm exec playwright test tests/e2e/projects-dashboard-audit.spec.ts --reporter=list --workers=1`
- Key screenshot sets:
  - [/Users/rajeev/Code/rajeevg.com/output/acceptance/projects-dashboard-audit-20260325/prod/hackathon-bigquery-desktop-light-hero.png](/Users/rajeev/Code/rajeevg.com/output/acceptance/projects-dashboard-audit-20260325/prod/hackathon-bigquery-desktop-light-hero.png)
  - [/Users/rajeev/Code/rajeevg.com/output/acceptance/projects-dashboard-audit-20260325/prod/hackathon-ga4-desktop-light-hero.png](/Users/rajeev/Code/rajeevg.com/output/acceptance/projects-dashboard-audit-20260325/prod/hackathon-ga4-desktop-light-hero.png)
  - [/Users/rajeev/Code/rajeevg.com/output/acceptance/projects-dashboard-audit-20260325/prod/site-analytics-desktop-light-echarts-hero.png](/Users/rajeev/Code/rajeevg.com/output/acceptance/projects-dashboard-audit-20260325/prod/site-analytics-desktop-light-echarts-hero.png)
- Code reviewed:
  - [src/components/hackathon-ga4-dashboard.tsx](/Users/rajeev/Code/rajeevg.com/src/components/hackathon-ga4-dashboard.tsx)
  - [src/components/hackathon-analytics-dashboard.tsx](/Users/rajeev/Code/rajeevg.com/src/components/hackathon-analytics-dashboard.tsx)
  - [src/components/site-analytics-dashboard.tsx](/Users/rajeev/Code/rajeevg.com/src/components/site-analytics-dashboard.tsx)
  - [src/components/hackathon-reporting-shell.tsx](/Users/rajeev/Code/rajeevg.com/src/components/hackathon-reporting-shell.tsx)
  - [src/app/dashboard/page.tsx](/Users/rajeev/Code/rajeevg.com/src/app/dashboard/page.tsx)
  - [src/components/app-sidebar.tsx](/Users/rajeev/Code/rajeevg.com/src/components/app-sidebar.tsx)

## Anti-pattern verdict

Pass on visual quality. The dashboards do not read as generic AI slop.

Fail on language clarity. The live routes still rely on analyst-facing terms like `tracked`, `promoted`, `instrumentation`, `warehouse`, `raw export`, and `key events` without enough user-facing translation.

## Composition verdict

- Desktop width is generally used well.
- The shared shell creates a strong, consistent top-of-page layout.
- Mobile and tablet proof passed without overflow.
- The main weakness is not layout, it is terminology and denominator clarity.

## Executive summary

- Critical issues: 1
- High-severity issues: 5
- Medium-severity issues: 4
- Low-severity issues: 2

Top problems:

1. The public `/dashboard` route is still a placeholder scaffold and looks unfinished.
2. The hackathon GA4 route uses labels that encourage invalid comparisons between users, events, and consent cohorts.
3. The site analytics route leads with implementation jargon instead of plain-language business meaning.
4. The hackathon BigQuery route is technically honest but too infrastructure-heavy for most readers.

## Detailed findings

### Critical

1. Public placeholder dashboard route
Location: [src/app/dashboard/page.tsx](/Users/rajeev/Code/rajeevg.com/src/app/dashboard/page.tsx)
Impact: `https://rajeevg.com/dashboard` returns `200` and renders scaffold copy like `Building Your Application` and `Data Fetching` with empty boxes. That reads as an unfinished internal template, not a real product surface.
Recommendation: remove the route, redirect it, or replace it with real content before leaving it public.

### High

1. Consent summary on the live hackathon GA4 route still implies a clean split that does not match the nearby `Tracked users` card
Location: [src/components/hackathon-ga4-dashboard.tsx](/Users/rajeev/Code/rajeevg.com/src/components/hackathon-ga4-dashboard.tsx)
Impact: On the live page, `% accepted` and `% denied` are page-context percentages while `Tracked users` is a distinct-user total. Readers naturally compare them and get confused.
Recommendation: ship the prepared local fix that changes this to plain accepted and denied user counts with an explicit overlap note.

2. `Tracked users`, `Tracked vote submissions`, and `Analytics coverage` are accurate but cognitively expensive
Location: [src/components/hackathon-reporting-shell.tsx](/Users/rajeev/Code/rajeevg.com/src/components/hackathon-reporting-shell.tsx)
Impact: These labels force readers to infer what is telemetry, what is source-of-truth, and what the denominator is.
Recommendation: rename them to `Total tracked users`, `Votes seen in GA4`, and `GA4 coverage of recorded votes`.

3. `GA4 content and instrumentation dashboard` sounds like an internal implementation page, not a business-facing reporting page
Location: [src/components/site-analytics-dashboard.tsx](/Users/rajeev/Code/rajeevg.com/src/components/site-analytics-dashboard.tsx)
Impact: `instrumentation` is meaningful to developers but vague to everyone else.
Recommendation: rename the route heading to something like `Site analytics dashboard` and move instrumentation language into a secondary disclosure.

4. `Live reporting boundaries` leads with implementation details instead of user value
Location: [src/components/site-analytics-dashboard.tsx](/Users/rajeev/Code/rajeevg.com/src/components/site-analytics-dashboard.tsx)
Impact: The first thing readers see is property IDs, stream IDs, and filtering rules instead of what the dashboard helps them answer.
Recommendation: retitle this section as `What this dashboard covers` and collapse the property and stream details into a secondary note.

5. `Hackathon GA4` in the sidebar is too terse and inconsistent with the other project labels
Location: [src/components/app-sidebar.tsx](/Users/rajeev/Code/rajeevg.com/src/components/app-sidebar.tsx)
Impact: The sidebar mixes `Site analytics`, `Hackathon analytics`, and `Hackathon GA4`, which makes the third option feel like a technical implementation variant instead of a clear reporting view.
Recommendation: rename it to `Hackathon analytics (GA4)` or `Hackathon GA4 analytics`.

### Medium

1. `Blog share` sounds like social sharing, not traffic share
Location: [src/components/site-analytics-dashboard.tsx](/Users/rajeev/Code/rajeevg.com/src/components/site-analytics-dashboard.tsx)
Impact: Readers can misread it as shares-per-post or social amplification.
Recommendation: rename to `Share of views from blog` or `Blog share of traffic`.

2. `Avg engagement` hides the unit
Location: [src/components/site-analytics-dashboard.tsx](/Users/rajeev/Code/rajeevg.com/src/components/site-analytics-dashboard.tsx)
Impact: `13.1m` is easy to misread unless the reader opens the tooltip.
Recommendation: rename to `Avg engaged time`.

3. `Portfolio key events` is GA jargon
Location: [src/components/site-analytics-dashboard.tsx](/Users/rajeev/Code/rajeevg.com/src/components/site-analytics-dashboard.tsx)
Impact: Readers have to translate `key events` into `important actions` themselves.
Recommendation: rename to `Important actions` or `Key site actions`.

4. `Promoted site dimensions` and `Promoted site metrics` are implementation labels, not reader labels
Location: [src/components/site-analytics-dashboard.tsx](/Users/rajeev/Code/rajeevg.com/src/components/site-analytics-dashboard.tsx)
Impact: `promoted` makes sense in GA admin terminology but not to most dashboard readers.
Recommendation: rename to `Available GA4 dimensions for this site` and `Available GA4 metrics for this site`, or move them under a `Schema reference` disclosure.

### Low

1. `Current top entry readout` is vague
Location: [src/components/hackathon-analytics-dashboard.tsx](/Users/rajeev/Code/rajeevg.com/src/components/hackathon-analytics-dashboard.tsx)
Impact: `readout` is imprecise and slightly awkward.
Recommendation: rename to `Current leader snapshot`.

2. `Dummy preview` is technically fine but feels unserious on a reporting route
Location: [src/components/hackathon-analytics-dashboard.tsx](/Users/rajeev/Code/rajeevg.com/src/components/hackathon-analytics-dashboard.tsx)
Impact: It suggests fake data without telling the reader why the mode exists.
Recommendation: rename to `Preview modeled layout` or `Sample data preview`.

## Systemic issues

- `Tracked` is used repeatedly without a stable house meaning.
- GA and warehouse implementation terms are often shown before the reader-oriented explanation.
- Several cards rely on tooltip-only denominator clarification.
- The site mixes product names and implementation names in navigation.

## Positive findings

- The shared hackathon reporting shell is structurally strong and consistent.
- The dashboards make good use of collapsible schema and notes panels.
- The live Playwright audit passed across desktop, wide desktop, tablet, and mobile without overflow issues.
- The site analytics route has the clearest visual hierarchy of the three real dashboards.

## Recommended next steps

### Immediate

1. Remove or redirect `/dashboard`.
2. Ship the local consent-card fix that uses accepted and denied user counts with the overlap note.
3. Rename `Tracked users` to `Total tracked users` on the hackathon dashboards.

### Short-term

1. Rename `GA4 content and instrumentation dashboard` to `Site analytics dashboard`.
2. Rename `Live reporting boundaries` to `What this dashboard covers`.
3. Rename `Blog share`, `Avg engagement`, and `Portfolio key events` to plain-language alternatives.

### Medium-term

1. Consolidate schema-heavy panels under a single `Schema reference` or `Definitions` disclosure.
2. Standardize one site-wide glossary for `tracked`, `recorded`, `live`, `warehouse`, and `coverage`.
3. Align sidebar names so route purpose is clear before implementation detail.

## Consent status

The consent-card clarity fix is implemented locally but is not currently deployed because the local Vercel auth file was wiped and `vercel deploy --prod --yes` now fails with:

`Error: The specified token is not valid. Use \`vercel login\` to generate a new token.`
