import type { DigestAlgo, PasswordAlgoId } from "./algorithms";

// Datos falsos y deterministas para el prototipo visual. Se reemplazan por node:crypto y bcrypt al integrar.

const HEX = "0123456789abcdef";
const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
const CRYPT64 = "./0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

function stream(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return () => {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    return (h >>> 0) / 4294967296;
  };
}

function draw(seed: string, alphabet: string, length: number) {
  const next = stream(seed);
  return Array.from({ length }, () => alphabet[Math.floor(next() * alphabet.length)]).join("");
}

export const randomSalt = (length: number) => draw(String(Math.random()), CRYPT64, length);

export const demoDigest = (input: string, algo: DigestAlgo) => draw(`${algo.id}:${input}`, HEX, algo.bits / 4);

export const demoSignature = (digest: string) => draw(`sig:${digest}`, B64, 342) + "==";

export type RecordPart = { role: "algoritmo" | "costo" | "sal" | "hash"; text: string };

export function demoPasswordRecord(algo: PasswordAlgoId, password: string, salt: string): RecordPart[] {
  switch (algo) {
    case "bcrypt":
      return [
        { role: "algoritmo", text: "$2b$" },
        { role: "costo", text: "12$" },
        { role: "sal", text: salt.slice(0, 22) },
        { role: "hash", text: draw(`bc:${salt}:${password}`, CRYPT64, 31) },
      ];
    case "sha256crypt":
      return [
        { role: "algoritmo", text: "$5$" },
        { role: "costo", text: "rounds=5000$" },
        { role: "sal", text: salt.slice(0, 16) + "$" },
        { role: "hash", text: draw(`s5:${salt}:${password}`, CRYPT64, 43) },
      ];
    case "pbkdf2":
      return [
        { role: "algoritmo", text: "pbkdf2_sha256$" },
        { role: "costo", text: "600000$" },
        { role: "sal", text: salt.slice(0, 22) + "$" },
        { role: "hash", text: draw(`pb:${salt}:${password}`, B64, 43) + "=" },
      ];
  }
}

export const recordHash = (parts: RecordPart[]) => parts.find((p) => p.role === "hash")!.text;
