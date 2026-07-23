"use client";

/**
 * WP-087 — Desk panel showing speech + letter supporting observations
 * for any gated WP-079 direction (development only).
 */

import { useMemo, useState } from "react";
import {
  resolveEvidencePairForDirection,
  diagnoseEvidenceHealth,
  partitionDeskAndShelf,
} from "@/lib/artifacts/evidenceArgumentContract";
import {
  buildEvidenceArgumentDirectionDescriptor,
  WP079_APPEALS,
  WP079_RELATIONSHIP,
} from "@/lib/module2/evidenceArgumentDirectionDescriptor";
import { isEvidenceToArgumentSliceEnabled } from "@/lib/dev/isEvidenceToArgumentSliceEnabled";
import { resolveTaskWorkspacePresentation } from "@/lib/ui/taskWorkspaceContract";

function safeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

const APPEAL_LABEL = Object.freeze({
  ethos: "credibility",
  pathos: "emotional appeal",
  logos: "logic",
});

const RELATIONSHIP_OPTIONS = [
  { id: WP079_RELATIONSHIP.STRONG_CONTRAST, label: "Strong contrast" },
  { id: WP079_RELATIONSHIP.MEANINGFUL_SIMILARITY, label: "Meaningful similarity" },
  { id: WP079_RELATIONSHIP.NUANCED_DIFFERENCE, label: "Nuanced difference" },
  { id: "cross_dominant", label: "Different leading appeals" },
  { id: "student_created", label: "Another relationship I notice" },
];

export default function RepresentativeDirectionEvidencePanel({
  selectedOptionId = "",
  evidenceRecords = [],
  matrixBundle = null,
  speechText = "",
  letterText = "",
  customMapping = null,
  onCustomMappingChange = null,
  onReplaceSpeechId = null,
  onReplaceLetterId = null,
  speechCandidates = null,
  letterCandidates = null,
}) {
  const [localMapping, setLocalMapping] = useState(() => ({
    speechAppeal: customMapping?.speechAppeal || "",
    letterAppeal: customMapping?.letterAppeal || "",
    relationship: customMapping?.relationship || "",
    speechEvidenceId: customMapping?.speechEvidenceId || "",
    letterEvidenceId: customMapping?.letterEvidenceId || "",
    label: customMapping?.label || "",
  }));

  const mapping =
    selectedOptionId === "student_created"
      ? customMapping || localMapping
      : customMapping;

  const gated = isEvidenceToArgumentSliceEnabled({
    optionId: selectedOptionId,
    customMapping: mapping,
  });

  const descriptor = useMemo(
    () =>
      buildEvidenceArgumentDirectionDescriptor({
        optionId: selectedOptionId,
        matrixBundle,
        customMapping: mapping,
      }),
    [selectedOptionId, matrixBundle, mapping]
  );

  if (!gated && selectedOptionId !== "student_created") {
    return null;
  }

  // student_created shows mapping UI even before fully mapped so students can complete it.
  if (selectedOptionId !== "student_created" && !gated) {
    return null;
  }

  const paired = resolveEvidencePairForDirection({
    descriptor,
    matrixBundle,
    evidenceRecords,
    priorSpeechId: mapping?.speechEvidenceId || null,
    priorLetterId: mapping?.letterEvidenceId || null,
    customMapping: mapping,
  });

  const { shelf } = partitionDeskAndShelf(evidenceRecords, {
    speechText,
    letterText,
  });

  const speechFindings = paired.speech
    ? diagnoseEvidenceHealth(paired.speech, {
        speechText,
        letterText,
        expectedSourceKind: "speech",
      })
    : [];
  const letterFindings = paired.letter
    ? diagnoseEvidenceHealth(paired.letter, {
        speechText,
        letterText,
        expectedSourceKind: "letter",
      })
    : [];

  const speechPool =
    Array.isArray(speechCandidates) && speechCandidates.length
      ? speechCandidates
      : paired.speechCandidates || [];
  const letterPool =
    Array.isArray(letterCandidates) && letterCandidates.length
      ? letterCandidates
      : paired.letterCandidates || [];

  const speechAppealLabel = APPEAL_LABEL[descriptor.speechAppeal] || "your focus";
  const letterAppealLabel = APPEAL_LABEL[descriptor.letterAppeal] || "your focus";

  function patchMapping(partial) {
    const next = { ...(mapping || {}), ...partial };
    setLocalMapping(next);
    onCustomMappingChange?.(next);
  }

  const workspacePresentation = resolveTaskWorkspacePresentation({
    moduleNumber: 2,
    taskHeading: "Your evidence for this comparison",
    desktopWidthIntent: "single",
  });

  return (
    <div
      className="mt-4 space-y-3 rounded-xl border border-theme-blue/30 bg-theme-blue/5 p-4"
      data-testid="wp086-direction-evidence-pair"
      data-family={descriptor.family || ""}
      data-option-id={selectedOptionId || ""}
      data-task-workspace-foundation="true"
      data-task-workspace-contract={workspacePresentation.journeyStageId}
      data-task-workspace-region="desk"
      data-instructional-color-role="evidence"
    >
      <h3 className="text-sm font-bold text-text-primary">
        Your evidence for this comparison
      </h3>
      <p className="text-sm text-text-muted">
        Check one passage from the speech and one from the letter before you
        continue. You can replace a side if it is weak.
      </p>
      {descriptor.label ? (
        <p className="text-xs text-text-muted" data-testid="wp087-direction-label">
          {descriptor.label}
        </p>
      ) : null}

      {selectedOptionId === "student_created" ? (
        <div
          className="space-y-3 rounded-lg border border-border-soft bg-white p-3"
          data-testid="wp087-custom-mapping"
        >
          <p className="text-sm font-medium text-text-primary">
            Map your comparison (required)
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="block text-xs text-text-muted">
              Speech appeal
              <select
                className="mt-1 w-full rounded border border-border-soft px-2 py-1 text-sm"
                value={mapping?.speechAppeal || ""}
                onChange={(e) => patchMapping({ speechAppeal: e.target.value })}
                aria-label="Speech appeal for custom direction"
              >
                <option value="">Choose…</option>
                {WP079_APPEALS.map((a) => (
                  <option key={a} value={a}>
                    {APPEAL_LABEL[a]}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs text-text-muted">
              Letter appeal
              <select
                className="mt-1 w-full rounded border border-border-soft px-2 py-1 text-sm"
                value={mapping?.letterAppeal || ""}
                onChange={(e) => patchMapping({ letterAppeal: e.target.value })}
                aria-label="Letter appeal for custom direction"
              >
                <option value="">Choose…</option>
                {WP079_APPEALS.map((a) => (
                  <option key={a} value={a}>
                    {APPEAL_LABEL[a]}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="block text-xs text-text-muted">
            Relationship
            <select
              className="mt-1 w-full rounded border border-border-soft px-2 py-1 text-sm"
              value={mapping?.relationship || ""}
              onChange={(e) => patchMapping({ relationship: e.target.value })}
              aria-label="Relationship for custom direction"
            >
              <option value="">Choose…</option>
              {RELATIONSHIP_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs text-text-muted">
            Speech evidence
            <select
              className="mt-1 w-full rounded border border-border-soft px-2 py-1 text-sm"
              value={mapping?.speechEvidenceId || ""}
              onChange={(e) => patchMapping({ speechEvidenceId: e.target.value })}
              aria-label="Speech evidence for custom direction"
            >
              <option value="">Choose…</option>
              {evidenceRecords
                .filter((r) => r.sourceKind === "speech")
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {(c.quotation || c.id).slice(0, 60)}
                  </option>
                ))}
            </select>
          </label>
          <label className="block text-xs text-text-muted">
            Letter evidence
            <select
              className="mt-1 w-full rounded border border-border-soft px-2 py-1 text-sm"
              value={mapping?.letterEvidenceId || ""}
              onChange={(e) => patchMapping({ letterEvidenceId: e.target.value })}
              aria-label="Letter evidence for custom direction"
            >
              <option value="">Choose…</option>
              {evidenceRecords
                .filter((r) => r.sourceKind === "letter")
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {(c.quotation || c.id).slice(0, 60)}
                  </option>
                ))}
            </select>
          </label>
          {!descriptor.mappingComplete ? (
            <p className="text-xs text-theme-orange" role="status">
              Finish mapping both appeals and both passages to continue with this
              direction.
            </p>
          ) : null}
        </div>
      ) : null}

      {gated || descriptor.mappingComplete ? (
        <div className="grid gap-3 md:grid-cols-2">
          <div
            className="rounded-lg border border-border-soft bg-white p-3"
            data-testid="wp086-speech-evidence-card"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
              Speech · {speechAppealLabel}
            </p>
            {paired.speech ? (
              <>
                <p className="mt-2 text-sm text-text-primary">
                  “{safeText(paired.speech.quotation)}”
                </p>
                <p className="mt-2 text-xs text-text-muted">
                  <span className="font-medium text-text-primary">
                    What it may do for the audience:{" "}
                  </span>
                  {safeText(paired.speech.audienceEffect) || "Add this next."}
                </p>
                <p className="mt-1 text-xs text-text-muted">
                  <span className="font-medium text-text-primary">
                    How it supports the purpose:{" "}
                  </span>
                  {safeText(paired.speech.purposeContribution) || "Add this next."}
                </p>
              </>
            ) : (
              <p className="mt-2 text-sm text-theme-orange">
                {paired.requiresStudentPick
                  ? "More than one speech passage fits — choose which one to use."
                  : `No speech passage is linked yet. Gather ${speechAppealLabel} evidence for the speech.`}
              </p>
            )}
            {speechFindings.length ? (
              <ul className="mt-2 space-y-1 text-xs text-theme-orange" role="status">
                {speechFindings.map((f) => (
                  <li key={f.code}>{f.message}</li>
                ))}
              </ul>
            ) : null}
            {typeof onReplaceSpeechId === "function" && speechPool.length > 1 ? (
              <label className="mt-2 block text-xs text-text-muted">
                Replace speech evidence
                <select
                  className="mt-1 w-full rounded border border-border-soft px-2 py-1 text-sm"
                  value={paired.speech?.id || ""}
                  onChange={(e) => onReplaceSpeechId(e.target.value)}
                  aria-label="Replace speech evidence"
                >
                  {speechPool.map((c) => (
                    <option key={c.id} value={c.id}>
                      {(c.quotation || c.id).slice(0, 60)}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
          </div>

          <div
            className="rounded-lg border border-border-soft bg-white p-3"
            data-testid="wp086-letter-evidence-card"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
              Letter · {letterAppealLabel}
            </p>
            {paired.letter ? (
              <>
                <p className="mt-2 text-sm text-text-primary">
                  “{safeText(paired.letter.quotation)}”
                </p>
                <p className="mt-2 text-xs text-text-muted">
                  <span className="font-medium text-text-primary">
                    What it may do for the audience:{" "}
                  </span>
                  {safeText(paired.letter.audienceEffect) || "Add this next."}
                </p>
                <p className="mt-1 text-xs text-text-muted">
                  <span className="font-medium text-text-primary">
                    How it supports the purpose:{" "}
                  </span>
                  {safeText(paired.letter.purposeContribution) || "Add this next."}
                </p>
              </>
            ) : (
              <p className="mt-2 text-sm text-theme-orange">
                {paired.requiresStudentPick
                  ? "More than one letter passage fits — choose which one to use."
                  : `No letter passage is linked yet. Gather ${letterAppealLabel} evidence for the letter.`}
              </p>
            )}
            {letterFindings.length ? (
              <ul className="mt-2 space-y-1 text-xs text-theme-orange" role="status">
                {letterFindings.map((f) => (
                  <li key={f.code}>{f.message}</li>
                ))}
              </ul>
            ) : null}
            {typeof onReplaceLetterId === "function" && letterPool.length > 1 ? (
              <label className="mt-2 block text-xs text-text-muted">
                Replace letter evidence
                <select
                  className="mt-1 w-full rounded border border-border-soft px-2 py-1 text-sm"
                  value={paired.letter?.id || ""}
                  onChange={(e) => onReplaceLetterId(e.target.value)}
                  aria-label="Replace letter evidence"
                >
                  {letterPool.map((c) => (
                    <option key={c.id} value={c.id}>
                      {(c.quotation || c.id).slice(0, 60)}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
          </div>
        </div>
      ) : null}

      {shelf.length ? (
        <details className="rounded border border-border-soft bg-white px-3 py-2">
          <summary className="cursor-pointer text-sm font-medium text-text-muted">
            Saved notes that need review ({shelf.length})
          </summary>
          <ul className="mt-2 space-y-2 text-xs text-text-muted">
            {shelf.map(({ record, findings }) => (
              <li key={record.id} data-testid="wp086-shelf-review-item">
                <span className="font-medium text-text-primary">
                  {record.sourceKind === "letter" ? "Letter" : "Speech"}
                </span>
                : {safeText(record.quotation) || "No quotation"}
                {findings[0] ? ` — ${findings[0].message}` : ""}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}
