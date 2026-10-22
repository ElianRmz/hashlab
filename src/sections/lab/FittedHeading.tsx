"use client";

import { useLayoutEffect, useRef } from "react";

export function FittedHeading({ label }: { label: string }) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const heading = headingRef.current;
    const text = textRef.current;
    if (!heading || !text) return;

    const range = document.createRange();
    range.selectNodeContents(text);
    const fit = () => {
      let size = parseFloat(getComputedStyle(heading).fontSize);
      const available = heading.getBoundingClientRect().width * 0.96;
      text.style.fontSize = `${size}px`;
      for (let attempt = 0; attempt < 3; attempt++) {
        const width = range.getBoundingClientRect().width;
        if (width <= available || width === 0) break;
        size = Math.floor(size * available / width * 100) / 100;
        text.style.fontSize = `${size}px`;
      }
    };

    fit();
    let frame = 0;
    // Schedule observer writes outside the resize delivery that they can trigger.
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(fit);
    });
    observer.observe(heading);
    observer.observe(text);
    window.addEventListener("resize", fit);
    document.fonts.addEventListener("loadingdone", fit);
    let active = true;
    void document.fonts.ready.then(() => { if (active) fit(); });
    return () => {
      active = false;
      observer.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", fit);
      document.fonts.removeEventListener("loadingdone", fit);
    };
  }, [label]);

  return (
    <h2
      ref={headingRef}
      className="h-[0.9em] whitespace-nowrap font-display text-[min(clamp(2.5rem,6vw,6rem),11cqi)] font-extrabold uppercase leading-[0.9] text-red"
    >
      <span ref={textRef} className="inline-block align-top text-[min(1em,6cqi)] tracking-[-0.04em]">
        {label}
      </span>
    </h2>
  );
}
