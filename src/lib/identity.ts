// A lightweight, account-free identity persisted in localStorage. Each device
// keeps a stable player id so it can reconnect to the same seat, plus a display
// name the player can change.

const ID_KEY = "mpokers:pid";
const NAME_KEY = "mpokers:name";

export function getPlayerId(): string {
  if (typeof window === "undefined") return "";
  let id = window.localStorage.getItem(ID_KEY);
  if (!id) {
    id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2) + Date.now().toString(36);
    window.localStorage.setItem(ID_KEY, id);
  }
  return id;
}

export function getStoredName(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(NAME_KEY) ?? "";
}

export function setStoredName(name: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(NAME_KEY, name.trim());
}
