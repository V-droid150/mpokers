/* eslint-disable @next/next/no-img-element */
// The Mpokers app logo, expressed as plain inline-styled JSX so it can be
// rasterised to PNG icons by `next/og` (Satori). Two fanned ace cards with the
// "Mpokers" wordmark slightly overlapping their lower edge, on a black field.
//
// Suits are inline SVG images (no symbol font, no twemoji network fetch) so the
// icon renders deterministically inside the serverless function.
import type { ReactElement } from "react";

const HEART_D =
  "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z";
const SPADE_D =
  "M12 2C9 6 4 9.5 4 14a4 4 0 0 0 6.5 3.1C10.2 19 9.3 20.4 8 21h8c-1.3-.6-2.2-2-2.5-3.9A4 4 0 0 0 20 14c0-4.5-5-8-8-12z";

function suitUri(kind: "spade" | "heart", color: string): string {
  const d = kind === "heart" ? HEART_D : SPADE_D;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="${color}" d="${d}"/></svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

function Card({
  s,
  red,
  rotate,
  dx,
}: {
  s: number;
  red?: boolean;
  rotate: number;
  dx: number;
}) {
  const w = s * 0.3;
  const h = s * 0.42;
  const r = s * 0.045;
  const color = red ? "#c0202e" : "#141414";
  const kind = red ? "heart" : "spade";
  const pip = s * 0.18;
  const corner = s * 0.055;
  return (
    <div
      style={{
        position: "absolute",
        left: s * 0.5 - w / 2 + dx,
        top: s * 0.14,
        width: w,
        height: h,
        borderRadius: r,
        background: "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transform: `rotate(${rotate}deg)`,
        transformOrigin: "50% 100%",
        boxShadow: "0 8px 26px rgba(0,0,0,0.55)",
      }}
    >
      {/* Centre pip */}
      <img width={pip} height={pip} src={suitUri(kind, color)} alt="" />
      {/* Top-left corner index */}
      <div
        style={{
          position: "absolute",
          top: r * 0.5,
          left: r * 0.7,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          color,
          fontFamily: "Cinzel",
          fontWeight: 900,
          lineHeight: 1,
        }}
      >
        <div style={{ display: "flex", fontSize: s * 0.062 }}>A</div>
        <img width={corner} height={corner} src={suitUri(kind, color)} alt="" />
      </div>
    </div>
  );
}

export function LogoMark({ size }: { size: number }): ReactElement {
  const s = size;
  return (
    <div
      style={{
        width: s,
        height: s,
        background: "#000000",
        display: "flex",
        position: "relative",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Card s={s} rotate={-15} dx={-s * 0.03} />
      <Card s={s} red rotate={15} dx={s * 0.03} />
      <div
        style={{
          position: "absolute",
          top: s * 0.53,
          width: s,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Cinzel",
          fontWeight: 900,
          fontSize: s * 0.165,
          letterSpacing: s * 0.003,
          color: "#f5c542",
          textShadow: "0 3px 12px rgba(0,0,0,0.85)",
        }}
      >
        Mpokers
      </div>
    </div>
  );
}
