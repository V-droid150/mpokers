"use client";

import { useEffect, useState } from "react";
import { isMuted, setMuted } from "@/lib/sound";

// A small speaker button that toggles chip sound + haptics.
export default function SoundToggle() {
  const [muted, setM] = useState(false);

  useEffect(() => setM(isMuted()), []);

  return (
    <button
      onClick={() => {
        const next = !muted;
        setMuted(next);
        setM(next);
      }}
      aria-label={muted ? "Unmute" : "Mute"}
      className="rounded-full border border-white/10 bg-black/40 px-2.5 py-1.5 text-sm active:scale-95"
    >
      {muted ? "🔇" : "🔊"}
    </button>
  );
}
