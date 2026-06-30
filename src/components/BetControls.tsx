"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { Action, GameState } from "@/lib/types";
import { legalActions } from "@/lib/engine";
import { CHIP_DEFS } from "@/lib/chips";
import { formatRp, formatShort } from "@/lib/format";
import { chipFeedback } from "@/lib/sound";
import Chip from "./Chip";
import ChipStack from "./ChipStack";

interface BetControlsProps {
  state: GameState;
  myId: string;
  isHost: boolean;
  dispatch: (action: Action) => void | Promise<void>;
}

export default function BetControls({ state, myId, isHost, dispatch }: BetControlsProps) {
  const me = state.players.find((p) => p.id === myId);
  const la = legalActions(state, myId);

  // Raise builder target (total committed this round).
  const [pending, setPending] = useState(la.minRaiseTo);
  const [building, setBuilding] = useState(false);

  // Reset the builder whenever it becomes a new decision point.
  useEffect(() => {
    setPending(la.minRaiseTo);
    setBuilding(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.toActSeat, state.currentBet, state.handId, state.round, state.status]);

  // Winner selection at showdown (host only).
  const livePlayers = useMemo(
    () => state.players.filter((p) => !p.folded),
    [state.players]
  );
  const [winners, setWinners] = useState<number[]>([]);
  useEffect(() => {
    setWinners(livePlayers.length === 1 ? [livePlayers[0].seat] : []);
  }, [state.status, state.handId, livePlayers]);

  if (!me) {
    return (
      <div className="rounded-2xl bg-black/50 p-4 text-center text-sm text-stone-300">
        You&apos;re spectating this table.
      </div>
    );
  }

  const addChip = (value: number) => {
    setBuilding(true);
    setPending((prev) => {
      const next = Math.min(la.maxRaiseTo, prev + value);
      if (next !== prev) chipFeedback();
      return next;
    });
  };

  const trayAmount = Math.max(0, pending - me.committed);
  const isAllInRaise = pending >= la.maxRaiseTo;
  const isOpenBet = state.currentBet === 0; // no bet yet -> "Bet" rather than "Raise"
  const dealtCount = state.players.filter((p) => !p.sittingOut && p.stack > 0).length;

  // ---------- LOBBY / HANDOVER: host controls ----------
  if (state.status === "lobby" || state.status === "handover") {
    return (
      <div className="flex flex-col gap-3">
        <PlayerBar me={me} dispatch={dispatch} state={state} />
        {isHost ? (
          <>
            <HostSettings state={state} dispatch={dispatch} />
            <button
              onClick={() => dispatch({ type: "START_HAND" })}
              disabled={dealtCount < 2}
              className="w-full rounded-2xl bg-gradient-to-b from-vegas-gold to-vegas-goldsoft py-4 text-lg font-bold text-black shadow-gold transition active:scale-[0.98] disabled:opacity-40"
            >
              {state.status === "handover" ? "Deal Next Hand" : "Start Hand"}
              {dealtCount < 2 && " (need 2 players)"}
            </button>
          </>
        ) : (
          <div className="rounded-2xl bg-black/50 py-3 text-center text-sm text-stone-300">
            Blinds {formatRp(state.smallBlind)}/{formatRp(state.bigBlind)} · starting chips{" "}
            {formatRp(state.buyIn)}
            <div className="mt-1 text-stone-400">Waiting for the host to start the hand…</div>
          </div>
        )}
      </div>
    );
  }

  // ---------- SHOWDOWN: pick winner(s) ----------
  if (state.status === "showdown") {
    return (
      <div className="flex flex-col gap-3">
        <div className="text-center text-sm font-semibold text-vegas-gold">
          Pot {formatRp(state.pot)} — who won?
        </div>
        {isHost ? (
          <>
            <div className="flex flex-wrap justify-center gap-2">
              {livePlayers.map((p) => {
                const on = winners.includes(p.seat);
                return (
                  <button
                    key={p.id}
                    onClick={() =>
                      setWinners((w) =>
                        on ? w.filter((s) => s !== p.seat) : [...w, p.seat]
                      )
                    }
                    className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
                      on
                        ? "bg-vegas-gold text-black shadow-gold"
                        : "bg-black/50 text-stone-200"
                    }`}
                  >
                    {p.name}
                  </button>
                );
              })}
            </div>
            {winners.length > 1 && (
              <p className="text-center text-xs text-stone-400">
                Pot split evenly between {winners.length} players.
              </p>
            )}
            <button
              onClick={() => dispatch({ type: "AWARD", winnerSeats: winners })}
              disabled={winners.length === 0}
              className="w-full rounded-2xl bg-gradient-to-b from-vegas-gold to-vegas-goldsoft py-4 text-lg font-bold text-black shadow-gold transition active:scale-[0.98] disabled:opacity-40"
            >
              Award Pot
            </button>
          </>
        ) : (
          <div className="rounded-2xl bg-black/50 py-4 text-center text-sm text-stone-300">
            Waiting for the host to pick the winner…
          </div>
        )}
      </div>
    );
  }

  // ---------- PLAYING but not my turn ----------
  if (!la.isYourTurn) {
    const toAct = state.players.find((p) => p.seat === state.toActSeat);
    return (
      <div className="flex flex-col gap-3">
        <PlayerBar me={me} dispatch={dispatch} state={state} />
        <div className="rounded-2xl bg-black/50 py-4 text-center text-sm text-stone-300">
          {me.folded
            ? "You folded. Waiting for the hand to finish…"
            : me.allIn
            ? "You're all-in. Waiting for the result…"
            : `${toAct?.name ?? "Another player"}'s turn…`}
        </div>
      </div>
    );
  }

  // ---------- MY TURN ----------
  const callLabel = la.canCheck ? "Check" : `Call ${formatRp(la.callAmount)}`;

  return (
    <div className="flex flex-col gap-2">
      {/* Bet builder */}
      {la.canRaise && (
        <div className="rounded-2xl bg-black/45 p-2.5">
          <div className="mb-1.5 flex items-end justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-widest text-stone-400">
                {isAllInRaise ? "All-in" : isOpenBet ? "Bet" : "Raise to"}
              </div>
              <div className="text-2xl font-bold text-vegas-gold tabular-nums leading-none">
                {formatRp(pending)}
              </div>
            </div>
            <div className="flex h-11 items-end">
              <ChipStack amount={trayAmount} size={26} label={false} />
            </div>
          </div>

          {/* Tap chips to build the bet, one by one */}
          <div className="mb-2 flex flex-wrap justify-center gap-1.5">
            {CHIP_DEFS.filter((d) => d.value <= la.maxRaiseTo).map((d) => (
              <motion.button
                key={d.value}
                whileTap={{ scale: 0.86 }}
                onClick={() => addChip(d.value)}
                disabled={pending >= la.maxRaiseTo}
                className="disabled:opacity-30"
                aria-label={`Add ${formatShort(d.value)}`}
              >
                <Chip def={d} size={38} />
              </motion.button>
            ))}
          </div>

          {/* Slider for precise control */}
          <input
            type="range"
            min={la.minRaiseTo}
            max={la.maxRaiseTo}
            step={state.bigBlind > 0 ? state.bigBlind : 1000}
            value={pending}
            onChange={(e) => {
              setBuilding(true);
              setPending(Number(e.target.value));
            }}
            className="w-full accent-vegas-gold"
          />

          <div className="mt-2 flex justify-between gap-2 text-xs">
            <button
              onClick={() => setPending(la.minRaiseTo)}
              className="rounded-lg bg-white/10 px-3 py-1.5 font-semibold text-stone-200"
            >
              Min
            </button>
            <button
              onClick={() =>
                setPending(
                  Math.min(la.maxRaiseTo, Math.max(la.minRaiseTo, state.pot + la.callAmount))
                )
              }
              className="rounded-lg bg-white/10 px-3 py-1.5 font-semibold text-stone-200"
            >
              Pot
            </button>
            <button
              onClick={() => setPending(la.maxRaiseTo)}
              className="rounded-lg bg-white/10 px-3 py-1.5 font-semibold text-stone-200"
            >
              All-in
            </button>
          </div>
        </div>
      )}

      {/* Primary action row */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => dispatch({ type: "FOLD", playerId: myId })}
          className="rounded-2xl bg-gradient-to-b from-stone-700 to-stone-800 py-3.5 font-bold text-stone-100 shadow transition active:scale-[0.97]"
        >
          Fold
        </button>
        <button
          onClick={() =>
            dispatch({ type: la.canCheck ? "CHECK" : "CALL", playerId: myId })
          }
          className="rounded-2xl bg-gradient-to-b from-emerald-500 to-emerald-700 py-3.5 font-bold text-white shadow transition active:scale-[0.97]"
        >
          {callLabel}
        </button>
        <button
          onClick={() =>
            dispatch(
              isAllInRaise
                ? { type: "ALL_IN", playerId: myId }
                : { type: "RAISE", playerId: myId, total: pending }
            )
          }
          disabled={!la.canRaise}
          className="rounded-2xl bg-gradient-to-b from-vegas-gold to-vegas-goldsoft py-3.5 font-bold text-black shadow-gold transition active:scale-[0.97] disabled:opacity-40"
        >
          {isAllInRaise
            ? "All-in"
            : `${isOpenBet ? "Bet" : "Raise"} ${formatShort(pending)}`}
        </button>
      </div>
    </div>
  );
}

// Small bar shown between hands: stack + quick top-up.
function PlayerBar({
  me,
  state,
  dispatch,
}: {
  me: GameState["players"][number];
  state: GameState;
  dispatch: (action: Action) => void | Promise<void>;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-black/45 px-4 py-2.5">
      <div>
        <div className="text-[11px] uppercase tracking-widest text-stone-400">Your chips</div>
        <div className="text-xl font-bold text-vegas-gold tabular-nums leading-none">
          {formatRp(me.stack)}
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => dispatch({ type: "REBUY", playerId: me.id, amount: state.buyIn })}
          className="rounded-xl bg-white/10 px-3 py-2 text-sm font-semibold text-stone-100 active:scale-95"
        >
          + Top up {formatShort(state.buyIn)}
        </button>
        <button
          onClick={() =>
            dispatch({ type: "SIT_OUT", playerId: me.id, sittingOut: !me.sittingOut })
          }
          className="rounded-xl bg-white/10 px-3 py-2 text-sm font-semibold text-stone-100 active:scale-95"
        >
          {me.sittingOut ? "Sit In" : "Sit Out"}
        </button>
      </div>
    </div>
  );
}

// Host/dealer table settings: blinds, starting chips, and "level everyone".
function HostSettings({
  state,
  dispatch,
}: {
  state: GameState;
  dispatch: (action: Action) => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [sb, setSb] = useState(state.smallBlind);
  const [bb, setBb] = useState(state.bigBlind);
  const [buyIn, setBuyIn] = useState(state.buyIn);

  // Keep the form in sync if another device changes the config.
  useEffect(() => {
    setSb(state.smallBlind);
    setBb(state.bigBlind);
    setBuyIn(state.buyIn);
  }, [state.smallBlind, state.bigBlind, state.buyIn]);

  const dirty =
    sb !== state.smallBlind || bb !== state.bigBlind || buyIn !== state.buyIn;

  const save = () =>
    dispatch({
      type: "CONFIG",
      smallBlind: Math.max(0, sb),
      bigBlind: Math.max(0, bb),
      buyIn: Math.max(0, buyIn),
    });

  return (
    <div className="rounded-2xl bg-black/45">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-2.5 text-sm font-semibold text-stone-200"
      >
        <span>⚙️ Table Settings</span>
        <span className="text-xs text-stone-400">
          {formatRp(state.smallBlind)}/{formatRp(state.bigBlind)} · {formatShort(state.buyIn)}{" "}
          {open ? "▲" : "▼"}
        </span>
      </button>

      {open && (
        <div className="space-y-3 px-4 pb-4 pt-1">
          <div className="grid grid-cols-3 gap-2">
            <NumField label="Small blind" value={sb} onChange={setSb} />
            <NumField label="Big blind" value={bb} onChange={setBb} />
            <NumField label="Starting chips" value={buyIn} onChange={setBuyIn} />
          </div>

          <div className="flex gap-2">
            <button
              onClick={save}
              disabled={!dirty}
              className="flex-1 rounded-xl bg-gradient-to-b from-vegas-gold to-vegas-goldsoft py-2.5 text-sm font-bold text-black shadow-gold transition active:scale-[0.98] disabled:opacity-40"
            >
              Save
            </button>
            <button
              onClick={() => dispatch({ type: "RESET_STACKS" })}
              className="flex-1 rounded-xl bg-white/10 py-2.5 text-sm font-semibold text-stone-100 active:scale-95"
            >
              Reset chips to {formatShort(state.buyIn)}
            </button>
          </div>
          <p className="text-[11px] text-stone-500">
            Blinds 0/0 = no forced bets. &quot;Reset chips&quot; sets every player back to the
            starting stack (to begin a new session).
          </p>
        </div>
      )}
    </div>
  );
}

function NumField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] uppercase tracking-widest text-stone-400">
        {label}
      </span>
      <input
        type="number"
        inputMode="numeric"
        min={0}
        value={value}
        onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
        className="w-full rounded-lg border border-white/10 bg-black/40 px-2 py-2 text-sm font-semibold tabular-nums outline-none focus:border-vegas-gold"
      />
    </label>
  );
}
