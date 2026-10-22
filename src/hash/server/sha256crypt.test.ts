import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { hashPassword } from "./passwords.ts";
import { sha256crypt, sha256cryptAsync } from "./sha256crypt.ts";

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
    it(setting, () => {
      assert.equal(sha256crypt(input, setting), expected);
    });
  }

  it("el registro completo sirve como setting al verificar", () => {
    for (const [, input, expected] of SPEC_VECTORS) assert.equal(sha256crypt(input, expected), expected);
  });

  it("la contraseña se mide en bytes UTF-8", () => {
    assert.notEqual(sha256crypt("ñ", "$5$rounds=1000$sal"), sha256crypt("n", "$5$rounds=1000$sal"));
    assert.equal(sha256crypt("ñ", "$5$rounds=1000$sal"), sha256crypt("ñ", "$5$rounds=1000$sal"));
  });
});

describe("sha256crypt por lotes", () => {
  it("la variante asíncrona da el mismo registro en cada vector", async () => {
    for (const [setting, input, expected] of SPEC_VECTORS) {
      assert.equal(await sha256cryptAsync(input, setting), expected);
    }
  });

  it("un temporizador sigue corriendo mientras hashPassword('sha256crypt') trabaja", async () => {
    let ticks = 0;
    const timer = setInterval(() => ticks++, 1);
    try {
      await hashPassword("sha256crypt", "contraseña de prueba");
    } finally {
      clearInterval(timer);
    }
    assert.ok(ticks >= 10, `el temporizador solo corrió ${ticks} veces`);
  });
});
