"use client";

import { motion } from "framer-motion";
import type { Player } from "@/lib/types";
import { formatRp } from "@/lib/format";
import ChipStack from "./ChipStack";

interface PlayerSeatProps {
  player: Player;
  isMe: boolean;
  isHost?: boolean;
  isDealer: boolean;
  isToAct: boolean;
  isWinner: boolean;
  blind?: "SB" | "BB" | null;
  // When the seat is in the top half of the table, the name goes above the
  // avatar (outer edge) and committed chips below (toward the pot) — and the
  // reverse for bottom seats. Keeps text off the centre labels.
  topHalf: boolean;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function PlayerSeat({
  player,
  isMe,
  isHost,
  isDealer,
  isToAct,
  isWinner,
  blind,
  topHalf,
}: PlayerSeatProps) {
  const dimmed = player.folded || player.sittingOut;
  const highlight = isToAct || isWinner;

  const chips =
    player.committed > 0 ? (
      <ChipStack amount={player.committed} size={18} label={false} />
    ) : null;

  const avatar = (
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
        className={`relative flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold ${
          isMe || isWinner ? "bg-vegas-gold text-black" : "bg-felt text-white"
        }`}
        style={{ boxShadow: "inset 0 -2px 5px rgba(0,0,0,0.4)" }}
      >
        {initials(player.name)}
        {isHost && (
          <span
            className="absolute -left-1.5 -top-2 text-[11px] leading-none drop-shadow"
            aria-label="Host"
            title="Host"
          >
            👑
          </span>
        )}
        {isDealer && (
          <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[8px] font-black text-black shadow">
            D
          </span>
        )}
        {blind && (
          <span className="absolute -left-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-vegas-purple px-1 text-[8px] font-bold text-white shadow">
            {blind}
          </span>
        )}
      </div>
    </motion.div>
  );

  const nameBlock = (
    <div
      className="flex flex-col items-center leading-tight"
      style={{ textShadow: "0 1px 3px rgba(0,0,0,0.95)" }}
    >
      <span className="max-w-[72px] truncate text-[11px] font-semibold text-white">
        {player.name}
        {isMe && " (you)"}
      </span>
      <span className="text-[11px] font-bold text-vegas-gold tabular-nums">
        {formatRp(player.stack)}
      </span>
      {player.allIn && !player.folded && (
        <span className="rounded-full bg-vegas-red px-1.5 text-[8px] font-bold uppercase tracking-wide text-white">
          All-in
        </span>
      )}
      {player.folded && !player.sittingOut && (
        <span className="rounded-full bg-stone-700 px-1.5 text-[8px] font-bold uppercase tracking-wide text-stone-200">
          Fold
        </span>
      )}
      {player.sittingOut && (
        <span className="rounded-full bg-stone-700 px-1.5 text-[8px] font-bold uppercase tracking-wide text-stone-200">
          Out
        </span>
      )}
      {!player.connected && !player.sittingOut && (
        <span className="text-[9px] text-stone-400">offline</span>
      )}
    </div>
  );

  return (
    <div
      className={`flex w-[76px] flex-col items-center gap-0.5 ${dimmed ? "opacity-50" : ""}`}
    >
      {topHalf ? (
        <>
          {nameBlock}
          {avatar}
          {chips}
        </>
      ) : (
        <>
          {chips}
          {avatar}
          {nameBlock}
        </>
      )}
    </div>
  );
}
