// Brand mark for the menu: a fanned Ace of Spades + Ace of Hearts above the
// "Mpokers" wordmark, where the "O" is a black casino chip.

function PlayingCard({ suit, red }: { suit: string; red?: boolean }) {
  return (
    <div
      className={`relative h-[4.6rem] w-[3.3rem] rounded-lg bg-white shadow-xl ring-1 ring-black/15 ${
        red ? "text-red-600" : "text-stone-900"
      }`}
    >
      <span className="absolute left-1 top-1 text-[13px] font-bold leading-none">A</span>
      <span className="absolute left-1 top-[17px] text-[12px] leading-none">{suit}</span>
      <span className="absolute inset-0 flex items-center justify-center text-[2rem] leading-none">
        {suit}
      </span>
      <span className="absolute bottom-1 right-1 rotate-180 text-[13px] font-bold leading-none">
        A
      </span>
      <span className="absolute bottom-[17px] right-1 rotate-180 text-[12px] leading-none">
        {suit}
      </span>
    </div>
  );
}

// Black casino chip used as the letter "O".
function ChipO() {
  return (
    <span
      aria-hidden
      className="relative inline-block"
      style={{ width: "0.8em", height: "0.8em", verticalAlign: "-0.06em" }}
    >
      <span
        className="absolute inset-0 rounded-full shadow-chip"
        style={{
          background: "repeating-conic-gradient(#f5c542 0 18deg, #0a0a0c 18deg 45deg)",
        }}
      />
      <span
        className="absolute rounded-full"
        style={{
          inset: "16%",
          background: "#0a0a0c",
          border: "0.06em dashed #f5c542",
          boxShadow: "inset 0 2px 4px rgba(255,255,255,0.15)",
        }}
      />
    </span>
  );
}

export default function BrandMark() {
  return (
    <div className="flex flex-col items-center">
      <div className="mb-3 flex items-end justify-center">
        <div className="-mr-3 rotate-[-14deg]">
          <PlayingCard suit="♠" />
        </div>
        <div className="rotate-[14deg]">
          <PlayingCard suit="♥" red />
        </div>
      </div>
      <h1 className="font-display text-5xl font-black text-foil">
        Mp<ChipO />kers
      </h1>
    </div>
  );
}
