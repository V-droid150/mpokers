"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useRoom } from "@/lib/useRoom";
import { getPlayerId, getStoredName, setStoredName } from "@/lib/identity";
import PokerTable from "@/components/PokerTable";
import BetControls from "@/components/BetControls";
import ActionLog from "@/components/ActionLog";
import Scoreboard from "@/components/Scoreboard";
import SoundToggle from "@/components/SoundToggle";
import MenuBackground from "@/components/MenuBackground";

export default function RoomPage() {
  const router = useRouter();
  const params = useParams<{ code: string }>();
  const searchParams = useSearchParams();
  const code = (params.code || "").toUpperCase();
  const isHostCreator = searchParams.get("host") === "1";

  const [myId, setMyId] = useState("");
  const [name, setName] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [copied, setCopied] = useState(false);
  const [showScore, setShowScore] = useState(false);

  useEffect(() => {
    setMyId(getPlayerId());
    setName(getStoredName());
  }, []);

  const { state, status, error, dispatch } = useRoom(code, {
    create: isHostCreator,
    hostId: myId,
    hostName: name,
  });

  // Join the table once the room is loaded and we have a name — UNLESS we're the
  // dealer, who runs the table without taking a seat or holding chips.
  const joinedRef = useRef(false);
  useEffect(() => {
    if (!state || !myId || !name || joinedRef.current) return;
    if (state.hostId === myId) return; // dealer: never joins as a player
    const already = state.players.some((p) => p.id === myId);
    if (!already) {
      joinedRef.current = true;
      void dispatch({ type: "JOIN", playerId: myId, name });
    } else {
      joinedRef.current = true;
      void dispatch({ type: "SET_CONNECTED", playerId: myId, connected: true });
    }
  }, [state, myId, name, dispatch]);

  // Keep the dealer's display name recorded in the shared state so other
  // devices can see who the banker is (the dealer isn't in `players`).
  useEffect(() => {
    if (!state || !myId || !name) return;
    if (state.hostId === myId && state.hostName !== name) {
      void dispatch({ type: "SET_HOST_NAME", hostId: myId, name });
    }
  }, [state, myId, name, dispatch]);

  // Mark disconnected when leaving the tab.
  useEffect(() => {
    if (!myId) return;
    const onLeave = () => {
      void dispatch({ type: "SET_CONNECTED", playerId: myId, connected: false });
    };
    window.addEventListener("pagehide", onLeave);
    return () => window.removeEventListener("pagehide", onLeave);
  }, [myId, dispatch]);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard may be blocked; ignore */
    }
  };

  const leave = () => {
    if (myId) void dispatch({ type: "LEAVE", playerId: myId });
    router.push("/");
  };

  // ----- Name gate -----
  if (myId && !name) {
    return (
      <main className="mx-auto flex min-h-[100dvh] max-w-md flex-col items-center justify-center gap-6 px-6">
        <MenuBackground />
        <h1 className="font-display text-3xl font-bold text-foil">Join table {code}</h1>
        <input
          value={nameInput}
          onChange={(e) => setNameInput(e.target.value)}
          maxLength={14}
          placeholder="Your name"
          className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-lg font-semibold outline-none focus:border-vegas-gold"
        />
        <button
          onClick={() => {
            if (nameInput.trim().length < 2) return;
            setStoredName(nameInput);
            setName(nameInput.trim());
          }}
          disabled={nameInput.trim().length < 2}
          className="w-full rounded-2xl bg-gradient-to-b from-vegas-gold to-vegas-goldsoft py-4 text-lg font-bold text-black shadow-gold disabled:opacity-40"
        >
          Continue
        </button>
      </main>
    );
  }

  // ----- Status screens -----
  if (status === "unconfigured") {
    return (
      <CenterCard>
        <p className="text-amber-300">⚠️ Supabase isn&apos;t configured.</p>
        <p className="mt-2 text-sm text-stone-300">
          Fill in <code>.env.local</code> with your Supabase URL &amp; anon key, then
          restart.
        </p>
      </CenterCard>
    );
  }
  if (status === "loading" || !state) {
    return (
      <CenterCard>
        <div className="animate-pulse text-vegas-gold">Loading table {code}…</div>
      </CenterCard>
    );
  }
  if (status === "missing") {
    return (
      <CenterCard>
        <p className="text-lg font-semibold">Table {code} not found.</p>
        <button
          onClick={() => router.push("/")}
          className="mt-4 rounded-xl bg-vegas-gold px-5 py-2.5 font-bold text-black"
        >
          Back
        </button>
      </CenterCard>
    );
  }
  if (status === "error") {
    return (
      <CenterCard>
        <p className="text-red-300">Connection error.</p>
        <p className="mt-2 text-xs text-stone-400">{error}</p>
      </CenterCard>
    );
  }

  // The dealer/banker (room creator) runs the table but does not play or hold
  // chips: they start hands, tweak settings, and award the pot to the winner.
  const isHost = myId === state.hostId;
  const hostName = state.hostName || null;

  return (
    <main className="mx-auto flex h-[100dvh] max-w-md flex-col overflow-hidden px-3 pb-2 pt-2">
      {/* Header */}
      <div className="mb-1.5 flex shrink-0 items-center justify-between">
        <button onClick={leave} className="text-sm text-stone-400 active:text-stone-200">
          ← Leave
        </button>
        <button
          onClick={copyCode}
          className="flex items-center gap-2 rounded-full border border-vegas-gold/40 bg-black/40 px-4 py-1.5"
        >
          <span className="text-[10px] uppercase tracking-widest text-stone-400">Code</span>
          <span className="font-display text-lg font-bold tracking-[0.3em] text-vegas-gold">
            {code}
          </span>
          <span className="text-[10px] text-stone-400">{copied ? "copied!" : "copy"}</span>
        </button>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-stone-500">{state.players.length}/8</span>
          <button
            onClick={() => setShowScore(true)}
            aria-label="Scoreboard"
            className="rounded-full border border-white/10 bg-black/40 px-2.5 py-1.5 text-sm active:scale-95"
          >
            📊
          </button>
          <SoundToggle />
        </div>
      </div>

      {/* Dealer indicator */}
      <div className="mb-0.5 shrink-0 text-center text-[11px] text-stone-400">
        {isHost ? (
          <span className="text-vegas-gold">
            👑 You are the dealer — you run the table &amp; don&apos;t play.
          </span>
        ) : (
          <span>👑 Dealer: {hostName ?? "—"} · pays out the winning pot.</span>
        )}
      </div>

      {showScore && (
        <Scoreboard
          players={state.players}
          dealerName={state.hostName}
          feeCollected={state.feeCollected}
          onClose={() => setShowScore(false)}
        />
      )}

      {/* Table — flexes to fill the space between header and controls */}
      <div className="min-h-0 flex-1 pb-1 pt-3">
        <PokerTable state={state} myId={myId} />
      </div>

      {/* Log — one minimal line */}
      <div className="shrink-0">
        <ActionLog log={state.log} />
      </div>

      {/* Controls — fixed reserved height so the table never resizes mid-hand */}
      <div className="flex min-h-[16rem] shrink-0 flex-col justify-end pt-1">
        <BetControls state={state} myId={myId} isHost={isHost} dispatch={dispatch} />
      </div>
    </main>
  );
}

function CenterCard({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-md flex-col items-center justify-center px-6 text-center">
      <div className="rounded-2xl bg-black/40 px-6 py-8">{children}</div>
    </main>
  );
}
