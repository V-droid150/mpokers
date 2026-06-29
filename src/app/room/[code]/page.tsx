"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useRoom } from "@/lib/useRoom";
import { getPlayerId, getStoredName, setStoredName } from "@/lib/identity";
import PokerTable from "@/components/PokerTable";
import BetControls from "@/components/BetControls";
import ActionLog from "@/components/ActionLog";

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

  useEffect(() => {
    setMyId(getPlayerId());
    setName(getStoredName());
  }, []);

  const { state, status, error, dispatch } = useRoom(code, {
    create: isHostCreator,
    hostId: myId,
  });

  // Join the table once the room is loaded and we have a name.
  const joinedRef = useRef(false);
  useEffect(() => {
    if (!state || !myId || !name || joinedRef.current) return;
    const already = state.players.some((p) => p.id === myId);
    if (!already) {
      joinedRef.current = true;
      void dispatch({ type: "JOIN", playerId: myId, name });
    } else {
      joinedRef.current = true;
      void dispatch({ type: "SET_CONNECTED", playerId: myId, connected: true });
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

  const effectiveHostId = useMemo(() => {
    if (!state) return "";
    const hostPresent = state.players.some((p) => p.id === state.hostId);
    if (hostPresent) return state.hostId;
    // Fallback host: lowest-seat connected player.
    const fallback = [...state.players]
      .filter((p) => p.connected)
      .sort((a, b) => a.seat - b.seat)[0];
    return fallback?.id ?? state.hostId;
  }, [state]);

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
        <h1 className="font-display text-3xl font-bold text-foil">Masuk meja {code}</h1>
        <input
          value={nameInput}
          onChange={(e) => setNameInput(e.target.value)}
          maxLength={14}
          placeholder="Nama kamu"
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
          Lanjut
        </button>
      </main>
    );
  }

  // ----- Status screens -----
  if (status === "unconfigured") {
    return (
      <CenterCard>
        <p className="text-amber-300">⚠️ Supabase belum dikonfigurasi.</p>
        <p className="mt-2 text-sm text-stone-300">
          Isi <code>.env.local</code> dengan URL &amp; anon key Supabase, lalu jalankan
          ulang.
        </p>
      </CenterCard>
    );
  }
  if (status === "loading" || !state) {
    return (
      <CenterCard>
        <div className="animate-pulse text-vegas-gold">Memuat meja {code}…</div>
      </CenterCard>
    );
  }
  if (status === "missing") {
    return (
      <CenterCard>
        <p className="text-lg font-semibold">Meja {code} tidak ditemukan.</p>
        <button
          onClick={() => router.push("/")}
          className="mt-4 rounded-xl bg-vegas-gold px-5 py-2.5 font-bold text-black"
        >
          Kembali
        </button>
      </CenterCard>
    );
  }
  if (status === "error") {
    return (
      <CenterCard>
        <p className="text-red-300">Terjadi kesalahan koneksi.</p>
        <p className="mt-2 text-xs text-stone-400">{error}</p>
      </CenterCard>
    );
  }

  const isHost = myId === effectiveHostId;

  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-md flex-col px-3 pb-4 pt-3">
      {/* Header */}
      <div className="mb-2 flex items-center justify-between">
        <button onClick={leave} className="text-sm text-stone-400 active:text-stone-200">
          ← Keluar
        </button>
        <button
          onClick={copyCode}
          className="flex items-center gap-2 rounded-full border border-vegas-gold/40 bg-black/40 px-4 py-1.5"
        >
          <span className="text-[10px] uppercase tracking-widest text-stone-400">Kode</span>
          <span className="font-display text-lg font-bold tracking-[0.3em] text-vegas-gold">
            {code}
          </span>
          <span className="text-[10px] text-stone-400">{copied ? "tersalin!" : "salin"}</span>
        </button>
        <span className="w-12 text-right text-xs text-stone-500">
          {state.players.length}/8
        </span>
      </div>

      {/* Table */}
      <div className="flex-1">
        <PokerTable state={state} myId={myId} />
      </div>

      {/* Log */}
      <div className="my-2">
        <ActionLog log={state.log} />
      </div>

      {/* Controls */}
      <BetControls state={state} myId={myId} isHost={isHost} dispatch={dispatch} />
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
