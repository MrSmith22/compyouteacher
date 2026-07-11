"use client";

import { useMemo, useState } from "react";
import Button from "@/components/ui/Button";
import ModuleThreeEvidenceCard from "@/components/module3/ModuleThreeEvidenceCard";
import ModuleThreePromptCompass from "@/components/module3/ModuleThreePromptCompass";
import WorkspaceCenter from "@/components/layout/WorkspaceCenter";
import WorkspaceColumns from "@/components/layout/WorkspaceColumns";
import WorkspaceGuide from "@/components/layout/WorkspaceGuide";
import WorkspaceSidebar from "@/components/layout/WorkspaceSidebar";
import {
  CONNECT_BLOCKED_CHOOSE_RELATION,
  CONNECT_BLOCKED_DOES_NOT_FIT,
  CONNECT_BLOCKED_WRITE_NOTE,
  CONNECT_CROSS_REVIEW_HEADING,
  CONNECT_CROSS_REVIEW_QUESTIONS,
  CONNECT_MINIMUM,
  CONNECT_READY_COMPARISON_PROMPT,
  CONNECT_READY_MESSAGE,
  CONNECT_SENTENCE_STARTERS,
  RELATION_CHOICES,
  buildCrossConnectionReview,
  getConnectCoachingLines,
  getConnectContinueHint,
  getConnectEvidencePhase,
  getConnectWorkingEvidence,
  getRelationChoice,
  inferUiChoiceFromConnection,
  isValidExplainedConnection,
  mapRelationChoiceToConnectionPatch,
} from "@/lib/module3/connectEvidenceHelpers";
import {
  CONNECT_COMPASS_FOCUS_ID,
  CONNECT_COMPASS_FRAMING_LINE,
} from "@/lib/module3/promptCompassHelpers";
import { getAppealChipLabel } from "@/lib/module3/reviewEvidenceHelpers";
import { getQuotationSituationFooter } from "@/lib/shared/rhetoricalSituationHelpers";

const ANSWER_TEXTAREA_CLASS =
  "min-h-[120px] w-full rounded-xl border-2 border-theme-dark/20 bg-white p-4 text-base leading-relaxed text-text-primary shadow-sm placeholder:text-text-muted/60 focus:border-theme-dark/35 focus:outline-none focus:ring-4 focus:ring-theme-dark/[0.06]";

function safeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function sourceAccentClass(sourceType) {
  if (sourceType === "letter") {
    return "border-l-[3px] border-l-theme-orange";
  }
  return "border-l-[3px] border-l-theme-blue";
}

function ConnectionReviewCard({
  item,
  ideaStatement,
  assignmentSources,
  editing,
  uiChoice,
  onEdit,
  onChooseRelation,
  onNoteChange,
  connection,
}) {
  const evidence = item.evidence;
  const sourceDefinition = assignmentSources?.[evidence.sourceType] || null;
  const situationFooter = sourceDefinition
    ? getQuotationSituationFooter(sourceDefinition)
    : null;
  const appealChip = getAppealChipLabel(evidence.tags);

  return (
    <article
      className={`min-w-0 rounded-xl border border-border-soft/80 bg-white px-4 py-4 ${sourceAccentClass(
        evidence.sourceType
      )}`}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted">
        {evidence.sourceLabel || evidence.sourceType} connection
      </p>
      <ModuleThreeEvidenceCard
        evidence={evidence}
        grouping
        showArtifactLabel={false}
        appealChip={appealChip}
        situationFooter={situationFooter}
      />
      <div className="mt-3 space-y-2 border-t border-border-soft/60 pt-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-theme-blue">
          {item.relationLabel}
        </p>
        <p className="text-sm leading-relaxed text-text-primary">{item.note}</p>
      </div>
      <Button
        type="button"
        variant="tertiary"
        size="sm"
        className="mt-3"
        onClick={onEdit}
      >
        {editing ? "Done editing" : "Edit this connection"}
      </Button>

      {editing ? (
        <div className="mt-4">
          <QuotationConnectionTask
            title="Edit connection"
            ideaStatement={ideaStatement}
            evidence={evidence}
            connection={connection}
            uiChoice={uiChoice}
            assignmentSources={assignmentSources}
            coachingLines={getConnectCoachingLines({
              sourceType: evidence.sourceType,
              uiChoiceId: uiChoice,
            })}
            onChooseRelation={onChooseRelation}
            onNoteChange={onNoteChange}
          />
        </div>
      ) : null}
    </article>
  );
}

function QuotationConnectionTask({
  title,
  ideaStatement,
  evidence,
  connection,
  uiChoice,
  showModel = false,
  assignmentSources = null,
  coachingLines = [],
  otherConnectionComplete = false,
  onChooseRelation,
  onNoteChange,
}) {
  const choice = getRelationChoice(uiChoice);
  const showNoteField = Boolean(choice?.countsTowardProgress);
  const sourceDefinition = assignmentSources?.[evidence?.sourceType] || null;
  const situationFooter = sourceDefinition
    ? getQuotationSituationFooter(sourceDefinition)
    : null;
  const appealChip = getAppealChipLabel(evidence?.tags);

  return (
    <section className="space-y-4 rounded-xl border-2 border-theme-orange/30 bg-white p-4 shadow-soft md:p-5">
      <div className="text-left">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-theme-orange">
          {title}
        </p>
        <h2 className="mt-1.5 text-lg font-semibold text-text-primary md:text-xl">
          How does this quotation relate to your idea?
        </h2>
        <p className="mt-1 text-sm text-text-muted">
          You are examining the{" "}
          <span className="font-medium text-text-primary">
            {evidence?.sourceLabel || evidence?.sourceType || "quotation"}
          </span>{" "}
          {otherConnectionComplete
            ? "— compare what it contributes with your other connection."
            : "— one connection at a time."}
        </p>
      </div>

      <div className="rounded-xl border-2 border-theme-orange/25 bg-theme-orange/[0.06] px-4 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-theme-orange">
          Your developing idea
        </p>
        <p className="mt-2 text-sm leading-relaxed text-text-primary">
          {ideaStatement || "Your idea will appear here."}
        </p>
      </div>

      <ModuleThreeEvidenceCard
        evidence={evidence}
        grouping
        showArtifactLabel={false}
        appealChip={appealChip}
        situationFooter={situationFooter}
      />

      {showModel ? (
        <div className="rounded-lg border border-border-soft/70 bg-surface-soft/60 px-4 py-3 text-sm leading-relaxed text-text-muted">
          <p className="font-medium text-text-primary">Before you write</p>
          <p className="mt-2">
            <span className="font-semibold text-text-primary">Summary:</span> tells what the
            quotation says.
          </p>
          <p className="mt-1">
            <span className="font-semibold text-text-primary">Restatement:</span> repeats your
            idea.
          </p>
          <p className="mt-1">
            <span className="font-semibold text-text-primary">Explanation:</span> shows how a
            specific part of the quotation helps your idea.
          </p>
        </div>
      ) : null}

      <div className="space-y-2">
        <p className="text-sm font-medium text-text-primary">
          How does this quotation relate to your idea?
        </p>
        <div className="grid gap-2">
          {RELATION_CHOICES.map((option) => {
            const selected = uiChoice === option.id;
            return (
              <label
                key={option.id}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 px-4 py-3 text-left ${
                  selected
                    ? "border-theme-blue/40 bg-theme-blue/[0.07]"
                    : "border-border-soft/80 bg-surface-soft/40 hover:border-theme-blue/20"
                }`}
              >
                <input
                  type="radio"
                  name={`relation-${evidence.id}`}
                  className="mt-1 accent-theme-blue"
                  checked={selected}
                  onChange={() => onChooseRelation?.(option.id)}
                />
                <span className="text-sm leading-relaxed text-text-primary">
                  {option.label}
                </span>
              </label>
            );
          })}
        </div>
        {!uiChoice ? (
          <p
            role="status"
            aria-live="polite"
            className="rounded-lg border border-theme-orange/35 bg-theme-orange/10 px-3 py-2 text-sm leading-relaxed text-text-primary"
          >
            {CONNECT_BLOCKED_CHOOSE_RELATION}
          </p>
        ) : null}
      </div>

      {coachingLines.length > 0 ? (
        <div className="rounded-lg bg-surface-soft/70 px-4 py-3 text-sm leading-relaxed text-text-primary">
          <p className="font-medium text-text-primary">Questions to help you explain</p>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-text-muted">
            {coachingLines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {choice?.id === "does_not_fit" ? (
        <p
          role="status"
          aria-live="polite"
          className="rounded-lg border border-theme-orange/35 bg-theme-orange/10 px-3 py-2 text-sm text-text-primary"
        >
          {CONNECT_BLOCKED_DOES_NOT_FIT}
        </p>
      ) : null}

      {choice?.id === "unsure" ? (
        <p
          role="status"
          aria-live="polite"
          className="rounded-lg border border-theme-orange/35 bg-theme-orange/10 px-3 py-2 text-sm text-text-primary"
        >
          After comparing, choose Supports, Complicates, or Sharpens so you can write a
          clear connection.
        </p>
      ) : null}

      {showNoteField ? (
        <label className="block text-left">
          <span className="mb-2 block text-base font-medium text-text-primary">
            Explain the connection in your own words.
          </span>
          <textarea
            value={connection?.note || ""}
            onChange={(event) => onNoteChange?.(event.target.value)}
            placeholder="Show how a specific part of the quotation helps your idea"
            className={ANSWER_TEXTAREA_CLASS}
          />
          <details className="mt-2">
            <summary className="cursor-pointer text-xs font-medium text-text-muted">
              Optional sentence starters
            </summary>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-text-muted">
              {CONNECT_SENTENCE_STARTERS.map((starter) => (
                <li key={starter}>{starter}</li>
              ))}
            </ul>
          </details>
          {!safeText(connection?.note) ? (
            <p
              role="status"
              aria-live="polite"
              className="mt-2 rounded-lg border border-theme-orange/35 bg-theme-orange/10 px-3 py-2 text-sm text-text-primary"
            >
              {CONNECT_BLOCKED_WRITE_NOTE}
            </p>
          ) : (
            <p
              role="status"
              aria-live="polite"
              className="mt-2 rounded-lg border border-theme-green/35 bg-theme-green/10 px-3 py-2 text-sm text-text-primary"
            >
              Connection saved for this quotation.
            </p>
          )}
        </label>
      ) : null}
    </section>
  );
}

export default function ModuleThreeConnectEvidenceStep({
  selectedCluster = null,
  selectedPattern = null,
  selectedPatternEvidence = [],
  selectedClusterEvidence = [],
  ideaStatement = "",
  evidenceConnections = {},
  onUpdateConnection,
  progressCompleted = [],
  progressNext = "",
  assignmentPrompt = "",
  assignmentSources = null,
}) {
  const [uiChoices, setUiChoices] = useState({});
  const [extraEvidenceIds, setExtraEvidenceIds] = useState([]);
  const [editingEvidenceId, setEditingEvidenceId] = useState("");

  const baseWorking = useMemo(
    () =>
      getConnectWorkingEvidence({
        selectedPatternEvidence,
        selectedClusterEvidence,
      }),
    [selectedPatternEvidence, selectedClusterEvidence]
  );

  const workingEvidence = useMemo(() => {
    const byId = new Map(
      (selectedClusterEvidence || []).map((item) => [item.id, item])
    );
    const merged = [...baseWorking.workingEvidence];
    for (const id of extraEvidenceIds) {
      if (merged.some((item) => item.id === id)) continue;
      const evidence = byId.get(id);
      if (evidence) merged.push(evidence);
    }
    return merged;
  }, [baseWorking.workingEvidence, extraEvidenceIds, selectedClusterEvidence]);

  const availableToAdd = useMemo(() => {
    const workingIds = new Set(workingEvidence.map((item) => item.id));
    return (selectedClusterEvidence || []).filter(
      (item) => !workingIds.has(item.id)
    );
  }, [selectedClusterEvidence, workingEvidence]);

  const phase = getConnectEvidencePhase({
    workingEvidence,
    evidenceConnections,
    minimum: CONNECT_MINIMUM,
  });

  const activeEvidence =
    phase.activeIndex >= 0 ? workingEvidence[phase.activeIndex] : null;

  const getUiChoice = (evidenceId) => {
    if (uiChoices[evidenceId]) return uiChoices[evidenceId];
    return inferUiChoiceFromConnection(evidenceConnections[evidenceId]);
  };

  const activeUiChoice = activeEvidence ? getUiChoice(activeEvidence.id) : "";

  const continueHint = getConnectContinueHint({
    workingEvidence,
    evidenceConnections,
    activeEvidenceId: activeEvidence?.id || "",
    activeUiChoice,
    minimum: CONNECT_MINIMUM,
  });

  const crossReview = buildCrossConnectionReview({
    workingEvidence,
    evidenceConnections,
  });

  const patternText = safeText(selectedPattern?.text);
  const groupName = selectedCluster?.name || "Your group";

  function handleChooseRelation(evidenceId, choiceId) {
    setUiChoices((previous) => ({ ...previous, [evidenceId]: choiceId }));
    const current = evidenceConnections[evidenceId] || {
      selected: false,
      relation: "supports",
      note: "",
    };
    const patch = mapRelationChoiceToConnectionPatch(choiceId, current);
    onUpdateConnection?.(evidenceId, {
      selected: patch.selected,
      relation: patch.relation,
      note: patch.note,
    });
  }

  function handleNoteChange(evidenceId, note) {
    const current = evidenceConnections[evidenceId] || {
      selected: false,
      relation: "supports",
      note: "",
    };
    const uiChoice = getUiChoice(evidenceId);
    const choice = getRelationChoice(uiChoice);
    onUpdateConnection?.(evidenceId, {
      selected: choice?.countsTowardProgress ? true : current.selected,
      relation: choice?.storedRelation || current.relation || "supports",
      note,
    });
  }

  function handleAddEvidence(evidenceId) {
    setExtraEvidenceIds((previous) =>
      previous.includes(evidenceId) ? previous : [...previous, evidenceId]
    );
  }

  function getOtherEvidence(currentEvidence) {
    return (
      workingEvidence.find((item) => item.id !== currentEvidence?.id) || null
    );
  }

  function otherConnectionComplete(currentEvidence) {
    const other = getOtherEvidence(currentEvidence);
    if (!other) return false;
    return isValidExplainedConnection(evidenceConnections[other.id]);
  }

  function buildCoachingForEvidence(evidence) {
    const other = getOtherEvidence(evidence);
    return getConnectCoachingLines({
      sourceType: evidence?.sourceType || "",
      uiChoiceId: getUiChoice(evidence?.id),
      otherSourceType: other?.sourceType || "",
      otherConnectionComplete: otherConnectionComplete(evidence),
    });
  }

  const firstEvidence = workingEvidence[0] || null;
  const secondEvidence = workingEvidence[1] || null;
  const firstReady = firstEvidence
    ? isValidExplainedConnection(evidenceConnections[firstEvidence.id])
    : false;
  const secondReady = secondEvidence
    ? isValidExplainedConnection(evidenceConnections[secondEvidence.id])
    : false;

  const showQuote1Task =
    Boolean(firstEvidence) && !phase.showReview && !firstReady;

  const showQuote2Task =
    Boolean(secondEvidence) &&
    phase.revealQuote2 &&
    !phase.showReview &&
    !secondReady;

  const optionalEvidence = !phase.showReview
    ? workingEvidence
        .slice(2)
        .filter((_, index) => phase.activeIndex === index + 2)
    : [];

  return (
    <WorkspaceColumns className="gap-6 xl:gap-10">
      <WorkspaceSidebar className="opacity-90">
        <aside className="space-y-4 rounded-xl bg-surface-soft/60 px-4 py-4 text-left">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-text-muted">
            Where you are
          </p>
          <p className="text-sm leading-relaxed text-text-muted">
            You are testing your idea against quotations—one connection at a time.
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
              How does each quotation help this idea?
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-text-muted md:text-base">
              You developed an idea from a pattern. Now you will test that idea against the
              quotations that helped you notice it—and explain what each work contributes.
            </p>
            <p className="max-w-2xl text-sm leading-relaxed text-text-primary">
              A quotation does not prove an idea by itself. Your explanation is what shows
              readers how the quotation and idea connect.
            </p>
          </header>

          <ModuleThreePromptCompass
            assignmentPrompt={assignmentPrompt}
            focusQuestionId={CONNECT_COMPASS_FOCUS_ID}
            framingLine={CONNECT_COMPASS_FRAMING_LINE}
          />

          <section className="space-y-4" aria-labelledby="connect-artifacts-heading">
            <div className="text-left">
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-text-primary">
                What you are testing
              </p>
              <h2
                id="connect-artifacts-heading"
                className="mt-1.5 text-lg font-semibold text-text-primary md:text-xl"
              >
                Chosen observation → developing idea → evidence connections
              </h2>
              <p className="mt-1 text-sm text-text-muted">
                Group: <span className="font-medium text-text-primary">{groupName}</span>
              </p>
            </div>

            <div className="rounded-xl border border-theme-blue/25 bg-theme-blue/[0.05] px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-theme-blue">
                Chosen observation
              </p>
              <p className="mt-2 text-sm leading-relaxed text-text-primary">
                {patternText || "Go back and choose an observation before connecting evidence."}
              </p>
            </div>

            <div className="rounded-xl border-2 border-theme-orange/35 bg-theme-orange/[0.08] px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-theme-orange">
                Developing idea you are testing
              </p>
              <p className="mt-2 text-base leading-relaxed text-text-primary">
                {ideaStatement || "Your idea will appear here after the previous step."}
              </p>
            </div>

            {!phase.showReview ? (
              <p className="text-sm leading-relaxed text-text-primary">
                Next: explain how each quotation supports, complicates, or sharpens this idea.
              </p>
            ) : null}
          </section>

          <div className="rounded-xl border-2 border-theme-orange/40 bg-theme-orange/10 px-5 py-5 shadow-soft ring-1 ring-theme-orange/15">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-theme-orange">
              Your job right now
            </p>
            <p className="mt-2 text-base font-semibold leading-snug text-text-primary">
              Explain what each quotation contributes to your idea.
            </p>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-text-primary">
              <li>Read your developing idea.</li>
              <li>Read one quotation carefully, including who it addresses and why.</li>
              <li>Choose how it relates to the idea.</li>
              <li>Explain the connection in your own words.</li>
            </ol>
          </div>

          {baseWorking.needsRecovery ? (
            <p
              role="status"
              aria-live="polite"
              className="rounded-xl border border-theme-orange/35 bg-theme-orange/10 px-4 py-3 text-sm text-text-primary"
            >
              This pattern needs more quotations from your group before you can finish. Add
              another quotation from this group under Need Help.
            </p>
          ) : null}

          {showQuote1Task ? (
            <QuotationConnectionTask
              title={`${firstEvidence.sourceLabel || "Quotation"} 1`}
              ideaStatement={ideaStatement}
              evidence={firstEvidence}
              connection={evidenceConnections[firstEvidence.id]}
              uiChoice={getUiChoice(firstEvidence.id)}
              showModel
              assignmentSources={assignmentSources}
              coachingLines={buildCoachingForEvidence(firstEvidence)}
              otherConnectionComplete={otherConnectionComplete(firstEvidence)}
              onChooseRelation={(choiceId) =>
                handleChooseRelation(firstEvidence.id, choiceId)
              }
              onNoteChange={(note) => handleNoteChange(firstEvidence.id, note)}
            />
          ) : null}

          {showQuote2Task ? (
            <>
              {firstReady && !secondReady ? (
                <p
                  role="status"
                  aria-live="polite"
                  className="rounded-lg bg-theme-green/10 px-4 py-3 text-sm text-text-primary"
                >
                  Good. Now explain what the{" "}
                  {secondEvidence.sourceLabel || "next quotation"} contributes to the same
                  idea.
                </p>
              ) : null}
              <QuotationConnectionTask
                title={`${secondEvidence.sourceLabel || "Quotation"} 2`}
                ideaStatement={ideaStatement}
                evidence={secondEvidence}
                connection={evidenceConnections[secondEvidence.id]}
                uiChoice={getUiChoice(secondEvidence.id)}
                assignmentSources={assignmentSources}
                coachingLines={buildCoachingForEvidence(secondEvidence)}
                otherConnectionComplete={otherConnectionComplete(secondEvidence)}
                onChooseRelation={(choiceId) =>
                  handleChooseRelation(secondEvidence.id, choiceId)
                }
                onNoteChange={(note) => handleNoteChange(secondEvidence.id, note)}
              />
            </>
          ) : null}

          {optionalEvidence.map((evidence, index) => {
            const quoteNumber =
              workingEvidence.findIndex((item) => item.id === evidence.id) + 1;
            return (
              <QuotationConnectionTask
                key={evidence.id}
                title={
                  phase.validCount >= CONNECT_MINIMUM
                    ? `Optional ${evidence.sourceLabel || "quotation"} ${index + 1}`
                    : `${evidence.sourceLabel || "Quotation"} ${quoteNumber}`
                }
                ideaStatement={ideaStatement}
                evidence={evidence}
                connection={evidenceConnections[evidence.id]}
                uiChoice={getUiChoice(evidence.id)}
                assignmentSources={assignmentSources}
                coachingLines={buildCoachingForEvidence(evidence)}
                otherConnectionComplete={otherConnectionComplete(evidence)}
                onChooseRelation={(choiceId) =>
                  handleChooseRelation(evidence.id, choiceId)
                }
                onNoteChange={(note) => handleNoteChange(evidence.id, note)}
              />
            );
          })}

          {phase.showReview ? (
            <section className="space-y-5" aria-labelledby="connect-review-heading">
              <div className="text-left">
                <h2
                  id="connect-review-heading"
                  className="text-lg font-semibold text-text-primary md:text-xl"
                >
                  Review your connections across both works.
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-text-muted">
                  Idea → Speech contribution + Letter contribution → compare their roles
                </p>
              </div>

              <div className="rounded-xl border-2 border-theme-orange/30 bg-theme-orange/[0.06] px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-theme-orange">
                  Developing idea
                </p>
                <p className="mt-2 text-base leading-relaxed text-text-primary">
                  {ideaStatement}
                </p>
              </div>

              <div className="grid min-w-0 gap-4 md:grid-cols-2">
                {crossReview.speech ? (
                  <ConnectionReviewCard
                    item={crossReview.speech}
                    ideaStatement={ideaStatement}
                    assignmentSources={assignmentSources}
                    editing={editingEvidenceId === crossReview.speech.evidence.id}
                    uiChoice={getUiChoice(crossReview.speech.evidence.id)}
                    connection={evidenceConnections[crossReview.speech.evidence.id]}
                    onEdit={() =>
                      setEditingEvidenceId((current) =>
                        current === crossReview.speech.evidence.id
                          ? ""
                          : crossReview.speech.evidence.id
                      )
                    }
                    onChooseRelation={(choiceId) =>
                      handleChooseRelation(crossReview.speech.evidence.id, choiceId)
                    }
                    onNoteChange={(note) =>
                      handleNoteChange(crossReview.speech.evidence.id, note)
                    }
                  />
                ) : null}

                {crossReview.letter &&
                crossReview.letter.evidence.id !== crossReview.speech?.evidence?.id ? (
                  <ConnectionReviewCard
                    item={crossReview.letter}
                    ideaStatement={ideaStatement}
                    assignmentSources={assignmentSources}
                    editing={editingEvidenceId === crossReview.letter.evidence.id}
                    uiChoice={getUiChoice(crossReview.letter.evidence.id)}
                    connection={evidenceConnections[crossReview.letter.evidence.id]}
                    onEdit={() =>
                      setEditingEvidenceId((current) =>
                        current === crossReview.letter.evidence.id
                          ? ""
                          : crossReview.letter.evidence.id
                      )
                    }
                    onChooseRelation={(choiceId) =>
                      handleChooseRelation(crossReview.letter.evidence.id, choiceId)
                    }
                    onNoteChange={(note) =>
                      handleNoteChange(crossReview.letter.evidence.id, note)
                    }
                  />
                ) : null}
              </div>

              <div className="rounded-xl border-2 border-theme-blue/25 bg-theme-blue/[0.05] px-4 py-4 md:px-5">
                <h3 className="text-base font-semibold text-text-primary">
                  {CONNECT_CROSS_REVIEW_HEADING}
                </h3>
                <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-text-muted">
                  {CONNECT_CROSS_REVIEW_QUESTIONS.map((question) => (
                    <li key={question}>{question}</li>
                  ))}
                </ul>
              </div>

              <div
                role="status"
                aria-live="polite"
                className="space-y-3 rounded-xl border-2 border-theme-green/35 bg-theme-green/10 px-4 py-4 text-left md:px-5"
              >
                <p className="text-base font-semibold leading-snug text-text-primary">
                  {CONNECT_READY_MESSAGE}
                </p>
                <p className="text-sm leading-relaxed text-text-primary">
                  {CONNECT_READY_COMPARISON_PROMPT}
                </p>
              </div>
            </section>
          ) : continueHint ? (
            <p
              role="status"
              aria-live="polite"
              className="rounded-lg border border-theme-orange/35 bg-theme-orange/10 px-4 py-3 text-sm text-text-primary"
            >
              {continueHint}
            </p>
          ) : null}

          <details className="rounded-xl border border-border-soft/70 bg-surface-soft/30 px-4 py-3 md:px-5">
            <summary className="cursor-pointer list-none text-sm font-medium text-theme-blue">
              Need Help
            </summary>
            <div className="mt-3 space-y-4 border-t border-border-soft/60 pt-3 text-sm leading-relaxed text-text-muted">
              <div>
                <p className="font-medium text-text-primary">Explanation versus summary</p>
                <p className="mt-1">
                  Summary retells the quotation. Restatement repeats your idea. Explanation
                  names a specific part of the quotation and shows how it helps the idea.
                </p>
              </div>
              <div>
                <p className="font-medium text-text-primary">Sentence starters</p>
                <ul className="mt-1 list-disc space-y-1 pl-5">
                  {CONNECT_SENTENCE_STARTERS.map((starter) => (
                    <li key={starter}>{starter}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-medium text-text-primary">
                  What if a quotation does not fit?
                </p>
                <p className="mt-1">
                  Mark it as not fitting, then add another quotation from this group. Only
                  explained connections count toward continuing.
                </p>
              </div>
              <div>
                <p className="font-medium text-text-primary">Your chosen pattern</p>
                <p className="mt-1 text-text-primary">
                  {selectedPattern?.text || "No pattern selected."}
                </p>
              </div>

              {availableToAdd.length > 0 ? (
                <details className="rounded-lg bg-white/80 px-3 py-2">
                  <summary className="cursor-pointer text-xs font-medium text-text-muted">
                    Add another quotation from this group
                  </summary>
                  <div className="mt-3 space-y-2">
                    {availableToAdd.map((evidence) => (
                      <div
                        key={`add-${evidence.id}`}
                        className="flex flex-wrap items-start justify-between gap-2 rounded-lg border border-border-soft/70 px-3 py-2"
                      >
                        <p className="min-w-0 flex-1 text-xs text-text-muted">
                          <span className="font-medium text-text-primary">
                            {evidence.sourceLabel}
                          </span>
                          {" · "}
                          {evidence.quote
                            ? evidence.quote.length > 90
                              ? `${evidence.quote.slice(0, 90)}...`
                              : evidence.quote
                            : evidence.observation || "Saved note"}
                        </p>
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={() => handleAddEvidence(evidence.id)}
                        >
                          Add
                        </Button>
                      </div>
                    ))}
                  </div>
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
              Point to a word or phrase in the quotation. Then explain how that detail helps
              your idea—and what that work contributes compared with the other text.
            </p>
          </div>
          <div className="space-y-2 border-t border-border-soft/60 pt-4">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-text-muted">
              What comes next
            </p>
            <p className="text-sm leading-relaxed text-text-muted">
              Next, you will step back and evaluate whether these connections make your idea
              convincing enough to build into a claim.
            </p>
          </div>
        </aside>
      </WorkspaceGuide>
    </WorkspaceColumns>
  );
}
