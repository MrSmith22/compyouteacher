"use client";

import { useMemo, useState } from "react";
import Button from "@/components/ui/Button";
import ModuleThreeEvidenceCard from "@/components/module3/ModuleThreeEvidenceCard";
import WorkspaceCenter from "@/components/layout/WorkspaceCenter";
import WorkspaceColumns from "@/components/layout/WorkspaceColumns";
import WorkspaceGuide from "@/components/layout/WorkspaceGuide";
import WorkspaceSidebar from "@/components/layout/WorkspaceSidebar";
import {
  CONNECTION_OPTIONS,
  STRATEGY_OPTIONS,
  PATTERNS_NO_LENS_COACHING,
  getActivePatternCoaching,
  getChosenObservationLinkFeedback,
  getNoticePatternsPhase,
} from "@/lib/module3/noticePatternsHelpers";
import { getQuotationSituationFooter } from "@/lib/shared/rhetoricalSituationHelpers";
import ModuleThreePromptCompass from "@/components/module3/ModuleThreePromptCompass";
import {
  PATTERNS_COMPASS_FOCUS_ID,
  PATTERNS_COMPASS_FRAMING_LINE,
} from "@/lib/module3/promptCompassHelpers";
import RhetoricalSituationGuide from "@/components/shared/RhetoricalSituationGuide";

const ANSWER_TEXTAREA_CLASS =
  "min-h-[120px] w-full rounded-xl border-2 border-theme-dark/20 bg-white p-4 text-base leading-relaxed text-text-primary shadow-sm placeholder:text-text-muted/60 focus:border-theme-dark/35 focus:outline-none focus:ring-4 focus:ring-theme-dark/[0.06]";

const SENTENCE_STARTERS = [
  "Both quotations show that…",
  "King returns to the idea that…",
  "In both quotations, King uses…",
  "The speech’s audience might…, while the letter’s readers might…",
  "One important contrast is…",
];

function safeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function ObservationCard({
  title,
  notice,
  placeholder,
  starterHint,
  selectedClusterEvidence,
  isSelected,
  showChoose,
  linkFeedback = null,
  onTextChange,
  onToggleEvidence,
  onSelect,
}) {
  return (
    <div
      className={`rounded-xl border-2 p-4 md:p-5 ${
        isSelected
          ? "border-theme-orange/40 bg-theme-orange/[0.06] ring-1 ring-theme-orange/20"
          : "border-border-soft/80 bg-white"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="text-left text-base font-semibold text-text-primary">{title}</p>
        {showChoose ? (
          <Button
            type="button"
            onClick={onSelect}
            variant={isSelected ? "secondary" : "primary"}
            size="sm"
          >
            {isSelected ? "Chosen" : "Choose this observation"}
          </Button>
        ) : null}
      </div>

      {starterHint ? (
        <p className="mt-2 text-sm leading-relaxed text-text-muted">
          You might begin with: <span className="text-text-primary">{starterHint}</span>
        </p>
      ) : null}

      <textarea
        value={notice?.text || ""}
        onChange={(event) => onTextChange?.(event.target.value)}
        placeholder={placeholder}
        className={`mt-3 ${ANSWER_TEXTAREA_CLASS}`}
      />

      <div className="mt-4 space-y-2 text-left">
        <p className="text-sm font-medium text-text-primary">
          Which quotations helped you see this?
        </p>
        <p className="text-xs text-text-muted">
          Connect at least two quotations from this group.
        </p>
        <div className="grid gap-2 md:grid-cols-2">
          {selectedClusterEvidence.map((evidence) => (
            <label
              key={`${notice.id}-${evidence.id}`}
              className="flex items-start gap-2 rounded-lg border border-border-soft/70 bg-surface-soft/60 p-3 text-sm"
            >
              <input
                type="checkbox"
                checked={(notice.evidenceIds || []).includes(evidence.id)}
                onChange={() => onToggleEvidence?.(evidence.id)}
                className="mt-1 accent-theme-green"
              />
              <span>
                <span className="block font-medium text-text-primary">
                  {evidence.sourceLabel}
                </span>
                <span className="block text-text-muted">
                  {evidence.quote
                    ? evidence.quote.length > 70
                      ? `${evidence.quote.slice(0, 70)}...`
                      : evidence.quote
                    : evidence.observation || "Saved note"}
                </span>
              </span>
            </label>
          ))}
        </div>

        {isSelected && linkFeedback ? (
          <p
            role="status"
            aria-live="polite"
            className={`mt-3 rounded-lg border px-3 py-2 text-sm leading-relaxed ${
              linkFeedback.tone === "ready"
                ? "border-theme-green/35 bg-theme-green/10 text-text-primary"
                : "border-theme-orange/35 bg-theme-orange/10 text-text-primary"
            }`}
          >
            {linkFeedback.message}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export default function ModuleThreeNoticePatternsStep({
  selectedCluster = null,
  selectedClusterEvidence = [],
  patternNotices = [],
  selectedPatternId = "",
  onUpdateNotice,
  onToggleEvidence,
  onSelectPattern,
  assignmentPrompt = "",
  assignmentSources = null,
  progressCompleted = [],
  progressNext = "",
}) {
  const [connectionChoice, setConnectionChoice] = useState("");
  const [strategyChoice, setStrategyChoice] = useState("");

  const firstNotice = patternNotices[0] || null;
  const secondNotice = patternNotices[1] || null;

  const filledObservationCount = useMemo(
    () => patternNotices.filter((notice) => safeText(notice.text)).length,
    [patternNotices]
  );

  const phase = getNoticePatternsPhase({
    connectionChoice,
    strategyChoice,
    firstObservationText: firstNotice?.text || "",
    secondObservationText: secondNotice?.text || "",
    filledObservationCount,
  });

  const coaching = getActivePatternCoaching({
    connectionChoice,
    strategyChoice,
  });

  const groupEvidenceIds = useMemo(
    () =>
      selectedCluster?.evidenceIds ||
      selectedClusterEvidence.map((evidence) => evidence.id),
    [selectedCluster, selectedClusterEvidence]
  );

  const chosenNotice = useMemo(
    () => patternNotices.find((notice) => notice.id === selectedPatternId) || null,
    [patternNotices, selectedPatternId]
  );

  const chosenLinkFeedback = useMemo(() => {
    if (!chosenNotice || !safeText(chosenNotice.text)) {
      return null;
    }
    return getChosenObservationLinkFeedback({
      selectedPattern: chosenNotice,
      groupEvidenceIds,
      quoteMinimum: 2,
    });
  }, [chosenNotice, groupEvidenceIds]);

  const groupName = selectedCluster?.name || "Your group";

  return (
    <WorkspaceColumns className="gap-6 xl:gap-10">
      <WorkspaceSidebar className="opacity-90">
        <aside className="space-y-4 rounded-xl bg-surface-soft/60 px-4 py-4 text-left">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-text-muted">
            Where you are
          </p>
          <p className="text-sm leading-relaxed text-text-muted">
            You already made a group. Now look inside it and notice what connects the
            quotations.
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
              What do these quotations seem to have in common?
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-text-muted md:text-base">
              First you put related quotations into a group. Now look inside that group and
              notice what the quotations share, repeat, contrast, or accomplish. An
              observation is something you notice—not a finished claim or thesis yet.
            </p>
          </header>

          <ModuleThreePromptCompass
            assignmentPrompt={assignmentPrompt}
            focusQuestionId={PATTERNS_COMPASS_FOCUS_ID}
            framingLine={PATTERNS_COMPASS_FRAMING_LINE}
          />

          <section
            className="space-y-4"
            aria-labelledby="patterns-selected-quotes-heading"
          >
            <div className="text-left">
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-text-primary">
                Selected quotations
              </p>
              <h2
                id="patterns-selected-quotes-heading"
                className="mt-1.5 text-lg font-semibold text-text-primary md:text-xl"
              >
                Look closely at the quotations you placed in this group.
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-text-muted">
                Group: <span className="font-medium text-text-primary">{groupName}</span>
              </p>
              <p className="mt-2 text-sm leading-relaxed text-text-primary">
                You chose these quotations because they seemed connected. Now let&apos;s
                figure out what connects them.
              </p>
            </div>

            {selectedClusterEvidence.length === 0 ? (
              <p className="rounded-xl border border-theme-orange/30 bg-theme-orange/10 px-4 py-3 text-sm text-text-primary">
                Go back and choose a saved group with at least two quotations before noticing
                a pattern.
              </p>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {selectedClusterEvidence.map((evidence) => {
                  const sourceDefinition =
                    assignmentSources?.[evidence.sourceType] || null;
                  const situationFooter = sourceDefinition
                    ? getQuotationSituationFooter(sourceDefinition)
                    : null;
                  return (
                    <ModuleThreeEvidenceCard
                      key={`pattern-selected-${evidence.id}`}
                      evidence={evidence}
                      grouping
                      showArtifactLabel={false}
                      situationFooter={situationFooter}
                    />
                  );
                })}
              </div>
            )}
          </section>

          <div className="rounded-xl border-2 border-theme-orange/40 bg-theme-orange/10 px-5 py-5 shadow-soft ring-1 ring-theme-orange/15">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-theme-orange">
              Your job right now
            </p>
            <p className="mt-2 text-base font-semibold leading-snug text-text-primary">
              Notice what these quotations have in common.
            </p>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-text-primary">
              <li>Read the selected quotations together.</li>
              <li>Notice something they repeat, share, contrast, or accomplish.</li>
              <li>Write at least two possible observations.</li>
              <li>Choose the observation that seems most useful to explore.</li>
            </ol>
          </div>

          {/* Phase 1 — Guided noticing */}
          <section className="space-y-4" aria-labelledby="patterns-guide-heading">
            <div className="text-left">
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-text-primary">
                Guided noticing
              </p>
              <h2
                id="patterns-guide-heading"
                className="mt-1.5 text-lg font-semibold text-text-primary md:text-xl"
              >
                What kind of connection do you notice?
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-text-muted">
                These choices help you look. They are not your final answer. You will still
                write the observation in your own words.
              </p>
            </div>

            <div className="grid gap-2">
              {CONNECTION_OPTIONS.map((option) => {
                const selected = connectionChoice === option.id;
                return (
                  <label
                    key={option.id}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 px-4 py-3 text-left transition-colors ${
                      selected
                        ? "border-theme-blue/40 bg-theme-blue/[0.07]"
                        : "border-border-soft/80 bg-white hover:border-theme-blue/20"
                    }`}
                  >
                    <input
                      type="radio"
                      name="pattern-connection"
                      className="mt-1 accent-theme-blue"
                      checked={selected}
                      onChange={() => {
                        setConnectionChoice(option.id);
                        if (!option.needsStrategyFollowUp) {
                          setStrategyChoice("");
                        }
                      }}
                    />
                    <span className="text-sm leading-relaxed text-text-primary">
                      {option.label}
                    </span>
                  </label>
                );
              })}
            </div>
          </section>

          {phase.awaitingStrategy ? (
            <section className="space-y-4" aria-labelledby="patterns-strategy-heading">
              <div className="text-left">
                <h2
                  id="patterns-strategy-heading"
                  className="text-lg font-semibold text-text-primary md:text-xl"
                >
                  Which rhetorical appeal appears in these quotations?
                </h2>
              </div>
              <div className="grid gap-2">
                {STRATEGY_OPTIONS.map((option) => {
                  const selected = strategyChoice === option.id;
                  return (
                    <label
                      key={option.id}
                      className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 px-4 py-3 text-left transition-colors ${
                        selected
                          ? "border-theme-blue/40 bg-theme-blue/[0.07]"
                          : "border-border-soft/80 bg-white hover:border-theme-blue/20"
                      }`}
                    >
                      <input
                        type="radio"
                        name="pattern-strategy"
                        className="mt-1 accent-theme-blue"
                        checked={selected}
                        onChange={() => setStrategyChoice(option.id)}
                      />
                      <span className="text-sm leading-relaxed text-text-primary">
                        {option.label}
                      </span>
                    </label>
                  );
                })}
              </div>
            </section>
          ) : null}

          {phase.showFirstObservation ? (
            <section className="space-y-4" aria-labelledby="patterns-write-heading">
              <div className="text-left">
                <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-text-primary">
                  Student observations
                </p>
                <h2
                  id="patterns-write-heading"
                  className="mt-1.5 text-lg font-semibold text-text-primary md:text-xl"
                >
                  Write what you notice.
                </h2>
                {coaching.coachingSteps?.length > 0 ? (
                  <ol className="mt-2 list-decimal space-y-1.5 rounded-lg bg-surface-soft/70 px-4 py-3 pl-9 text-sm leading-relaxed text-text-primary">
                    {coaching.coachingSteps.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ol>
                ) : coaching.coaching ? (
                  <p className="mt-2 rounded-lg bg-surface-soft/70 px-4 py-3 text-sm leading-relaxed text-text-primary">
                    {coaching.coaching}
                  </p>
                ) : null}
              </div>

              {firstNotice ? (
                <ObservationCard
                  title="Observation 1"
                  notice={firstNotice}
                  placeholder="What repeats, contrasts, or builds across these quotations?"
                  starterHint={coaching.starter}
                  selectedClusterEvidence={selectedClusterEvidence}
                  isSelected={selectedPatternId === firstNotice.id}
                  showChoose={phase.showChooseObservation}
                  linkFeedback={
                    selectedPatternId === firstNotice.id ? chosenLinkFeedback : null
                  }
                  onTextChange={(value) => onUpdateNotice?.(firstNotice.id, { text: value })}
                  onToggleEvidence={(evidenceId) =>
                    onToggleEvidence?.(firstNotice.id, evidenceId)
                  }
                  onSelect={() => onSelectPattern?.(firstNotice.id)}
                />
              ) : null}

              {phase.showSecondObservation && secondNotice ? (
                <ObservationCard
                  title="Observation 2"
                  notice={secondNotice}
                  placeholder="Write another possible observation about the same group."
                  starterHint={
                    coaching.starter
                      ? "Try a different angle, even if you use a similar starter."
                      : ""
                  }
                  selectedClusterEvidence={selectedClusterEvidence}
                  isSelected={selectedPatternId === secondNotice.id}
                  showChoose={phase.showChooseObservation}
                  linkFeedback={
                    selectedPatternId === secondNotice.id ? chosenLinkFeedback : null
                  }
                  onTextChange={(value) =>
                    onUpdateNotice?.(secondNotice.id, { text: value })
                  }
                  onToggleEvidence={(evidenceId) =>
                    onToggleEvidence?.(secondNotice.id, evidenceId)
                  }
                  onSelect={() => onSelectPattern?.(secondNotice.id)}
                />
              ) : phase.showFirstObservation && !phase.showSecondObservation ? (
                <p className="rounded-lg bg-surface-soft/50 px-4 py-3 text-sm text-text-muted">
                  After you write your first observation, a second observation field will
                  appear.
                </p>
              ) : null}

              {phase.showChooseObservation ? (
                <div className="rounded-xl border border-theme-blue/25 bg-theme-blue/[0.04] px-4 py-4">
                  <p className="text-base font-semibold text-text-primary">
                    Choose the strongest observation.
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-text-muted">
                    Pick the observation that seems most useful to explore next. Make sure it
                    is connected to at least two quotations.
                  </p>
                  {chosenLinkFeedback ? (
                    <p
                      role="status"
                      aria-live="polite"
                      className={`mt-3 rounded-lg border px-3 py-2 text-sm leading-relaxed ${
                        chosenLinkFeedback.tone === "ready"
                          ? "border-theme-green/35 bg-theme-green/10 text-text-primary"
                          : "border-theme-orange/35 bg-theme-orange/10 text-text-primary"
                      }`}
                    >
                      {chosenLinkFeedback.message}
                    </p>
                  ) : (
                    <p
                      role="status"
                      aria-live="polite"
                      className="mt-3 rounded-lg border border-theme-orange/35 bg-theme-orange/10 px-3 py-2 text-sm leading-relaxed text-text-primary"
                    >
                      Choose the observation you want to explore.
                    </p>
                  )}
                </div>
              ) : null}

              {patternNotices.length > 2
                ? patternNotices.slice(2).map((notice, index) => (
                    <ObservationCard
                      key={notice.id}
                      title={`Observation ${index + 3}`}
                      notice={notice}
                      placeholder="Another possible observation"
                      starterHint=""
                      selectedClusterEvidence={selectedClusterEvidence}
                      isSelected={selectedPatternId === notice.id}
                      showChoose={phase.showChooseObservation}
                      linkFeedback={
                        selectedPatternId === notice.id ? chosenLinkFeedback : null
                      }
                      onTextChange={(value) =>
                        onUpdateNotice?.(notice.id, { text: value })
                      }
                      onToggleEvidence={(evidenceId) =>
                        onToggleEvidence?.(notice.id, evidenceId)
                      }
                      onSelect={() => onSelectPattern?.(notice.id)}
                    />
                  ))
                : null}
            </section>
          ) : !phase.awaitingStrategy ? (
            <p className="rounded-lg bg-surface-soft/50 px-4 py-3 text-sm text-text-muted">
              {PATTERNS_NO_LENS_COACHING}
            </p>
          ) : null}

          <details className="rounded-xl border border-border-soft/70 bg-surface-soft/30 px-4 py-3 md:px-5">
            <summary className="cursor-pointer list-none text-sm font-medium text-theme-blue">
              Need Help
            </summary>
            <div className="mt-3 space-y-4 border-t border-border-soft/60 pt-3 text-sm leading-relaxed text-text-muted">
              <div>
                <p className="font-medium text-text-primary">Short example</p>
                <p className="mt-1">
                  Sample quotation A says waiting for justice harms people. Sample quotation B
                  says injustice affects everyone. One observation could be: both quotations
                  show that delay and unfairness cause real damage. That is a notice—not a
                  thesis yet.
                </p>
              </div>
              <div>
                <p className="font-medium text-text-primary">Sentence starters</p>
                <ul className="mt-1 list-disc space-y-1 pl-5">
                  {SENTENCE_STARTERS.map((starter) => (
                    <li key={starter}>{starter}</li>
                  ))}
                </ul>
              </div>
              {assignmentSources ? (
                <details className="rounded-lg bg-white/80 px-3 py-2">
                  <summary className="cursor-pointer text-sm font-medium text-text-primary">
                    Remind me who King was addressing in each work.
                  </summary>
                  <div className="mt-2 border-t border-border-soft/60 pt-2">
                    <RhetoricalSituationGuide
                      mode="compact"
                      sources={assignmentSources}
                    />
                  </div>
                </details>
              ) : null}
              <p>
                More than one reasonable observation may exist. Choose the one that feels most
                useful to explore.
              </p>
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
              A pattern is something you notice across the whole group—not just a topic word.
              Keep your language simple and honest.
            </p>
          </div>
          <div className="space-y-2 border-t border-border-soft/60 pt-4">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-text-muted">
              What comes next
            </p>
            <p className="text-sm leading-relaxed text-text-muted">
              After you choose an observation, you will ask what that pattern might mean.
            </p>
          </div>
        </aside>
      </WorkspaceGuide>
    </WorkspaceColumns>
  );
}
