import { ImageResponse } from "next/og";
import { readFileSync } from "node:fs";
import { LogoMark } from "@/lib/logo";

// iOS home-screen icon (PNG). 180×180 is the standard apple-touch-icon size.
// Rendered on-demand to dodge the Windows-only @vercel/og build crash (see icon.tsx).
export const dynamic = "force-dynamic";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  const cinzel = readFileSync(new URL("../assets/Cinzel-900.woff", import.meta.url));
  return new ImageResponse(<LogoMark size={180} />, {
    ...size,
    fonts: [{ name: "Cinzel", data: cinzel, weight: 900, style: "normal" }],
    emoji: "twemoji",
  });
}
