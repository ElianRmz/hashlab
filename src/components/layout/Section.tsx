import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/cn";

/**
 * Section — envoltura genérica de sección. La base para escalar la página:
 * cada nueva sección debajo del hero reusa este contenedor (padding, ancho, alto).
 */
export type SectionProps = ComponentPropsWithoutRef<"section"> & {
  /** Ocupa al menos el alto del viewport (para secciones tipo hero). */
  fullHeight?: boolean;
};

export function Section({
  className,
  fullHeight = false,
  children,
  ...rest
}: SectionProps) {
  return (
    <section
      className={cn(
        "relative w-full px-5 sm:px-8 lg:px-14",
        fullHeight && "min-h-svh",
        className,
      )}
      {...rest}
    >
      {children}
    </section>
  );
}
