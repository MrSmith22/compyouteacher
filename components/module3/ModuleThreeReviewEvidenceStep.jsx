"use client";

import { useEffect, useRef } from "react";
import Button from "@/components/ui/Button";
import InfoCallout from "@/components/ui/InfoCallout";
import ModuleThreeEvidenceCard from "@/components/module3/ModuleThreeEvidenceCard";
import WorkspaceCenter from "@/components/layout/WorkspaceCenter";
import WorkspaceColumns from "@/components/layout/WorkspaceColumns";
import WorkspaceGuide from "@/components/layout/WorkspaceGuide";
import WorkspaceSidebar from "@/components/layout/WorkspaceSidebar";
import {
  DOWNSTREAM_GROUP_SWITCH_COPY,
  getAppealChipLabel,
  getDownstreamGroupSwitchMessage,
  getGroupCardActionLabel,
  getGroupChoicePresentation,
  getReviewEvidencePhase,
  getSavedGroupAccent,
  getSelectionRequirementMessage,
  getSelectionSourceMix,
  REVIEW_GROUP_CHOICE_COPY,
  REVIEW_HELP_GROUPING_LENSES,
  REVIEW_PRIMARY_GROUPING_LENSES,
  REVIEW_QUOTE_MINIMUM,
  sourceMixLabel,
} from "@/lib/module3/reviewEvidenceHelpers";
import ModuleThreePromptCompass from "@/components/module3/ModuleThreePromptCompass";
import {
  REVIEW_COMPASS_FOCUS_ID,
  REVIEW_COMPASS_FRAMING_LINE,
} from "@/lib/module3/promptCompassHelpers";

const ANSWER_INPUT_CLASS =
  "w-full rounded-xl border-2 border-theme-dark/20 bg-white px-4 py-3 text-base text-text-primary shadow-sm placeholder:text-text-muted/60 focus:border-theme-dark/35 focus:outline-none focus:ring-4 focus:ring-theme-dark/[0.06]";

const PRIMARY_ACTION_BUTTON_CLASS = "w-full py-3.5 text-base font-semibold";

function ChecklistItem({ done, label }) {
  return (
    <li className="flex items-start gap-2 text-sm leading-relaxed">
      <span
        aria-hidden="true"
        className={done ? "text-theme-green" : "text-text-muted/50"}
      >
        {done ? "✓" : "○"}
      </span>
      <span className={done ? "text-text-primary" : "text-text-muted"}>
        {label}
      </span>
    </li>
  );
}

function sourceLabelForType(sourceType) {
  if (sourceType === "letter") return "Letter";
  if (sourceType === "speech") return "Speech";
  return "Source";
}

export default function ModuleThreeReviewEvidenceStep({
  assignmentPrompt = "",
  evidenceItems = [],
  evidenceGroups = [],
  workingEvidenceIds = [],
  workingEvidence = [],
  clusterDraftName = "",
  onClusterDraftNameChange,
  evidenceClusters = [],
  selectedClusterId = "",
  onToggleEvidence,
  onSaveGroup,
  onSelectCluster,
  pendingGroupSwitch = null,
  onCancelGroupSwitch,
  onConfirmGroupSwitch,
  saveDisabledReason = "",
  canSaveGroup = false,
  saveConfirmation = "",
  duplicateMessage = "",
  quoteMinimum = REVIEW_QUOTE_MINIMUM,
  sourceFilter,
  setSourceFilter,
  searchText,
  setSearchText,
  progressCompleted = [],
  progressNext = "",
}) {
  const selectedCount = workingEvidenceIds.length;
  const phase = getReviewEvidencePhase({
    selectedCount,
    groupName: clusterDraftName,
    savedGroupCount: evidenceClusters.length,
    quoteMinimum,
  });
  const selectionFeedback = getSelectionRequirementMessage({
    selectedCount,
    quoteMinimum,
  });
  const sourceMix = getSelectionSourceMix(workingEvidence);
  const selectedCluster =
    evidenceClusters.find((cluster) => cluster.id === selectedClusterId) || null;
  const choicePresentation = getGroupChoicePresentation({
    selectedCluster,
    evidenceItems,
  });
  const duplicateAlertRef = useRef(null);

  useEffect(() => {
    if (!duplicateMessage || !duplicateAlertRef.current) {
      return;
    }
    duplicateAlertRef.current.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }, [duplicateMessage]);

  return (
    <WorkspaceColumns className="gap-6 xl:gap-10">
      <WorkspaceSidebar className="opacity-90">
        <aside className="space-y-4 rounded-xl bg-surface-soft/60 px-4 py-4 text-left">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-text-muted">
            Where you are
          </p>
          <p className="text-sm leading-relaxed text-text-muted">
            This sidebar tracks your progress. Your quotations stay in the center so you can
            sort them into groups.
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
          ) : (
            <p className="text-sm leading-relaxed text-text-muted">
              As you save groups, a short record of your thinking will appear here.
            </p>
          )}
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
              Put related quotations into groups.
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-text-muted md:text-base">
              You’re looking for quotations that could help you compare how King uses
              ethos, pathos, and logos in the speech and the letter. Groups are how
              you’ll begin finding those comparisons.
            </p>
            <p className="max-w-2xl text-sm leading-relaxed text-text-muted">
              There is more than one useful way to group evidence. You are exploring—not
              choosing your final thesis yet.
            </p>
          </header>

          <ModuleThreePromptCompass
            assignmentPrompt={assignmentPrompt}
            focusQuestionId={REVIEW_COMPASS_FOCUS_ID}
            framingLine={REVIEW_COMPASS_FRAMING_LINE}
          />

          {saveConfirmation ? (
            <div
              role="status"
              className="rounded-xl border border-theme-green/30 bg-theme-green/10 px-4 py-3 text-sm leading-relaxed text-theme-green"
            >
              {saveConfirmation}
            </div>
          ) : null}

          {/* One workspace: job → selected → collection */}
          <section className="space-y-5" aria-labelledby="review-job-heading">
            <div className="rounded-xl border-2 border-theme-orange/40 bg-theme-orange/10 px-5 py-5 shadow-soft ring-1 ring-theme-orange/15">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-theme-orange">
                Your job right now
              </p>
              <h2
                id="review-job-heading"
                className="mt-2 text-base font-semibold leading-snug text-text-primary md:text-lg"
              >
                Look at your quotations and choose at least two that seem meaningfully
                connected.
              </h2>
              <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-text-primary">
                <li>Read the quotations below.</li>
                <li>
                  Look for quotations that use the same appeal or address the same
                  problem or value.
                </li>
                <li>Choose two or more that seem connected.</li>
                <li>After you choose them, you’ll name and save the group.</li>
              </ol>

              <div className="mt-4 rounded-lg border border-theme-orange/25 bg-white/70 px-3 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted">
                  Two ways to begin
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-text-primary">
                  {REVIEW_PRIMARY_GROUPING_LENSES.map((lens) => (
                    <li key={lens}>{lens}</li>
                  ))}
                </ul>
                <p className="mt-2 text-xs leading-relaxed text-text-muted">
                  These are starting points, not the only correct ways to make a group.
                </p>
              </div>
            </div>

            <div
              id="selected-quotes-basket"
              className="rounded-xl border-2 border-theme-dark/12 bg-white p-4 shadow-soft ring-1 ring-theme-dark/[0.03] md:p-5"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-primary">
                  Your selected quotations
                </p>
                <p className="text-sm font-medium text-text-primary">
                  Selected: {selectedCount}
                  {selectedCount < quoteMinimum
                    ? ` of ${quoteMinimum} needed`
                    : ""}
                </p>
              </div>

              <p
                role="status"
                aria-live="polite"
                className={`mt-3 rounded-lg border px-3 py-2 text-sm leading-relaxed ${
                  selectionFeedback.tone === "ready"
                    ? "border-theme-green/35 bg-theme-green/10 text-text-primary"
                    : "border-theme-orange/35 bg-theme-orange/10 text-text-primary"
                }`}
              >
                {selectionFeedback.message}
              </p>

              {sourceMix.show ? (
                <p
                  role="status"
                  className="mt-2 rounded-lg border border-border-soft/70 bg-surface-soft/50 px-3 py-2 text-sm leading-relaxed text-text-primary"
                >
                  <span className="font-medium">{sourceMix.countLine}</span>
                  {sourceMix.message ? (
                    <span className="mt-0.5 block text-text-muted">
                      {sourceMix.message}
                    </span>
                  ) : null}
                </p>
              ) : null}

              {workingEvidence.length === 0 ? (
                <p className="mt-4 text-sm leading-relaxed text-text-muted">
                  Choose quotations from your collection below. Your choices will appear here.
                </p>
              ) : (
                <div className="mt-4 space-y-3">
                  {workingEvidence.map((evidence) => (
                    <div key={`selected-${evidence.id}`} className="relative">
                      <ModuleThreeEvidenceCard
                        evidence={evidence}
                        selected
                        grouping
                        showArtifactLabel={false}
                        appealChip={getAppealChipLabel(evidence.tags)}
                      />
                      <button
                        type="button"
                        onClick={() => onToggleEvidence?.(evidence.id)}
                        className="mt-2 text-xs font-medium text-text-muted hover:text-text-primary"
                      >
                        Remove from this group
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="text-left">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-primary">
                  Your Module 2 quotations
                </p>
                <p className="mt-1 text-sm leading-relaxed text-text-muted">
                  These are the quotations you are sorting. Speech cards use blue. Letter cards
                  use orange.
                </p>
              </div>

              <details className="rounded-lg bg-surface-soft/60">
                <summary className="cursor-pointer px-3 py-2 text-xs font-medium text-text-muted">
                  Optional: filter or search quotations
                </summary>
                <div className="grid gap-3 border-t border-border-soft/60 px-3 py-3 md:grid-cols-2">
                  <label className="text-left">
                    <span className="mb-1 block text-xs font-medium text-text-muted">
                      Source
                    </span>
                    <select
                      value={sourceFilter}
                      onChange={(event) => setSourceFilter?.(event.target.value)}
                      className="w-full rounded-lg border border-border-soft bg-white px-3 py-2 text-sm text-text-primary"
                    >
                      <option value="all">All sources</option>
                      <option value="speech">Speech</option>
                      <option value="letter">Letter</option>
                    </select>
                  </label>
                  <label className="text-left">
                    <span className="mb-1 block text-xs font-medium text-text-muted">
                      Search
                    </span>
                    <input
                      value={searchText}
                      onChange={(event) => setSearchText?.(event.target.value)}
                      placeholder="Search quotes or notes"
                      className="w-full rounded-lg border border-border-soft bg-white px-3 py-2 text-sm text-text-primary"
                    />
                  </label>
                </div>
              </details>

              {evidenceItems.length === 0 ? (
                <p className="text-sm text-text-muted">
                  Your quotations from Module 2 will show up here. Go back and save at least
                  two before continuing.
                </p>
              ) : evidenceGroups.length === 0 ? (
                <p className="text-sm text-text-muted">
                  No quotations match this filter. Try changing it, or collect more in Module
                  2.
                </p>
              ) : (
                <div className="space-y-4">
                  {evidenceGroups.map(([sourceType, evidenceGroup]) => (
                    <div key={sourceType} className="space-y-2">
                      <p className="text-left text-xs font-medium text-text-muted">
                        {sourceLabelForType(sourceType)}
                      </p>
                      <div className="space-y-2">
                        {evidenceGroup.map((evidence) => (
                          <ModuleThreeEvidenceCard
                            key={evidence.id}
                            evidence={evidence}
                            selected={workingEvidenceIds.includes(evidence.id)}
                            onToggleSelected={onToggleEvidence}
                            grouping
                            showArtifactLabel={false}
                            appealChip={getAppealChipLabel(evidence.tags)}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Naming + saving — only after selection is ready */}
          {phase.showNaming ? (
            <section
              className="space-y-4"
              aria-labelledby="review-name-heading"
              id="review-name-group"
            >
              <div className="text-left">
                <h2
                  id="review-name-heading"
                  className="text-lg font-semibold text-text-primary md:text-xl"
                >
                  Now give this group a short name.
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-text-muted">
                  What idea connects these quotations? Choose a short name that will help you
                  remember the shared idea.
                </p>
              </div>

              <label className="block text-left">
                <span className="mb-2 block text-base font-medium text-text-primary">
                  Short group name
                </span>
                <input
                  value={clusterDraftName}
                  onChange={(event) => onClusterDraftNameChange?.(event.target.value)}
                  placeholder="A short name for the shared idea"
                  className={ANSWER_INPUT_CLASS}
                />
              </label>

              {phase.showSave ? (
                <div
                  className={`rounded-xl border px-4 py-4 md:px-5 ${
                    phase.emphasizeSave
                      ? "border-theme-green/30 bg-theme-green/[0.06]"
                      : "border-border-soft/70 bg-surface-soft/40"
                  }`}
                >
                  <ul className="space-y-2">
                    <ChecklistItem
                      done={phase.hasEnoughQuotes}
                      label={`At least ${quoteMinimum} quotations selected`}
                    />
                    <ChecklistItem done={phase.hasName} label="Group named" />
                    <ChecklistItem
                      done={phase.canSave}
                      label={phase.canSave ? "Ready to save" : "Not ready to save yet"}
                    />
                  </ul>

                  <div className="mt-4 space-y-3">
                    {duplicateMessage ? (
                      <div ref={duplicateAlertRef}>
                        <InfoCallout
                          tone="warning"
                          title="This group was not saved."
                          className="border-2 border-theme-orange/40 shadow-soft"
                        >
                          <p
                            role="alert"
                            aria-live="assertive"
                            className="text-text-primary"
                          >
                            {duplicateMessage}
                          </p>
                        </InfoCallout>
                      </div>
                    ) : null}

                    <Button
                      type="button"
                      onClick={onSaveGroup}
                      disabled={!canSaveGroup}
                      variant="primary"
                      tone="success"
                      size="lg"
                      className={PRIMARY_ACTION_BUTTON_CLASS}
                    >
                      Save this group
                    </Button>
                    {!canSaveGroup && saveDisabledReason ? (
                      <p className="text-xs leading-relaxed text-text-muted">
                        {saveDisabledReason}
                      </p>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </section>
          ) : null}

          {/* Saved-group choice — only after at least one group exists */}
          {phase.showChooseGroup ? (
            <section className="space-y-5" aria-labelledby="review-choose-heading">
              <div className="rounded-xl border-2 border-theme-blue/30 bg-theme-blue/[0.06] px-5 py-5 shadow-soft">
                <h2
                  id="review-choose-heading"
                  className="text-lg font-semibold text-text-primary md:text-xl"
                >
                  {REVIEW_GROUP_CHOICE_COPY.heading}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-text-primary">
                  {REVIEW_GROUP_CHOICE_COPY.intro}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-text-primary">
                  {REVIEW_GROUP_CHOICE_COPY.nextStep}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-text-muted">
                  {REVIEW_GROUP_CHOICE_COPY.reassurance}
                </p>
                <p className="mt-3 text-sm font-medium leading-relaxed text-text-primary">
                  {REVIEW_GROUP_CHOICE_COPY.comparisonPrompt}
                </p>

                <ol className="mt-4 list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-text-primary">
                  {REVIEW_GROUP_CHOICE_COPY.steps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>

                <ul className="mt-3 list-disc space-y-1 pl-5 text-xs leading-relaxed text-text-muted">
                  {REVIEW_GROUP_CHOICE_COPY.coachingQuestions.map((question) => (
                    <li key={question}>{question}</li>
                  ))}
                </ul>
              </div>

              <div
                role="status"
                aria-live="polite"
                className={`rounded-xl border-2 px-4 py-3 text-sm leading-relaxed ${
                  choicePresentation.hasChoice
                    ? "border-theme-green/40 bg-theme-green/10 text-text-primary"
                    : "border-theme-orange/40 bg-theme-orange/10 text-text-primary"
                }`}
              >
                <p className="font-semibold">{choicePresentation.statusLine}</p>
                <p className="mt-1">{choicePresentation.statusDetail}</p>
              </div>

              {choicePresentation.pathPreview ? (
                <div className="rounded-xl border border-border-soft/70 bg-surface-soft/50 px-4 py-3 text-sm leading-relaxed text-text-primary">
                  <p className="font-medium">
                    {choicePresentation.pathPreview.lead}
                  </p>
                  <p className="mt-1">
                    <span className="font-semibold">
                      {choicePresentation.pathPreview.groupName}
                    </span>
                    {" · "}
                    {choicePresentation.pathPreview.quotationCount} quotation
                    {choicePresentation.pathPreview.quotationCount === 1 ? "" : "s"}
                    {choicePresentation.pathPreview.sourceMix
                      ? ` · ${choicePresentation.pathPreview.sourceMix}`
                      : ""}
                  </p>
                  <p className="mt-2 text-text-muted">
                    {choicePresentation.pathPreview.nextLine}
                  </p>
                </div>
              ) : null}

              <div
                role="group"
                aria-label="Saved groups — choose one to explore"
                className="space-y-4"
              >
                <p className="text-sm font-medium text-text-primary">Saved groups</p>
                {evidenceClusters.map((cluster, index) => {
                  const isSelected = selectedClusterId === cluster.id;
                  const mix = sourceMixLabel(evidenceItems, cluster.evidenceIds);
                  const accent = getSavedGroupAccent(index);
                  const actionLabel = getGroupCardActionLabel({
                    isChosen: isSelected,
                    hasAnyChoice: choicePresentation.hasChoice,
                  });

                  return (
                    <div
                      key={cluster.id}
                      className={`overflow-hidden rounded-xl border-2 ${
                        isSelected
                          ? `${accent.selectedCard} ring-2 ring-theme-green/25`
                          : `${accent.card} ${
                              choicePresentation.hasChoice ? "opacity-80" : ""
                            }`
                      }`}
                    >
                      <div
                        className={`flex flex-wrap items-start justify-between gap-3 px-4 py-3 md:px-5 ${accent.header}`}
                      >
                        <div className="text-left">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${accent.badge}`}
                            >
                              {accent.numberLabel} {index + 1}
                            </span>
                            {isSelected ? (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-theme-green">
                                <span aria-hidden="true">✓</span>
                                {REVIEW_GROUP_CHOICE_COPY.chosenBadge}
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-2 text-base font-semibold text-text-primary">
                            {cluster.name}
                          </p>
                          <p className="mt-1 text-sm text-text-muted">
                            {cluster.evidenceIds.length} quotation
                            {cluster.evidenceIds.length === 1 ? "" : "s"}
                            {mix ? ` · ${mix}` : ""}
                          </p>
                        </div>

                        <Button
                          type="button"
                          onClick={() => onSelectCluster?.(cluster.id)}
                          variant={isSelected ? "secondary" : "primary"}
                          size="sm"
                          aria-pressed={isSelected}
                          aria-label={
                            isSelected
                              ? `${cluster.name}: chosen for exploration`
                              : `${actionLabel}: ${cluster.name}`
                          }
                        >
                          {actionLabel}
                        </Button>
                      </div>

                      <div className="grid gap-2 p-4 md:grid-cols-2 md:p-5">
                        {cluster.evidenceIds.map((clusterEvidenceId) => {
                          const evidence = evidenceItems.find(
                            (item) => item.id === clusterEvidenceId
                          );
                          if (!evidence) return null;
                          return (
                            <ModuleThreeEvidenceCard
                              key={`${cluster.id}-${evidence.id}`}
                              evidence={evidence}
                              compact
                              grouping
                              showArtifactLabel={false}
                            />
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {pendingGroupSwitch ? (
                <div
                  role="alertdialog"
                  aria-labelledby="group-switch-warning-heading"
                  aria-describedby="group-switch-warning-message"
                  className="rounded-xl border-2 border-theme-orange/45 bg-theme-orange/10 px-5 py-5 shadow-soft"
                >
                  <h3
                    id="group-switch-warning-heading"
                    className="text-base font-semibold text-text-primary"
                  >
                    {DOWNSTREAM_GROUP_SWITCH_COPY.heading}
                  </h3>
                  <p
                    id="group-switch-warning-message"
                    className="mt-2 text-sm leading-relaxed text-text-primary"
                  >
                    {getDownstreamGroupSwitchMessage({
                      currentGroupName: pendingGroupSwitch.currentGroupName,
                      newGroupName: pendingGroupSwitch.newGroupName,
                    })}
                  </p>
                  <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={onCancelGroupSwitch}
                    >
                      {DOWNSTREAM_GROUP_SWITCH_COPY.keepAction}
                    </Button>
                    <Button
                      type="button"
                      variant="primary"
                      tone="warning"
                      onClick={onConfirmGroupSwitch}
                    >
                      {DOWNSTREAM_GROUP_SWITCH_COPY.switchAction}
                    </Button>
                  </div>
                </div>
              ) : null}
            </section>
          ) : null}

          <details className="rounded-xl border border-border-soft/70 bg-surface-soft/30 px-4 py-3 md:px-5">
            <summary className="cursor-pointer list-none text-sm font-medium text-theme-blue">
              Need Help
            </summary>
            <div className="mt-3 space-y-4 border-t border-border-soft/60 pt-3 text-sm leading-relaxed text-text-muted">
              <div>
                <p className="font-medium text-text-primary">Why this matters</p>
                <p className="mt-1">
                  Writers sort related evidence into groups so they can notice patterns and
                  decide what the evidence might prove. You are preparing the piles you will
                  think with next.
                </p>
              </div>
              <details className="rounded-lg bg-white/80 px-3 py-2">
                <summary className="cursor-pointer text-sm font-medium text-text-primary">
                  Show me an example of grouping quotations.
                </summary>
                <div className="mt-2 space-y-2 border-t border-border-soft/60 pt-2 text-sm leading-relaxed text-text-muted">
                  <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                    Example only — not your quotations
                  </p>
                  <p>
                    Example Quote A discusses injustice affecting everyone. Example Quote B
                    discusses the harm caused by waiting for justice.
                  </p>
                  <p>
                    These could belong in one group because both address the consequences of
                    injustice.
                  </p>
                  <p>
                    There is more than one reasonable way to group evidence. Choose a
                    connection that makes sense to you.
                  </p>
                </div>
              </details>
              <div>
                <p className="font-medium text-text-primary">
                  Other connections you might notice
                </p>
                <ul className="mt-1 list-disc space-y-1 pl-5">
                  {REVIEW_HELP_GROUPING_LENSES.map((lens) => (
                    <li key={lens}>{lens}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-medium text-text-primary">How do I know I&apos;m finished?</p>
                <ul className="mt-1 list-disc space-y-1 pl-5">
                  <li>You saved at least one group of related quotations.</li>
                  <li>You chose which group to explore next.</li>
                </ul>
              </div>
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
              There is no single right grouping. If the quotations feel connected to you, they
              are worth trying together. Use simple words for the group name.
            </p>
          </div>

          <div className="space-y-2 border-t border-border-soft/60 pt-4">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-text-muted">
              What comes next
            </p>
            <p className="text-sm leading-relaxed text-text-muted">
              After you choose a group, you will look inside it and notice what those
              quotations have in common.
            </p>
          </div>
        </aside>
      </WorkspaceGuide>
    </WorkspaceColumns>
  );
}
