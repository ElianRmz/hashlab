export const BCRYPT_COST = 12;

export const SHA256CRYPT_ROUNDS = 535_000;

export const PBKDF2 = {
  digest: "sha256",
  iterations: 600_000,
  keyBytes: 32,
  saltBytes: 16,
} as const;

export const RSA_MODULUS_BITS = 2048;

export const BCRYPT_MAX_PASSWORD_BYTES = 72;
