"use client";

import { forwardRef } from "react";
import { motion, type SVGMotionProps } from "motion/react";
import { Slash } from "@/brand/primitives/Slash";
import { brand } from "@/brand/tokens";

/**
 * HazardStripes — franjas diagonales decorativas (esquina superior-derecha del hero).
 * Misma primitiva `Slash` que el isologo, en versión contorno y dispuestas en fila.
 */
type HazardTone = "red" | "redMuted" | "paper";

export type HazardStripesProps = {
  count?: number;
  /** Alto en px (el ancho se deriva del aspecto). */
  height?: number;
  tone?: HazardTone;
  strokeWidth?: number;
} & Omit<SVGMotionProps<SVGSVGElement>, "viewBox">;

const H = 100;
const PITCH = 18;
const BAR = 12;

export const HazardStripes = forwardRef<SVGSVGElement, HazardStripesProps>(
  function HazardStripes(
    { count = 6, height = 44, tone = "red", strokeWidth = 3, ...rest },
    ref,
  ) {
    const skew = brand.geometry.slashSkew;
    const width = count * PITCH + skew + BAR;

    return (
      <motion.svg
        ref={ref}
        viewBox={`0 0 ${width} ${H}`}
        height={height}
        width={(width / H) * height}
        aria-hidden
        {...rest}
      >
        {Array.from({ length: count }).map((_, i) => (
          <Slash
            key={i}
            x={i * PITCH}
            width={BAR}
            skew={skew}
            height={H}
            tone={tone}
            outline
            strokeWidth={strokeWidth}
            custom={i}
          />
        ))}
      </motion.svg>
    );
  },
);
