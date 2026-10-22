import assert from "node:assert/strict";
import { createHash, createPublicKey, randomBytes } from "node:crypto";
import { describe, it } from "node:test";
import type { DigestAlgoId } from "../algorithms.ts";
import { RSA_MODULUS_BITS } from "../params.ts";
import { digest, publicKey, sign, verify } from "./index.ts";

const DIGEST_ALGOS: DigestAlgoId[] = ["sha256", "sha384", "sha512"];

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
