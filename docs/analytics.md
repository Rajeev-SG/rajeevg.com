# Analytics Contract

This site uses Google Tag Manager as the transport layer, but the app itself owns a structured `dataLayer` contract so GA4, server-side GTM, BigQuery, and Looker can all map against the same event vocabulary.

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

- The site loads GTM from the first-party `/metrics` path instead of directly using Google-hosted GTM as the primary script origin.
- [`src/components/tag-manager-script.tsx`](/Users/rajeev/Code/rajeevg.com/src/components/tag-manager-script.tsx) injects `gtm.js` from `NEXT_PUBLIC_GTM_SCRIPT_ORIGIN`.
- [`next.config.ts`](/Users/rajeev/Code/rajeevg.com/next.config.ts) rewrites `/metrics/:path*` to the live server-side GTM service when `SGTM_UPSTREAM_ORIGIN` is set.
- GA4 collection is therefore expected on `https://rajeevg.com/metrics/g/collect`.
- A Google-hosted `gtm.js?...&gtg_health=1` request may still appear as a health or fallback probe even when the primary delivery path is first-party.

## GA4 Reporting Promotion

The following event parameters are now promoted as GA4 custom definitions on property `498363924` so the app-owned dataLayer is usable in GA4 reporting and Explorations:

- Custom dimensions:
  - `page_type`, `site_section`, `content_group`, `content_type`, `content_id`, `content_tags`
  - `viewport_category`, `analytics_consent_state`, `referrer_type`
  - `section_name`, `item_type`, `link_type`, `destination`
  - `selected_tags`, `search_term`, `consent_preference`, `theme_to`
- Custom metrics:
  - `route_depth`, `query_param_count`, `tag_count`, `project_count`
  - `selected_tag_count`, `search_term_length`, `interaction_sequence`
  - `copied_characters`, `engaged_seconds`, `engaged_seconds_total`
  - `interaction_count`, `section_views_count`, `max_scroll_depth_percent`, `max_article_progress_percent`

## Naming Guidance

- Prefer noun-verb style event names that describe intent, for example `project_click` instead of a generic `click`.
- Keep shared dimensions stable across pages.
- Prefer `item_*`, `content_*`, `section_*`, `filter_*`, and `destination` fields over one-off parameter names.
- Avoid PII in event payloads.
- Let consent mode and the consent manager govern whether GTM/GA4 can persist analytics storage; if GTM is loaded pre-consent, cookieless consent-mode pings may still be transmitted.
