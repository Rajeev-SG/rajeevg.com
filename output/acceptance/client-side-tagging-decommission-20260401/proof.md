# Acceptance: Client-side tagging decommission

## Expected behavior

- `rajeevg.com` should load Google Tag Manager and GA4 client-side only.
- No production measurement traffic should route through the retired `/metrics` path.
- The old server-side GTM Cloud Run services should be deleted so they no longer bill.
- Consent behavior and the app-owned custom event vocabulary should still function.

## Executed steps

1. Audited the repo, Vercel envs, GTM containers, Cloud Run services, and live production network traffic.
2. Confirmed the web GTM base tag in `GTM-K2VRQS47` still had `server_container_url=https://rajeevg.com/metrics`.
3. Published GTM web container version `4`, removing that `server_container_url` setting.
4. Updated the app to load GTM directly from `https://www.googletagmanager.com`, removed the `/metrics` rewrite, and updated the privacy/docs surfaces.
5. Ran `pnpm lint` and `pnpm build` locally.
6. Deployed the app change to production with `vercel deploy --prod --yes`.
7. Reloaded `https://rajeevg.com/` in the attached Chrome session and inspected the live network requests.
8. Granted analytics consent through the live privacy controls and inspected the outgoing GA4 collect payloads.
9. Removed `SGTM_UPSTREAM_ORIGIN` and `NEXT_PUBLIC_GTM_SCRIPT_ORIGIN` from Vercel production and development envs.
10. Deleted Cloud Run services `sgtm-live` and `sgtm-preview`.

## Evidence

- Screenshot: [prod-homepage.png](/Users/rajeev/Code/rajeevg.com/output/acceptance/client-side-tagging-decommission-20260401/prod-homepage.png)
- Screenshot: [gtm-version-4.png](/Users/rajeev/Code/rajeevg.com/output/acceptance/client-side-tagging-decommission-20260401/gtm-version-4.png)
- Screenshot: [ga4-home-events.png](/Users/rajeev/Code/rajeevg.com/output/acceptance/client-side-tagging-decommission-20260401/ga4-home-events.png)
- Command output: [metrics-endpoint-404.txt](/Users/rajeev/Code/rajeevg.com/output/acceptance/client-side-tagging-decommission-20260401/metrics-endpoint-404.txt)
- Command output: [cloud-run-services.txt](/Users/rajeev/Code/rajeevg.com/output/acceptance/client-side-tagging-decommission-20260401/cloud-run-services.txt)
- Command output: [removed-vercel-envs.txt](/Users/rajeev/Code/rajeevg.com/output/acceptance/client-side-tagging-decommission-20260401/removed-vercel-envs.txt)
- Command output: [homepage-script-origins.txt](/Users/rajeev/Code/rajeevg.com/output/acceptance/client-side-tagging-decommission-20260401/homepage-script-origins.txt)
- Attached-browser network proof from `https://rajeevg.com/` after the production deploy:
  - `reqid=83` loaded `https://www.googletagmanager.com/gtm.js?id=GTM-K2VRQS47`
  - `reqid=90` loaded `https://www.googletagmanager.com/gtag/js?id=G-675W3V0C78&cx=c&gtm=4e63u1`
  - no `https://rajeevg.com/metrics/*` requests appeared in the post-deploy network log
  - `reqid=113` posted directly to `https://region1.google-analytics.com/g/collect` with `Status: 204`
- The `reqid=113` request body contained the app-owned custom events and parameters, including:
  - `en=scroll_depth`
  - `en=button_click`
  - `en=consent_preferences_open`
  - `en=engaged_time`
  - `en=consent_state_updated`
  - `ep.page_type=home`
  - `ep.site_section=home`
  - `ep.analytics_consent_state=granted`
  - `ep.browser_session_id=...`
  - `ep.page_view_id=...`
- Attached-browser `window.dataLayer` proof after granting consent showed:
  - `consent_state_updated`
  - replayed `page_context` with `consent_rehydrated: true`
  - `engaged_time`
  - the consent update object with `analytics_storage: "granted"` and all ad-related consent fields still denied

## Result

- PASS: production tagging is now client-side only.
- PASS: the browser no longer relies on `/metrics` for GTM or GA collection.
- PASS: the old `/metrics/gtm.js?id=GTM-K2VRQS47` endpoint now returns `404`, which confirms the app is no longer serving the retired transport path.
- PASS: the old Cloud Run services were deleted, and `gcloud run services list --region=europe-west2 --project=personal-gws-1` now returns `Listed 0 items.`
- PASS: consent controls still work and the custom event schema still reaches the GA4 collect endpoint directly from the browser.
- Viewport and section coverage checked: live production desktop browser on the homepage, privacy controls, GTM admin, and GA4 property UI.
- Final action or content completed: analytics consent was granted, custom events were emitted, direct GA4 collect traffic was captured, dead server endpoints were verified, and Cloud Run deletion was confirmed.

## Remaining risk

- The GA4 Realtime API and the GA4 Realtime UI both stayed empty during the short validation window even though the direct GA4 collect requests returned `204` and contained the correct custom event payloads. Browser-level delivery proof is therefore strong, but a short property-side follow-up check later today is still reasonable if a same-session GA4 UI confirmation is required.
