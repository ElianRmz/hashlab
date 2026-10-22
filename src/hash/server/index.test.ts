import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { DigestAlgoId } from "../algorithms.ts";
import { digest } from "./index.ts";

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
