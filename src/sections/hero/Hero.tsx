"use client";

import type { CSSProperties } from "react";
import { motion, type Variants } from "motion/react";
import {
  brand,
  CodeGlyph,
  Coordinates,
  DiagonalBars,
  Display,
  Isologo,
  Label,
  SpectrumBar,
  Tagline,
} from "@/brand";
import { Section } from "@/components/layout/Section";

const { dur, ease } = brand.motion;

const sequence: Variants = {
  hidden: {},
  shown: { transition: { staggerChildren: 0.09, delayChildren: 0.15 } },
};

const rise: Variants = {
  hidden: { opacity: 0, transform: "translateY(12px)" },
  shown: { opacity: 1, transform: "translateY(0px)", transition: { duration: dur.slow, ease } },
};

const lineReveal: Variants = {
  hidden: { transform: "translateY(105%)" },
  shown: { transform: "translateY(0%)", transition: { duration: dur.slow, ease } },
};

const markReveal: Variants = {
  hidden: { clipPath: "inset(0 100% 0 0)" },
  shown: { clipPath: "inset(0 0% 0 0)", transition: { duration: dur.slow, ease } },
};

function MaskedLine({ children }: { children: string }) {
  return (
    <span className="block overflow-hidden pb-[0.04em]">
      <motion.span className="block" variants={lineReveal}>
        {children}
      </motion.span>
    </span>
  );
}

export function Hero() {
  return (
    <Section fullHeight aria-label="HASHLAB" className="pointer-events-none">
      <motion.a
        href="#lab"
        variants={rise}
        initial="hidden"
        animate="shown"
        className="pointer-events-auto absolute right-5 top-6 z-10 border border-red px-5 py-2.5 font-display text-sm font-extrabold uppercase tracking-tight text-red no-underline transition-colors duration-150 ease-brand hover:bg-red hover:text-ink sm:right-8 sm:top-8 lg:right-14"
      >
        Probar /
      </motion.a>

      <motion.div
        variants={sequence}
        initial="hidden"
        animate="shown"
        className="mx-auto flex min-h-svh w-full flex-col justify-center gap-6 py-16"
        style={{ "--hero-mark": "clamp(5.5rem,17vw,20rem)" } as CSSProperties}
      >
        <motion.div variants={rise} className="flex items-baseline justify-between gap-6">
          <div className="flex flex-wrap items-baseline gap-x-10 gap-y-2">
            <Tagline lead="HASHEAR PARA" accent="VERIFICAR" tone="redMuted" className="text-[clamp(1rem,1.5vw,1.75rem)] sm:text-[clamp(1rem,1.5vw,1.75rem)]" />
            <Coordinates className="hidden md:block" />
          </div>
          <div className="hidden self-center sm:block" style={{ width: 276, height: 46 }}>
            <DiagonalBars cols={6} rows={1} background="transparent" outline />
          </div>
        </motion.div>

        <div className="flex items-center gap-4 sm:gap-7 lg:gap-10">
          <motion.div
            variants={markReveal}
            className="pointer-events-auto shrink-0"
            style={{ width: "var(--hero-mark)", height: "var(--hero-mark)" }}
          >
            <Isologo hover="barrido" background="transparent" style={{ width: "100%", height: "100%" }} />
          </motion.div>
          <Display
            className="tracking-[-0.02em]"
            style={{ fontSize: "calc(var(--hero-mark) / 1.55)", lineHeight: 0.9 }}
          >
            <MaskedLine>HASH</MaskedLine>
            <MaskedLine>LAB</MaskedLine>
          </Display>
        </div>

        <motion.div variants={rise} className="flex flex-wrap items-center justify-between gap-x-8 gap-y-5">
          <Label items={["SHA-2", "BCRYPT", "SHA256CRYPT", "PBKDF2"]} tone="paper" className="text-[clamp(1rem,1.5vw,1.75rem)] sm:text-[clamp(1rem,1.5vw,1.75rem)]" />
          <CodeGlyph className="text-lg sm:text-2xl" />
          <Label tone="paper" className="text-[clamp(1rem,1.5vw,1.75rem)] sm:text-[clamp(1rem,1.5vw,1.75rem)]">
            SICM / UNIDAD II
          </Label>
          <SpectrumBar cell={24} />
          <Tagline lead="VERIFICAR PARA" accent="CONFIAR" tone="red" className="text-[clamp(1rem,1.5vw,1.75rem)] sm:text-[clamp(1rem,1.5vw,1.75rem)]" />
        </motion.div>
      </motion.div>
    </Section>
  );
}
