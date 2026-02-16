import { createClient, SupabaseClient } from "@supabase/supabase-js";

function getUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || "";
}

function getAnonKey() {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
}

let browserClient: SupabaseClient | null = null;

export function getSupabaseBrowser(): SupabaseClient {
  if (browserClient) return browserClient;
  browserClient = createClient(getUrl(), getAnonKey());
  return browserClient;
}

export function getSupabaseServer(accessToken?: string): SupabaseClient {
  return createClient(getUrl(), getAnonKey(), {
    global: {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    },
  });
}

export function getServiceSupabase(): SupabaseClient {
  return createClient(getUrl(), process.env.SUPABASE_SERVICE_ROLE_KEY || "", {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
