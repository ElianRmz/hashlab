import "server-only";
import {
  constants,
  createHash,
  generateKeyPairSync,
  sign as rsaSign,
  verify as rsaVerify,
  type KeyObject,
} from "node:crypto";
import type { DigestAlgoId } from "../algorithms.ts";
import type { PublicKeyInfo, SignResult, VerifyResult } from "../contract.ts";
import { RSA_MODULUS_BITS } from "../params.ts";
import { digest } from "./digest.ts";

type KeyPair = { privateKey: KeyObject; publicKey: KeyObject; info: PublicKeyInfo };

// Next dev vuelve a evaluar este módulo en cada hot reload; globalThis sobrevive,
// así que una firma emitida antes del reload sigue verificando después.
declare global {
  var hashLabKeyPair: KeyPair | undefined;
}

function keyPair(): KeyPair {
  return (globalThis.hashLabKeyPair ??= generateKeyPair());
}

function generateKeyPair(): KeyPair {
  const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: RSA_MODULUS_BITS });
  const spkiDer = publicKey.export({ type: "spki", format: "der" });
  return {
    privateKey,
    publicKey,
    info: {
      scheme: "RSA-PSS",
      modulusBits: RSA_MODULUS_BITS,
      publicKeyPem: publicKey.export({ type: "spki", format: "pem" }).toString(),
      fingerprintSha256: createHash("sha256").update(spkiDer).digest("hex"),
    },
  };
}

const pss = (key: KeyObject) => ({
  key,
  padding: constants.RSA_PKCS1_PSS_PADDING,
  saltLength: constants.RSA_PSS_SALTLEN_DIGEST,
});

export function publicKey(): PublicKeyInfo {
  return keyPair().info;
}

export function sign(algo: DigestAlgoId, message: string): SignResult {
  const { privateKey, info } = keyPair();
  const data = Buffer.from(message, "utf8");
  const start = performance.now();
  const signature = rsaSign(algo, data, pss(privateKey));
  const ms = performance.now() - start;
  return { algo, digestHex: digest(algo, data).hex, signatureB64: signature.toString("base64"), publicKey: info, ms };
}

export function verify(algo: DigestAlgoId, message: string, signatureB64: string): VerifyResult {
  const { publicKey } = keyPair();
  const data = Buffer.from(message, "utf8");
  const signature = Buffer.from(signatureB64, "base64");
  const start = performance.now();
  const valid = rsaVerify(algo, data, pss(publicKey), signature);
  const ms = performance.now() - start;
  return { valid, digestHex: digest(algo, data).hex, ms };
}
