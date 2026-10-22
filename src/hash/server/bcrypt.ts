import "server-only";
import { compare, hash } from "bcryptjs";
import { BCRYPT_COST, BCRYPT_MAX_PASSWORD_BYTES } from "../params.ts";
import { defineScheme } from "./scheme.ts";

const fits = (password: string) => Buffer.byteLength(password, "utf8") <= BCRYPT_MAX_PASSWORD_BYTES;

export const bcryptScheme = defineScheme({
  id: "bcrypt",
  pattern: /^(\$2[aby]\$)(\d{2}\$)([./A-Za-z0-9]{22})([./A-Za-z0-9]{31})$/,
  hash(password) {
    if (!fits(password)) {
      throw new RangeError(
        `bcrypt solo usa los primeros ${BCRYPT_MAX_PASSWORD_BYTES} bytes; la contraseña mide ${Buffer.byteLength(password, "utf8")} bytes UTF-8`,
      );
    }
    return hash(password, BCRYPT_COST);
  },
  verify: (record, password) => (fits(password) ? compare(password, record) : Promise.resolve(false)),
});
