"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { isSupabaseConfigured, ROOMS_TABLE, supabase } from "./supabase";
import { DEFAULT_CONFIG, initialState, reduce } from "./engine";
import type { Action, GameState } from "./types";

export type RoomStatus =
  | "unconfigured"
  | "loading"
  | "missing"
  | "ready"
  | "error";

interface UseRoomOptions {
  create?: boolean;
  hostId?: string;
  hostName?: string;
}

export function useRoom(code: string, opts: UseRoomOptions) {
  const [state, setState] = useState<GameState | null>(null);
  const [status, setStatus] = useState<RoomStatus>(
    isSupabaseConfigured ? "loading" : "unconfigured"
  );
  const [error, setError] = useState<string | null>(null);

  const stateRef = useRef<GameState | null>(null);
  stateRef.current = state;

  // Keep create/host options in a ref so changing them doesn't resubscribe.
  const optsRef = useRef(opts);
  optsRef.current = opts;

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase || !code) return;
    const client = supabase;
    let active = true;

    const applyRemote = (next: GameState | undefined) => {
      if (!next) return;
      const cur = stateRef.current;
      if (!cur || next.version >= cur.version) {
        stateRef.current = next;
        setState(next);
        setStatus("ready");
        setError(null);
      }
    };

    const init = async () => {
      const { data, error: selErr } = await client
        .from(ROOMS_TABLE)
        .select("state")
        .eq("code", code)
        .maybeSingle();
      if (!active) return;
      if (selErr) {
        setError(selErr.message);
        setStatus("error");
        return;
      }
      if (data?.state) {
        applyRemote(data.state as GameState);
        return;
      }
      if (optsRef.current.create && optsRef.current.hostId) {
        const fresh = initialState(
          optsRef.current.hostId,
          DEFAULT_CONFIG,
          optsRef.current.hostName || ""
        );
        const { error: insErr } = await client
          .from(ROOMS_TABLE)
          .insert({ code, state: fresh });
        if (!active) return;
        if (insErr) {
          // Possibly created concurrently — try reading it back.
          const { data: again } = await client
            .from(ROOMS_TABLE)
            .select("state")
            .eq("code", code)
            .maybeSingle();
          if (again?.state) applyRemote(again.state as GameState);
          else {
            setError(insErr.message);
            setStatus("error");
          }
        } else {
          applyRemote(fresh);
        }
        return;
      }
      setStatus("missing");
    };

    void init();

    const channel = client
      .channel(`room:${code}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: ROOMS_TABLE,
          filter: `code=eq.${code}`,
        },
        (payload) => {
          applyRemote((payload.new as { state?: GameState })?.state);
        }
      )
      .subscribe();

    return () => {
      active = false;
      client.removeChannel(channel);
    };
  }, [code]);

  const dispatch = useCallback(
    async (action: Action) => {
      if (!supabase) return;
      const client = supabase;
      for (let attempt = 0; attempt < 4; attempt++) {
        const current = stateRef.current;
        if (!current) return;
        const next = reduce(current, action);
        if (next === current) return; // illegal / no-op

        const { data, error: updErr } = await client
          .from(ROOMS_TABLE)
          .update({ state: next, updated_at: new Date().toISOString() })
          .eq("code", code)
          .filter("state->>version", "eq", String(current.version))
          .select("state");

        if (updErr) {
          setError(updErr.message);
          return;
        }
        if (data && data.length > 0) {
          stateRef.current = next;
          setState(next);
          setError(null);
          return;
        }

        // Version conflict: someone else wrote first. Refetch and retry.
        const { data: latest } = await client
          .from(ROOMS_TABLE)
          .select("state")
          .eq("code", code)
          .maybeSingle();
        if (latest?.state) {
          stateRef.current = latest.state as GameState;
          setState(latest.state as GameState);
        }
        await new Promise((r) => setTimeout(r, 70));
      }

      // Every attempt hit a version conflict — don't drop the action silently.
      setError("Couldn't sync your action — please try again.");
    },
    [code]
  );

  return { state, status, error, dispatch };
}
