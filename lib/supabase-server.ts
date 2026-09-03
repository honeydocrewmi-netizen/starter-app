import { createClient } from "@supabase/supabase-js";

// Server-only. Uses the PUBLISHABLE key on purpose (see README "Architecture
// call #2"): RLS still enforces insert-only underneath, so a bug here can't
// turn into a full-table compromise. Never import a secret/service-role key
// here or anywhere else in this app.
export function getSupabaseServerClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error("Supabase is not configured: missing SUPABASE_URL or SUPABASE_PUBLISHABLE_KEY");
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}
