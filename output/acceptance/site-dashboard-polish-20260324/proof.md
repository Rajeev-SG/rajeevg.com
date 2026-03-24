# Acceptance: Main Site Dashboard Link And Dual-Renderer GA4 Surface

## Expected behavior

- The projects index should expose the main-site analytics dashboard alongside the hackathon analytics surface.
- `/projects/site-analytics` should render from live GA4 property data when credentials are available.
- The main dashboard should support switching between `ECharts` and `Observable Plot` without breaking layout on desktop or mobile.
- Headline live values should broadly match the current GA4 property for the same hostname and stream filters.

## Executed steps

1. Built the app locally with `pnpm build` and served the production build on `http://127.0.0.1:3052`.
2. Ran `E2E_BASE_URL=http://127.0.0.1:3052 pnpm exec playwright test tests/e2e/hackathon-post-and-site-analytics.spec.ts`.
3. Queried the GA4 property directly through `analytics_mcp` for:
   - top blog pages on `hostName=rajeevg.com`
   - device mix on `hostName=rajeevg.com`
   - realtime custom events on `streamId=11542983613`
   - portfolio key-event rows on `hostName=rajeevg.com`
4. Used Playwright browser inspection against the local route and found a real mapper bug:
   - page-performance rows were reading the wrong metric indexes
   - device rows were swapping users and views
   - key-event rows were reading the wrong metric indexes
   - realtime rows were not aggregating across `minutesAgo`
5. Fixed those mappers, rebuilt, and reran the local Playwright proof.
6. Deployed to production with `vercel deploy --prod --yes`, which aliased to `https://rajeevg.com`.
7. Ran `E2E_BASE_URL=https://rajeevg.com pnpm exec playwright test tests/e2e/hackathon-post-and-site-analytics.spec.ts`.
8. Captured fresh production screenshots sequentially to avoid navigation-race artifacts.

## Evidence

- Local browser proof:
  - `6 passed` for `tests/e2e/hackathon-post-and-site-analytics.spec.ts`
- Production browser proof:
  - `6 passed` for `tests/e2e/hackathon-post-and-site-analytics.spec.ts`
- Public URL checks:
  - `curl -I https://rajeevg.com/projects` returned `HTTP/2 200`
  - `curl -I https://rajeevg.com/projects/site-analytics` returned `HTTP/2 200`
- Fresh screenshots:
  - screenshot: [projects-desktop.png](/Users/rajeev/Code/rajeevg.com/output/acceptance/site-dashboard-polish-20260324/prod/projects-desktop.png)
  - screenshot: [site-analytics-desktop.png](/Users/rajeev/Code/rajeevg.com/output/acceptance/site-dashboard-polish-20260324/prod/site-analytics-desktop.png)
  - screenshot: [site-analytics-observable-desktop.png](/Users/rajeev/Code/rajeevg.com/output/acceptance/site-dashboard-polish-20260324/prod/site-analytics-observable-desktop.png)
  - screenshot: [site-analytics-mobile.png](/Users/rajeev/Code/rajeevg.com/output/acceptance/site-dashboard-polish-20260324/prod/site-analytics-mobile.png)
- GA4 comparison notes:
  - Top blog rows matched exactly between the dashboard and GA4 Data API at proof time:
    - `/blog/how-we-built-a-consented-first-party-analytics-stack`: `45` views, `11` users
    - `/blog/from-ai-pilots-to-business-value`: `27` views, `5` users
    - `/blog/git-workflow-for-beginners`: `27` views, `6` users
    - `/blog/hello-world`: `22` views, `2` users
    - `/blog/the-projects-behind-this-portfolio`: `12` views, `4` users
    - `/blog`: `7` views, `3` users
  - Device mix matched exactly between the dashboard and GA4 Data API at proof time:
    - `desktop`: `12` users, `228` views, `11425s`
    - `mobile`: `6` users, `85` views, `2174s`
  - Realtime rows were within expected short-window drift:
    - production screenshot showed `page_context 29`, `scroll_depth 27`, `engaged_time 24`
    - the fresh GA4 realtime query a moment later returned `page_context 29`, `scroll_depth 30`, `engaged_time 32`
  - Portfolio key-event row aligned:
    - `project_click`: `4` total hits, `0` GA4 key-events
- Final reachable action or content proven:
  - the main-site dashboard card is reachable from `/projects`
  - the live site dashboard opens successfully
  - the renderer toggle can switch to `Observable Plot` and back to `ECharts`

## Result

- PASS
- Viewport and section coverage checked:
  - desktop projects index
  - desktop site dashboard in `ECharts`
  - desktop site dashboard in `Observable Plot`
  - mobile site dashboard
- Screenshot review passed for the changed surfaces:
  - the new main-site card is visible and truthful on the projects index
  - the site dashboard charts render cleanly in both renderer modes
  - the mobile stack remains readable with no horizontal overflow in the proven flow
- Final action or content completed:
  - link from `/projects` to `/projects/site-analytics`
  - renderer toggle on the live dashboard

## Remaining risk

- Realtime event counts are inherently time-windowed, so tiny differences between the dashboard screenshot and a later GA4 query are expected.
- The working tree still contains unrelated in-progress hackathon analytics changes outside this acceptance slice, so any commit should stay narrowly scoped to the files touched for this dashboard pass.
