"use server";

import { DIGEST_ALGOS, PASSWORD_ALGOS, type DigestAlgoId, type PasswordAlgoId } from "@/hash/algorithms";
import type { DigestResult, PublicKeyInfo, SignResult, VerifyResult } from "@/hash/contract";
import { BCRYPT_MAX_PASSWORD_BYTES } from "@/hash/params";
import { digest, hashPassword, publicKey, sign, splitRecord, verify, verifyPassword } from "@/hash/server";
import type { ActionResult, LoginResult, RegistrationResult, UserView } from "./action-types";
import { LOCKOUT_POLICY, users } from "./users";

function isDigestAlgo(value: unknown): value is DigestAlgoId {
  return typeof value === "string" && Object.hasOwn(DIGEST_ALGOS, value);
}

function isPasswordAlgo(value: unknown): value is PasswordAlgoId {
  return typeof value === "string" && Object.hasOwn(PASSWORD_ALGOS, value);
}

function fail(error: string, field?: string): ActionResult<never> {
  return { ok: false, error, ...(field ? { field } : {}) };
}

function textInput(value: unknown, max: number, field: string): ActionResult<string> {
  if (typeof value !== "string" || value.length < 1 || value.length > max) {
    return fail(`Escribe entre 1 y ${max.toLocaleString("es-MX")} caracteres`, field);
  }
  return { ok: true, data: value };
}

function usernameInput(value: unknown): ActionResult<string> {
  if (typeof value !== "string" || !/^[a-zA-Z0-9._-]{3,32}$/.test(value)) {
    return fail("Usa de 3 a 32 caracteres: letras, números, punto, guion o guion bajo", "username");
  }
  return { ok: true, data: value };
}

function passwordInput(value: unknown, algo: PasswordAlgoId): ActionResult<string> {
  if (typeof value !== "string" || value.length < 8 || value.length > 128) {
    return fail("La contraseña debe tener entre 8 y 128 caracteres", "password");
  }
  if (algo === "bcrypt" && Buffer.byteLength(value, "utf8") > BCRYPT_MAX_PASSWORD_BYTES) {
    return fail("Usa como máximo 72 bytes UTF-8: bcrypt ignora lo que pase de 72 bytes", "password");
  }
  return { ok: true, data: value };
}

async function execute<T>(work: () => T | Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await work() };
  } catch {
    return fail("No se pudo completar la operación. Inténtalo de nuevo");
  }
}

export async function digestAction(form: FormData): Promise<ActionResult<DigestResult>> {
  const algo = form.get("algo");
  if (!isDigestAlgo(algo)) return fail("Selecciona un algoritmo hash válido", "algo");
  const mode = form.get("mode");
  if (mode === "text") {
    const text = textInput(form.get("text"), 100_000, "text");
    if (!text.ok) return text;
    return execute(() => digest(algo, new TextEncoder().encode(text.data)));
  }
  if (mode !== "file") return fail("Selecciona texto o archivo", "mode");
  const file = form.get("file");
  if (!(file instanceof File) || file.size < 1 || file.size > 5 * 1024 * 1024) {
    return fail("El archivo debe pesar entre 1 byte y 5 MB", "file");
  }
  return execute(async () => digest(algo, new Uint8Array(await file.arrayBuffer())));
}

export async function referenceAction(form: FormData): Promise<ActionResult<{ reference: string; matches: boolean | null }>> {
  const algo = form.get("algo");
  if (!isDigestAlgo(algo)) return fail("Selecciona un algoritmo hash válido", "algo");
  const raw = form.get("reference");
  const reference = typeof raw === "string" ? raw.trim().toLowerCase() : "";
  const expected = DIGEST_ALGOS[algo].bits / 4;
  if (!/^[0-9a-f]+$/.test(reference) || reference.length !== expected) {
    return fail(`No es un hash ${DIGEST_ALGOS[algo].label} válido (se esperan ${expected} caracteres hex)`, "reference");
  }
  const hex = form.get("hex");
  if (hex !== null && (typeof hex !== "string" || !/^[0-9a-f]+$/.test(hex) || hex.length !== expected)) {
    return fail("Vuelve a calcular el hash antes de comparar", "reference");
  }
  return { ok: true, data: { reference, matches: hex === null ? null : reference === hex } };
}

export async function publicKeyAction(): Promise<ActionResult<PublicKeyInfo>> {
  return execute(publicKey);
}

export async function signAction(form: FormData): Promise<ActionResult<SignResult>> {
  const algo = form.get("algo");
  if (!isDigestAlgo(algo)) return fail("Selecciona un algoritmo hash válido", "algo");
  const message = textInput(form.get("message"), 10_000, "message");
  if (!message.ok) return message;
  return execute(() => sign(algo, message.data));
}

export async function verifySignatureAction(form: FormData): Promise<ActionResult<VerifyResult>> {
  const algo = form.get("algo");
  if (!isDigestAlgo(algo)) return fail("Selecciona un algoritmo hash válido", "algo");
  const message = textInput(form.get("message"), 10_000, "message");
  if (!message.ok) return message;
  const signature = form.get("signature");
  if (typeof signature !== "string" || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(signature) || signature.length === 0 || Buffer.from(signature, "base64").toString("base64") !== signature) {
    return fail("Introduce una firma base64 válida", "signature");
  }
  return execute(() => verify(algo, message.data, signature));
}

function userViews(): UserView[] {
  return Array.from(users.values(), ({ username, algo, record, createdAt }) => ({
    username, algo, record, createdAt, parts: splitRecord(record),
  }));
}

export async function listUsersAction(): Promise<ActionResult<UserView[]>> {
  return execute(userViews);
}

export async function registerAction(form: FormData): Promise<ActionResult<RegistrationResult>> {
  const algo = form.get("algo");
  if (!isPasswordAlgo(algo)) return fail("Selecciona un algoritmo de contraseña válido", "algo");
  const username = usernameInput(form.get("username"));
  if (!username.ok) return username;
  const password = passwordInput(form.get("password"), algo);
  if (!password.ok) return password;
  const key = username.data.toLowerCase();
  if (users.has(key)) return fail("Este usuario ya está registrado", "username");
  try {
    const hash = await hashPassword(algo, password.data);
    if (users.has(key)) return fail("Este usuario ya está registrado", "username");
    users.set(key, { username: username.data, algo, record: hash.record, createdAt: Date.now(), failedAttempts: 0, lockedUntil: 0 });
    return { ok: true, data: { hash, username: username.data, users: userViews() } };
  } catch {
    return fail("No se pudo registrar el usuario. Inténtalo de nuevo");
  }
}

export async function loginAction(form: FormData): Promise<ActionResult<LoginResult>> {
  const username = usernameInput(form.get("username"));
  if (!username.ok) return username;
  const user = users.get(username.data.toLowerCase());
  const defaultAlgo = "bcrypt";
  const password = passwordInput(form.get("password"), user?.algo ?? defaultAlgo);
  if (!password.ok) return password;
  const locked = (): ActionResult<LoginResult> => ({ ok: true, data: {
    ok: false, algo: user?.algo ?? defaultAlgo, ms: 0, lockedUntil: user?.lockedUntil ?? 0,
    message: `Cuenta bloqueada. Intenta en ${Math.ceil(((user?.lockedUntil ?? 0) - Date.now()) / 1000)} s`,
  } });
  if (user && user.lockedUntil > Date.now()) return locked();
  if (user && user.lockedUntil !== 0) {
    user.failedAttempts = 0;
    user.lockedUntil = 0;
  }
  return execute(async () => {
    let record = user?.record;
    if (!record) {
      // Reuse the costly dummy so unknown users still perform password verification.
      const dummy = globalThis.hashLabDummyRecord ??= hashPassword(defaultAlgo, "HashLab-dummy-credential").then((result) => result.record);
      try {
        record = await dummy;
      } catch (error) {
        globalThis.hashLabDummyRecord = undefined;
        throw error;
      }
    }
    const result = await verifyPassword(record, password.data);
    if (user && user.lockedUntil > Date.now()) {
      return { ...result, ok: false, lockedUntil: user.lockedUntil, message: `Cuenta bloqueada. Intenta en ${Math.ceil((user.lockedUntil - Date.now()) / 1000)} s` };
    }
    const valid = Boolean(user && result.ok);
    if (user) {
      user.failedAttempts = valid ? 0 : user.failedAttempts + 1;
      if (user.failedAttempts >= LOCKOUT_POLICY.maxAttempts) user.lockedUntil = Date.now() + LOCKOUT_POLICY.lockMs;
    }
    const lockedUntil = user?.lockedUntil ?? 0;
    return { ...result, ok: valid, lockedUntil, message: valid ? "Acceso concedido" : lockedUntil > Date.now() ? `Cuenta bloqueada. Intenta en ${Math.ceil((lockedUntil - Date.now()) / 1000)} s` : "Usuario o contraseña incorrectos" };
  });
}
