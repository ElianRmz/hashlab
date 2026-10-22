import "server-only";
import { pbkdf2, randomBytes } from "node:crypto";
import { promisify } from "node:util";
import { PBKDF2 } from "../params.ts";
import { defineScheme, safeEqual } from "./scheme.ts";

const derive = promisify(pbkdf2);

export const pbkdf2Scheme = defineScheme({
  id: "pbkdf2",
  pattern: /^(pbkdf2_sha256\$)(\d+\$)([A-Za-z0-9+/=]+\$)([A-Za-z0-9+/=]+)$/,
  async hash(password) {
    const salt = randomBytes(PBKDF2.saltBytes);
    const key = await derive(password, salt, PBKDF2.iterations, PBKDF2.keyBytes, PBKDF2.digest);
    return `pbkdf2_sha256$${PBKDF2.iterations}$${salt.toString("base64")}$${key.toString("base64")}`;
  },
  async verify(record, password) {
    const [, iterations, salt, hash] = record.split("$");
    const expected = Buffer.from(hash, "base64");
    const key = await derive(password, Buffer.from(salt, "base64"), Number(iterations), expected.length, PBKDF2.digest);
    return safeEqual(key, expected);
  },
});
