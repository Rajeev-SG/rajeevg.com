# GA4 Forwarding Proof

Date: 2026-03-24

## What changed

- Published web GTM version `3` on `GTM-K2VRQS47`.
- Added dedicated GA4 forwarding tags for:
  - `page_context`
  - click interactions
  - search and preference events
  - engagement milestones
  - `page_engagement_summary`
- Patched the GA4 property timezone to `Europe/London`.
- Disabled enhanced-measurement scroll and outbound click auto-events to avoid duplicate reporting next to the site's custom `scroll_depth` and click event model.
- Added portfolio key events:
  - `contact_click`
  - `project_click`
  - `profile_click`
- Added additional site-facing custom definitions:
  - dimensions: `content_slug`, `analytics_section`, `theme`, `color_scheme`, `screen_orientation`, `consent_rehydrated`, `filter_state`
  - metrics: `result_count`, `scroll_depth_percent`, `article_progress_percent`, `page_view_sequence`

## Wire proof

- [`network-after-cleanup.txt`](/Users/rajeev/Code/rajeevg.com/output/acceptance/ga4-forwarding-20260324/network-after-cleanup.txt) shows `g/collect` requests carrying custom events and custom parameters, including:
  - `consent_state_updated`
  - `page_context`
  - `page_engagement_summary`
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

## GA4 proof

- Realtime reporting after the publish showed the custom event vocabulary arriving in the property, including:
  - `page_context`
  - `section_view`
  - `page_engagement_summary`
  - `navigation_click`
  - `project_click`
  - `blog_search`
  - `blog_search_focus`
  - `copy_code`
  - `engaged_time`
  - `post_click`

## Remaining caveats

- BigQuery export tables had still not landed during this pass.
- The property still contains a legacy `purchase` key event; the Admin API currently reports it as non-deletable.
