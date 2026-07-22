"use client";

/**
 * WP-094 — Shared success-experience shell.
 * Order: accomplishment → evidence/receipt → primary action → journey/secondary.
 * Presentation only — callers own navigation and persistence.
 */

import { useEffect, useRef, useState } from "react";
import {
  HIERARCHY_ACTION_PRIMARY_CLASS,
  HIERARCHY_ACTION_SECONDARY_CLASS,
  HIERARCHY_FOCUS_RING_CLASS,
  HIERARCHY_TASK_CLASS,
} from "@/lib/ui/hierarchyContract";
import SuccessCelebrationMotif from "./SuccessCelebrationMotif";
import SuccessJourneyTrail from "./SuccessJourneyTrail";

function ActionButton({ action, testId, onAction, primary = false }) {
  if (!action) return null;
  const enabled = action.enabled !== false;
  const className = primary
    ? `${HIERARCHY_ACTION_PRIMARY_CLASS} ${HIERARCHY_FOCUS_RING_CLASS}`
    : `${HIERARCHY_ACTION_SECONDARY_CLASS} ${HIERARCHY_FOCUS_RING_CLASS}`;

  return (
    <div className="space-y-2">
      <button
        type="button"
        data-testid={testId}
        disabled={!enabled}
        onClick={() => {
          if (!enabled || !onAction) return;
          onAction(action);
        }}
        className={
          enabled
            ? `inline-flex items-center justify-center ${className}`
            : "inline-flex min-h-[44px] cursor-not-allowed items-center justify-center rounded-lg bg-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-600"
        }
      >
        {action.label}
      </button>
      {action.explanation ? (
        <p className="max-w-prose text-sm text-text-muted">{action.explanation}</p>
      ) : null}
    </div>
  );
}

export default function SuccessExperienceShell({
  experience,
  headingId = "success-experience-heading",
  onPrimaryAction,
  onSecondaryAction,
  receiptSlot = null,
  children = null,
  statusMessage = null,
  focusOnMount = true,
  primaryTestId = "success-primary-action",
  secondaryTestId = "success-secondary-action",
  journeyTrailTestId = "success-journey-trail",
  journeyTrailLabel = "Your writing process",
}) {
  const headingRef = useRef(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(Boolean(mq.matches));
    sync();
    mq.addEventListener?.("change", sync);
    return () => mq.removeEventListener?.("change", sync);
  }, []);

  useEffect(() => {
    if (!focusOnMount || !experience) return;
    headingRef.current?.focus?.({ preventScroll: true });
  }, [focusOnMount, experience?.variant, experience?.title]);

  if (!experience) return null;

  const claimsSubmission = Boolean(experience.claimsSubmission);
  const showMotif =
    !experience.unavailable &&
    experience.status !== "receipt_missing" &&
    (claimsSubmission || experience.variant !== "final_receipt" || claimsSubmission);

  return (
    <div
      className="relative min-h-screen overflow-x-hidden bg-theme-light px-4 py-8 text-theme-dark md:px-8 md:py-10"
      data-testid="success-experience-shell"
      data-variant={experience.variant}
      data-celebration={experience.celebrationIntensity}
    >
      <div className="relative mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:items-start">
        <section
          className="relative overflow-hidden rounded-2xl border border-theme-green/25 bg-white px-5 py-7 shadow-soft sm:px-8 sm:py-9"
          aria-labelledby={headingId}
        >
          {showMotif ? (
            <SuccessCelebrationMotif
              intensity={experience.celebrationIntensity}
              reducedMotion={reducedMotion}
            />
          ) : null}

          <div className="relative space-y-5">
            {experience.journeyStageLabel ? (
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-theme-green">
                {experience.journeyStageLabel}
                {experience.status === "submitted" ? " · Received" : ""}
              </p>
            ) : null}

            <h1
              id={headingId}
              ref={headingRef}
              tabIndex={-1}
              className={`${HIERARCHY_TASK_CLASS} outline-none`}
            >
              {experience.title}
            </h1>

            {experience.explanation ? (
              <p className="max-w-prose text-base leading-relaxed text-text-primary md:text-lg">
                {experience.explanation}
              </p>
            ) : null}

            {statusMessage ? (
              <p className="text-sm text-text-muted" role="status">
                {statusMessage}
              </p>
            ) : null}

            {experience.evidenceItems?.length ? (
              <ul
                className="grid gap-2 sm:grid-cols-2"
                data-testid="success-evidence-list"
                aria-label="Evidence of what you completed"
              >
                {experience.evidenceItems.map((item) => (
                  <li
                    key={item.id}
                    className="rounded-xl border border-border-soft/80 bg-surface-soft/50 px-4 py-3"
                  >
                    <p className="text-sm font-semibold text-text-primary">
                      {item.label}
                    </p>
                    {item.detail ? (
                      <p className="mt-1 text-xs leading-relaxed text-text-muted">
                        {item.detail}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : null}

            {receiptSlot}

            {children}
          </div>
        </section>

        <aside className="space-y-4 lg:sticky lg:top-6">
          <div className="rounded-2xl border border-border-soft/70 bg-white px-5 py-6 shadow-soft sm:px-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted">
              What happens next
            </p>
            <div className="mt-4 space-y-4">
              <ActionButton
                action={experience.primaryAction}
                testId={primaryTestId}
                primary
                onAction={onPrimaryAction}
              />
              <ActionButton
                action={experience.secondaryAction}
                testId={secondaryTestId}
                onAction={onSecondaryAction}
              />
            </div>
          </div>

          <SuccessJourneyTrail
            stages={experience.journey}
            label={journeyTrailLabel}
            testId={journeyTrailTestId}
          />
        </aside>
      </div>
    </div>
  );
}
