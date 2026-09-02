# Acceptance Manifest: agent-friendly shipping guide

**Date:** 2026-09-02
**Agent:** 01a063b9-9524-7931-b0c6-c77e529ca27a
**Status:** PASS (local); production verification pending merge

## Checks

| Check | Method | Evidence | Result |
|---|---|---|---|
| MDX compiles | `pnpm run content` | command exit code 0 | PASS |
| Production build completes | `pnpm build` | 92 static pages generated; article route listed | PASS |
| Draw.io XML parses | Python ElementTree | both `.drawio` sources | PASS |
| Draw.io renderer accepts XML | draw.io XML renderer with libavoid routing | both `.drawio` sources returned rendered XML | PASS |
| Article renders at wide, desktop, intermediate and mobile widths | Playwright | `output/playwright/agent-friendly-shipping-20260902T223000Z/` | PASS |
| Diagrams have no text overlap or clipping | section-focused screenshot review | `jargon-map-desktop-1440.png`, `control-surface-desktop-1440.png` | PASS |
| Mobile diagrams are reachable | Playwright scroll assertions at 402px | both scrollers reached `scrollLeft === scrollWidth - clientWidth` | PASS |
| TOC works on mobile | Playwright opened `On this page` disclosure | `toc-mobile-402-open.png`; 22 links | PASS |
| Images and editable downloads resolve | browser image checks and HTTP requests | two images loaded; two `.drawio` links returned 200 | PASS |
| Page avoids document-level horizontal overflow | Playwright at 1536px and 402px | document scroll width equalled viewport width | PASS |

## Evidence

- Article: `content/posts/from-idea-to-live-site-with-an-agent-friendly-stack.mdx`
- Editorial proof: `output/acceptance/agent-friendly-shipping-20260902/acceptance.md`
- Browser artifacts: `output/playwright/agent-friendly-shipping-20260902T223000Z/`
- Editable diagrams: `public/downloads/agent-friendly-shipping-jargon-map.drawio`, `public/downloads/agent-friendly-shipping-control-surface.drawio`
- Rendered diagrams: `public/images/blog/agent-friendly-shipping/agent-friendly-shipping-jargon-map.svg`, `public/images/blog/agent-friendly-shipping/agent-friendly-shipping-control-surface.svg`

## Repro steps

1. Run `pnpm run content && pnpm build`.
2. Start the site on an unused port, for example `pnpm exec next dev --turbopack -p 3210`.
3. Open `/blog/from-idea-to-live-site-with-an-agent-friendly-stack`.
4. Inspect the page at 1536px, 1440px, 768px and 402px.
5. Open the mobile `On this page` control and follow a heading link.
6. Scroll both diagrams horizontally at 402px and open both editable-source links.

## Risks / known gaps

- The site currently emits development-only Google consent-mode script/hydration errors on this article and the existing reference articles. No article-specific console error was found. Production is checked after deployment.
- The verified deployment count covers Vercel only. The article deliberately makes no unsupported Cloudflare or Coolify volume claim.
