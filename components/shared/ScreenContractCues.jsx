"use client";

import {
  HIERARCHY_LEVELS,
  HIERARCHY_OBJECTIVE_CLASS,
  HIERARCHY_OBJECTIVE_LABEL_CLASS,
} from "@/lib/ui/hierarchyContract";

/**
 * Minimal always-visible four-question cues.
 * Level 2 — supports the task heading without competing with it.
 */
export default function ScreenContractCues({
  purpose = "",
  how = "",
  finished = "",
  showHow = true,
}) {
  const purposeText = String(purpose || "").trim();
  const howText = showHow ? String(how || "").trim() : "";
  const finishedText = String(finished || "").trim();
  if (!purposeText && !howText && !finishedText) return null;

  return (
    <div
      className="max-w-3xl space-y-1.5 text-left"
      data-testid="screen-contract-cues"
      data-hierarchy-level={HIERARCHY_LEVELS.objective}
    >
      {purposeText ? (
        <p
          className={HIERARCHY_OBJECTIVE_CLASS}
          data-testid="screen-contract-purpose"
          data-hierarchy-level={HIERARCHY_LEVELS.objective}
        >
          <span className={HIERARCHY_OBJECTIVE_LABEL_CLASS}>Why this matters: </span>
          {purposeText}
        </p>
      ) : null}
      {howText ? (
        <p
          className={HIERARCHY_OBJECTIVE_CLASS}
          data-testid="screen-contract-how"
          data-hierarchy-level={HIERARCHY_LEVELS.instruction}
        >
          <span className={HIERARCHY_OBJECTIVE_LABEL_CLASS}>How to succeed: </span>
          {howText}
        </p>
      ) : null}
      {finishedText ? (
        <p
          className={HIERARCHY_OBJECTIVE_CLASS}
          data-testid="screen-contract-finished"
          data-hierarchy-level={HIERARCHY_LEVELS.objective}
        >
          <span className={HIERARCHY_OBJECTIVE_LABEL_CLASS}>You’re ready when: </span>
          {finishedText}
        </p>
      ) : null}
    </div>
  );
}
