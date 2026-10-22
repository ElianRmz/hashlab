import { timingSafeEqual } from "node:crypto";
import type { PasswordAlgoId } from "../algorithms.ts";
import type { RecordPart } from "../contract.ts";

export type PasswordScheme = {
  id: PasswordAlgoId;
  hash(password: string): Promise<string>;
  verify(record: string, password: string): Promise<boolean>;
  matches(record: string): boolean;
  split(record: string): RecordPart[];
};

type SchemeSpec = Pick<PasswordScheme, "id" | "hash" | "verify"> & {
  pattern: RegExp;
};

const ROLES = ["algoritmo", "costo", "sal", "hash"] as const;

export function defineScheme({ pattern, ...spec }: SchemeSpec): PasswordScheme {
  return {
    ...spec,
    matches: (record) => pattern.test(record),
    split(record) {
      const groups = pattern.exec(record);
      if (!groups) throw new Error(`el registro no tiene el formato de ${spec.id}`);
      return ROLES.map((role, i) => ({ role, text: groups[i + 1] ?? "" }));
    },
  };
}

export function safeEqual(a: Uint8Array, b: Uint8Array): boolean {
  return a.length === b.length && timingSafeEqual(a, b);
}
