"use client";

import { useState, type ReactNode } from "react";
import { AnimatePresence, motion, type Variants } from "motion/react";
import { brand, Tagline } from "@/brand";
import { Section } from "@/components/layout/Section";
import { cn } from "@/lib/cn";
import { MODE_ORDER, MODES, type Mode } from "@/hash/algorithms";
import type { UserView } from "@/app/users";
import type { PublicKeyInfo } from "@/hash/contract";
import { IntegrityPanel } from "./IntegrityPanel";
import { SignaturePanel } from "./SignaturePanel";
import { PasswordPanel } from "./PasswordPanel";
import { FittedHeading } from "./FittedHeading";

const pane: Variants = {
  hidden: { opacity: 0, transform: "translateY(10px)", transition: { duration: 0 } },
  shown: { opacity: 1, transform: "translateY(0px)", transition: { duration: 0.22, ease: brand.motion.ease } },
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
            "relative cursor-pointer px-4 pb-3 pt-2 font-display text-sm font-extrabold uppercase tracking-tight sm:px-6 sm:text-base",
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

export function Lab({ publicKey, initialUsers }: { publicKey: PublicKeyInfo; initialUsers: UserView[] }) {
  const [mode, setMode] = useState<Mode>("integridad");
  const m = MODES[mode];
  const panels: Record<Mode, ReactNode> = {
    integridad: <IntegrityPanel />,
    firmas: <SignaturePanel publicKey={publicKey} />,
    contrasenas: <PasswordPanel initialUsers={initialUsers} />,
  };

  return (
    <Section id="lab" aria-label="Laboratorio de hash" className="scroll-mt-0 bg-ink/70 py-16 backdrop-blur-[2px] sm:py-24">
      <div className="mb-10 grid gap-6 lg:grid-cols-[1fr_minmax(0,28rem)] lg:items-end">
        <div className="@container -my-8 overflow-y-clip py-8">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={mode}
              initial={{ opacity: 0, transform: "translateY(30%)" }}
              animate={{ opacity: 1, transform: "translateY(0%)", transition: { duration: 0.28, ease: brand.motion.ease } }}
              exit={{ opacity: 0, transform: "translateY(-30%)", transition: { duration: 0.15, ease: brand.motion.ease } }}
            >
              <Tagline lead={m.lead} accent={m.accent} tone="redMuted" className="text-[clamp(1.25rem,2vw,2rem)] sm:text-[clamp(1.25rem,2vw,2rem)]" />
              <FittedHeading label={m.label} />
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="grid">
          {MODE_ORDER.map((id) => (
            <p
              key={id}
              aria-hidden={id !== mode}
              className={cn("col-start-1 row-start-1 font-serif text-xl uppercase leading-snug text-paper", id !== mode && "invisible")}
            >
              {MODES[id].blurb}
            </p>
          ))}
        </div>
      </div>

      <Tabs mode={mode} onChange={setMode} />

      <div className="grid pt-6">
        {MODE_ORDER.map((id) => (
          <motion.div
            key={id}
            id={`pane-${id}`}
            role="tabpanel"
            aria-labelledby={`tab-${id}`}
            aria-hidden={id !== mode}
            inert={id !== mode}
            className={cn("col-start-1 row-start-1", id !== mode && "invisible")}
            variants={pane}
            initial={id === mode ? "shown" : "hidden"}
            animate={id === mode ? "shown" : "hidden"}
          >
            {panels[id]}
          </motion.div>
        ))}
      </div>
    </Section>
  );
}
