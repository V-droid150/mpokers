"use client";

import { AnimatePresence, motion } from "framer-motion";
import { breakdown } from "@/lib/chips";
import Chip from "./Chip";
import { formatRp } from "@/lib/format";

interface ChipStackProps {
  amount: number;
  size?: number;
  label?: boolean;
  layoutId?: string;
}

// A stack of chips representing an amount. Chips animate in one-by-one (each new
// chip springs up from below) giving the smooth "chips moving" feel.
export default function ChipStack({
  amount,
  size = 34,
  label = true,
  layoutId,
}: ChipStackProps) {
  const chips = breakdown(amount);
  const overlap = size * 0.74;
  const stackHeight = chips.length > 0 ? size + (chips.length - 1) * (size - overlap) : 0;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: Math.max(stackHeight, 0) }}>
        <AnimatePresence>
          {chips.map((def, i) => (
            <motion.div
              key={`${i}-${def.value}`}
              layout={Boolean(layoutId)}
              initial={{ y: 22, opacity: 0, scale: 0.7 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -10, opacity: 0, scale: 0.7 }}
              transition={{ type: "spring", stiffness: 520, damping: 26, delay: i * 0.012 }}
              className="absolute left-0"
              style={{ bottom: i * (size - overlap), zIndex: i }}
            >
              <Chip def={def} size={size} showLabel={false} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      {label && amount > 0 && (
        <span className="rounded-full bg-black/45 px-2 py-0.5 text-[11px] font-semibold text-vegas-gold tabular-nums">
          {formatRp(amount)}
        </span>
      )}
    </div>
  );
}
