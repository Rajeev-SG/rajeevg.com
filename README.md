This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

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
  - How: `ThemeProvider` in `src/app/layout.tsx`; `ThemeToggle` in `src/components/theme-toggle.tsx` (rendered in the sidebar footer)
- **Velite (content layer)**
  - Why: typed content collections + fast build; ships generated types
  - How: config in `velite.config.ts`; alias `#velite` → `.velite` in `tsconfig.json`; auto build/watch wired in `next.config.ts`; content in `content/`; outputs to `.velite` and `public/static`
- **Code highlighting**
  - Why: readable code snippets with copy button
  - How: `rehype-pretty-code` + `shiki` dual theme (github-light/dark) + copy‑button transformer. Config in `velite.config.ts`; base CSS in `src/app/globals.css` maps Shiki variables to colors and styles the copy button.
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

Open http://localhost:3000 and visit:

- `/` — homepage (theme toggle is in the sidebar footer)
- `/blog` — blog index
- `/blog/hello-world` — sample post with highlighted code + copy button

You can edit the home page at `src/app/page.tsx`. Blog content lives in `content/posts/*`. Velite config is at `velite.config.ts`.

## Sidebar layout (shadcn/ui sidebar‑03)

- **Files**
  - `src/components/ui/sidebar.tsx` — shadcn/ui sidebar primitives.
  - `src/components/app-sidebar.tsx` — app navigation built on the primitives.
  - `src/app/layout.tsx` — wraps app with `SidebarProvider`, renders `<AppSidebar />`, `<SidebarInset>`, and header `<SidebarTrigger />`.
- **Behavior**
  - Nav includes "Site" links and a "Posts" section generated from Velite (`#velite`).
  - Active states are derived from `usePathname()`.
  - On mobile, the sidebar opens as a sheet and auto‑closes after clicking a link.
  - The theme toggle lives in the sidebar footer.
- **Add links**
  - Edit `data.navMain` and/or the `postsList` mapping in `src/components/app-sidebar.tsx`.
  - For new routes (e.g. `/about`, `/projects`), add items under the "Site" group.

## Layout and spacing (containers + alignment)

- **Global container**: `src/app/layout.tsx` wraps page content in a single max-width container
  - Width: `max-w-screen-lg`
  - Gutters: `px-4 sm:px-6 md:px-8`
  - Vertical rhythm: `py-8 md:py-10`
- **Header alignment**: the header wraps the `SidebarTrigger` in the same container, so the left edges of the toggle and page content align.
- **Wide screens**: on `xl+` viewports, the container is left-aligned via `xl:mx-0 xl:mr-auto` to avoid excessive left margin while staying aligned with the sidebar.
- **Blog index**: `src/components/blog-index-client.tsx` no longer adds its own outer container; it relies on the global container and uses a local `section.space-y-6`.
- **Article page**: `src/app/blog/[slug]/page.tsx` uses `<article className="space-y-6">` (no outer container) and fixes Next params typing to `{ params: { slug: string } }`.

## Syntax highlighting + Copy button (Shiki + rehype-pretty-code)

- **Config**: `web/velite.config.ts` uses dual themes:
  - `theme: { light: 'github-light', dark: 'github-dark' }`
  - `transformers: [transformerCopyButton()]`
- **Why CSS is required**: Shiki dual‑theme output is unstyled by default (tokens are emitted with CSS variables like `--shiki-light`, `--shiki-dark`).
- **Global CSS**: in `src/app/globals.css` we map variables and style the copy button:
  - Map colors and backgrounds (match our implementation):
    - `code[data-theme] span { color: var(--shiki-light); }`
    - `html.dark code[data-theme] span { color: var(--shiki-dark); }`
    - `code[data-theme] { background: var(--shiki-light-bg); }`
    - `html.dark code[data-theme] { background: var(--shiki-dark-bg); }`
    - Optionally also style the wrapping `pre` with `:has(code[data-theme])` to ensure a solid block background.
  - Copy button styles for `.rehype-pretty-copy` (revealed on hover; click shows a success state). We also allow `pre:hover .rehype-pretty-copy { opacity: 1 }` for reliable reveal.
- **Tailwind prose**: avoid overriding Shiki colors/background. In `src/app/blog/[slug]/page.tsx` we avoid extra `prose` overrides that affect `pre/code`.
- **Usage**: add fenced code blocks in Markdown, e.g.

  ```md
  ```ts
  export function greet(name: string) {
    return `Hello, ${name}!`
  }
  ```
  ```

- **Customize theme**: change the theme names in `velite.config.ts` to any Shiki theme(s). The CSS above will continue to work with dual themes.

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
  - Optional: fix types in `src/app/blog/[slug]/page.tsx` to `{ params: { slug: string } }` (not a Promise) to align with Next conventions.

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
