import "server-only";
import type { PasswordAlgoId } from "../algorithms.ts";
import type {
  PasswordHashResult,
  PasswordVerifyResult,
  RecordPart,
} from "../contract.ts";

export { digest } from "./digest.ts";
export { publicKey, sign, verify } from "./signatures.ts";

const pending = (name: string): never => {
  throw new Error(`${name} no implementado`);
};

export async function hashPassword(algo: PasswordAlgoId, password: string): Promise<PasswordHashResult> {
  return pending(`hashPassword(${algo}, ${password.length})`);
}

export async function verifyPassword(record: string, password: string): Promise<PasswordVerifyResult> {
  return pending(`verifyPassword(${record.length}, ${password.length})`);
}

export function splitRecord(record: string): RecordPart[] {
  return pending(`splitRecord(${record.length})`);
}
