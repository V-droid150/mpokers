"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { initialState, reduce } from "@/lib/engine";
import type { Action, GameState } from "@/lib/types";
import { MAX_PLAYERS } from "@/lib/types";
import { getStoredName } from "@/lib/identity";
import { formatShort } from "@/lib/format";
import PokerTable from "@/components/PokerTable";
import BetControls from "@/components/BetControls";
import ActionLog from "@/components/ActionLog";
import Scoreboard from "@/components/Scoreboard";
import SoundToggle from "@/components/SoundToggle";

interface SeatDraft {
  id: string;
  name: string;
}

function newId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : "p" + Math.random().toString(36).slice(2);
}

// Pass-and-play mode: a setup menu first (names + stakes), then the whole game
// runs in memory on one device. The control panel always belongs to whoever
// must act, so players pass the phone around.
export default function LocalPage() {
  const router = useRouter();

  const [phase, setPhase] = useState<"setup" | "play">("setup");
  const [state, setState] = useState<GameState | null>(null);

  const dispatch = (action: Action) =>
    setState((s) => (s ? reduce(s, action) : s));

  if (phase === "setup" || !state) {
    return <SetupMenu onStart={(s) => { setState(s); setPhase("play"); }} onBack={() => router.push("/")} />;
  }

  return <PlayView state={state} dispatch={dispatch} onExit={() => router.push("/")} />;
}

// ---------- Setup menu ----------

function SetupMenu({
  onStart,
  onBack,
}: {
  onStart: (s: GameState) => void;
  onBack: () => void;
}) {
  const [seats, setSeats] = useState<SeatDraft[]>(() => {
    const stored = getStoredName();
    return [
      { id: newId(), name: stored || "Pemain 1" },
      { id: newId(), name: "Pemain 2" },
    ];
  });
  const [buyIn, setBuyIn] = useState(100000);
  const [smallBlind, setSmallBlind] = useState(0);
  const [bigBlind, setBigBlind] = useState(0);

  const named = seats.filter((s) => s.name.trim().length > 0);
  const canStart = named.length >= 2 && buyIn > 0;

  const rename = (id: string, name: string) =>
    setSeats((arr) => arr.map((s) => (s.id === id ? { ...s, name } : s)));
  const remove = (id: string) =>
    setSeats((arr) => (arr.length > 2 ? arr.filter((s) => s.id !== id) : arr));
  const add = () =>
    setSeats((arr) =>
      arr.length < MAX_PLAYERS
        ? [...arr, { id: newId(), name: `Pemain ${arr.length + 1}` }]
        : arr
    );

  const start = () => {
    if (!canStart) return;
    const sb = Math.max(0, Math.round(smallBlind));
    const bb = Math.max(sb, Math.round(bigBlind));
    let s = initialState(named[0].id, { smallBlind: sb, bigBlind: bb, buyIn });
    for (const seat of named) {
      s = reduce(s, { type: "JOIN", playerId: seat.id, name: seat.name.trim() });
    }
    onStart(s);
  };

  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-md flex-col px-5 py-6">
      <button
        onClick={onBack}
        className="mb-4 self-start text-sm text-stone-400 active:text-stone-200"
      >
        ← Kembali
      </button>

      <header className="mb-6 text-center">
        <div className="mb-1 text-4xl">🎰</div>
        <h1 className="font-display text-3xl font-black text-foil">Atur Meja</h1>
        <p className="mt-1 text-xs text-stone-400">
          Main satu perangkat — gilir HP tiap giliran.
        </p>
      </header>

      {/* Players */}
      <section className="mb-5">
        <h2 className="mb-2 text-xs uppercase tracking-widest text-stone-400">
          Pemain ({named.length})
        </h2>
        <div className="space-y-2">
          {seats.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-felt text-xs font-bold text-white">
                {i + 1}
              </span>
              <input
                value={s.name}
                onChange={(e) => rename(s.id, e.target.value)}
                maxLength={14}
                placeholder={`Pemain ${i + 1}`}
                className="flex-1 rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-base font-semibold outline-none focus:border-vegas-gold"
              />
              {seats.length > 2 && (
                <button
                  onClick={() => remove(s.id)}
                  className="shrink-0 rounded-lg bg-white/10 px-3 py-2 text-sm text-stone-300 active:scale-95"
                  aria-label="Hapus pemain"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
        {seats.length < MAX_PLAYERS && (
          <button
            onClick={add}
            className="mt-2 w-full rounded-xl border border-dashed border-white/20 py-2.5 text-sm font-semibold text-stone-300 active:scale-[0.99]"
          >
            + Tambah Pemain
          </button>
        )}
      </section>

      {/* Stakes */}
      <section className="mb-6 space-y-3">
        <h2 className="text-xs uppercase tracking-widest text-stone-400">
          Pengaturan
        </h2>
        <Field
          label="Chip awal per pemain"
          value={buyIn}
          onChange={setBuyIn}
          hint={formatShort(buyIn)}
        />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Blind kecil" value={smallBlind} onChange={setSmallBlind} />
          <Field label="Blind besar" value={bigBlind} onChange={setBigBlind} />
        </div>
        <p className="text-[11px] text-stone-500">
          Blind 0/0 = taruhan awal mulai dari 0, pemain menaruh chip sendiri tiap ronde.
        </p>
      </section>

      <button
        onClick={start}
        disabled={!canStart}
        className="mt-auto w-full rounded-2xl bg-gradient-to-b from-vegas-gold to-vegas-goldsoft py-4 text-lg font-bold text-black shadow-gold transition active:scale-[0.98] disabled:opacity-40"
      >
        Mulai Permainan
      </button>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 flex items-center justify-between text-[11px] uppercase tracking-widest text-stone-400">
        {label}
        {hint && <span className="text-vegas-gold">{hint}</span>}
      </span>
      <input
        type="number"
        inputMode="numeric"
        min={0}
        value={value}
        onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
        className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-base font-semibold tabular-nums outline-none focus:border-vegas-gold"
      />
    </label>
  );
}

// ---------- Play view ----------

function PlayView({
  state,
  dispatch,
  onExit,
}: {
  state: GameState;
  dispatch: (action: Action) => void;
  onExit: () => void;
}) {
  const [newName, setNewName] = useState("");
  const [showScore, setShowScore] = useState(false);

  const activeId = useMemo(() => {
    if (state.status === "playing" && state.toActSeat !== null) {
      const p = state.players.find((x) => x.seat === state.toActSeat);
      if (p) return p.id;
    }
    return state.players[0]?.id ?? "";
  }, [state]);

  const addPlayer = () => {
    const name = newName.trim() || `Pemain ${state.players.length + 1}`;
    dispatch({ type: "JOIN", playerId: newId(), name });
    setNewName("");
  };

  const canAddPlayers =
    (state.status === "lobby" || state.status === "handover") &&
    state.players.length < MAX_PLAYERS;

  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-md flex-col px-3 pb-4 pt-3">
      <div className="mb-2 flex items-center justify-between">
        <button onClick={onExit} className="text-sm text-stone-400 active:text-stone-200">
          ← Keluar
        </button>
        <span className="rounded-full border border-vegas-gold/40 bg-black/40 px-4 py-1.5 font-display text-sm font-bold tracking-[0.2em] text-vegas-gold">
          MAIN LOKAL
        </span>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-stone-500">{state.players.length}/8</span>
          <button
            onClick={() => setShowScore(true)}
            aria-label="Skor untung-rugi"
            className="rounded-full border border-white/10 bg-black/40 px-2.5 py-1.5 text-sm active:scale-95"
          >
            📊
          </button>
          <SoundToggle />
        </div>
      </div>

      {showScore && (
        <Scoreboard players={state.players} onClose={() => setShowScore(false)} />
      )}

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
