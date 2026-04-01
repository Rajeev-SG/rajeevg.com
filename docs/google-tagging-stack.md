# Google Tagging Stack Audit

Last updated: 2026-04-01

## Current live stack

- Site: `https://rajeevg.com`
- GA4 account: `362795631` (`rajeevg.com`)
- GA4 property: `498363924` (`rajeevg.com main`)
- Web data stream: `11542983613`
- Measurement ID: `G-675W3V0C78`
- Active web GTM container: `GTM-K2VRQS47`
- Legacy web GTM container retained but unused by the site: `GTM-MVJHJ6F4`
- GCP project: `personal-gws-1`
- BigQuery export dataset: `personal-gws-1:analytics_498363924`
- Dedicated MCP service account: `ga4-mcp@personal-gws-1.iam.gserviceaccount.com`

## What was retired

These components were part of the March 2026 server-side tagging setup and have now been decommissioned:

- Server GTM container: `GTM-W4GKTR3H`
- First-party tagging path: `https://rajeevg.com/metrics`
- Live Cloud Run service: `https://sgtm-live-6tmqixdp3a-nw.a.run.app`
- Preview Cloud Run service: `https://sgtm-preview-6tmqixdp3a-nw.a.run.app`
- Web GTM base-tag setting `server_container_url=https://rajeevg.com/metrics`
- App rewrite logic that forwarded `/metrics/:path*` to the server container

## Current architecture

- The app owns a structured analytics contract in [`src/lib/analytics.ts`](/Users/rajeev/Code/rajeevg.com/src/lib/analytics.ts) and [`src/components/analytics-data-layer.tsx`](/Users/rajeev/Code/rajeevg.com/src/components/analytics-data-layer.tsx).
- The consent manager lives in [`src/components/consent-manager.tsx`](/Users/rajeev/Code/rajeevg.com/src/components/consent-manager.tsx) and updates Google Consent Mode while gating Vercel Analytics.
- [`src/components/tag-manager-script.tsx`](/Users/rajeev/Code/rajeevg.com/src/components/tag-manager-script.tsx) now loads GTM directly from `https://www.googletagmanager.com`.
- [`next.config.ts`](/Users/rajeev/Code/rajeevg.com/next.config.ts) no longer proxies any analytics or tag requests through the app.
- The live web container still publishes the app-owned GA4 event taxonomy:
  - base Google tag
  - 5 GA4 event tags for the app-owned event families
  - 5 matching custom event triggers
  - Data Layer Variables for the promoted event parameters
- Production measurement is client-side only.
- BigQuery export remains active as a GA4 property feature, not as part of the retired server-side tagging transport.

## GTM state after decommission

### Web container `GTM-K2VRQS47`

- Live version: `4`
- Published: `2026-04-01`
- Change made: removed `server_container_url` from the base Google tag
- Result: custom `page_context`, click, search, engagement, and summary events still flow to GA4, but they now do so directly from the browser

### Server container `GTM-W4GKTR3H`

- Historical function: GA4 relay plus dependency-serving client for the former first-party `/metrics` path
- Current status: retired from live delivery and safe to remove from the browser traffic path

## GA4 property state

- Property timezone: `Europe/London`
- Currency: `GBP`
- Reporting identity: `BLENDED`
- Google Signals: enabled
- Data retention: `FOURTEEN_MONTHS`
- Key events aligned to the portfolio use case:
  - `contact_click`
  - `project_click`
  - `profile_click`
- A legacy `purchase` key event still exists on the property and remains non-deletable through the Admin API

## Verified live behavior

### Browser transport

- GTM script loads from `https://www.googletagmanager.com/gtm.js?id=GTM-K2VRQS47`
- GA4 script loads from Google-hosted endpoints
- GA4 collection uses Google-hosted collect endpoints rather than `https://rajeevg.com/metrics/g/collect`
- No measured production interactions rely on the retired `/metrics` path

### Consent behavior

- GTM still loads with Google Consent Mode defaults set to denied
- Advertising-related consent remains denied
- Clicking `Allow analytics` still emits `consent_state_updated`
- The app still replays `page_context` with `consent_rehydrated: true`
- Consent persists in `localStorage` as `analytics-consent-state`

### GA4 reporting

- Realtime continues to show the app-owned vocabulary landing in the property, including:
  - `page_context`
  - `navigation_click`
  - `project_click`
  - `post_click`
  - `blog_search`
  - `blog_search_focus`
  - `copy_code`
  - `engaged_time`
  - `section_view`
  - `page_engagement_summary`

## Removed app and infra dependencies

### App runtime

- Removed `NEXT_PUBLIC_GTM_SCRIPT_ORIGIN` from the runtime path
- Removed `SGTM_UPSTREAM_ORIGIN` from the runtime path
- Removed the `/metrics` rewrite from [`next.config.ts`](/Users/rajeev/Code/rajeevg.com/next.config.ts)
- Updated the public privacy policy in [`src/app/privacy/page.tsx`](/Users/rajeev/Code/rajeevg.com/src/app/privacy/page.tsx)

### Documentation

- Updated [`README.md`](/Users/rajeev/Code/rajeevg.com/README.md)
- Updated [`docs/analytics.md`](/Users/rajeev/Code/rajeevg.com/docs/analytics.md)
- Rewrote this audit to reflect the decommissioned state
- Added historical-notes language to the public analytics posts so they stop reading like the server-side stack is still current

### Cloud Run and server-side tagging

- Once the production app deploy is validated, the tagging-related Cloud Run services can be deleted without breaking measurement:
  - `sgtm-live`
  - `sgtm-preview`

## Historical note

The two public analytics case-study posts still document the March 2026 server-side buildout because that work really happened and is still useful as an engineering write-up. They are now explicitly framed as historical snapshots, while this document is the current operational source of truth.
