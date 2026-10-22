"use client";

import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { brand } from "@/brand";
import { cn } from "@/lib/cn";

export function Button({ tone = "outline", className, ...rest }: ComponentPropsWithoutRef<"button"> & { tone?: "outline" | "solid" }) {
  return (
    <button
      className={cn(
        "cursor-pointer border border-red px-5 py-3 font-display text-sm font-extrabold uppercase tracking-tight",
        "transition-[transform,background-color,color] duration-150 ease-brand active:scale-[0.97] motion-reduce:active:scale-100",
        "disabled:cursor-not-allowed disabled:opacity-40",
        tone === "solid" ? "bg-red text-ink hover:bg-paper hover:border-paper" : "text-red hover:bg-red hover:text-ink",
        className,
      )}
      {...rest}
    />
  );
}

export function Field({ index, label, children }: { index: string; label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="font-serif text-base uppercase text-paper-dim">
        <span className="text-red">{index} /</span> {label}
      </span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full border border-paper/15 bg-ink-soft/85 px-4 py-3 font-mono text-[15px] text-paper outline-none transition-colors duration-150 ease-brand placeholder:text-paper-dim/60 focus:border-red";

export const TextInput = (props: ComponentPropsWithoutRef<"input">) => <input {...props} className={cn(inputClass, props.className)} />;

export const TextArea = (props: ComponentPropsWithoutRef<"textarea">) => (
  <textarea rows={4} {...props} className={cn(inputClass, "resize-none", props.className)} />
);

export function Chips<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { id: T; label: string; sub?: string }[];
  value: T;
  onChange: (id: T) => void;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="grid grid-cols-3 gap-2">
      {options.map((o) => {
        const on = o.id === value;
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.id)}
            className={cn(
              "cursor-pointer border px-3 py-2.5 text-left transition-[transform,background-color,color,border-color] duration-150 ease-brand active:scale-[0.97] motion-reduce:active:scale-100",
              on ? "border-red bg-red text-ink" : "border-paper/15 bg-ink-soft/70 text-paper hover:border-red/70",
            )}
          >
            <span className="block font-display text-sm font-extrabold tracking-tight">{o.label}</span>
            {o.sub && <span className={cn("block font-serif text-sm uppercase", on ? "text-ink/70" : "text-paper-dim")}>{o.sub}</span>}
          </button>
        );
      })}
    </div>
  );
}

export function Panel({ title, className, children }: { title: string; className?: string; children: ReactNode }) {
  return (
    <div className={cn("flex flex-col gap-5 border border-paper/10 bg-ink/80 p-5 backdrop-blur-sm sm:p-7", className)}>
      <p className="font-serif text-sm uppercase tracking-[0.02em] text-paper-dim">{title}</p>
      {children}
    </div>
  );
}

export type VerdictState = { ok: boolean; title: string; detail: string } | null;

export function Verdict({ state }: { state: VerdictState }) {
  return (
    <div aria-live="polite" className="min-h-[88px]">
      <AnimatePresence mode="wait" initial={false}>
        {state && (
          <motion.div
            key={`${state.ok}-${state.title}`}
            initial={{ opacity: 0, transform: "translateY(8px)" }}
            animate={{ opacity: 1, transform: "translateY(0px)", transition: { duration: 0.22, ease: brand.motion.ease } }}
            exit={{ opacity: 0, transition: { duration: 0.12, ease: brand.motion.ease } }}
            className={cn("flex items-center gap-4 px-5 py-4", state.ok ? "bg-paper text-ink" : "bg-red text-ink")}
          >
            <span className="font-display text-4xl font-extrabold leading-none">{state.ok ? "✓" : "✕"}</span>
            <span>
              <span className="block font-display text-xl font-extrabold uppercase tracking-tight">{state.title}</span>
              <span className="block font-serif text-base uppercase">{state.detail}</span>
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
