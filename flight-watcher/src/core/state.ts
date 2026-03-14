import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

export type WatchState = {
  lastBestPrice?: number;
  lastCheckedAt?: string;
};

export function loadState(path: string): WatchState {
  if (!existsSync(path)) return {};
  try {
    return JSON.parse(readFileSync(path, "utf8")) as WatchState;
  } catch {
    return {};
  }
}

export function saveState(path: string, state: WatchState): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(state, null, 2), "utf8");
}
