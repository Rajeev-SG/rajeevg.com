## Project overview

A performant blog using Next.js 15 (App Router + Turbopack), Tailwind CSS v4, shadcn/ui, and Velite as a typed content layer with syntax‑highlighted code blocks.

## Tech stack (why + how)

- **Next.js 15 (App Router, Turbopack)**
  - Why: fast dev/build, file‑based routing
  - How: `next dev --turbopack`; config in `next.config.ts`
- **React 19**
  - Why: latest stable React runtime
  - How: standard React components/hooks
- **Tailwind CSS v4**
  - Why: utility‑first with new design tokens
  - How: tokens in `src/app/globals.css`; plugin `@tailwindcss/typography` for `.prose`
- **shadcn/ui**
  - Why: accessible primitives built on Tailwind
  - How: components installed: button, input, badge, table, progress, tooltip, alert, scroll-area, separator, sheet, popover
  - Runtime deps: `clsx`, `class-variance-authority`, `tailwind-merge`, `lucide-react`, Radix UI primitives
- **next-themes**
  - Why: class‑based dark mode
  - How: `ThemeProvider` in `src/app/layout.tsx`; `ThemeToggle` in `src/components/theme-toggle.tsx` (rendered in the header)
- **Velite (content layer)**
  - Why: typed content collections + fast build; ships generated types
  - How: config in `velite.config.ts`; alias `#velite` → `.velite` in `tsconfig.json`; auto build/watch wired in `next.config.ts`; content in `content/`; outputs to `.velite` and `public/static`
- **Code highlighting + MDX polish**
  - Why: readable code with a reliable copy button and discoverable headings/links
  - How: `rehype-pretty-code` + Shiki dual themes (github-light/dark). Copy is handled in React via `MdxPre` mapped in `src/components/mdx-components.tsx` (`pre` → `MdxPre`), avoiding the copy‑button transformer. Headings use `rehype-autolink-headings`; external MDX links show an icon and open in a new tab.
- **TypeScript**
  - Why: strong types across app + content
  - How: generated `Post` type imported from `#velite` in blog pages
- **PostCSS**
  - Why: Tailwind v4 pipeline
  - How: `@tailwindcss/postcss` in `postcss.config.mjs`
- **next/font (Geist)**
  - Why: optimized, self-hosted fonts
  - How: Geist Sans/Mono imported in `src/app/layout.tsx`

## Getting Started

```bash
# Generate content outputs once (optional; dev/build also runs Velite automatically)
pnpm content

# Start dev server (Turbopack) with Velite watching content
pnpm dev
```

Open http://localhost:3000 and visit:

- `/` — homepage renders the most recent published blog post (theme toggle is in the header)
- `/blog` — blog index
- `/projects` — portfolio page driven by checked-in public project metadata
- `/projects/hackathon-voting-analytics` — hackathon voting analytics dashboard with ECharts, Observable Plot, live BigQuery mode, and dummy preview mode
- `/projects/hackathon-voting-analytics/google-analytics` — hackathon-specific GA4 Data API surface, filtered to `vote.rajeevg.com`
- `/blog/hello-world` — sample post kept as a local draft example with highlighted code + copy button

You can edit the home page at `src/app/page.tsx`. Blog content lives in `content/posts/*`. Velite config is at `velite.config.ts`.
Environment variables for the app should be placed under `web/.env.local`.

## Reporting routes

- Hackathon analytics fallback dashboard:
  - route: `/projects/hackathon-voting-analytics`
  - doc: [docs/hackathon-voting-analytics-dashboard.md](/Users/rajeev/Code/rajeevg.com/docs/hackathon-voting-analytics-dashboard.md)
  - source: dedicated `personal-gws-1.hackathon_reporting` dataset only
  - renderers: `ECharts` and `Observable Plot`
  - review mode: `Dummy preview`
- Hackathon GA4 API surface:
  - route: `/projects/hackathon-voting-analytics/google-analytics`
  - doc: [docs/hackathon-voting-analytics-dashboard.md](/Users/rajeev/Code/rajeevg.com/docs/hackathon-voting-analytics-dashboard.md)
  - source: shared GA4 property `498363924`, filtered to `vote.rajeevg.com`
  - runtime: official `@google-analytics/data` client
  - review mode: `Dummy preview`

For the hackathon slice, the in-site reporting artifact is now split into:

- the BigQuery dashboard for richer modeled analysis
- the GA4 API surface for direct property-side validation

Those two routes now use the same reporting shell and control geometry, so switching between them does not cause a top-of-page layout jump.

The earlier Looker Studio path is not the source of truth.

## Project structure

All paths below are relative to `web/`.

```text
web/
 ├─ src/
 │  ├─ app/
 │  │  ├─ layout.tsx, globals.css, head.tsx, page.tsx, not-found.tsx, sitemap.ts
 │  │  ├─ about/page.tsx
 │  │  ├─ blog/ (page.tsx, [slug]/page.tsx)
 │  │  ├─ dashboard/page.tsx
 │  │  └─ projects/page.tsx
 │  ├─ components/
 │  │  ├─ app-sidebar.tsx, blog-index-client.tsx, hover-scroll-text.tsx, mdx-components.tsx, mdx-content.tsx, mdx-pre.tsx, reading-progress.tsx, tag-combobox.tsx, theme-provider.tsx, theme-toggle.tsx
 │  │  └─ ui/ (sidebar.tsx, breadcrumb.tsx, button.tsx, input.tsx, badge.tsx, popover.tsx, scroll-area.tsx, separator.tsx, sheet.tsx, table.tsx, tooltip.tsx, alert.tsx, progress.tsx, skeleton.tsx, card.tsx, avatar.tsx)
 │  ├─ hooks/use-mobile.ts
 │  └─ lib/ (site.ts, utils.ts)
 ├─ content/posts/ (Markdown posts, e.g. hello-world.md)
 ├─ public/ (svg icons, images; Velite outputs assets to public/static/)
 ├─ next.config.ts, velite.config.ts, tailwind.config.ts, postcss.config.mjs, tsconfig.json, components.json
 ├─ package.json
 └─ .gitignore
```

- `src/app/` — App Router (pages, layouts, global styles)
  - `layout.tsx` — Root layout. Wraps app with `ThemeProvider`, `SidebarProvider`, renders `AppSidebar`, `SidebarInset`, a compact header with `SidebarTrigger` and `ThemeToggle`, plus a low-profile footer with privacy links and a reopen settings action. Mounts Google Tag Manager via `<GoogleTagManager />` when `NEXT_PUBLIC_GTM_ID` is present.
  - `globals.css` — Tailwind v4 setup with design tokens, class-based dark variant, and Shiki dual-theme base CSS (maps `--shiki-light/dark` tokens and styles the copy button).
  - `page.tsx` — Homepage. Renders the most recent post inline using the article layout (ReadingProgress + MDX components).
  - `not-found.tsx` — Global 404 boundary required when routes call `notFound()`.
  - `head.tsx` — Preconnect/dns‑prefetch GTM/GA endpoints for faster analytics.
  - `sitemap.ts` — Dynamic sitemap including home, about, blog index, and all published posts with `lastModified`.
  - `public/robots.txt` — Static robots policy allowing all; sets canonical `Host` and `Sitemap` URLs.
  - `about/page.tsx` — About page with a profile image, focus areas, current projects, and contact links.
  - `projects/page.tsx` — Portfolio route for public projects with verified GitHub repos and live URLs.
  - `privacy/page.tsx` — Privacy policy route for consent, analytics, cookies, processors, and contact details.
  - `blog/`
    - `page.tsx` — Blog index server component. Gathers posts from `#velite` and renders the client UI via `BlogIndexClient`.
    - `[slug]/page.tsx` — Article page. Looks up a post by slug, renders title/description/date and HTML content from Velite. Next 15 uses Promise-based route params, so both the page and `generateMetadata` accept `{ params: Promise<{ slug: string }> }` and `await` it. Uses Tailwind `prose` with dual-theme Shiki CSS.
  - `dashboard/page.tsx` — Sample route demonstrating sidebar primitives (breadcrumbs, header, content grid).

 - `src/components/` — Reusable components
  - `app-sidebar.tsx` — Application sidebar built on shadcn/ui sidebar primitives. Renders core site links and a dynamic “Posts” section from `#velite`, while keeping “Projects” as a single page-level destination instead of a nested project list.
  - `project-card.tsx` — Reusable project card used by the portfolio route and MDX posts, now with screenshot-driven project imagery via `next/image`.
  - `blog-index-client.tsx` — Client interactivity for the blog index: text search, tag filters (badges on desktop, combobox on mobile). Displays filtered list.
  - `mdx-components.tsx` — MDX mapping (headings, inline code, blockquote→Alert, tables, links with external icon). Maps `pre` to `MdxPre`.
  - `mdx-content.tsx` — Helper for rendering processed MDX HTML content with the correct components.
  - `mdx-pre.tsx` — Client component rendering `<pre>` with a React copy button (Clipboard API, success state). Not injected by rehype.
  - `reading-progress.tsx` — Client progress bar shown above articles; uses shadcn `Progress` and observes `#article-content`.
  - `tag-combobox.tsx` — Tag selection UI using `Popover` and `ScrollArea`.
  - `theme-provider.tsx` — `next-themes` provider (class attribute, system default).
  - `theme-toggle.tsx` — Button to toggle between light/dark.
  - `components/ui/` — shadcn/ui primitives used by the app:
    - `sidebar.tsx` (shadcn sidebar primitives and context), `button.tsx`, `input.tsx`, `badge.tsx`,
      `popover.tsx`, `scroll-area.tsx`, `separator.tsx`, `sheet.tsx`, `breadcrumb.tsx`, `table.tsx`,
      `tooltip.tsx`, `alert.tsx`, `progress.tsx`, `skeleton.tsx`, `card.tsx`, `avatar.tsx`.

- `src/hooks/`
  - `use-mobile.ts` — `useIsMobile()` hook returning a boolean based on a 768px breakpoint.

- `src/lib/`
  - `site.ts` — Site-wide constants (`name`, `description`, `siteUrl`, `defaultOgImage`, `homeCanonicalStrategy`).
  - `posts.ts` — Shared helpers for visible post filtering, effective updated-or-published dates, and post ordering.
  - `portfolio-projects.ts` — Checked-in public project metadata, including audited screenshot paths and alt text, used by the portfolio route and related MDX content.
  - `utils.ts` — `cn(...classValues)` utility combining `clsx` with `tailwind-merge`.

- `content/` — Source Markdown content
  - `posts/` — Blog posts and draft examples (e.g. `hello-world.md`). Processed by Velite into `.velite` (typed data) and `public/static/` (assets).

- `public/` — Static assets served at the site root
  - Icons and images (`*.svg`). Velite writes assets to `public/static/` (gitignored).

- Configuration
  - `next.config.ts` — Starts Velite build/watch alongside `next dev/build`.
  - `velite.config.ts` — Defines `posts` collection schema (includes optional `image` and optional `updated` for per‑post OG and ordering), Shiki dual themes, and heading anchors via `rehype-slug` + `rehype-autolink-headings` (class `heading-anchor`), plus draft filtering in production. No copy‑button transformer; copying is handled in React. Outputs to `.velite` and `public/static/`.
  - `tailwind.config.ts` — Tailwind v4 config (`darkMode: "class"`, content paths, `animate` and `typography` plugins).
  - `postcss.config.mjs` — Uses `@tailwindcss/postcss`.
  - `tsconfig.json` — Path aliases: `@/*` → `src/*`, `#velite` → `.velite`; Next.js TypeScript plugin.
  - `components.json` — shadcn/ui generator config and path aliases.
  - `.gitignore` — Ignores `.velite`, `public/static/`, `.next/`, etc.
  - `package.json` — Scripts (`dev`, `build`, `start`, `lint`, `content`) and dependencies.

## SEO and Canonical URLs

- **Central config**
  - `src/lib/site.ts` — Site-wide constants:
    - `name`, `description`
    - `siteUrl` (from `NEXT_PUBLIC_SITE_URL`, defaults to `https://rajeevg.com`)
    - `defaultOgImage` (fallback OG image under `public/`)
    - `homeCanonicalStrategy`: `"self"` (recommended) or `"latest-post"`

- **Root metadata defaults**
  - `src/app/layout.tsx` — Sets `metadataBase` to `site.siteUrl`; OpenGraph + Twitter defaults use site name/description and `defaultOgImage`.

- **Home**
  - `src/app/page.tsx` — `export const revalidate = 3600` (ISR). `generateMetadata()` sets canonical based on `site.homeCanonicalStrategy`:
    - `self` → canonical `/`
    - `latest-post` → canonical to `/blog/[slug]` of most recent post

- **Blog index**
  - `src/app/blog/page.tsx` — `revalidate = 3600`; title "Blog"; canonical `/blog`.

- **Blog post**
  - `src/app/blog/[slug]/page.tsx` — Adds `alternates.canonical` (`/blog/[slug]`), OpenGraph (article: publishedTime, authors, tags, images), Twitter card, and JSON‑LD Article. Uses optional `image` from the Velite post schema for OG; falls back to `site.defaultOgImage`.

- **SEO routes**
  - `src/app/sitemap.ts` — Generates sitemap for home, blog index, and all posts (with `lastModified`).
  - `public/robots.txt` — Allows all; sets canonical `Host` and `Sitemap`.
  - `src/app/head.tsx` — Preconnect/dns‑prefetch GTM/GA endpoints for faster analytics.

- **Environment**
  - `.env.local` example:

    ```bash
    NEXT_PUBLIC_SITE_URL=https://rajeevg.com
    NEXT_PUBLIC_HOME_CANONICAL=self       # or latest-post
    NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX
    ```

## Performance & Caching

- **Prefetch**: Disabled for large link lists to reduce network/CPU
  - `src/components/app-sidebar.tsx` and `src/components/blog-index-client.tsx` use `prefetch={false}` on bulk `Link`s.
- **MDX <img>**: Lightweight image mapping
  - `src/components/mdx-components.tsx` maps `img` to add `loading="lazy"`, `decoding="async"`, and a default `alt=""`.
- **ISR**: Stable caching
  - Home and blog index export `revalidate = 3600` (1h) for incremental static regeneration.

## Sidebar layout (shadcn/ui sidebar‑03)

- **Files**
  - `src/components/ui/sidebar.tsx` — shadcn/ui sidebar primitives.
  - `src/components/app-sidebar.tsx` — app navigation built on the primitives.
  - `src/app/layout.tsx` — wraps app with `SidebarProvider`, renders `<AppSidebar />`, `<SidebarInset>`, and header `<SidebarTrigger />`.
- **Behavior**
  - Nav includes "Site" links and a "Posts" section generated from Velite (`#velite`).
  - Active states are derived from `usePathname()`.
  - On mobile, the sidebar opens as a sheet and auto‑closes after clicking a link.
  - The theme toggle is rendered in the header.
- **Add links**
  - Edit `data.navMain` and/or the `postsList` mapping in `src/components/app-sidebar.tsx`.
  - For new routes (e.g. `/about`, `/projects`), add items under the "Site" group.

### Recent fixes: sidebar overflow + hover-scroll titles

- **Overflow containment**
  - `src/components/ui/sidebar.tsx`
    - Wrapper (`SidebarProvider` root): ensures `overflow-x-clip` on `[data-slot="sidebar-wrapper"]` so opening the sidebar never pushes content off-screen.
    - Main area (`SidebarInset`): includes `min-w-0 flex-1` so the content region can shrink without causing horizontal scroll.
- **Long titles: hover-scroll marquee**
  - `src/components/hover-scroll-text.tsx` renders post titles in the sidebar with a smooth horizontal scroll on hover.
  - `src/app/globals.css` defines the `@keyframes hover-marquee` animation used by the component.
  - Behavior: titles remain single-line (`whitespace-nowrap`) and scroll horizontally on hover; a CSS custom property controls the scroll distance.
- **Verification**
  - Tested at 1024px, 768px, and 375px widths with the sidebar open: no horizontal overflow; long titles scroll as intended on hover.
  - Checked that page `scrollWidth <= clientWidth` during sidebar interactions and that body/html do not introduce unintended horizontal scroll.
- **Troubleshooting**
  - If overflow appears, confirm `overflow-x-clip` on the wrapper and `min-w-0` on the main content container.
  - If hover-scroll doesn’t trigger, ensure the title container uses `overflow-hidden` and `whitespace-nowrap`, and that the marquee keyframes exist in `globals.css`.

## Layout and spacing (containers + alignment)

- **Global container**: `src/app/layout.tsx` wraps page content in a single max-width container
  - Width: `max-w-screen-lg`
  - Gutters: `px-4 sm:px-6 md:px-8`
  - Vertical rhythm: `py-8 md:py-10`
- **Header alignment**: the header wraps the `SidebarTrigger` in the same container, so the left edges of the toggle and page content align.
- **Wide screens**: on `xl+` viewports, the container is left-aligned via `xl:mx-0 xl:mr-auto` to avoid excessive left margin while staying aligned with the sidebar.
- **Blog index**: `src/components/blog-index-client.tsx` no longer adds its own outer container; it relies on the global container and uses a local `section.space-y-6`.
- **Article page**: `src/app/blog/[slug]/page.tsx` uses `<article className="space-y-6">` (no outer container) and uses Promise‑based route params in Next 15: `{ params: Promise<{ slug: string }> }` with `await params` in both the page and `generateMetadata()`.

## Reading progress bar + Table of contents

- **Files**
  - `src/components/reading-progress.tsx` — Client component using shadcn `Progress` to show scroll progress for the article.
  - `src/app/blog/[slug]/page.tsx` — Renders `<ReadingProgress />` above the article and tags content as `<section id="article-content">`.
  - `content/posts/hello-world.md` — Includes a “Table of contents” with anchor links to sections below.
- **Behavior**
  - Progress is computed from the `#article-content` section height minus viewport height. If content is shorter than the viewport, the bar shows 100%.
  - The bar is container-scoped and aligns with the article width under `SidebarInset`.
  - It is sticky under the site header: wrapper classes `sticky top-12 pointer-events-none z-0 -mt-8 md:-mt-10 mb-3 md:mb-4` snap it to the bottom of the header from page load and keep space before the article title.
  - When the desktop sidebar opens, the bar does not overlap (container width) and remains non-interactive (`pointer-events-none`).
- **Configuration**
  - Target element can be changed via `<ReadingProgress targetId="my-section-id" />`; default is `article-content`.
  - Spacing under the bar can be tuned with the wrapper’s `mb-*` utilities.
- **TOC anchors**
  - Anchors are generated by `rehype-slug` and `rehype-autolink-headings` in `velite.config.ts`. Example links used in the sample post:
    - `[Headings](#headings)`
    - `[Paragraphs, links, and inline code](#paragraphs-links-and-inline-code)`
    - `[Blockquote → Alert](#blockquote-alert)`
    - `[Lists](#lists)`
    - `[Table](#table)`
    - `[Code blocks](#code-blocks)`

## Syntax highlighting + MDX UI (Shiki + rehype-pretty-code)

- **Config**: `web/velite.config.ts` uses dual themes and heading anchors:
  - `theme: { light: 'github-light', dark: 'github-dark' }`
  - `mdx.rehypePlugins`: `rehypeSlug`, `rehypeAutolinkHeadings` with `{ behavior: 'wrap', properties: { className: ['heading-anchor'] } }`
  - No copy‑button transformer; copy is handled in React (`MdxPre`).
- **Why CSS is required**: Shiki dual‑theme output is unstyled by default (tokens use CSS variables like `--shiki-light`, `--shiki-dark`).
- **Global CSS**: in `src/app/globals.css` we map variables and style UI elements:
  - Shiki color mapping (light/dark) for `code[data-theme]` and `pre:has(code)` backgrounds.
  - Copy button styles for `.rehype-pretty-copy` (revealed on hover; click shows a success state). We also allow `pre:hover .rehype-pretty-copy { opacity: 1 }` for reliable reveal.
  - Heading anchors: `.heading-anchor` shows a leading `#` on hover for h2–h6, aligned to avoid layout shift.
- **MDX components**: `src/components/mdx-components.tsx`
  - Maps `pre` → `MdxPre` (client copy button using the Clipboard API).
  - External links render with an outbound icon and `target="_blank" rel="noreferrer noopener"`; internal links use `next/link`.
- **Tailwind prose**: avoid overriding Shiki colors/background. In `src/app/blog/[slug]/page.tsx` we avoid extra `prose` overrides that affect `pre/code`.
- **Usage**: add fenced code blocks in Markdown, e.g.

  ```ts
  export function greet(name: string) {
    return `Hello, ${name}!`
  }
  ```

  - **Customize theme**: change the theme names in `velite.config.ts` to any Shiki theme(s). The CSS above will continue to work with dual themes.

## Mermaid diagrams — Client-side rendering (current)

- **What**: Render Mermaid on the client using placeholders (`<pre class="mermaid">`) produced at build time via `rehype-mermaid` with `strategy: 'pre-mermaid'`. Mermaid JS hydrates these on the client to SVG.
- **Why**: Avoid SSR parsing issues (e.g., copy button wrappers inside Mermaid), enable interactive links and tooltips reliably, and keep build fast.

- **Files**
  - `velite.config.ts` — `rehype-mermaid` configured with `strategy: 'pre-mermaid'` and placed before `rehype-pretty-code` in both `markdown` and `mdx`.
  - `src/components/mdx-components.tsx` — `Pre` mapping skips `MdxPre` when the element has class `mermaid` to prevent injecting the React copy button into Mermaid blocks.
  - `src/components/mermaid-init.tsx` — Client initializer that dynamically imports Mermaid, sets `{ startOnLoad: false, securityLevel: 'loose' }`, applies theme variables, serializes render passes so hydration and mutation-observer churn do not race Mermaid, retries placeholders that were marked processed without producing an SVG, adds scroll hints only after a real Mermaid SVG exists so the raw source text is not polluted before parsing, and dispatches a `mermaid:rendered` event after each successful pass.
  - `src/components/mermaid-tooltips.tsx` — Scans rendered Mermaid SVGs for anchors and overlays accessible tooltips using shadcn/ui. Targets the article container.
  - `src/app/blog/[slug]/page.tsx` and `src/app/page.tsx` — Any route that renders MDX with Mermaid wraps content in `<section id="article-content">` and mounts `MermaidInit` + `MermaidTooltips`.

- **Usage in Markdown**

  ```mermaid
  graph TD
    A[Home] --> B[Docs]
    click A href "/" "Go to homepage"
    click B href "https://github.com/" "View GitHub" _blank
  ```

  - Click directive argument order: `href`, then tooltip text, then target. Example used in `content/posts/hello-world.md`:
    `click D href "https://mermaid.js.org" "Mermaid docs" _blank`

- **Troubleshooting**
  - __Syntax errors in Mermaid__: Ensure `Pre` mapping bypasses `MdxPre` for `.mermaid` and that `startOnLoad` is disabled with manual `mermaid.run()`.
  - __Mermaid sometimes stays as raw text__: Verify the client initializer is mounted on every route that renders Mermaid-bearing MDX, not just the dedicated blog page, and that failed `.mermaid` placeholders are being retried instead of staying stuck with `data-processed="true"` and no SVG.
  - __No anchors generated__: Use `securityLevel: 'loose'` and correct `click ... href` argument order. Verify the client script is loading and selectors match.
  - __Tooltips not visible__: Confirm anchors exist in the SVG; ensure `MermaidTooltips` is mounted and listens to `mermaid:rendered`. Check that `#article-content` is `position: relative` and overlay z-index is sufficient.

- **Verify**
  - `pnpm content && pnpm build`
  - `PORT=3006 pnpm start`
  - Open `/blog/hello-world` and confirm: no Mermaid syntax error text, SVG is present, at least one `<a>` inside the SVG, tooltip overlay appears on hover/focus.

## Dark mode (mobile-friendly, persistent)

- **Library**: `next-themes` with `attribute="class"` via `ThemeProvider` in `src/app/layout.tsx`.
- **Toggle**: `src/components/theme-toggle.tsx` toggles between `light` and `dark`. The `html` element receives/removes the `dark` class.
{{ ... }}
- **Tailwind**: Dark variant uses the class strategy (`darkMode: 'class'`) with selectors in `src/app/globals.css` compatible with mobile Chrome.

## Analytics (Google Tag Manager)

- **Summary**: The app mounts GTM at the root and now maintains a first-class app-side `dataLayer` contract in [`src/lib/analytics.ts`](/Users/rajeev/Code/rajeevg.com/src/lib/analytics.ts) and [`src/components/analytics-data-layer.tsx`](/Users/rajeev/Code/rajeevg.com/src/components/analytics-data-layer.tsx). GTM still owns delivery to GA4, but the site now pushes structured page, content, navigation, filter, scroll, article, code-copy, consent, and engagement summary events instead of relying on thin generic clicks. In production, GTM is served first-party from `/metrics` and forwarded to a live server-side GTM container.

- **Env vars**:

  ```bash
  NEXT_PUBLIC_GTM_ID=GTM-K2VRQS47
  NEXT_PUBLIC_GTM_SCRIPT_ORIGIN=/metrics
  SGTM_UPSTREAM_ORIGIN=https://sgtm-live-6tmqixdp3a-nw.a.run.app
  NEXT_PUBLIC_SITE_URL=https://rajeevg.com
  ```

- **Root integration**:
  - [`src/app/layout.tsx`](/Users/rajeev/Code/rajeevg.com/src/app/layout.tsx) mounts GTM when `NEXT_PUBLIC_GTM_ID` is present and seeds Google Consent Mode before GTM loads.
  - [`src/components/tag-manager-script.tsx`](/Users/rajeev/Code/rajeevg.com/src/components/tag-manager-script.tsx) injects `gtm.js` and `ns.html` from the configured script origin.
  - [`next.config.ts`](/Users/rajeev/Code/rajeevg.com/next.config.ts) rewrites `/metrics/:path*` to the live server-side GTM service when `SGTM_UPSTREAM_ORIGIN` is present.
  - The layout pushes a Google consent-mode default before GTM loads so analytics/ad storage stay denied until the site consent manager updates consent.
  - [`src/components/analytics-data-layer.tsx`](/Users/rajeev/Code/rajeevg.com/src/components/analytics-data-layer.tsx) adds page context, scroll depth, article progress, engaged-time milestones, section views, click metadata, and page engagement summary pushes.
  - [`src/components/consent-manager.tsx`](/Users/rajeev/Code/rajeevg.com/src/components/consent-manager.tsx) persists the visitor choice, updates Google Consent Mode, exposes reopenable privacy controls, gates Vercel Analytics, and emits consent events into the shared `dataLayer`.
  - [`src/app/privacy/page.tsx`](/Users/rajeev/Code/rajeevg.com/src/app/privacy/page.tsx) provides the public privacy policy linked from the consent banner, footer, and article header.
  - The current live stack uses web container `GTM-K2VRQS47`, server container `GTM-W4GKTR3H`, measurement ID `G-675W3V0C78`, and BigQuery dataset `personal-gws-1:ga4_498363924`.

- **Automatically attached dimensions**:
  - Every event now includes shared runtime context such as `browser_session_id`, `page_view_id`, `page_view_sequence`, viewport and screen size, device pixel ratio, language, timezone, theme, color scheme, and reduced-motion preference.
  - Every event also includes page context such as `page_type`, `site_section`, `content_slug`, `content_title`, route depth, referrer context, and any page-level metadata declared with `data-analytics-page-*`.

- **Page metadata convention**:
  - Mark the primary content root with `data-analytics-page-context="primary"`.
  - Add `data-analytics-page-*` attributes for stable dimensions like `content_type`, `content_id`, `content_tags`, counts, categories, or publish dates.
  - The analytics helper automatically folds those dimensions into every event on that page.

- **Main custom events**:
  - `page_context`
  - `navigation_click`, `post_click`, `project_click`, `profile_click`, `contact_click`
  - `tag_click`, `blog_search`, `blog_search_focus`
  - `theme_toggle`, `copy_code`
  - `scroll_depth`, `article_progress`, `article_complete`, `section_view`, `engaged_time`
  - `page_engagement_summary`

- **Send custom events manually**:

  ```ts
  import { pushDataLayerEvent } from "@/lib/analytics"

  pushDataLayerEvent("cta_click", {
    analytics_section: "hero",
    item_type: "primary_cta",
    item_name: "Start here",
  })
  ```

- **Verification tips**:
  - In DevTools, confirm `dataLayer` exists and that first-party `https://rajeevg.com/metrics/gtm.js?id=GTM-K2VRQS47` loads.
  - Inspect `window.dataLayer` after navigation and interactions to confirm shared dimensions are present on each event object.
  - Use GTM Preview to map the richer custom events to GA4 event tags and parameters.
  - Watch requests to `https://rajeevg.com/metrics/g/collect` for the primary GA4 transport path. A Google-hosted `gtm.js?...&gtg_health=1` probe may still appear as a health/fallback request.
  - See [`docs/analytics.md`](/Users/rajeev/Code/rajeevg.com/docs/analytics.md) for the current event contract.
  - See [`docs/google-tagging-stack.md`](/Users/rajeev/Code/rajeevg.com/docs/google-tagging-stack.md) for the full GA4, GTM, sGTM, BigQuery, and Looker stack audit.

## Build issues and prevention

- **Symptom**: `next build` failed during “Collecting page data” with:
  - `Cannot find module for page: /_not-found`
  - sometimes also `Cannot find module for page: /dashboard`
- **Root cause**: `src/app/blog/[slug]/page.tsx` calls `notFound()` for missing posts, but there was no root `src/app/not-found.tsx` page. When Next tried to render the global not‑found boundary during prerender, the module was missing.
- **Fix**: add `src/app/not-found.tsx` (simple 404 page). After adding it, `pnpm build` completes successfully.
- **How to avoid in future**:
  - If any route calls `notFound()`, ensure a matching `src/app/not-found.tsx` exists.
  - Keep Shiki CSS mappings in `globals.css`; avoid Tailwind prose rules that override `pre/code` colors/backgrounds.
  - Ensure `tsconfig.json` has `"#velite": ["./.velite"]` and `next.config.ts` triggers Velite during dev/build.
  - Run `pnpm content` to regenerate `.velite` outputs if you change Velite config or content schema.
  - Note: Next 15 App Router uses Promise-based route params. Type `{ params: Promise<{ slug: string }> }` and `await params` in both the page and `generateMetadata`.

## Scripts

```bash
pnpm dev          # Start dev server (Turbopack) + Velite watch
pnpm build        # Production build (Velite runs automatically)
pnpm start        # Start production server
pnpm content      # Manual Velite build (cleans and rebuilds content)
pnpm lint         # Lint
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
