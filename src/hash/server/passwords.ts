import type { PasswordAlgoId } from "../algorithms.ts";
import type { PasswordHashResult, PasswordVerifyResult, RecordPart } from "../contract.ts";
import { bcryptScheme } from "./bcrypt.ts";
import { pbkdf2Scheme } from "./pbkdf2.ts";
import type { PasswordScheme } from "./scheme.ts";
import { sha256cryptScheme } from "./sha256crypt.ts";

export const SCHEMES: Record<PasswordAlgoId, PasswordScheme> = {
  bcrypt: bcryptScheme,
  sha256crypt: sha256cryptScheme,
  pbkdf2: pbkdf2Scheme,
};

function schemeFor(record: string): PasswordScheme {
  const scheme = Object.values(SCHEMES).find((candidate) => candidate.matches(record));
  if (!scheme) throw new Error("el registro no tiene el formato de ningún esquema conocido");
  return scheme;
}

export async function hashPassword(algo: PasswordAlgoId, password: string): Promise<PasswordHashResult> {
  const scheme = SCHEMES[algo];
  const start = performance.now();
  const record = await scheme.hash(password);
  const ms = performance.now() - start;
  return { algo, record, parts: scheme.split(record), ms };
}

export async function verifyPassword(record: string, password: string): Promise<PasswordVerifyResult> {
  const scheme = schemeFor(record);
  const start = performance.now();
  const ok = await scheme.verify(record, password);
  return { ok, algo: scheme.id, ms: performance.now() - start };
}

export function splitRecord(record: string): RecordPart[] {
  return schemeFor(record).split(record);
}
