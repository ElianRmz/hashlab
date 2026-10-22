import type { PasswordHashResult } from "@/hash/contract";
import type { AuthOutcome, UserView } from "./users";

export type FieldName = "algo" | "mode" | "text" | "file" | "reference" | "message" | "signature" | "username" | "password";
export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string; field?: FieldName };
export type ActionError = Extract<ActionResult<never>, { ok: false }>;

export type RegistrationResult = { hash: PasswordHashResult; users: UserView[]; username: string };
export type LoginResult = AuthOutcome & { message: string };
