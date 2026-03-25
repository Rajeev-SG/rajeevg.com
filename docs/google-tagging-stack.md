# Google Tagging Stack Audit

Last updated: 2026-03-25

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
- Hackathon warehouse-aware reporting route: `https://rajeevg.com/projects/hackathon-voting-analytics`
- Hackathon GA4 API surface: `https://rajeevg.com/projects/hackathon-voting-analytics/google-analytics`
- Legacy Looker Studio artifact retained only as a non-authoritative draft: `https://lookerstudio.google.com/reporting/b599834d-939c-4f4d-8b93-b5e3ccab699f`

## What is now implemented

- The app owns a structured analytics contract in [`src/lib/analytics.ts`](/Users/rajeev/Code/rajeevg.com/src/lib/analytics.ts) and [`src/components/analytics-data-layer.tsx`](/Users/rajeev/Code/rajeevg.com/src/components/analytics-data-layer.tsx).
- A persistent in-app consent manager now lives in [`src/components/consent-manager.tsx`](/Users/rajeev/Code/rajeevg.com/src/components/consent-manager.tsx) and updates Google Consent Mode while gating Vercel Analytics.
- Every event now carries shared page, device, viewport, session, referrer, and consent context.
- GTM is now delivered from a first-party path by [`src/components/tag-manager-script.tsx`](/Users/rajeev/Code/rajeevg.com/src/components/tag-manager-script.tsx) instead of directly loading `googletagmanager.com` as the primary script origin.
- Vercel rewrites `/metrics/:path*` to the live server container via [`next.config.ts`](/Users/rajeev/Code/rajeevg.com/next.config.ts).
- The live web container publishes the base Google tag and points it at the server container with `server_container_url=https://rajeevg.com/metrics`.
- The live web container now forwards the app-owned event families into GA4 with dedicated event tags for page context, click interactions, search and preferences, engagement milestones, and page engagement summaries.
- The live server container both relays GA4 hits and serves GTM dependencies for the web container.
- The dedicated GA service account was upgraded from `Viewer` to `Editor` at the property level so the property can be managed by API.
- GA4 custom definitions are now promoted on the property:
  - 36 custom dimensions total on the shared property
  - 28 custom metrics total on the shared property
  - 24 of those dimensions and 18 of those metrics are site-relevant to `rajeevg.com`
- The property timezone is now `Europe/London` instead of `Etc/GMT`.
- The live property now treats `contact_click`, `project_click`, and `profile_click` as portfolio key events.
- Enhanced measurement was tightened so Google keeps default page views and SPA page changes, but does not add duplicate generic `scroll` and outbound `click` events on top of the site's custom instrumentation.
- The primary hackathon reporting artifact is now the in-site warehouse-aware dashboard at `/projects/hackathon-voting-analytics`.
- The shared GA4 property now also has a dedicated in-site GA API validation surface at `/projects/hackathon-voting-analytics/google-analytics`.
- That route uses:
  - a dedicated BigQuery adapter
  - the isolated `hackathon_reporting` dataset
  - `ECharts` and `Observable Plot` renderers
  - a `Dummy preview` mode so the shell stays reviewable before rows land
- The GA API route uses:
  - the official `@google-analytics/data` client
  - property `498363924`
  - host filter `vote.rajeevg.com`
  - stream marker `14214480224`
  - promoted hackathon custom dimensions and metrics verified through `analytics_mcp`
- The Codex MCP config at [`~/.codex/config.toml`](/Users/rajeev/.codex/config.toml) now includes:
  - `analytics_mcp`
  - `gcloud`
  - `gtm_mcp`
- The reporting adapters now trim whitespace on `GA4_*` and `BIGQUERY_*` env values before using them in exact filters or dataset lookups, which fixed a production false-zero on the hackathon routes when Vercel env values contained trailing newlines.

## Verified platform state

### GA4 and BigQuery

- The Analytics Admin API confirms the GA4 property is accessible via the dedicated service account key at `/Users/rajeev/.codex/auth/google/ga4-mcp-personal-gws-1.json`.
- The GA4 property now reports in `Europe/London` with `GBP` currency.
- Reporting identity is `BLENDED`.
- Google Signals is enabled.
- Event and user retention are both set to `FOURTEEN_MONTHS` with reset-on-new-activity enabled.
- The Analytics Admin API confirms an active BigQuery link:
  - `properties/498363924/bigQueryLinks/QW0m3ZzhTl2jFYPJO2MIzA`
  - project number: `401448512581` (`personal-gws-1`)
  - dataset location: `EU`
  - linked stream: `properties/498363924/dataStreams/11542983613`
- The BigQuery dataset `ga4_498363924` exists in `personal-gws-1`.
- Project billing is enabled on `personal-gws-1`.
- The export link is attached to the live web stream, but as of 2026-03-25 no `events_*` or `events_intraday_*` tables had landed yet. The route-level reconciliation proof now confirms that this lag is real rather than a dashboard-query bug, because direct GA4 report queries return hackathon rows while raw export still has zero landed tables.

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
- Fresh network proof on 2026-03-24 showed `g/collect` requests carrying custom events such as:
  - `consent_state_updated`
  - `page_context`
  - `page_engagement_summary`
- Those live requests also carried custom event parameters such as:
  - `page_type`
  - `site_section`
  - `content_group`
  - `content_id`
  - `query_param_count`
  - `page_view_sequence`
  - `viewport_category`
  - `analytics_consent_state`
  - `browser_session_id`
  - `page_view_id`
- Important nuance:
  - Google still sent cookieless GA4 consent-mode pings before storage consent was granted.
  - Evidence: `g/collect` requests contained consent markers such as `gcs=G100` / `G101` and `pscdl=denied`.
  - This means the setup is using Consent Mode v2 style modeled measurement, not a hard block on all pre-consent network traffic.
- A Google-hosted script request with `gtg_health=1` still appears in the browser. Current evidence suggests this is a health/fallback probe, not the primary script delivery path, because the real executable path and collection path are both first-party and successful.

### GTM rebuild state

- The web GTM rebuild is live as version `3` on `GTM-K2VRQS47`.
- The server GTM rebuild is live as version `3` on `GTM-W4GKTR3H`.
- The live web container now includes:
  - the base Google tag
  - 5 GA4 event tags for the app-owned event families
  - 5 matching custom event triggers
  - a full set of Data Layer Variables for the promoted event parameters
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
  - `content_slug`
  - `analytics_section`
  - `theme`
  - `color_scheme`
  - `screen_orientation`
  - `consent_rehydrated`
  - `filter_state`
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
  - `result_count`
  - `scroll_depth_percent`
  - `article_progress_percent`
  - `page_view_sequence`

### Realtime validation

- Realtime reporting now shows the app-owned event vocabulary landing in GA4, including:
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
- This resolved the earlier mismatch where the browser `dataLayer` was rich but GA4 reporting only showed default Google events.

### Key events

- Portfolio-relevant key events now live on the property:
  - `contact_click`
  - `project_click`
  - `profile_click`
- A legacy `purchase` key event is still present on the property. The Admin API currently returns it as non-deletable, so it was left in place and documented instead of silently ignored.

## Open gaps

### BigQuery landing data

- Setup is complete, service-account access is fixed, and the dashboard can now report the discrepancy honestly.
- The BigQuery link exists and is correctly attached to the live web stream.
- The dedicated reporting dataset for the hackathon dashboard is `personal-gws-1:hackathon_reporting`.
- On 2026-03-25, the reporting tables still had zero rows:
  - `auth_funnel_daily`
  - `daily_overview`
  - `entry_performance`
  - `event_breakdown`
  - `experience_overview_daily`
  - `manager_operations_daily`
  - `round_snapshots`
  - `voting_funnel_daily`
- The raw export dataset `personal-gws-1:ga4_498363924` also still had `0` landed tables.
- Because of that, the BigQuery route now uses a GA4-derived modeled fallback instead of pretending the warehouse has landed data.

### Hackathon reporting route

- The route lives at `https://rajeevg.com/projects/hackathon-voting-analytics`.
- The companion GA route lives at `https://rajeevg.com/projects/hackathon-voting-analytics/google-analytics`.
- It is the primary reporting fallback for the hackathon voting app.
- It was explicitly built because the Looker Studio artifact was not strong enough to trust as the historic reporting surface.
- It is isolated from main-site page analytics and does not read the generic `rajeevg.com` content-reporting tables.
- It now exposes source-reconciliation notes so the page can say whether it is rendering:
  - modeled BigQuery rows
  - a GA4-derived modeled fallback
  - or an error-backed fallback
- Runtime envs now set on the Vercel production project:
  - `BIGQUERY_PROJECT_ID`
  - `BIGQUERY_DATASET_ID`
  - `BIGQUERY_SERVICE_ACCOUNT_JSON`
  - `GA4_PROPERTY_ID`
  - `GA4_SERVICE_ACCOUNT_JSON`
  - `GA4_HACKATHON_HOSTNAME`
  - `GA4_HACKATHON_STREAM_ID`
- Fresh proof on 2026-03-25:
  - `curl -I https://rajeevg.com/projects/hackathon-voting-analytics` returned `200`
  - `curl -I https://rajeevg.com/projects/hackathon-voting-analytics/google-analytics` returned `200`
  - production desktop Playwright proof passed
  - production mobile Playwright proof passed
  - production shared-shell consistency proof passed
  - exhaustive production dashboard audit passed for the hackathon BigQuery route, the hackathon GA4 route, and `/projects/site-analytics`
  - `analytics_mcp.run_report` accepted the hackathon property query shapes used by the GA API route without metric or dimension errors
  - direct GA4 proof for `hostName = vote.rajeevg.com` now stays explicitly separate from the authoritative vote total:
    - live persisted votes from `https://vote.rajeevg.com/api/reporting/public-summary`: `297`
    - GA4 `vote_submitted`: `20`
    - dashboard persisted-vote cards on both hackathon routes: `297`
    - GA4 coverage shown on-page: `6.7%`
  - screenshots:
    - [`desktop-light-top.png`](/Users/rajeev/Code/rajeevg.com/output/playwright/hackathon-dashboard-20260324/desktop-light-top.png)
    - [`desktop-light-voting-funnel.png`](/Users/rajeev/Code/rajeevg.com/output/playwright/hackathon-dashboard-20260324/desktop-light-voting-funnel.png)
    - [`mobile-dark-top.png`](/Users/rajeev/Code/rajeevg.com/output/playwright/hackathon-dashboard-20260324/mobile-dark-top.png)
    - [`output/playwright/hackathon-ga4-dashboard-20260324/desktop-light-top.png`](/Users/rajeev/Code/rajeevg.com/output/playwright/hackathon-ga4-dashboard-20260324/desktop-light-top.png)
    - [`output/playwright/hackathon-ga4-dashboard-20260324/mobile-dark-top.png`](/Users/rajeev/Code/rajeevg.com/output/playwright/hackathon-ga4-dashboard-20260324/mobile-dark-top.png)
    - [`output/playwright/hackathon-reporting-consistency-20260324/desktop-light-bigquery-shell.png`](/Users/rajeev/Code/rajeevg.com/output/playwright/hackathon-reporting-consistency-20260324/desktop-light-bigquery-shell.png)
    - [`output/playwright/hackathon-reporting-consistency-20260324/desktop-light-ga4-shell.png`](/Users/rajeev/Code/rajeevg.com/output/playwright/hackathon-reporting-consistency-20260324/desktop-light-ga4-shell.png)
  - reconciliation proof:
    - [`output/acceptance/reporting-reconciliation-20260325/proof.md`](/Users/rajeev/Code/rajeevg.com/output/acceptance/reporting-reconciliation-20260325/proof.md)
    - [`output/acceptance/reporting-vote-reconciliation-20260325/proof.md`](/Users/rajeev/Code/rajeevg.com/output/acceptance/reporting-vote-reconciliation-20260325/proof.md)

## Audit verdict

- App-side analytics implementation: strong and materially improved.
- Consent persistence and state propagation: working.
- First-party GTM and server-side GTM delivery: working in production.
- GTM dependency serving through the first-party `/metrics` path: working in production.
- GA4 custom-event forwarding from GTM into GA4: repaired and validated.
- GA4 custom-definition promotion: completed and expanded.
- Duplicate default `scroll` and outbound `click` measurement noise: removed at the enhanced-measurement layer.
- GA4 to BigQuery linkage: completed and verified at the Admin API level.
- Hackathon fallback dashboard route: completed and live.
- Looker Studio as the hackathon source of truth: rejected.
- “State of the art” Google stack: implemented for transport and dataset wiring, with one expected post-setup lag still outstanding: the hackathon reporting tables had not landed rows yet during the same audit window.

## Evidence

- Live production proof:
  - [`output/acceptance/analytics-stack-20260323/live-proof.json`](/Users/rajeev/Code/rajeevg.com/output/acceptance/analytics-stack-20260323/live-proof.json)
  - [`output/acceptance/ga4-forwarding-20260324/network-after-cleanup.txt`](/Users/rajeev/Code/rajeevg.com/output/acceptance/ga4-forwarding-20260324/network-after-cleanup.txt)
  - [`output/acceptance/ga4-forwarding-20260324/projects-after-cleanup.png`](/Users/rajeev/Code/rajeevg.com/output/acceptance/ga4-forwarding-20260324/projects-after-cleanup.png)
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
