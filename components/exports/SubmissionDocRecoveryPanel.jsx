"use client";

/**
 * WP-030 — Shared submission Google Doc recovery actions for Module 8 and Module 9.
 */

import { useEffect, useId, useRef, useState } from "react";
import {
  getSubmissionDocRecoveryPlan,
  getRecoveryActionLabel,
  SUBMISSION_DOC_RECOVERY_ACTIONS,
  SUBMISSION_DOC_RECOVERY_DISCLOSURE_LABEL,
  SUBMISSION_DOC_REPLACEMENT_CONFIRMATION,
} from "@/lib/exports/submissionDocRecovery";
import {
  formatSubmissionDocCompletedAt,
  SUBMISSION_DOC_READY_FOR_FORMATTING,
} from "@/lib/exports/submissionDocSuccessConfirmation";

const FOCUS_RING =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-dark focus-visible:ring-offset-2";

const PRIMARY_BTN = `inline-flex min-h-[44px] items-center justify-center rounded-lg bg-theme-blue px-5 py-2.5 text-sm font-semibold text-white shadow-soft disabled:cursor-not-allowed disabled:opacity-50 ${FOCUS_RING}`;
const SECONDARY_BTN = `inline-flex min-h-[44px] items-center justify-center rounded-lg border border-border-soft bg-white px-4 py-2.5 text-sm font-medium text-text-primary disabled:cursor-not-allowed disabled:opacity-50 ${FOCUS_RING}`;
const GHOST_BTN = `inline-flex min-h-[44px] items-center justify-center rounded-lg border border-border-soft/80 bg-surface-soft/40 px-4 py-2 text-sm font-medium text-text-primary disabled:cursor-not-allowed disabled:opacity-50 ${FOCUS_RING}`;

function ActionButton({
  action,
  variant = "secondary",
  busy = false,
  disabled = false,
  onClick,
  testId,
}) {
  const className =
    variant === "primary"
      ? PRIMARY_BTN
      : variant === "ghost"
        ? GHOST_BTN
        : SECONDARY_BTN;
  return (
    <button
      type="button"
      className={className}
      onClick={onClick}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
      data-testid={testId}
      data-recovery-action={action}
    >
      {getRecoveryActionLabel(action, { busy })}
    </button>
  );
}

function ReplacementConfirmation({
  open,
  busy,
  onConfirm,
  onCancel,
  titleId,
  descriptionId,
}) {
  const panelRef = useRef(null);
  const confirmRef = useRef(null);
  const previouslyFocused = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    previouslyFocused.current =
      typeof document !== "undefined" ? document.activeElement : null;
    const t = window.setTimeout(() => {
      confirmRef.current?.focus();
    }, 0);

    const onKeyDown = (e) => {
      if (e.key === "Escape" && !busy) {
        e.preventDefault();
        onCancel();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(t);
      document.removeEventListener("keydown", onKeyDown);
      const prev = previouslyFocused.current;
      if (prev && typeof prev.focus === "function") {
        prev.focus();
      }
    };
  }, [open, busy, onCancel]);

  if (!open) return null;

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      data-testid="submission-doc-replacement-confirm"
      className="rounded-xl border-2 border-theme-orange/40 bg-orange-50 px-4 py-4 text-left shadow-soft"
    >
      <h3
        id={titleId}
        className="text-base font-semibold text-text-primary"
      >
        {SUBMISSION_DOC_REPLACEMENT_CONFIRMATION.title}
      </h3>
      <ul
        id={descriptionId}
        className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-text-primary"
      >
        {SUBMISSION_DOC_REPLACEMENT_CONFIRMATION.bullets.map((bullet) => (
          <li key={bullet}>{bullet}</li>
        ))}
      </ul>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          ref={confirmRef}
          type="button"
          className={PRIMARY_BTN}
          onClick={onConfirm}
          disabled={busy}
          aria-busy={busy || undefined}
          data-testid="submission-doc-replacement-confirm-submit"
        >
          {busy
            ? "Creating a new Google Doc…"
            : SUBMISSION_DOC_REPLACEMENT_CONFIRMATION.confirmLabel}
        </button>
        <button
          type="button"
          className={SECONDARY_BTN}
          onClick={onCancel}
          disabled={busy}
          data-testid="submission-doc-replacement-confirm-cancel"
        >
          {SUBMISSION_DOC_REPLACEMENT_CONFIRMATION.cancelLabel}
        </button>
      </div>
    </div>
  );
}

function SuccessConfirmationDetails({ confirmation, testIdPrefix }) {
  if (!confirmation) return null;
  const formatted = formatSubmissionDocCompletedAt(confirmation.completedAt);
  return (
    <div
      className="mt-3 border-t border-theme-green/20 pt-3"
      data-testid={`${testIdPrefix}-success-confirmation`}
    >
      <dl className="grid grid-cols-1 gap-1.5 text-xs leading-relaxed text-text-primary sm:grid-cols-3 sm:gap-3">
        <div>
          <dt className="font-medium text-text-muted">Last updated</dt>
          <dd data-testid={`${testIdPrefix}-success-completed-at`}>
            {formatted || confirmation.completedAt}
          </dd>
        </div>
        <div>
          <dt className="font-medium text-text-muted">Essay words</dt>
          <dd data-testid={`${testIdPrefix}-success-word-count`}>
            {confirmation.wordCount.toLocaleString()}
          </dd>
        </div>
        <div>
          <dt className="font-medium text-text-muted">Status</dt>
          <dd
            className="font-semibold text-theme-green"
            data-testid={`${testIdPrefix}-success-status`}
          >
            {confirmation.statusLabel}
          </dd>
        </div>
      </dl>
    </div>
  );
}

/**
 * @param {{
 *   module: 8|9,
 *   verificationStatus: string|null,
 *   exportStatus?: string|null,
 *   hasUrl: boolean,
 *   contentVerified: boolean,
 *   operation?: string|null,
 *   docUrl?: string|null,
 *   busy?: boolean,
 *   onUpdate: () => void|Promise<void>,
 *   onCreate: () => void|Promise<void>,
 *   onCreateNew: () => void|Promise<void>,
 *   onRetry: () => void|Promise<void>,
 *   onContinue?: () => void,
 *   onFinishEssay?: () => void,
 *   onReplacementCancelled?: () => void,
 *   notice?: {
 *     type?: string,
 *     message?: string,
 *     status?: string,
 *     confirmation?: {
 *       statement?: string,
 *       completedAt?: string,
 *       wordCount?: number,
 *       statusLabel?: string,
 *     }|null,
 *   }|null,
 *   showProgressContinue?: boolean,
 *   testIdPrefix?: string,
 * }} props
 */
export default function SubmissionDocRecoveryPanel({
  module,
  verificationStatus,
  exportStatus = null,
  hasUrl,
  contentVerified,
  operation = null,
  docUrl = null,
  busy = false,
  onUpdate,
  onCreate,
  onCreateNew,
  onRetry,
  onContinue,
  onFinishEssay,
  onReplacementCancelled,
  notice = null,
  showProgressContinue = false,
  testIdPrefix = "submission-doc",
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [disclosureOpen, setDisclosureOpen] = useState(false);
  const titleId = useId();
  const descriptionId = useId();
  const inFlightRef = useRef(false);

  const plan = getSubmissionDocRecoveryPlan({
    verificationStatus,
    exportStatus,
    hasUrl,
    contentVerified,
    operation,
    requireSessionWrite: module === 8,
  });

  const runGuarded = async (fn) => {
    if (busy || inFlightRef.current || !fn) return;
    inFlightRef.current = true;
    try {
      await fn();
    } finally {
      inFlightRef.current = false;
    }
  };

  const handlePrimary = () => {
    const action = plan.primaryAction;
    if (action === SUBMISSION_DOC_RECOVERY_ACTIONS.CREATE_NEW) {
      setConfirmOpen(true);
      return;
    }
    if (action === SUBMISSION_DOC_RECOVERY_ACTIONS.UPDATE) {
      return runGuarded(onUpdate);
    }
    if (action === SUBMISSION_DOC_RECOVERY_ACTIONS.CREATE) {
      return runGuarded(onCreate);
    }
    if (action === SUBMISSION_DOC_RECOVERY_ACTIONS.RETRY_CHECK) {
      return runGuarded(onRetry);
    }
    if (action === SUBMISSION_DOC_RECOVERY_ACTIONS.CONTINUE && onContinue) {
      return onContinue();
    }
    if (action === SUBMISSION_DOC_RECOVERY_ACTIONS.FINISH_ESSAY && onFinishEssay) {
      return onFinishEssay();
    }
    return undefined;
  };

  const handleSecondary = (action) => {
    if (action === SUBMISSION_DOC_RECOVERY_ACTIONS.OPEN && docUrl) {
      if (typeof window !== "undefined") {
        window.open(docUrl, "_blank", "noopener,noreferrer");
      }
      return;
    }
    if (action === SUBMISSION_DOC_RECOVERY_ACTIONS.UPDATE) {
      return runGuarded(onUpdate);
    }
    if (action === SUBMISSION_DOC_RECOVERY_ACTIONS.RETRY_CHECK) {
      return runGuarded(onRetry);
    }
    if (action === SUBMISSION_DOC_RECOVERY_ACTIONS.CREATE_NEW) {
      setConfirmOpen(true);
    }
    return undefined;
  };

  const handleConfirmReplacement = async () => {
    await runGuarded(async () => {
      await onCreateNew();
      setConfirmOpen(false);
    });
  };

  const handleCancelReplacement = () => {
    if (busy) return;
    setConfirmOpen(false);
    onReplacementCancelled?.();
  };

  const secondaryActions = (plan.secondaryActions || []).filter(
    (action) => action !== plan.primaryAction
  );

  const showPrimary =
    plan.primaryAction &&
    plan.primaryAction !== SUBMISSION_DOC_RECOVERY_ACTIONS.CONTINUE;

  const continueVisible =
    showProgressContinue &&
    plan.allowProgression &&
    typeof onContinue === "function";

  return (
    <div
      className="space-y-3 text-left"
      data-testid={`${testIdPrefix}-recovery-panel`}
      data-recovery-state={plan.state}
      data-module={module}
    >
      {notice?.message || notice?.confirmation ? (
        <div
          role="status"
          aria-live="polite"
          data-testid={`${testIdPrefix}-notice`}
          data-status={notice.status || ""}
          className={[
            "rounded-lg border px-4 py-3 text-sm leading-relaxed",
            notice.type === "success"
              ? "border-theme-green/30 bg-theme-green/5 text-text-primary"
              : "border-theme-red/30 bg-red-50 text-text-primary",
          ].join(" ")}
        >
          {notice.type === "success" && notice.confirmation?.statement ? (
            <p className="font-medium text-text-primary">
              {notice.confirmation.statement}
            </p>
          ) : notice.message ? (
            <p>{notice.message}</p>
          ) : null}
          {notice.type === "success" &&
          notice.confirmation?.statusLabel ===
            SUBMISSION_DOC_READY_FOR_FORMATTING ? (
            <SuccessConfirmationDetails
              confirmation={notice.confirmation}
              testIdPrefix={testIdPrefix}
            />
          ) : null}
          {notice.type === "success" &&
          notice.message &&
          notice.confirmation?.statement &&
          notice.message !== notice.confirmation.statement ? (
            <p className="mt-2 text-xs leading-relaxed text-text-muted">
              {notice.message}
            </p>
          ) : null}
        </div>
      ) : null}

      {plan.title ? (
        <div
          className={[
            "rounded-xl border px-4 py-4 shadow-soft",
            plan.allowProgression
              ? "border-theme-green/30 bg-theme-green/5"
              : "border-theme-blue/25 bg-theme-blue/5",
          ].join(" ")}
        >
          <p className="text-sm font-semibold text-text-primary">{plan.title}</p>
          {plan.explanation ? (
            <p className="mt-2 text-sm leading-relaxed text-text-primary">
              {plan.explanation}
            </p>
          ) : null}
          {plan.supportingCopy ? (
            <p className="mt-2 text-sm leading-relaxed text-text-muted">
              {plan.supportingCopy}
            </p>
          ) : null}
          {plan.teacherEscalation ? (
            <p className="mt-2 text-sm leading-relaxed text-text-muted">
              Tell your teacher if this keeps happening.
            </p>
          ) : null}

          {!confirmOpen ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {showPrimary ? (
                <ActionButton
                  action={plan.primaryAction}
                  variant="primary"
                  busy={busy}
                  onClick={handlePrimary}
                  testId={`${testIdPrefix}-primary-action`}
                />
              ) : null}
              {continueVisible ? (
                <ActionButton
                  action={SUBMISSION_DOC_RECOVERY_ACTIONS.CONTINUE}
                  variant="primary"
                  onClick={onContinue}
                  testId={`${testIdPrefix}-continue`}
                />
              ) : null}
              {!plan.showSecondaryDisclosure
                ? secondaryActions.map((action) => (
                    <ActionButton
                      key={action}
                      action={action}
                      variant={
                        action === SUBMISSION_DOC_RECOVERY_ACTIONS.CREATE_NEW
                          ? "ghost"
                          : "secondary"
                      }
                      busy={busy}
                      onClick={() => handleSecondary(action)}
                      testId={`${testIdPrefix}-secondary-${action}`}
                    />
                  ))
                : null}
            </div>
          ) : null}

          <ReplacementConfirmation
            open={confirmOpen}
            busy={busy}
            onConfirm={handleConfirmReplacement}
            onCancel={handleCancelReplacement}
            titleId={titleId}
            descriptionId={descriptionId}
          />

          {plan.showSecondaryDisclosure && !confirmOpen ? (
            <div className="mt-4 border-t border-border-soft/60 pt-3">
              <button
                type="button"
                className={`inline-flex min-h-[40px] items-center rounded-lg border border-transparent px-2 py-1.5 text-left text-sm font-medium text-theme-blue hover:bg-theme-blue/5 ${FOCUS_RING}`}
                aria-expanded={disclosureOpen}
                onClick={() => setDisclosureOpen((open) => !open)}
                data-testid={`${testIdPrefix}-recovery-disclosure`}
              >
                {SUBMISSION_DOC_RECOVERY_DISCLOSURE_LABEL}
              </button>
              {disclosureOpen ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {secondaryActions.map((action) => (
                    <ActionButton
                      key={action}
                      action={action}
                      variant="ghost"
                      busy={busy}
                      onClick={() => handleSecondary(action)}
                      testId={`${testIdPrefix}-disclosure-${action}`}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
