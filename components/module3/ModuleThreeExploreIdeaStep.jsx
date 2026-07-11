"use client";

import ModuleThreeEvidenceCard from "@/components/module3/ModuleThreeEvidenceCard";
import WorkspaceCenter from "@/components/layout/WorkspaceCenter";
import WorkspaceColumns from "@/components/layout/WorkspaceColumns";
import WorkspaceGuide from "@/components/layout/WorkspaceGuide";
import WorkspaceSidebar from "@/components/layout/WorkspaceSidebar";
import {
  IDEA_LEADING_QUESTIONS,
  IDEA_SENTENCE_STARTERS,
  IDEA_STATEMENT_MINIMUM,
  IDEA_WHY_LEADING_QUESTIONS,
  IDEA_WHY_MINIMUM,
  getExploreIdeaPhase,
} from "@/lib/module3/exploreIdeaHelpers";

const ANSWER_TEXTAREA_CLASS =
  "min-h-[140px] w-full rounded-xl border-2 border-theme-dark/20 bg-white p-4 text-base leading-relaxed text-text-primary shadow-sm placeholder:text-text-muted/60 focus:border-theme-dark/35 focus:outline-none focus:ring-4 focus:ring-theme-dark/[0.06]";

const QUIET_TEXTAREA_CLASS =
  "min-h-[100px] w-full rounded-lg border border-border-soft/80 bg-white p-3 text-sm leading-relaxed text-text-primary focus:border-theme-blue/30 focus:outline-none focus:ring-2 focus:ring-theme-blue/10";

function safeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

export default function ModuleThreeExploreIdeaStep({
  selectedCluster = null,
  selectedPattern = null,
  selectedPatternEvidence = [],
  ideaStatement = "",
  ideaWhyMatters = "",
  onIdeaStatementChange,
  onIdeaWhyMattersChange,
  progressCompleted = [],
  progressNext = "",
  otherPatterns = [],
}) {
  const phase = getExploreIdeaPhase({
    statement: ideaStatement,
    whyMatters: ideaWhyMatters,
    statementMinimum: IDEA_STATEMENT_MINIMUM,
    whyMinimum: IDEA_WHY_MINIMUM,
  });

  const groupName = selectedCluster?.name || "Your group";
  const patternText = safeText(selectedPattern?.text);

  return (
    <WorkspaceColumns className="gap-6 xl:gap-10">
      <WorkspaceSidebar className="opacity-90">
        <aside className="space-y-4 rounded-xl bg-surface-soft/60 px-4 py-4 text-left">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-text-muted">
            Where you are
          </p>
          <p className="text-sm leading-relaxed text-text-muted">
            You noticed a pattern. Now you are making your first guess about what it might
            mean.
          </p>
          {progressCompleted.length > 0 ? (
            <ul className="space-y-2">
              {progressCompleted.map((line) => (
                <li
                  key={line}
                  className="flex items-start gap-2 text-sm leading-relaxed text-text-muted"
                >
                  <span aria-hidden="true" className="mt-0.5 text-text-muted/50">
                    ·
                  </span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          ) : null}
          {progressNext ? (
            <div className="border-t border-border-soft/60 pt-3">
              <p className="text-xs text-text-muted">Right now</p>
              <p className="mt-1 text-sm leading-relaxed text-text-muted">{progressNext}</p>
            </div>
          ) : null}
        </aside>
      </WorkspaceSidebar>

      <WorkspaceCenter>
        <div className="space-y-8 md:space-y-10">
          <header className="space-y-3 py-1 text-left md:py-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-text-muted">
              Start here
            </p>
            <h1 className="max-w-3xl text-[1.75rem] font-bold leading-[1.12] tracking-tight text-text-primary md:text-[2.35rem] md:leading-[1.1]">
              What might this pattern mean?
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-text-muted md:text-base">
              You noticed something across these quotations. Now you will make your first
              guess about what that pattern might mean.
            </p>
            <div className="max-w-2xl rounded-xl border border-border-soft/70 bg-surface-soft/40 px-4 py-3 text-sm leading-relaxed text-text-primary">
              <p>
                <span className="font-semibold">Pattern:</span> what you noticed.
              </p>
              <p className="mt-1">
                <span className="font-semibold">Idea:</span> what you think that pattern
                might mean.
              </p>
              <p className="mt-1">
                <span className="font-semibold">Claim or thesis:</span> something you will
                build later after testing the idea against evidence.
              </p>
            </div>
          </header>

          <section className="space-y-4" aria-labelledby="idea-artifacts-heading">
            <div className="text-left">
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-text-primary">
                Selected group
              </p>
              <h2
                id="idea-artifacts-heading"
                className="mt-1.5 text-lg font-semibold text-text-primary md:text-xl"
              >
                Here is the pattern you chose.
              </h2>
              <p className="mt-1 text-sm text-text-muted">
                Group: <span className="font-medium text-text-primary">{groupName}</span>
              </p>
            </div>

            <div className="rounded-xl border-2 border-theme-blue/30 bg-theme-blue/[0.05] px-4 py-4 md:px-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-theme-blue">
                Chosen observation
              </p>
              {patternText ? (
                <p className="mt-2 text-base leading-relaxed text-text-primary">
                  {patternText}
                </p>
              ) : (
                <p className="mt-2 text-sm text-text-muted">
                  Go back and choose an observation to explore before writing an idea.
                </p>
              )}
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium text-text-primary">
                These are the quotations that helped you notice it.
              </p>
              {selectedPatternEvidence.length === 0 ? (
                <p className="rounded-lg border border-theme-orange/30 bg-theme-orange/10 px-4 py-3 text-sm text-text-primary">
                  This observation needs linked quotations. Go back to the previous step and
                  connect at least two quotations.
                </p>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {selectedPatternEvidence.map((evidence) => (
                    <ModuleThreeEvidenceCard
                      key={`idea-selected-${evidence.id}`}
                      evidence={evidence}
                      grouping
                      showArtifactLabel={false}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>

          <div className="rounded-xl border-2 border-theme-orange/40 bg-theme-orange/10 px-5 py-5 shadow-soft ring-1 ring-theme-orange/15">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-theme-orange">
              Your job right now
            </p>
            <p className="mt-2 text-base font-semibold leading-snug text-text-primary">
              Decide what this pattern might mean.
            </p>
            <p className="mt-2 text-sm leading-relaxed text-text-primary">
              You are not proving anything yet. Write one clear idea that could explain why
              this pattern matters.
            </p>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-text-primary">
              <li>Read the chosen pattern.</li>
              <li>Look at the quotations together.</li>
              <li>Ask what larger idea they might reveal.</li>
              <li>Write your first interpretation in your own words.</li>
            </ol>
          </div>

          <section className="space-y-4" aria-labelledby="idea-write-heading">
            <div className="text-left">
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-text-primary">
                Coached interpretation
              </p>
              <h2
                id="idea-write-heading"
                className="mt-1.5 text-lg font-semibold text-text-primary md:text-xl"
              >
                Write your first idea.
              </h2>
              <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-text-muted">
                {IDEA_LEADING_QUESTIONS.map((question) => (
                  <li key={question}>{question}</li>
                ))}
              </ul>
              <details className="mt-3 rounded-lg bg-surface-soft/60 px-3 py-2">
                <summary className="cursor-pointer text-xs font-medium text-text-muted">
                  Optional sentence starters
                </summary>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-text-muted">
                  {IDEA_SENTENCE_STARTERS.map((starter) => (
                    <li key={starter}>{starter}</li>
                  ))}
                </ul>
              </details>
            </div>

            <div className="rounded-xl border-2 border-theme-orange/30 bg-white p-4 shadow-soft md:p-5">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-text-muted">
                Your idea
              </p>
              <label className="mt-2 block text-left">
                <span className="mb-2 block text-base font-medium text-text-primary">
                  What might this pattern mean?
                </span>
                <textarea
                  value={ideaStatement}
                  onChange={(event) => onIdeaStatementChange?.(event.target.value)}
                  placeholder="Write a possible idea in your own words"
                  className={ANSWER_TEXTAREA_CLASS}
                />
              </label>

              {!phase.statementReady ? (
                <p
                  role="status"
                  aria-live="polite"
                  className="mt-3 rounded-lg border border-theme-orange/35 bg-theme-orange/10 px-3 py-2 text-sm leading-relaxed text-text-primary"
                >
                  Write one clear idea about what this pattern might mean.
                </p>
              ) : (
                <p
                  role="status"
                  aria-live="polite"
                  className="mt-3 rounded-lg border border-theme-green/35 bg-theme-green/10 px-3 py-2 text-sm leading-relaxed text-text-primary"
                >
                  Good. Now take the idea one step further.
                </p>
              )}
            </div>
          </section>

          {phase.showWhyMatters ? (
            <section className="space-y-4" aria-labelledby="idea-why-heading">
              <div className="text-left">
                <h2
                  id="idea-why-heading"
                  className="text-lg font-semibold text-text-primary md:text-xl"
                >
                  Explain why this idea is worth exploring.
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-text-muted">
                  Worthwhile ideas help readers understand something important about King’s
                  message, his audience, his purpose, the relationship between the two texts,
                  or how his rhetorical choices work.
                </p>
                <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-text-muted">
                  {IDEA_WHY_LEADING_QUESTIONS.map((question) => (
                    <li key={question}>{question}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl border-2 border-theme-blue/25 bg-white p-4 md:p-5">
                <label className="block text-left">
                  <span className="mb-2 block text-base font-medium text-text-primary">
                    Why does this idea feel worth exploring?
                  </span>
                  <textarea
                    value={ideaWhyMatters}
                    onChange={(event) => onIdeaWhyMattersChange?.(event.target.value)}
                    placeholder="What makes this idea interesting or important?"
                    className={QUIET_TEXTAREA_CLASS}
                  />
                </label>

                {!phase.whyReady ? (
                  <p
                    role="status"
                    aria-live="polite"
                    className="mt-3 rounded-lg border border-theme-orange/35 bg-theme-orange/10 px-3 py-2 text-sm leading-relaxed text-text-primary"
                  >
                    Explain why this idea feels worth exploring.
                  </p>
                ) : null}
              </div>
            </section>
          ) : null}

          {phase.showReadyFeedback ? (
            <div
              role="status"
              aria-live="polite"
              className="rounded-xl border border-theme-green/35 bg-theme-green/10 px-4 py-3 text-sm leading-relaxed text-text-primary"
            >
              You now have an idea you can test against your quotations.
            </div>
          ) : null}

          <details className="rounded-xl border border-border-soft/70 bg-surface-soft/30 px-4 py-3 md:px-5">
            <summary className="cursor-pointer list-none text-sm font-medium text-theme-blue">
              Need Help
            </summary>
            <div className="mt-3 space-y-4 border-t border-border-soft/60 pt-3 text-sm leading-relaxed text-text-muted">
              <div>
                <p className="font-medium text-text-primary">Short example</p>
                <p className="mt-1">
                  Sample pattern: both quotations warn that waiting for justice causes harm.
                  A first idea could be: King may be showing that delay itself becomes part of
                  the injustice. That is an idea to test—not a thesis yet.
                </p>
              </div>
              <div>
                <p className="font-medium text-text-primary">Remember the difference</p>
                <ul className="mt-1 list-disc space-y-1 pl-5">
                  <li>Pattern: what you noticed.</li>
                  <li>Idea: what you think it might mean.</li>
                  <li>Claim or thesis: what you will argue later after testing the idea.</li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-text-primary">Sentence starters</p>
                <ul className="mt-1 list-disc space-y-1 pl-5">
                  {IDEA_SENTENCE_STARTERS.map((starter) => (
                    <li key={`help-${starter}`}>{starter}</li>
                  ))}
                </ul>
              </div>
              <p>
                Your first idea does not need to be perfect. It just needs to be clear enough
                to test against the quotations.
              </p>

              {otherPatterns.length > 0 ? (
                <details className="rounded-lg bg-white/70 px-3 py-2">
                  <summary className="cursor-pointer text-xs font-medium text-text-muted">
                    Review another pattern you noticed
                  </summary>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-text-muted">
                    {otherPatterns.map((pattern) => (
                      <li key={pattern.id}>{pattern.text}</li>
                    ))}
                  </ul>
                </details>
              ) : null}
            </div>
          </details>
        </div>
      </WorkspaceCenter>

      <WorkspaceGuide className="opacity-90">
        <aside className="space-y-5 rounded-xl bg-surface-soft/70 px-4 py-5 text-left">
          <div className="space-y-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-text-muted">
              From your teacher
            </p>
            <p className="text-sm leading-relaxed text-text-primary">
              Keep the language simple. A clear first idea is better than a fancy sentence.
            </p>
          </div>
          <div className="space-y-2 border-t border-border-soft/60 pt-4">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-text-muted">
              What comes next
            </p>
            <p className="text-sm leading-relaxed text-text-muted">
              Next, you will look at each quotation and explain how it supports—or
              challenges—this idea.
            </p>
          </div>
        </aside>
      </WorkspaceGuide>
    </WorkspaceColumns>
  );
}
