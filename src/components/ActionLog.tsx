"use client";

import type { LogEntry } from "@/lib/types";

// Minimal: just the single most-recent action as one subtle line, so it never
// crowds the table or the controls.
export default function ActionLog({ log }: { log: LogEntry[] }) {
  const last = log[log.length - 1];
  return (
    <div className="h-5 px-2 text-center text-[11px] leading-5 text-stone-400">
      <span className="line-clamp-1">{last ? last.text : ""}</span>
    </div>
  );
}
