import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Identify the build a response came from.
 *
 * The deploy-time check for the /interfaces route has to prove that the
 * production alias is serving the commit that was just pushed, not whatever
 * was deployed before it. Vercel's deployment URLs are behind deployment
 * protection, and this site's Vercel scope is not administered from CI, so
 * the alias is the only thing that can be probed — and the alias does not
 * stamp its build into the HTML.
 *
 * This is a build-identity oracle and it is deliberately unauthenticated:
 * the repository is public, so the commit it names is already public
 * information, and the value returned is a fingerprint of that commit rather
 * than the commit itself. Restricting it to CI would need a secret in the
 * site's Vercel environment, which is not administered from this repository.
 * The response carries nothing else — no timestamps, no branch, no metadata.
 *
 * The hash is captured at build time (next.config.ts) because the runtime
 * environment does not carry the commit: Vercel sets VERCEL_GIT_COMMIT_SHA to
 * the commit that was pushed, and the build hash is sha256 of that value.
 */
export function GET() {
  const build = process.env.SITE_BUILD_HASH ?? "local";
  return NextResponse.json(
    { build },
    { headers: { "Cache-Control": "no-store" } },
  );
}
