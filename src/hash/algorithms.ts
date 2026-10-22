import { BCRYPT_COST, PBKDF2, SHA256CRYPT_ROUNDS } from "./params.ts";

export type DigestAlgoId = "sha256" | "sha384" | "sha512";
export type PasswordAlgoId = "bcrypt" | "sha256crypt" | "pbkdf2";
export type AlgoId = DigestAlgoId | PasswordAlgoId;

export type DigestAlgo = {
  kind: "digest";
  id: DigestAlgoId;
  label: string;
  bits: 256 | 384 | 512;
};

export type PasswordAlgo = {
  kind: "password";
  id: PasswordAlgoId;
  label: string;
  param: string;
};

export const DIGEST_ALGOS: Record<DigestAlgoId, DigestAlgo> = {
  sha256: { kind: "digest", id: "sha256", label: "SHA-256", bits: 256 },
  sha384: { kind: "digest", id: "sha384", label: "SHA-384", bits: 384 },
  sha512: { kind: "digest", id: "sha512", label: "SHA-512", bits: 512 },
};

export const PASSWORD_ALGOS: Record<PasswordAlgoId, PasswordAlgo> = {
  bcrypt: { kind: "password", id: "bcrypt", label: "BCRYPT", param: `COSTO ${BCRYPT_COST}` },
  sha256crypt: { kind: "password", id: "sha256crypt", label: "SHA256CRYPT", param: `${SHA256CRYPT_ROUNDS.toLocaleString("es-MX")} RONDAS` },
  pbkdf2: { kind: "password", id: "pbkdf2", label: "PBKDF2", param: `${PBKDF2.iterations.toLocaleString("es-MX")} IT.` },
};

export type Mode = "integridad" | "firmas" | "contrasenas";

export const MODES: Record<Mode, { index: string; label: string; lead: string; accent: string; blurb: string }> = {
  integridad: {
    index: "01",
    label: "INTEGRIDAD",
    lead: "¿FUE",
    accent: "MODIFICADO?",
    blurb: "Calcula la huella de un texto y compárala con la registrada. Un solo carácter distinto cambia todo el hash.",
  },
  firmas: {
    index: "02",
    label: "FIRMAS",
    lead: "¿QUIÉN LO",
    accent: "FIRMÓ?",
    blurb: "Se hashea el mensaje y el hash se firma con la llave privada. Cualquiera verifica con la llave pública.",
  },
  contrasenas: {
    index: "03",
    label: "CONTRASEÑAS",
    lead: "NUNCA LA",
    accent: "CONTRASEÑA",
    blurb: "Solo se guarda el hash con su sal y su costo. Al iniciar sesión se recalcula y se compara.",
  },
};

export const MODE_ORDER: Mode[] = ["integridad", "firmas", "contrasenas"];
