"use client";

import type { LogEntry } from "@/lib/types";

export default function ActionLog({ log }: { log: LogEntry[] }) {
  const recent = [...log].slice(-6).reverse();
  return (
    <div className="no-scrollbar max-h-24 overflow-y-auto rounded-2xl bg-black/35 px-3 py-2">
      {recent.length === 0 ? (
        <p className="text-center text-xs text-stone-500">Belum ada aksi.</p>
      ) : (
        <ul className="space-y-0.5">
          {recent.map((e) => (
            <li key={e.id} className="text-xs text-stone-300">
              {e.text}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
