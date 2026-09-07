import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import config from "@/supabase/config.json";

// Browser-direct on purpose: GitHub Pages serves static files only, so there
// is no server to hold a key. The publishable key is designed to be public —
// anyone can already read it out of the deployed bundle — and the insert-only
// RLS policy in supabase/schema.sql is what actually protects the data, not
// key secrecy. See data/qr-scout-build-paths/report.md section 3.1/3.5.
//
// Both values are COMMITTED, in supabase/config.json, for the same reason
// public/CNAME is: they're deployment facts, not secrets, and keeping them in
// version control means a fresh clone builds a working site with no dashboard
// state to remember. scripts/keepalive.mjs reads that same file, so the URL
// and key are defined exactly once in this repo.
//
// The NEXT_PUBLIC_* env vars still win if set, so a fork can point at its own
// project by setting repo variables without editing code. NEXT_PUBLIC_* is
// inlined into the client bundle at build time, so which project this site
// talks to is a build-time fact either way.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || config.url;
const key =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() || config.publishableKey;

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
