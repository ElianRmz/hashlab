"use client";

import { forwardRef } from "react";
import { motion, type HTMLMotionProps } from "motion/react";
import { cn } from "@/lib/cn";

/**
 * SplitChars — wraps each character in its own motion.span for per-char animation.
 * No animation built-in: pass `variants` from the consumer.
 * Spaces are preserved via whitespace-pre.
 */
export type SplitCharsProps = {
  text: string;
  charClassName?: string;
} & HTMLMotionProps<"span">;

export const SplitChars = forwardRef<HTMLSpanElement, SplitCharsProps>(
  function SplitChars({ text, charClassName, className, ...rest }, ref) {
    return (
      <motion.span
        ref={ref}
        aria-label={text}
        className={cn("inline", className)}
        {...rest}
      >
        {text.split("").map((char, i) => (
          <motion.span
            key={i}
            aria-hidden
            custom={i}
            className={cn("inline-block whitespace-pre", charClassName)}
          >
            {char}
          </motion.span>
        ))}
      </motion.span>
    );
  },
);
