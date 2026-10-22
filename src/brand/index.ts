/**
 * UEDS — API pública del sistema de identidad.
 *
 * Punto único de importación para toda la marca:
 *   import { Isologo, Display, Tagline, brand } from "@/brand";
 */

// Tokens
export { brand } from "./tokens";
export type { BrandColorToken } from "./tokens";

// Primitivas
export { Slash } from "./primitives/Slash";
export type { SlashProps, SlashTone } from "./primitives/Slash";
export { SplitChars } from "./primitives/SplitChars";
export type { SplitCharsProps } from "./primitives/SplitChars";

// Isologo
export { Isologo } from "./isologo/Isologo";
export type { IsologoProps, IsologoTone } from "./isologo/Isologo.types";

// Marcas derivadas
export { DiagonalBars, gridBars, barPolygon } from "./marks/DiagonalBars";
export type { DiagonalBarsProps, GridBar } from "./marks/DiagonalBars";
export { HazardStripes } from "./marks/HazardStripes";
export type { HazardStripesProps } from "./marks/HazardStripes";
export { CodeGlyph } from "./marks/CodeGlyph";
export type { CodeGlyphProps } from "./marks/CodeGlyph";
export { SpectrumBar } from "./marks/SpectrumBar";
export type { SpectrumBarProps } from "./marks/SpectrumBar";

// Tipografía
export { Display } from "./typography/Display";
export type { DisplayProps } from "./typography/Display";
export { Tagline } from "./typography/Tagline";
export type { TaglineProps } from "./typography/Tagline";
export { Label } from "./typography/Label";
export type { LabelProps } from "./typography/Label";
export { Coordinates } from "./typography/Coordinates";
export type { CoordinatesProps } from "./typography/Coordinates";
