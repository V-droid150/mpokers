"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getStoredName, setStoredName } from "@/lib/identity";
import { isSupabaseConfigured } from "@/lib/supabase";
import { ensureAnonAuth, getAccessToken } from "@/lib/auth";
import BrandMark from "@/components/BrandMark";
import MenuBackground from "@/components/MenuBackground";

export default function HomePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [mode, setMode] = useState<"menu" | "join">("menu");
  const [busy, setBusy] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    setName(getStoredName());
  }, []);

  const ready = name.trim().length >= 2;

  const create = async () => {
    if (!ready || busy) return;
    setStoredName(name);
    setBusy(true);
    setCreateError(null);
    try {
      const uid = await ensureAnonAuth();
      const token = await getAccessToken();
      if (!uid || !token) {
        setCreateError("Couldn't sign in — check Supabase configuration.");
        setBusy(false);
        return;
      }
      const res = await fetch("/api/room", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ hostName: name.trim() }),
      });
      if (!res.ok) {
        setCreateError("Couldn't create the table — please try again.");
        setBusy(false);
        return;
      }
      const { code } = (await res.json()) as { code: string };
      router.push(`/room/${code}`);
    } catch {
      setCreateError("Network error — please try again.");
      setBusy(false);
    }
  };

  const join = () => {
    if (!ready || joinCode.trim().length < 4) return;
    setStoredName(name);
    router.push(`/room/${joinCode.trim().toUpperCase()}`);
  };

  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-md flex-col items-center justify-center gap-8 px-6 py-10">
      <MenuBackground />
      <header className="text-center">
        <BrandMark />
        <p
          className="mt-3 text-sm text-stone-200"
          style={{ textShadow: "0 1px 4px rgba(0,0,0,0.85)" }}
        >
          Cardless poker — manage chips &amp; bets. Vegas style, up to 8 players.
        </p>
      </header>

      {!isSupabaseConfigured && (
        <div className="w-full rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-xs text-amber-200">
          ⚠️ Supabase isn&apos;t configured. Copy <code>.env.local.example</code> to{" "}
          <code>.env.local</code> and fill in the URL + anon key to enable online mode.
        </div>
      )}

      <div className="w-full space-y-4">
        <label className="block">
          <span className="mb-1 block text-xs uppercase tracking-widest text-stone-400">
            Your name
          </span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={14}
            placeholder="e.g. Alex"
            className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-lg font-semibold outline-none focus:border-vegas-gold"
          />
        </label>

        {mode === "menu" ? (
          <div className="space-y-3">
            <button
              onClick={create}
              disabled={!ready || busy}
              className="w-full rounded-2xl bg-gradient-to-b from-vegas-gold to-vegas-goldsoft py-4 text-lg font-bold text-black shadow-gold transition active:scale-[0.98] disabled:opacity-40"
            >
              {busy ? "Creating…" : "Create New Table"}
            </button>
            {createError && (
              <p className="text-center text-xs text-red-300">{createError}</p>
            )}
            <button
              onClick={() => setMode("join")}
              disabled={!ready}
              className="w-full rounded-2xl border border-vegas-gold/50 bg-black/40 py-4 text-lg font-bold text-vegas-gold transition active:scale-[0.98] disabled:opacity-40"
            >
              Join Table
            </button>
            <button
              onClick={() => router.push("/local")}
              className="w-full py-2 text-sm text-stone-400 underline-offset-4 hover:underline"
            >
              or try Local Play (1 device, offline)
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              maxLength={6}
              placeholder="TABLE CODE"
              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-center text-2xl font-black tracking-[0.4em] outline-none focus:border-vegas-gold"
            />
            <button
              onClick={join}
              disabled={!ready || joinCode.trim().length < 4}
              className="w-full rounded-2xl bg-gradient-to-b from-vegas-gold to-vegas-goldsoft py-4 text-lg font-bold text-black shadow-gold transition active:scale-[0.98] disabled:opacity-40"
            >
              Enter
            </button>
            <button
              onClick={() => setMode("menu")}
              className="w-full py-2 text-sm text-stone-400"
            >
              ← Back
            </button>
          </div>
        )}
      </div>

      <footer
        className="text-center text-[11px] text-stone-300"
        style={{ textShadow: "0 1px 4px rgba(0,0,0,0.85)" }}
      >
        Chips represent Rupiah amounts · for tracking only, not real-money transactions.
      </footer>
    </main>
  );
}
