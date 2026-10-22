import assert from "node:assert/strict";
import { createHash, createPublicKey, randomBytes } from "node:crypto";
import { describe, it } from "node:test";
import type { DigestAlgoId, PasswordAlgoId } from "../algorithms.ts";
import { BCRYPT_COST, BCRYPT_MAX_PASSWORD_BYTES, PBKDF2, RSA_MODULUS_BITS, SHA256CRYPT_ROUNDS } from "../params.ts";
import { digest, hashPassword, publicKey, sign, splitRecord, verify, verifyPassword } from "./index.ts";

const DIGEST_ALGOS: DigestAlgoId[] = ["sha256", "sha384", "sha512"];
const PASSWORD_ALGOS: PasswordAlgoId[] = ["bcrypt", "sha256crypt", "pbkdf2"];
const ROLES = ["algoritmo", "costo", "sal", "hash"];

const utf8 = (text: string) => new TextEncoder().encode(text);

describe("digest", () => {
  const abc: Record<DigestAlgoId, string> = {
    sha256: "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    sha384:
      "cb00753f45a35e8bb5a03d699ac65007272c32ab0eded1631a8b605a43ff5bed8086072ba1e7cc2358baeca134c825a7",
    sha512:
      "ddaf35a193617abacc417349ae20413112e6fa4e89a97ea20a9eeee64b55d39a2192992a274fc1a836ba3c23a3feebbd454d4423643ce80e2a9ac94fa54ca49f",
  };

  for (const [algo, hex] of Object.entries(abc) as [DigestAlgoId, string][]) {
    it(`${algo}("abc") coincide con FIPS 180-4`, () => {
      const result = digest(algo, utf8("abc"));
      assert.equal(result.hex, hex);
      assert.equal(result.algo, algo);
      assert.equal(result.inputBytes, 3);
      assert.ok(result.ms >= 0);
    });
  }

  it("cuenta los bytes UTF-8, no los caracteres", () => {
    assert.equal(digest("sha256", utf8("ñandú")).inputBytes, 7);
  });
});

describe("firmas RSA-PSS", () => {
  const message = "Acta de la reunión del 22 de octubre";

  for (const algo of DIGEST_ALGOS) {
    it(`${algo}: firmar y verificar el mismo mensaje`, () => {
      const signed = sign(algo, message);
      const checked = verify(algo, message, signed.signatureB64);
      assert.equal(checked.valid, true);
      assert.equal(signed.algo, algo);
      assert.equal(signed.digestHex, digest(algo, utf8(message)).hex);
      assert.equal(checked.digestHex, signed.digestHex);
      assert.equal(Buffer.from(signed.signatureB64, "base64").length, RSA_MODULUS_BITS / 8);
      assert.ok(signed.ms > 0 && checked.ms > 0);
    });
  }

  it("un mensaje alterado no verifica", () => {
    const signed = sign("sha256", message);
    assert.equal(verify("sha256", message + ".", signed.signatureB64).valid, false);
    assert.equal(verify("sha384", message, signed.signatureB64).valid, false);
  });

  it("una firma basura devuelve valid:false sin lanzar", () => {
    const garbage = ["", "AAAA", "¡esto no es base64!", randomBytes(256).toString("base64"), randomBytes(7).toString("base64")];
    for (const signatureB64 of garbage) {
      const checked = verify("sha256", message, signatureB64);
      assert.equal(checked.valid, false);
      assert.equal(checked.digestHex, digest("sha256", utf8(message)).hex);
    }
  });

  it("publicKey expone el PEM SPKI y la huella SHA-256 del DER", () => {
    const info = publicKey();
    assert.equal(info.scheme, "RSA-PSS");
    assert.equal(info.modulusBits, RSA_MODULUS_BITS);
    assert.match(info.publicKeyPem, /^-----BEGIN PUBLIC KEY-----\n[\s\S]+-----END PUBLIC KEY-----\n$/);
    const der = createPublicKey(info.publicKeyPem).export({ type: "spki", format: "der" });
    assert.equal(info.fingerprintSha256, createHash("sha256").update(der).digest("hex"));
    assert.deepEqual(sign("sha256", message).publicKey, info);
  });

  it("el par de llaves sobrevive a una reevaluación del módulo", async () => {
    const reloaded = await import("./signatures.ts?reload=" + Date.now());
    assert.equal(reloaded.publicKey().publicKeyPem, publicKey().publicKeyPem);
    assert.equal(reloaded.verify("sha512", message, sign("sha512", message).signatureB64).valid, true);
  });
});

describe("contraseñas", () => {
  const password = "contraseña con ñ y 🔐";

  for (const algo of PASSWORD_ALGOS) {
    it(`${algo}: hashea, verifica, rechaza otra contraseña y reparte el registro`, async () => {
      const hashed = await hashPassword(algo, password);
      assert.equal(hashed.algo, algo);
      assert.ok(hashed.ms > 0);

      const right = await verifyPassword(hashed.record, password);
      assert.deepEqual([right.ok, right.algo], [true, algo]);
      assert.ok(right.ms > 0);
      assert.equal((await verifyPassword(hashed.record, password + "!")).ok, false);
      assert.equal((await verifyPassword(hashed.record, "")).ok, false);

      assert.deepEqual(hashed.parts.map((part) => part.role), ROLES);
      assert.equal(hashed.parts.map((part) => part.text).join(""), hashed.record);
      assert.deepEqual(splitRecord(hashed.record), hashed.parts);
    });
  }

  it("dos hashes de la misma contraseña usan sales distintas", async () => {
    for (const algo of PASSWORD_ALGOS) {
      const [a, b] = await Promise.all([hashPassword(algo, password), hashPassword(algo, password)]);
      assert.notEqual(a.parts[2].text, b.parts[2].text);
    }
  });

  it("bcrypt: $2b$ | 12$ | sal de 22 | hash de 31", async () => {
    const { parts } = await hashPassword("bcrypt", password);
    assert.deepEqual(parts.map((part) => part.text.length), [4, 3, 22, 31]);
    assert.equal(parts[0].text, "$2b$");
    assert.equal(parts[1].text, `${BCRYPT_COST}$`);
  });

  it("sha256crypt: $5$ | rounds=N$ | sal$ | hash de 43 en crypt64", async () => {
    const { parts } = await hashPassword("sha256crypt", password);
    assert.equal(parts[0].text, "$5$");
    assert.equal(parts[1].text, `rounds=${SHA256CRYPT_ROUNDS}$`);
    assert.match(parts[2].text, /^[./0-9A-Za-z]{16}\$$/);
    assert.match(parts[3].text, /^[./0-9A-Za-z]{43}$/);
  });

  it("pbkdf2: pbkdf2_sha256$ | iteraciones$ | sal$ | hash en base64", async () => {
    const { parts } = await hashPassword("pbkdf2", password);
    assert.equal(parts[0].text, "pbkdf2_sha256$");
    assert.equal(parts[1].text, `${PBKDF2.iterations}$`);
    assert.equal(Buffer.from(parts[2].text.slice(0, -1), "base64").length, PBKDF2.saltBytes);
    assert.equal(Buffer.from(parts[3].text, "base64").length, PBKDF2.keyBytes);
  });

  it("bcrypt rechaza con RangeError una contraseña de más de 72 bytes", async () => {
    const limit = "a".repeat(BCRYPT_MAX_PASSWORD_BYTES);
    const { record } = await hashPassword("bcrypt", limit);
    assert.equal((await verifyPassword(record, limit)).ok, true);
    await assert.rejects(hashPassword("bcrypt", limit + "a"), RangeError);
    await assert.rejects(hashPassword("bcrypt", "é".repeat(BCRYPT_MAX_PASSWORD_BYTES / 2 + 1)), RangeError);
    assert.equal((await verifyPassword(record, limit + "a")).ok, false);
  });

  it("pbkdf2 verifica con las iteraciones y la sal del registro (RFC 7914 §11)", async () => {
    const vectors: [password: string, salt: string, iterations: number, hex: string][] = [
      [
        "passwd",
        "salt",
        1,
        "55ac046e56e3089fec1691c22544b605f94185216dde0465e68b9d57c20dacbc49ca9cccf179b645991664b39d77ef317c71b845b1e30bd509112041d3a19783",
      ],
      [
        "Password",
        "NaCl",
        80000,
        "4ddcd8f60b98be21830cee5ef22701f9641a4418d04c0414aeff08876b34ab56a1d425a1225833549adb841b51c9b3176a272bdebba1d078478f62b397f33c8d",
      ],
    ];
    for (const [pw, salt, iterations, hex] of vectors) {
      const record = `pbkdf2_sha256$${iterations}$${Buffer.from(salt).toString("base64")}$${Buffer.from(hex, "hex").toString("base64")}`;
      assert.deepEqual(splitRecord(record).map((part) => part.role), ROLES);
      assert.equal((await verifyPassword(record, pw)).ok, true);
      assert.equal((await verifyPassword(record, pw.toLowerCase() + "x")).ok, false);
    }
  });

  it("sha256crypt verifica registros de la especificación, con y sin rounds=", async () => {
    const plain = "$5$saltstring$5B8vYYiY.CVt1RlTTf8KbXBH3hsxY/GNooZaBBGWEc5";
    assert.equal((await verifyPassword(plain, "Hello world!")).ok, true);
    assert.equal((await verifyPassword(plain, "Hello world")).ok, false);
    assert.deepEqual(splitRecord(plain).map((part) => part.text), ["$5$", "", "saltstring$", "5B8vYYiY.CVt1RlTTf8KbXBH3hsxY/GNooZaBBGWEc5"]);

    const clamped = "$5$rounds=1000$roundstoolow$yfvwcWrQ8l/K0DAWyuPMDNHpIVlTQebY9l/gL972bIC";
    assert.equal((await verifyPassword(clamped, "the minimum number is still observed")).ok, true);
    const unclamped = clamped.replace("rounds=1000", "rounds=10");
    assert.equal((await verifyPassword(unclamped, "the minimum number is still observed")).ok, false);
  });

  it("un registro de formato desconocido lanza", async () => {
    await assert.rejects(verifyPassword("$1$md5$abc", password), /formato/);
    assert.throws(() => splitRecord("hola"), /formato/);
  });
});
