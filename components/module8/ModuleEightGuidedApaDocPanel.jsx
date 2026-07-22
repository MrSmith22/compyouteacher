"use client";

/**
 * WP-092 — Rebuilt Module 8: create/update/verify/open/continue only.
 * No APA Format or Ready checklist gates.
 */

import { useMemo } from "react";

export default function ModuleEightGuidedApaDocPanel({
  submissionDocUrl,
  docVerifiedThisSession,
  lastDocOperation,
  verifiedAt,
  essayWordCount,
  exportBusy,
  exportError,
  onCreateOrUpdate,
  onOpenDoc,
  onContinue,
  recoverySlot = null,
}) {
  const statusLabel = useMemo(() => {
    if (exportBusy) return "Working on your Google Doc…";
    if (docVerifiedThisSession && submissionDocUrl) {
      return lastDocOperation === "created"
        ? "Google Doc created and verified"
        : lastDocOperation === "replacement_created"
          ? "New Google Doc created and verified"
          : "Google Doc updated and verified";
    }
    if (submissionDocUrl) return "Google Doc found — verify with Create or Update";
    return "Create your submission Google Doc";
  }, [
    exportBusy,
    docVerifiedThisSession,
    submissionDocUrl,
    lastDocOperation,
  ]);

  const canContinue = Boolean(docVerifiedThisSession && submissionDocUrl);

  return (
    <section
      className="space-y-4 rounded-xl border-2 border-theme-blue/30 bg-white px-4 py-5 shadow-soft sm:px-5"
      data-testid="module8-guided-apa-doc-panel"
      aria-labelledby="m8-guided-doc-heading"
    >
      <div className="space-y-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-theme-blue">
          Module 8 · Submission document
        </p>
        <h2
          id="m8-guided-doc-heading"
          className="text-xl font-semibold text-theme-dark sm:text-2xl"
        >
          Put your newest essay in one Google Doc
        </h2>
        <p className="text-sm text-theme-muted">
          Module 8 creates or updates the Doc and checks that it contains your newest
          finished essay. Formatting happens in Module 9.
        </p>
      </div>

      <div
        className="rounded-lg border border-theme-light bg-surface-soft/80 px-3 py-3 text-sm"
        data-testid="module8-guided-doc-status"
      >
        <p className="font-medium text-theme-dark">{statusLabel}</p>
        {submissionDocUrl ? (
          <p className="mt-1 break-all text-theme-muted">
            Title: APA Final Essay
          </p>
        ) : null}
        {typeof essayWordCount === "number" ? (
          <p className="mt-1 text-theme-muted">
            Current essay word count: {essayWordCount}
          </p>
        ) : null}
        {verifiedAt ? (
          <p className="mt-1 text-theme-muted">
            Last verified: {new Date(verifiedAt).toLocaleString()}
          </p>
        ) : null}
      </div>

      {exportError ? (
        <p className="text-sm text-red-700" role="alert">
          {exportError}
        </p>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <button
          type="button"
          className="min-h-[44px] rounded-lg bg-theme-blue px-4 py-2 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-theme-blue/40 disabled:opacity-60"
          onClick={() => onCreateOrUpdate({ forceCreate: !submissionDocUrl })}
          disabled={exportBusy}
          data-testid="module8-guided-create-update"
        >
          {exportBusy
            ? "Working…"
            : submissionDocUrl
              ? "Update Google Doc"
              : "Create Google Doc"}
        </button>
        <button
          type="button"
          className="min-h-[44px] rounded-lg border border-theme-blue px-4 py-2 text-sm font-medium text-theme-blue focus:outline-none focus:ring-2 focus:ring-theme-blue/40 disabled:opacity-60"
          onClick={onOpenDoc}
          disabled={!submissionDocUrl || exportBusy}
          data-testid="module8-guided-open-doc"
        >
          Open Google Doc
        </button>
        <button
          type="button"
          className="min-h-[44px] rounded-lg bg-theme-dark px-4 py-2 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-theme-dark/30 disabled:bg-gray-400"
          onClick={onContinue}
          disabled={!canContinue || exportBusy}
          data-testid="module8-guided-continue"
        >
          Continue to Module 9
        </button>
      </div>

      {recoverySlot}

      <details className="rounded-lg border border-theme-light bg-white px-3 py-2 text-sm">
        <summary className="cursor-pointer font-medium text-theme-dark">
          Optional: blank template (recovery only)
        </summary>
        <p className="mt-2 text-theme-muted">
          Prefer the Create/Update buttons above so your newest essay is verified. Use a
          blank template only if your teacher asks you to start from a template and then
          paste your essay.
        </p>
      </details>
    </section>
  );
}
