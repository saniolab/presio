import { createClient } from "@supabase/supabase-js";
import { runtimeConfig } from "@/lib/runtimeConfig";

// Fall back to placeholders when no Supabase config is set (CI/e2e, local
// mode): createClient throws on an empty URL, which would take the whole app
// down instead of just disabling login.
const url = runtimeConfig.supabaseUrl || "https://supabase.invalid";
const key = runtimeConfig.supabaseAnonKey || "anon-key-not-configured";

export const supabase = createClient(url, key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
