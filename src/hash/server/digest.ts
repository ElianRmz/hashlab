import { createHash } from "node:crypto";
import type { DigestAlgoId } from "../algorithms.ts";
import type { DigestResult } from "../contract.ts";

export function digest(algo: DigestAlgoId, data: Uint8Array): DigestResult {
  const start = performance.now();
  const hex = createHash(algo).update(data).digest("hex");
  return { algo, hex, inputBytes: data.byteLength, ms: performance.now() - start };
}
