// Core domain types for Mpokers — a cardless poker chip & betting manager.
// All monetary values are stored as plain integers in Rupiah.

export type BettingRound = "preflop" | "flop" | "turn" | "river";

// lobby     -> waiting for players, host can start a hand
// playing   -> a hand is in progress, players act in turn
// showdown  -> betting finished, host picks the winner(s)
// handover  -> pot awarded, waiting for the next hand
export type GameStatus = "lobby" | "playing" | "showdown" | "handover";

export interface Player {
  id: string; // stable per-device id (persisted in localStorage)
  name: string;
  seat: number; // 0..7
  stack: number; // chips in front of the player (Rupiah)
  committed: number; // chips pushed in during the CURRENT betting round
  totalCommitted: number; // chips pushed in during the current HAND
  folded: boolean;
  allIn: boolean;
  hasActed: boolean; // has acted in the current betting round
  sittingOut: boolean; // not dealt into hands
  connected: boolean;
  buyInTotal: number; // cumulative buy-ins, for profit/loss accounting
}

export interface LogEntry {
  id: string;
  text: string;
  ts: number;
}

export interface GameState {
  version: number; // optimistic-concurrency guard
  status: GameStatus;
  hostId: string;
  handId: number;
  players: Player[];
  dealerSeat: number;
  smallBlind: number;
  bigBlind: number;
  buyIn: number;
  pot: number;
  currentBet: number; // highest amount committed this round
  minRaise: number; // minimum raise increment for this round
  round: BettingRound;
  toActSeat: number | null; // seat that must act, or null when no one can act
  lastAggressorSeat: number | null;
  winners: number[]; // seats awarded the last pot (for the result banner)
  lastPot: number; // size of the pot most recently awarded
  log: LogEntry[];
}

export const MAX_PLAYERS = 8;

export type Action =
  | { type: "JOIN"; playerId: string; name: string }
  | { type: "LEAVE"; playerId: string }
  | { type: "RENAME"; playerId: string; name: string }
  | { type: "SET_CONNECTED"; playerId: string; connected: boolean }
  | { type: "SIT_OUT"; playerId: string; sittingOut: boolean }
  | { type: "REBUY"; playerId: string; amount: number }
  | { type: "CONFIG"; smallBlind: number; bigBlind: number; buyIn: number }
  | { type: "START_HAND" }
  | { type: "FOLD"; playerId: string }
  | { type: "CHECK"; playerId: string }
  | { type: "CALL"; playerId: string }
  | { type: "RAISE"; playerId: string; total: number } // total committed this round
  | { type: "ALL_IN"; playerId: string }
  | { type: "AWARD"; winnerSeats: number[] }
  | { type: "NEXT_HAND" };
