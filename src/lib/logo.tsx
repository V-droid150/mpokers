/* eslint-disable @next/next/no-img-element */
// The Mpokers app logo, expressed as plain inline-styled JSX so it can be
// rasterised to PNG icons by `next/og` (Satori). Two fanned ace cards with the
// "Mpokers" wordmark slightly overlapping their lower edge, on a black field.
import type { ReactElement } from "react";

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
  const suit = red ? "♥️" : "♠️";
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
      <div style={{ display: "flex", fontSize: s * 0.17 }}>{suit}</div>
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
        <div style={{ fontSize: s * 0.062 }}>A</div>
        <div style={{ fontSize: s * 0.05 }}>{suit}</div>
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
