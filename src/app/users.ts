import "server-only";
import type { UserView } from "./action-types";

export type StoredUser = Omit<UserView, "parts"> & { failedAttempts: number; lockedUntil: number };

declare global {
  var hashLabUsers: Map<string, StoredUser> | undefined;
  var hashLabDummyRecord: Promise<string> | undefined;
}

export const users = (globalThis.hashLabUsers ??= new Map<string, StoredUser>());
export const LOCKOUT_POLICY = { maxAttempts: 5, lockMs: 30_000 } as const;
