# Analytics Contract

This site uses Google Tag Manager as the transport layer, but the app itself owns a structured `dataLayer` contract so GTM, GA4, BigQuery, and downstream reporting surfaces can all map against the same event vocabulary.

Consent is controlled in-app via [`src/components/consent-manager.tsx`](/Users/rajeev/Code/rajeevg.com/src/components/consent-manager.tsx). GTM still loads with Google Consent Mode defaults set to denied, advertising-related consent remains denied, and analytics storage is only granted after an explicit visitor choice.

Because GTM is loaded before consent, Google may still send cookieless Consent Mode pings while `analytics_storage` is denied. That preserves modeled measurement without writing analytics storage, but it is not the same as a zero-network pre-consent setup.

## Shared Dimensions

Every event pushed through [`src/lib/analytics.ts`](/Users/rajeev/Code/rajeevg.com/src/lib/analytics.ts) includes:

- `event`, `event_source`, `event_timestamp`
- `browser_session_id`
- `page_view_id`
- `page_view_sequence`
- `page_title`, `page_path`, `page_location`, `page_type`, `site_section`
- `route_depth`, `content_slug`, `content_title`
- viewport and device context: `viewport_width`, `viewport_height`, `viewport_category`, `screen_width`, `screen_height`, `screen_orientation`, `device_pixel_ratio`
- client context: `language`, `timezone`, `theme`, `color_scheme`, `reduced_motion`
- consent context: `analytics_consent_state`
- referrer context when available: `referrer`, `referrer_host`, `referrer_path`, `referrer_type`
- any primary page metadata declared with `data-analytics-page-*`

## Primary Page Metadata

For stable page-level dimensions, mark the main content root with:

```html
data-analytics-page-context="primary"
```

Then add any useful `data-analytics-page-*` fields, for example:

```html
data-analytics-page-content-type="article"
data-analytics-page-content-id="from-ai-pilots-to-business-value"
data-analytics-page-content-tags="ai|strategy|smb|workflows"
data-analytics-page-published-at="2026-03-01"
```

Those fields are automatically added to every event on that page.

## Current Event Set

- `page_context`
  - Fired once per page view with route and page metadata.
- `navigation_click`
  - Primary and secondary site navigation.
- `post_click`
  - Blog post links from listings and nav.
- `project_click`
  - Project repo and live-site outbound clicks.
- `profile_click`
  - Social/profile destinations on the About page.
- `contact_click`
  - Email and other direct contact actions.
- `tag_click`
  - Blog tag filter selection and clearing on desktop and mobile.
- `blog_search_focus`
  - First focus of the blog search input.
- `blog_search`
  - Debounced query change with result counts and active tags.
- `theme_toggle`
  - Theme changes with `theme_from` and `theme_to`.
- `consent_state_updated`
  - Fired when the visitor explicitly allows analytics or keeps to necessary-only mode.
- `consent_preferences_open`
  - Fired when the visitor reopens the privacy controls.
- `copy_code`
  - Code copy actions with `copied_characters`.
- `scroll_depth`
  - Page scroll milestones at 25, 50, 75, and 90 percent.
- `article_progress`
  - Article progress milestones at 25, 50, and 75 percent.
- `article_complete`
  - Article completion at 100 percent.
- `section_view`
  - First qualified view of an annotated section.
- `engaged_time`
  - Timed engagement milestones at 15, 30, and 60 seconds while visible.
- `page_engagement_summary`
  - End-of-view summary with `engaged_seconds_total`, `interaction_count`, `section_views_count`, `max_scroll_depth_percent`, and `max_article_progress_percent`.

## Production Transport

- The site now loads GTM directly from `https://www.googletagmanager.com`.
- [`src/components/tag-manager-script.tsx`](/Users/rajeev/Code/rajeevg.com/src/components/tag-manager-script.tsx) injects the standard client-side `gtm.js` and `ns.html` endpoints.
- [`next.config.ts`](/Users/rajeev/Code/rajeevg.com/next.config.ts) no longer rewrites `/metrics/:path*`.
- GA4 collection is therefore expected on the standard Google endpoint, typically `https://www.google-analytics.com/g/collect`.
- The web GTM container now forwards the app-owned event families directly into GA4:
  - page context
  - click interactions
  - search and preference changes
  - engagement milestones
  - page engagement summaries
- GA4 enhanced measurement was intentionally trimmed so the property keeps its default page views and SPA page changes, but does not double-count the site's richer custom `scroll_depth` and `outbound_click` style events with generic Google `scroll` and `click` events.
- The retired `/metrics` path should no longer appear in production measurement traffic.

## GA4 Reporting Promotion

The following event parameters are now promoted as GA4 custom definitions on property `498363924` so the app-owned dataLayer is usable in GA4 reporting and Explorations.

For `rajeevg.com` specifically, the live property now includes 24 site-relevant custom dimensions and 18 site-relevant custom metrics. The shared property also contains additional hackathon-specific definitions for `vote.rajeevg.com`.

- Custom dimensions:
  - `page_type`, `site_section`, `content_group`, `content_type`, `content_id`, `content_tags`
  - `viewport_category`, `analytics_consent_state`, `referrer_type`
  - `section_name`, `item_type`, `link_type`, `destination`
  - `selected_tags`, `search_term`, `consent_preference`, `theme_to`
  - `content_slug`, `analytics_section`, `theme`, `color_scheme`
  - `screen_orientation`, `consent_rehydrated`, `filter_state`
- Custom metrics:
  - `route_depth`, `query_param_count`, `tag_count`, `project_count`
  - `selected_tag_count`, `search_term_length`, `interaction_sequence`
  - `copied_characters`, `engaged_seconds`, `engaged_seconds_total`
  - `interaction_count`, `section_views_count`, `max_scroll_depth_percent`, `max_article_progress_percent`
  - `result_count`, `scroll_depth_percent`, `article_progress_percent`, `page_view_sequence`

## GA4 Property State

- Property timezone: `Europe/London`
- Currency: `GBP`
- Reporting identity: `BLENDED`
- Google Signals: enabled
- Data retention: `FOURTEEN_MONTHS`
- Key events now aligned to the portfolio use case:
  - `contact_click`
  - `project_click`
  - `profile_click`
- A legacy `purchase` key event still exists on the property, but the Admin API currently returns it as non-deletable.

## Hackathon reporting boundary

The shared GA4 property also serves the hackathon voting app on `vote.rajeevg.com`, but the advanced reporting route on `rajeevg.com` now keeps that slice isolated.

- Primary route: `/projects/hackathon-voting-analytics`
- GA property route: `/projects/hackathon-voting-analytics/google-analytics`
- Runtime source: `personal-gws-1.hackathon_reporting`
- Renderers: `ECharts` and `Observable Plot`
- Review mode: `Dummy preview`

The GA property route complements the BigQuery dashboard rather than replacing it:

- it uses the official `@google-analytics/data` client at request time
- it filters the shared property to `hostName = vote.rajeevg.com`
- it surfaces the promoted hackathon dimensions and metrics directly from GA
- it gives a property-side check when the BigQuery reporting tables are still empty or lagging

Production runtime envs for that GA route:

- `GA4_PROPERTY_ID`
- `GA4_SERVICE_ACCOUNT_JSON`
- `GA4_HACKATHON_HOSTNAME`
- `GA4_HACKATHON_STREAM_ID`

This route exists specifically to avoid mixing hackathon reporting with the main `rajeevg.com` content analytics. It reads only the dedicated hackathon reporting dataset, not the generic site-reporting tables.

See:

- [docs/hackathon-voting-analytics-dashboard.md](/Users/rajeev/Code/rajeevg.com/docs/hackathon-voting-analytics-dashboard.md)
- [docs/google-tagging-stack.md](/Users/rajeev/Code/rajeevg.com/docs/google-tagging-stack.md)

## Naming Guidance

- Prefer noun-verb style event names that describe intent, for example `project_click` instead of a generic `click`.
- Keep shared dimensions stable across pages.
- Prefer `item_*`, `content_*`, `section_*`, `filter_*`, and `destination` fields over one-off parameter names.
- Avoid PII in event payloads.
- Let consent mode and the consent manager govern whether GTM/GA4 can persist analytics storage; if GTM is loaded pre-consent, cookieless consent-mode pings may still be transmitted.
