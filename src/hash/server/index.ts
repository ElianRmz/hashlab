import "server-only";
import type { DigestAlgoId, PasswordAlgoId } from "../algorithms";
import type {
  DigestResult,
  PasswordHashResult,
  PasswordVerifyResult,
  PublicKeyInfo,
  RecordPart,
  SignResult,
  VerifyResult,
} from "../contract";

const pending = (name: string): never => {
  throw new Error(`${name} no implementado`);
};

export function digest(algo: DigestAlgoId, data: Uint8Array): DigestResult {
  return pending(`digest(${algo}, ${data.byteLength})`);
}

export function publicKey(): PublicKeyInfo {
  return pending("publicKey");
}

export function sign(algo: DigestAlgoId, message: string): SignResult {
  return pending(`sign(${algo}, ${message.length})`);
}

export function verify(algo: DigestAlgoId, message: string, signatureB64: string): VerifyResult {
  return pending(`verify(${algo}, ${message.length}, ${signatureB64.length})`);
}

export async function hashPassword(algo: PasswordAlgoId, password: string): Promise<PasswordHashResult> {
  return pending(`hashPassword(${algo}, ${password.length})`);
}

export async function verifyPassword(record: string, password: string): Promise<PasswordVerifyResult> {
  return pending(`verifyPassword(${record.length}, ${password.length})`);
}

export function splitRecord(record: string): RecordPart[] {
  return pending(`splitRecord(${record.length})`);
}
