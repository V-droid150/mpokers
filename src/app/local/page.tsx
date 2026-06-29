"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DEFAULT_CONFIG, initialState, reduce } from "@/lib/engine";
import type { Action, GameState } from "@/lib/types";
import { MAX_PLAYERS } from "@/lib/types";
import PokerTable from "@/components/PokerTable";
import BetControls from "@/components/BetControls";
import ActionLog from "@/components/ActionLog";

// Pass-and-play mode: the whole game runs in memory on one device. The control
// panel always belongs to whoever must act, so players pass the phone around.
export default function LocalPage() {
  const router = useRouter();
  const [state, setState] = useState<GameState>(() => {
    let s = initialState("seat-host", DEFAULT_CONFIG);
    s = reduce(s, { type: "JOIN", playerId: "seat-host", name: "Pemain 1" });
    s = reduce(s, { type: "JOIN", playerId: "seat-2", name: "Pemain 2" });
    return s;
  });
  const [newName, setNewName] = useState("");

  const dispatch = (action: Action) => setState((s) => reduce(s, action));

  // The "active" identity whose controls are shown.
  const activeId = useMemo(() => {
    if (state.status === "playing" && state.toActSeat !== null) {
      const p = state.players.find((x) => x.seat === state.toActSeat);
      if (p) return p.id;
    }
    return state.players[0]?.id ?? "seat-host";
  }, [state]);

  const addPlayer = () => {
    const name = newName.trim() || `Pemain ${state.players.length + 1}`;
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : "p" + Math.random().toString(36).slice(2);
    dispatch({ type: "JOIN", playerId: id, name });
    setNewName("");
  };

  const canAddPlayers =
    (state.status === "lobby" || state.status === "handover") &&
    state.players.length < MAX_PLAYERS;

  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-md flex-col px-3 pb-4 pt-3">
      <div className="mb-2 flex items-center justify-between">
        <button
          onClick={() => router.push("/")}
          className="text-sm text-stone-400 active:text-stone-200"
        >
          ← Keluar
        </button>
        <span className="rounded-full border border-vegas-gold/40 bg-black/40 px-4 py-1.5 font-display text-sm font-bold tracking-[0.2em] text-vegas-gold">
          MAIN LOKAL
        </span>
        <span className="w-12 text-right text-xs text-stone-500">
          {state.players.length}/8
        </span>
      </div>

      {canAddPlayers && (
        <div className="mb-2 flex gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            maxLength={14}
            placeholder="Tambah nama pemain…"
            className="flex-1 rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:border-vegas-gold"
            onKeyDown={(e) => e.key === "Enter" && addPlayer()}
          />
          <button
            onClick={addPlayer}
            className="rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-stone-100 active:scale-95"
          >
            + Tambah
          </button>
        </div>
      )}

      <div className="flex-1">
        <PokerTable state={state} myId={activeId} />
      </div>

      <div className="my-2">
        <ActionLog log={state.log} />
      </div>

      <BetControls state={state} myId={activeId} isHost dispatch={dispatch} />
    </main>
  );
}
