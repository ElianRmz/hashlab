/**
 * UEDS — Tokens de marca en TypeScript.
 *
 * Espejo de las CSS vars de `globals.css`. Se usa donde la lógica necesita los
 * valores en JS (geometría del isologo, variants de motion, swatches del espectro).
 * Mantener sincronizado con el bloque `@theme` de globals.css.
 */
export const brand = {
  color: {
    ink: "#0a0a0b",
    inkSoft: "#131316",
    red: "#ff0034",
    redMuted: "#b21228",
    redDeep: "#5a0410",
    paper: "#ededed",
    paperDim: "#8a8a8e",
    /** Barra de espectro: 6 celdas gris → gris claro → blanco → vino → rojo → rojo vivo. */
    spectrum: ["#6f6f73", "#c9c9cc", "#f2f2f2", "#5d1118", "#b21228", "#ff0034"],
  },

  /** Tokens de movimiento — listos para construir variants de motion después. */
  motion: {
    dur: { fast: 0.18, base: 0.32, slow: 0.6 },
    ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    /** Movimiento sobre pantalla (indicadores que se desplazan de un punto a otro). */
    easeInOut: [0.77, 0, 0.175, 1] as [number, number, number, number],
    stagger: 0.045,
  },

  /**
   * Geometría de la primitiva `Slash` (hazard stripes y separadores).
   * El isologo NO usa esto: es la rejilla `DiagonalBars` verificada vs Figma.
   */
  geometry: {
    /** Desplazamiento horizontal entre base y tope de la barra (unidades de viewBox). */
    slashSkew: 30,
    /** Proporción grosor-de-barra respecto al paso entre barras (0–1). */
    slashRatio: 0.58,
  },
} as const;

export type BrandColorToken = keyof typeof brand.color;
