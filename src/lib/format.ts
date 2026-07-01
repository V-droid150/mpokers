// Currency + misc formatting helpers.

export function formatRp(value: number): string {
  const safe = Math.round(value || 0);
  return "Rp" + safe.toLocaleString("en-US");
}

// Compact form for chips on the felt (e.g. 1,500,000 -> 1.5M, 25,000 -> 25K).
export function formatShort(value: number): string {
  const v = Math.round(value || 0);
  if (v >= 1_000_000) {
    const n = v / 1_000_000;
    return (Number.isInteger(n) ? n.toString() : n.toFixed(1)) + "M";
  }
  if (v >= 1_000) {
    const n = v / 1_000;
    return (Number.isInteger(n) ? n.toString() : n.toFixed(1)) + "K";
  }
  return v.toString();
}

// A friendly room code: 6 uppercase letters/digits, no ambiguous chars
// (~887M combinations). Uses crypto with unbiased rejection sampling; falls
// back to Math.random only if the platform lacks getRandomValues.
export function makeRoomCode(length = 6): string {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // 31 chars
  const rand = typeof crypto !== "undefined" ? crypto : undefined;
  const limit = 256 - (256 % alphabet.length); // reject bytes >= limit to avoid bias
  let out = "";
  while (out.length < length) {
    let byte: number;
    if (rand?.getRandomValues) {
      const buf = new Uint8Array(1);
      rand.getRandomValues(buf);
      byte = buf[0];
      if (byte >= limit) continue;
    } else {
      byte = Math.floor(Math.random() * 256) % limit;
    }
    out += alphabet[byte % alphabet.length];
  }
  return out;
}
