"use client";

import {
  MODULE7_OBSERVATION_CATEGORIES,
  MODULE7_OBSERVATION_NOTE_MAX,
  normalizeObservationNote,
} from "@/lib/module7/module7ReadAloudObservation";

/**
 * Active “What did you notice?” step after playback is available.
 */
export default function ModuleSevenReadAloudObservation({
  observation,
  onChange,
  disabled = false,
}) {
  if (!observation) return null;

  const selectedId = observation.categoryId || "";
  const note = observation.note || "";

  return (
    <section
      className="rounded-xl border-2 border-theme-blue/30 bg-theme-blue/5 px-4 py-4 shadow-soft"
      data-testid="module7-read-aloud-observation"
      aria-label="What did you notice"
    >
      <h2 className="text-base font-bold leading-snug text-text-primary md:text-lg">
        What did you notice?
      </h2>
      <p className="mt-1 text-sm leading-relaxed text-text-primary">
        Choose one place you may want to strengthen. Naming it turns listening into
        a revision plan.
      </p>

      <fieldset className="mt-3 space-y-2" disabled={disabled}>
        <legend className="text-sm font-semibold text-text-primary">
          Choose one place you may want to strengthen.
        </legend>
        <div
          role="radiogroup"
          aria-label="Revision observation categories"
          className="space-y-2"
          data-testid="module7-observation-radiogroup"
        >
          {MODULE7_OBSERVATION_CATEGORIES.map((option) => {
            const checked = selectedId === option.id;
            return (
              <label
                key={option.id}
                className={[
                  "flex min-h-[44px] cursor-pointer items-start gap-3 rounded-lg border px-3 py-2 text-sm leading-snug transition",
                  "focus-within:outline-none focus-within:ring-2 focus-within:ring-theme-dark focus-within:ring-offset-2",
                  checked
                    ? "border-theme-blue bg-white shadow-soft ring-1 ring-theme-blue/30"
                    : "border-border-soft bg-white/80 hover:bg-white",
                ].join(" ")}
              >
                <input
                  type="radio"
                  name="module7-read-aloud-observation"
                  value={option.id}
                  checked={checked}
                  disabled={disabled}
                  className="mt-1 h-4 w-4 shrink-0 accent-theme-blue"
                  onChange={() =>
                    onChange?.({
                      ...observation,
                      categoryId: option.id,
                    })
                  }
                />
                <span className="flex-1 text-text-primary">
                  {option.label}
                  {checked ? (
                    <span className="mt-0.5 block text-[11px] font-semibold uppercase tracking-wide text-theme-blue">
                      Selected
                    </span>
                  ) : null}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-4 space-y-1">
        <label
          htmlFor="module7-observation-note"
          className="text-sm font-semibold text-text-primary"
        >
          Where did you notice it? (optional)
        </label>
        <textarea
          id="module7-observation-note"
          data-testid="module7-observation-note"
          rows={2}
          maxLength={MODULE7_OBSERVATION_NOTE_MAX}
          disabled={disabled}
          value={note}
          placeholder="My second body paragraph moves from the evidence too quickly."
          className="min-h-[44px] w-full resize-y rounded-lg border border-border-soft bg-white px-3 py-2 text-sm leading-relaxed text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-dark focus-visible:ring-offset-2 disabled:opacity-60"
          onChange={(event) =>
            onChange?.({
              ...observation,
              note: normalizeObservationNote(event.target.value),
            })
          }
        />
        <p className="text-xs text-text-muted">
          {note.length}/{MODULE7_OBSERVATION_NOTE_MAX} characters. This note does not
          change your essay.
        </p>
      </div>
    </section>
  );
}
