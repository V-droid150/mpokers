import { NextResponse } from "next/server";
import { getAdminClient, getCallerUid, ROOMS_TABLE } from "@/lib/supabaseAdmin";
import { DEFAULT_CONFIG, initialState } from "@/lib/engine";
import { makeRoomCode } from "@/lib/format";

export const runtime = "nodejs";

// Create a new room. The caller (verified anon-auth uid) becomes the dealer/host.
export async function POST(req: Request) {
  const admin = getAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Server not configured" }, { status: 500 });
  }
  const uid = await getCallerUid(req, admin);
  if (!uid) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  let body: { hostName?: unknown } = {};
  try {
    body = await req.json();
  } catch {
    /* empty body is fine */
  }
  const hostName = String(body.hostName ?? "").trim().slice(0, 24);

  // Insert with a unique code, retrying on the rare collision.
  for (let attempt = 0; attempt < 6; attempt++) {
    const code = makeRoomCode();
    const state = initialState(uid, DEFAULT_CONFIG, hostName);
    const { error } = await admin.from(ROOMS_TABLE).insert({ code, state });
    if (!error) return NextResponse.json({ code });
    // 23505 = unique_violation → pick a new code; anything else is a real error.
    if ((error as { code?: string }).code !== "23505") {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }
  return NextResponse.json({ error: "Could not allocate a room code" }, { status: 500 });
}
