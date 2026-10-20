import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Identify the build a response came from.
 *
 * The deploy-time check for the /interfaces route has to prove that the
 * production alias is serving the commit that was just pushed, not whatever
 * was deployed before it. Vercel's deployment URLs are behind deployment
 * protection, so the alias is the only thing that can be probed — and the
 * alias does not stamp its build into the HTML.
 *
 * The value is a hash of the commit, not the commit: it says which build is
 * live without publishing the commit itself. The hash is captured at build
 * time (next.config.ts) because the runtime environment does not carry the
 * commit.
 */
export function GET() {
  const build = process.env.SITE_BUILD_HASH ?? "local";
  return NextResponse.json(
    { build },
    { headers: { "Cache-Control": "no-store" } },
  );
}
