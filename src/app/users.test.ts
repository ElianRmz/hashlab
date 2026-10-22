import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { PasswordAlgoId } from "../hash/algorithms.ts";
import { authenticate as authenticateUser, register } from "./users.ts";

const PASSWORD = "Cazador2026!";
const WRONG = "Incorrecta2026!";
const T0 = Date.UTC(2026, 9, 22, 12);
const authenticate = (username: string, password: string, now = T0) =>
  authenticateUser(username, password, { now: () => now, failureFloorMs: 0 });

const SCHEMES: PasswordAlgoId[] = ["bcrypt", "sha256crypt", "pbkdf2"];

async function registered(username: string, algo: PasswordAlgoId, password = PASSWORD): Promise<string> {
  assert.equal((await register(username, algo, password)).kind, "registered");
  return username;
}

async function fail(username: string, times: number, now: number) {
  for (let attempt = 0; attempt < times; attempt++) await authenticate(username, WRONG, now);
}

describe("authenticate", () => {
  it("aplica el suelo por defecto a un fallo y permite inyectar otro suelo", async () => {
    const name = await registered("suelo.pbkdf2", "pbkdf2");
    let start = performance.now();
    assert.deepEqual(await authenticateUser(name, WRONG), { kind: "denied" });
    assert.ok(performance.now() - start >= 600, "el fallo terminó antes del suelo de 600 ms");

    start = performance.now();
    assert.deepEqual(await authenticateUser(name, WRONG, { failureFloorMs: 700 }), { kind: "denied" });
    assert.ok(performance.now() - start >= 700, "el fallo ignoró el suelo inyectado");
  });

  it("aplica el suelo a desconocidos y a intentos bloqueados incluso con contraseña correcta", async () => {
    const name = await registered("suelo.bloqueado", "pbkdf2");
    await fail(name, 5, T0);
    for (const [username, password, kind] of [
      ["suelo.desconocido", WRONG, "denied"],
      [name, WRONG, "locked"],
      [name, PASSWORD, "locked"],
    ]) {
      const start = performance.now();
      const outcome = await authenticateUser(username, password, { now: () => T0, failureFloorMs: 500 });
      assert.equal(outcome.kind, kind);
      assert.ok(performance.now() - start >= 500, `${kind} terminó antes del suelo`);
    }
  });

  it("lee el reloj para el bloqueo después de verificar la contraseña", async () => {
    const name = await registered("reloj.verificacion", "pbkdf2");
    await fail(name, 5, T0);
    const start = performance.now();
    const outcome = await authenticateUser(name, PASSWORD, {
      now: () => T0 + (performance.now() - start >= 20 ? 30_000 : 29_999),
      failureFloorMs: 0,
    });
    assert.equal(outcome.kind, "granted", "se usó la hora anterior a la verificación");
  });

  it("descarta fallos inactivos y reinicia su contador después de lockMs", async () => {
    const name = "inactivo.contador";
    await fail(name, 4, T0);
    assert.deepEqual(await authenticate(name, WRONG, T0 + 30_000), { kind: "denied" });
    await fail(name, 3, T0 + 30_000);
    assert.equal((await authenticate(name, WRONG, T0 + 30_000)).kind, "locked");
  });

  it("podar el mapa elimina entradas vencidas de otros usuarios y conserva las activas", async () => {
    await authenticate("poda.inactivo", WRONG, T0);
    await fail("poda.vencido", 5, T0);
    await fail("poda.activo", 5, T0 + 1);
    await authenticate("poda.reciente", WRONG, T0 + 1);
    await authenticate("poda.disparador", WRONG, T0 + 30_000);
    const failures = globalThis.hashLabStore!.failures;
    assert.equal(failures.has("poda.inactivo"), false);
    assert.equal(failures.has("poda.vencido"), false);
    assert.equal(failures.has("poda.activo"), true);
    assert.equal(failures.has("poda.reciente"), true);
    assert.deepEqual(await authenticate("poda.activo", WRONG, T0 + 30_000), { kind: "locked", until: T0 + 30_001 });
  });
  it("un fallo de un usuario conocido de cualquier esquema es idéntico al de uno desconocido", async () => {
    const unknown = await authenticate("nadie.registrado", WRONG, T0);
    assert.deepEqual(unknown, { kind: "denied" });
    for (const algo of SCHEMES) {
      const name = await registered(`conocido.${algo}`, algo);
      assert.deepEqual(await authenticate(name, WRONG, T0), unknown);
      const granted = await authenticate(name.toUpperCase(), PASSWORD, T0);
      assert.ok(granted.kind === "granted" && granted.algo === algo && granted.ms > 0);
    }
  });

  it("bloquea al quinto fallo, exista o no el usuario", async () => {
    const known = await registered("bloqueo.conocido", "pbkdf2");
    const locked = { kind: "locked", until: T0 + 30_000 };
    for (const name of [known, "bloqueo.desconocido"]) {
      for (let attempt = 1; attempt <= 4; attempt++) assert.deepEqual(await authenticate(name, WRONG, T0), { kind: "denied" });
      assert.deepEqual(await authenticate(name, WRONG, T0), locked);
      assert.deepEqual(await authenticate(name, WRONG, T0 + 1), locked);
    }
    assert.deepEqual(await authenticate(known, PASSWORD, T0 + 29_999), locked);
  });

  it("un intento bloqueado cuesta una verificación completa", async () => {
    const name = "bloqueo.costo";
    let start = performance.now();
    await authenticate(name, WRONG, T0);
    const deniedMs = performance.now() - start;
    await fail(name, 4, T0);
    start = performance.now();
    assert.equal((await authenticate(name, WRONG, T0)).kind, "locked");
    const lockedMs = performance.now() - start;
    assert.ok(lockedMs > deniedMs / 2, `bloqueado ${lockedMs.toFixed(0)} ms, denegado ${deniedMs.toFixed(0)} ms`);
  });

  it("un acceso correcto reinicia la cuenta de fallos", async () => {
    const name = await registered("reinicio", "pbkdf2");
    await fail(name, 4, T0);
    assert.equal((await authenticate(name, PASSWORD, T0)).kind, "granted");
    for (let attempt = 1; attempt <= 4; attempt++) assert.deepEqual(await authenticate(name, WRONG, T0), { kind: "denied" });
    assert.equal((await authenticate(name, WRONG, T0)).kind, "locked");
  });

  it("el bloqueo vence a los 30 s y la cuenta empieza de cero", async () => {
    const known = await registered("vence", "pbkdf2");
    for (const name of [known, "vence.desconocido"]) {
      await fail(name, 5, T0);
      assert.equal((await authenticate(name, WRONG, T0 + 29_999)).kind, "locked");
      assert.deepEqual(await authenticate(name, WRONG, T0 + 30_000), { kind: "denied" });
    }
    assert.equal((await authenticate(known, PASSWORD, T0 + 30_000)).kind, "granted");
  });

  it("bcrypt deniega una entrada de más de 72 bytes aunque empiece con la contraseña", async () => {
    const password = "a".repeat(72);
    const name = await registered("largo.bcrypt", "bcrypt", password);
    assert.equal((await authenticate(name, password, T0)).kind, "granted");
    assert.deepEqual(await authenticate(name, password + "a", T0), { kind: "denied" });
    assert.deepEqual(await authenticate("largo.desconocido", password + "a", T0), { kind: "denied" });
  });

  it("no registra dos veces el mismo usuario, sin importar mayúsculas", async () => {
    await registered("Repetido", "pbkdf2");
    assert.deepEqual(await register("repetido", "pbkdf2", PASSWORD), { kind: "taken" });
  });
});
