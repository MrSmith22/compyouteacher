"use client";

import ModuleSevenDisclosure from "@/components/module7/ModuleSevenDisclosure";
import {
  MODULE7_REVISION_STRENGTH_FRAME,
  MODULE7_REVISION_VS_PROOFREADING,
} from "@/lib/module7/module7RevisionStrategy";

/**
 * Secondary Read Aloud instruction — below the primary task.
 * One job: explain what revision means after the student knows what to do now.
 */
export default function ModuleSevenReadAloudSecondaryTeaching({
  strategy = null,
}) {
  const vs = MODULE7_REVISION_VS_PROOFREADING;

  return (
    <div
      className="space-y-2 overflow-x-hidden text-left"
      data-testid="module7-read-aloud-secondary"
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted">
        Optional — after you record
      </p>

      <div data-instructional-color-role="reference">
        <ModuleSevenDisclosure
          title="What revision means here"
          data-testid="module7-entry-teaching"
        >
          <p className="text-sm font-semibold text-text-primary">
            {MODULE7_REVISION_STRENGTH_FRAME}
          </p>
          <p className="text-sm leading-relaxed text-text-primary">
            Your Module 6 draft is already complete. After this read-aloud, you will
            strengthen how clearly those ideas reach your reader—one section and one
            strategy at a time.
          </p>
        </ModuleSevenDisclosure>
      </div>

      <div data-instructional-color-role="reference">
        <ModuleSevenDisclosure
          title="Revision is not proofreading"
          data-testid="module7-revision-vs-proofreading"
        >
          <p className="text-sm leading-relaxed text-text-primary">{vs.revisionMeans}</p>
          <p className="text-sm leading-relaxed text-text-muted">{vs.proofreadingMeans}</p>
          <p className="text-sm leading-relaxed text-text-primary">{vs.distinction}</p>
        </ModuleSevenDisclosure>
      </div>

      {strategy?.deeperExplanation || strategy?.example?.sample ? (
        <div data-instructional-color-role="reference">
          <ModuleSevenDisclosure
            title="Listening tips and example"
            data-testid="module7-strategy-card"
          >
            <div data-strategy-id={strategy.id || "read-aloud"}>
            {strategy.deeperExplanation ? (
              <p className="text-sm leading-relaxed text-text-muted">
                {strategy.deeperExplanation}
              </p>
            ) : null}
            {strategy.example?.sample ? (
              <p className="text-sm leading-relaxed text-text-primary">
                Example: {strategy.example.sample}
              </p>
            ) : null}
            {strategy.example?.whyItWorks ? (
              <p className="text-sm leading-relaxed text-text-muted">
                Why it works: {strategy.example.whyItWorks}
              </p>
            ) : null}
            </div>
          </ModuleSevenDisclosure>
        </div>
      ) : null}
    </div>
  );
}
