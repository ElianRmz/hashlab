"use client";

import { forwardRef, Fragment } from "react";
import { motion, type HTMLMotionProps } from "motion/react";
import { cn } from "@/lib/cn";

/**
 * Tagline — lema en Instrument Serif, última palabra (accent) en itálica.
 *   <Tagline lead="CREAR PARA" accent="ENTENDER" />
 *   <Tagline lead="ENTENDER PARA" accent="CREAR" tone="red" lines={2} breakAfter={1} />
 *
 * `breakAfter` es 1-based: break after the nth word of the full phrase.
 * Default: break just before the accent (after all lead words).
 */
type TaglineTone = "red" | "redMuted" | "paper";

const TONE_CLASS: Record<TaglineTone, string> = {
  red: "text-red",
  redMuted: "text-red-muted",
  paper: "text-paper",
};

export type TaglineProps = {
  lead: string;
  accent: string;
  tone?: TaglineTone;
  lines?: 1 | 2;
  breakAfter?: number;
} & HTMLMotionProps<"p">;

export const Tagline = forwardRef<HTMLParagraphElement, TaglineProps>(
  function Tagline(
    { lead, accent, tone = "redMuted", lines = 1, breakAfter, className, ...rest },
    ref,
  ) {
    const leadWords = lead.split(" ");
    const allWords = [...leadWords, accent];
    const defaultBreakAfter = leadWords.length;
    const breakPos = lines === 2 ? (breakAfter ?? defaultBreakAfter) : null;

    return (
      <motion.p
        ref={ref}
        className={cn(
          "font-serif font-normal uppercase",
          "text-sm sm:text-base",
          TONE_CLASS[tone],
          className,
        )}
        {...rest}
      >
        {allWords.map((word, i) => (
          <Fragment key={i}>
            {i > 0 && (breakPos === null || i !== breakPos) && " "}
            {i === allWords.length - 1 ? (
              <em className="italic">{word}</em>
            ) : (
              word
            )}
            {breakPos !== null && i === breakPos - 1 && <br />}
          </Fragment>
        ))}
      </motion.p>
    );
  },
);
