// Usa imports relativos .ts porque node --test y next.config.ts cargan este módulo.
import "server-only";
import { setTimeout as delay } from "node:timers/promises";
import type { PasswordAlgoId } from "../hash/algorithms.ts";
import type { PasswordHashResult, RecordPart } from "../hash/contract.ts";
import { hashPassword, splitRecord, verifyPassword } from "../hash/server/index.ts";

export type StoredUser = { username: string; algo: PasswordAlgoId; record: string; createdAt: number };
export type UserView = StoredUser & { parts: RecordPart[] };

export type AuthOutcome =
  | { kind: "granted"; algo: PasswordAlgoId; ms: number }
  | { kind: "denied" }
  | { kind: "locked"; until: number };

export type Registration = { kind: "registered"; hash: PasswordHashResult } | { kind: "taken" };

export const LOCKOUT = { maxAttempts: 5, lockMs: 30_000 } as const;
export const FAILURE_FLOOR_MS = 600;

type Failures = { count: number; until: number; lastFailureAt: number };
type AuthTiming = { now?: () => number; failureFloorMs?: number };
type Store = { users: Map<string, StoredUser>; failures: Map<string, Failures>; dummy?: Promise<string> };

// Next dev re-evaluates this module on every hot reload; globalThis keeps the store alive.
declare global {
  var hashLabStore: Store | undefined;
}

const store: Store = (globalThis.hashLabStore ??= { users: new Map(), failures: new Map() });

function dummyRecord(): Promise<string> {
  return (store.dummy ??= hashPassword("bcrypt", "HashLab-dummy-credential").then(
    (result) => result.record,
    (error) => {
      store.dummy = undefined;
      throw error;
    },
  ));
}

export async function register(username: string, algo: PasswordAlgoId, password: string): Promise<Registration> {
  const key = username.toLowerCase();
  if (store.users.has(key)) return { kind: "taken" };
  const hash = await hashPassword(algo, password);
  // Another request may have claimed the name while this one was hashing.
  if (store.users.has(key)) return { kind: "taken" };
  store.users.set(key, { username, algo, record: hash.record, createdAt: Date.now() });
  return { kind: "registered", hash };
}

export function userViews(): UserView[] {
  return Array.from(store.users.values(), (user) => ({ ...user, parts: splitRecord(user.record) }));
}

export async function authenticate(username: string, password: string, timing: AuthTiming = {}): Promise<AuthOutcome> {
  const started = performance.now();
  const { now: clock = Date.now, failureFloorMs = FAILURE_FLOOR_MS } = timing;
  const key = username.toLowerCase();
  const user = store.users.get(key);
  const dummy = await dummyRecord();
  const { ok, algo, ms } = await verifyPassword(user?.record ?? dummy, password);
  const now = clock();
  for (const [name, failure] of store.failures) {
    if (failure.until ? failure.until <= now : now - failure.lastFailureAt >= LOCKOUT.lockMs) {
      store.failures.delete(name);
    }
  }
  const failures = store.failures.get(key);
  let outcome: AuthOutcome;
  if (failures && failures.until > now) {
    outcome = { kind: "locked", until: failures.until };
  } else if (user && ok) {
    store.failures.delete(key);
    return { kind: "granted", algo, ms };
  } else {
    const count = (failures?.count ?? 0) + 1;
    const until = count >= LOCKOUT.maxAttempts ? now + LOCKOUT.lockMs : 0;
    store.failures.set(key, { count, until, lastFailureAt: now });
    outcome = until ? { kind: "locked", until } : { kind: "denied" };
  }
  while (performance.now() - started < failureFloorMs) {
    await delay(Math.ceil(failureFloorMs - (performance.now() - started)));
  }
  return outcome;
}
