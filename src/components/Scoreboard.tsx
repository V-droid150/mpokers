"use client";

import type { Player } from "@/lib/types";
import { formatRp } from "@/lib/format";

// Profit/loss summary: per player, how much they bought in, their current
// chips, and the net (chips - buy-ins). Shown as a tap-to-dismiss sheet.
export default function Scoreboard({
  players,
  onClose,
}: {
  players: Player[];
  onClose: () => void;
}) {
  const rows = [...players].sort(
    (a, b) => b.stack - b.buyInTotal - (a.stack - a.buyInTotal)
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-3"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-white/10 bg-vegas-ink2 p-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-vegas-gold">
            Scoreboard &amp; P/L
          </h2>
          <button
            onClick={onClose}
            className="rounded-full bg-white/10 px-3 py-1 text-sm font-semibold text-stone-200 active:scale-95"
          >
            Close
          </button>
        </div>

        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-3 gap-y-1 text-sm">
          <div className="text-[10px] uppercase tracking-widest text-stone-400">Player</div>
          <div className="text-right text-[10px] uppercase tracking-widest text-stone-400">Buy-in</div>
          <div className="text-right text-[10px] uppercase tracking-widest text-stone-400">Chips</div>
          <div className="text-right text-[10px] uppercase tracking-widest text-stone-400">Net</div>

          {rows.map((p) => {
            const net = p.stack - p.buyInTotal;
            return (
              <div key={p.id} className="contents">
                <div className="truncate py-1 font-semibold text-stone-100">{p.name}</div>
                <div className="py-1 text-right tabular-nums text-stone-400">
                  {formatRp(p.buyInTotal)}
                </div>
                <div className="py-1 text-right tabular-nums text-stone-200">
                  {formatRp(p.stack)}
                </div>
                <div
                  className={`py-1 text-right font-bold tabular-nums ${
                    net > 0 ? "text-emerald-400" : net < 0 ? "text-vegas-red" : "text-stone-300"
                  }`}
                >
                  {net > 0 ? "+" : ""}
                  {formatRp(net)}
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-3 text-[11px] text-stone-500">
          Net = current chips − total buy-ins (buy-in &amp; top-up). Positive = profit.
        </p>
      </div>
    </div>
  );
}
