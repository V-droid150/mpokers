// Currency + misc formatting helpers.

export function formatRp(value: number): string {
  const safe = Math.round(value || 0);
  return "Rp" + safe.toLocaleString("id-ID");
}

// Compact form for chips on the felt (e.g. 1.500.000 -> 1,5jt, 25.000 -> 25rb).
export function formatShort(value: number): string {
  const v = Math.round(value || 0);
  if (v >= 1_000_000) {
    const n = v / 1_000_000;
    return (Number.isInteger(n) ? n.toString() : n.toFixed(1).replace(".", ",")) + "jt";
  }
  if (v >= 1_000) {
    const n = v / 1_000;
    return (Number.isInteger(n) ? n.toString() : n.toFixed(1).replace(".", ",")) + "rb";
  }
  return v.toString();
}

// A short, friendly room code: 4 uppercase letters/digits, no ambiguous chars.
export function makeRoomCode(): string {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 4; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}
