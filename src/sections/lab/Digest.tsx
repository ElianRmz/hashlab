"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { brand } from "@/brand";
import { cn } from "@/lib/cn";

export type RevealStyle = "descifrado" | "cascada";

export const RevealContext = createContext<RevealStyle>("descifrado");

const SCRAMBLE_MS = 650;
const NOISE = "0123456789abcdef";

const noise = (length: number) => Array.from({ length }, () => NOISE[(Math.random() * 16) | 0]).join("");

function useScramble(value: string, enabled: boolean) {
  const [shown, setShown] = useState(() => (enabled ? noise(value.length) : value));
  useEffect(() => {
    if (!enabled) return;
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const locked = Math.floor(((now - start) / SCRAMBLE_MS) * value.length);
      if (locked >= value.length) {
        setShown(value);
        return;
      }
      let out = value.slice(0, locked);
      for (let i = locked; i < value.length; i++) out += NOISE[(Math.random() * 16) | 0];
      setShown(out);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, enabled]);
  return enabled ? shown : value;
}

function Scramble({ value }: { value: string }) {
  const reduce = useReducedMotion();
  const shown = useScramble(value, !reduce);
  return (
    <span>
      {[...shown].map((c, i) => (
        <span key={i} className={c === value[i] ? undefined : "text-red"}>
          {c}
        </span>
      ))}
    </span>
  );
}

function Cascade({ value }: { value: string }) {
  return (
    <span key={value}>
      {[...value].map((c, i) => (
        <motion.span
          key={i}
          className="inline-block"
          initial={{ opacity: 0, transform: "translateY(-40%)" }}
          animate={{ opacity: 1, transform: "translateY(0%)" }}
          transition={{ duration: brand.motion.dur.base, ease: brand.motion.ease, delay: (i / value.length) * 0.45 }}
        >
          {c}
        </motion.span>
      ))}
    </span>
  );
}

export function Digest({ value, placeholder, className }: { value: string | null; placeholder: string; className?: string }) {
  const style = useContext(RevealContext);
  return (
    <p className={cn("min-h-[3.5em] break-all font-mono text-[15px] leading-relaxed text-paper", className)}>
      {value === null ? (
        <span className="text-paper-dim/60">{placeholder}</span>
      ) : style === "descifrado" ? (
        <Scramble key={value} value={value} />
      ) : (
        <Cascade value={value} />
      )}
    </p>
  );
}
