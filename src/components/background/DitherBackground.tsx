"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import type { DitherProps } from "./Dither";

// El canvas WebGL es solo-cliente → carga diferida sin SSR.
// El fallback `bg-ink` evita un flash mientras hidrata.
const Dither = dynamic(() => import("./Dither"), { ssr: false });

/**
 * Fondo dither fijo, detrás del contenido. Va a z-index auto (0), no negativo:
 * un `-z-10` lo mandaría DETRÁS del fondo `bg-ink` del <body> y quedaría tapado.
 * El contenido va encima con `main.relative.z-10` (ver `page.tsx`).
 * Recibe los eventos de puntero: el contenido del hero usa `pointer-events-none`
 * para que el patrón reaccione al cursor a través de él.
 */
export function DitherBackground(props: Partial<DitherProps>) {
  // El chunk WebGL carga diferido (ssr:false) y aparece de golpe cuando resuelve.
  // Arrancamos en opacity-0 y disparamos el fade tras el primer paint del canvas,
  // así el `bg-ink` de abajo hace de puente en vez de un pop visual.
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div className="fixed inset-0 bg-ink" aria-hidden>
      <div
        className="h-full w-full transition-opacity duration-700 ease-out"
        style={{ opacity: ready ? 1 : 0 }}
      >
        <Dither
          // Color base de la onda, RGB normalizado 0–1 (oficial: [0.5, 0.5, 0.5]).
          waveColor={[0.54, 0.1, 0.1]}
          // Nº de niveles de color del posterizado dither, ≥2 (oficial: 4).
          colorNum={8}
          // Tamaño del pixelado en px; más alto = más gordo/retro (oficial: 2).
          pixelSize={2}
          // Frecuencia del ruido: más alto = patrón más apretado (oficial: 3).
          waveFrequency={3}
          // Amplitud/contraste de la onda (oficial: 0.3).
          waveAmplitude={0.3}
          // Velocidad de animación; 0 = quieto (oficial: 0.05).
          waveSpeed={0.02}
          // Congela la animación por completo (oficial: false).
          disableAnimation={false}
          // El patrón reacciona al cursor (oficial: true).
          enableMouseInteraction={true}
          // Radio de influencia del cursor (oficial: 1).
          mouseRadius={0.9}
          // Permite sobreescribir cualquier prop desde quien monte el fondo.
          {...props}
        />
      </div>
    </div>
  );
}
