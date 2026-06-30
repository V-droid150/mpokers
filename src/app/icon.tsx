import { ImageResponse } from "next/og";
import { LogoMark } from "@/lib/logo";

// Served at /icon — also used as the browser favicon and the PWA manifest icon.
// Rendered on-demand: the bundled @vercel/og node build crashes at *build* time
// on Windows (it path.joins a file:// URL), so we skip prerendering and let it
// render at request time, where it works fine on the Linux deploy runtime.
export const dynamic = "force-dynamic";
export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default async function Icon() {
  // new URL(..., import.meta.url) gets the font bundled & traced into the
  // serverless function, unlike a process.cwd() filesystem read.
  const cinzel = await fetch(
    new URL("../assets/Cinzel-900.woff", import.meta.url)
  ).then((res) => res.arrayBuffer());

  return new ImageResponse(<LogoMark size={512} />, {
    ...size,
    fonts: [{ name: "Cinzel", data: cinzel, weight: 900, style: "normal" }],
    emoji: "twemoji",
  });
}
