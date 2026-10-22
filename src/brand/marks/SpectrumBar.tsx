"use client";

import { forwardRef } from "react";
import { motion, type HTMLMotionProps } from "motion/react";
import { cn } from "@/lib/cn";
import { brand } from "@/brand/tokens";

/**
 * SpectrumBar — barra de 6 celdas cuadradas, horizontal o vertical.
 * Cada celda es animable individualmente (custom={i} listo para stagger/keyframes).
 * Loop de color futuro: rotar el offset del array swatches vía variants.
 */
export type SpectrumBarProps = {
  swatches?: readonly string[];
  orientation?: "horizontal" | "vertical";
  cell?: number;
} & HTMLMotionProps<"div">;

export const SpectrumBar = forwardRef<HTMLDivElement, SpectrumBarProps>(
  function SpectrumBar(
    {
      swatches = brand.color.spectrum,
      orientation = "horizontal",
      cell = 14,
      className,
      ...rest
    },
    ref,
  ) {
    return (
      <motion.div
        ref={ref}
        aria-hidden
        className={cn(
          "flex",
          orientation === "vertical" ? "flex-col" : "flex-row",
          className,
        )}
        {...rest}
      >
        {swatches.map((c, i) => (
          <motion.span
            key={i}
            custom={i}
            className="shrink-0"
            style={{ width: cell, height: cell, backgroundColor: c }}
          />
        ))}
      </motion.div>
    );
  },
);
