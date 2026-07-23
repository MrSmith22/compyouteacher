/**
 * WP-096 — Shared “Your job right now” instruction card.
 * Extracted from ModuleSixStepFrame with identical production markup/behavior.
 */

import {
  HIERARCHY_INSTRUCTION_BODY_CLASS,
  HIERARCHY_INSTRUCTION_CLASS,
  HIERARCHY_INSTRUCTION_LABEL_CLASS,
  HIERARCHY_INSTRUCTION_LEAD_CLASS,
  HIERARCHY_LEVELS,
} from "@/lib/ui/hierarchyContract";

export const JOB_RIGHT_NOW_RESOURCE_CUE = Object.freeze({
  thesis: {
    label: "Thesis · Need Help",
    className:
      "inline-flex items-center rounded-md border border-theme-blue/30 bg-theme-blue/10 px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-theme-blue",
  },
  outline: {
    label: "Outline · Need Help",
    className:
      "inline-flex items-center rounded-md border border-theme-green/30 bg-theme-green/10 px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-theme-green",
  },
  help: {
    label: "Need Help below",
    className:
      "inline-flex items-center rounded-md border border-theme-orange/30 bg-theme-orange/10 px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-theme-orange",
  },
});

export function normalizeJobRightNowSteps(steps) {
  if (!Array.isArray(steps)) return [];
  return steps
    .map((step) => {
      if (typeof step === "string" && step.trim()) {
        return { text: step.trim(), find: null };
      }
      if (step && typeof step === "object") {
        const text = String(step.text || "").trim();
        if (!text) return null;
        const find = JOB_RIGHT_NOW_RESOURCE_CUE[step.find] ? step.find : null;
        return { text, find };
      }
      return null;
    })
    .filter(Boolean);
}

/**
 * @param {{
 *   jobRightNow?: { lead?: string, steps?: unknown[], closing?: string, findHint?: string } | null,
 *   needHelpId?: string|null,
 *   onNeedHelpClick?: (event: import("react").MouseEvent) => void,
 * }} props
 */
export default function JobRightNow({
  jobRightNow,
  needHelpId = null,
  onNeedHelpClick = null,
}) {
  const steps = normalizeJobRightNowSteps(jobRightNow?.steps);
  if (!steps.length) return null;

  return (
    <div
      className={HIERARCHY_INSTRUCTION_CLASS}
      data-testid="screen-contract-how"
      data-hierarchy-level={HIERARCHY_LEVELS.instruction}
      data-instructional-color-role="instruction"
    >
      <p className={HIERARCHY_INSTRUCTION_LABEL_CLASS}>Your job right now</p>
      {jobRightNow.lead ? (
        <p className={HIERARCHY_INSTRUCTION_LEAD_CLASS}>{jobRightNow.lead}</p>
      ) : null}
      <ol
        className={`mt-3 list-decimal space-y-2 pl-5 ${HIERARCHY_INSTRUCTION_BODY_CLASS}`}
      >
        {steps.map((step) => {
          const cue = step.find ? JOB_RIGHT_NOW_RESOURCE_CUE[step.find] : null;
          return (
            <li key={step.text}>
              <span>{step.text}</span>
              {cue ? (
                <>
                  {" "}
                  <span className={cue.className}>{cue.label}</span>
                </>
              ) : null}
            </li>
          );
        })}
      </ol>
      <p className={`mt-3 font-medium ${HIERARCHY_INSTRUCTION_BODY_CLASS}`}>
        {jobRightNow.closing || "Start with Step 1 in the writing box below."}
      </p>
      {jobRightNow.findHint ? (
        <p className="mt-2 text-sm leading-relaxed text-text-muted">
          {jobRightNow.findHint}{" "}
          {needHelpId ? (
            <a
              href={`#${needHelpId}`}
              onClick={onNeedHelpClick || undefined}
              className="font-medium text-text-muted underline decoration-border-soft underline-offset-2 hover:text-text-primary"
            >
              Jump to Need Help
            </a>
          ) : null}
        </p>
      ) : null}
    </div>
  );
}
