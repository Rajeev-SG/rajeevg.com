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
npm run content

# Start dev server (Turbopack) with Velite watching content
npm run dev
```

Open http://localhost:3000 (or pass a custom port with `npm run dev -- -p 3003`) and visit:

- `/` — homepage renders the most recent blog post (theme toggle is in the header)
- `/blog` — blog index
- `/blog/hello-world` — sample post with highlighted code + copy button

You can edit the home page at `src/app/page.tsx`. Blog content lives in `content/posts/*`. Velite config is at `velite.config.ts`.
Environment variables for the app should be placed under `web/.env.local`.

## Project structure

All paths below are relative to `web/`.

```text
web/
 ├─ src/
 │  ├─ app/
 │  │  ├─ layout.tsx, globals.css, head.tsx, page.tsx, not-found.tsx, sitemap.ts, robots.ts
 │  │  ├─ about/page.tsx, tools/page.tsx
 │  │  ├─ blog/ (page.tsx, [slug]/page.tsx)
 │  │  └─ dashboard/page.tsx
 │  ├─ components/
 │  │  ├─ app-sidebar.tsx, blog-index-client.tsx, ga.tsx, mdx-components.tsx, mdx-pre.tsx, reading-progress.tsx, tag-combobox.tsx, theme-provider.tsx, theme-toggle.tsx
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
  - `layout.tsx` — Root layout. Wraps app with `ThemeProvider`, `SidebarProvider`, renders `AppSidebar`, `SidebarInset`, header with `SidebarTrigger` and `ThemeToggle`, and the main content container (`max-w-screen-lg` with normalized padding). Loads GA4 scripts and mounts the `GA` component when `NEXT_PUBLIC_GA_ID` is present.
  - `globals.css` — Tailwind v4 setup with design tokens, class-based dark variant, and Shiki dual-theme base CSS (maps `--shiki-light/dark` tokens and styles the copy button).
  - `page.tsx` — Homepage. Renders the most recent post inline using the article layout (ReadingProgress + MDX components).
  - `not-found.tsx` — Global 404 boundary required when routes call `notFound()`.
  - `head.tsx` — Preconnect and dns-prefetch hints for GA domains to speed up analytics.
  - `sitemap.ts` — Dynamic sitemap including home, blog index, and all posts with `lastModified`.
  - `robots.ts` — Robots policy allowing all; sets `host` and `sitemap` URLs.
  - `about/page.tsx` — About page with a shadcn `Card` and `Avatar` contact card (email, GitHub, LinkedIn buttons).
  - `tools/page.tsx` — Tools/projects grid built with `Card`. Each card is a full-link with image + title.
  - `blog/`
    - `page.tsx` — Blog index server component. Gathers posts from `#velite` and renders the client UI via `BlogIndexClient`.
    - `[slug]/page.tsx` — Article page. Looks up a post by slug, renders title/description/date and HTML content from Velite. Next 15 uses Promise-based route params, so both the page and `generateMetadata` accept `{ params: Promise<{ slug: string }> }` and `await` it. Uses Tailwind `prose` with dual-theme Shiki CSS.
  - `dashboard/page.tsx` — Sample route demonstrating sidebar primitives (breadcrumbs, header, content grid).

- `src/components/` — Reusable components
  - `app-sidebar.tsx` — Application sidebar built on shadcn/ui sidebar primitives. Renders “Site” links and a dynamic “Posts” section from `#velite`. Auto-closes on mobile navigation.
  - `blog-index-client.tsx` — Client interactivity for the blog index: text search, tag filters (badges on desktop, combobox on mobile). Displays filtered list.
  - `ga.tsx` — GA4 SPA page_view sender using `gtag` on route changes (first load + navigations).
  - `mdx-components.tsx` — MDX mapping (headings, inline code, blockquote→Alert, tables, links with external icon). Maps `pre` to `MdxPre`.
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
  - `utils.ts` — `cn(...classValues)` utility combining `clsx` with `tailwind-merge`.

- `content/` — Source Markdown content
  - `posts/` — Blog posts (e.g. `hello-world.md`). Processed by Velite into `.velite` (typed data) and `public/static/` (assets).

- `public/` — Static assets served at the site root
  - Icons and images (`*.svg`). Velite writes assets to `public/static/` (gitignored).

- Configuration
  - `next.config.ts` — Starts Velite build/watch alongside `next dev/build`.
  - `velite.config.ts` — Defines `posts` collection schema (includes optional `image` for per‑post OG), Shiki dual themes, and heading anchors via `rehype-slug` + `rehype-autolink-headings` (class `heading-anchor`), plus draft filtering in production. No copy‑button transformer; copying is handled in React. Outputs to `.velite` and `public/static/`.
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
  - `src/app/robots.ts` — Allows all; sets `host` and `sitemap`.
  - `src/app/head.tsx` — Preconnect/dns‑prefetch GA domains for faster analytics.

- **Environment**
  - `.env.local` example:

    ```bash
    NEXT_PUBLIC_SITE_URL=https://rajeevg.com
    NEXT_PUBLIC_HOME_CANONICAL=self       # or latest-post
    NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
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

## Tools page (cards)

- **File**
  - `src/app/tools/page.tsx`

- **How it works**
  - Cards are rendered from a local `projects` array:

    ```ts
    const projects = [
      { name: "Hello World Post", href: "/blog/hello-world", imgSrc: "/next.svg" },
      { name: "Project Two", href: "#", imgSrc: "/globe.svg" },
    ]
    ```

  - Each list item renders a shadcn `Card` wrapped in a `Link`. The entire card is clickable.
  - Images use Next/Image with `fill` and `object-contain` inside a fixed-height area (`h-36`).

- **Add or update a card (new tool release)**
  1. Edit `projects` in `src/app/tools/page.tsx` and append a new item:

     ```ts
     { name: "My New Tool", href: "/tools/my-new-tool" /* or external URL */, imgSrc: "/tools/my-new-tool.png" }
     ```

  2. Add the image file under `public/` (recommended: `public/tools/my-new-tool.png`).
     - Use a transparent PNG or a logo/screenshot that looks good in a 144px-tall area.
     - Prefer square-ish aspect ratios; `object-contain` will letterbox as needed.

  3. For external links, set `href` to the full URL (e.g. `https://...`). Optionally open in a new tab by adding `target="_blank" rel="noreferrer noopener"` to the `Link` element.

  4. Keep `name` concise (will be the visible card title). The `alt` is derived from `name`.

  - **External images note**
    - If you use remote images (e.g. from GitHub) with `next/image`, the host must be allowed in `next.config.ts` under `images.remotePatterns` (or `images.domains`).
    - This repo permits GitHub-hosted screenshots used on `/tools`:
      - `github.com` with pathname `/Rajeev-SG/gtm-site-speed/raw/**`
      - `raw.githubusercontent.com` with pathname `/Rajeev-SG/gtm-site-speed/**`
    - Prefer adding images under `public/` when possible to avoid remote host configuration.

- **Optional enhancements**
  - Add a short description by editing the `CardContent` body.
  - Add tags or icons inside `CardHeader` or `CardContent` as needed.

 - **Tooltips (Docs link)**
   - Requirements: Wrap the list with `TooltipProvider` (already present in `src/app/tools/page.tsx`).
   - To show a docs tooltip/button on a card, add `docsHref` and optionally `tooltip` to the project item:

     ```ts
     {
       name: "GTM Site Speed",
       href: "https://gtm-site-speed.rajeevg.com/",
       imgSrc: "/gtm-site-speed.png",
       docsHref: "https://github.com/Rajeev-SG/gtm-site-speed",
       tooltip: "View docs on GitHub" // optional; defaults to "Documentation"
     }
     ```

   - Implementation details in `src/app/tools/page.tsx`:
     - The full-card `Link` uses an absolute overlay (`className="absolute inset-0 z-10"`).
     - The Docs button sits above it with `z-20`, positioned at `right-2 top-2`.
     - Tooltip usage:

       ```tsx
       <Tooltip>
         <TooltipTrigger asChild>
           <a
             href={p.docsHref}
             target="_blank"
             rel="noreferrer noopener"
             aria-label={p.tooltip ?? `Open ${p.name} documentation`}
             className="inline-flex items-center justify-center rounded-md border bg-background/80 px-2 py-1 text-xs text-foreground shadow-sm backdrop-blur hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
           >
             <ExternalLink className="mr-1 size-3.5" /> Docs
           </a>
         </TooltipTrigger>
         <TooltipContent side="left">{p.tooltip ?? "Documentation"}</TooltipContent>
       </Tooltip>
       ```

   - Imports come from `@/components/ui/tooltip` and `lucide-react`. Ensure `TooltipProvider` wraps the list.

- **Test**
  - Run `npm run dev` and visit `/tools`.
  - Verify the grid is responsive: 1 col on mobile, 2 on small screens, 3 on large.
  - Check image quality (no stretching) and link targets.

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

## Dark mode (mobile-friendly, persistent)

- **Library**: `next-themes` with `attribute="class"` via `ThemeProvider` in `src/app/layout.tsx`.
- **Toggle**: `src/components/theme-toggle.tsx` toggles between `light` and `dark`. The `html` element receives/removes the `dark` class.
- **Persistence**: User preference is stored in `localStorage` under `"theme"` and respected across reloads. `defaultTheme="system"` enables auto-match to OS until user toggles.
- **Tailwind**: Dark variant uses the class strategy (`darkMode: 'class'`) with selectors in `src/app/globals.css` compatible with mobile Chrome.

## Analytics (GA4 + SPA page_view)

- **Env var location**: Put GA ID in `web/.env.local`:

  ```bash
  NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
  NEXT_PUBLIC_SITE_URL=https://rajeevg.com
  ```

- **Script loading**: `src/app/layout.tsx` conditionally injects gtag:
  - Loads `https://www.googletagmanager.com/gtag/js?id=...` after interactive.
  - Initializes `window.dataLayer` and `gtag` with `send_page_view: false` to avoid duplicate initial hits.
- **SPA tracking**: `src/components/ga.tsx` listens to route changes (`usePathname`, `useSearchParams`) and calls `gtag('config', id, { page_path })` so a `page_view` is sent on navigations.
- **Verification tips**: In the browser devtools, check `typeof window.gtag === 'function'`, presence of the gtag `<script>` tag, and network requests to `https://www.google-analytics.com/g/collect` after client-side navigation.

## Build issues and prevention

- **Symptom**: `next build` failed during “Collecting page data” with:
  - `Cannot find module for page: /_not-found`
  - sometimes also `Cannot find module for page: /dashboard`
- **Root cause**: `src/app/blog/[slug]/page.tsx` calls `notFound()` for missing posts, but there was no root `src/app/not-found.tsx` page. When Next tried to render the global not‑found boundary during prerender, the module was missing.
- **Fix**: add `src/app/not-found.tsx` (simple 404 page). After adding it, `npm run build` completes successfully.
- **How to avoid in future**:
  - If any route calls `notFound()`, ensure a matching `src/app/not-found.tsx` exists.
  - Keep Shiki CSS mappings in `globals.css`; avoid Tailwind prose rules that override `pre/code` colors/backgrounds.
  - Ensure `tsconfig.json` has `"#velite": ["./.velite"]` and `next.config.ts` triggers Velite during dev/build.
  - Run `npm run content` to regenerate `.velite` outputs if you change Velite config or content schema.
  - Note: Next 15 App Router uses Promise-based route params. Type `{ params: Promise<{ slug: string }> }` and `await params` in both the page and `generateMetadata`.

## Scripts

```bash
npm run dev       # Start dev server (Turbopack) + Velite watch
npm run build     # Production build (Velite runs automatically)
npm run start     # Start production server
npm run content   # Manual Velite build (cleans and rebuilds content)
npm run lint      # Lint
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
