"use client";

import { forwardRef } from "react";
import { motion, type HTMLMotionProps } from "motion/react";
import { cn } from "@/lib/cn";
import { SplitChars } from "@/brand/primitives/SplitChars";

/** Coordinates — etiqueta geográfica (CUU Capital por defecto). */
export type CoordinatesProps = {
  place?: string;
  lat?: string;
  lng?: string;
} & HTMLMotionProps<"p">;

export const Coordinates = forwardRef<HTMLParagraphElement, CoordinatesProps>(
  function Coordinates(
    {
      place = "CUU CAPITAL",
      lat = "28°38'29.4\"N",
      lng = "106°08'54.2\"W",
      className,
      ...rest
    },
    ref,
  ) {
    return (
      <motion.p
        ref={ref}
        className={cn(
          "font-serif font-normal uppercase tracking-[-0.02em] text-paper",
          "text-[clamp(1.25rem,2.4vw,2.5rem)]",
          className,
        )}
        {...rest}
      >
        <SplitChars text={place} />
        {" "}
        <SplitChars text="~" charClassName="text-paper-dim" />
        {" "}
        <SplitChars text={`${lat} ${lng}`} />
      </motion.p>
    );
  },
);
