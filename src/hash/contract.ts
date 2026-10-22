import type { DigestAlgoId, PasswordAlgoId } from "./algorithms";

export type DigestResult = {
  algo: DigestAlgoId;
  hex: string;
  inputBytes: number;
  ms: number;
};

export type PublicKeyInfo = {
  scheme: "RSA-PSS";
  modulusBits: number;
  publicKeyPem: string;
  fingerprintSha256: string;
};

export type SignResult = {
  algo: DigestAlgoId;
  digestHex: string;
  signatureB64: string;
  publicKey: PublicKeyInfo;
  ms: number;
};

export type VerifyResult = {
  valid: boolean;
  digestHex: string;
  ms: number;
};

export type RecordPart = { role: "algoritmo" | "costo" | "sal" | "hash"; text: string };

export type PasswordHashResult = {
  algo: PasswordAlgoId;
  record: string;
  parts: RecordPart[];
  ms: number;
};

export type PasswordVerifyResult = {
  ok: boolean;
  algo: PasswordAlgoId;
  ms: number;
};
