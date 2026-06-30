import { ImageResponse } from "next/og";
import { LogoMark } from "@/lib/logo";
import { CINZEL_900_WOFF_BASE64 } from "@/lib/cinzel-font";

// iOS home-screen icon (PNG). 180×180 is the standard apple-touch-icon size.
// Rendered on-demand to dodge the Windows-only @vercel/og build crash (see icon.tsx).
export const dynamic = "force-dynamic";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  const cinzel = Buffer.from(CINZEL_900_WOFF_BASE64, "base64");
  return new ImageResponse(<LogoMark size={180} />, {
    ...size,
    fonts: [{ name: "Cinzel", data: cinzel, weight: 900, style: "normal" }],
  });
}
