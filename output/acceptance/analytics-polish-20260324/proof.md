# Analytics Screenshot Polish Proof

Date: 2026-03-24

## Scope

- `/blog/how-we-finished-the-ga4-property-setup-on-rajeevg-com`
- `/blog/how-we-built-a-consented-first-party-analytics-stack`

## What was corrected

- Replaced the GA4 realtime screenshot with a capture that visibly shows `project_click` in the key-events card.
- Added an explicit GA4 data-retention screenshot showing `14 months` for both event and user data retention.
- Replaced the previously blank GA4 custom-definitions screenshot with a loaded table from the live property.
- Replaced the weak Looker Studio image with a populated audience-and-devices page.
- Replaced the weak GTM screenshots with truthful web/server GTM evidence from the live interfaces.
- Rewrote captions so they only claim what is visible in the image or clearly framed cross-check context.

## Local validation

- `pnpm lint` passed.
- `pnpm build` passed.
- Fresh local screenshots captured with Playwright CLI:
  - `local-ga4-property-desktop.png`
  - `local-ga4-property-mobile.png`
  - `local-analytics-stack-desktop.png`
  - `local-analytics-stack-mobile.png`

## Production validation

- Production deploy completed and aliased to `https://rajeevg.com`.
- Fresh production screenshots captured with Playwright CLI:
  - `prod-ga4-property-desktop.png`
  - `prod-ga4-property-mobile.png`
  - `prod-analytics-stack-desktop.png`
  - `prod-analytics-stack-mobile.png`
- Both article URLs returned `HTTP/2 200`:
  - `https://rajeevg.com/blog/how-we-finished-the-ga4-property-setup-on-rajeevg-com`
  - `https://rajeevg.com/blog/how-we-built-a-consented-first-party-analytics-stack`
- Replacement image assets returned `HTTP/2 200` from production:
  - `ga4-realtime-overview.png`
  - `ga4-data-retention.png`
  - `ga-custom-definitions.png`
  - `looker-dashboard-audience-devices.png`
- GA4 realtime API cross-check after the fresh production interaction pass:
  - `project_click = 2`
  - top custom-event mix still included `scroll_depth`, `article_progress`, `page_engagement_summary`, `engaged_time`, `page_context`, and `post_click`

## Manual screenshot audit notes

- GA4 property article:
  - Realtime caption now matches the visible lower-card content and `project_click` count.
  - DebugView caption matches the empty debug surface.
  - Data-retention text now explicitly mentions the 14-month setting and is backed by a screenshot.
- Analytics stack article:
  - Custom-definitions image is no longer blank.
  - Looker image is no longer sparse or misleading.
  - Server-side GTM now uses the versions page because it is the truthful proof surface.
  - Web GTM now uses the lean live workspace instead of an unhelpful older crop.
