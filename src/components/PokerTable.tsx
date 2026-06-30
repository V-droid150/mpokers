"use client";

import { motion } from "framer-motion";
import type { GameState } from "@/lib/types";
import { formatRp } from "@/lib/format";
import PlayerSeat from "./PlayerSeat";
import ChipStack from "./ChipStack";

interface PokerTableProps {
  state: GameState;
  myId: string;
  hostId?: string; // online: highlights the host seat with a crown
}

const ROUND_LABEL: Record<GameState["round"], string> = {
  preflop: "Pre-flop",
  flop: "Flop",
  turn: "Turn",
  river: "River",
};

// Position `count` seats around an ellipse, starting at bottom-centre and going
// clockwise. Returns percentage coordinates for absolute placement.
function seatPositions(count: number): { x: number; y: number }[] {
  const RX = 45;
  const RY = 37;
  const positions: { x: number; y: number }[] = [];
  for (let i = 0; i < count; i++) {
    const deg = 90 - (360 / count) * i;
    const rad = (deg * Math.PI) / 180;
    positions.push({
      x: 50 + RX * Math.cos(rad),
      y: 50 + RY * Math.sin(rad),
    });
  }
  return positions;
}

export default function PokerTable({ state, myId, hostId }: PokerTableProps) {
  const sorted = [...state.players].sort((a, b) => a.seat - b.seat);
  const meIdx = sorted.findIndex((p) => p.id === myId);

  // Rotate so the local player sits at the bottom-centre.
  const ordered =
    meIdx >= 0 ? [...sorted.slice(meIdx), ...sorted.slice(0, meIdx)] : sorted;
  const positions = seatPositions(Math.max(ordered.length, 1));

  const inHand = state.status === "playing" || state.status === "showdown";

  return (
    <div className="relative mx-auto aspect-[3/4] h-full max-h-full w-auto max-w-full">
      {/* Felt */}
      <div className="felt-surface absolute inset-3 rounded-[44%]" />

      {/* Centre: round label + pot, kept compact so it clears the seats */}
      <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1">
        {inHand && (
          <span className="rounded-full bg-black/45 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-vegas-gold/90">
            {state.status === "showdown" ? "Showdown" : ROUND_LABEL[state.round]}
          </span>
        )}
        <ChipStack amount={state.pot} size={28} label={false} layoutId="pot" />
        <div className="rounded-full border border-vegas-gold/40 bg-black/50 px-4 py-1 text-center">
          <div className="text-[10px] uppercase tracking-widest text-stone-300">Pot</div>
          <div className="text-lg font-bold text-vegas-gold tabular-nums leading-none">
            {formatRp(state.pot)}
          </div>
        </div>
        {inHand && state.currentBet > 0 && (
          <span className="text-[10px] text-stone-300">
            Bet {formatRp(state.currentBet)}
          </span>
        )}
      </div>

      {/* Seats */}
      {ordered.map((player, i) => {
        const pos = positions[i];
        return (
          <div
            key={player.id}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
          >
            <PlayerSeat
              player={player}
              isMe={player.id === myId}
              isHost={hostId != null && player.id === hostId}
              isDealer={inHand && player.seat === state.dealerSeat}
              isToAct={state.status === "playing" && state.toActSeat === player.seat}
              isWinner={state.status === "handover" && state.winners.includes(player.seat)}
              blind={null}
              topHalf={pos.y < 50}
            />
          </div>
        );
      })}
    </div>
  );
}
