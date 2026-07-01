// Classic casino chip denominations (in Rupiah) with their colours.

export interface ChipDef {
  value: number;
  base: string; // body colour
  ring: string; // edge-spot colour
  text: string; // label colour
}

export const CHIP_DEFS: ChipDef[] = [
  { value: 100, base: "#e8eaed", ring: "#9aa0a6", text: "#1f2937" },
  { value: 500, base: "#c0202e", ring: "#ffffff", text: "#ffffff" },
  { value: 1000, base: "#2563eb", ring: "#ffffff", text: "#ffffff" },
  { value: 5000, base: "#16a34a", ring: "#ffffff", text: "#ffffff" },
  { value: 25000, base: "#1f2937", ring: "#f5c542", text: "#f5c542" },
  { value: 100000, base: "#6d28d9", ring: "#ffffff", text: "#ffffff" },
  { value: 500000, base: "#f5c542", ring: "#7c2d12", text: "#7c2d12" },
];

// Greedy breakdown of an amount into the fewest chips, for rendering a stack.
export function breakdown(amount: number): ChipDef[] {
  let remaining = Math.round(amount);
  const chips: ChipDef[] = [];
  for (let i = CHIP_DEFS.length - 1; i >= 0 && remaining > 0; i--) {
    const def = CHIP_DEFS[i];
    while (remaining >= def.value && chips.length < 24) {
      chips.push(def);
      remaining -= def.value;
    }
  }
  return chips;
}
