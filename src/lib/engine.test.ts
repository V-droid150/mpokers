// Run with: node --test src/lib/engine.test.ts  (Node 24 strips the TS types)
import { test } from "node:test";
import assert from "node:assert/strict";

import { DEFAULT_CONFIG, initialState, legalActions, reduce } from "./engine";
import type { GameState } from "./types";

function seat(s: GameState, i: number) {
  return s.players.find((p) => p.seat === i)!;
}

function withPlayers(n: number): GameState {
  let s = initialState("host", DEFAULT_CONFIG); // SB 1000 / BB 2000, buy-in 100000
  for (let i = 0; i < n; i++) {
    s = reduce(s, { type: "JOIN", playerId: `p${i}`, name: `P${i}` });
  }
  return s;
}

test("join assigns sequential seats up to the max", () => {
  let s = withPlayers(8);
  assert.equal(s.players.length, 8);
  // 9th join is rejected (table full).
  s = reduce(s, { type: "JOIN", playerId: "p8", name: "P8" });
  assert.equal(s.players.length, 8);
});

test("blinds are posted and action starts left of the big blind", () => {
  const s = reduce(withPlayers(3), { type: "START_HAND" });
  assert.equal(s.status, "playing");
  assert.equal(s.pot, 3000); // 1000 + 2000
  assert.equal(seat(s, 1).committed, 1000); // SB
  assert.equal(seat(s, 2).committed, 2000); // BB
  assert.equal(s.currentBet, 2000);
  assert.equal(s.toActSeat, 0); // dealer/UTG acts first 3-handed
});

test("everyone folds to the big blind -> BB wins the pot", () => {
  let s = reduce(withPlayers(3), { type: "START_HAND" });
  s = reduce(s, { type: "FOLD", playerId: "p0" });
  s = reduce(s, { type: "FOLD", playerId: "p1" });
  assert.equal(s.status, "handover");
  assert.deepEqual(s.winners, [2]);
  // BB started 100000, posted 2000, wins 3000 pot => 101000.
  assert.equal(seat(s, 2).stack, 101000);
  assert.equal(s.pot, 0);
});

test("a full call-around pre-flop with BB checking advances to the flop", () => {
  let s = reduce(withPlayers(3), { type: "START_HAND" });
  s = reduce(s, { type: "CALL", playerId: "p0" }); // UTG calls 2000
  s = reduce(s, { type: "CALL", playerId: "p1" }); // SB completes
  assert.equal(s.round, "preflop");
  assert.equal(s.toActSeat, 2); // BB still has the option
  s = reduce(s, { type: "CHECK", playerId: "p2" }); // BB checks
  assert.equal(s.round, "flop");
  assert.equal(s.currentBet, 0);
  assert.equal(s.toActSeat, 1); // first active after dealer (seat 0) -> seat 1
});

test("a raise reopens the action for players who already acted", () => {
  let s = reduce(withPlayers(3), { type: "START_HAND" });
  s = reduce(s, { type: "CALL", playerId: "p0" }); // UTG calls
  const la = legalActions(s, "p1");
  assert.equal(la.minRaiseTo, 4000); // currentBet 2000 + minRaise 2000
  s = reduce(s, { type: "RAISE", playerId: "p1", total: 6000 }); // SB raises
  assert.equal(s.currentBet, 6000);
  assert.equal(seat(s, 0).hasActed, false); // p0 must act again
  assert.equal(s.toActSeat, 2); // action to BB next
});

test("illegal action (acting out of turn) is a no-op", () => {
  const s = reduce(withPlayers(3), { type: "START_HAND" });
  const after = reduce(s, { type: "FOLD", playerId: "p2" }); // not p2's turn
  assert.equal(after.version, s.version);
  assert.equal(after, s); // same reference -> unchanged
});

test("heads-up: dealer posts SB and acts first pre-flop", () => {
  const s = reduce(withPlayers(2), { type: "START_HAND" });
  assert.equal(s.dealerSeat, 0);
  assert.equal(seat(s, 0).committed, 1000); // dealer = SB
  assert.equal(seat(s, 1).committed, 2000); // BB
  assert.equal(s.toActSeat, 0);
});

test("all-in call drives the hand to showdown, host awards the pot", () => {
  let s = reduce(withPlayers(2), { type: "START_HAND" });
  s = reduce(s, { type: "ALL_IN", playerId: "p0" }); // dealer shoves
  s = reduce(s, { type: "CALL", playerId: "p1" }); // BB calls all-in
  assert.equal(s.status, "showdown");
  assert.equal(s.pot, 200000);
  s = reduce(s, { type: "AWARD", winnerSeats: [1] });
  assert.equal(s.status, "handover");
  assert.equal(seat(s, 1).stack, 200000);
  assert.equal(seat(s, 0).stack, 0);
});

test("next hand rotates the dealer button", () => {
  let s = reduce(withPlayers(3), { type: "START_HAND" });
  assert.equal(s.dealerSeat, 0);
  // End the hand quickly: everyone folds to BB.
  s = reduce(s, { type: "FOLD", playerId: "p0" });
  s = reduce(s, { type: "FOLD", playerId: "p1" });
  s = reduce(s, { type: "NEXT_HAND" });
  assert.equal(s.dealerSeat, 1);
});
