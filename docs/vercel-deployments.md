# Vercel deployments

How this project decides which Git pushes become Vercel deployments, and how to
get a preview when you actually want one.

## The policy

`main` deploys to production automatically, exactly as before. Nothing else
does. The rule lives in `vercel.json`:

```json
"git": {
  "deploymentEnabled": {
    "main": true,
    "manual-preview": true,
    "*": false,
    "**": false,
    "pareto-data": false,
    "benchmark-data": false
  }
}
```

Vercel reads `vercel.json` from the **pushed commit**, not from `main`. That has
two consequences worth knowing:

- The policy takes effect once it is on `main`: a branch created from the
  updated `main` carries the file and is suppressed.
- A branch whose tip predates the merge (or was forked from an old `main`)
  still contains the old `vercel.json`, so its first push can still deploy once.
  Delete and re-create such a branch from the new `main`, or push the merge
  first. This is the same reason `pareto-data` and `benchmark-data` are created
  from the tip of `main`.

A branch matching any `true` rule deploys; a branch matching a `false` rule does not; a branch matching no rule is
enabled by default, which is why the `*` and `**` catch-alls exist. Both are
listed because `*` does not cross `/`, so on its own it misses `codex/foo` or
`gh-12/x`.

| Branch | Deploys? | Why |
| --- | --- | --- |
| `main` | Yes, production | Explicitly enabled |
| `manual-preview` | Yes, preview | Exact-name escape hatch |
| `pareto-data` | No | Data branch; meaningless as a site |
| `benchmark-data` | No | Data branch; meaningless as a site |
| anything else | No | `*` and `**` are `false` |

`src/lib/content-ops/__tests__/vercel-deployment-policy.test.ts` asserts this
shape, so a future edit cannot quietly turn previews back on or, worse, turn
production off.

### Why an exact branch name for the escape hatch

Three facts were verified end to end on 2026-09-14 by pushing commits and
reading the deployment list back from the Vercel API:

- The `*`/`**` `false` catch-alls do suppress ordinary branches. Pushing
  `chore/vercel-main-only-deployments` (a unique commit, no prior deployment)
  with this policy produced **zero** deployments.
- An exact branch name listed as `true` deploys a preview even while the
  catch-alls also match it. `manual-preview` and `preview-probe` each built one.
- When no catch-all is present, an unlisted branch deploys. A config of only
  `{ "main": true }` allowed an ordinary branch to build. This is why the
  catch-alls are required, and why removing them silently re-enables previews.

The escape hatch is an exact name rather than a `preview/**` glob because the
exact name is what was directly observed to work. Glob behaviour is **not**
claimed either way: several probe branches shared a single commit SHA, and
Vercel returns the existing deployment instead of creating a second one for a
SHA it has already built, so those probes could not distinguish "glob ignored"
from "SHA already deployed". An exact name avoids the question entirely and is
therefore what the workflow uses.

## Getting a preview on demand

Two supported ways, both of which leave the automatic policy untouched.

**1. The `Preview on demand` workflow (no local setup).**
Run `.github/workflows/preview-on-demand.yml` from the Actions tab
(*Run workflow*). Optionally give it a ref (branch, tag or SHA). It
force-pushes that ref to the branch `manual-preview`, which the policy above
enables, and prints the preview URL in the run summary. Only that one preview
branch ever exists. Deleting it afterwards does not remove the deployment.

**2. The Vercel CLI, from your machine.**

```bash
vercel deploy            # preview of the working tree
vercel deploy --prod     # production
```

The CLI deployment path is not affected by `git.deploymentEnabled`; it builds
whatever you point it at. The project is linked already (`.vercel/`).

## What still works

- Production deploys on every merge to `main`.
- The `article-local-ci` workflow's "Wait for Vercel and prove production
  article" step. It only runs on pushes to `main` or an explicit
  `production: true` dispatch, both of which still deploy.
- `pareto-data` and `benchmark-data` stay excluded, as before.
- No GitHub required status check depends on Vercel: branch protection requires
  only `frontier-quality`.

## Trade-off

A branch that is not `main` and not `manual-preview` gets no Vercel preview at
all, so there is no preview URL to click on an ordinary pull request. That is
the intent: CI (`trusted-article-acceptance`) already builds and browser-tests
the change locally on the self-hosted runner, and previews were costing Hobby
build/storage quota for no extra signal. When a real Vercel preview is worth
having, use one of the two paths above.
