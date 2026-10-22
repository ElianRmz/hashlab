"use client";

import { forwardRef } from "react";
import { motion, type SVGMotionProps } from "motion/react";
import { brand } from "@/brand/tokens";

/**
 * Slash — la primitiva atómica de la identidad UEDS.
 *
 * Dibuja UNA barra diagonal (paralelogramo "/") dentro del espacio de coordenadas
 * del SVG padre. Es la DNA de la que nacen el isologo, las hazard stripes y los
 * separadores. Es un `motion.path`, así que cada barra es animable de forma
 * independiente (reveal en cascada, ripple en hover, etc.).
 */
export type SlashTone = "red" | "redMuted" | "redDeep" | "paper" | "current";

const TONE_VAR: Record<SlashTone, string> = {
  red: "var(--color-red)",
  redMuted: "var(--color-red-muted)",
  redDeep: "var(--color-red-deep)",
  paper: "var(--color-paper)",
  current: "currentColor",
};

type SlashGeometry = {
  /** Coordenada X del borde inferior izquierdo, en unidades del viewBox padre. */
  x: number;
  /** Grosor de la barra, en unidades del viewBox. */
  width: number;
  /** Altura total (alto del viewBox padre). */
  height?: number;
  /** Desplazamiento horizontal base→tope que genera la diagonal. */
  skew?: number;
  tone?: SlashTone;
  /** Solo contorno (para hazard stripes). */
  outline?: boolean;
  strokeWidth?: number;
};

export type SlashProps = SlashGeometry & Omit<SVGMotionProps<SVGPathElement>, "d">;

export const Slash = forwardRef<SVGPathElement, SlashProps>(function Slash(
  {
    x,
    width,
    height = 100,
    skew = brand.geometry.slashSkew,
    tone = "current",
    outline = false,
    strokeWidth = 2,
    ...rest
  },
  ref,
) {
  const top = 0;
  const bottom = height;
  // Paralelogramo que se inclina a la derecha al subir → forma de "/".
  const d = `M${x},${bottom} L${x + width},${bottom} L${x + width + skew},${top} L${x + skew},${top} Z`;
  const color = TONE_VAR[tone];

  return (
    <motion.path
      ref={ref}
      d={d}
      fill={outline ? "none" : color}
      stroke={outline ? color : undefined}
      strokeWidth={outline ? strokeWidth : undefined}
      {...rest}
    />
  );
});
