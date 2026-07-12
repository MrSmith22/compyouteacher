"use client";

/**
 * Module 4 Checkpoint 2 handoff screen.
 * Read-only presentation of Module 3 work + paragraph-plan teaching.
 */

function SectionCard({ title, children, emphasized = false }) {
  return (
    <section
      className={[
        "rounded-xl border p-4 space-y-3 text-left",
        emphasized
          ? "border-theme-blue/35 bg-theme-blue/5"
          : "border-theme-dark/15 bg-theme-light/90",
      ].join(" ")}
    >
      {title ? (
        <h3 className="text-sm font-extrabold uppercase tracking-wide text-theme-dark/70">
          {title}
        </h3>
      ) : null}
      {children}
    </section>
  );
}

export default function ModuleFourHandoffStep({
  presentation,
  onStartParagraph1,
}) {
  const p = presentation || {};
  const functions = Array.isArray(p.paragraphFunctions)
    ? p.paragraphFunctions
    : [];
  const proofItems = Array.isArray(p.proofPlanItems) ? p.proofPlanItems : [];
  const examples = p.modelExamples || {};
  const foundation = p.evidenceFoundation || {};

  return (
    <div className="space-y-5 text-left">
      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-theme-blue">
          Module 3 → Module 4
        </p>
        <h2 className="text-2xl font-extrabold text-theme-blue leading-tight">
          {p.question || "How will my Module 3 argument become paragraph plans?"}
        </h2>
      </div>

      <SectionCard title="Start here" emphasized>
        <ul className="space-y-2 text-sm text-theme-dark/90 leading-relaxed">
          {(p.startHereLines || []).map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </SectionCard>

      <SectionCard title="Your argument is coming with you">
        <div className="space-y-3">
          <div className="rounded-lg border border-theme-dark/10 bg-white/90 p-3">
            <p className="text-[11px] font-bold uppercase tracking-wide text-theme-dark/55 mb-1">
              Thesis
            </p>
            <p className="text-sm text-theme-dark whitespace-pre-wrap">
              {p.thesis || "Your thesis from Module 3 will appear here when it is saved."}
            </p>
          </div>

          <div className="rounded-lg border border-theme-dark/10 bg-white/90 p-3 space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-wide text-theme-dark/55">
              Proof-plan notes
            </p>
            {proofItems.length === 0 ? (
              <p className="text-sm text-theme-dark/70">
                Proof-plan notes from Module 3 will appear here when they are saved.
              </p>
            ) : (
              <ol className="space-y-2">
                {proofItems.map((item) => (
                  <li key={`${item.slotIndex}-${item.label}`} className="text-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-theme-blue/80">
                      {item.label}
                    </p>
                    <p className="text-theme-dark/90 whitespace-pre-wrap">{item.text}</p>
                  </li>
                ))}
              </ol>
            )}
          </div>

          {p.patternText ? (
            <div className="inline-flex max-w-full rounded-lg border border-theme-orange/25 bg-theme-orange/5 px-3 py-2 text-left">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wide text-theme-orange">
                  Selected pattern · reference
                </p>
                <p className="mt-0.5 text-xs text-theme-dark/90 whitespace-pre-wrap">
                  {p.patternText}
                </p>
              </div>
            </div>
          ) : null}

          <div className="rounded-lg border border-theme-dark/10 bg-white/90 p-3 space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wide text-theme-dark/55">
              Evidence foundation
            </p>
            <p className="text-sm text-theme-dark/90">{foundation.summary}</p>
            {foundation.bothWorks ? (
              <p className="text-xs font-semibold text-theme-blue">
                Includes explained working evidence from both Speech and Letter.
              </p>
            ) : null}
            <p className="text-xs text-theme-dark/70">{foundation.note}</p>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="How a paragraph plan works">
        <p className="text-sm text-theme-dark/85 leading-relaxed">
          {p.planVersusProse}
        </p>
        <ol className="mt-3 space-y-2">
          {functions.map((fn, index) => (
            <li
              key={fn.id}
              className="flex gap-3 rounded-lg border border-theme-dark/10 bg-white/90 px-3 py-2"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-theme-blue/10 text-xs font-extrabold text-theme-blue">
                {index + 1}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-extrabold text-theme-dark">
                  {fn.title}
                </span>
                <span className="block text-xs text-theme-dark/75 leading-relaxed">
                  {fn.description}
                </span>
              </span>
            </li>
          ))}
        </ol>

        {(examples.thesis ||
          examples.proofPlanNote ||
          examples.quotation) && (
          <details className="mt-3 rounded-lg border border-dashed border-theme-dark/20 bg-theme-light/80 p-3">
            <summary className="cursor-pointer text-xs font-bold uppercase tracking-wide text-theme-dark/60">
              See examples from your Module 3 work
            </summary>
            <div className="mt-3 space-y-2 text-xs text-theme-dark/85">
              {examples.thesis ? (
                <p>
                  <span className="font-semibold">Thesis: </span>
                  {examples.thesis}
                </p>
              ) : null}
              {examples.proofPlanNote ? (
                <p>
                  <span className="font-semibold">
                    {examples.proofPlanNote.label}:{" "}
                  </span>
                  {examples.proofPlanNote.text}
                </p>
              ) : null}
              {examples.quotation?.quote ? (
                <div className="space-y-1">
                  <p>
                    <span className="font-semibold">Saved quotation: </span>
                    <span className="italic">
                      &ldquo;{examples.quotation.quote}&rdquo;
                    </span>
                  </p>
                  {examples.quotation.priorThinking ? (
                    <p>
                      <span className="font-semibold">Your earlier thinking: </span>
                      {examples.quotation.priorThinking}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
          </details>
        )}
      </SectionCard>

      <SectionCard title="What you will build">
        <ul className="space-y-2 text-sm text-theme-dark/90 leading-relaxed">
          {(p.buildLines || []).map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </SectionCard>

      <div className="pt-1">
        <button
          type="button"
          onClick={onStartParagraph1}
          className="w-full sm:w-auto rounded-lg bg-theme-blue px-5 py-3 text-sm font-extrabold text-white shadow-sm hover:opacity-95"
        >
          {p.ctaLabel || "Start Paragraph 1"}
        </button>
      </div>
    </div>
  );
}
