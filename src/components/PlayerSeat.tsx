"use client";

import { motion } from "framer-motion";
import type { Player } from "@/lib/types";
import { formatRp } from "@/lib/format";
import ChipStack from "./ChipStack";

interface PlayerSeatProps {
  player: Player;
  isMe: boolean;
  isDealer: boolean;
  isToAct: boolean;
  isWinner: boolean;
  blind?: "SB" | "BB" | null;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Compact, box-free seat: just an avatar with name + stack beneath it. The turn
// indicator is a gold glow on the avatar (no bulky card around the player).
export default function PlayerSeat({
  player,
  isMe,
  isDealer,
  isToAct,
  isWinner,
  blind,
}: PlayerSeatProps) {
  const dimmed = player.folded || player.sittingOut;
  const highlight = isToAct || isWinner;

  return (
    <div className="flex w-[68px] flex-col items-center gap-0.5">
      {/* Chips committed this round */}
      {player.committed > 0 && (
        <ChipStack amount={player.committed} size={18} label={false} />
      )}

      <div className={`flex flex-col items-center ${dimmed ? "opacity-50" : ""}`}>
        {/* Avatar with turn/winner glow */}
        <motion.div
          animate={{
            boxShadow: highlight
              ? "0 0 0 3px rgba(245,197,66,0.95), 0 0 16px rgba(245,197,66,0.55)"
              : "0 0 0 2px rgba(0,0,0,0.45)",
          }}
          transition={{ duration: 0.25 }}
          className="rounded-full"
        >
          <div
            className={`relative flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold ${
              isMe || isWinner ? "bg-vegas-gold text-black" : "bg-felt text-white"
            }`}
            style={{ boxShadow: "inset 0 -3px 6px rgba(0,0,0,0.4)" }}
          >
            {initials(player.name)}
            {isDealer && (
              <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-black text-black shadow">
                D
              </span>
            )}
            {blind && (
              <span className="absolute -left-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-vegas-purple px-1 text-[9px] font-bold text-white shadow">
                {blind}
              </span>
            )}
          </div>
        </motion.div>

        {/* Name + stack — no box, just legible text on the felt */}
        <div
          className="mt-1 flex flex-col items-center leading-tight"
          style={{ textShadow: "0 1px 3px rgba(0,0,0,0.95)" }}
        >
          <span className="max-w-[68px] truncate text-[11px] font-semibold text-white">
            {player.name}
            {isMe && " (kamu)"}
          </span>
          <span className="text-[11px] font-bold text-vegas-gold tabular-nums">
            {formatRp(player.stack)}
          </span>
        </div>

        {/* Status chips */}
        {player.allIn && !player.folded && (
          <span className="mt-0.5 rounded-full bg-vegas-red px-1.5 text-[8px] font-bold uppercase tracking-wide text-white">
            All-in
          </span>
        )}
        {player.folded && !player.sittingOut && (
          <span className="mt-0.5 rounded-full bg-stone-700 px-1.5 text-[8px] font-bold uppercase tracking-wide text-stone-200">
            Fold
          </span>
        )}
        {player.sittingOut && (
          <span className="mt-0.5 rounded-full bg-stone-700 px-1.5 text-[8px] font-bold uppercase tracking-wide text-stone-200">
            Duduk
          </span>
        )}
        {!player.connected && !player.sittingOut && (
          <span className="text-[9px] text-stone-400">offline</span>
        )}
      </div>
    </div>
  );
}
