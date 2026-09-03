import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Browser-direct on purpose: GitHub Pages serves static files only, so there
// is no server to hold a key. The publishable key is designed to be public —
// anyone can already read it out of the deployed bundle — and the insert-only
// RLS policy in supabase/schema.sql is what actually protects the data, not
// key secrecy. See data/qr-scout-build-paths/report.md section 3.1/3.5.
//
// NEXT_PUBLIC_* vars are inlined into the client bundle at build time, so
// "configured" is a build-time fact, not something checked at request time.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const isSupabaseConfigured = Boolean(url && key);

let client: SupabaseClient | null = null;

export function getSupabaseBrowserClient(): SupabaseClient {
  if (!url || !key) {
    throw new Error(
      "Supabase is not configured: missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    );
  }
  if (!client) {
    client = createClient(url, key, { auth: { persistSession: false } });
  }
  return client;
}
