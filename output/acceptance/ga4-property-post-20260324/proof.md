# GA4 Property Post Proof

Date: 2026-03-24

## Goal

Publish a second analytics article on `rajeevg.com` that documents the GA4 property setup in granular detail, includes real screenshots from the live GA property and live production site interactions, explains the agent toolchain used, and ships to production.

## New post

- URL: `https://rajeevg.com/blog/how-we-finished-the-ga4-property-setup-on-rajeevg-com`
- Source file: `content/posts/how-we-finished-the-ga4-property-setup-on-rajeevg-com.mdx`

## Validation

### Repo checks

- `pnpm build`
  - Passed
  - Build output included `/blog/how-we-finished-the-ga4-property-setup-on-rajeevg-com`
- `pnpm lint`
  - Passed
  - No ESLint warnings or errors

### Local article proof

- Desktop screenshot:
  - `output/acceptance/ga4-property-post-20260324/local/article-desktop.png`
- Mobile screenshot:
  - `output/acceptance/ga4-property-post-20260324/local/article-mobile.png`

Notes:

- The first mobile screenshot attempt failed because the local Playwright WebKit runtime was missing.
- Fix applied: `pnpm exec playwright install webkit`
- Mobile screenshot then succeeded with the same Playwright CLI path used for desktop proof.

### Production deploy

- Command:
  - `vercel deploy --prod --yes`
- Production deployment:
  - `https://rajeevg-6joqhf3ko-rajeevgills-projects.vercel.app`
- Alias confirmed:
  - `https://rajeevg.com`

### Production article proof

- Desktop screenshot:
  - `output/acceptance/ga4-property-post-20260324/prod/article-desktop.png`
- Mobile screenshot:
  - `output/acceptance/ga4-property-post-20260324/prod/article-mobile.png`

### Public HTTP checks

- `curl -I https://rajeevg.com/blog/how-we-finished-the-ga4-property-setup-on-rajeevg-com`
  - Result: `HTTP/2 200`
- `curl -s ... | rg "<title>|How We Finished The GA4 Property Setup On rajeevg.com"`
  - Result included:
    - `<title>How We Finished The GA4 Property Setup On rajeevg.com • Rajeev G.</title>`
    - canonical `https://rajeevg.com/blog/how-we-finished-the-ga4-property-setup-on-rajeevg-com`
    - OG/Twitter image `https://rajeevg.com/images/blog/ga4-property-setup/ga4-realtime-overview.png`

## Live GA screenshots captured for the article

- `public/images/blog/ga4-property-setup/ga4-admin-events-hub.png`
- `public/images/blog/ga4-property-setup/ga4-reporting-identity.png`
- `public/images/blog/ga4-property-setup/ga4-realtime-overview.png`
- `public/images/blog/ga4-property-setup/ga4-debugview-empty.png`
- `public/images/blog/ga4-property-setup/ga4-reports-home.png`
- `public/images/blog/ga4-property-setup/live-projects-page.png`
- `public/images/blog/ga4-property-setup/live-analytics-post.png`

## Live GA proof notes

### Browser/tool path

- Playwright browser navigation to `analytics.google.com` hit the Google sign-in flow.
- Chrome DevTools MCP had access to a live signed-in Chrome session and existing GA tabs.
- The GA admin and realtime screenshots were therefore captured through Chrome DevTools MCP, not the isolated Playwright browser.

### DebugView

- DebugView was checked directly in the live property.
- Result:
  - `No development devices have logged any debug events in the last 30 minutes.`
- This was documented in the article as an intentional limitation of the proof pass rather than hidden.

### Realtime event proof

Fresh production interactions were triggered during the pass:

- visited the production projects page
- clicked a project GitHub link
- visited the production analytics article
- clicked a code-copy button

Realtime confirmation via `analytics_mcp` showed live custom events including:

- `project_click`
- `copy_code`
- `page_context`
- `section_view`
- `scroll_depth`
- `page_engagement_summary`
- `engaged_time`

The live GA realtime overview screenshot also showed `project_click` visible as a key event.

## Outcome

The new article is published to production, renders on desktop and mobile, returns `200`, has the expected metadata, and includes live GA/property screenshots plus a truthful explanation of the toolchain and the issues encountered during the documentation pass.
