"use client";

import { useMemo, useState } from "react";
import Button from "@/components/ui/Button";
import ModuleThreeEvidenceCard from "@/components/module3/ModuleThreeEvidenceCard";
import WorkspaceCenter from "@/components/layout/WorkspaceCenter";
import WorkspaceColumns from "@/components/layout/WorkspaceColumns";
import WorkspaceGuide from "@/components/layout/WorkspaceGuide";
import WorkspaceSidebar from "@/components/layout/WorkspaceSidebar";
import {
  CONNECT_MINIMUM,
  CONNECT_SENTENCE_STARTERS,
  RELATION_CHOICES,
  buildConnectionReviewItems,
  getConnectContinueHint,
  getConnectEvidencePhase,
  getConnectReadyMessage,
  getConnectWorkingEvidence,
  getRelationChoice,
  inferUiChoiceFromConnection,
  isValidExplainedConnection,
  mapRelationChoiceToConnectionPatch,
} from "@/lib/module3/connectEvidenceHelpers";

const ANSWER_TEXTAREA_CLASS =
  "min-h-[120px] w-full rounded-xl border-2 border-theme-dark/20 bg-white p-4 text-base leading-relaxed text-text-primary shadow-sm placeholder:text-text-muted/60 focus:border-theme-dark/35 focus:outline-none focus:ring-4 focus:ring-theme-dark/[0.06]";

function safeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function QuotationConnectionTask({
  title,
  ideaStatement,
  evidence,
  connection,
  uiChoice,
  showModel = false,
  onChooseRelation,
  onNoteChange,
}) {
  const choice = getRelationChoice(uiChoice);
  const showNoteField = Boolean(choice?.countsTowardProgress);

  return (
    <section className="space-y-4 rounded-xl border-2 border-theme-orange/30 bg-white p-4 shadow-soft md:p-5">
      <div className="text-left">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-theme-orange">
          {title}
        </p>
        <h2 className="mt-1.5 text-lg font-semibold text-text-primary md:text-xl">
          How does this quotation relate to your idea?
        </h2>
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
          <p className="mt-2">
            Sample idea: delay becomes part of the injustice. Sample quotation: waiting for
            change hurts people now.{" "}
            <span className="text-text-primary">
              Explanation: The words “hurts people now” connect delay to real harm, which
              supports the idea that waiting itself is unjust.
            </span>
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
      </div>

      {choice ? (
        <p className="rounded-lg bg-surface-soft/70 px-4 py-3 text-sm leading-relaxed text-text-primary">
          {choice.coaching}
        </p>
      ) : null}

      {choice?.id === "does_not_fit" ? (
        <p
          role="status"
          aria-live="polite"
          className="rounded-lg border border-theme-orange/35 bg-theme-orange/10 px-3 py-2 text-sm text-text-primary"
        >
          This quotation will not count toward your required connections. Choose another
          relationship, or add a different quotation from this group under Need Help.
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
              Write a clear connection note for this quotation.
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

  const reviewItems = buildConnectionReviewItems({
    workingEvidence,
    evidenceConnections,
  });

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
              quotations that helped you notice it.
            </p>
            <p className="max-w-2xl text-sm leading-relaxed text-text-primary">
              A quotation does not prove an idea by itself. Your explanation is what shows
              readers how the quotation and idea connect.
            </p>
          </header>

          <div className="rounded-xl border-2 border-theme-orange/40 bg-theme-orange/10 px-5 py-5 shadow-soft ring-1 ring-theme-orange/15">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-theme-orange">
              Your job right now
            </p>
            <p className="mt-2 text-base font-semibold leading-snug text-text-primary">
              Explain how each quotation relates to your idea.
            </p>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-text-primary">
              <li>Read your developing idea.</li>
              <li>Read one quotation carefully.</li>
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
              title="Quotation 1"
              ideaStatement={ideaStatement}
              evidence={firstEvidence}
              connection={evidenceConnections[firstEvidence.id]}
              uiChoice={getUiChoice(firstEvidence.id)}
              showModel
              onChooseRelation={(choiceId) =>
                handleChooseRelation(firstEvidence.id, choiceId)
              }
              onNoteChange={(note) => handleNoteChange(firstEvidence.id, note)}
            />
          ) : null}

          {showQuote2Task ? (
            <>
              {firstReady && !secondReady ? (
                <p className="rounded-lg bg-theme-green/10 px-4 py-3 text-sm text-text-primary">
                  Good. Now test the same idea against another quotation.
                </p>
              ) : null}
              <QuotationConnectionTask
                title="Quotation 2"
                ideaStatement={ideaStatement}
                evidence={secondEvidence}
                connection={evidenceConnections[secondEvidence.id]}
                uiChoice={getUiChoice(secondEvidence.id)}
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
                    ? `Optional quotation ${index + 1}`
                    : `Quotation ${quoteNumber}`
                }
                ideaStatement={ideaStatement}
                evidence={evidence}
                connection={evidenceConnections[evidence.id]}
                uiChoice={getUiChoice(evidence.id)}
                onChooseRelation={(choiceId) =>
                  handleChooseRelation(evidence.id, choiceId)
                }
                onNoteChange={(note) => handleNoteChange(evidence.id, note)}
              />
            );
          })}

          {phase.showReview ? (
            <section className="space-y-4" aria-labelledby="connect-review-heading">
              <div className="text-left">
                <h2
                  id="connect-review-heading"
                  className="text-lg font-semibold text-text-primary md:text-xl"
                >
                  Review your connections.
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-text-muted">
                  You have explained how at least two quotations relate to your idea.
                </p>
              </div>

              <div className="rounded-xl border-2 border-theme-orange/30 bg-theme-orange/[0.06] px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-theme-orange">
                  Your developing idea
                </p>
                <p className="mt-2 text-base leading-relaxed text-text-primary">
                  {ideaStatement}
                </p>
              </div>

              <div className="space-y-3">
                {reviewItems.map((item) => (
                  <div
                    key={`review-${item.evidence.id}`}
                    className="rounded-xl border border-border-soft/80 bg-white px-4 py-4"
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                      {item.evidence.sourceLabel}
                    </p>
                    <p className="mt-2 text-sm italic leading-relaxed text-text-primary">
                      “{item.evidence.quote || item.evidence.observation || "Saved note"}”
                    </p>
                    <p className="mt-2 text-xs font-medium text-theme-blue">
                      {item.relationLabel}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-text-muted">
                      This quotation helps because… {item.note}
                    </p>
                    <Button
                      type="button"
                      variant="tertiary"
                      size="sm"
                      className="mt-3"
                      onClick={() =>
                        setEditingEvidenceId((current) =>
                          current === item.evidence.id ? "" : item.evidence.id
                        )
                      }
                    >
                      {editingEvidenceId === item.evidence.id
                        ? "Done editing"
                        : "Edit this connection"}
                    </Button>

                    {editingEvidenceId === item.evidence.id ? (
                      <div className="mt-4">
                        <QuotationConnectionTask
                          title="Edit connection"
                          ideaStatement={ideaStatement}
                          evidence={item.evidence}
                          connection={evidenceConnections[item.evidence.id]}
                          uiChoice={getUiChoice(item.evidence.id)}
                          onChooseRelation={(choiceId) =>
                            handleChooseRelation(item.evidence.id, choiceId)
                          }
                          onNoteChange={(note) =>
                            handleNoteChange(item.evidence.id, note)
                          }
                        />
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>

              <p
                role="status"
                aria-live="polite"
                className="rounded-xl border border-theme-green/35 bg-theme-green/10 px-4 py-3 text-sm text-text-primary"
              >
                {getConnectReadyMessage()}
              </p>
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
              your idea.
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
