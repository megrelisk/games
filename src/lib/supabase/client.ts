import { createBrowserClient } from "@supabase/ssr";

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** True when the app is wired to a real Supabase project. */
export const hasSupabase = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

/**
 * Browser-side Supabase client (singleton). Throws if env is missing —
 * callers should check `hasSupabase` first.
 */
export function getSupabaseBrowser() {
  if (!hasSupabase) throw new Error("Supabase env vars are not configured.");
  if (!browserClient) {
    browserClient = createBrowserClient(SUPABASE_URL!, SUPABASE_ANON_KEY!);
  }
  return browserClient;
}
