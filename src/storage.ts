export type Side = "heads" | "tails";

export type TossRecord = {
  side: Side;
  call: Side | null;
};

export type Saved = {
  history: TossRecord[];
  streak: number;
  best: number;
  sound: boolean;
};

const KEY = "toss.v1";
const MAX = 20;

const EMPTY: Saved = { history: [], streak: 0, best: 0, sound: true };

function isSide(value: unknown): value is Side {
  return value === "heads" || value === "tails";
}

function isRecord(value: unknown): value is TossRecord {
  if (!value || typeof value !== "object") return false;
  const record = value as TossRecord;
  return isSide(record.side) && (record.call === null || isSide(record.call));
}

function whole(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0;
}

export function loadSaved(): Saved {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    const data = JSON.parse(raw) as Partial<Saved>;
    const history = Array.isArray(data.history) ? data.history.filter(isRecord).slice(0, MAX) : [];
    return {
      history,
      streak: whole(data.streak),
      best: whole(data.best),
      sound: data.sound !== false,
    };
  } catch {
    return EMPTY;
  }
}

export function saveSaved(saved: Saved) {
  localStorage.setItem(KEY, JSON.stringify({ ...saved, history: saved.history.slice(0, MAX) }));
}

export function fairSide(): Side {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return (buf[0]! & 1) === 0 ? "heads" : "tails";
}

export function extraSpins(): number {
  const buf = new Uint8Array(1);
  crypto.getRandomValues(buf);
  return 6 + (buf[0]! % 4);
}
