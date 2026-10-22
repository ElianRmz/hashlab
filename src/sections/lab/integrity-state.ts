import type { IntegrityResult } from "../../app/action-types.ts";
import type { DigestAlgoId } from "../../hash/algorithms.ts";

export type IntegrityInput = { mode: "text"; text: string } | { mode: "file"; file: File | null };
export type IntegrityOutcome = { input: IntegrityInput; reference: string | null; result: IntegrityResult };

function sameInput(a: IntegrityInput, b: IntegrityInput): boolean {
  if (a.mode === "text") return b.mode === "text" && a.text === b.text;
  return b.mode === "file" && a.file === b.file;
}

export function integrityState(outcome: IntegrityOutcome | null, input: IntegrityInput, algo: DigestAlgoId, reference: string) {
  const current = outcome !== null && outcome.result.hash.algo === algo && sameInput(outcome.input, input);
  const matches = current && outcome.reference === reference ? outcome.result.matches : null;
  return { current, matches };
}
