"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { isSupabaseConfigured, ROOMS_TABLE, supabase } from "./supabase";
import { reduce } from "./engine";
import { getAccessToken } from "./auth";
import type { Action, GameState } from "./types";

export type RoomStatus =
  | "unconfigured"
  | "loading"
  | "missing"
  | "ready"
  | "error";

export function useRoom(code: string) {
  const [state, setState] = useState<GameState | null>(null);
  const [status, setStatus] = useState<RoomStatus>(
    isSupabaseConfigured ? "loading" : "unconfigured"
  );
  const [error, setError] = useState<string | null>(null);

  const stateRef = useRef<GameState | null>(null);
  stateRef.current = state;

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
      } else {
        setStatus("missing");
      }
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

  // Every mutation goes through the authoritative server endpoint. We apply the
  // action optimistically for snappy UX, then POST; realtime delivers the
  // server's authoritative result to all clients. On failure we revert.
  const dispatch = useCallback(
    async (action: Action) => {
      const cur = stateRef.current;
      if (!cur || !supabase) return;

      const optimistic = reduce(cur, action);
      if (optimistic !== cur) {
        stateRef.current = optimistic;
        setState(optimistic);
      }

      try {
        const token = await getAccessToken();
        const res = await fetch("/api/action", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ code, action }),
        });
        if (!res.ok) {
          setError("Couldn't sync your action — please try again.");
          // Revert the optimistic change to the authoritative state.
          const { data } = await supabase
            .from(ROOMS_TABLE)
            .select("state")
            .eq("code", code)
            .maybeSingle();
          if (data?.state) {
            stateRef.current = data.state as GameState;
            setState(data.state as GameState);
          }
          return;
        }
        setError(null);
      } catch {
        setError("Network error — please try again.");
      }
    },
    [code]
  );

  return { state, status, error, dispatch };
}
