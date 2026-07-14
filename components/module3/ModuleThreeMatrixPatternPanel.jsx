"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import ModuleThreeMatrixProvenanceCard from "@/components/module3/ModuleThreeMatrixProvenanceCard";

/**
 * Ready / existing-work / review UI for Module 3 pattern step (CP-D).
 * Does not invent pattern text — adopts Module 2 selection on explicit action.
 */
export default function ModuleThreeMatrixPatternPanel({
  presentation = null,
  selectedPatternId = "",
  patternNotices = [],
  adoptBusy = false,
  adoptError = "",
  onCarryForward,
  onChooseOption,
  onRetainExisting,
  onCustomSubmit,
  evidenceCandidates = [],
}) {
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [customText, setCustomText] = useState("");
  const [customOpen, setCustomOpen] = useState(false);
  const [customStage, setCustomStage] = useState("describe");
  const [customEvidenceIds, setCustomEvidenceIds] = useState([]);

  if (!presentation || presentation.useLegacyPatternPath) {
    return null;
  }

  if (presentation.mode === "matrix_review_required") {
    return (
      <section
        className="space-y-4 overflow-x-hidden rounded-xl border-2 border-theme-orange/40 bg-theme-orange/[0.06] px-4 py-5 sm:px-5"
        data-testid="matrix-pattern-review-required"
        role="status"
      >
        <h1 className="text-[1.75rem] font-bold leading-tight text-text-primary md:text-[2.1rem]">
          What direction did your evidence lead you toward?
        </h1>
        <p className="text-base font-semibold text-text-primary">
          {presentation.reviewMessage ||
            "Your Module 2 analysis needs one more check."}
        </p>
        {presentation.cta?.detail ? (
          <p className="text-sm leading-relaxed text-text-muted">
            {presentation.cta.detail}
          </p>
        ) : null}
        <a
          href={presentation.cta?.href || "/modules/2/matrix"}
          className="inline-flex min-h-[44px] w-full items-center justify-center rounded-lg bg-theme-blue px-4 py-2 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-theme-blue/40 sm:w-auto"
        >
          {presentation.cta?.label || "Return to my matrix"}
        </a>
        <p className="text-sm text-text-muted">
          Your existing Module 3 writing stays saved while you finish the matrix.
        </p>
      </section>
    );
  }

  const selected = presentation.selectedPattern;
  const existingSelected = patternNotices.find(
    (n) => n.id === selectedPatternId && String(n.text || "").trim()
  );

  return (
    <section
      className="space-y-6 overflow-x-hidden"
      data-testid="matrix-pattern-ready-panel"
    >
      <header className="space-y-3 text-left">
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-text-muted">
          Start here
        </p>
        <h1 className="max-w-3xl text-[1.75rem] font-bold leading-[1.12] tracking-tight text-text-primary md:text-[2.35rem] md:leading-[1.1]">
          What direction did your evidence lead you toward?
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-text-muted md:text-base">
          {presentation.transparencyNote}
        </p>
      </header>

      {presentation.mode === "existing_module3_with_matrix" && existingSelected ? (
        <div
          className="rounded-xl border border-border-soft/80 bg-surface-soft/50 px-4 py-4"
          role="status"
        >
          <p className="text-sm font-medium text-text-primary">
            You already have a saved Module 3 direction.
          </p>
          <p className="mt-1 text-sm text-text-muted">
            “{existingSelected.text}”
          </p>
          <p className="mt-2 text-sm text-text-muted">
            Module 2 also has a selected direction. Keep your saved thinking, or
            explicitly adopt the Module 2 direction below.
          </p>
          <Button
            type="button"
            variant="secondary"
            className="mt-3 min-h-[44px] w-full sm:w-auto"
            onClick={() => onRetainExisting?.()}
          >
            {presentation.retainExistingLabel || "Keep my saved Module 3 direction"}
          </Button>
        </div>
      ) : null}

      <div className="rounded-xl border-2 border-theme-blue/40 bg-white px-4 py-5 shadow-soft ring-1 ring-theme-blue/15 sm:px-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-theme-blue">
          Your direction from Module 2
        </p>
        <p className="mt-2 text-lg font-semibold leading-snug text-text-primary">
          {selected?.label || "Selected pattern"}
        </p>

        <div className="mt-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted">
            Why this direction appeared
          </p>
          <ModuleThreeMatrixProvenanceCard
            compact={false}
            eyebrow="Evidence and ratings from your matrix"
            selectedLabel={selected?.label || ""}
            becauseYouExplanation={presentation.becauseYouExplanation}
            audiencePurposeReasoning={presentation.audiencePurposeReasoning}
            ratingLines={presentation.readableRatingLines}
            evidenceLines={presentation.readableEvidenceProvenance}
          />
        </div>

        <Button
          type="button"
          className="mt-5 min-h-[44px] w-full sm:w-auto"
          disabled={adoptBusy}
          onClick={() => onCarryForward?.(selected)}
        >
          {presentation.carryForwardLabel || "Carry this direction forward"}
        </Button>
      </div>

      <div>
        <button
          type="button"
          className="text-sm font-medium text-theme-blue underline-offset-2 hover:underline focus:outline-none focus:ring-2 focus:ring-theme-blue/30 rounded"
          aria-expanded={showAlternatives}
          onClick={() => setShowAlternatives((v) => !v)}
        >
          {presentation.chooseDifferentLabel || "Choose a different direction"}
        </button>

        {showAlternatives ? (
          <div className="mt-4 space-y-3" role="radiogroup" aria-label="Other matrix-supported directions">
            {(presentation.primaryOptions || []).map((option) => (
              <label
                key={option.id}
                className="flex cursor-pointer items-start gap-3 rounded-xl border border-border-soft/80 bg-white px-4 py-3"
              >
                <input
                  type="radio"
                  name="matrix-alt-direction"
                  className="mt-1"
                  disabled={adoptBusy}
                  onChange={() => onChooseOption?.(option)}
                />
                <span>
                  <span className="block text-sm font-medium text-text-primary">
                    {option.label}
                  </span>
                  {option.why ? (
                    <span className="mt-1 block text-sm text-text-muted">
                      {option.why}
                    </span>
                  ) : null}
                </span>
              </label>
            ))}

            <div className="rounded-xl border border-dashed border-border-soft px-4 py-3">
              <button
                type="button"
                className="text-sm font-medium text-text-primary"
                onClick={() => {
                  setCustomOpen((v) => !v);
                  setCustomStage("describe");
                }}
              >
                {presentation.customOption?.label || "Another pattern I notice"}
              </button>
              {customOpen ? (
                <div className="mt-3 space-y-3">
                  {customStage === "describe" ? (
                    <>
                      <label
                        htmlFor="matrix-custom-pattern"
                        className="block text-sm text-text-muted"
                      >
                        Name the pattern you notice
                      </label>
                      <textarea
                        id="matrix-custom-pattern"
                        value={customText}
                        onChange={(e) => setCustomText(e.target.value)}
                        className="min-h-[88px] w-full rounded-xl border-2 border-theme-dark/20 bg-white p-3 text-sm"
                      />
                      <Button
                        type="button"
                        size="sm"
                        className="min-h-[44px]"
                        disabled={customText.trim().length < 15}
                        onClick={() => setCustomStage("connect_evidence")}
                      >
                        Next: connect evidence
                      </Button>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-medium text-text-primary">
                        Connect at least one quotation that supports “
                        {customText.trim()}”
                      </p>
                      <p className="text-xs text-text-muted">
                        Choose evidence yourself. Nothing is selected for you.
                      </p>
                      <div
                        className="space-y-2"
                        role="group"
                        aria-label="Evidence for custom direction"
                      >
                        {(evidenceCandidates || []).map((item) => {
                          const id = item.evidenceId || item.id;
                          const checked = customEvidenceIds.includes(id);
                          return (
                            <label
                              key={id}
                              className="flex cursor-pointer items-start gap-2 rounded-lg border border-border-soft/70 bg-white p-3 text-sm"
                            >
                              <input
                                type="checkbox"
                                className="mt-1"
                                checked={checked}
                                onChange={() => {
                                  setCustomEvidenceIds((prev) =>
                                    checked
                                      ? prev.filter((x) => x !== id)
                                      : [...prev, id]
                                  );
                                }}
                              />
                              <span className="break-words text-text-primary">
                                {item.visibleLabel ||
                                  `${item.sourceLabel || "Source"} · ${item.appeal || ""} — “${item.quotation || item.quote || "Saved evidence"}”`}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                      {(evidenceCandidates || []).length === 0 ? (
                        <p className="text-sm text-text-muted">
                          No resolvable matrix evidence is available yet. Return
                          to Module 2 if you still need quotations linked.
                        </p>
                      ) : null}
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className="min-h-[44px]"
                          onClick={() => setCustomStage("describe")}
                        >
                          Back
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          className="min-h-[44px]"
                          disabled={
                            adoptBusy || customEvidenceIds.length < 1
                          }
                          onClick={() =>
                            onCustomSubmit?.(
                              customText.trim(),
                              customEvidenceIds
                            )
                          }
                        >
                          Save this custom direction
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      {adoptError ? (
        <p role="alert" className="text-sm text-theme-red">
          {adoptError}
        </p>
      ) : null}
    </section>
  );
}
