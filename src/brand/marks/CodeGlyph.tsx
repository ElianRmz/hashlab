"use client";

import { forwardRef } from "react";
import { motion, type HTMLMotionProps } from "motion/react";
import { cn } from "@/lib/cn";

/** CodeGlyph — el glifo `</>`, eco tipográfico del motivo de la barra. */
export type CodeGlyphProps = HTMLMotionProps<"span">;

export const CodeGlyph = forwardRef<HTMLSpanElement, CodeGlyphProps>(
  function CodeGlyph({ className, ...rest }, ref) {
    return (
      <motion.span
        ref={ref}
        aria-hidden
        className={cn(
          "select-none font-display font-extrabold tracking-tight text-red",
          className,
        )}
        {...rest}
      >
        &lt;/&gt;
      </motion.span>
    );
  },
);
