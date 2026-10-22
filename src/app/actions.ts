"use server";

import type { SignResult, VerifyResult } from "@/hash/contract";
import { digest, sign, verify } from "@/hash/server";
import type { ActionError, FieldName, ActionResult, IntegrityResult, LoginResult, RegistrationResult } from "./action-types";
import { authenticate, register, userViews, type AuthOutcome, type UserView } from "./users";
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
  type Content,
} from "./validation";

function fail(error: string, field?: FieldName): ActionError {
  return { ok: false, error, field };
}

async function execute<T>(work: () => T | Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await work() };
  } catch {
    return fail("No se pudo completar la operación. Inténtalo de nuevo");
  }
}

async function bytesOf(content: Content): Promise<Uint8Array> {
  return content.mode === "text" ? new TextEncoder().encode(content.text) : new Uint8Array(await content.file.arrayBuffer());
}

export async function digestAction(form: FormData): Promise<ActionResult<IntegrityResult>> {
  const algo = parseDigestAlgo(form.get("algo"));
  if (!algo.ok) return algo;
  const content = parseContent(form.get("mode"), form.get("text"), form.get("file"));
  if (!content.ok) return content;
  const reference = parseReference(form.get("reference"), algo.data);
  if (!reference.ok) return reference;
  return execute(async () => {
    const hash = digest(algo.data, await bytesOf(content.data));
    return { hash, matches: reference.data === null ? null : reference.data === hash.hex };
  });
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

export async function listUsersAction(): Promise<ActionResult<UserView[]>> {
  return execute(userViews);
}

export async function registerAction(form: FormData): Promise<ActionResult<RegistrationResult>> {
  const algo = parsePasswordAlgo(form.get("algo"));
  if (!algo.ok) return algo;
  const username = parseUsername(form.get("username"));
  if (!username.ok) return username;
  const password = parseNewPassword(form.get("password"), algo.data);
  if (!password.ok) return password;
  try {
    const registration = await register(username.data, algo.data, password.data);
    if (registration.kind === "taken") return fail("Este usuario ya está registrado", "username");
    return { ok: true, data: { hash: registration.hash, username: username.data, users: userViews() } };
  } catch {
    return fail("No se pudo registrar el usuario. Inténtalo de nuevo");
  }
}

const LOGIN_MESSAGES: Record<AuthOutcome["kind"], string> = {
  granted: "Acceso concedido",
  denied: "Usuario o contraseña incorrectos",
  locked: "Demasiados intentos fallidos",
};

export async function loginAction(form: FormData): Promise<ActionResult<LoginResult>> {
  const username = parseUsername(form.get("username"));
  if (!username.ok) return username;
  const password = parsePassword(form.get("password"));
  if (!password.ok) return password;
  return execute(async () => {
    const outcome = await authenticate(username.data, password.data);
    return { ...outcome, message: LOGIN_MESSAGES[outcome.kind] };
  });
}
