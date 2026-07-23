import WorkspaceCenter from "@/components/layout/WorkspaceCenter";
import WorkspaceColumns from "@/components/layout/WorkspaceColumns";
import WorkspaceGuide from "@/components/layout/WorkspaceGuide";
import WorkspaceSidebar from "@/components/layout/WorkspaceSidebar";
import {
  HIERARCHY_INSTRUCTION_BODY_CLASS,
  HIERARCHY_INSTRUCTION_CLASS,
  HIERARCHY_INSTRUCTION_LABEL_CLASS,
  HIERARCHY_LEVELS,
  HIERARCHY_REFERENCE_CLASS,
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

export default function ModuleThreeStepFrame({
  question,
  whyMatters,
  example = "",
  successLooksLike = [],
  children,
  sidebar = null,
  coachingMessage = "",
  nextStepText = "",
  minimalChrome = false,
  moduleNumber = 3,
}) {
  const workspacePresentation = resolveTaskWorkspacePresentation({
    moduleNumber,
    taskHeading: question,
    desktopWidthIntent: "planning",
  });
  const whyLines = normalizeWhyMatters(whyMatters);
  const successItems = Array.isArray(successLooksLike)
    ? successLooksLike.filter(Boolean)
    : [];
  const primaryWhy = whyLines[0] || "";
  const extraWhy = whyLines.slice(1);

  if (minimalChrome) {
    return (
      <div
        className="mx-auto w-full max-w-3xl text-left"
        data-task-workspace-foundation="true"
        data-task-workspace-contract={workspacePresentation.journeyStageId}
      >
        {children}
      </div>
    );
  }

  return (
    <WorkspaceColumns
      className="gap-6 xl:gap-10"
      data-task-workspace-foundation="true"
      data-task-workspace-contract={workspacePresentation.journeyStageId}
      data-testid="task-workspace-frame"
    >
      <WorkspaceSidebar
        className="opacity-90 order-4 lg:order-1"
        data-task-workspace-region="desk"
        data-instructional-color-role="student-thinking"
      >
        {sidebar}
      </WorkspaceSidebar>

      <WorkspaceCenter className="order-1 lg:order-2">
        <div className="space-y-8 md:space-y-10">
          <header className="space-y-4 py-2 text-left md:py-4">
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-text-muted">
              Your task
            </p>
            <h1
              className={HIERARCHY_TASK_CLASS}
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
              data-task-workspace-region="job"
            >
              <p className={HIERARCHY_INSTRUCTION_LABEL_CLASS}>Your job right now</p>
              <p className={`mt-2 ${HIERARCHY_INSTRUCTION_BODY_CLASS}`}>{primaryWhy}</p>
            </div>
          ) : null}

          <div className="max-w-2xl space-y-3 text-left">
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
                    <p key={line} className="text-sm leading-relaxed text-text-muted">
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
                    Keep going in your own words. We&apos;re building thinking you can use later.
                  </p>
                )}
              </div>
            </details>

            <details className="rounded-lg bg-surface-soft/50 px-4 py-3">
              <summary className="cursor-pointer list-none text-xs font-medium text-text-muted">
                An example
              </summary>
              <div className="mt-2">
                {example ? (
                  <p className="text-sm leading-relaxed text-text-primary">{example}</p>
                ) : (
                  <p className="text-sm leading-relaxed text-text-muted">
                    If you&apos;re not sure yet, start with a simple answer you can test.
                  </p>
                )}
              </div>
            </details>

            <details
              className="rounded-lg bg-surface-soft/50 px-4 py-3"
              open={false}
            >
              <summary className="cursor-pointer list-none text-xs font-medium text-text-muted">
                Reflection: how do I know I&apos;m finished?
              </summary>
              <div className="mt-2">
                {successItems.length > 0 ? (
                  <>
                    <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-text-muted marker:text-text-muted/60">
                      {successItems.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                    <p className="mt-2 text-sm leading-relaxed text-text-muted">
                      If your thinking is clear enough to explain, it&apos;s clear enough to keep going.
                    </p>
                  </>
                ) : (
                  <p className="text-sm leading-relaxed text-text-muted">
                    If your thinking is clear enough to explain, it&apos;s clear enough to keep going.
                  </p>
                )}
              </div>
            </details>
          </div>

          <div
            className="space-y-8"
            data-task-workspace-region="work"
            data-testid="task-workspace-work"
          >
            {children}
          </div>
        </div>
      </WorkspaceCenter>

      <WorkspaceGuide
        className={`opacity-90 order-5 lg:order-3 ${HIERARCHY_REFERENCE_CLASS}`}
        data-task-workspace-region="shelf"
        data-instructional-color-role="reference"
      >
        <aside className="space-y-5 rounded-xl bg-surface-soft/70 px-4 py-5 text-left">
          <div className="space-y-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-text-muted">
              From your teacher
            </p>
            <p className="text-sm leading-relaxed text-text-primary">
              {coachingMessage || "Keep your language simple and honest. Clear thinking beats fancy words."}
            </p>
          </div>

          <div className="space-y-2 border-t border-border-soft/60 pt-4">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-text-muted">
              Where this is going
            </p>
            <p className="text-sm leading-relaxed text-text-muted">
              {nextStepText || "We&apos;ll keep following the same group of quotes as your thinking gets clearer."}
            </p>
          </div>
        </aside>
      </WorkspaceGuide>
    </WorkspaceColumns>
  );
}
