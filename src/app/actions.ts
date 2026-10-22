"use server";

import type { DigestResult, PublicKeyInfo, SignResult, VerifyResult } from "@/hash/contract";
import { BCRYPT_MAX_PASSWORD_BYTES } from "@/hash/params";
import { digest, hashPassword, publicKey, sign, splitRecord, verify, verifyPassword } from "@/hash/server";
import type { ActionResult, LoginResult, RegistrationResult, UserView } from "./action-types";
import { LOCKOUT_POLICY, users } from "./users";
import {
  parseContent,
  parseDigestAlgo,
  parseMessage,
  parseNewPassword,
  parsePassword,
  parsePasswordAlgo,
  parseReference,
  parseSignature,
  parseUsername,
} from "./validation";

function fail(error: string): ActionResult<never> {
  return { ok: false, error };
}

async function execute<T>(work: () => T | Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await work() };
  } catch {
    return fail("No se pudo completar la operación. Inténtalo de nuevo");
  }
}

export async function digestAction(form: FormData): Promise<ActionResult<DigestResult>> {
  const algo = parseDigestAlgo(form.get("algo"));
  if (!algo.ok) return algo;
  const content = parseContent(form.get("mode"), form.get("text"), form.get("file"));
  if (!content.ok) return content;
  const { data } = content;
  return execute(async () => digest(algo.data, data.mode === "text" ? new TextEncoder().encode(data.text) : new Uint8Array(await data.file.arrayBuffer())));
}

export async function referenceAction(form: FormData): Promise<ActionResult<{ reference: string; matches: boolean | null }>> {
  const algo = parseDigestAlgo(form.get("algo"));
  if (!algo.ok) return algo;
  const reference = parseReference(form.get("reference") ?? "", algo.data);
  if (!reference.ok) return reference;
  const hex = form.get("hex");
  const expected = reference.data?.length ?? 0;
  if (hex !== null && (typeof hex !== "string" || !/^[0-9a-f]+$/.test(hex) || hex.length !== expected)) {
    return { ok: false, error: "Vuelve a calcular el hash antes de comparar", field: "reference" };
  }
  return { ok: true, data: { reference: reference.data ?? "", matches: hex === null ? null : reference.data === hex } };
}

export async function publicKeyAction(): Promise<ActionResult<PublicKeyInfo>> {
  return execute(publicKey);
}

export async function signAction(form: FormData): Promise<ActionResult<SignResult>> {
  const algo = parseDigestAlgo(form.get("algo"));
  if (!algo.ok) return algo;
  const message = parseMessage(form.get("message"));
  if (!message.ok) return message;
  return execute(() => sign(algo.data, message.data));
}

export async function verifySignatureAction(form: FormData): Promise<ActionResult<VerifyResult>> {
  const algo = parseDigestAlgo(form.get("algo"));
  if (!algo.ok) return algo;
  const message = parseMessage(form.get("message"));
  if (!message.ok) return message;
  const signature = parseSignature(form.get("signature"));
  if (!signature.ok) return signature;
  return execute(() => verify(algo.data, message.data, signature.data));
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
  const parsedAlgo = parsePasswordAlgo(form.get("algo"));
  if (!parsedAlgo.ok) return parsedAlgo;
  const algo = parsedAlgo.data;
  const username = parseUsername(form.get("username"));
  if (!username.ok) return username;
  const password = parseNewPassword(form.get("password"), algo);
  if (!password.ok) return password;
  const key = username.data.toLowerCase();
  const taken: ActionResult<never> = { ok: false, error: "Este usuario ya está registrado", field: "username" };
  if (users.has(key)) return taken;
  try {
    const hash = await hashPassword(algo, password.data);
    if (users.has(key)) return taken;
    users.set(key, { username: username.data, algo, record: hash.record, createdAt: Date.now(), failedAttempts: 0, lockedUntil: 0 });
    return { ok: true, data: { hash, username: username.data, users: userViews() } };
  } catch {
    return fail("No se pudo registrar el usuario. Inténtalo de nuevo");
  }
}

async function dummyRecord(): Promise<string> {
  // Both known and unknown users await the same cold-start work.
  const dummy = globalThis.hashLabDummyRecord ??= hashPassword("bcrypt", "HashLab-dummy-credential").then((result) => result.record);
  try {
    return await dummy;
  } catch (error) {
    globalThis.hashLabDummyRecord = undefined;
    throw error;
  }
}

export async function loginAction(form: FormData): Promise<ActionResult<LoginResult>> {
  const username = parseUsername(form.get("username"));
  if (!username.ok) return username;
  const password = parsePassword(form.get("password"));
  if (!password.ok) return password;
  const user = users.get(username.data.toLowerCase());
  const locked = (): LoginResult => ({
    kind: "locked", algo: user?.algo ?? "bcrypt", lockedUntil: user?.lockedUntil ?? 0,
    message: "Cuenta bloqueada",
  });
  if (user && user.lockedUntil > Date.now()) return { ok: true, data: locked() };
  if (user && user.lockedUntil !== 0) {
    user.failedAttempts = 0;
    user.lockedUntil = 0;
  }
  return execute(async () => {
    const dummy = await dummyRecord();
    const tooLong = (user?.algo ?? "bcrypt") === "bcrypt" && Buffer.byteLength(password.data, "utf8") > BCRYPT_MAX_PASSWORD_BYTES;
    // bcrypt rejects oversized input immediately, so still do a full verification.
    const result = await verifyPassword(user?.record ?? dummy, tooLong ? "HashLab-rejected-credential" : password.data);
    if (user && user.lockedUntil > Date.now()) return locked();
    const valid = Boolean(user && result.ok && !tooLong);
    if (user) {
      user.failedAttempts = valid ? 0 : user.failedAttempts + 1;
      if (user.failedAttempts >= LOCKOUT_POLICY.maxAttempts) user.lockedUntil = Date.now() + LOCKOUT_POLICY.lockMs;
    }
    return {
      ...result, kind: "verified", ok: valid, lockedUntil: user?.lockedUntil ?? 0,
      message: valid ? "Acceso concedido" : "Usuario o contraseña incorrectos",
    };
  });
}
