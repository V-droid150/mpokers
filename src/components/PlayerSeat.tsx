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

export default function PlayerSeat({
  player,
  isMe,
  isDealer,
  isToAct,
  isWinner,
  blind,
}: PlayerSeatProps) {
  const dimmed = player.folded || player.sittingOut;

  return (
    <div className="flex flex-col items-center gap-1">
      {/* Chips this player has committed to the current round. */}
      {player.committed > 0 && (
        <ChipStack amount={player.committed} size={22} label={false} />
      )}

      <motion.div
        animate={
          isToAct
            ? { boxShadow: "0 0 0 3px rgba(245,197,66,0.9), 0 0 22px rgba(245,197,66,0.6)" }
            : { boxShadow: "0 0 0 1px rgba(255,255,255,0.08)" }
        }
        transition={{ duration: 0.25 }}
        className={`relative flex w-[78px] flex-col items-center rounded-2xl px-2 py-1.5 backdrop-blur-sm ${
          isWinner
            ? "bg-vegas-gold/25 ring-1 ring-vegas-gold"
            : "bg-black/55"
        } ${dimmed ? "opacity-50" : ""}`}
      >
        {/* Avatar */}
        <div
          className={`relative flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold ${
            isMe ? "bg-vegas-gold text-black" : "bg-felt text-white"
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

        <span className="mt-0.5 max-w-full truncate text-[11px] font-semibold leading-tight">
          {player.name}
          {isMe && " (kamu)"}
        </span>
        <span className="text-[11px] font-bold text-vegas-gold tabular-nums">
          {formatRp(player.stack)}
        </span>

        {!player.connected && (
          <span className="text-[9px] text-stone-400">offline</span>
        )}

        {/* Status overlay */}
        {player.allIn && !player.folded && (
          <span className="absolute -bottom-2 rounded-full bg-vegas-red px-2 text-[9px] font-bold uppercase tracking-wide text-white shadow">
            All-in
          </span>
        )}
        {player.folded && !player.sittingOut && (
          <span className="absolute -bottom-2 rounded-full bg-stone-700 px-2 text-[9px] font-bold uppercase tracking-wide text-stone-200 shadow">
            Fold
          </span>
        )}
        {player.sittingOut && (
          <span className="absolute -bottom-2 rounded-full bg-stone-700 px-2 text-[9px] font-bold uppercase tracking-wide text-stone-200 shadow">
            Duduk
          </span>
        )}
      </motion.div>
    </div>
  );
}
