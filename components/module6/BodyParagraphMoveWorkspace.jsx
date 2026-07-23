"use client";

/**
 * WP-081 — Sentence-move drafting workspace for Body Paragraph 1.
 * Assembles prose only; never emits plan labels or Roman numerals into draft text.
 * Kept as a dedicated component so WP-081 test IDs remain stable; shared
 * SectionMoveWorkspace (WP-082) powers Introduction / Conclusion.
 */

import {
  BODY_PARAGRAPH_MOVE_META,
  assembleBodyParagraphProse,
  normalizeBodyParagraphMoveState,
  resolveAssembledBodyParagraphProse,
  resolveBodyParagraphMoveMeta,
  selectDeskArtifactsForMove,
} from "@/lib/module6/bodyParagraphMoves";
import { HIERARCHY_DESK_CLASS, HIERARCHY_LEVELS } from "@/lib/ui/hierarchyContract";
import { getInstructionalColorRole } from "@/lib/ui/instructionalColorContract";

const TEXTAREA_CLASS =
  "w-full min-h-[120px] rounded-md border border-border-soft bg-white px-3 py-2 text-sm text-theme-dark focus:outline-none focus:ring-2 focus:ring-theme-blue/40";

const WRITING_TEXTAREA_CLASS = [
  "w-full min-h-[160px]",
  getInstructionalColorRole("writing")?.softSurfaceClass ||
    "rounded-xl border-2 border-role-writing/30 bg-role-writing/[0.04] px-3 py-3 text-base text-theme-dark shadow-soft",
  "focus:outline-none focus:ring-2 focus:ring-theme-dark/20",
].join(" ");

export default function BodyParagraphMoveWorkspace({
  label = "Body Paragraph 1",
  moveState,
  deskArtifacts = {},
  disabled = false,
  onChange,
}) {
  const normalized = normalizeBodyParagraphMoveState(moveState, {
    includeTransition: (moveState?.moveOrder || []).includes("transition"),
    moveOrder: Array.isArray(moveState?.moveOrder) ? moveState.moveOrder : undefined,
  });
  const moveOrder = normalized.moveOrder;
  const activeId = normalized.activeMoveId;
  const activeStepIndex = Math.max(0, moveOrder.indexOf(activeId));
  const stepNumber = activeStepIndex + 1;
  const totalSteps = moveOrder.length;
  const meta =
    resolveBodyParagraphMoveMeta(activeId) || BODY_PARAGRAPH_MOVE_META.point;
  const deskForMove = selectDeskArtifactsForMove(activeId, deskArtifacts);
  const writingSurfaceClass = WRITING_TEXTAREA_CLASS;
  const preview = resolveAssembledBodyParagraphProse(normalized, {
    includeTransition: moveOrder.includes("transition"),
    moveOrder,
  });
  const nextMoveId =
    activeStepIndex < moveOrder.length - 1 ? moveOrder[activeStepIndex + 1] : null;

  const emit = (patch) => {
    onChange?.({
      ...normalized,
      ...patch,
    });
  };

  const setActive = (id) => {
    emit({ activeMoveId: id });
  };

  const setMoveText = (id, text) => {
    emit({
      moves: { ...normalized.moves, [id]: text },
    });
  };

  const enterAdvanced = () => {
    const seed =
      normalized.advancedProse.trim() ||
      assembleBodyParagraphProse(normalized.moves, moveOrder);
    emit({
      advancedMode: true,
      advancedProse: seed,
    });
  };

  const exitAdvanced = () => {
    emit({ advancedMode: false });
  };

  const setAdvancedProse = (text) => {
    emit({
      advancedMode: true,
      advancedProse: text,
    });
  };

  const continueToNext = () => {
    if (nextMoveId) setActive(nextMoveId);
  };

  if (normalized.advancedMode) {
    const advancedText = normalized.advancedProse;
    return (
      <div className="space-y-3" data-testid="bp-move-workspace-advanced">
        <p className="text-sm font-medium text-text-primary">{label}</p>
        <p className="text-xs text-text-muted">
          Write the whole paragraph in one box. Prefer sentence moves unless you
          already know the paragraph shape.
        </p>
        <textarea
          className={TEXTAREA_CLASS}
          value={advancedText}
          disabled={disabled}
          onChange={(e) => setAdvancedProse(e.target.value)}
          aria-label={`${label} whole paragraph`}
          data-testid="bp-advanced-prose-field"
        />
        <button
          type="button"
          className="min-h-[44px] rounded-md border border-border-soft px-3 text-sm font-semibold"
          disabled={disabled}
          onClick={exitAdvanced}
        >
          Back to sentence moves
        </button>
        <div
          className="rounded-md border border-border-soft bg-surface-soft/40 px-3 py-2"
          data-testid="bp-move-live-preview"
        >
          <p className="text-[11px] font-bold uppercase tracking-wide text-text-muted">
            Your paragraph
          </p>
          <p className="mt-1 text-sm whitespace-pre-wrap break-words">
            {advancedText || "Your paragraph will appear here as you write."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3" data-testid="bp-move-workspace">
      <p className="text-sm font-medium text-text-primary">{label}</p>
      <p className="text-xs text-text-muted">
        One move at a time. Only the plan for this move is on your desk.
      </p>

      <div
        className="grid gap-4 lg:grid-cols-[minmax(300px,0.65fr)_minmax(0,1.35fr)] lg:items-start"
        data-testid="task-workspace-work"
      >
        <div
          className={`${HIERARCHY_DESK_CLASS} order-1 lg:order-1`}
          data-testid="bp-active-move"
          data-active-move={activeId}
          data-step-number={stepNumber}
          data-instructional-color-role="student-thinking"
          data-hierarchy-level={HIERARCHY_LEVELS.work}
          data-task-workspace-region="desk"
        >
          <p
            className="text-[11px] font-bold uppercase tracking-wide text-theme-blue"
            data-testid="bp-step-label"
          >
            Step {stepNumber} of {totalSteps}
          </p>
          <p className="mt-1 text-sm font-semibold text-theme-dark">{meta.title}</p>
          <p className="mt-1 text-sm text-theme-dark/85" data-testid="bp-move-reminder">
            {meta.prompt || meta.model}
          </p>
          {deskForMove.length > 0 ? (
            <div className="mt-2 space-y-1" data-testid="bp-move-desk">
              {deskForMove.map((item) => (
                <p key={item.field} className="text-xs text-theme-dark/75 break-words">
                  <span className="font-semibold">{item.label}:</span> {item.value}
                </p>
              ))}
            </div>
          ) : null}
        </div>

        <label
          className="block text-sm font-semibold text-theme-dark order-2 min-w-0"
          data-instructional-color-role="writing"
        >
          Your sentence(s) for Step {stepNumber}
          <textarea
            className={`mt-1 ${writingSurfaceClass}`}
            value={normalized.moves[activeId] || ""}
            disabled={disabled}
            onChange={(e) => setMoveText(activeId, e.target.value)}
            aria-label={`Step ${stepNumber}: ${meta.title}`}
            data-testid="bp-move-writing-field"
          />
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        {nextMoveId ? (
          <button
            type="button"
            className="min-h-[44px] rounded-md bg-theme-blue px-3 text-sm font-semibold text-white"
            disabled={disabled}
            onClick={continueToNext}
            data-testid="bp-continue-next-move"
          >
            Continue to Step {stepNumber + 1}
          </button>
        ) : (
          <p className="text-sm text-text-muted" data-testid="bp-moves-complete-hint">
            Last move — use Keep going below when your paragraph is ready.
          </p>
        )}
      </div>

      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-label="Choose a move"
        data-testid="bp-move-chooser"
      >
        {moveOrder.map((id, index) => {
          const done = Boolean((normalized.moves[id] || "").trim());
          const isActive = id === activeId;
          return (
            <button
              key={id}
              type="button"
              className={`min-h-[44px] rounded-md border px-3 text-xs font-semibold ${
                isActive
                  ? "border-theme-orange bg-theme-orange/10 text-theme-orange"
                  : done
                    ? "border-theme-green/40 bg-theme-green/5"
                    : "border-border-soft"
              }`}
              aria-pressed={isActive}
              disabled={disabled}
              onClick={() => setActive(id)}
            >
              Step {index + 1}
              {done && !isActive ? " ✓" : ""}
            </button>
          );
        })}
      </div>

      <div
        className="rounded-md border border-border-soft bg-surface-soft/40 px-3 py-2"
        data-testid="bp-move-live-preview"
      >
        <p className="text-[11px] font-bold uppercase tracking-wide text-text-muted">
          Your paragraph
        </p>
        <p className="mt-1 text-sm whitespace-pre-wrap break-words">
          {preview || "Your sentences will appear here as you write."}
        </p>
      </div>

      <button
        type="button"
        className="min-h-[44px] rounded-md border border-border-soft px-3 text-sm font-semibold"
        disabled={disabled}
        onClick={enterAdvanced}
        data-testid="bp-enter-advanced"
      >
        Advanced: write whole paragraph
      </button>
    </div>
  );
}
