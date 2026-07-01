// Run via `npm test` (compiled by tsconfig.test.json).
import { test } from "node:test";
import assert from "node:assert/strict";

import { authorizeAction } from "./authorize";
import { initialState, reduce } from "./engine";
import type { Action, GameState } from "./types";

const HOST = "host-uid";
const P0 = "p0-uid";
const P1 = "p1-uid";

// A room with a non-playing dealer (HOST) and two seated players.
function room(): GameState {
  let s = initialState(HOST, { smallBlind: 0, bigBlind: 0, buyIn: 100000 }, "Dealer");
  s = reduce(s, { type: "JOIN", playerId: P0, name: "P0" });
  s = reduce(s, { type: "JOIN", playerId: P1, name: "P1" });
  return s;
}

test("host-only actions require the caller to be the host", () => {
  const s = room();
  const actions: Action[] = [
    { type: "START_HAND" },
    { type: "NEXT_HAND" },
    { type: "AWARD", winnerSeats: [0] },
    { type: "CONFIG", smallBlind: 0, bigBlind: 0, buyIn: 1 },
    { type: "RESET_STACKS" },
  ];
  for (const action of actions) {
    assert.equal(authorizeAction(s, action, HOST), true, `${action.type} by host`);
    assert.equal(authorizeAction(s, action, P0), false, `${action.type} by player`);
    assert.equal(authorizeAction(s, action, ""), false, `${action.type} anon`);
  }
});

test("player actions may only be dispatched as yourself", () => {
  const s = room();
  // P0 acting as P0 is allowed; anyone acting as P0 (but isn't) is rejected.
  assert.equal(authorizeAction(s, { type: "FOLD", playerId: P0 }, P0), true);
  assert.equal(authorizeAction(s, { type: "FOLD", playerId: P0 }, P1), false);
  assert.equal(authorizeAction(s, { type: "FOLD", playerId: P0 }, HOST), false);
  assert.equal(authorizeAction(s, { type: "RAISE", playerId: P1, total: 500 }, P1), true);
  assert.equal(authorizeAction(s, { type: "PAY_FEE", playerId: P0, amount: 100 }, P0), true);
  assert.equal(authorizeAction(s, { type: "PAY_FEE", playerId: P0, amount: 100 }, P1), false);
  assert.equal(authorizeAction(s, { type: "JOIN", playerId: P0, name: "x" }, P0), true);
  assert.equal(authorizeAction(s, { type: "JOIN", playerId: P0, name: "x" }, P1), false);
});

test("a player cannot impersonate the host to award themselves the pot", () => {
  const s = room();
  // The whole point: a seated player sending AWARD is rejected by identity.
  assert.equal(authorizeAction(s, { type: "AWARD", winnerSeats: [0] }, P0), false);
});

test("SET_HOST_NAME requires caller == action.hostId == state.hostId", () => {
  const s = room();
  assert.equal(authorizeAction(s, { type: "SET_HOST_NAME", hostId: HOST, name: "D" }, HOST), true);
  assert.equal(authorizeAction(s, { type: "SET_HOST_NAME", hostId: HOST, name: "D" }, P0), false);
  assert.equal(authorizeAction(s, { type: "SET_HOST_NAME", hostId: P0, name: "D" }, P0), false);
});
