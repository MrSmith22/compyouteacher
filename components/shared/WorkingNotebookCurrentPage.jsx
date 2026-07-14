"use client";

/**
 * WP-059 — Compact always-visible “current notebook page” index for the sidebar.
 * Labels only — full artifact text stays on the desk.
 */

export default function WorkingNotebookCurrentPage({ page = null }) {
  if (!page) return null;

  const kinds = Array.isArray(page.currentArtifactKinds)
    ? page.currentArtifactKinds.join(",")
    : "";

  return (
    <div
      data-testid="working-notebook-current-page"
      data-notebook-step={String(page.stepType || "")}
      data-current-artifacts={kinds}
      className="rounded-xl border border-border-soft/70 bg-white/80 px-3.5 py-3 text-left shadow-soft"
    >
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-text-muted">
        Working notebook
      </p>
      <p className="mt-1 text-sm font-semibold leading-snug text-text-primary break-words">
        {page.currentPageLabel}
      </p>
      {page.showArtifactLabels ? (
        <ul className="mt-2 list-none space-y-1">
          {page.currentArtifactLabels.map((label) => (
            <li
              key={label}
              className="rounded-md bg-surface-soft/50 px-2 py-1 text-xs leading-snug text-text-primary break-words"
            >
              {label}
            </li>
          ))}
        </ul>
      ) : null}
      {page.locationHint ? (
        <p className="mt-2 text-xs leading-relaxed text-text-muted break-words">
          {page.locationHint}
        </p>
      ) : null}
      {page.emptyStateMessage ? (
        <p className="mt-2 text-xs leading-relaxed text-text-muted break-words">
          {page.emptyStateMessage}
        </p>
      ) : null}
    </div>
  );
}
