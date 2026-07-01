import { NextResponse } from "next/server";
import { getAdminClient, getCallerUid, ROOMS_TABLE } from "@/lib/supabaseAdmin";
import { reduce } from "@/lib/engine";
import { authorizeAction } from "@/lib/authorize";
import type { Action, GameState } from "@/lib/types";

export const runtime = "nodejs";

// The single authoritative write path. Verifies the caller's identity, checks
// they're allowed to dispatch the action, runs the pure reducer, and persists
// the result with optimistic-concurrency retries. Anon clients cannot write the
// rooms table directly (RLS); every mutation goes through here.
export async function POST(req: Request) {
  const admin = getAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Server not configured" }, { status: 500 });
  }
  const uid = await getCallerUid(req, admin);
  if (!uid) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  let body: { code?: unknown; action?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
  const code = String(body.code ?? "").toUpperCase();
  const action = body.action as Action | undefined;
  if (!code || !action || typeof action.type !== "string") {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  for (let attempt = 0; attempt < 5; attempt++) {
    const { data, error } = await admin
      .from(ROOMS_TABLE)
      .select("state")
      .eq("code", code)
      .maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data?.state) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    const state = data.state as GameState;
    if (!authorizeAction(state, action, uid)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const next = reduce(state, action);
    if (next === state) {
      // Illegal / no-op per the game rules — return current state, not an error.
      return NextResponse.json({ state });
    }

    const { data: updated, error: updErr } = await admin
      .from(ROOMS_TABLE)
      .update({ state: next, updated_at: new Date().toISOString() })
      .eq("code", code)
      .filter("state->>version", "eq", String(state.version))
      .select("state");
    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });
    if (updated && updated.length > 0) {
      return NextResponse.json({ state: next });
    }
    // Version conflict: someone else wrote first. Refetch and retry.
    await new Promise((r) => setTimeout(r, 40));
  }

  return NextResponse.json({ error: "Conflict, please retry" }, { status: 409 });
}
