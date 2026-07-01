// Client-side anonymous auth. Each device signs in anonymously once and keeps a
// stable, verifiable user id (uid) that the server uses as the player identity.
// This is what makes host/dealer gating unspoofable: the server checks the JWT.
"use client";

import { supabase } from "./supabase";

// Ensure there's an anonymous session; returns the uid (or null if unconfigured).
export async function ensureAnonAuth(): Promise<string | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  if (data.session?.user) return data.session.user.id;
  const { data: signed, error } = await supabase.auth.signInAnonymously();
  if (error) return null;
  return signed.user?.id ?? null;
}

export async function getUid(): Promise<string | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.user?.id ?? null;
}

export async function getAccessToken(): Promise<string | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}
