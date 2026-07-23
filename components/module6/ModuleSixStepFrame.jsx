import WorkspaceCenter from "@/components/layout/WorkspaceCenter";
import WorkspaceColumns from "@/components/layout/WorkspaceColumns";
import WorkspaceGuide from "@/components/layout/WorkspaceGuide";
import WorkspaceSidebar from "@/components/layout/WorkspaceSidebar";
import ScreenContractCues from "@/components/shared/ScreenContractCues";
import InstructionalDisclosure from "@/components/shared/InstructionalDisclosure";
import ModuleModeCue from "@/components/shared/ModuleModeCue";
import JobRightNow from "@/components/shared/JobRightNow";
import {
  pickVisibleFinished,
  pickVisiblePurpose,
  remainingContractLines,
} from "@/components/shared/screenContractHelpers";
import {
  // JobRightNow renders HIERARCHY_INSTRUCTION_CLASS with
  // data-instructional-color-role="instruction" in the shared component.
  HIERARCHY_INSTRUCTION_CLASS,
  HIERARCHY_LEVELS,
  HIERARCHY_REFERENCE_ASIDE_CLASS,
  HIERARCHY_REFERENCE_CLASS,
  HIERARCHY_TASK_CLASS,
} from "@/lib/ui/hierarchyContract";
import {
  RHYTHM_MAJOR_SECTION_CLASS,
  RHYTHM_PAGE_CLASS,
  RHYTHM_PROSE_CLASS,
} from "@/lib/ui/instructionalRhythmContract";
import { resolveTaskWorkspacePresentation } from "@/lib/ui/taskWorkspaceContract";
export const MODULE6_NEED_HELP_ID = "module-6-need-help";

function normalizeWhyMatters(whyMatters) {
  if (Array.isArray(whyMatters)) {
    return whyMatters.filter(Boolean);
  }

  if (typeof whyMatters === "string" && whyMatters.trim()) {
    return [whyMatters.trim()];
  }

  return [];
}

function normalizeExample(example) {
  if (!example) return null;
  if (typeof example === "string" && example.trim()) {
    return { sample: example.trim(), whyItWorks: "" };
  }
  if (typeof example === "object") {
    const sample = String(example.sample || example.text || "").trim();
    const whyItWorks = String(example.whyItWorks || example.annotation || "").trim();
    if (!sample) return null;
    return { sample, whyItWorks };
  }
  return null;
}

function scrollToNeedHelp(event) {
  event.preventDefault();
  const el = document.getElementById(MODULE6_NEED_HELP_ID);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
  // Open the first collapsed tip if present so the jump feels useful.
  const firstDetails = el.querySelector("details");
  if (firstDetails && !firstDetails.open) {
    firstDetails.open = true;
  }
}

function NeedHelpJumpLink() {
  return (
    <a
      href={`#${MODULE6_NEED_HELP_ID}`}
      onClick={scrollToNeedHelp}
      className="inline-flex items-center gap-2 rounded-lg border border-border-soft/80 bg-surface-soft/60 px-3.5 py-2 text-sm font-medium text-text-muted transition hover:bg-surface-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-dark focus-visible:ring-offset-2"
      data-hierarchy-level={HIERARCHY_LEVELS.reference}
    >
      Need Help
      <span className="text-xs font-medium text-text-muted/80">↓ thesis, outline & tips</span>
    </a>
  );
}

function JobRightNowCard({ jobRightNow }) {
  // Shared JobRightNow preserves data-hierarchy-level={HIERARCHY_LEVELS.instruction}.
  return (
    <JobRightNow
      jobRightNow={jobRightNow}
      needHelpId={MODULE6_NEED_HELP_ID}
      onNeedHelpClick={scrollToNeedHelp}
    />
  );
}

function SupportingDetails({ whyLines, exampleBlock, successItems }) {
  const hasWhy = whyLines.length > 0;
  const hasExample = Boolean(exampleBlock?.sample);
  const hasSuccess = successItems.length > 0;
  if (!hasWhy && !hasExample && !hasSuccess) return null;

  return (
    <div
      className="max-w-2xl space-y-2 text-left"
      data-hierarchy-level={HIERARCHY_LEVELS.reference}
    >
      {hasWhy ? (
        <InstructionalDisclosure title="More about why this matters">
          {whyLines.map((line) => (
            <p key={line} className="text-sm leading-relaxed text-text-muted">
              {line}
            </p>
          ))}
        </InstructionalDisclosure>
      ) : null}

      {hasExample ? (
        <InstructionalDisclosure title="See an example">
          <p className="text-sm leading-relaxed text-text-primary whitespace-pre-wrap">
            {exampleBlock.sample}
          </p>
          {exampleBlock.whyItWorks ? (
            <p className="text-sm leading-relaxed text-text-muted">
              <span className="font-medium text-text-primary">Why this works: </span>
              {exampleBlock.whyItWorks}
            </p>
          ) : null}
        </InstructionalDisclosure>
      ) : null}

      {hasSuccess ? (
        <InstructionalDisclosure title="More self-check details">
          <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-text-muted marker:text-text-muted/60">
            {successItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </InstructionalDisclosure>
      ) : null}
    </div>
  );
}

/**
 * Shared drafting/revision frame.
 * When `jobRightNow` is provided (Module 6), hierarchy is:
 * Question → Your job right now → children (write) → Need Help.
 * Modules 7–8 omit jobRightNow and keep supporting details before children.
 */
export default function ModuleSixStepFrame({
  question,
  whyMatters,
  example = "",
  successLooksLike = [],
  children,
  sidebar = null,
  coachingMessage = "",
  nextStepText = "",
  jobRightNow = null,
  howToSucceed = "",
  supportingResources = null,
  hideSupporting = false,
  supportingPlacement = "before",
  /** When true, detailed success criteria render near the forward action instead of disclosures. */
  deferSuccessCriteria = false,
  /** WP-058 — module number for psychological mode cue (6–8 shared frame). */
  psychologicalModule = null,
}) {
  const whyLines = normalizeWhyMatters(whyMatters);
  const exampleBlock = normalizeExample(example);
  const successItems = Array.isArray(successLooksLike)
    ? successLooksLike.filter(Boolean)
    : [];
  const visiblePurpose = pickVisiblePurpose(whyLines);
  const visibleFinished = pickVisibleFinished(successItems);
  const whyForDisclosure = remainingContractLines(whyLines, visiblePurpose);
  const successForDisclosure = deferSuccessCriteria
    ? []
    : remainingContractLines(successItems, visibleFinished);
  const actionFirst = !!jobRightNow?.steps?.length;
  const workspacePresentation = resolveTaskWorkspacePresentation({
    moduleNumber: psychologicalModule || 6,
    taskHeading: question,
    desktopWidthIntent: "drafting",
  });
  const howSummary = String(
    howToSucceed || (!actionFirst ? coachingMessage : "") || ""
  ).trim();
  const supporting =
    hideSupporting ? null : (
      <SupportingDetails
        whyLines={whyForDisclosure}
        exampleBlock={exampleBlock}
        successItems={successForDisclosure}
      />
    );
  const supportingBefore =
    !actionFirst && supportingPlacement !== "after" ? supporting : null;
  const supportingAfter =
    !actionFirst && supportingPlacement === "after" ? supporting : null;
  const showHeaderNext =
    String(nextStepText || "").trim() &&
    !actionFirst;

  return (
    <WorkspaceColumns
      variant="drafting"
      className="gap-5 xl:gap-8"
      data-task-workspace-foundation="true"
      data-task-workspace-contract={workspacePresentation.journeyStageId}
    >
      <WorkspaceSidebar
        className={`${HIERARCHY_REFERENCE_CLASS} order-9 lg:order-1 lg:col-span-1`}
      >
        <div data-hierarchy-level={HIERARCHY_LEVELS.reference}>{sidebar}</div>
      </WorkspaceSidebar>

      <WorkspaceCenter className="min-w-0 order-1 lg:order-2">
        <div
          className={RHYTHM_PAGE_CLASS}
          data-rhythm-contract="page"
          data-testid="module-six-step-frame-rhythm"
        >
          {psychologicalModule != null ? (
            <ModuleModeCue module={psychologicalModule} />
          ) : null}
          <header className="space-y-3 py-1 text-left md:py-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-text-muted">
              Start here
            </p>
            <h1
              className={HIERARCHY_TASK_CLASS}
              data-testid="screen-contract-task"
              data-hierarchy-level={HIERARCHY_LEVELS.task}
            >
              {question}
            </h1>
            <div className={RHYTHM_PROSE_CLASS}>
              <ScreenContractCues
                purpose={visiblePurpose}
                how={howSummary}
                finished={visibleFinished}
                showHow={!actionFirst}
              />
            </div>
            {showHeaderNext ? (
              <p
                className="max-w-3xl text-sm leading-relaxed text-text-muted"
                data-testid="screen-orientation-next"
                data-orientation-question="next"
              >
                <span className="font-medium text-text-primary">
                  What happens next:{" "}
                </span>
                {String(nextStepText).trim()}
              </p>
            ) : null}
            {actionFirst ? (
              <div className="pt-1">
                <NeedHelpJumpLink />
              </div>
            ) : null}
          </header>

          {actionFirst ? <JobRightNowCard jobRightNow={jobRightNow} /> : null}

          {supportingBefore}

          <div
            className={RHYTHM_MAJOR_SECTION_CLASS}
            data-hierarchy-level={HIERARCHY_LEVELS.work}
            data-hierarchy-emphasis="active"
            data-rhythm-contract="major-section"
          >
            {children}
          </div>

          {supportingAfter}

          {actionFirst ? (
            <section
              id={MODULE6_NEED_HELP_ID}
              className="scroll-mt-24 space-y-4 rounded-xl border border-role-reference/30 bg-role-reference/[0.06] px-4 py-4 md:px-5"
              aria-labelledby="module-6-need-help-heading"
              data-hierarchy-level={HIERARCHY_LEVELS.reference}
              data-instructional-color-role="reference"
            >
              <div className="space-y-1 text-left">
                <p
                  id="module-6-need-help-heading"
                  className="text-[11px] font-medium uppercase tracking-[0.18em] text-text-muted"
                >
                  Need Help
                </p>
                <p className="text-sm leading-relaxed text-text-muted">
                  Your thesis, outline notes, and writing tips are here. Use them
                  whenever you get stuck—then keep writing above.
                </p>
              </div>
              {supportingResources}
              {supporting}
            </section>
          ) : null}
        </div>
      </WorkspaceCenter>

      <WorkspaceGuide
        className={`${HIERARCHY_REFERENCE_CLASS} order-10 lg:order-3`}
      >
        <aside
          className={HIERARCHY_REFERENCE_ASIDE_CLASS}
          data-hierarchy-level={HIERARCHY_LEVELS.reference}
        >
          <div className="space-y-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-text-muted">
              From your teacher
            </p>
            <p className="text-sm leading-relaxed text-text-muted">
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
                "We'll keep following the same group of quotes as your thinking gets clearer."}
            </p>
          </div>
        </aside>
      </WorkspaceGuide>
    </WorkspaceColumns>
  );
}
