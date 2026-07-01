// SERVER-ONLY. Uses the Supabase service-role key, which bypasses RLS. This
// module must never be imported by client code — it is only used inside the
// /api route handlers, so the secret never reaches the browser bundle.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const ROOMS_TABLE = "rooms";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Factory (not created at import) so a missing key doesn't crash the build; the
// route handler returns a clean 500 instead.
export function getAdminClient(): SupabaseClient | null {
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// Verify the caller's anonymous-auth JWT from the Authorization header and
// return their user id, or null if unauthenticated/invalid.
export async function getCallerUid(
  req: Request,
  admin: SupabaseClient
): Promise<string | null> {
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) return null;
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user.id;
}
