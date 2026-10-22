import type { PasswordAlgoId } from "@/hash/algorithms";
import type { PasswordHashResult, PasswordVerifyResult, RecordPart } from "@/hash/contract";

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string; field?: string };
export type ActionError = Extract<ActionResult<never>, { ok: false }>;

export type UserView = {
  username: string;
  algo: PasswordAlgoId;
  record: string;
  parts: RecordPart[];
  createdAt: number;
};

export type RegistrationResult = { hash: PasswordHashResult; users: UserView[]; username: string };
export type LoginResult =
  | (PasswordVerifyResult & { kind: "verified"; message: string; lockedUntil: number })
  | { kind: "locked"; algo: PasswordAlgoId; message: string; lockedUntil: number };
