import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { describe, it } from "node:test";
import type { DigestAlgoId } from "../hash/algorithms.ts";
import type { ActionResult, FieldName } from "./action-types.ts";
import {
  parseContent,
  parseDigestAlgo,
  parseFile,
  parseMessage,
  parseNewPassword,
  parsePassword,
  parsePasswordAlgo,
  parseReference,
  parseSignature,
  parseText,
  parseUsername,
} from "./validation.ts";

function accepted<T>(result: ActionResult<T>): T {
  assert.ok(result.ok, `se rechazó un valor válido: ${result.ok || result.error}`);
  return result.data;
}

function rejected(result: ActionResult<unknown>, field: FieldName): string {
  assert.ok(!result.ok, "se aceptó un valor inválido");
  assert.equal(result.field, field);
  return result.error;
}

const bytes = (size: number) => new File([new Uint8Array(size)], "datos.bin");

describe("algoritmos", () => {
  it("hash: solo sha256, sha384 y sha512", () => {
    for (const id of ["sha256", "sha384", "sha512"]) assert.equal(accepted(parseDigestAlgo(id)), id);
    for (const value of ["md5", "SHA256", "", "toString", "__proto__", null, 256]) rejected(parseDigestAlgo(value), "algo");
  });

  it("contraseña: solo bcrypt, sha256crypt y pbkdf2", () => {
    for (const id of ["bcrypt", "sha256crypt", "pbkdf2"]) assert.equal(accepted(parsePasswordAlgo(id)), id);
    for (const value of ["scrypt", "BCRYPT", "constructor", null]) rejected(parsePasswordAlgo(value), "algo");
  });
});

describe("texto y mensaje", () => {
  it("texto: de 1 a 100 000 puntos de código", () => {
    accepted(parseText("a"));
    accepted(parseText("a".repeat(100_000)));
    accepted(parseText("🔐".repeat(100_000)));
    for (const value of ["", "a".repeat(100_001), "🔐".repeat(100_001), null, bytes(3)]) rejected(parseText(value), "text");
  });

  it("mensaje para firmar: de 1 a 10 000 puntos de código", () => {
    accepted(parseMessage("a"));
    accepted(parseMessage("ñ".repeat(10_000)));
    accepted(parseMessage("🔐".repeat(10_000)));
    for (const value of ["", "a".repeat(10_001), "🔐".repeat(10_001), null]) rejected(parseMessage(value), "message");
  });
});

describe("usuario", () => {
  it("de 3 a 32 letras, números, punto, guion o guion bajo", () => {
    for (const name of ["abc", "a".repeat(32), "elian.ramirez", "A_b-9.z"]) assert.equal(accepted(parseUsername(name)), name);
    for (const value of ["ab", "a".repeat(33), "ñandú", "con espacio", "abc\n", "", null]) rejected(parseUsername(value), "username");
  });
});

describe("contraseña", () => {
  it("de 8 a 128 puntos de código", () => {
    for (const password of ["a".repeat(8), "a".repeat(128), "🔐".repeat(128)]) accepted(parsePassword(password));
    for (const value of ["a".repeat(7), "🔐".repeat(4), "a".repeat(129), "🔐".repeat(129), null]) rejected(parsePassword(value), "password");
  });

  it("al registrar con bcrypt además cabe en 72 bytes UTF-8", () => {
    for (const password of ["a".repeat(72), "é".repeat(36), "🔐".repeat(18)]) accepted(parseNewPassword(password, "bcrypt"));
    for (const password of ["a".repeat(73), "é".repeat(37), "🔐".repeat(19), "a".repeat(7)]) rejected(parseNewPassword(password, "bcrypt"), "password");
  });

  it("sha256crypt y pbkdf2 no tienen límite de bytes", () => {
    for (const algo of ["sha256crypt", "pbkdf2"] as const) {
      accepted(parseNewPassword("a".repeat(128), algo));
      accepted(parseNewPassword("é".repeat(100), algo));
      rejected(parseNewPassword("a".repeat(129), algo), "password");
    }
  });
});

describe("hash de referencia", () => {
  const lengths: Record<DigestAlgoId, number> = { sha256: 64, sha384: 96, sha512: 128 };

  it("ausente significa que no hay comparación", () => {
    assert.equal(accepted(parseReference(null, "sha256")), null);
  });

  for (const [algo, length] of Object.entries(lengths) as [DigestAlgoId, number][]) {
    it(`${algo}: ${length} caracteres hex, sin importar mayúsculas ni espacios`, () => {
      const hex = "0123456789abcdef".repeat(8).slice(0, length);
      assert.equal(accepted(parseReference(hex, algo)), hex);
      assert.equal(accepted(parseReference(`  ${hex.toUpperCase()}\n`, algo)), hex);
      for (const value of ["", hex.slice(1), hex + "a", "g" + hex.slice(1), 42]) rejected(parseReference(value, algo), "reference");
    });
  }
});

describe("firma", () => {
  const signature = randomBytes(256).toString("base64");
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

  it("acepta base64 canónico de 256 bytes, que mide 344 caracteres", () => {
    assert.equal(signature.length, 344);
    assert.equal(accepted(parseSignature(signature)), signature);
  });

  it("rechaza otro tamaño, otro alfabeto o una codificación no canónica", () => {
    const lastData = signature.at(-3)!;
    const nonCanonical = signature.slice(0, -3) + alphabet[alphabet.indexOf(lastData) ^ 1] + "==";
    const invalid = [
      randomBytes(255).toString("base64"),
      randomBytes(257).toString("base64"),
      randomBytes(258).toString("base64"),
      nonCanonical,
      signature + "\n",
      " " + signature.slice(1),
      "*" + signature.slice(1),
      "-" + signature.slice(1),
      "",
      null,
    ];
    for (const value of invalid) assert.match(rejected(parseSignature(value), "signature"), /344 caracteres/);
  });
});

describe("archivo", () => {
  it("de 1 byte a 5 000 000 bytes, que son 5 MB", () => {
    accepted(parseFile(bytes(1)));
    accepted(parseFile(bytes(5_000_000)));
    assert.match(rejected(parseFile(bytes(5_000_001)), "file"), /5 MB/);
    for (const value of [bytes(0), null, "datos.bin"]) rejected(parseFile(value), "file");
  });
});

describe("contenido a hashear", () => {
  it("texto o archivo según el modo", () => {
    assert.deepEqual(accepted(parseContent("text", "abc", null)), { mode: "text", text: "abc" });
    const file = bytes(3);
    assert.deepEqual(accepted(parseContent("file", null, file)), { mode: "file", file });
    rejected(parseContent("text", "", null), "text");
    rejected(parseContent("file", null, null), "file");
    rejected(parseContent("url", "abc", file), "mode");
    rejected(parseContent(null, "abc", file), "mode");
  });
});
