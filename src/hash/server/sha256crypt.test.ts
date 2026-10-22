import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { hashPassword } from "./passwords.ts";
import { sha256crypt } from "./sha256crypt.ts";

// Tabla tests2[] de la especificación, copiada textualmente.
const SPEC_VECTORS: [setting: string, input: string, expected: string][] = [
  ["$5$saltstring", "Hello world!", "$5$saltstring$5B8vYYiY.CVt1RlTTf8KbXBH3hsxY/GNooZaBBGWEc5"],
  [
    "$5$rounds=10000$saltstringsaltstring",
    "Hello world!",
    "$5$rounds=10000$saltstringsaltst$3xv.VbSHBb41AL9AvLeujZkZRBAwqFMz2.opqey6IcA",
  ],
  [
    "$5$rounds=5000$toolongsaltstring",
    "This is just a test",
    "$5$rounds=5000$toolongsaltstrin$Un/5jzAHMgOGZ5.mWJpuVolil07guHPvOW8mGRcvxa5",
  ],
  [
    "$5$rounds=1400$anotherlongsaltstring",
    "a very much longer text to encrypt.  This one even stretches over morethan one line.",
    "$5$rounds=1400$anotherlongsalts$Rx.j8H.h8HjEDGomFU8bDkXm3XIUnzyxf12oP84Bnq1",
  ],
  [
    "$5$rounds=77777$short",
    "we have a short salt string but not a short password",
    "$5$rounds=77777$short$JiO1O3ZpDAxGJeaDIuqCoEFysAe1mZNJRs3pw0KQRd/",
  ],
  [
    "$5$rounds=123456$asaltof16chars..",
    "a short string",
    "$5$rounds=123456$asaltof16chars..$gP3VQ/6X7UUEW3HkBn2w1/Ptq2jxPyzV/cZKmF/wJvD",
  ],
  [
    "$5$rounds=10$roundstoolow",
    "the minimum number is still observed",
    "$5$rounds=1000$roundstoolow$yfvwcWrQ8l/K0DAWyuPMDNHpIVlTQebY9l/gL972bIC",
  ],
];

describe("sha256crypt: vectores de la especificación", () => {
  for (const [setting, input, expected] of SPEC_VECTORS) {
    it(setting, async () => {
      assert.equal(await sha256crypt(input, setting), expected);
    });
  }

  it("el registro completo sirve como setting al verificar", async () => {
    for (const [, input, expected] of SPEC_VECTORS) assert.equal(await sha256crypt(input, expected), expected);
  });

  it("la contraseña se mide en bytes UTF-8", async () => {
    assert.notEqual(await sha256crypt("ñ", "$5$rounds=1000$sal"), await sha256crypt("n", "$5$rounds=1000$sal"));
    assert.equal(await sha256crypt("ñ", "$5$rounds=1000$sal"), await sha256crypt("ñ", "$5$rounds=1000$sal"));
  });
});

describe("sha256crypt por lotes", () => {
  it("hashPassword('sha256crypt') mantiene las pausas del temporizador por debajo de 20 ms", async (t) => {
    let previous = performance.now();
    let maxGap = 0;
    const observe = () => {
      const now = performance.now();
      maxGap = Math.max(maxGap, now - previous);
      previous = now;
    };
    const timer = setInterval(observe, 1);
    try {
      await hashPassword("sha256crypt", "contraseña de prueba");
      observe();
    } finally {
      clearInterval(timer);
    }
    t.diagnostic(`mayor intervalo entre ticks: ${maxGap.toFixed(2)} ms`);
    // El presupuesto de 20 ms deja margen al planificador y limita la espera de otras peticiones.
    assert.ok(maxGap < 20, `el temporizador estuvo detenido ${maxGap.toFixed(2)} ms`);
  });
});
