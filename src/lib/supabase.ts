import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

// `supabase` is null when env vars are missing so the app can still render a
// helpful setup screen instead of crashing during build/first run.
export const supabase = isSupabaseConfigured
  ? createClient(url as string, anonKey as string, {
      auth: {
        // Persist the anonymous-auth session so each device keeps a stable uid.
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
      realtime: { params: { eventsPerSecond: 10 } },
    })
  : null;

export const ROOMS_TABLE = "rooms";
