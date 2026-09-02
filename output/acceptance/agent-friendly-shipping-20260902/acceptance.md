# Acceptance: agent-friendly shipping guide (2026-09-02)

## Article

- Path: `content/posts/from-idea-to-live-site-with-an-agent-friendly-stack.mdx`
- Teaching objective: explain the full path from idea to live website in plain English, for a reader who has never bought a domain or deployed anything.
- Audience: nontechnical friend, not a vendor tutorial.
- Vendor neutrality: Vercel, Cloudflare, Hetzner and Coolify used as concrete examples of the same pattern (token + documented command + logs + rollback), not as recommendations.

## Figures

| Figure | Teaching objective | What prose does NOT duplicate | Format |
|---|---|---|---|
| Jargon map | Show the shipping path as one connected sequence — not six disconnected terms — so the reader can see the order. | The prose lists definitions; the figure shows directionality and order. | Native draw.io |
| Control surface | Show what an agent actually needs (token + reachable endpoint) and what the safety path looks like (logs, rollback). | The prose lists the three control routes; the figure shows the topology and distinguishes the deployment path from the safety path. | Native draw.io |

### Diagram files

- `public/downloads/agent-friendly-shipping-jargon-map.drawio` — editable source
- `public/downloads/agent-friendly-shipping-control-surface.drawio` — editable source
- `public/images/blog/agent-friendly-shipping/agent-friendly-shipping-jargon-map.svg` — rendered asset
- `public/images/blog/agent-friendly-shipping/agent-friendly-shipping-control-surface.svg` — rendered asset

### No-overlap workflow

Both XML files use the `drawio-no-overlap` rules: orthogonal edge routing, edge cells before vertex cells, generous node sizing, short multi-line labels, `html=1`, background legend, no inline edge labels.

## Verified deployment counts

Dated snapshot checked 2 September 2026 via `vercel ls --all --format json` (six pages) for the exact seven-day window ending during the task:

- 113 deployments
- 111 READY
- 56 READY production
- 2 ERROR

`vercel projects ls --format json`: 20 current projects.

These are stated as a dated snapshot, not a lifetime total. Cloudflare and Coolify volume is established in existing site content but no exact counts are claimed.

## Evidence date

All diagrams carry "Evidence date: 2 Sep 2026" in the SVG footer and the draw.io legend cell.

## Commands run

- `node scripts/generate-agent-friendly-shipping-diagrams.mjs` — produced both draw.io XML and SVG renders
- `python3 -c "import xml.etree.ElementTree as ET; ET.parse(...)"` — XML parse check for all four files (2 drawio + 2 svg): all passed
- `pnpm build` — full site build (see validation section below)

## Validation

- XML parse: both `.drawio` files parse cleanly via Python ElementTree.
- SVG parse: both `.svg` files parse cleanly via Python ElementTree.
- Draw.io render: both native XML files were accepted by the draw.io XML renderer with obstacle-avoiding routing enabled.
- Build: `pnpm build` in the worktree root.
- Browser proof: the article was exercised locally at 1536px, 1440px, 768px and 402px widths. Both figures loaded, both editable `.drawio` downloads returned HTTP 200, the page had no document-level horizontal overflow, and each mobile diagram scroller reached its full right edge.
- TOC proof: the desktop table of contents rendered; the mobile `On this page` disclosure opened and exposed 22 heading links.
- Visual inspection: both figures were captured as section-focused screenshots and compared with the A2A mesh and control-room reference articles. Labels remain legible, connectors do not cross text, the article uses desktop width well, and mobile intentionally uses contained horizontal scrolling with a swipe instruction.
- Console note: local development showed the site's pre-existing Google consent-mode script/hydration errors. They were present on the reference articles as well and are unrelated to this article; production is checked separately after deployment.

## Browser evidence

- `output/playwright/agent-friendly-shipping-20260902T223000Z/article-wide-1536.png`
- `output/playwright/agent-friendly-shipping-20260902T223000Z/article-desktop-1440-loaded.png`
- `output/playwright/agent-friendly-shipping-20260902T223000Z/article-intermediate-768.png`
- `output/playwright/agent-friendly-shipping-20260902T223000Z/article-mobile-402.png`
- `output/playwright/agent-friendly-shipping-20260902T223000Z/jargon-map-desktop-1440.png`
- `output/playwright/agent-friendly-shipping-20260902T223000Z/control-surface-desktop-1440.png`
- `output/playwright/agent-friendly-shipping-20260902T223000Z/control-surface-mobile-402-left.png`
- `output/playwright/agent-friendly-shipping-20260902T223000Z/control-surface-mobile-402-right.png`
- `output/playwright/agent-friendly-shipping-20260902T223000Z/toc-mobile-402-open.png`

## Changed files

- `content/posts/from-idea-to-live-site-with-an-agent-friendly-stack.mdx` (new)
- `scripts/generate-agent-friendly-shipping-diagrams.mjs` (new)
- `public/downloads/agent-friendly-shipping-jargon-map.drawio` (new)
- `public/downloads/agent-friendly-shipping-control-surface.drawio` (new)
- `public/images/blog/agent-friendly-shipping/agent-friendly-shipping-jargon-map.svg` (new)
- `public/images/blog/agent-friendly-shipping/agent-friendly-shipping-control-surface.svg` (new)
- `output/acceptance/agent-friendly-shipping-20260902/acceptance.md` (this file)

## Caveats

- Cloudflare and Coolify volume is not quantified; the article makes no invented count for them.
- The local console has a known site-wide development warning/error path around the Google consent script. Production verification determines whether it affects the shipped page.
