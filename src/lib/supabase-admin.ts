import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-side Supabase client with service_role key.
 * Bypasses RLS — use ONLY in API routes, never expose to browser.
 * Lazy-initialized to avoid build-time errors when env vars are not set.
 */
let _client: SupabaseClient | null = null;

export const supabaseAdmin: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    if (!_client) {
      _client = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
    }
    return (_client as Record<string | symbol, unknown>)[prop];
  },
});
