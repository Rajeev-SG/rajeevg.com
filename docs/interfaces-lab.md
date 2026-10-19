# The Visual AI Lab at `/interfaces`

The Visual AI Lab is a gallery of 41 real outputs produced by executing
open-source AI creative-coding skills. It is built in its own repository
(`Rajeev-SG/visual-ai-lab`), deployed as its own Vercel project
(`visual-ai-lab`), and served here through a path-scoped rewrite.

## How the route works

`next.config.ts`:

```ts
{ source: "/interfaces", destination: "https://visual-ai-lab.vercel.app/" },
{ source: "/interfaces/:path*", destination: "https://visual-ai-lab.vercel.app/:path*" }
```

The bare `/interfaces` rule is separate because `:path*` does not match the
prefix alone in every Next version, and the trailing-slash form is what the nav
link and the sitemap point at.

The lab project owns its own SPA fallback: its `vercel.json` rewrites unknown
paths to `/index.html`, so a client-only route such as
`/interfaces/output/hybrid-slack-water` is served by the lab's index and
resolved by the lab's router. Experiment pages are real files under
`/interfaces/experiments/<id>/index.html` and are served as files. The
`interfaces-smoke` workflow proves both forms after every production deploy.

`src/middleware.ts` excludes `/interfaces` from markdown content negotiation.
Without that exclusion the middleware would rewrite the lab's HTML into a
markdown response.

## Why a separate project

The lab ships about 37 MB of real output media — films, posters, and the
bundled outputs themselves. Keeping it in its own project keeps that media out
of this repository and out of this site's build, and lets the lab be redeployed
without touching the marketing site.

It also keeps the lab's iframes same-origin with the page. The compare bench
runs two to four outputs in lockstep by injecting a clock bootstrap into each
frame's document; a cross-origin frame would refuse that injection. The
`interfaces-smoke` workflow asserts this at runtime by checking that a frame on
the site origin really did accept the bootstrap.

## Trust model and blast radius

**The proxy puts the lab's JavaScript on this site's origin.** Anything the lab
serves under `/interfaces` executes with the same origin as this site: it can
read non-HttpOnly cookies, `localStorage`, and it can call this site's own API
routes as the logged-in user. This is the real cost of serving the lab from a
path on the marketing domain, and it is the reason the guardrails below exist.

The lab is a project owned by the same account as this site, deployed by the
same person, with no third-party scripts of its own. The realistic risks are
accidental, not adversarial:

- the `visual-ai-lab` Vercel project is deleted, renamed, or re-pointed;
- the origin starts serving unexpected content;
- the origin's deployment becomes stale relative to the lab's repository.

### Guardrails

1. **The origin is asserted, not assumed.** `tests/e2e/interfaces-smoke.spec.ts`
   checks that `https://visual-ai-lab.vercel.app/interfaces/` still serves the
   lab, and the `interfaces-smoke` workflow runs it after every production
   deploy that touches the route.
2. **A dedicated subdomain would shrink the blast radius.** Serving the lab
   from `interfaces.rajeevg.com` (or a dedicated host) keeps it cross-origin
   and removes this site's session from the lab's reach entirely. The path
   proxy is the current shape because the route was requested as
   `rajeevg.com/interfaces`; the subdomain is the safer shape if the route is
   ever free to change.
3. **No caching of proxied responses.** The site does not set
   `x-vercel-enable-rewrite-caching` for `/interfaces`. The origin's
   `Cache-Control` is outside this site's control, and an unbounded rewrite
   cache would serve a stale lab after a lab redeploy with no staleness budget
   to point at. The cost is one extra origin round trip per request, which is
   the right trade for a route that changes when the lab changes.

## Redeploying the lab

The lab is deployed from its own repository:

```bash
cd ../visual-ai-lab
node scripts/build-data.mjs
node scripts/validate.mjs
cd lab && VITE_BASE=/interfaces/ npx vite build
vercel deploy --prod
```

`VITE_BASE=/interfaces/` makes every asset, poster and frame resolve under
`/interfaces/`. The lab's own project rewrites `/interfaces/:path*` to `/:path*`
so it also serves correctly at its own origin.

## Checking the route

```bash
E2E_BASE_URL=https://rajeevg.com pnpm exec playwright test tests/e2e/interfaces-smoke.spec.ts
```

The same spec runs automatically on the `interfaces-smoke` workflow after any
production deploy that touches the route, the rewrite configuration, the
middleware, or the spec itself.
