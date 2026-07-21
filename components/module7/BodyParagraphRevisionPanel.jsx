"use client";

/**
 * WP-081 — Diagnostic revision desk for Body Paragraph 1 (dev-gated).
 * Editor is primary; diagnostics recommend a target without rewriting prose.
 */

import { REVISION_TARGET_META } from "@/lib/module7/bodyParagraphDiagnostics";

const TEXTAREA_CLASS =
  "w-full min-h-[160px] rounded-md border border-border-soft bg-white px-3 py-2 text-sm text-theme-dark focus:outline-none focus:ring-2 focus:ring-theme-orange/40";

export default function BodyParagraphRevisionPanel({
  label = "Body Paragraph 1",
  purpose = "",
  evidenceSummary = "",
  diagnosis = null,
  selectedTargetId = null,
  priorParagraphProse = "",
  value = "",
  before = "",
  after = "",
  clearerConfirmed = null,
  disabled = false,
  onChange,
  onSelectTarget,
  onClearerConfirm,
}) {
  const recommended = diagnosis?.recommendedTarget;
  const activeId = selectedTargetId || recommended?.id;
  const activeMeta =
    REVISION_TARGET_META[activeId] || recommended || REVISION_TARGET_META.underdevelopment;

  return (
    <div className="space-y-3" data-testid="bp-revision-panel">
      <p className="text-sm font-medium text-text-primary">{label}</p>

      <label className="block text-sm font-semibold text-theme-dark">
        Revise your paragraph
        <textarea
          className={`mt-1 ${TEXTAREA_CLASS}`}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange?.(e.target.value)}
          aria-label={`Revise ${label}`}
          placeholder="Strengthen this paragraph in your own words…"
          data-testid="bp-revision-editor"
        />
      </label>

      <div className="rounded-md border border-theme-blue/25 bg-theme-blue/[0.04] px-3 py-2 text-sm space-y-1">
        <p>
          <span className="font-semibold">Planned purpose:</span>{" "}
          {purpose || "(not set)"}
        </p>
        {evidenceSummary ? (
          <p>
            <span className="font-semibold">Evidence:</span> {evidenceSummary}
          </p>
        ) : null}
        {diagnosis?.confidenceNote ? (
          <p className="text-xs text-theme-dark/70">{diagnosis.confidenceNote}</p>
        ) : null}
      </div>

      <div
        className="rounded-md border border-theme-orange/30 bg-theme-orange/[0.04] px-3 py-2 space-y-2"
        data-testid="bp-revision-diagnosis"
      >
        <p className="text-[11px] font-bold uppercase tracking-wide text-theme-orange">
          Best place to revise
        </p>
        <p className="text-sm font-semibold text-theme-dark">{activeMeta?.title}</p>
        <p className="text-sm text-theme-dark/85">{activeMeta?.teach}</p>
        {diagnosis?.inspectLocus ? (
          <p className="text-xs text-theme-dark/75">
            Look here: <span className="font-semibold">{diagnosis.inspectLocus}</span>
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
                  ? "border-theme-orange bg-theme-orange/10"
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

      {activeId === "transition" && priorParagraphProse ? (
        <div
          className="rounded-md border border-border-soft px-3 py-2 text-sm"
          data-testid="bp-transition-context"
        >
          <p className="text-[11px] font-bold uppercase tracking-wide text-text-muted">
            Previous paragraph (for the handoff)
          </p>
          <p className="mt-1 whitespace-pre-wrap break-words">{priorParagraphProse}</p>
        </div>
      ) : null}

      {(before || after) && before !== after ? (
        <div
          className="grid gap-2 sm:grid-cols-2"
          data-testid="bp-revision-before-after"
        >
          <div className="rounded-md border border-border-soft px-3 py-2">
            <p className="text-[11px] font-bold uppercase tracking-wide text-text-muted">
              Before
            </p>
            <p className="mt-1 text-sm whitespace-pre-wrap break-words">
              {before || "(empty)"}
            </p>
          </div>
          <div className="rounded-md border border-theme-green/30 bg-theme-green/[0.04] px-3 py-2">
            <p className="text-[11px] font-bold uppercase tracking-wide text-theme-green">
              After
            </p>
            <p className="mt-1 text-sm whitespace-pre-wrap break-words">
              {after || value || "(empty)"}
            </p>
          </div>
        </div>
      ) : null}

      {before && after && before !== after ? (
        <fieldset className="space-y-2">
          <legend className="text-sm font-semibold text-theme-dark">
            Is the intended relationship clearer now?
          </legend>
          <div className="flex flex-wrap gap-2">
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
                  ? "border-theme-orange bg-theme-orange/10"
                  : "border-border-soft"
              }`}
              disabled={disabled}
              onClick={() => onClearerConfirm?.(false)}
            >
              Not yet
            </button>
          </div>
        </fieldset>
      ) : null}
    </div>
  );
}
