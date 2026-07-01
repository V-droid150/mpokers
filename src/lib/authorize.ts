// Server-side authorization for online actions. Pure and unit-testable — decides
// whether a caller (verified auth uid) is allowed to dispatch a given action for
// a room's current state. The reducer (engine.ts) still enforces game rules
// (turn order, legality); this layer enforces *identity*: you can only act as
// yourself, and only the dealer/host may run privileged table actions.

import type { Action, GameState } from "./types";

export function authorizeAction(
  state: GameState,
  action: Action,
  callerUid: string
): boolean {
  if (!callerUid) return false;

  switch (action.type) {
    // Privileged table actions — dealer/host only.
    case "START_HAND":
    case "NEXT_HAND":
    case "AWARD":
    case "CONFIG":
    case "RESET_STACKS":
      return callerUid === state.hostId;

    // The dealer records their own display name.
    case "SET_HOST_NAME":
      return action.hostId === callerUid && callerUid === state.hostId;

    // Player-scoped actions — you may only act as yourself.
    case "JOIN":
    case "LEAVE":
    case "RENAME":
    case "SET_CONNECTED":
    case "SIT_OUT":
    case "REBUY":
    case "FOLD":
    case "CHECK":
    case "CALL":
    case "RAISE":
    case "ALL_IN":
    case "PAY_FEE":
      return action.playerId === callerUid;

    default:
      return false;
  }
}
