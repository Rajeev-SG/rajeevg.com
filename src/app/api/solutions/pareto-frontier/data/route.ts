import { NextResponse } from "next/server";
import { getParetoSnapshot, REVALIDATE } from "@/lib/pareto/aggregate";

export const dynamic = "force-dynamic";

/**
 * Internal data endpoint for the Pareto Frontier dashboard.
 * Server-side only. No secrets in response; only normalised snapshot data.
 */
export async function GET() {
  try {
    const { snapshot, errors } = await getParetoSnapshot();
    return NextResponse.json({ ...snapshot, errors: errors.length > 0 ? errors : undefined }, {
      headers: {
        "Cache-Control": `public, max-age=0, s-maxage=${REVALIDATE.aa}, stale-while-revalidate=86400`,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 503 }
    );
  }
}
