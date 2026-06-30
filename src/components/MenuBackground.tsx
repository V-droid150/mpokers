// A clean, precise poker-table backdrop for the pre-game menus. Rendered as a
// fixed, non-interactive layer behind the menu content.
export default function MenuBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* Deep casino-room base */}
      <div className="absolute inset-0 bg-vegas-ink" />

      {/* Overhead spotlight */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 80% at 50% -8%, rgba(245,197,66,0.10), transparent 55%)",
        }}
      />

      {/* The table, centred and concentric */}
      <div className="menu-table">
        <div className="menu-table-rail" />
        <div className="menu-table-felt" />
        <div className="menu-table-line" />
        <div className="menu-table-mark text-[5rem]">♠ ♥ ♣ ♦</div>
      </div>

      {/* Vignette to keep edges dark and the centre legible */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 100% at 50% 50%, transparent 52%, rgba(0,0,0,0.6) 100%)",
        }}
      />
    </div>
  );
}
