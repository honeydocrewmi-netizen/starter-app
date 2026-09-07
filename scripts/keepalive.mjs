#!/usr/bin/env node
// Daily anti-pause ping, run by .github/workflows/keepalive.yml in place of
// the Vercel cron this repo used to have. A free Supabase project pauses
// after a week with no activity; this keeps "a few requests a day" flowing.
//
// Reads supabase/config.json, so it works as soon as that file names a project.
// It stays a quiet no-op if that config is somehow empty — it must NOT fail
// noisily every day.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

// Same committed source of truth the app uses (see lib/supabase-client.ts), so
// the URL and key are defined exactly once in this repo. Env vars still win,
// which keeps a fork able to point at its own project via repo variables.
const configPath = new URL("../supabase/config.json", import.meta.url);
const config = JSON.parse(readFileSync(configPath, "utf8"));

const url = process.env.SUPABASE_URL?.trim() || config.url;
const key = process.env.SUPABASE_PUBLISHABLE_KEY?.trim() || config.publishableKey;

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
