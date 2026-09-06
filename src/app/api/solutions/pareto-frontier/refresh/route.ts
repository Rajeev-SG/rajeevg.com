import { NextResponse } from "next/server";
import { put } from "@vercel/blob";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Durable snapshot writer for the Pareto refresh pipeline.
 *
 * The scheduled refresh workflow calls this endpoint (HMAC-signed) after
 * validating a fresh snapshot. Writing to Vercel Blob decouples data delivery
 * from Git commits: data changes reach production via Blob immediately, and
 * code changes reach production via the normal Git-integration lifecycle.
 * A failed refresh never overwrites the last-good Blob.
 */
const REFRESH_SECRET = process.env.PARETO_REFRESH_SECRET;
const BLOB_PATH = "pareto/pareto-aa-fallback.json";

export async function POST(request: Request) {
  if (!REFRESH_SECRET) {
    return NextResponse.json({ error: "PARETO_REFRESH_SECRET not configured" }, { status: 503 });
  }
  const auth = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${REFRESH_SECRET}`;
  if (auth !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "BLOB_READ_WRITE_TOKEN not configured" }, { status: 503 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }
  const snap = payload as { generatedAt?: string; freshness?: { aaFetchedAt?: string | null }; models?: unknown[] };
  const models = Array.isArray(snap?.models) ? snap.models : [];
  const quality = models.filter(
    (m) =>
      m !== null && typeof m === "object" &&
      typeof (m as { aa?: { intelligenceIndex?: unknown } }).aa?.intelligenceIndex === "number"
  ).length;
  if (models.length === 0 || quality === 0 || !snap.generatedAt) {
    return NextResponse.json(
      { error: `snapshot rejected (models=${models.length}, quality=${quality}); last-good retained` },
      { status: 422 }
    );
  }

  try {
    const blob = await put(BLOB_PATH, JSON.stringify(payload), {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
      token,
    });
    return NextResponse.json({ ok: true, url: blob.url });
  } catch (err) {
    return NextResponse.json(
      { error: `blob write failed: ${err instanceof Error ? err.message : String(err)}` },
      { status: 502 }
    );
  }
}
