"use client";

import { forwardRef } from "react";
import { motion, type HTMLMotionProps } from "motion/react";
import { cn } from "@/lib/cn";

/** Display — el titular grande de la marca (ej. "UN ESTUDIO DE SOFTWARE"). */
export type DisplayProps = HTMLMotionProps<"h1"> & {
  as?: "h1" | "h2";
};

export const Display = forwardRef<HTMLHeadingElement, DisplayProps>(
  function Display({ as = "h1", className, children, ...rest }, ref) {
    const Tag = as === "h2" ? motion.h2 : motion.h1;
    return (
      <Tag
        ref={ref}
        className={cn(
          "font-display font-extrabold uppercase text-red",
          "leading-[0.9] tracking-[-0.08em]",
          "text-[clamp(2.5rem,10.5vw,8rem)]",
          className,
        )}
        {...rest}
      >
        {children}
      </Tag>
    );
  },
);
