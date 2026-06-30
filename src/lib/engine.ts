// Pure poker betting engine for Mpokers.
//
// This module has NO dependency on React, Supabase, or the DOM. The whole game
// is modelled as `reduce(state, action) -> state`, which makes it deterministic
// and unit-testable. The realtime layer simply persists the resulting state and
// broadcasts it to every connected device.
//
// Simplifications (intentional, per product scope): a single main pot, no side
// pots. When players are all-in for different amounts, the host selects the
// winner(s) at showdown and the whole pot is awarded. This matches casual
// home-game accounting where the table sorts out odd all-in situations socially.

import { MAX_PLAYERS } from "./types";
import type { Action, GameState, LogEntry, Player } from "./types";
import { formatRp } from "./format";

const ROUND_ORDER: GameState["round"][] = ["preflop", "flop", "turn", "river"];

// Smallest legal bet/raise increment (one chip) used when there are no blinds.
export const MIN_BET = 100;

// Minimum bet/raise increment for a round given the big blind.
function minRaiseFor(bigBlind: number): number {
  return Math.max(bigBlind, MIN_BET);
}

export interface GameConfig {
  smallBlind: number;
  bigBlind: number;
  buyIn: number;
}

// Default: no forced blinds — the pot starts at 0 and players build the bet
// themselves. Host can change blinds before a hand if they want antes/blinds.
export const DEFAULT_CONFIG: GameConfig = {
  smallBlind: 0,
  bigBlind: 0,
  buyIn: 100000,
};

export function initialState(hostId: string, config: GameConfig = DEFAULT_CONFIG): GameState {
  return {
    version: 1,
    status: "lobby",
    hostId,
    handId: 0,
    players: [],
    dealerSeat: 0,
    smallBlind: config.smallBlind,
    bigBlind: config.bigBlind,
    buyIn: config.buyIn,
    pot: 0,
    currentBet: 0,
    minRaise: minRaiseFor(config.bigBlind),
    round: "preflop",
    toActSeat: null,
    lastAggressorSeat: null,
    winners: [],
    lastPot: 0,
    log: [],
  };
}

// ---------- small helpers ----------

function clone(s: GameState): GameState {
  return structuredClone(s);
}

function getById(s: GameState, id: string): Player | undefined {
  return s.players.find((p) => p.id === id);
}

function getBySeat(s: GameState, seat: number): Player | undefined {
  return s.players.find((p) => p.seat === seat);
}

function occupiedSeats(s: GameState): number[] {
  return s.players.map((p) => p.seat).sort((a, b) => a - b);
}

// Occupied seats in clockwise order, strictly after `seat` (wrapping around).
function seatsAfter(s: GameState, seat: number): number[] {
  const all = occupiedSeats(s);
  const after = all.filter((x) => x > seat);
  const before = all.filter((x) => x < seat);
  return [...after, ...before];
}

function nextSeatMatching(
  s: GameState,
  fromSeat: number,
  pred: (p: Player) => boolean
): number | null {
  for (const seat of seatsAfter(s, fromSeat)) {
    const p = getBySeat(s, seat);
    if (p && pred(p)) return seat;
  }
  return null;
}

// Can this player still take a voluntary action this round?
function canAct(p: Player): boolean {
  return !p.folded && !p.allIn && p.stack > 0;
}

// Eligible to be dealt into a new hand.
function isDealtIn(p: Player): boolean {
  return !p.sittingOut && p.stack > 0;
}

function addLog(s: GameState, text: string): void {
  const entry: LogEntry = {
    id: `${s.handId}:${s.log.length}:${Math.random().toString(36).slice(2, 7)}`,
    text,
    ts: Date.now(),
  };
  s.log = [...s.log.slice(-49), entry];
}

function lowestFreeSeat(s: GameState): number {
  const taken = new Set(s.players.map((p) => p.seat));
  for (let i = 0; i < MAX_PLAYERS; i++) {
    if (!taken.has(i)) return i;
  }
  return -1;
}

// ---------- pot resolution ----------

function awardPot(s: GameState, winnerSeats: number[]): void {
  const pot = s.pot;
  const valid = winnerSeats.filter((seat) => getBySeat(s, seat));
  if (pot > 0 && valid.length > 0) {
    const sorted = [...valid].sort((a, b) => a - b);
    const share = Math.floor(pot / sorted.length);
    let remainder = pot - share * sorted.length;
    for (const seat of sorted) {
      const p = getBySeat(s, seat);
      if (!p) continue;
      let amt = share;
      if (remainder > 0) {
        amt += 1;
        remainder -= 1;
      }
      p.stack += amt;
    }
    const names = sorted.map((seat) => getBySeat(s, seat)?.name ?? "?").join(" & ");
    addLog(s, `${names} memenangkan pot ${formatRp(pot)}.`);
  }
  s.lastPot = pot;
  s.winners = valid;
  s.pot = 0;
  s.status = "handover";
  s.toActSeat = null;
}

function streetLabel(round: GameState["round"]): string {
  switch (round) {
    case "flop":
      return "— Flop —";
    case "turn":
      return "— Turn —";
    case "river":
      return "— River —";
    default:
      return "— Pre-flop —";
  }
}

function advanceStreet(s: GameState): void {
  const idx = ROUND_ORDER.indexOf(s.round);
  s.round = ROUND_ORDER[Math.min(idx + 1, ROUND_ORDER.length - 1)];
  for (const p of s.players) {
    if (!p.folded) {
      p.committed = 0;
      p.hasActed = false;
    }
  }
  s.currentBet = 0;
  s.minRaise = minRaiseFor(s.bigBlind);
  s.lastAggressorSeat = null;
  const first = nextSeatMatching(s, s.dealerSeat, canAct);
  s.toActSeat = first;
  addLog(s, streetLabel(s.round));
  if (first === null) {
    // Everyone remaining is all-in — no more betting possible.
    s.status = "showdown";
    s.toActSeat = null;
  }
}

// Called after every voluntary action to figure out whose turn it is, whether
// the street is over, or whether the hand has ended.
function resolve(s: GameState, actedSeat: number): void {
  const live = s.players.filter((p) => !p.folded);

  // Everyone folded but one -> that player wins immediately.
  if (live.length <= 1) {
    awardPot(s, live.map((p) => p.seat));
    return;
  }

  const canActPlayers = s.players.filter(canAct);
  const allMatched = canActPlayers.every(
    (p) => p.hasActed && p.committed === s.currentBet
  );

  if (canActPlayers.length === 0 || allMatched) {
    // Betting round complete.
    if (s.round === "river" || canActPlayers.length <= 1) {
      s.status = "showdown";
      s.toActSeat = null;
      addLog(s, "Taruhan selesai — pilih pemenang.");
      return;
    }
    advanceStreet(s);
    return;
  }

  s.toActSeat = nextSeatMatching(s, actedSeat, canAct);
}

// ---------- starting a hand ----------

function startHand(s: GameState): void {
  const dealt = s.players.filter(isDealtIn);
  if (dealt.length < 2) {
    s.status = "lobby";
    addLog(s, "Butuh minimal 2 pemain dengan chip untuk mulai.");
    return;
  }

  // Reset per-hand player state.
  for (const p of s.players) {
    p.committed = 0;
    p.totalCommitted = 0;
    p.hasActed = false;
    p.allIn = false;
    p.folded = !isDealtIn(p);
  }

  s.handId += 1;
  s.pot = 0;
  s.currentBet = 0;
  s.minRaise = minRaiseFor(s.bigBlind);
  s.round = "preflop";
  s.winners = [];
  s.lastPot = 0;
  s.status = "playing";

  // Move the dealer button to the next eligible seat.
  if (s.handId === 1) {
    s.dealerSeat = dealt.map((p) => p.seat).sort((a, b) => a - b)[0];
  } else {
    const next = nextSeatMatching(s, s.dealerSeat, isDealtIn);
    if (next !== null) s.dealerSeat = next;
  }

  addLog(s, `Hand #${s.handId} dimulai. Dealer: ${getBySeat(s, s.dealerSeat)?.name}.`);

  const postBlind = (seat: number, amount: number): void => {
    const p = getBySeat(s, seat);
    if (!p) return;
    const pay = Math.min(amount, p.stack);
    if (pay <= 0) return; // no blinds configured — nothing to post
    p.stack -= pay;
    p.committed += pay;
    p.totalCommitted += pay;
    s.pot += pay;
    if (p.stack === 0) p.allIn = true;
    addLog(s, `${p.name} pasang ${formatRp(pay)}.`);
  };

  const dealtSeatsAfterDealer = seatsAfter(s, s.dealerSeat).filter((seat) =>
    isDealtIn(getBySeat(s, seat)!)
  );

  let sbSeat: number;
  let bbSeat: number;
  let firstToAct: number | null;

  if (dealt.length === 2) {
    // Heads-up: dealer is the small blind and acts first pre-flop.
    sbSeat = s.dealerSeat;
    bbSeat = dealtSeatsAfterDealer[0];
    postBlind(sbSeat, s.smallBlind);
    postBlind(bbSeat, s.bigBlind);
    firstToAct = s.dealerSeat;
  } else {
    sbSeat = dealtSeatsAfterDealer[0];
    bbSeat = dealtSeatsAfterDealer[1];
    postBlind(sbSeat, s.smallBlind);
    postBlind(bbSeat, s.bigBlind);
    firstToAct = nextSeatMatching(s, bbSeat, canAct);
  }

  s.currentBet = s.bigBlind;
  s.minRaise = minRaiseFor(s.bigBlind);
  s.lastAggressorSeat = bbSeat;

  // If the first-to-act seat can't act (e.g. all-in from blinds), resolve.
  if (firstToAct !== null && getBySeat(s, firstToAct) && canAct(getBySeat(s, firstToAct)!)) {
    s.toActSeat = firstToAct;
  } else {
    s.toActSeat = firstToAct;
    resolve(s, bbSeat);
  }
}

// ---------- legal action introspection (for the UI) ----------

export interface LegalActions {
  isYourTurn: boolean;
  canFold: boolean;
  canCheck: boolean;
  canCall: boolean;
  callAmount: number;
  canRaise: boolean;
  minRaiseTo: number;
  maxRaiseTo: number;
  canAllIn: boolean;
  allInTo: number;
}

export function legalActions(s: GameState, playerId: string): LegalActions {
  const p = getById(s, playerId);
  const none: LegalActions = {
    isYourTurn: false,
    canFold: false,
    canCheck: false,
    canCall: false,
    callAmount: 0,
    canRaise: false,
    minRaiseTo: 0,
    maxRaiseTo: 0,
    canAllIn: false,
    allInTo: 0,
  };
  if (!p || s.status !== "playing" || s.toActSeat !== p.seat) return none;

  const toCall = Math.max(0, s.currentBet - p.committed);
  const maxRaiseTo = p.committed + p.stack;
  const minRaiseTo = Math.min(s.currentBet + s.minRaise, maxRaiseTo);
  const hasChipsBeyondCall = p.stack > toCall;

  return {
    isYourTurn: true,
    canFold: true,
    canCheck: toCall === 0,
    canCall: toCall > 0 && p.stack > 0,
    callAmount: Math.min(toCall, p.stack),
    canRaise: hasChipsBeyondCall,
    minRaiseTo,
    maxRaiseTo,
    canAllIn: p.stack > 0,
    allInTo: maxRaiseTo,
  };
}

// ---------- the reducer ----------

export function reduce(state: GameState, action: Action): GameState {
  const s = clone(state);
  let changed = true;

  switch (action.type) {
    case "JOIN": {
      const existing = getById(s, action.playerId);
      if (existing) {
        existing.connected = true;
        existing.name = action.name || existing.name;
        break;
      }
      const seat = lowestFreeSeat(s);
      if (seat === -1) {
        changed = false;
        break;
      }
      const player: Player = {
        id: action.playerId,
        name: action.name || `Pemain ${seat + 1}`,
        seat,
        stack: s.buyIn,
        committed: 0,
        totalCommitted: 0,
        folded: s.status === "playing", // joined mid-hand -> sit out this hand
        allIn: false,
        hasActed: s.status === "playing",
        sittingOut: false,
        connected: true,
        buyInTotal: s.buyIn,
      };
      s.players.push(player);
      addLog(s, `${player.name} bergabung (kursi ${seat + 1}).`);
      break;
    }

    case "RENAME": {
      const p = getById(s, action.playerId);
      if (!p) {
        changed = false;
        break;
      }
      p.name = action.name || p.name;
      break;
    }

    case "SET_CONNECTED": {
      const p = getById(s, action.playerId);
      if (!p || p.connected === action.connected) {
        changed = false;
        break;
      }
      p.connected = action.connected;
      break;
    }

    case "SIT_OUT": {
      const p = getById(s, action.playerId);
      if (!p) {
        changed = false;
        break;
      }
      p.sittingOut = action.sittingOut;
      // If sitting out mid-hand and it was their turn, fold them.
      if (action.sittingOut && s.status === "playing" && !p.folded) {
        p.folded = true;
        p.hasActed = true;
        if (s.toActSeat === p.seat) {
          resolve(s, p.seat);
        }
      }
      addLog(s, `${p.name} ${action.sittingOut ? "duduk dulu" : "ikut main lagi"}.`);
      break;
    }

    case "LEAVE": {
      const p = getById(s, action.playerId);
      if (!p) {
        changed = false;
        break;
      }
      const wasTurn = s.status === "playing" && s.toActSeat === p.seat && !p.folded;
      const seat = p.seat;
      const name = p.name;
      // Treat as a fold for an in-progress hand before removing.
      if (s.status === "playing" && !p.folded) {
        p.folded = true;
        p.hasActed = true;
      }
      s.players = s.players.filter((x) => x.id !== action.playerId);
      addLog(s, `${name} keluar dari meja.`);
      if (wasTurn) resolve(s, seat);
      break;
    }

    case "REBUY": {
      const p = getById(s, action.playerId);
      if (!p || action.amount <= 0) {
        changed = false;
        break;
      }
      // Only allowed while the player isn't in an active hand.
      if (s.status === "playing" && !p.folded) {
        changed = false;
        break;
      }
      p.stack += action.amount;
      p.buyInTotal += action.amount;
      addLog(s, `${p.name} top-up ${formatRp(action.amount)}.`);
      break;
    }

    case "CONFIG": {
      if (s.status === "playing") {
        changed = false;
        break;
      }
      s.smallBlind = Math.max(0, Math.round(action.smallBlind));
      s.bigBlind = Math.max(s.smallBlind, Math.round(action.bigBlind));
      s.buyIn = Math.max(0, Math.round(action.buyIn));
      s.minRaise = minRaiseFor(s.bigBlind);
      addLog(s, `Blind ${formatRp(s.smallBlind)}/${formatRp(s.bigBlind)}, buy-in ${formatRp(s.buyIn)}.`);
      break;
    }

    case "RESET_STACKS": {
      // Host levels everyone to the current buy-in (only between hands).
      if (s.status === "playing") {
        changed = false;
        break;
      }
      for (const p of s.players) {
        p.stack = s.buyIn;
        p.buyInTotal = s.buyIn;
      }
      addLog(s, `Chip semua pemain disamakan ke ${formatRp(s.buyIn)}.`);
      break;
    }

    case "START_HAND": {
      if (s.status === "playing") {
        changed = false;
        break;
      }
      startHand(s);
      break;
    }

    case "NEXT_HAND": {
      if (s.status === "playing") {
        changed = false;
        break;
      }
      startHand(s);
      break;
    }

    case "AWARD": {
      if (s.status !== "showdown") {
        changed = false;
        break;
      }
      const live = s.players.filter((p) => !p.folded).map((p) => p.seat);
      const winners = action.winnerSeats.filter((seat) => live.includes(seat));
      if (winners.length === 0) {
        changed = false;
        break;
      }
      awardPot(s, winners);
      break;
    }

    case "FOLD":
    case "CHECK":
    case "CALL":
    case "RAISE":
    case "ALL_IN": {
      const p = getById(s, action.playerId);
      if (!p || s.status !== "playing" || s.toActSeat !== p.seat) {
        changed = false;
        break;
      }
      const toCall = Math.max(0, s.currentBet - p.committed);

      if (action.type === "FOLD") {
        p.folded = true;
        p.hasActed = true;
        addLog(s, `${p.name} fold.`);
      } else if (action.type === "CHECK") {
        if (toCall !== 0) {
          changed = false;
          break;
        }
        p.hasActed = true;
        addLog(s, `${p.name} check.`);
      } else if (action.type === "CALL") {
        if (toCall <= 0) {
          // Nothing to call — treat as a check.
          p.hasActed = true;
          addLog(s, `${p.name} check.`);
        } else {
          const amt = Math.min(toCall, p.stack);
          p.stack -= amt;
          p.committed += amt;
          p.totalCommitted += amt;
          s.pot += amt;
          p.hasActed = true;
          if (p.stack === 0) p.allIn = true;
          addLog(s, `${p.name} call ${formatRp(amt)}${p.allIn ? " (all-in)" : ""}.`);
        }
      } else if (action.type === "RAISE") {
        const total = Math.round(action.total);
        const delta = total - p.committed;
        const maxTotal = p.committed + p.stack;
        const raiseAmt = total - s.currentBet;
        const isAllIn = total === maxTotal;
        const validSize = raiseAmt >= s.minRaise || isAllIn;
        if (total <= s.currentBet || delta > p.stack || delta <= 0 || !validSize) {
          changed = false;
          break;
        }
        p.stack -= delta;
        p.committed = total;
        p.totalCommitted += delta;
        s.pot += delta;
        s.currentBet = total;
        if (raiseAmt >= s.minRaise) s.minRaise = raiseAmt;
        s.lastAggressorSeat = p.seat;
        if (p.stack === 0) p.allIn = true;
        // Reopen the action for everyone else still able to act.
        for (const other of s.players) {
          if (canAct(other) && other.seat !== p.seat) other.hasActed = false;
        }
        p.hasActed = true;
        addLog(s, `${p.name} raise ke ${formatRp(total)}${p.allIn ? " (all-in)" : ""}.`);
      } else {
        // ALL_IN
        const delta = p.stack;
        if (delta <= 0) {
          changed = false;
          break;
        }
        const total = p.committed + delta;
        p.stack = 0;
        p.committed = total;
        p.totalCommitted += delta;
        s.pot += delta;
        p.allIn = true;
        p.hasActed = true;
        if (total > s.currentBet) {
          const raiseAmt = total - s.currentBet;
          s.currentBet = total;
          if (raiseAmt >= s.minRaise) s.minRaise = raiseAmt;
          s.lastAggressorSeat = p.seat;
          for (const other of s.players) {
            if (canAct(other) && other.seat !== p.seat) other.hasActed = false;
          }
        }
        addLog(s, `${p.name} all-in ${formatRp(total)}.`);
      }

      resolve(s, p.seat);
      break;
    }

    default:
      changed = false;
  }

  if (!changed) return state;
  s.version = state.version + 1;
  return s;
}
