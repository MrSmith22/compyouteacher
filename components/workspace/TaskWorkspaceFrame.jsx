"use client";

/**
 * WP-096 — Thin composable task-workspace frame.
 * Prefer slots over module-specific conditionals. Not a full page shell.
 */

import {
  HIERARCHY_MODULE_CHROME_CLASS,
  HIERARCHY_TASK_CLASS,
} from "@/lib/ui/hierarchyContract";
import { resolveTaskWorkspacePresentation } from "@/lib/ui/taskWorkspaceContract";
import TaskWorkspaceRegion from "./TaskWorkspaceRegion";

export default function TaskWorkspaceFrame({
  moduleNumber,
  stepIndex = null,
  stepCount = null,
  stepLabel = null,
  taskHeading,
  jobLead = null,
  desktopWidthIntent = "single",
  orientation = null,
  job = null,
  desk = null,
  work = null,
  feedback = null,
  readiness = null,
  actions = null,
  shelf = null,
  className = "",
  headingId = "task-workspace-heading",
}) {
  const presentation = resolveTaskWorkspacePresentation({
    moduleNumber,
    stepIndex,
    stepCount,
    stepLabel,
    taskHeading,
    jobLead,
    desktopWidthIntent,
  });

  const widthClass =
    presentation.desktopWidthIntent === "drafting"
      ? "w-full max-w-none"
      : presentation.desktopWidthIntent === "planning"
        ? "mx-auto w-full max-w-[1180px]"
        : "mx-auto w-full max-w-4xl";
  const workGridClass =
    presentation.desktopWidthIntent === "drafting"
      ? "grid gap-5 lg:grid-cols-[minmax(300px,0.65fr)_minmax(0,1.35fr)] lg:items-start"
      : presentation.desktopWidthIntent === "planning"
        ? "grid gap-5 lg:grid-cols-[minmax(260px,0.75fr)_minmax(0,1.25fr)] lg:items-start"
        : "grid gap-5";

  return (
    <div
      className={["flex flex-col gap-5", widthClass, className]
        .filter(Boolean)
        .join(" ")}
      data-testid="task-workspace-frame"
      data-module={presentation.moduleNumber || undefined}
      data-journey-stage={presentation.journeyStageId || undefined}
    >
      {orientation ? (
        <TaskWorkspaceRegion regionId="orientation" className="!bg-transparent !border-0 !p-0 !shadow-none">
          <div className="space-y-1">
            {presentation.journeyStageLabel || presentation.stepProgress ? (
              <p className={`${HIERARCHY_MODULE_CHROME_CLASS} text-sm !font-medium text-text-muted`}>
                {[presentation.journeyStageLabel, presentation.stepProgress]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            ) : null}
            {orientation}
          </div>
        </TaskWorkspaceRegion>
      ) : presentation.stepProgress || presentation.journeyStageLabel ? (
        <TaskWorkspaceRegion regionId="orientation" className="!bg-transparent !border-0 !p-0">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-text-muted">
            {[presentation.journeyStageLabel, presentation.stepProgress]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </TaskWorkspaceRegion>
      ) : null}

      <TaskWorkspaceRegion regionId="task" className="!bg-transparent !border-0 !p-0 !shadow-none">
        <h1 id={headingId} tabIndex={-1} className={HIERARCHY_TASK_CLASS}>
          {presentation.taskHeading || "Current task"}
        </h1>
        {jobLead ? (
          <p className="mt-2 max-w-prose text-sm leading-relaxed text-text-muted">
            {jobLead}
          </p>
        ) : null}
      </TaskWorkspaceRegion>

      {job ? <TaskWorkspaceRegion regionId="job">{job}</TaskWorkspaceRegion> : null}
      {desk || work ? (
        <div className={workGridClass} data-testid="task-workspace-desk-work-grid">
          {desk ? (
            <TaskWorkspaceRegion regionId="desk" aria-label="Task-relevant saved work">
              {desk}
            </TaskWorkspaceRegion>
          ) : null}
          {work ? (
            <TaskWorkspaceRegion regionId="work" className="min-w-0 flex-1">
              {work}
            </TaskWorkspaceRegion>
          ) : null}
        </div>
      ) : null}
      {feedback ? (
        <TaskWorkspaceRegion regionId="feedback">{feedback}</TaskWorkspaceRegion>
      ) : null}
      {readiness ? (
        <TaskWorkspaceRegion
          regionId="readiness"
          className="!bg-transparent !border-0 !p-0"
        >
          {readiness}
        </TaskWorkspaceRegion>
      ) : null}
      {actions ? (
        <TaskWorkspaceRegion
          regionId="actions"
          className="!bg-transparent !border-0 !p-0"
        >
          {actions}
        </TaskWorkspaceRegion>
      ) : null}
      {shelf ? (
        <TaskWorkspaceRegion regionId="shelf" aria-label="Reference and saved history">
          {shelf}
        </TaskWorkspaceRegion>
      ) : null}
    </div>
  );
}
