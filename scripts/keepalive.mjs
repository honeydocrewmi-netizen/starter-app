#!/usr/bin/env node
// Daily anti-pause ping, run by .github/workflows/keepalive.yml in place of
// the Vercel cron this repo used to have. A free Supabase project pauses
// after a week with no activity; this keeps "a few requests a day" flowing.
//
// No Supabase project exists yet for this POC, so this is a deliberate no-op
// until SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY are set as repo variables —
// it must NOT fail noisily every day before the project exists.
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  console.log("keepalive: Supabase not configured yet — no-op.");
  process.exit(0);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

try {
  // anon only has INSERT on this table, so this SELECT is expected to come
  // back as a permission-denied error — that's fine. The request reaching
  // Postgres is what counts as "activity" to Supabase; it doesn't need to
  // succeed, only to happen.
  await supabase.from("submissions").select("id", { count: "exact", head: true });
  console.log("keepalive: request reached Supabase.");
} catch (err) {
  console.error("keepalive: request did not reach Supabase:", err);
  process.exit(1);
}
