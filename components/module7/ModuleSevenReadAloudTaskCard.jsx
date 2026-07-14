"use client";

/**
 * Dominant Read Aloud task — reading aloud finds what to revise.
 * Level 3 instruction — quieter than the page task heading / essay work.
 */

import { MODULE7_REVISION_STRENGTH_FRAME } from "@/lib/module7/module7RevisionStrategy";
import {
  MODULE7_READ_ALOUD_STAGE_LABEL,
  MODULE7_REVISION_CYCLE_LABEL,
} from "@/lib/module7/module7ReadAloudObservation";
import {
  HIERARCHY_INSTRUCTION_BODY_CLASS,
  HIERARCHY_INSTRUCTION_CLASS,
  HIERARCHY_INSTRUCTION_LABEL_CLASS,
  HIERARCHY_INSTRUCTION_LEAD_CLASS,
  HIERARCHY_LEVELS,
} from "@/lib/ui/hierarchyContract";

export default function ModuleSevenReadAloudTaskCard() {
  return (
    <section
      className={HIERARCHY_INSTRUCTION_CLASS}
      aria-label="Your revision strategy"
      data-testid="module7-read-aloud-task"
      data-hierarchy-level={HIERARCHY_LEVELS.instruction}
    >
      <p className={HIERARCHY_INSTRUCTION_LABEL_CLASS}>Your revision strategy</p>
      <h2 className={HIERARCHY_INSTRUCTION_LEAD_CLASS}>Listen like a reader</h2>
      <p className={`mt-2 ${HIERARCHY_INSTRUCTION_BODY_CLASS}`}>
        Reading aloud helps you find places where your ideas may not reach the
        reader clearly. You are not recording just to finish a recording—you are
        listening so you can decide what to revise.
      </p>
      <ol className={`mt-2 list-decimal space-y-1 pl-5 ${HIERARCHY_INSTRUCTION_BODY_CLASS}`}>
        <li>Read your current essay aloud.</li>
        <li>Record yourself while you read.</li>
        <li>Play the recording back.</li>
        <li>Name one place you want to strengthen.</li>
      </ol>
      <p
        className="mt-2 text-xs font-medium uppercase tracking-wide text-text-muted"
        data-testid="module7-revision-cycle"
      >
        {MODULE7_REVISION_CYCLE_LABEL}
      </p>
      <p className={`mt-1 ${HIERARCHY_INSTRUCTION_BODY_CLASS}`}>
        {MODULE7_READ_ALOUD_STAGE_LABEL}
      </p>
      <p
        className={`mt-2 font-medium ${HIERARCHY_INSTRUCTION_BODY_CLASS}`}
        data-testid="module7-strength-frame"
      >
        {MODULE7_REVISION_STRENGTH_FRAME}
      </p>
    </section>
  );
}
