# Google Tagging Stack Audit

Last updated: 2026-03-23

## Current stack

- Site: `https://rajeevg.com`
- GA4 account: `362795631` (`rajeevg.com`)
- GA4 property: `498363924` (`rajeevg.com main`)
- Web data stream: `11542983613`
- Measurement ID: `G-675W3V0C78`
- Web GTM container: `GTM-K2VRQS47`
- Server GTM container: `GTM-W4GKTR3H`
- Legacy GTM container retained but no longer the target: `GTM-MVJHJ6F4`
- First-party tagging path: `https://rajeevg.com/metrics`
- Live sGTM service: `https://sgtm-live-6tmqixdp3a-nw.a.run.app`
- Preview sGTM service: `https://sgtm-preview-6tmqixdp3a-nw.a.run.app`
- GCP project: `personal-gws-1`
- BigQuery dataset: `personal-gws-1:ga4_498363924`
- Dedicated MCP service account: `ga4-mcp@personal-gws-1.iam.gserviceaccount.com`
- Looker Studio report: `https://lookerstudio.google.com/reporting/b599834d-939c-4f4d-8b93-b5e3ccab699f`

## What is now implemented

- The app owns a structured analytics contract in [`src/lib/analytics.ts`](/Users/rajeev/Code/rajeevg.com/src/lib/analytics.ts) and [`src/components/analytics-data-layer.tsx`](/Users/rajeev/Code/rajeevg.com/src/components/analytics-data-layer.tsx).
- A persistent in-app consent manager now lives in [`src/components/consent-manager.tsx`](/Users/rajeev/Code/rajeevg.com/src/components/consent-manager.tsx) and updates Google Consent Mode while gating Vercel Analytics.
- Every event now carries shared page, device, viewport, session, referrer, and consent context.
- GTM is now delivered from a first-party path by [`src/components/tag-manager-script.tsx`](/Users/rajeev/Code/rajeevg.com/src/components/tag-manager-script.tsx) instead of directly loading `googletagmanager.com` as the primary script origin.
- Vercel rewrites `/metrics/:path*` to the live server container via [`next.config.ts`](/Users/rajeev/Code/rajeevg.com/next.config.ts).
- The live web container publishes the base Google tag and points it at the server container with `server_container_url=https://rajeevg.com/metrics`.
- The live server container both relays GA4 hits and serves GTM dependencies for the web container.
- The dedicated GA service account was upgraded from `Viewer` to `Editor` at the property level so the property can be managed by API.
- GA4 custom definitions are now promoted on the property:
  - 17 custom dimensions
  - 14 custom metrics
- A Looker Studio report was created and connected to the real GA4 property.
- The Looker Studio report navigation was cleaned up to site-relevant pages:
  - `Overview`
  - `Audience & Devices`
  - `Acquisition & Content`
  - `Engagement & Key Pages`
- The Codex MCP config at [`~/.codex/config.toml`](/Users/rajeev/.codex/config.toml) now includes:
  - `analytics_mcp`
  - `gcloud`
  - `gtm_mcp`

## Verified platform state

### GA4 and BigQuery

- The Analytics Admin API confirms the GA4 property is accessible via the dedicated service account key at `/Users/rajeev/.codex/auth/google/ga4-mcp-personal-gws-1.json`.
- The Analytics Admin API confirms an active BigQuery link:
  - `properties/498363924/bigQueryLinks/QW0m3ZzhTl2jFYPJO2MIzA`
  - project number: `401448512581` (`personal-gws-1`)
  - dataset location: `EU`
  - linked stream: `properties/498363924/dataStreams/11542983613`
- The BigQuery dataset `ga4_498363924` exists in `personal-gws-1`.
- Project billing is enabled on `personal-gws-1`.
- The export link is attached to the live web stream, but no `events_*` or `events_intraday_*` tables had landed yet at the time of audit. This is consistent with normal GA4 export latency immediately after activation and validation traffic.

### GTM and consent

- GTM loads correctly when `NEXT_PUBLIC_GTM_ID=GTM-K2VRQS47` is present.
- Fresh production proof on `https://rajeevg.com` showed:
  - pre-consent `page_context` events carry `analytics_consent_state: "denied"`
  - clicking `Allow analytics` emits `consent_state_updated`
  - the app replays `page_context` with `consent_rehydrated: true`
  - consent persists in `localStorage` as `analytics-consent-state`
- Production network proof showed:
  - `https://rajeevg.com/metrics/gtm.js?id=GTM-K2VRQS47` returns `200`
  - `https://rajeevg.com/metrics/g/collect` returns `200`
  - `https://sgtm-live-6tmqixdp3a-nw.a.run.app/healthy` returns `ok`
- Important nuance:
  - Google still sent cookieless GA4 consent-mode pings before storage consent was granted.
  - Evidence: `g/collect` requests contained consent markers such as `gcs=G100` / `G101` and `pscdl=denied`.
  - This means the setup is using Consent Mode v2 style modeled measurement, not a hard block on all pre-consent network traffic.
- A Google-hosted script request with `gtg_health=1` still appears in the browser. Current evidence suggests this is a health/fallback probe, not the primary script delivery path, because the real executable path and collection path are both first-party and successful.

### GTM rebuild state

- The web GTM rebuild is live as version `2` on `GTM-K2VRQS47`.
- The server GTM rebuild is live as version `3` on `GTM-W4GKTR3H`.
- The server container now has:
  - GA4 client set to JavaScript-managed
  - GA4 relay tag
  - dependency-serving client for `GTM-K2VRQS47`
  - server URL configured to `https://rajeevg.com/metrics`
- The old workspace contamination problem was avoided by rebuilding on clean containers instead of extending the legacy container.
- Caveat:
  - GTM UI still decorates some tags with malware/paused warnings even though published runtime behavior passes live transport checks. Treat this as a UI anomaly that should be revisited, not a confirmed runtime failure.

### GA4 reporting promotion

- Custom dimensions created:
  - `page_type`
  - `site_section`
  - `content_group`
  - `content_type`
  - `content_id`
  - `content_tags`
  - `viewport_category`
  - `analytics_consent_state`
  - `referrer_type`
  - `section_name`
  - `item_type`
  - `link_type`
  - `destination`
  - `selected_tags`
  - `search_term`
  - `consent_preference`
  - `theme_to`
- Custom metrics created:
  - `route_depth`
  - `query_param_count`
  - `tag_count`
  - `project_count`
  - `selected_tag_count`
  - `search_term_length`
  - `interaction_sequence`
  - `copied_characters`
  - `engaged_seconds`
  - `engaged_seconds_total`
  - `interaction_count`
  - `section_views_count`
  - `max_scroll_depth_percent`
  - `max_article_progress_percent`

## Open gaps

### BigQuery landing data

- Setup is complete, but validation is still waiting on export latency.
- The BigQuery link exists and is correctly attached to the live web stream.
- No landing tables were present yet during this audit, so BigQuery-backed SQL models and Looker Studio BigQuery sources could not be verified against real rows in this same pass.

### Looker Studio refinement

- A real report now exists and is connected to the GA4 property.
- The irrelevant `eCommerce` page was removed and the remaining report pages were renamed to match the portfolio analytics use case.
- The next reporting pass, once BigQuery export tables land, should add:
  - a BigQuery-backed interaction and instrumentation QA page
  - a consent and tracking-quality monitoring page

## Audit verdict

- App-side analytics implementation: strong and materially improved.
- Consent persistence and state propagation: working.
- First-party GTM and server-side GTM delivery: working in production.
- GTM dependency serving through the first-party `/metrics` path: working in production.
- GA4 custom-definition promotion: completed.
- GA4 to BigQuery linkage: completed and verified at the Admin API level.
- Looker Studio report creation and GA4 connection: completed.
- “State of the art” Google stack: implemented, with one expected post-setup lag still outstanding: BigQuery tables had not landed yet during the same audit window.

## Evidence

- Live production proof:
  - [`output/acceptance/analytics-stack-20260323/live-proof.json`](/Users/rajeev/Code/rajeevg.com/output/acceptance/analytics-stack-20260323/live-proof.json)
  - [`output/playwright/analytics-stack-20260323/desktop-before-consent.png`](/Users/rajeev/Code/rajeevg.com/output/playwright/analytics-stack-20260323/desktop-before-consent.png)
  - [`output/playwright/analytics-stack-20260323/desktop-projects-after-consent.png`](/Users/rajeev/Code/rajeevg.com/output/playwright/analytics-stack-20260323/desktop-projects-after-consent.png)
  - [`output/playwright/analytics-stack-20260323/mobile-before-consent.png`](/Users/rajeev/Code/rajeevg.com/output/playwright/analytics-stack-20260323/mobile-before-consent.png)
  - [`output/playwright/analytics-stack-20260323/mobile-projects-after-consent.png`](/Users/rajeev/Code/rajeevg.com/output/playwright/analytics-stack-20260323/mobile-projects-after-consent.png)
  - [`output/acceptance/analytics-stack-20260323/looker-ga4-overview.png`](/Users/rajeev/Code/rajeevg.com/output/acceptance/analytics-stack-20260323/looker-ga4-overview.png)
  - [`output/acceptance/analytics-stack-20260323/looker-ga4-overview-cleaned.png`](/Users/rajeev/Code/rajeevg.com/output/acceptance/analytics-stack-20260323/looker-ga4-overview-cleaned.png)
- Core contract:
  - [`src/lib/analytics.ts`](/Users/rajeev/Code/rajeevg.com/src/lib/analytics.ts)
  - [`src/components/analytics-data-layer.tsx`](/Users/rajeev/Code/rajeevg.com/src/components/analytics-data-layer.tsx)
  - [`src/components/consent-manager.tsx`](/Users/rajeev/Code/rajeevg.com/src/components/consent-manager.tsx)
  - [`src/components/tag-manager-script.tsx`](/Users/rajeev/Code/rajeevg.com/src/components/tag-manager-script.tsx)
  - [`next.config.ts`](/Users/rajeev/Code/rajeevg.com/next.config.ts)
