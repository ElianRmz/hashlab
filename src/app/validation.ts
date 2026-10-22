// Usa imports relativos .ts porque node --test y next.config.ts cargan este módulo.
import { DIGEST_ALGOS, PASSWORD_ALGOS, type DigestAlgoId, type PasswordAlgoId } from "../hash/algorithms.ts";
import { BCRYPT_MAX_PASSWORD_BYTES, RSA_MODULUS_BITS } from "../hash/params.ts";
import type { ActionError, ActionResult, FieldName } from "./action-types.ts";

export const LIMITS = {
  text: { min: 1, max: 100_000 },
  message: { min: 1, max: 10_000 },
  username: { min: 3, max: 32 },
  password: { min: 8, max: 128 },
  bcryptBytes: BCRYPT_MAX_PASSWORD_BYTES,
  fileBytes: { min: 1, max: 5_000_000 },
  signatureBytes: RSA_MODULUS_BITS / 8,
} as const;

const USERNAME_PATTERN = /^[a-zA-Z0-9._-]+$/;
const SIGNATURE_CHARS = 4 * Math.ceil(LIMITS.signatureBytes / 3);
const FILE_RANGE = `${LIMITS.fileBytes.min} byte a ${LIMITS.fileBytes.max / 1_000_000} MB`;
export const FILE_HINT = `Elige o arrastra un archivo aquí · ${FILE_RANGE}`;

export type Content = { mode: "text"; text: string } | { mode: "file"; file: File };

const valid = <T>(data: T): ActionResult<T> => ({ ok: true, data });
const invalid = (field: FieldName, error: string): ActionError => ({ ok: false, error, field });
const codePoints = (value: string) => [...value].length;
const normalizeLineBreaks = (value: unknown) => typeof value === "string" ? value.replace(/\r\n/g, "\n") : value;
const number = (value: number) => value.toLocaleString("es-MX");

function oneOf<K extends string>(table: Record<K, unknown>, value: unknown): value is K {
  return typeof value === "string" && Object.hasOwn(table, value);
}

function bounded(value: unknown, field: FieldName, { min, max }: { min: number; max: number }, error: string): ActionResult<string> {
  if (typeof value !== "string") return invalid(field, error);
  const length = codePoints(value);
  return length >= min && length <= max ? valid(value) : invalid(field, error);
}

export function parseDigestAlgo(value: unknown): ActionResult<DigestAlgoId> {
  return oneOf(DIGEST_ALGOS, value) ? valid(value) : invalid("algo", "Selecciona un algoritmo hash válido");
}

export function parsePasswordAlgo(value: unknown): ActionResult<PasswordAlgoId> {
  return oneOf(PASSWORD_ALGOS, value) ? valid(value) : invalid("algo", "Selecciona un algoritmo de contraseña válido");
}

export function parseText(value: unknown): ActionResult<string> {
  const { min, max } = LIMITS.text;
  return bounded(normalizeLineBreaks(value), "text", LIMITS.text, `Escribe entre ${number(min)} y ${number(max)} caracteres`);
}

export function parseMessage(value: unknown): ActionResult<string> {
  const { min, max } = LIMITS.message;
  return bounded(normalizeLineBreaks(value), "message", LIMITS.message, `Escribe entre ${number(min)} y ${number(max)} caracteres`);
}

export function parseUsername(value: unknown): ActionResult<string> {
  const { min, max } = LIMITS.username;
  const error = `Usa de ${min} a ${max} caracteres: letras, números, punto, guion o guion bajo`;
  const username = bounded(value, "username", LIMITS.username, error);
  return username.ok && !USERNAME_PATTERN.test(username.data) ? invalid("username", error) : username;
}

export function parsePassword(value: unknown): ActionResult<string> {
  const { min, max } = LIMITS.password;
  return bounded(value, "password", LIMITS.password, `La contraseña debe tener entre ${min} y ${max} caracteres`);
}

export function parseNewPassword(value: unknown, algo: PasswordAlgoId): ActionResult<string> {
  const password = parsePassword(value);
  if (password.ok && algo === "bcrypt" && new TextEncoder().encode(password.data).length > LIMITS.bcryptBytes) {
    return invalid("password", `Usa como máximo ${LIMITS.bcryptBytes} bytes UTF-8: bcrypt ignora lo que pase de ${LIMITS.bcryptBytes} bytes`);
  }
  return password;
}

export function parseReference(value: unknown, algo: DigestAlgoId): ActionResult<string | null> {
  if (value === null) return valid(null);
  const { label, bits } = DIGEST_ALGOS[algo];
  const hex = typeof value === "string" ? value.trim().toLowerCase() : "";
  return /^[0-9a-f]+$/.test(hex) && hex.length === bits / 4
    ? valid(hex)
    : invalid("reference", `No es un hash ${label} válido (se esperan ${bits / 4} caracteres hex)`);
}

export function parseSignature(value: unknown): ActionResult<string> {
  if (typeof value === "string" && value.length === SIGNATURE_CHARS && /^[A-Za-z0-9+/]+={0,2}$/.test(value)) {
    const bytes = atob(value);
    if (bytes.length === LIMITS.signatureBytes && btoa(bytes) === value) return valid(value);
  }
  return invalid("signature", `Introduce una firma base64 de ${SIGNATURE_CHARS} caracteres (${LIMITS.signatureBytes} bytes)`);
}

export function parseFile(value: unknown): ActionResult<File> {
  if (!(value instanceof File)) return invalid("file", `Elige un archivo de ${FILE_RANGE}`);
  const { min, max } = LIMITS.fileBytes;
  return value.size >= min && value.size <= max ? valid(value) : invalid("file", `El archivo debe pesar de ${FILE_RANGE}`);
}

export function parseContent(mode: unknown, text: unknown, file: unknown): ActionResult<Content> {
  if (mode === "text") {
    const parsed = parseText(text);
    return parsed.ok ? valid({ mode, text: parsed.data }) : parsed;
  }
  if (mode === "file") {
    const parsed = parseFile(file);
    return parsed.ok ? valid({ mode, file: parsed.data }) : parsed;
  }
  return invalid("mode", "Selecciona texto o archivo");
}
