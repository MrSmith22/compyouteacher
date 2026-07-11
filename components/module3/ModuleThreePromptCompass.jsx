"use client";

import { getPromptCompassModel } from "@/lib/module3/promptCompassHelpers";

/**
 * Prompt compass: "What must my final writing accomplish?"
 * Not a progress bar and not the artifact chain — no checkmarks,
 * no completion state, no gate behavior.
 */
export default function ModuleThreePromptCompass({
  assignmentPrompt = "",
  focusQuestionId = "",
  framingLine = "",
}) {
  const compass = getPromptCompassModel({ assignmentPrompt, focusQuestionId });

  return (
    <section
      aria-labelledby="prompt-compass-heading"
      className="rounded-xl border border-theme-dark/15 bg-surface-soft/50 px-4 py-4 md:px-5"
    >
      <h2
        id="prompt-compass-heading"
        className="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted"
      >
        {compass.heading}
      </h2>

      {framingLine ? (
        <p className="mt-2 text-sm leading-relaxed text-text-primary">{framingLine}</p>
      ) : null}

      <ol className="mt-3 space-y-2">
        {compass.questions.map((question) => (
          <li
            key={question.id}
            aria-current={question.isFocus ? "true" : undefined}
            className={`rounded-lg border px-3 py-2 text-sm leading-relaxed ${
              question.isFocus
                ? "border-theme-orange/40 bg-theme-orange/[0.08] text-text-primary"
                : "border-transparent text-text-muted"
            }`}
          >
            {question.isFocus ? (
              <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.16em] text-theme-orange">
                {compass.focusMarker}
              </span>
            ) : null}
            <span className={question.isFocus ? "font-medium" : ""}>{question.text}</span>
          </li>
        ))}
      </ol>

      {compass.hasFullPrompt ? (
        <details className="mt-3 rounded-lg bg-white/70">
          <summary className="cursor-pointer px-3 py-2 text-xs font-medium text-theme-blue underline-offset-2 hover:underline">
            {compass.disclosureLabel}
          </summary>
          <p className="whitespace-pre-line border-t border-border-soft/60 px-3 py-3 text-sm leading-relaxed text-text-muted">
            {compass.fullPrompt}
          </p>
        </details>
      ) : null}
    </section>
  );
}
