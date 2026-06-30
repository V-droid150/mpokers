import type { MetadataRoute } from "next";

// PWA manifest — makes Mpokers installable to the home screen as a standalone
// app. Icons point at the generated /icon route.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Mpokers — Cardless Poker Chips",
    short_name: "Mpokers",
    description:
      "Cardless poker — manage chips & bets. Vegas style, up to 8 players.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#000000",
    theme_color: "#000000",
    icons: [
      { src: "/icon", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
