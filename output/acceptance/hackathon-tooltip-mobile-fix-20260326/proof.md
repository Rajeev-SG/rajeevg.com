## Hackathon dashboard mobile tooltip and GA4 quality-panel proof

- Timestamp: 2026-03-26 01:38:01 GMT
- Production URL: https://rajeevg.com
- Deploy URL: https://rajeevg-i61px309g-rajeevgills-projects.vercel.app

### Target behavior

1. The GA4 route should no longer show the `Measurement quality checks` panel, because its framing implied a defensible closeness-to-reality explanation that the underlying metrics could not support.
2. Metric definitions should work on mobile, not just desktop, without forcing readers to jump around the page.

### Code changes

- Replaced hover-only tooltip behavior with tap-friendly popovers in `src/components/hackathon-reporting-shell.tsx`.
- Removed the `Measurement quality checks` card block from `src/components/hackathon-ga4-dashboard.tsx`.
- Updated browser coverage in:
  - `tests/e2e/hackathon-ga4.spec.ts`
  - `tests/e2e/projects-dashboard-audit.spec.ts`
- Updated dashboard behavior notes in `docs/hackathon-voting-analytics-dashboard.md`.

### Validation

- `pnpm lint`
  - Passed
- `pnpm build`
  - Passed
- Local acceptance run:
  - `PORT=3030 pnpm exec playwright test tests/e2e/hackathon-ga4.spec.ts tests/e2e/hackathon-reporting-consistency.spec.ts tests/e2e/projects-dashboard-audit.spec.ts --reporter=list --workers=1`
  - Result: `7 passed`, `3 skipped`
- Production acceptance run:
  - `E2E_BASE_URL=https://rajeevg.com pnpm exec playwright test tests/e2e/hackathon-ga4.spec.ts tests/e2e/hackathon-reporting-consistency.spec.ts tests/e2e/projects-dashboard-audit.spec.ts --reporter=list --workers=1`
  - Result: `7 passed`, `3 skipped`

### Production proof details

- Desktop GA4 page check passed.
- Mobile GA4 page check passed.
- The production GA4 route no longer renders any `Measurement quality checks` heading.
- The production GA4 route still shows the remaining intended sections:
  - `Consent and measurement`
  - `Top tracked events`
  - `Entry-by-entry tracking`
- The production GA4 route still excludes previously removed confusing sections such as `Round snapshot surface` and `Manager operations`.
- On production mobile, tapping the `Explain Recorded votes` control opens an inline definition popover containing:
  - `Votes saved by the voting app itself. This is the source-of-truth total.`

### Verdict

Pass. The misleading GA4 quality panel has been removed, and metric definitions now open on tap in mobile production instead of relying on hover-only tooltip behavior.
