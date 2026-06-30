import { ImageResponse } from "next/og";
import { readFileSync } from "node:fs";
import { LogoMark } from "@/lib/logo";

// Served at /icon — also used as the browser favicon and the PWA manifest icon.
// Rendered on-demand: the bundled @vercel/og node build crashes at *build* time
// on Windows (it path.joins a file:// URL), so we skip prerendering and let it
// render at request time, where it works fine on the Linux deploy runtime.
export const dynamic = "force-dynamic";
export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  // new URL(..., import.meta.url) makes webpack bundle & trace the font asset;
  // on the Node runtime we read it with fs (runtime fetch can't load file: URLs).
  // Kept inside the handler so it only runs at request time, not at build import.
  const cinzel = readFileSync(new URL("../assets/Cinzel-900.woff", import.meta.url));
  return new ImageResponse(<LogoMark size={512} />, {
    ...size,
    fonts: [{ name: "Cinzel", data: cinzel, weight: 900, style: "normal" }],
    emoji: "twemoji",
  });
}
