/**
 * Module 5 instructional frame — same coaching structure as Module 3,
 * with a wide main workspace instead of the Module 3 three-column squeeze.
 *
 * Desktop (lg+): centered shell ~1180px; main ~680–820px; compact right rail.
 * Tablet / mobile (<lg): single column; guidance stacks below the workspace.
 */

import ModuleModeCue from "@/components/shared/ModuleModeCue";
import {
  HIERARCHY_INSTRUCTION_CLASS,
  HIERARCHY_INSTRUCTION_LABEL_CLASS,
  HIERARCHY_INSTRUCTION_BODY_CLASS,
  HIERARCHY_LEVELS,
  HIERARCHY_TASK_CLASS,
} from "@/lib/ui/hierarchyContract";
import { resolveTaskWorkspacePresentation } from "@/lib/ui/taskWorkspaceContract";

function normalizeWhyMatters(whyMatters) {
  if (Array.isArray(whyMatters)) {
    return whyMatters.filter(Boolean);
  }
  if (typeof whyMatters === "string" && whyMatters.trim()) {
    return [whyMatters.trim()];
  }
  return [];
}

export default function ModuleFiveStepFrame({
  question,
  whyMatters,
  successLooksLike = [],
  children,
  coachingMessage = "",
  nextStepText = "",
  psychologicalModule = 5,
}) {
  const workspacePresentation = resolveTaskWorkspacePresentation({
    moduleNumber: 5,
    taskHeading: question,
    desktopWidthIntent: "planning",
  });
  const whyLines = normalizeWhyMatters(whyMatters);
  const successItems = Array.isArray(successLooksLike)
    ? successLooksLike.filter(Boolean)
    : [];
  const primaryWhy = whyLines[0] || "";
  const extraWhy = whyLines.slice(1);

  return (
    <div
      className="mx-auto w-full max-w-[1180px] overflow-x-hidden"
      data-module5-step-frame="true"
      data-cpf-desktop-shell="1180"
      data-task-workspace-foundation="true"
      data-task-workspace-contract={workspacePresentation.journeyStageId}
      data-testid="task-workspace-frame"
    >
      <div
        className={[
          "grid grid-cols-1 gap-6",
          "lg:grid-cols-[minmax(0,1fr)_minmax(220px,280px)] lg:items-start lg:gap-8",
        ].join(" ")}
        data-cpf-layout-grid="module5"
      >
        <section
          className="min-w-0 w-full max-w-none space-y-6 lg:max-w-[820px]"
          aria-label="Outline workspace"
          data-module5-main-workspace="true"
          data-cpf-main-max="820"
        >
          {psychologicalModule != null ? (
            <ModuleModeCue module={psychologicalModule} />
          ) : null}

          <header className="space-y-3 py-1 text-left md:py-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-text-muted">
              Plan · Outline
            </p>
            <h1
              className={HIERARCHY_TASK_CLASS}
              data-module5-question="true"
              data-testid="task-workspace-task"
              data-hierarchy-level={HIERARCHY_LEVELS.task}
            >
              {question}
            </h1>
          </header>

          {primaryWhy ? (
            <div
              className={HIERARCHY_INSTRUCTION_CLASS}
              data-testid="task-workspace-job"
              data-hierarchy-level={HIERARCHY_LEVELS.instruction}
              data-instructional-color-role="instruction"
            >
              <p className={HIERARCHY_INSTRUCTION_LABEL_CLASS}>Your job right now</p>
              <p className={`mt-2 ${HIERARCHY_INSTRUCTION_BODY_CLASS}`}>{primaryWhy}</p>
            </div>
          ) : null}

          <div className="w-full space-y-3 text-left">
            <details
              className="rounded-lg bg-surface-soft/50 px-4 py-3"
              open={false}
            >
              <summary className="cursor-pointer list-none text-xs font-medium text-text-muted">
                Why this matters
              </summary>
              <div className="mt-2 space-y-2">
                {extraWhy.length > 0 ? (
                  extraWhy.map((line) => (
                    <p
                      key={line}
                      className="text-sm leading-relaxed text-text-muted"
                    >
                      {line}
                    </p>
                  ))
                ) : primaryWhy ? (
                  <p className="text-sm leading-relaxed text-text-muted">
                    More context stays here if you want it. Your required instruction
                    is already visible above.
                  </p>
                ) : (
                  <p className="text-sm leading-relaxed text-text-muted">
                    Keep going in your own words. We&apos;re building thinking
                    you can use later.
                  </p>
                )}
              </div>
            </details>

            {successItems.length > 0 ? (
              <details className="rounded-lg bg-surface-soft/50 px-4 py-3">
                <summary className="cursor-pointer list-none text-xs font-medium text-text-muted">
                  How do I know I&apos;m finished?
                </summary>
                <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-text-muted marker:text-text-muted/60">
                  {successItems.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </details>
            ) : null}
          </div>

          <div
            className="w-full min-w-0 space-y-6"
            data-module5-stage-content="true"
            data-testid="task-workspace-work"
            data-instructional-color-role="writing"
          >
            {children}
          </div>
        </section>

        <aside
          className="min-w-0 w-full lg:sticky lg:top-6 lg:self-start"
          aria-label="Teacher guidance"
          data-module5-teacher-rail="true"
        >
          <div className="space-y-5 rounded-xl bg-surface-soft/70 px-4 py-5 text-left">
            <div className="space-y-2">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-text-muted">
                From your teacher
              </p>
              <p className="text-sm leading-relaxed text-text-primary">
                {coachingMessage ||
                  "Keep your language simple and honest. Clear thinking beats fancy words."}
              </p>
            </div>

            <div className="space-y-2 border-t border-border-soft/60 pt-4">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-text-muted">
                What comes next
              </p>
              <p className="text-sm leading-relaxed text-text-muted">
                {nextStepText ||
                  "Keep one outline decision at a time as your paragraph order becomes clear."}
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
