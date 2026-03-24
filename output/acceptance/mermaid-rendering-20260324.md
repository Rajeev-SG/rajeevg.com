# Mermaid rendering proof — 2026-03-24

- Page under test: `http://localhost:3001/blog/how-we-built-a-consented-first-party-analytics-stack`
- User journey proven: load the article, reach the `The architecture` section, and confirm the Mermaid block upgrades to a rendered SVG instead of remaining raw source text or Mermaid's syntax-error panel.

## Result

- Pass on desktop and mobile after the `mermaid-init` fix and the follow-up mobile layout adjustment to the analytics architecture diagram.
- Five consecutive reloads completed with:
  - `data-processed="true"`
  - `hasSvg=true`
  - no raw `flowchart LR` text left in the rendered block
  - no `Syntax error in text` message in the rendered block

## Artifacts

- Desktop screenshot: `output/playwright/mermaid-architecture-desktop-20260324.png`
- Mobile screenshot: `output/playwright/mermaid-architecture-mobile-20260324.png`
- Production-build mobile screenshot: `output/playwright/prod-build-mermaid-mobile-20260324.png`
- Playwright reload proof: recorded in terminal output from the `mermaidproof` session on 2026-03-24

## Notes

- Root cause was the scroll-hint helper appending visible text into the raw Mermaid `<pre>` before Mermaid parsed it, which polluted the source and caused Mermaid to render an error state.
- Follow-up mobile UX fix: the analytics architecture diagram was changed from a wide `flowchart LR` to a narrower `flowchart TB` with shorter labels so mobile no longer depends on horizontal scrolling to be readable.
- Local production-mode proof (`pnpm build` + `pnpm start`) now passes for the mobile article view with `scrollWidth=359` inside a `358px` container and no Mermaid syntax-error panel.
- `pnpm lint` passed.
- `pnpm build` passed after replacing the app metadata route with a static `public/robots.txt`.
