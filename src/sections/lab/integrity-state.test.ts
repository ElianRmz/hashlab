import assert from "node:assert/strict";
import { it } from "node:test";
import { integrityState, type IntegrityOutcome } from "./integrity-state.ts";

it("oculta el veredicto al reemplazar un archivo con los mismos metadatos", async () => {
  const a = new File(["aaaa"], "same.bin", { lastModified: 1_700_000_000_000 });
  const b = new File(["bbbb"], a.name, { lastModified: a.lastModified });
  assert.equal(a.size, b.size);
  assert.notEqual(await a.text(), await b.text());
  const outcome: IntegrityOutcome = {
    input: { mode: "file", file: a }, reference: "referencia",
    result: { hash: { algo: "sha256", hex: "referencia", inputBytes: 4, ms: 1 }, matches: true },
  };
  assert.deepEqual(integrityState(outcome, { mode: "file", file: a }, "sha256", "referencia"), { current: true, matches: true });
  assert.deepEqual(integrityState(outcome, { mode: "file", file: b }, "sha256", "referencia"), { current: false, matches: null });
});

it("compara el texto por su valor y exige el mismo algoritmo y referencia", () => {
  const outcome: IntegrityOutcome = {
    input: { mode: "text", text: "abc" }, reference: "referencia",
    result: { hash: { algo: "sha256", hex: "referencia", inputBytes: 3, ms: 1 }, matches: true },
  };
  assert.deepEqual(integrityState(outcome, { mode: "text", text: "abc" }, "sha256", "referencia"), { current: true, matches: true });
  assert.equal(integrityState(outcome, { mode: "text", text: "abcd" }, "sha256", "referencia").matches, null);
  assert.equal(integrityState(outcome, { mode: "text", text: "abc" }, "sha512", "referencia").matches, null);
  assert.equal(integrityState(outcome, { mode: "text", text: "abc" }, "sha256", "otra").matches, null);
});
