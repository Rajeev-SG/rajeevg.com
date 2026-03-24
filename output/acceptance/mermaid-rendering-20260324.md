# Mermaid rendering proof — 2026-03-24

- Pages under test:
  - `http://localhost:3016/`
  - `http://localhost:3016/blog/how-we-built-a-consented-first-party-analytics-stack`
- User journeys proven:
  - load the homepage featured post and confirm the Mermaid block upgrades to a rendered SVG instead of remaining raw source text
  - load the article page, reach the `The architecture` section, and confirm the Mermaid block upgrades to a rendered SVG instead of remaining raw source text or Mermaid's syntax-error panel

## Result

- Pass on desktop and mobile after mounting the Mermaid client initializer on the homepage featured-post surface as well as the dedicated article page.
- Five consecutive reloads completed with:
  - `data-processed="true"`
  - `hasSvg=true`
  - no raw `flowchart LR` text left in the rendered block
  - no `Syntax error in text` message in the rendered block
- Fresh production-mode proof on `PORT=3016 pnpm start` completed with:
  - homepage desktop `preCount=1`, `svgCount=1`
  - homepage mobile `preCount=1`, `svgCount=1`, `scrollWidth=359` inside a `358px` container
  - article desktop `preCount=1`, `svgCount=1`

## Artifacts

- Homepage desktop screenshot: `output/playwright/local-home-mermaid-desktop-20260324.png`
- Homepage mobile screenshot: `output/playwright/local-home-mermaid-mobile-20260324.png`
- Article desktop screenshot: `output/playwright/local-blog-mermaid-desktop-20260324.png`
- Desktop screenshot: `output/playwright/mermaid-architecture-desktop-20260324.png`
- Mobile screenshot: `output/playwright/mermaid-architecture-mobile-20260324.png`
- Production-build mobile screenshot: `output/playwright/prod-build-mermaid-mobile-20260324.png`
- Playwright reload proof: recorded in terminal output from the `mermaidproof` session on 2026-03-24

## Notes

- Root cause was the scroll-hint helper appending visible text into the raw Mermaid `<pre>` before Mermaid parsed it, which polluted the source and caused Mermaid to render an error state.
- Follow-up homepage root cause: `/` also renders the latest article via `MDXContent`, but it was not mounting `MermaidInit` and `MermaidTooltips`, so the homepage could show raw Mermaid source even after the dedicated blog page was fixed.
- Follow-up mobile UX fix: the analytics architecture diagram was changed from a wide `flowchart LR` to a narrower `flowchart TB` with shorter labels so mobile no longer depends on horizontal scrolling to be readable.
- Local production-mode proof (`pnpm build` + `pnpm start`) now passes for the mobile article view with `scrollWidth=359` inside a `358px` container and no Mermaid syntax-error panel.
- `pnpm lint` passed.
- `pnpm build` passed after replacing the app metadata route with a static `public/robots.txt`.
