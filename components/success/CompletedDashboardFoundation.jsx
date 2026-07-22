"use client";

/**
 * WP-094 — Completed-assignment dashboard card (development foundation).
 * Presentation only — uses the same final-PDF truth as the existing dashboard.
 */

import SuccessJourneyTrail from "./SuccessJourneyTrail";
import {
  HIERARCHY_ACTION_PRIMARY_CLASS,
  HIERARCHY_ACTION_SECONDARY_CLASS,
  HIERARCHY_FOCUS_RING_CLASS,
} from "@/lib/ui/hierarchyContract";

export default function CompletedDashboardFoundation({
  presentation,
  onOpenReceipt,
}) {
  if (!presentation) return null;

  return (
    <section
      className="rounded-2xl border border-theme-green/25 bg-white p-6 shadow-soft"
      data-testid="dashboard-completion-foundation"
      aria-label="Assignment submission status"
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          <h3 className="text-xl font-bold text-theme-dark">MLK Essay Assignment</h3>
          <p
            className="inline-flex rounded-lg bg-theme-green px-3 py-1.5 text-sm font-semibold text-white"
            data-testid="dashboard-essay-completed-badge"
          >
            {presentation.statusLabel}
          </p>
          {presentation.submittedAtLabel ? (
            <p
              className="text-sm text-text-muted"
              data-testid="dashboard-submission-time"
            >
              Submitted: {presentation.submittedAtLabel}
            </p>
          ) : null}
          {presentation.recoveryMessage ? (
            <p className="text-sm text-theme-orange" role="status">
              {presentation.recoveryMessage}
            </p>
          ) : null}
          <p className="max-w-prose text-sm text-text-muted">
            {presentation.resubmissionPolicy}
          </p>
        </div>

        <div className="flex min-w-[190px] flex-col gap-2">
          {presentation.primaryArtifactHref ? (
            <a
              href={presentation.primaryArtifactHref}
              target="_blank"
              rel="noreferrer"
              className={`inline-flex items-center justify-center text-center ${HIERARCHY_ACTION_PRIMARY_CLASS} ${HIERARCHY_FOCUS_RING_CLASS}`}
              data-testid="dashboard-open-final-pdf"
            >
              {presentation.primaryArtifactLabel}
            </a>
          ) : null}
          <button
            type="button"
            onClick={onOpenReceipt}
            className={`inline-flex items-center justify-center ${HIERARCHY_ACTION_SECONDARY_CLASS} ${HIERARCHY_FOCUS_RING_CLASS}`}
            data-testid="dashboard-view-receipt"
          >
            {presentation.receiptLabel}
          </button>
        </div>
      </div>

      <div className="mt-5">
        <SuccessJourneyTrail
          stages={presentation.journey}
          label="Stages completed"
          testId="dashboard-journey-trail"
        />
      </div>
    </section>
  );
}
