# Dashboard Post-Audit Report

Date: March 26, 2026

## Scope

This post-audit covers the public dashboards and related editorial copy touched by the denominator-clarity pass:

- `/projects/hackathon-voting-analytics/google-analytics`
- `/projects/site-analytics`
- `/dashboard`
- the hackathon measurement blog post discussing consent and telemetry denominators

## What changed

### Hackathon measurement dashboard

- Renamed labels so units and scope are obvious:
  - `Tracked events` -> `All tracked host events`
  - `Tracked users` -> `Tracked GA4 users`
  - `Tracked vote submissions` -> `Tracked matched vote submissions`
- Reframed the consent card as `Known-consent action mix`.
- Changed the consent card from topline percentages to ratio-first counts:
  - `Consented tracked actions`
  - `Non-consented tracked actions`
- Updated supporting copy so it explicitly says the consent split is:
  - action-level
  - not a user split
  - not a vote-capture rate
  - not directly comparable to stored votes or vote-tracking coverage
- Kept vote coverage ratio-first so the denominator is visible.

### Site analytics dashboard

- Renamed ambiguous labels:
  - `Avg engagement` -> `Avg engagement per user`
  - `Blog share` -> `Blog share of page views`
  - row-level `Engagement` -> `Total engagement time`
- Added `Key-event hits` wording to the portfolio events list.
- Fixed the Observable Plot top-blog chart so it no longer emits the clipped auxiliary SVG legend that was failing the strict text-bounds audit.

### Route cleanup

- `/dashboard` now redirects to `/projects/site-analytics` in-browser instead of showing a placeholder dashboard shell.

### Editorial copy

- Updated the browser-consent blog post so the page-level `page_context` split is explicitly separated from:
  - overall hackathon action mix
  - vote-capture coverage

## Mathematical clarity checks

The main confusing comparison before this pass was:

- `Known-consent action mix`: `1,337 / 1,650 = 81%`
- `Vote tracking coverage`: `168 / 297 = 56.6%`

These now present as different ratios with different denominators visible in the UI and supporting copy.

The audit standard used for each visible metric was:

1. numerator is named
2. denominator is either visible or stated in nearby copy
3. unit is inferable from the label
4. adjacent cards do not imply a shared denominator when they do not share one

## Validation

### Local checks

- `pnpm lint`
- `pnpm build`
- `E2E_BASE_URL=http://127.0.0.1:3032 pnpm exec playwright test tests/e2e/hackathon-ga4.spec.ts tests/e2e/hackathon-post-and-site-analytics.spec.ts tests/e2e/projects-dashboard-audit.spec.ts --reporter=list --workers=1`

Result:

- `13` passed
- `3` skipped mobile audit variants by design
- `0` failures

### Key audit outcomes

- Hackathon BigQuery dashboard audit: pass
- Hackathon GA4 dashboard audit: pass
- Site analytics dashboard audit: pass
- Placeholder dashboard redirect browser proof: pass

### Production checks

- `vercel deploy --prod --yes`
- `curl -I https://rajeevg.com/projects/site-analytics`
- `curl -I https://rajeevg.com/projects/hackathon-voting-analytics/google-analytics`
- `curl -I https://rajeevg.com/dashboard`
- `E2E_BASE_URL=https://rajeevg.com pnpm exec playwright test tests/e2e/hackathon-ga4.spec.ts tests/e2e/hackathon-post-and-site-analytics.spec.ts tests/e2e/projects-dashboard-audit.spec.ts --reporter=list --workers=1`

Result:

- production deploy completed and aliased to `https://rajeevg.com`
- site analytics route returned `200`
- hackathon GA4 route returned `200`
- `/dashboard` now returns `307` to `/projects/site-analytics`
- Playwright prod proof: `13` passed, `3` skipped, `0` failures

## Assessment

The dashboards are materially clearer after this pass because the most misleading metric pairings now expose their denominator differences instead of hiding them.

The biggest improvement is that the consent card no longer competes visually with vote coverage as if both were equivalent percentages from the same population. The site analytics dashboard is also cleaner because row-level engagement labels now match what is actually being measured.

## Residual observations

- The first post-deploy Playwright run saw one broken-image failure on the hackathon article while the new alias was still warming. A direct `curl -I` on the image returned `200`, and the immediate rerun of the full production suite passed cleanly. The final production state is green.
