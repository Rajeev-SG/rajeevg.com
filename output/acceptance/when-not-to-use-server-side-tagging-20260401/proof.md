# When Not To Use Server-Side Tagging

Date: 2026-04-01

## Scope

- New production article:
  - `https://rajeevg.com/blog/when-not-to-use-server-side-tagging`
- New public assets:
  - `/images/blog/when-not-to-use-server-side-tagging/cloud-run-billing-cost-table-viewport.png`
  - `/images/blog/when-not-to-use-server-side-tagging/site-analytics-dashboard-top.png`

## Evidence used in the article

### Cloud Run billing autopsy

- Google Cloud Billing cost table, billing account `gtm-site-speed`, invoice month `March 2026`
- Project row: `personal-gws-1` subtotal `£8.42`
- Cloud Run row: `£8.42`
- Dominant SKU:
  - `Services CPU (Instance-based billing) in europe-west2`
  - usage `722,493.507844 second`
  - gross `£11.54`
  - spending-based discount `-£3.14`
  - subtotal `£8.40`
- Small additional rows:
  - Europe-to-Europe egress `£0.01`
  - request-based CPU `£0.00`
  - request-based memory `£0.00`
  - requests `£0.00`

### GA4 main-site traffic snapshot used in the recommendation

- Property: `498363924`
- Filter: `hostName = rajeevg.com`
- Window: `28daysAgo` to `yesterday`
- Totals:
  - sessions `284`
  - users `176`
  - page views `825`
  - events `6974`
- Mix:
  - direct share `83.5%`
  - Safari share `4.6%`
  - iOS share `4.6%`
  - mobile share `27.1%`
  - paid-channel rows visible: `0`

### Cloud Run shutdown confirmation

- `gcloud run services list --platform=managed --region=europe-west2 --project=personal-gws-1`
- Result stored in `cloud-run-services.txt`
- Output: `Listed 0 items.`

## Validation

### Repo checks

- `pnpm lint`
  - passed
- `pnpm build`
  - passed

### Local render proof

- Local production server:
  - `http://127.0.0.1:3005/blog/when-not-to-use-server-side-tagging`
- HTTP:
  - `200 OK`
- Browser proof:
  - title rendered correctly
  - both screenshots loaded
  - billing caption matched the billing image content
  - dashboard caption matched the dashboard image content
  - mermaid diagrams rendered
  - recommendation table rendered
- Screenshot:
  - `local/article-local-top.png`

### Production proof

- Deploy log:
  - `vercel-deploy.log`
- Production alias:
  - `https://rajeevg.com`
- Public URL:
  - `https://rajeevg.com/blog/when-not-to-use-server-side-tagging`
- HTTP:
  - article `200 OK`
  - billing image `200 OK`
  - dashboard image `200 OK`
- Browser proof on production:
  - title rendered correctly
  - both article images loaded from `rajeevg.com`
  - billing figure caption matched the screenshot content
  - dashboard figure caption matched the screenshot content
  - decision diagram and recommendation table rendered
- Screenshot:
  - `prod/article-prod-top.png`

## Files added

- `content/posts/when-not-to-use-server-side-tagging.mdx`
- `public/images/blog/when-not-to-use-server-side-tagging/cloud-run-billing-cost-table-viewport.png`
- `public/images/blog/when-not-to-use-server-side-tagging/site-analytics-dashboard-top.png`

## Notes

- The article’s decision thresholds for paid media, Safari/iOS share, and runtime cost are explicitly framed in the copy as engineering judgment based on the observed bill plus official Google and WebKit guidance, not as vendor-guaranteed thresholds.
