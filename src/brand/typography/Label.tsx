"use client";

import { forwardRef, Fragment } from "react";
import { motion, type HTMLMotionProps } from "motion/react";
import { cn } from "@/lib/cn";

/**
 * Label — meta-texto serif en mayúsculas.
 *
 * Con `items`, une los segmentos con "/" rojo.
 * `trailingSeparator` añade un "/" rojo al final (para segmentos que continúan).
 * `orientation` permite rotar el texto para composiciones de doblez en móvil:
 *   - "horizontal" (default): normal
 *   - "down": writing-mode vertical, lee de arriba hacia abajo
 *   - "up": vertical + rotate-180, lee de abajo hacia arriba
 *   - "flipped": rotate-180, texto boca abajo
 */
type LabelTone = "paper" | "red" | "redMuted";
type LabelOrientation = "horizontal" | "down" | "up" | "flipped";

const TONE_CLASS: Record<LabelTone, string> = {
  paper: "text-paper",
  red: "text-red",
  redMuted: "text-red-muted",
};

const ORIENTATION_CLASS: Record<LabelOrientation, string> = {
  horizontal: "",
  down: "[writing-mode:vertical-rl]",
  up: "[writing-mode:vertical-rl] rotate-180",
  flipped: "rotate-180",
};

export type LabelProps = {
  items?: string[];
  tone?: LabelTone;
  orientation?: LabelOrientation;
  trailingSeparator?: boolean;
} & HTMLMotionProps<"p">;

export const Label = forwardRef<HTMLParagraphElement, LabelProps>(
  function Label(
    {
      items,
      tone = "paper",
      orientation = "horizontal",
      trailingSeparator = false,
      className,
      children,
      ...rest
    },
    ref,
  ) {
    return (
      <motion.p
        ref={ref}
        className={cn(
          "font-serif font-normal uppercase tracking-[0.02em]",
          "text-sm sm:text-base",
          TONE_CLASS[tone],
          ORIENTATION_CLASS[orientation],
          className,
        )}
        {...rest}
      >
        {items ? (
          <>
            {items.map((item, i) => (
              <Fragment key={item}>
                {i > 0 && <span className="mx-2 font-normal text-red">/</span>}
                {item}
              </Fragment>
            ))}
            {trailingSeparator && <span className="ml-2 font-normal text-red">/</span>}
          </>
        ) : (
          <>
            {children}
            {trailingSeparator && <span className="ml-2 font-normal text-red">/</span>}
          </>
        )}
      </motion.p>
    );
  },
);
