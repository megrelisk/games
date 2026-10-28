import { createClient } from "@supabase/supabase-js";

import { SUPABASE_ANON_KEY, SUPABASE_URL, hasSupabase } from "./client";

/**
 * Server-side Supabase client for Server Components / route handlers.
 * The app runs in "open contribution" mode (no auth), so the anon key is
 * sufficient; RLS policies in supabase/schema.sql grant public read/write.
 */
export function getSupabaseServer() {
  if (!hasSupabase) throw new Error("Supabase env vars are not configured.");
  return createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
