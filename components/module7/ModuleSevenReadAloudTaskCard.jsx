"use client";

/**
 * Dominant Read Aloud task — reading aloud finds what to revise.
 */

import { MODULE7_REVISION_STRENGTH_FRAME } from "@/lib/module7/module7RevisionStrategy";
import {
  MODULE7_READ_ALOUD_STAGE_LABEL,
  MODULE7_REVISION_CYCLE_LABEL,
} from "@/lib/module7/module7ReadAloudObservation";

export default function ModuleSevenReadAloudTaskCard() {
  return (
    <section
      className="rounded-xl border-2 border-theme-orange/45 bg-theme-orange/10 px-4 py-3 shadow-soft ring-1 ring-theme-orange/20 md:px-5"
      aria-label="Your revision strategy"
      data-testid="module7-read-aloud-task"
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-theme-orange">
        Your revision strategy
      </p>
      <h2 className="mt-1 text-lg font-bold leading-snug text-text-primary md:text-xl">
        Listen like a reader
      </h2>
      <p className="mt-2 text-sm leading-snug text-text-primary">
        Reading aloud helps you find places where your ideas may not reach the
        reader clearly. You are not recording just to finish a recording—you are
        listening so you can decide what to revise.
      </p>
      <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm leading-snug text-text-primary">
        <li>Read your current essay aloud.</li>
        <li>Record yourself while you read.</li>
        <li>Play the recording back.</li>
        <li>Name one place you want to strengthen.</li>
      </ol>
      <p
        className="mt-2 text-xs font-semibold uppercase tracking-wide text-text-muted"
        data-testid="module7-revision-cycle"
      >
        {MODULE7_REVISION_CYCLE_LABEL}
      </p>
      <p className="mt-1 text-sm leading-snug text-text-primary">
        {MODULE7_READ_ALOUD_STAGE_LABEL}
      </p>
      <p
        className="mt-2 text-sm font-semibold leading-snug text-text-primary"
        data-testid="module7-strength-frame"
      >
        {MODULE7_REVISION_STRENGTH_FRAME}
      </p>
    </section>
  );
}
