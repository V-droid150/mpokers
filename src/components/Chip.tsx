"use client";

import { formatShort } from "@/lib/format";
import type { ChipDef } from "@/lib/chips";

interface ChipProps {
  def: ChipDef;
  size?: number;
  showLabel?: boolean;
}

// A single casino chip rendered with pure CSS — body colour, dashed edge spots,
// an inner ring, and an optional short denomination label.
export default function Chip({ def, size = 44, showLabel = true }: ChipProps) {
  return (
    <div
      className="relative shrink-0 rounded-full shadow-chip"
      style={{
        width: size,
        height: size,
        background: `repeating-conic-gradient(${def.ring} 0deg 18deg, ${def.base} 18deg 45deg)`,
      }}
    >
      <div
        className="absolute rounded-full"
        style={{
          inset: size * 0.14,
          background: def.base,
          boxShadow:
            "inset 0 2px 4px rgba(255,255,255,0.25), inset 0 -3px 6px rgba(0,0,0,0.35)",
          border: `${Math.max(1, size * 0.04)}px dashed ${def.ring}`,
        }}
      />
      {showLabel && (
        <div
          className="absolute inset-0 flex items-center justify-center font-bold"
          style={{ color: def.text, fontSize: size * 0.26 }}
        >
          {formatShort(def.value)}
        </div>
      )}
    </div>
  );
}
