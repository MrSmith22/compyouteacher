"use client";

/**
 * WP-082 — Shared diagnostic revision desk for section vertical slices.
 * Editor is primary; diagnostics recommend a target without rewriting prose.
 * WP-098 — Revision-role surfaces: editor/diagnosis/compare/clearer = revision;
 * plan notes = student-thinking.
 */

import {
  ROLE_REVISION_TEXTAREA_CLASS,
} from "@/lib/ui/instructionalColorContract";

export default function SectionRevisionPanel({
  label = "Section",
  planLines = [],
  diagnosis = null,
  selectedTargetId = null,
  targetMeta = {},
  value = "",
  before = "",
  after = "",
  clearerConfirmed = null,
  disabled = false,
  onChange,
  onSelectTarget,
  onClearerConfirm,
  testIdPrefix = "section-revision",
  editorLabel = "Revise this section",
}) {
  const recommended = diagnosis?.recommendedTarget;
  const activeId = selectedTargetId || recommended?.id;
  const activeMeta =
    targetMeta[activeId] || recommended || { title: "Revise", teach: "" };

  return (
    <div className="space-y-3" data-testid={`${testIdPrefix}-panel`}>
      <p className="text-sm font-medium text-text-primary">{label}</p>

      <label
        className="block text-sm font-semibold text-theme-dark"
        data-task-workspace-region="work"
        data-instructional-color-role="revision"
      >
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-role-revision">
          Revision
        </span>
        <span className="mt-1 block">{editorLabel}</span>
        <textarea
          className={`mt-1 ${ROLE_REVISION_TEXTAREA_CLASS} min-h-[160px] text-sm`}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange?.(e.target.value)}
          aria-label={`Revise ${label}`}
          placeholder="Strengthen this section in your own words…"
          data-testid={`${testIdPrefix}-editor`}
        />
      </label>

      {planLines.length > 0 ? (
        <div
          className="rounded-md border border-role-thinking/25 bg-role-thinking/[0.05] px-3 py-2 text-sm space-y-1"
          data-task-workspace-region="desk"
          data-instructional-color-role="student-thinking"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-role-thinking">
            Your thinking
          </p>
          {planLines.map((line) => (
            <p key={line.label}>
              <span className="font-semibold">{line.label}:</span>{" "}
              {line.value || "(not set)"}
            </p>
          ))}
          {diagnosis?.confidenceNote ? (
            <p className="text-xs text-theme-dark/70">{diagnosis.confidenceNote}</p>
          ) : null}
        </div>
      ) : null}

      <div
        className="rounded-md border border-role-revision/30 bg-role-revision/[0.05] px-3 py-2 space-y-2"
        data-testid={`${testIdPrefix}-diagnosis`}
        data-instructional-color-role="revision"
      >
        <p className="text-[11px] font-bold uppercase tracking-wide text-role-revision">
          Best place to revise
        </p>
        <p className="text-sm font-semibold text-theme-dark">{activeMeta?.title}</p>
        <p className="text-sm text-theme-dark/85">{activeMeta?.teach}</p>
        {diagnosis?.inspectLocus ? (
          <p className="text-xs text-theme-dark/75">
            Look here:{" "}
            <span className="font-semibold">{diagnosis.inspectLocus}</span>
          </p>
        ) : null}
        {Array.isArray(diagnosis?.health) && diagnosis.health.length > 0 ? (
          <ul className="text-xs text-theme-dark/80 list-disc pl-4">
            {diagnosis.health.slice(0, 4).map((h) => (
              <li key={h.id}>{h.message}</li>
            ))}
          </ul>
        ) : null}
        <div className="flex flex-wrap gap-2 pt-1">
          {(diagnosis?.alternateTargets || []).slice(0, 4).map((t) => (
            <button
              key={t.id}
              type="button"
              className={`min-h-[44px] rounded-md border px-3 text-xs font-semibold ${
                t.id === activeId
                  ? "border-role-revision/50 bg-role-revision/10"
                  : "border-border-soft"
              }`}
              disabled={disabled}
              onClick={() => onSelectTarget?.(t.id)}
            >
              {t.title}
            </button>
          ))}
        </div>
      </div>

      {(before || after) && before !== after ? (
        <div
          className="grid gap-2 sm:grid-cols-2 rounded-md border border-role-revision/25 bg-role-revision/[0.03] p-2"
          data-testid={`${testIdPrefix}-before-after`}
          data-instructional-color-role="revision"
        >
          <div className="rounded-md border border-border-soft px-3 py-2">
            <p className="text-[11px] font-bold uppercase tracking-wide text-text-muted">
              Before
            </p>
            <p className="mt-1 text-sm whitespace-pre-wrap break-words">{before}</p>
          </div>
          <div className="rounded-md border border-border-soft px-3 py-2">
            <p className="text-[11px] font-bold uppercase tracking-wide text-text-muted">
              After
            </p>
            <p className="mt-1 text-sm whitespace-pre-wrap break-words">
              {after || value}
            </p>
          </div>
        </div>
      ) : before ? (
        <div
          className="rounded-md border border-role-revision/25 bg-role-revision/[0.03] px-3 py-2"
          data-testid={`${testIdPrefix}-before-after`}
          data-instructional-color-role="revision"
        >
          <p className="text-[11px] font-bold uppercase tracking-wide text-text-muted">
            Before (original)
          </p>
          <p className="mt-1 text-sm whitespace-pre-wrap break-words">{before}</p>
          <p className="mt-2 text-[11px] font-bold uppercase tracking-wide text-text-muted">
            After (as you edit)
          </p>
          <p className="mt-1 text-sm whitespace-pre-wrap break-words">
            {after || value}
          </p>
        </div>
      ) : null}

      <fieldset
        className="rounded-md border border-role-revision/25 bg-role-revision/[0.03] px-3 py-2"
        data-testid={`${testIdPrefix}-clearer`}
        data-instructional-color-role="revision"
      >
        <legend className="text-sm font-semibold text-theme-dark">
          Is the intended relationship clearer?
        </legend>
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            className={`min-h-[44px] rounded-md border px-3 text-sm font-semibold ${
              clearerConfirmed === true
                ? "border-theme-green bg-theme-green/10"
                : "border-border-soft"
            }`}
            disabled={disabled}
            onClick={() => onClearerConfirm?.(true)}
          >
            Yes, clearer
          </button>
          <button
            type="button"
            className={`min-h-[44px] rounded-md border px-3 text-sm font-semibold ${
              clearerConfirmed === false
                ? "border-role-revision/40 bg-role-revision/10"
                : "border-border-soft"
            }`}
            disabled={disabled}
            onClick={() => onClearerConfirm?.(false)}
          >
            Not yet
          </button>
        </div>
      </fieldset>
    </div>
  );
}
