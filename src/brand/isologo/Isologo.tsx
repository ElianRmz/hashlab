"use client";

import { forwardRef, useId } from "react";
import { motion, type Variants } from "motion/react";
import { gridBars } from "@/brand/marks/DiagonalBars";
import { brand } from "@/brand/tokens";
import type { IsologoProps, IsologoTone } from "./Isologo.types";

/**
 * Isologo — la marca UEDS.
 *
 * ES la rejilla de barras diagonales verificada contra Figma (IoU 0.99): celdas
 * cuadradas, barra = media celda, hueco = media celda (50/50), con desfase de
 * media celda en filas alternas. El recorte al cuadrado genera los triángulos de
 * borde automáticos. La forma canónica es la rejilla 3×3.
 *
 * Geometría desde `gridBars` (única fuente, compartida con DiagonalBars) → nunca
 * diverge del patrón. Con `hover` cada barra es un `motion.polygon` animable.
 *
 * Aspecto BLINDADO: la marca es SIEMPRE cuadrada y nunca se deforma —
 *   - `preserveAspectRatio="xMidYMid meet"`: aunque la caja sea rectangular, la
 *      marca se dibuja como el mayor cuadrado centrado (jamás se estira).
 *   - `alignSelf: flex-start`: evita el `stretch` de flex para que la caja
 *      respete `aspect-ratio: 1/1`.
 *
 * Reutilizable a cualquier escala:
 *   <Isologo size={48} />                      // navbar / footer
 *   <Isologo className="h-40 w-auto" hover="barrido" />
 */
const TONE_VAR: Record<IsologoTone, string> = {
  red: brand.color.red,
  redMuted: brand.color.redMuted,
  redDeep: brand.color.redDeep,
  paper: brand.color.paper,
};

/**
 * Variante "barrido": cada barra parpadea (opacidad 1 → 0.1 → 1) con retardo
 * proporcional a su posición horizontal → ola secuencial izquierda → derecha.
 */
function barridoVariants(cx: number, grid: number): Variants {
  return {
    rest: { opacity: 1 },
    hover: {
      opacity: [1, 0.1, 1],
      transition: { duration: 0.5, ease: brand.motion.ease, delay: (cx / grid) * 0.4 },
    },
  };
}

export const Isologo = forwardRef<SVGSVGElement, IsologoProps>(function Isologo(
  {
    size,
    grid = 3,
    tone = "red",
    background = brand.color.paper,
    direction = "/",
    stagger = true,
    hover,
    title = "UEDS — Un Estudio de Software",
    className,
    style,
  },
  ref,
) {
  const clip = useId();
  const color = TONE_VAR[tone];
  const bars = gridBars(grid, grid, direction, stagger);

  const boxStyle: React.CSSProperties = {
    display: "inline-block",
    alignSelf: "flex-start",
    aspectRatio: "1 / 1",
    ...(size != null ? { width: size, height: size } : null),
    ...style,
  };

  const svgProps = {
    ref,
    viewBox: `0 0 ${grid} ${grid}`,
    preserveAspectRatio: "xMidYMid meet",
    width: "100%",
    height: "100%",
    style: { display: "block" as const },
  };

  const clipRect = <rect x="0" y="0" width={grid} height={grid} fill={background} />;
  const clipDef = (
    <defs>
      <clipPath id={clip} clipPathUnits="userSpaceOnUse">
        <rect x="0" y="0" width={grid} height={grid} />
      </clipPath>
    </defs>
  );

  return (
    <div role="img" aria-label={title} className={className} style={boxStyle}>
      {hover ? (
        <motion.svg {...svgProps} initial="rest" animate="rest" whileHover="hover" variants={{ rest: {}, hover: {} }}>
          {clipDef}
          {clipRect}
          <g clipPath={`url(#${clip})`}>
            {bars.map((b, i) => (
              <motion.polygon key={i} points={b.points} fill={color} variants={barridoVariants(b.cx, grid)} />
            ))}
          </g>
        </motion.svg>
      ) : (
        <svg {...svgProps} shapeRendering="crispEdges">
          {clipDef}
          {clipRect}
          <g clipPath={`url(#${clip})`}>
            {bars.map((b, i) => (
              <polygon key={i} points={b.points} fill={color} />
            ))}
          </g>
        </svg>
      )}
    </div>
  );
});
