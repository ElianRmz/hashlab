export type IsologoTone = "red" | "redMuted" | "redDeep" | "paper";

export interface IsologoProps {
  /** Lado en px. Omitir si el tamaño lo controla `className` (ej. h-[...] w-auto). */
  size?: number;
  /** Celdas por lado de la rejilla cuadrada. Default: 3 (la marca canónica). */
  grid?: number;
  /** Color de las barras. */
  tone?: IsologoTone;
  /** Color del hueco entre barras. Default: papel. */
  background?: string;
  /** Dirección de la diagonal. Default: "/". */
  direction?: "/" | "\\";
  /** Desfase de media celda en filas alternas (el "diente" característico). */
  stagger?: boolean;
  /**
   * Animación al pasar el cursor. Omitir = marca estática.
   * `"barrido"`: destello secuencial de las barras, izquierda → derecha.
   */
  hover?: "barrido";
  /** Texto accesible del logotipo. */
  title?: string;
  className?: string;
  style?: React.CSSProperties;
}
