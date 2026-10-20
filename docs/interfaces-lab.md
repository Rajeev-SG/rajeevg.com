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

1. **The origin is pinned by content, not by name.** The lab's build writes
   `build-info.json` — a hash of the output records, the built outputs and the
   posters, plus the number of outputs. The site pins the build it expects in
   `src/lib/interfaces/lab-release.json`, and the smoke spec asserts that the
   proxied marker and the origin's marker both equal that pin. A swapped
   origin, a recreated project, or a stale lab deployment fails the check
   instead of passing on a page title. The pin catches a wrong or replaced
   origin; it does not catch an origin that is compromised and deliberately
   serves the pinned bytes, and it does not make the lab's scripts safe — only
   a dedicated origin would.
2. **The proof runs against the commit that was pushed.** The
   `interfaces-smoke` workflow looks up the GitHub deployment for `$GITHUB_SHA`
   and waits for it to succeed, then waits until the production alias reports
   that exact commit at `/api/build-info` — a hash of the deployed commit, so
   the commit itself is not published. Only then does the workflow run the
   spec against `https://rajeevg.com`. Vercel's own deployment URLs sit behind
   deployment protection and cannot be probed, so the alias is what the proof
   reads; the commit check is what keeps that honest. A push that produced no
   production deployment is reported as skipped rather than as a failure.
3. **A dedicated subdomain would shrink the blast radius.** Serving the lab
   from `interfaces.rajeevg.com` (or a dedicated host) keeps it cross-origin
   and removes this site's session from the lab's reach entirely. The path
   proxy is the current shape because the route was requested as
   `rajeevg.com/interfaces`; the subdomain is the safer shape if the route is
   ever free to change.
4. **No caching of proxied responses.** The site does not set
   `x-vercel-enable-rewrite-caching` for `/interfaces`. The origin's
   `Cache-Control` is outside this site's control, and an unbounded rewrite
   cache would serve a stale lab after a lab redeploy with no staleness budget
   to point at. The cost is one extra origin round trip per request, which is
   the right trade for a route that changes when the lab changes.

### Cache behaviour, audited

Measured against the live origin and the proxy (2026-10-20), every lab
response — the shell, a deep route, an experiment page and a poster — carries:

```
cache-control: public, max-age=0, must-revalidate
```

The proxy passes that through unchanged, so every hit is revalidated and the
staleness budget is zero: a lab redeploy is visible on the next request. The
smoke spec asserts `max-age=0` and `must-revalidate` on the shell, a deep
route and the poster, and records `Age` and `x-vercel-cache` as annotations, so
a change at the edge that widened the budget fails the run.

## Redeploying the lab

The lab is deployed from its own repository:

```bash
cd ../visual-ai-lab
node scripts/build-data.mjs
node scripts/validate.mjs
cd lab && node scripts/build-info.mjs && VITE_BASE=/interfaces/ npx vite build
vercel deploy --prod
```

`VITE_BASE=/interfaces/` makes every asset, poster and frame resolve under
`/interfaces/`. The lab's own project rewrites `/interfaces/:path*` to `/:path*`
so it also serves correctly at its own origin.

`scripts/build-info.mjs` writes the lab's build marker, which Vercel also runs
before the build. When the lab's content changes, the marker changes, and the
site has to be told which build it expects:

```bash
cd ../visual-ai-lab/lab && node scripts/build-info.mjs
# lab build 747cf72c8d0057e6 (41 outputs)
```

Copy that build and output count into `src/lib/interfaces/lab-release.json` in
this repository and merge it. Until that happens the smoke spec fails, which
is the intended behaviour: the site refuses to serve a lab it has not pinned.

## Checking the route

```bash
E2E_BASE_URL=https://rajeevg.com pnpm exec playwright test tests/e2e/interfaces-smoke.spec.ts
```

The same spec runs automatically on the `interfaces-smoke` workflow after any
production deploy that touches the route, the rewrite configuration, the
middleware, or the spec itself. The workflow waits for the production
deployment of the pushed commit, then proves the route on `https://rajeevg.com`
once that alias reports the same commit, so the proof is about that commit and
not about whatever the alias happened to be serving a moment earlier.
