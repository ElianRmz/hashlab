import { createHash, randomBytes } from "node:crypto";
import { SHA256CRYPT_ROUNDS } from "../params.ts";
import { defineScheme, safeEqual } from "./scheme.ts";

// Ulrich Drepper, "Unix crypt using SHA-256 and SHA-512", versión 0.6.
// https://www.akkadia.org/drepper/SHA-crypt.txt
// Los nombres A, B, DP, DS, P, S y C son los de la especificación.

const CRYPT64 = "./0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const ROUNDS_DEFAULT = 5000;
const ROUNDS_MIN = 1000;
const ROUNDS_MAX = 999_999_999;
const SALT_MAX_CHARS = 16;

type Setting = { rounds: number; roundsCustom: boolean; salt: string };

function parseSetting(setting: string): Setting {
  let rest = setting.startsWith("$5$") ? setting.slice(3) : setting;
  let rounds = ROUNDS_DEFAULT;
  const custom = /^rounds=(\d+)\$/.exec(rest);
  if (custom) {
    rounds = Math.min(Math.max(Number(custom[1]), ROUNDS_MIN), ROUNDS_MAX);
    rest = rest.slice(custom[0].length);
  }
  const salt = rest.split("$", 1)[0].slice(0, SALT_MAX_CHARS);
  return { rounds, roundsCustom: custom !== null, salt };
}

function sha256(...parts: Uint8Array[]): Buffer {
  const h = createHash("sha256");
  for (const part of parts) h.update(part);
  return h.digest();
}

function sha256Repeated(part: Uint8Array, times: number): Buffer {
  const h = createHash("sha256");
  for (let i = 0; i < times; i++) h.update(part);
  return h.digest();
}

function repeatTo(block: Buffer, length: number): Buffer {
  const out = Buffer.alloc(length);
  for (let offset = 0; offset < length; offset += block.length) {
    block.copy(out, offset, 0, Math.min(block.length, length - offset));
  }
  return out;
}

function digestA(key: Buffer, salt: Buffer, B: Buffer): Buffer {
  const a = createHash("sha256").update(key).update(salt);
  for (let left = key.length; left > 0; left -= 32) a.update(B.subarray(0, Math.min(32, left)));
  for (let bits = key.length; bits > 0; bits >>= 1) a.update(bits & 1 ? B : key);
  return a.digest();
}

function stretch(A: Buffer, P: Buffer, S: Buffer, rounds: number): Buffer {
  let C = A;
  for (let round = 0; round < rounds; round++) {
    const odd = round % 2 === 1;
    const h = createHash("sha256");
    h.update(odd ? P : C);
    if (round % 3 !== 0) h.update(S);
    if (round % 7 !== 0) h.update(P);
    h.update(odd ? C : P);
    C = h.digest();
  }
  return C;
}

const GROUPS: [number, number, number][] = [
  [0, 10, 20], [21, 1, 11], [12, 22, 2], [3, 13, 23], [24, 4, 14],
  [15, 25, 5], [6, 16, 26], [27, 7, 17], [18, 28, 8], [9, 19, 29],
];

function crypt64(word: number, chars: number): string {
  let out = "";
  for (let i = 0; i < chars; i++, word >>= 6) out += CRYPT64[word & 63];
  return out;
}

function encodeDigest(C: Buffer): string {
  const groups = GROUPS.map(([b2, b1, b0]) => crypt64((C[b2] << 16) | (C[b1] << 8) | C[b0], 4));
  return groups.join("") + crypt64((C[31] << 8) | C[30], 3);
}

export function sha256crypt(password: string, setting: string): string {
  const { rounds, roundsCustom, salt } = parseSetting(setting);
  const key = Buffer.from(password, "utf8");
  const saltBytes = Buffer.from(salt, "utf8");
  const B = sha256(key, saltBytes, key);
  const A = digestA(key, saltBytes, B);
  const P = repeatTo(sha256Repeated(key, key.length), key.length);
  const S = repeatTo(sha256Repeated(saltBytes, 16 + A[0]), saltBytes.length);
  const C = stretch(A, P, S, rounds);
  return `$5$${roundsCustom ? `rounds=${rounds}$` : ""}${salt}$${encodeDigest(C)}`;
}

// 256 es múltiplo de 64, así que byte & 63 reparte los 64 símbolos sin sesgo.
const randomSalt = () => Array.from(randomBytes(SALT_MAX_CHARS), (byte) => CRYPT64[byte & 63]).join("");

export const sha256cryptScheme = defineScheme({
  id: "sha256crypt",
  pattern: /^(\$5\$)(rounds=\d+\$)?([^$]{1,16}\$)([./0-9A-Za-z]{43})$/,
  hash: async (password) => sha256crypt(password, `$5$rounds=${SHA256CRYPT_ROUNDS}$${randomSalt()}`),
  verify: async (record, password) => safeEqual(Buffer.from(sha256crypt(password, record)), Buffer.from(record)),
});
