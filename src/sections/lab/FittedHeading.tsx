"use client";

import { useLayoutEffect, useRef } from "react";

export function FittedHeading({ label }: { label: string }) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const heading = headingRef.current;
    const text = textRef.current;
    if (!heading || !text) return;

    const fit = () => {
      text.style.fontSize = "";
      const overflowRatio = text.getBoundingClientRect().width / (heading.getBoundingClientRect().width * 0.96);
      if (overflowRatio > 1) text.style.fontSize = `${1 / overflowRatio}em`;
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
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", fit);
    };
  }, []);

  return (
    <h2
      ref={headingRef}
      className="h-[0.9em] whitespace-nowrap font-display text-[min(clamp(2.5rem,6vw,6rem),11cqi)] font-extrabold uppercase leading-[0.9] text-red"
    >
      <span ref={textRef} className="inline-block align-top tracking-[-0.04em]">
        {label}
      </span>
    </h2>
  );
}
