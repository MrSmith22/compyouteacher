"use client";

import { useMemo, useState } from "react";
import ModuleThreeEvidenceCard from "@/components/module3/ModuleThreeEvidenceCard";
import WorkspaceCenter from "@/components/layout/WorkspaceCenter";
import WorkspaceColumns from "@/components/layout/WorkspaceColumns";
import WorkspaceGuide from "@/components/layout/WorkspaceGuide";
import WorkspaceSidebar from "@/components/layout/WorkspaceSidebar";
import {
  ARGUMENT_THINKING_PATH,
  CLAIM_FIELD_INTRO,
  CLAIM_FIELD_REMINDER,
  CLAIM_JOB_HEADLINE,
  CLAIM_JOB_STEPS,
  CLAIM_LEADING_QUESTIONS,
  CLAIM_SELF_CHECK_ITEMS,
  CLAIM_SENTENCE_STARTERS,
  PROOF_PLAN_LABELS,
  PROOF_PLAN_MINIMUM,
  THESIS_JOB_HEADLINE,
  THESIS_LEADING_QUESTIONS,
  buildArgumentProofItems,
  getClaimPhase,
  getThesisPhase,
} from "@/lib/module3/buildArgumentHelpers";

const ANSWER_TEXTAREA_CLASS =
  "min-h-[140px] w-full rounded-xl border-2 border-theme-dark/20 bg-white p-4 text-base leading-relaxed text-text-primary shadow-sm placeholder:text-text-muted/60 focus:border-theme-dark/35 focus:outline-none focus:ring-4 focus:ring-theme-dark/[0.06]";

const QUIET_TEXTAREA_CLASS =
  "min-h-[80px] w-full rounded-lg border border-border-soft/80 bg-white p-3 text-sm leading-relaxed text-text-primary focus:border-theme-blue/30 focus:outline-none focus:ring-2 focus:ring-theme-blue/10";

const LONG_QUOTE_CHARS = 320;

function ExpandableQuote({ quote }) {
  const [expanded, setExpanded] = useState(false);
  const text = typeof quote === "string" ? quote : "";
  const isLong = text.length > LONG_QUOTE_CHARS;
  const visible =
    !isLong || expanded ? text : `${text.slice(0, LONG_QUOTE_CHARS).trimEnd()}…`;

  return (
    <div>
      <blockquote className="rounded-lg bg-white/80 px-4 py-3 text-sm italic leading-relaxed text-theme-dark/85">
        &ldquo;{visible}&rdquo;
      </blockquote>
      {isLong ? (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="mt-2 text-xs font-medium text-theme-blue underline-offset-2 hover:underline"
        >
          {expanded ? "Show less" : "Show full quotation"}
        </button>
      ) : null}
    </div>
  );
}

function ProofItemCard({ item, index, compact = false }) {
  return (
    <li className="rounded-xl border border-border-soft/80 bg-white p-4 shadow-soft">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted">
        Quotation {index + 1}
      </p>
      <div className="mt-3">
        {compact ? (
          <ModuleThreeEvidenceCard
            evidence={item.evidence}
            grouping
            showArtifactLabel={false}
          />
        ) : (
          <div
            className={`rounded-xl border border-l-[3px] px-4 py-3 ${
              item.sourceType === "letter"
                ? "border-theme-orange/25 border-l-theme-orange bg-theme-orange/[0.04]"
                : "border-theme-blue/25 border-l-theme-blue bg-theme-blue/[0.04]"
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <span
                className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
                  item.sourceType === "letter"
                    ? "border border-theme-orange/30 bg-theme-orange/10 text-theme-orange"
                    : "border border-theme-blue/30 bg-theme-blue/10 text-theme-blue"
                }`}
              >
                {item.sourceLabel || item.sourceType}
              </span>
              {item.sourceTitle ? (
                <p className="text-sm font-semibold text-text-primary">
                  {item.sourceTitle}
                </p>
              ) : null}
            </div>
            <div className="mt-3">
              <ExpandableQuote quote={item.quote} />
            </div>
            {item.observation ? (
              <p className="mt-3 text-sm leading-relaxed text-text-muted">
                <span className="font-semibold text-text-primary">Your note: </span>
                {item.observation}
              </p>
            ) : null}
          </div>
        )}
      </div>
      <div className="mt-3 rounded-lg border border-theme-blue/20 bg-theme-blue/[0.05] px-3 py-2">
        <p className="text-xs font-medium text-theme-blue">
          Relationship: {item.relationLabel}
        </p>
        <p className="mt-1 text-sm leading-relaxed text-text-primary">
          <span className="font-medium">What you already said: </span>
          {item.note}
        </p>
      </div>
    </li>
  );
}

function EvidenceDashboard({
  mode,
  selectedCluster,
  selectedPattern,
  ideaStatement,
  ideaWhyMatters,
  workingClaim,
  proofItems,
}) {
  const groupName = selectedCluster?.name || "";
  const patternText =
    typeof selectedPattern?.text === "string" ? selectedPattern.text.trim() : "";

  return (
    <section className="space-y-5" aria-labelledby="argument-dashboard-heading">
      <div className="text-left">
        <h2
          id="argument-dashboard-heading"
          className="text-lg font-semibold text-text-primary md:text-xl"
        >
          {mode === "thesis"
            ? "Your working claim and supporting evidence."
            : "Your developing idea and supporting evidence."}
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-text-muted">
          {mode === "thesis"
            ? "You are sharpening this claim—not inventing a new argument."
            : "This is the idea you tested against your evidence. Now decide what point that evidence can help you prove."}
        </p>
      </div>

      {mode === "thesis" ? (
        <div className="rounded-xl border-2 border-theme-orange/45 bg-theme-orange/10 px-5 py-5 shadow-soft ring-1 ring-theme-orange/15">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-theme-orange">
            Your working claim
          </p>
          <p className="mt-2 text-base font-semibold leading-relaxed text-text-primary md:text-lg">
            {workingClaim || "Your claim will appear here."}
          </p>
        </div>
      ) : null}

      <div className="rounded-xl border-2 border-theme-orange/40 bg-theme-orange/[0.06] px-4 py-4 md:px-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-theme-orange">
          Your developing idea
        </p>
        {groupName || patternText ? (
          <div className="mt-2 flex flex-wrap gap-2 text-xs text-text-muted">
            {groupName ? (
              <span className="rounded-md border border-border-soft/70 bg-white/70 px-2 py-1">
                Group: {groupName}
              </span>
            ) : null}
            {patternText ? (
              <span className="rounded-md border border-border-soft/70 bg-white/70 px-2 py-1">
                Pattern: {patternText}
              </span>
            ) : null}
          </div>
        ) : null}
        <p className="mt-2 text-base leading-relaxed text-text-primary">
          {ideaStatement || "Your idea will appear here."}
        </p>
        {ideaWhyMatters ? (
          <p className="mt-3 text-sm leading-relaxed text-text-muted">
            <span className="font-medium text-text-primary">Why it matters: </span>
            {ideaWhyMatters}
          </p>
        ) : null}
      </div>

      <p className="text-center text-xs font-medium uppercase tracking-[0.16em] text-text-muted">
        ↓ supported, complicated, or sharpened by
      </p>

      {proofItems.length === 0 ? (
        <p
          role="status"
          className="rounded-xl border border-theme-orange/35 bg-theme-orange/10 px-4 py-3 text-sm text-text-primary"
        >
          Connect at least two quotations to your idea before building a claim.
        </p>
      ) : (
        <ol
          className={`gap-4 ${
            mode === "thesis"
              ? "space-y-4"
              : "grid grid-cols-1 md:grid-cols-2"
          }`}
        >
          {proofItems.map((item, index) => (
            <ProofItemCard
              key={`argument-proof-${item.id}`}
              item={item}
              index={index}
              compact={mode === "thesis"}
            />
          ))}
        </ol>
      )}
    </section>
  );
}

function AssignmentQuestionPanel({ assignmentPrompt = "", mode = "claim" }) {
  const prompt = typeof assignmentPrompt === "string" ? assignmentPrompt.trim() : "";
  if (!prompt) return null;

  return (
    <section
      className="space-y-4"
      aria-labelledby="assignment-question-heading"
    >
      <div className="rounded-xl border border-theme-dark/20 bg-surface-soft/60 px-4 py-4 md:px-5 md:py-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted">
          Return to the assignment question
        </p>
        <h2
          id="assignment-question-heading"
          className="mt-2 text-base font-semibold leading-snug text-text-primary md:text-lg"
        >
          Assignment question
        </h2>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-text-primary md:text-[0.95rem]">
          {prompt}
        </p>
        <p className="mt-3 text-sm leading-relaxed text-text-muted">
          {mode === "thesis"
            ? "Your thesis should still answer this question while preserving the supported point from your claim."
            : "Your claim should answer this question using the developing idea and evidence you built."}
        </p>
      </div>

      <nav aria-label="How your thinking connects" className="px-1">
        <ol className="flex flex-col gap-1 text-left text-xs leading-relaxed text-text-muted sm:text-sm">
          {ARGUMENT_THINKING_PATH.map((step, index) => (
            <li key={step} className="min-w-0">
              <span className="font-medium text-text-primary">{step}</span>
              {index < ARGUMENT_THINKING_PATH.length - 1 ? (
                <span className="mt-0.5 block text-text-muted" aria-hidden="true">
                  ↓
                </span>
              ) : null}
            </li>
          ))}
        </ol>
      </nav>
    </section>
  );
}

export default function ModuleThreeBuildArgumentStep({
  mode = "claim",
  assignmentPrompt = "",
  selectedCluster = null,
  selectedPattern = null,
  ideaStatement = "",
  ideaWhyMatters = "",
  selectedClusterEvidence = [],
  evidenceConnections = {},
  workingClaim = "",
  onWorkingClaimChange,
  thesisStatement = "",
  onThesisStatementChange,
  proofPlan = ["", "", ""],
  onProofPlanChange,
  progressCompleted = [],
  progressNext = "",
}) {
  const isThesis = mode === "thesis";

  const proofItems = useMemo(
    () =>
      buildArgumentProofItems({
        selectedClusterEvidence,
        evidenceConnections,
      }),
    [evidenceConnections, selectedClusterEvidence]
  );

  const claimPhase = getClaimPhase({
    workingClaim,
    existingSupportRationale: "",
    selectedClusterEvidence,
    evidenceConnections,
  });

  const thesisPhase = getThesisPhase({
    thesisStatement,
    proofPlan,
  });

  const teacherMessage = isThesis
    ? "You are sharpening your supported point—not inventing a new argument."
    : "Your evidence sets the limits of what you can honestly claim. Build from what you can see and explain.";

  const whatComesNext = isThesis
    ? "Next, the Writing Processor will carry your thesis and proof plan into the next stage of planning."
    : "Next, you’ll sharpen this supported point into the sentence that guides your essay.";

  return (
    <WorkspaceColumns className="gap-6 xl:gap-10">
      <WorkspaceSidebar className="opacity-90">
        <aside className="space-y-4 rounded-xl bg-surface-soft/60 px-4 py-4 text-left">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-text-muted">
            Where you are
          </p>
          <p className="text-sm leading-relaxed text-text-muted">
            {isThesis
              ? "You are turning a supported claim into the sentence that will guide your essay."
              : "You are reading across your evidence to decide what point it can prove."}
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
              {isThesis
                ? "Say your argument in one clear sentence."
                : "What point do these quotations help you prove?"}
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-text-muted md:text-base">
              {isThesis
                ? "You are not starting a new idea. You are sharpening the claim you already built into the sentence that will guide your essay."
                : "You already found a pattern, developed an idea, and explained how each quotation connects. Now use that work to state one point you can defend."}
            </p>
          </header>

          <AssignmentQuestionPanel
            assignmentPrompt={assignmentPrompt}
            mode={mode}
          />

          <EvidenceDashboard
            mode={mode}
            selectedCluster={selectedCluster}
            selectedPattern={selectedPattern}
            ideaStatement={ideaStatement}
            ideaWhyMatters={ideaWhyMatters}
            workingClaim={workingClaim}
            proofItems={proofItems}
          />

          <div className="rounded-xl border-2 border-theme-orange/40 bg-theme-orange/10 px-5 py-5 shadow-soft ring-1 ring-theme-orange/15">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-theme-orange">
              Your job right now
            </p>
            {isThesis ? (
              <>
                <p className="mt-2 text-base font-semibold leading-snug text-text-primary">
                  {THESIS_JOB_HEADLINE}
                </p>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-text-primary">
                  <li>The idea was your first interpretation.</li>
                  <li>The claim was the point your evidence could prove.</li>
                  <li>The thesis is the clear sentence that will guide the essay.</li>
                </ul>
                <ul className="mt-4 space-y-2 text-sm leading-relaxed text-text-muted">
                  {THESIS_LEADING_QUESTIONS.map((question) => (
                    <li key={question}>{question}</li>
                  ))}
                </ul>
              </>
            ) : (
              <>
                <p className="mt-2 text-base font-semibold leading-snug text-text-primary">
                  {CLAIM_JOB_HEADLINE}
                </p>
                <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-text-primary">
                  {CLAIM_JOB_STEPS.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
                <ul className="mt-4 space-y-2 text-sm leading-relaxed text-text-muted">
                  {CLAIM_LEADING_QUESTIONS.map((question) => (
                    <li key={question}>{question}</li>
                  ))}
                </ul>
              </>
            )}
          </div>

          {!isThesis ? (
            <section className="space-y-4" aria-labelledby="claim-response-heading">
              <div className="text-left">
                <h2
                  id="claim-response-heading"
                  className="text-lg font-semibold text-text-primary md:text-xl"
                >
                  {CLAIM_FIELD_INTRO}
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-text-muted">
                  {CLAIM_FIELD_REMINDER}
                </p>
              </div>

              <details className="rounded-xl border border-border-soft/70 bg-surface-soft/30 px-4 py-3">
                <summary className="cursor-pointer text-sm font-medium text-text-primary">
                  Optional sentence starters
                </summary>
                <ul className="mt-3 space-y-2 text-sm leading-relaxed text-text-muted">
                  {CLAIM_SENTENCE_STARTERS.map((starter) => (
                    <li key={starter}>{starter}</li>
                  ))}
                </ul>
                <p className="mt-2 text-xs text-text-muted">
                  These help thinking. They do not write the claim for you.
                </p>
              </details>

              <label className="block text-left">
                <span className="mb-2 block text-base font-medium text-text-primary">
                  Write the point your evidence can help you prove.
                </span>
                <textarea
                  value={workingClaim}
                  onChange={(event) => onWorkingClaimChange?.(event.target.value)}
                  placeholder="State one clear point you can defend"
                  className={ANSWER_TEXTAREA_CLASS}
                />
              </label>

              {claimPhase.showSelfCheck ? (
                <div className="rounded-xl border border-theme-green/30 bg-theme-green/[0.06] px-4 py-4 text-left">
                  <p className="text-sm font-semibold text-text-primary">Quick self-check</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-text-muted">
                    {CLAIM_SELF_CHECK_ITEMS.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </section>
          ) : (
            <section className="space-y-4" aria-labelledby="thesis-response-heading">
              <div className="text-left">
                <h2
                  id="thesis-response-heading"
                  className="text-lg font-semibold text-text-primary md:text-xl"
                >
                  Write your thesis in one clear sentence.
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-text-muted">
                  Start from your working claim. Make sure the sentence still answers the
                  assignment question.
                </p>
              </div>

              <label className="block text-left">
                <span className="mb-2 block text-base font-medium text-text-primary">
                  Your thesis sentence
                </span>
                <textarea
                  value={thesisStatement}
                  onChange={(event) => onThesisStatementChange?.(event.target.value)}
                  placeholder="One sentence that states your argument"
                  className={ANSWER_TEXTAREA_CLASS}
                />
              </label>

              {thesisPhase.showProofPlan ? (
                <div className="space-y-4 border-t border-border-soft/60 pt-6">
                  <div className="text-left">
                    <h3 className="text-base font-semibold text-text-primary md:text-lg">
                      What will your essay need to show?
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-text-muted">
                      Add at least {PROOF_PLAN_MINIMUM} proof-plan step
                      {PROOF_PLAN_MINIMUM === 1 ? "" : "s"} so you know what the essay must
                      show. You may use up to three.
                    </p>
                  </div>

                  {(Array.isArray(proofPlan) ? proofPlan : ["", "", ""]).map(
                    (line, index) => (
                      <label
                        key={`proof-plan-${index}`}
                        className="block text-left"
                      >
                        <span className="mb-2 block text-sm font-medium text-text-primary">
                          {PROOF_PLAN_LABELS[index] || `Part ${index + 1}`}
                        </span>
                        <textarea
                          value={line}
                          onChange={(event) =>
                            onProofPlanChange?.(index, event.target.value)
                          }
                          placeholder="One thing your essay will need to explain"
                          className={QUIET_TEXTAREA_CLASS}
                        />
                      </label>
                    )
                  )}
                </div>
              ) : null}
            </section>
          )}

          <details className="rounded-xl border border-border-soft/70 bg-surface-soft/30 px-4 py-3">
            <summary className="cursor-pointer text-sm font-medium text-text-primary">
              Need Help
            </summary>
            <div className="mt-3 space-y-4 text-sm leading-relaxed text-text-muted">
              {isThesis ? (
                <>
                  <div>
                    <p className="font-medium text-text-primary">
                      What is the difference between a claim and a thesis?
                    </p>
                    <p className="mt-1">
                      The claim is the point your evidence can prove. The thesis is that
                      point written as the clear sentence that will guide your essay.
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-text-primary">
                      Does a thesis have to use the words ethos, pathos, or logos?
                    </p>
                    <p className="mt-1">
                      No. Name the rhetorical work only when it helps your point. Focus on
                      what you can actually prove with your quotations.
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-text-primary">
                      How does the proof plan help?
                    </p>
                    <p className="mt-1">
                      It names what the essay must show so your thesis does not float free
                      of evidence.
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-text-primary">
                      What if my thesis still feels awkward?
                    </p>
                    <p className="mt-1">
                      Keep the claim’s meaning and revise the wording. Clarity matters more
                      than polish right now.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <p className="font-medium text-text-primary">
                      What is the difference between an idea and a claim?
                    </p>
                    <p className="mt-1">
                      An idea is your early interpretation. A claim is the point you are
                      ready to defend with the evidence you already connected.
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-text-primary">
                      What if my two quotations do not point to exactly the same
                      conclusion?
                    </p>
                    <p className="mt-1">
                      Look for the shared point they can support together. A claim can
                      include how the quotations complicate or sharpen each other.
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-text-primary">
                      How specific should my claim be?
                    </p>
                    <p className="mt-1">
                      Specific enough that someone could disagree with it, and specific
                      enough that your displayed quotations could help prove it.
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-text-primary">
                      Can a claim change later?
                    </p>
                    <p className="mt-1">
                      Yes. Writers revise claims when evidence teaches them something new.
                      Start with the strongest honest point you can see now.
                    </p>
                  </div>
                </>
              )}
            </div>
          </details>

          <section className="rounded-xl border border-border-soft/70 bg-surface-soft/40 px-4 py-4 text-left">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-text-muted">
              What comes next
            </p>
            <p className="mt-2 text-sm leading-relaxed text-text-primary">{whatComesNext}</p>
          </section>
        </div>
      </WorkspaceCenter>

      <WorkspaceGuide>
        <aside className="space-y-3 rounded-xl border border-border-soft/70 bg-surface-soft/50 px-4 py-4 text-left">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-text-muted">
            Teacher note
          </p>
          <p className="text-sm leading-relaxed text-text-muted">{teacherMessage}</p>
        </aside>
      </WorkspaceGuide>
    </WorkspaceColumns>
  );
}
