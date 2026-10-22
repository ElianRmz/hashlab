"use client";

import { useState, type ReactNode } from "react";
import { AnimatePresence, motion, type Variants } from "motion/react";
import { brand, Tagline } from "@/brand";
import { Section } from "@/components/layout/Section";
import { cn } from "@/lib/cn";
import { MODE_ORDER, MODES, type Mode } from "@/hash/algorithms";
import { RevealContext, type RevealStyle } from "./Digest";
import { IntegrityPanel, PasswordPanel, SignaturePanel } from "./panels";

const PANELS: Record<Mode, ReactNode> = {
  integridad: <IntegrityPanel />,
  firmas: <SignaturePanel />,
  contrasenas: <PasswordPanel />,
};

const pane: Variants = {
  hidden: { opacity: 0, transform: "translateY(10px)", transition: { duration: 0 }, transitionEnd: { display: "none" } },
  shown: { display: "block", opacity: 1, transform: "translateY(0px)", transition: { duration: 0.22, ease: brand.motion.ease } },
};

function Tabs({ mode, onChange }: { mode: Mode; onChange: (m: Mode) => void }) {
  return (
    <div role="tablist" aria-label="Uso del hash" className="flex flex-wrap border-b border-paper/15">
      {MODE_ORDER.map((m) => (
        <button
          key={m}
          role="tab"
          id={`tab-${m}`}
          aria-selected={m === mode}
          aria-controls={`pane-${m}`}
          onClick={() => onChange(m)}
          className={cn(
            "relative cursor-pointer px-4 pb-3 pt-2 font-display text-sm font-extrabold uppercase tracking-tight transition-colors duration-150 ease-brand sm:px-6 sm:text-base",
            m === mode ? "text-red" : "text-paper-dim hover:text-paper",
          )}
        >
          <span className="mr-2 font-serif font-normal">{MODES[m].index}</span>
          {MODES[m].label}
          {m === mode && (
            <motion.span
              layoutId="tab-indicator"
              className="absolute inset-x-0 -bottom-px h-[3px] bg-red"
              transition={{ duration: 0.25, ease: brand.motion.easeInOut }}
            />
          )}
        </button>
      ))}
    </div>
  );
}

function RevealSwitch({ value, onChange }: { value: RevealStyle; onChange: (v: RevealStyle) => void }) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-1 border border-paper/15 bg-ink/90 p-1 font-serif text-sm uppercase backdrop-blur">
      <span className="px-2 text-paper-dim">Prototipo · revelado</span>
      {(["descifrado", "cascada"] as const).map((v) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          className={cn("cursor-pointer px-2.5 py-1 transition-colors duration-150 ease-brand", v === value ? "bg-red text-ink" : "text-paper hover:text-red")}
        >
          {v}
        </button>
      ))}
    </div>
  );
}

export function Lab() {
  const [mode, setMode] = useState<Mode>("integridad");
  const [reveal, setReveal] = useState<RevealStyle>("descifrado");
  const m = MODES[mode];

  return (
    <RevealContext.Provider value={reveal}>
      <Section id="lab" aria-label="Laboratorio de hash" className="scroll-mt-0 bg-ink/70 py-16 backdrop-blur-[2px] sm:py-24">
        <div className="mb-10 grid gap-6 lg:grid-cols-[1fr_minmax(0,28rem)] lg:items-end">
          <div className="overflow-hidden">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={mode}
                initial={{ opacity: 0, transform: "translateY(30%)" }}
                animate={{ opacity: 1, transform: "translateY(0%)", transition: { duration: brand.motion.dur.base, ease: brand.motion.ease } }}
                exit={{ opacity: 0, transform: "translateY(-30%)", transition: { duration: 0.15, ease: brand.motion.ease } }}
              >
                <Tagline lead={m.lead} accent={m.accent} tone="redMuted" className="text-[clamp(1.25rem,2vw,2rem)] sm:text-[clamp(1.25rem,2vw,2rem)]" />
                <h2 className="font-display text-[clamp(2.5rem,6vw,6rem)] font-extrabold uppercase leading-[0.9] tracking-[-0.04em] text-red">
                  {m.label}
                </h2>
              </motion.div>
            </AnimatePresence>
          </div>
          <p className="font-serif text-xl uppercase leading-snug text-paper">{m.blurb}</p>
        </div>

        <Tabs mode={mode} onChange={setMode} />

        <div className="pt-6">
          {MODE_ORDER.map((id) => (
            <motion.div
              key={id}
              id={`pane-${id}`}
              role="tabpanel"
              aria-labelledby={`tab-${id}`}
              variants={pane}
              initial={id === mode ? "shown" : "hidden"}
              animate={id === mode ? "shown" : "hidden"}
            >
              {PANELS[id]}
            </motion.div>
          ))}
        </div>
      </Section>
      <RevealSwitch value={reveal} onChange={setReveal} />
    </RevealContext.Provider>
  );
}
