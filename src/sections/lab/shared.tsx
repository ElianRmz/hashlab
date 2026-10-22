"use client";

import { useState, useTransition } from "react";
import { motion } from "motion/react";
import type { ActionError, ActionResult } from "@/app/action-types";
import type { RecordPart } from "@/hash/contract";
import { brand } from "@/brand";
import { cn } from "@/lib/cn";

export const milliseconds = (ms: number) => `${ms.toFixed(1)} ms`;

export function useServerTask<T>() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<ActionError | null>(null);
  function run(work: () => Promise<ActionResult<T>>, success: (data: T) => void) {
    setError(null);
    startTransition(async () => {
      try {
        const result = await work();
        if (result.ok) success(result.data);
        else setError(result);
      } catch {
        setError({ ok: false, error: "No se pudo conectar con el servidor. Inténtalo de nuevo" });
      }
    });
  }
  return { pending, error, setError, run };
}

export function TaskError({ error }: { error: ActionError | null }) {
  return error && !error.field ? <p role="alert" className="font-serif text-sm text-red">{error.error}</p> : null;
}

export function fieldError(error: ActionError | null, field: string) {
  return error?.field === field ? error.error : undefined;
}

const META_COLUMNS = { 2: "sm:grid-cols-2", 5: "sm:grid-cols-5" } as const;

export function Meta({ items, columns }: { items: [string, string][]; columns: keyof typeof META_COLUMNS }) {
  return (
    <dl className={cn("grid grid-cols-2 gap-px bg-paper/10", META_COLUMNS[columns])}>
      {items.map(([key, value]) => (
        <div key={key} className="min-w-0 bg-ink px-3 py-2.5">
          <dt className="font-serif text-xs uppercase text-paper-dim">{key}</dt>
          <dd className="break-words font-mono text-sm text-paper">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

const PART_CLASS: Record<RecordPart["role"], string> = {
  algoritmo: "bg-[#c9c9cc] text-ink",
  costo: "bg-red-deep text-paper",
  sal: "bg-red-muted text-paper",
  hash: "text-paper",
};

export function StoredRecord({ parts, legend = true }: { parts: RecordPart[]; legend?: boolean }) {
  return (
    <div className="flex min-w-0 flex-col gap-3">
      <p className="break-all font-mono text-sm leading-relaxed">
        {parts.map((part) => (
          <motion.span key={part.role} className={cn("px-0.5", PART_CLASS[part.role])}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ duration: 0.22, ease: brand.motion.ease }}>
            {part.text}
          </motion.span>
        ))}
      </p>
      {legend && <ul className="flex flex-wrap gap-x-5 gap-y-1 font-serif text-sm uppercase text-paper-dim">
        {parts.map((part) => <li key={part.role} className="flex items-center gap-2">
          <span className={cn("inline-block size-3 border border-paper/30", PART_CLASS[part.role])} />{part.role}
        </li>)}
      </ul>}
    </div>
  );
}
