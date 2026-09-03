import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";

// Hit once daily by the Vercel Cron in vercel.json. A free Supabase project
// pauses after a week with no activity; this keeps "a few requests a day"
// flowing so the form doesn't go dark on a QR poster nobody scans for weeks.
// Skipped entirely if you're on Supabase Pro (no pausing) — harmless either way.
export async function GET() {
  try {
    const supabase = getSupabaseServerClient();
    // anon only has INSERT on this table, so this SELECT is expected to come
    // back as a permission-denied error — that's fine. The request reaching
    // Postgres is what counts as "activity" to Supabase; we don't need it to
    // succeed, only to happen.
    await supabase.from("submissions").select("id", { count: "exact", head: true });
    return NextResponse.json({ ok: true });
  } catch (err) {
    // A thrown error here means the request never reached Supabase at all
    // (network failure, bad config) — that's the real "keepalive didn't
    // happen" case worth surfacing in Vercel's cron logs.
    console.error("keepalive: request did not reach Supabase", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
