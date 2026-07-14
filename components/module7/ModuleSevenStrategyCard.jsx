"use client";

/**
 * WP-020 — short strategy card before the Module 7 section working set.
 * Secondary explanations live in disclosures so the desk stays primary.
 * WP-061 — revision-role orange (not instruction blue).
 */

import ModuleSevenDisclosure from "@/components/module7/ModuleSevenDisclosure";
import {
  MODULE7_CHANGE_STAGE_HINT,
  MODULE7_CHANGE_STAGE_LABEL,
  MODULE7_COMPARE_STAGE_HINT,
  MODULE7_COMPARE_STAGE_LABEL,
  MODULE7_REVISION_CYCLE_LABEL,
} from "@/lib/module7/module7ReadAloudObservation";
import { INSTRUCTIONAL_COLOR_ROLES } from "@/lib/ui/instructionalColorContract";

const REVISION = INSTRUCTIONAL_COLOR_ROLES.revision;

export default function ModuleSevenStrategyCard({
  strategy,
  showEntryTeaching = false,
  entryTeaching = null,
  revisionStage = "change",
}) {
  if (!strategy && !entryTeaching) return null;

  const primary = strategy;
  const entry = showEntryTeaching ? entryTeaching : null;
  const isCompare = revisionStage === "compare";
  const stageLabel = isCompare
    ? MODULE7_COMPARE_STAGE_LABEL
    : MODULE7_CHANGE_STAGE_LABEL;
  const stageHint = isCompare
    ? MODULE7_COMPARE_STAGE_HINT
    : MODULE7_CHANGE_STAGE_HINT;

  return (
    <div
      className="space-y-3 overflow-x-hidden text-left"
      data-wp020-strategy={primary?.id || entry?.id || "none"}
      data-wp020-layout={primary?.screen || entry?.screen || ""}
      data-wp020-revision-stage={revisionStage}
    >
      {entry ? (
        <section
          className={REVISION.softSurfaceClass}
          aria-label="Module 7 revision entry"
          data-testid="module7-entry-teaching"
          data-instructional-color-role="revision"
        >
          <p className={REVISION.labelClass}>Start Module 7</p>
          <h2 className="mt-1 text-lg font-bold leading-snug text-text-primary md:text-xl">
            {entry.title}
          </h2>
          <p
            className="mt-2 text-sm font-semibold leading-relaxed text-text-primary"
            data-testid="module7-strength-frame"
          >
            {entry.strengthFrame}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-text-primary">{entry.teach}</p>
          {entry.revisionVsProofreading ? (
            <div
              className="mt-3 space-y-2 rounded-lg border border-border-soft/70 bg-white/80 px-3 py-3"
              data-testid="module7-revision-vs-proofreading"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                Revision is not proofreading
              </p>
              <p className="text-sm leading-relaxed text-text-primary">
                {entry.revisionVsProofreading.revisionMeans}
              </p>
              <p className="text-sm leading-relaxed text-text-muted">
                {entry.revisionVsProofreading.proofreadingMeans}
              </p>
              <p className="text-sm leading-relaxed text-text-primary">
                {entry.revisionVsProofreading.distinction}
              </p>
            </div>
          ) : null}
        </section>
      ) : null}

          {primary ? (
        <section
          className={REVISION.softSurfaceClass}
          aria-label={`Revision strategy: ${primary.title}`}
          data-testid="module7-strategy-card"
          data-strategy-id={primary.id}
          data-strategy-focus={primary.focusId || ""}
          data-hierarchy-level="instruction"
          data-instructional-color-role="revision"
        >
          <p
            className={REVISION.labelClass}
            data-testid="module7-revision-stage-label"
          >
            {stageLabel}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-text-muted">{stageHint}</p>
          <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-text-muted">
            {MODULE7_REVISION_CYCLE_LABEL}
          </p>
          <h2 className="mt-2 text-base font-semibold leading-snug text-text-primary md:text-lg">
            {primary.title}
          </h2>
          {!entry ? (
            <p className="mt-2 text-sm font-medium leading-relaxed text-text-primary">
              {primary.strengthFrame}
            </p>
          ) : null}
          <p className="mt-2 text-sm leading-relaxed text-text-primary">{primary.teach}</p>
          <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm leading-relaxed text-text-primary">
            <li>{primary.noticePrompt}</li>
            <li>{primary.improvePrompt}</li>
          </ol>
          {Array.isArray(primary.checklist) && primary.checklist.length > 0 ? (
            <div className="mt-3">
              <ModuleSevenDisclosure
                title={
                  primary.id === "final-review"
                    ? "More confirm tips (optional)"
                    : "Keep in mind tips (optional)"
                }
              >
                <ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed text-text-muted">
                  {primary.checklist.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </ModuleSevenDisclosure>
            </div>
          ) : null}
          {primary.deeperExplanation || primary.example?.sample ? (
            <div className="mt-3" data-instructional-color-role="reference">
              <ModuleSevenDisclosure title="See an example">
                {primary.deeperExplanation ? (
                  <p className="text-sm leading-relaxed text-text-muted">
                    {primary.deeperExplanation}
                  </p>
                ) : null}
                {primary.example?.sample ? (
                  <p className="text-sm leading-relaxed text-text-primary">
                    Example: {primary.example.sample}
                  </p>
                ) : null}
                {primary.example?.whyItWorks ? (
                  <p className="text-sm leading-relaxed text-text-muted">
                    Why it works: {primary.example.whyItWorks}
                  </p>
                ) : null}
              </ModuleSevenDisclosure>
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
