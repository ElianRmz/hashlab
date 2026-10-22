"use client";

import { forwardRef } from "react";
import { brand } from "@/brand/tokens";

/**
 * DiagonalBars — Patrón de barras diagonales a 45°, identidad Polo El Ranchero.
 *
 * DOS MODOS:
 *
 * A) REJILLA (default): exactamente `cols × rows` celdas cuadradas.
 *    El SVG estira su viewBox al contenedor. Para bloques/logo de proporción fija.
 *    Mantén el contenedor en relación cols/rows (ej. 3/3 = cuadrado).
 *
 * B) MOSAICO: define `cell` (px) y llena el 100% del contenedor con celdas
 *    cuadradas de ese tamaño. Para bandas/frisos de ancho libre.
 *    Caja: height={cell}px, width=100%.
 *
 * REGLAS GEOMÉTRICAS (verificadas vs Figma, IoU 0.99):
 *   1. Celdas cuadradas; periodo = celda = alto de fila.
 *   2. Barra = media celda; hueco = media celda (50/50).
 *   3. Desfase de una barra en filas alternas → fila 1 = fila 3, fila 2 corrida.
 *   4. Recorte por celda → bordes rectos + triángulos automáticos por clipping.
 */
export type DiagonalBarsProps = {
  /** Modo rejilla: columnas de la cuadrícula. */
  cols?: number;
  /** Modo rejilla: filas de la cuadrícula. */
  rows?: number;
  /**
   * Modo mosaico: tamaño de celda en px. Cuando se define, ignora cols/rows
   * y rellena el contenedor con tantas celdas como quepan.
   */
  cell?: number;
  /** Color de la barra. Por defecto: brand.color.red. */
  color?: string;
  /** Color del hueco. */
  background?: string;
  /** Dirección de la diagonal. */
  direction?: "/" | "\\";
  /** Desfase de media celda en filas alternas. */
  stagger?: boolean;
  /** Solo contorno: barras sin relleno, trazadas con `color`. */
  outline?: boolean;
  /** Grosor del contorno en px (no escala con el SVG). */
  outlineWidth?: number;
  className?: string;
  style?: React.CSSProperties;
};

export const DiagonalBars = forwardRef<SVGSVGElement, DiagonalBarsProps>(
  function DiagonalBars(
    {
      cols = 3,
      rows = 3,
      cell,
      color = brand.color.red,
      background = "#FFFFFF",
      direction = "/",
      stagger = true,
      outline = false,
      outlineWidth = 1.5,
      className,
      style,
    },
    ref,
  ) {
    return cell ? (
      <TiledBars
        ref={ref}
        cell={cell}
        color={color}
        background={background}
        direction={direction}
        stagger={stagger}
        outline={outline}
        outlineWidth={outlineWidth}
        className={className}
        style={style}
      />
    ) : (
      <GridBars
        ref={ref}
        cols={cols}
        rows={rows}
        color={color}
        background={background}
        direction={direction}
        stagger={stagger}
        outline={outline}
        outlineWidth={outlineWidth}
        className={className}
        style={style}
      />
    );
  },
);

/** Atributos de pintura de una barra según el modo (relleno u contorno). */
function barPaint(color: string, outline: boolean, outlineWidth: number) {
  return outline
    ? {
        fill: "none",
        stroke: color,
        strokeWidth: outlineWidth,
        vectorEffect: "non-scaling-stroke" as const,
      }
    : { fill: color };
}

/** Una barra enumerada de la rejilla, con su centroide (para timing de animación). */
export type GridBar = { row: number; points: string; cx: number; cy: number };

/**
 * Enumera todas las barras de una rejilla `cols × rows`.
 * Fuente única de la geometría de la rejilla: la consumen el render estático
 * (`GridBars`) y cualquier variante animada (ej. Isologo con hover).
 */
export function gridBars(
  cols: number,
  rows: number,
  direction: "/" | "\\",
  stagger: boolean,
): GridBar[] {
  const out: GridBar[] = [];
  for (let r = 0; r < rows; r += 1) {
    const phase = (stagger ? (r % 2) * 0.5 : 0) + 0.5;
    for (let k = 0; k < cols + 3; k += 1) {
      const m = k - 1;
      const poly = barPolygon(m - phase, r, direction);
      const cx = poly.reduce((a, p) => a + p[0], 0) / 4;
      const cy = poly.reduce((a, p) => a + p[1], 0) / 4;
      out.push({ row: r, cx, cy, points: poly.map(([x, y]) => `${x},${y}`).join(" ") });
    }
  }
  return out;
}

/* Vértices del polígono de una barra en unidades de celda. */
export function barPolygon(
  s: number,
  r: number,
  direction: "/" | "\\",
): [number, number][] {
  if (direction === "\\") {
    return [
      [1 - s, r],
      [0.5 - s, r],
      [1.5 - s, r + 1],
      [2 - s, r + 1],
    ];
  }
  return [
    [s, r],
    [s + 0.5, r],
    [s - 0.5, r + 1],
    [s - 1, r + 1],
  ];
}

type GridBarsProps = Required<
  Pick<
    DiagonalBarsProps,
    "cols" | "rows" | "color" | "background" | "direction" | "stagger" | "outline" | "outlineWidth"
  >
> &
  Pick<DiagonalBarsProps, "className" | "style"> & {
    ref?: React.Ref<SVGSVGElement>;
  };

const GridBars = forwardRef<SVGSVGElement, GridBarsProps>(function GridBars(
  { cols, rows, color, background, direction, stagger, outline, outlineWidth, className, style },
  ref,
) {
  const uid = `dbg-${cols}x${rows}-${direction}-${stagger}${outline ? "-o" : ""}`;
  const bars = gridBars(cols, rows, direction, stagger);
  return (
    <svg
      ref={ref}
      className={className}
      viewBox={`0 0 ${cols} ${rows}`}
      preserveAspectRatio="none"
      width="100%"
      height="100%"
      aria-hidden
      style={{ display: "block", ...style }}
      shapeRendering="crispEdges"
    >
      <defs>
        {Array.from({ length: rows }).map((_, r) => (
          <clipPath key={r} id={`${uid}-c-${r}`} clipPathUnits="userSpaceOnUse">
            <rect x="0" y={r} width={cols} height="1" />
          </clipPath>
        ))}
      </defs>
      <rect x="0" y="0" width={cols} height={rows} fill={background} />
      {Array.from({ length: rows }).map((_, r) => (
        <g key={r} clipPath={`url(#${uid}-c-${r})`}>
          {bars
            .filter((b) => b.row === r)
            .map((b, i) => (
              <polygon key={i} points={b.points} {...barPaint(color, outline, outlineWidth)} />
            ))}
        </g>
      ))}
    </svg>
  );
});

type TiledBarsProps = Required<
  Pick<
    DiagonalBarsProps,
    "cell" | "color" | "background" | "direction" | "stagger" | "outline" | "outlineWidth"
  >
> &
  Pick<DiagonalBarsProps, "className" | "style"> & {
    ref?: React.Ref<SVGSVGElement>;
  };

const TiledBars = forwardRef<SVGSVGElement, TiledBarsProps>(function TiledBars(
  { cell, color, background, direction, stagger, outline, outlineWidth, className, style },
  ref,
) {
  const rowsInTile = stagger ? 2 : 1;
  const uid = `dbt-${cell}-${direction}-${stagger}${outline ? "-o" : ""}`;
  return (
    <svg
      ref={ref}
      className={className}
      width="100%"
      height="100%"
      aria-hidden
      style={{ display: "block", ...style }}
      shapeRendering="crispEdges"
    >
      <defs>
        <pattern
          id={uid}
          patternUnits="userSpaceOnUse"
          width={cell}
          height={cell * rowsInTile}
        >
          <rect width={cell} height={cell * rowsInTile} fill={background} />
          {Array.from({ length: rowsInTile }).map((_, r) => {
            const phase = (stagger ? (r % 2) * 0.5 : 0) + 0.5;
            const clipId = `${uid}-clip-${r}`;
            return (
              <g key={r}>
                <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
                  <rect x="0" y={r * cell} width={cell} height={cell} />
                </clipPath>
                <g clipPath={`url(#${clipId})`}>
                  {([-1, 0, 1, 2] as const).map((m) => {
                    const pts = barPolygon(m - phase, r, direction)
                      .map(([x, y]) => `${x * cell},${y * cell}`)
                      .join(" ");
                    return (
                      <polygon key={m} points={pts} {...barPaint(color, outline, outlineWidth)} />
                    );
                  })}
                </g>
              </g>
            );
          })}
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${uid})`} />
    </svg>
  );
});
