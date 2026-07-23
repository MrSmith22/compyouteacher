"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import ModulePageShell from "@/components/layout/ModulePageShell";
import WorkspaceCenter from "@/components/layout/WorkspaceCenter";
import WorkspaceColumns from "@/components/layout/WorkspaceColumns";
import WorkspaceGuide from "@/components/layout/WorkspaceGuide";
import WorkspaceSidebar from "@/components/layout/WorkspaceSidebar";
import ProgressDots from "@/components/ui/ProgressDots";
import Card from "@/components/ui/Card";
import {
  APPEAL_DEFINITIONS,
  MATRIX_CELL_ORDER,
  MATRIX_FLOW_STAGES,
  MATRIX_LAYOUT_CONTRACT,
  RATING_ANCHORS,
  allCellsComplete,
  canAdvanceMicrotask,
  createEmptyMatrixBundle,
  isCellComplete,
  isPairComplete,
  normalizeRating,
  readMatrixBundle,
} from "@/lib/module2/rhetoricalMatrixHelpers";
import {
  buildSelectedPattern,
  contradictoryChoiceCue,
  derivePatternOptions,
  reasoningMeetsThreshold,
} from "@/lib/module2/matrixDerivationHelpers";
import {
  applyMatrixCellPatchViaUiPath,
  buildReadableProvenance,
  canContinuePatternSelection,
  clearDependencyReview,
  createMatrixSaveController,
  getFirstIncompleteMicrotask,
  getMatrixPresentationModel,
  getMissingEvidenceRecovery,
  mayNavigateAfterSave,
  resolveMatrixResumeTarget,
  selectPrimaryPatternRecommendations,
} from "@/lib/module2/matrixOrchestrationHelpers";
import {
  filterEvidenceForCell,
  normalizeEvidenceReader,
} from "@/lib/module2/normalizeEvidenceReader";
import { getSituationSummaryOrFallback } from "@/lib/module2/rhetoricalSituationSummary";
import RepresentativeDirectionEvidencePanel from "@/components/module2/RepresentativeDirectionEvidencePanel";
import {
  toEvidenceArgumentRecord,
} from "@/lib/artifacts/evidenceArgumentContract";
import {
  isEvidenceToArgumentSliceEnabled,
  isEvidenceToArgumentSliceModeEnabled,
} from "@/lib/dev/isEvidenceToArgumentSliceEnabled";
import {
  buildEvidenceArgumentDirectionDescriptor,
} from "@/lib/module2/evidenceArgumentDirectionDescriptor";
import { resolveTaskWorkspacePresentation } from "@/lib/ui/taskWorkspaceContract";
import { HIERARCHY_LEVELS, HIERARCHY_TASK_CLASS } from "@/lib/ui/hierarchyContract";

function sourceLabel(sourceType) {
  return sourceType === "letter" ? "Letter" : "Speech";
}

function MatrixStrip({ cells, activeIndex, onSelectCompleted }) {
  return (
    <div
      className="flex flex-wrap gap-2 max-w-full"
      data-testid="matrix-strip"
      aria-label="Accumulated matrix progress"
    >
      {MATRIX_CELL_ORDER.map((spec, index) => {
        const cell = cells[index];
        const done = isCellComplete(cell);
        const active = index === activeIndex;
        const muted = !done && !active;
        return (
          <button
            key={spec.sourceType + spec.appeal}
            type="button"
            disabled={!done && !active}
            onClick={() => done && onSelectCompleted?.(index)}
            className={`min-h-[44px] rounded-lg border px-2.5 py-1.5 text-left text-xs max-w-full ${
              active
                ? "border-theme-blue bg-theme-blue/10 text-theme-blue"
                : done
                  ? "border-theme-green/40 bg-theme-green/10 text-theme-dark"
                  : "border-border-soft bg-surface-soft/50 text-text-muted"
            } ${muted ? "opacity-60" : ""}`}
            aria-current={active ? "step" : undefined}
            aria-label={`${sourceLabel(spec.sourceType)} ${spec.appeal}${
              done && cell?.rating != null ? ` rated ${cell.rating}` : ""
            }${active ? " (current)" : done ? " (completed)" : " (upcoming)"}`}
          >
            <span className="font-semibold">
              {sourceLabel(spec.sourceType)} · {spec.appeal}
            </span>
            {done ? (
              <span className="mt-0.5 block">{cell.rating}/10</span>
            ) : active ? (
              <span className="mt-0.5 block">Current</span>
            ) : (
              <span className="mt-0.5 block">Upcoming</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default function ModuleTwoRhetoricalMatrix() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const email = session?.user?.email;

  const [bundle, setBundle] = useState(() => createEmptyMatrixBundle());
  const [stage, setStage] = useState(MATRIX_FLOW_STAGES.ORIENTATION);
  const [cellIndex, setCellIndex] = useState(0);
  const [microtask, setMicrotask] = useState("rate");
  const [evidence, setEvidence] = useState([]);
  const [summary, setSummary] = useState(null);
  const [fromLegacySummary, setFromLegacySummary] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [customPattern, setCustomPattern] = useState("");
  const [customMapping, setCustomMapping] = useState(null);
  const [selectedOptionId, setSelectedOptionId] = useState("");
  const [localFunctionNote, setLocalFunctionNote] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [supportingOpen, setSupportingOpen] = useState(false);

  const saveControllerRef = useRef(createMatrixSaveController());
  const bundleRef = useRef(bundle);
  bundleRef.current = bundle;

  const cell = bundle.cells[cellIndex];
  const derived = useMemo(() => derivePatternOptions(bundle), [bundle]);
  const recommendations = useMemo(
    () => selectPrimaryPatternRecommendations(derived, bundle),
    [derived, bundle]
  );

  const presentation = useMemo(
    () =>
      getMatrixPresentationModel({
        stage,
        bundle,
        cellIndex,
        microtask,
        localFunctionNote,
      }),
    [stage, bundle, cellIndex, microtask, localFunctionNote]
  );

  const situationForCell = useMemo(() => {
    const s = summary || getSituationSummaryOrFallback(null).summary;
    return cell?.sourceType === "letter" ? s.letter : s.speech;
  }, [summary, cell]);

  const cellEvidence = useMemo(
    () =>
      filterEvidenceForCell(evidence, {
        sourceType: cell?.sourceType,
        appeal: cell?.appeal,
      }),
    [evidence, cell]
  );

  const evidenceRecovery = useMemo(
    () =>
      getMissingEvidenceRecovery({
        cell,
        matchingEvidenceCount: cellEvidence.length,
      }),
    [cell, cellEvidence.length]
  );

  const workingCell = useMemo(
    () => ({
      ...cell,
      functionNote:
        microtask === "function" ? localFunctionNote : cell?.functionNote || "",
    }),
    [cell, microtask, localFunctionNote]
  );

  const evidenceArgumentRecords = useMemo(
    () =>
      (Array.isArray(evidence) ? evidence : [])
        .map((row) =>
          toEvidenceArgumentRecord(row, {
            selectedDirectionId: selectedOptionId || null,
          })
        )
        .filter(Boolean),
    [evidence, selectedOptionId]
  );

  const directionDescriptor = useMemo(
    () =>
      buildEvidenceArgumentDirectionDescriptor({
        optionId: selectedOptionId,
        matrixBundle: bundle,
        customMapping,
        customLabel: customPattern,
      }),
    [selectedOptionId, bundle, customMapping, customPattern]
  );

  // Rebuilt pairing (including incomplete custom mapping UI) only when rollout mode is on.
  const showEvidencePairPanel =
    isEvidenceToArgumentSliceModeEnabled() &&
    (selectedOptionId === "student_created" ||
      isEvidenceToArgumentSliceEnabled({
        optionId: selectedOptionId,
        customMapping,
      }));

  useEffect(() => {
    if (status !== "authenticated" || !email) return;
    let cancelled = false;

    async function load() {
      try {
        const [bundleRes, guidedRes, tchartRes] = await Promise.all([
          fetch("/api/module2/artifact-bundle"),
          fetch("/api/module2/observations/guided"),
          fetch("/api/tchart/entries"),
        ]);

        const bundleJson = await bundleRes.json().catch(() => ({}));
        const guidedJson = guidedRes.ok
          ? await guidedRes.json().catch(() => ({}))
          : {};
        const guidedRows =
          guidedJson?.ok && Array.isArray(guidedJson.data)
            ? guidedJson.data
            : [];
        const tchartJson = tchartRes.ok
          ? await tchartRes.json().catch(() => ({}))
          : {};
        const tchartRows = Array.isArray(tchartJson?.data)
          ? tchartJson.data
          : [];

        if (cancelled) return;

        setEvidence(
          normalizeEvidenceReader({ tchartRows, guidedRows })
        );

        const loaded = readMatrixBundle(bundleJson?.matrixBundle);
        if (loaded) {
          setBundle(loaded);
          if (loaded.selectedPattern) {
            setSelectedOptionId(loaded.selectedPattern.optionId || "");
            if (loaded.selectedPattern.kind === "student_created") {
              setCustomPattern(loaded.selectedPattern.label || "");
            }
            if (loaded.selectedPattern.customMapping) {
              setCustomMapping(loaded.selectedPattern.customMapping);
            }
          }

          const hasAnyProgress =
            loaded.cells.some((c) => c.rating != null) ||
            loaded.selectedPattern ||
            String(loaded.audiencePurposeReasoning || "").trim();

          if (hasAnyProgress) {
            const resume = resolveMatrixResumeTarget(loaded);
            setStage(resume.stage);
            setCellIndex(resume.cellIndex);
            setMicrotask(resume.microtask);
            const resumeCell = loaded.cells[resume.cellIndex];
            setLocalFunctionNote(resumeCell?.functionNote || "");
          }
        }

        const { summary: s, fromLegacyFallback } =
          getSituationSummaryOrFallback(bundleJson?.summary);
        setSummary(s);
        setFromLegacySummary(fromLegacyFallback);
        setHydrated(true);
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || "Could not load matrix.");
          setHydrated(true);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [status, email]);

  useEffect(() => {
    if (microtask === "function" && cell) {
      setLocalFunctionNote(cell.functionNote || "");
    }
  }, [cellIndex, microtask]); // eslint-disable-line react-hooks/exhaustive-deps

  const persistBundle = async (nextBundle) => {
    const res = await fetch("/api/module2/artifact-bundle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matrixBundle: nextBundle }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json?.ok) {
      return {
        ok: false,
        error: json?.error || "Could not save your matrix. Please try again.",
        bundle: nextBundle,
      };
    }
    return { ok: true, bundle: nextBundle };
  };

  /**
   * Persist exact latest cell state, then optionally advance.
   * Always returns { ok, stale, advanced, error } — callers must branch on it.
   * Local typing does not call this.
   */
  const saveCellAndMaybeAdvance = async ({
    patch,
    afterSuccess,
  }) => {
    setError("");
    setSaving(true);

    const current = bundleRef.current;
    const applied = applyMatrixCellPatchViaUiPath({
      bundle: current,
      cellId: current.cells[cellIndex].id,
      patch,
    });

    // Optimistic local update with latest patch
    setBundle(applied.bundle);
    bundleRef.current = applied.bundle;

    const result = await saveControllerRef.current.saveForTransition(
      async () => persistBundle(applied.bundle)
    );

    if (!saveControllerRef.current.isBusy()) {
      setSaving(false);
    }

    const normalized = {
      ok: Boolean(result?.ok),
      stale: Boolean(result?.stale),
      advanced: false,
      error: result?.error || null,
      bundle: applied.bundle,
      ticket: result?.ticket || null,
    };

    if (normalized.stale) {
      return normalized;
    }

    if (!normalized.ok) {
      setError(
        normalized.error || "Could not save your matrix. Please try again."
      );
      return normalized;
    }

    if (
      saveControllerRef.current.shouldApplyRemoteResult(
        result.ticket?.revision
      )
    ) {
      setBundle(applied.bundle);
      bundleRef.current = applied.bundle;
    }

    // Persist succeeded. Navigation only via afterSuccess and explicit result.
    if (afterSuccess) {
      if (mayNavigateAfterSave(result)) {
        afterSuccess(applied.bundle);
        normalized.advanced = true;
      }
      return normalized;
    }

    // Persist-only transitions (Back, open cell, evidence route): ok, not advanced
    normalized.advanced = false;
    normalized.ok = true;
    return normalized;
  };

  const handleOrientationContinue = () => {
    setStage(MATRIX_FLOW_STAGES.CELL);
    setCellIndex(0);
    setMicrotask("rate");
  };

  const selectRatingLocally = (value) => {
    const rating = normalizeRating(value);
    if (!rating.valid) return;
    // Local-only until Continue
    setBundle((prev) => {
      const soft = {
        ...prev,
        cells: prev.cells.map((c, i) =>
          i === cellIndex
            ? {
                ...c,
                rating: rating.value,
                explicitNoEvidence:
                  rating.value === 0 ? c.explicitNoEvidence : false,
                evidenceIds: rating.value === 0 ? [] : c.evidenceIds || [],
              }
            : c
        ),
      };
      bundleRef.current = soft;
      return soft;
    });
  };

  const toggleEvidenceLocally = (evidenceId) => {
    const rating = normalizeRating(cell.rating);
    if (rating.valid && rating.value === 0) return;
    setBundle((prev) => {
      const current = prev.cells[cellIndex];
      const set = new Set(current.evidenceIds || []);
      if (set.has(evidenceId)) set.delete(evidenceId);
      else set.add(evidenceId);
      const soft = {
        ...prev,
        cells: prev.cells.map((c, i) =>
          i === cellIndex
            ? {
                ...c,
                evidenceIds: [...set],
                explicitNoEvidence: false,
              }
            : c
        ),
      };
      bundleRef.current = soft;
      return soft;
    });
  };

  const setExplicitNoneLocally = () => {
    setBundle((prev) => {
      const soft = {
        ...prev,
        cells: prev.cells.map((c, i) =>
          i === cellIndex
            ? { ...c, explicitNoEvidence: true, evidenceIds: [] }
            : c
        ),
      };
      bundleRef.current = soft;
      return soft;
    });
  };

  const advanceAfterCellPersist = (savedBundle) => {
    const c = savedBundle.cells[cellIndex];
    if (microtask === "rate") {
      setMicrotask("evidence");
      return;
    }
    if (microtask === "evidence") {
      setLocalFunctionNote(c.functionNote || "");
      setMicrotask("function");
      return;
    }

    // function complete
    const pairIndex = Math.floor(cellIndex / 2);
    if (cellIndex % 2 === 1 && isPairComplete(savedBundle, pairIndex)) {
      setStage(MATRIX_FLOW_STAGES.PAIR_PAUSE);
      return;
    }
    if (cellIndex < 5) {
      const nextIndex = cellIndex + 1;
      setCellIndex(nextIndex);
      const nextMicro =
        getFirstIncompleteMicrotask(savedBundle.cells[nextIndex]) || "rate";
      setMicrotask(nextMicro);
      setLocalFunctionNote(savedBundle.cells[nextIndex]?.functionNote || "");
      return;
    }
    setStage(MATRIX_FLOW_STAGES.REVIEW);
  };

  const handleContinue = async () => {
    if (microtask === "function") {
      if (!canAdvanceMicrotask(workingCell, "function")) return;
      const result = await saveCellAndMaybeAdvance({
        patch: { functionNote: localFunctionNote },
        afterSuccess: advanceAfterCellPersist,
      });
      if (!result.ok || result.stale || !result.advanced) return;
      return;
    }

    if (microtask === "rate") {
      if (!canAdvanceMicrotask(cell, "rate")) return;
      const result = await saveCellAndMaybeAdvance({
        patch: {
          rating: cell.rating,
          evidenceIds: cell.evidenceIds || [],
          explicitNoEvidence: Boolean(cell.explicitNoEvidence),
        },
        afterSuccess: advanceAfterCellPersist,
      });
      if (!result.ok || result.stale || !result.advanced) return;
      return;
    }

    if (microtask === "evidence") {
      if (!canAdvanceMicrotask(cell, "evidence")) return;
      const result = await saveCellAndMaybeAdvance({
        patch: {
          evidenceIds: cell.evidenceIds || [],
          explicitNoEvidence: Boolean(cell.explicitNoEvidence),
          rating: cell.rating,
        },
        afterSuccess: advanceAfterCellPersist,
      });
      if (!result.ok || result.stale || !result.advanced) return;
    }
  };

  const goBack = async () => {
    // Persist local function note before leaving if it changed and is non-empty
    if (
      microtask === "function" &&
      localFunctionNote !== (cell?.functionNote || "") &&
      localFunctionNote.trim()
    ) {
      const result = await saveCellAndMaybeAdvance({
        patch: { functionNote: localFunctionNote },
      });
      // Branch on explicit save result — never React error state
      if (!result.ok || result.stale) {
        return;
      }
    }

    if (stage === MATRIX_FLOW_STAGES.CELL && microtask === "function") {
      setMicrotask("evidence");
      return;
    }
    if (stage === MATRIX_FLOW_STAGES.CELL && microtask === "evidence") {
      setMicrotask("rate");
      return;
    }
    if (stage === MATRIX_FLOW_STAGES.CELL && cellIndex > 0) {
      const prevIndex = cellIndex - 1;
      setCellIndex(prevIndex);
      setMicrotask("function");
      setLocalFunctionNote(bundleRef.current.cells[prevIndex]?.functionNote || "");
      return;
    }
    if (stage === MATRIX_FLOW_STAGES.PAIR_PAUSE) {
      setStage(MATRIX_FLOW_STAGES.CELL);
      return;
    }
    if (stage === MATRIX_FLOW_STAGES.REVIEW) {
      setStage(MATRIX_FLOW_STAGES.CELL);
      setCellIndex(5);
      setMicrotask("function");
      setLocalFunctionNote(bundleRef.current.cells[5]?.functionNote || "");
      return;
    }
    if (stage === MATRIX_FLOW_STAGES.PATTERN) {
      setStage(MATRIX_FLOW_STAGES.REVIEW);
      return;
    }
    if (stage === MATRIX_FLOW_STAGES.REASONING) {
      setStage(MATRIX_FLOW_STAGES.PATTERN);
      return;
    }
    if (stage === MATRIX_FLOW_STAGES.CELL) {
      setStage(MATRIX_FLOW_STAGES.ORIENTATION);
    }
  };

  const openCompletedCellForEdit = async (index) => {
    // Preserve any in-progress function note first
    if (
      microtask === "function" &&
      localFunctionNote !== (cell?.functionNote || "")
    ) {
      const result = await saveCellAndMaybeAdvance({
        patch: { functionNote: localFunctionNote },
      });
      if (!result.ok || result.stale) {
        return;
      }
    }
    setCellIndex(index);
    const target = bundleRef.current.cells[index];
    const micro = getFirstIncompleteMicrotask(target) || "rate";
    setMicrotask(micro);
    setLocalFunctionNote(target?.functionNote || "");
    setStage(MATRIX_FLOW_STAGES.CELL);
  };

  const handleSelectPattern = async () => {
    if (
      !canContinuePatternSelection({
        selectedOptionId,
        customLabel: customPattern,
      })
    ) {
      return;
    }

    const option =
      recommendations.primary.find((o) => o.id === selectedOptionId) ||
      (selectedOptionId === "student_created"
        ? recommendations.custom
        : recommendations.supporting.find((o) => o.id === selectedOptionId));

    const selected = {
      ...buildSelectedPattern({
        option: option || recommendations.custom,
        customLabel: customPattern,
        derived,
      }),
      ...(selectedOptionId === "student_created" && customMapping
        ? { customMapping }
        : {}),
    };

    let next = {
      ...bundleRef.current,
      selectedPattern: selected,
      updatedAt: new Date().toISOString(),
    };
    next = clearDependencyReview(next);
    next = { ...next, selectedPattern: selected };

    setSaving(true);
    setError("");
    const result = await saveControllerRef.current.saveForTransition(() =>
      persistBundle(next)
    );
    if (!saveControllerRef.current.isBusy()) {
      setSaving(false);
    }

    if (!mayNavigateAfterSave(result)) {
      if (!result.stale) {
        setError(
          result.error || "Could not save your matrix. Please try again."
        );
      }
      return;
    }

    setBundle(next);
    bundleRef.current = next;
    setStage(MATRIX_FLOW_STAGES.REASONING);
  };

  const handleSaveReasoning = async () => {
    if (!reasoningMeetsThreshold(bundle.audiencePurposeReasoning)) return;
    const next = {
      ...clearDependencyReview(bundleRef.current),
      audiencePurposeReasoning: bundle.audiencePurposeReasoning,
      updatedAt: new Date().toISOString(),
    };
    setSaving(true);
    setError("");
    const result = await saveControllerRef.current.saveForTransition(() =>
      persistBundle(next)
    );
    if (!saveControllerRef.current.isBusy()) {
      setSaving(false);
    }
    if (!mayNavigateAfterSave(result)) {
      if (!result.stale) {
        setError(
          result.error || "Could not save your matrix. Please try again."
        );
      }
      return;
    }
    setBundle(next);
    bundleRef.current = next;
    setStage(MATRIX_FLOW_STAGES.COMPLETE);
    router.push("/modules/2/success");
  };

  const cue = contradictoryChoiceCue(
    [...recommendations.primary, recommendations.custom].find(
      (o) => o.id === selectedOptionId
    ),
    derived
  );

  if (status === "loading" || !hydrated) {
    return (
      <ModulePageShell>
        <p className="p-4 text-text-muted">Loading your rhetorical matrix…</p>
      </ModulePageShell>
    );
  }

  if (!email) {
    return (
      <ModulePageShell>
        <p className="p-4 text-text-muted">Please sign in.</p>
      </ModulePageShell>
    );
  }

  const workspacePresentation = resolveTaskWorkspacePresentation({
    moduleNumber: 2,
    taskHeading:
      stage === MATRIX_FLOW_STAGES.CELL
        ? presentation.dominantQuestion
        : "How to rate rhetorical centrality",
    desktopWidthIntent: "single",
  });

  return (
    <ModulePageShell>
      <WorkspaceColumns
        variant="drafting"
        className="gap-5 xl:gap-8"
        data-task-workspace-foundation="true"
        data-task-workspace-contract={workspacePresentation.journeyStageId}
        data-testid="task-workspace-frame"
      >
        <WorkspaceSidebar className="opacity-80 lg:col-span-1">
          <aside
            className="space-y-4 rounded-xl bg-surface-soft/70 px-4 py-5 text-left"
            data-task-workspace-region="shelf"
            data-instructional-color-role="reference"
          >
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-text-muted">
              Module 2
            </p>
            <p className="text-sm font-semibold text-text-primary">
              Rhetorical matrix
            </p>
            <p
              className="text-sm text-text-primary"
              aria-live="polite"
              data-testid="matrix-progress-label"
            >
              {stage === MATRIX_FLOW_STAGES.CELL
                ? presentation.progressLabel
                : stage.replace(/_/g, " ")}
            </p>
            {stage === MATRIX_FLOW_STAGES.CELL ? (
              <ProgressDots
                total={6}
                activeStep={cellIndex + 1}
                label="Cells"
              />
            ) : null}
            <div className="hidden lg:block">
              <MatrixStrip
                cells={bundle.cells}
                activeIndex={
                  stage === MATRIX_FLOW_STAGES.CELL ? cellIndex : -1
                }
                onSelectCompleted={openCompletedCellForEdit}
              />
            </div>
          </aside>
        </WorkspaceSidebar>

        <WorkspaceCenter className="min-w-0 overflow-x-hidden">
          <div className="space-y-5 max-w-full">
            <div className="lg:hidden">
              <MatrixStrip
                cells={bundle.cells}
                activeIndex={
                  stage === MATRIX_FLOW_STAGES.CELL ? cellIndex : -1
                }
                onSelectCompleted={openCompletedCellForEdit}
              />
            </div>

            {error ? (
              <p
                className="text-sm font-semibold text-red-700"
                role="alert"
                data-testid="matrix-save-error"
              >
                {error}
              </p>
            ) : null}

            {bundle.reviewState?.dependentsNeedReview ? (
              <Card
                className="border-theme-orange/40 bg-theme-orange/10"
                data-testid="matrix-needs-review"
              >
                <p className="text-sm font-semibold text-theme-orange">
                  Downstream work may need review
                </p>
                <p className="mt-1 text-sm text-text-primary">
                  A matrix cell changed. Your selected pattern was not
                  auto-rewritten. Review the matrix and reconfirm your pattern
                  before the Module 3 handoff is ready again.
                </p>
              </Card>
            ) : null}

            {stage === MATRIX_FLOW_STAGES.ORIENTATION ? (
              <Card className="border-theme-blue/30 bg-theme-blue/5">
                <h1
                  className={HIERARCHY_TASK_CLASS}
                  data-testid="task-workspace-task"
                  data-hierarchy-level={HIERARCHY_LEVELS.task}
                >
                  How to rate rhetorical centrality
                </h1>
                <p className="mt-2 text-sm text-text-muted">
                  You will give each appeal a provisional score from 0 to 10.
                  Treat nearby scores (such as 7 vs 8) as roughly the same
                  strength—not precise lab measurements. The score captures how
                  central the appeal is for that audience, with evidence—not
                  frequency or writing quality. Scores stay editable.
                </p>
                <ul className="mt-4 space-y-1 text-sm text-text-primary">
                  {RATING_ANCHORS.map((a) => (
                    <li key={a.value}>
                      <strong>{a.value}</strong> — {a.label}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  className="mt-5 min-h-[44px] w-full sm:w-auto rounded bg-theme-blue px-4 py-2 text-white"
                  onClick={handleOrientationContinue}
                  aria-label="Continue to first matrix cell"
                >
                  Start rating
                </button>
              </Card>
            ) : null}

            {stage === MATRIX_FLOW_STAGES.CELL ? (
              <Card
                className="border-theme-blue/35 bg-theme-blue/5"
                data-testid="matrix-active-task"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-theme-blue">
                  Your job right now
                </p>
                <h1
                  className={`mt-2 ${HIERARCHY_TASK_CLASS}`}
                  data-testid="task-workspace-task"
                  data-hierarchy-level={HIERARCHY_LEVELS.task}
                >
                  {presentation.dominantQuestion}
                </h1>
                <p className="sr-only" data-testid="matrix-dominant-question">
                  {presentation.dominantQuestion}
                </p>
                <p className="mt-2 text-sm text-text-muted">
                  {APPEAL_DEFINITIONS[cell.appeal]}
                </p>
                <div
                  className="mt-3 rounded-lg border border-border-soft bg-white/80 px-3 py-2 text-sm"
                  data-task-workspace-region="desk"
                  data-instructional-color-role="student-thinking"
                >
                  <p className="font-medium text-text-primary">
                    {sourceLabel(cell.sourceType)} audience / purpose
                  </p>
                  <p className="text-text-muted">
                    Audience: {situationForCell?.audience}
                  </p>
                  <p className="text-text-muted">
                    Purpose: {situationForCell?.purpose}
                  </p>
                  {fromLegacySummary ? (
                    <p className="mt-1 text-xs text-text-muted">
                      Using curriculum fallback (no saved summary yet).
                    </p>
                  ) : null}
                </div>

                {microtask === "rate" ? (
                  <div className="mt-4 space-y-3" data-testid="matrix-rate-mode">
                    <ul
                      className="rounded-lg border border-border-soft bg-white/90 px-3 py-2 text-sm text-text-primary space-y-1"
                      data-testid="matrix-rating-anchors"
                    >
                      {RATING_ANCHORS.map((a) => (
                        <li key={a.value}>
                          <strong>{a.value}</strong> — {a.label}
                        </li>
                      ))}
                    </ul>
                    <div className="flex flex-wrap gap-2">
                      {Array.from({ length: 11 }, (_, n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => selectRatingLocally(n)}
                          className={`min-h-[44px] min-w-[44px] rounded border px-2 ${
                            cell.rating === n
                              ? "border-theme-blue bg-theme-blue text-white"
                              : "border-border-soft bg-white"
                          }`}
                          aria-label={`Rate ${n} out of 10`}
                          aria-pressed={cell.rating === n}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                {microtask === "evidence" ? (
                  <div
                    className="mt-4 space-y-3"
                    data-testid="matrix-evidence-mode"
                  >
                    <p className="text-sm font-medium">
                      Current rating: {cell.rating}/10
                    </p>
                    {normalizeRating(cell.rating).value === 0 ? (
                      <button
                        type="button"
                        onClick={setExplicitNoneLocally}
                        className={`min-h-[44px] w-full rounded border px-3 py-2 text-left ${
                          cell.explicitNoEvidence
                            ? "border-theme-orange bg-theme-orange/10"
                            : "border-border-soft bg-white"
                        }`}
                        aria-pressed={cell.explicitNoEvidence}
                      >
                        Not meaningfully used — no evidence to link
                      </button>
                    ) : evidenceRecovery.needed ? (
                      <div
                        className="rounded-lg border border-theme-orange/40 bg-theme-orange/10 px-3 py-3 text-sm"
                        data-testid="matrix-missing-evidence-recovery"
                        role="status"
                      >
                        <p>{evidenceRecovery.message}</p>
                        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                          <a
                            href={evidenceRecovery.actions[0].href}
                            className="min-h-[44px] inline-flex items-center justify-center rounded bg-theme-blue px-4 py-2 text-white"
                            onClick={async (e) => {
                              e.preventDefault();
                              const result = await saveCellAndMaybeAdvance({
                                patch: {
                                  rating: cell.rating,
                                  evidenceIds: cell.evidenceIds || [],
                                  explicitNoEvidence: false,
                                },
                              });
                              if (!result.ok || result.stale) {
                                return;
                              }
                              window.location.href =
                                evidenceRecovery.actions[0].href;
                            }}
                          >
                            {evidenceRecovery.actions[0].label}
                          </a>
                          <button
                            type="button"
                            className="min-h-[44px] rounded border-2 border-border-soft bg-white px-4 py-2"
                            onClick={() => setMicrotask("rate")}
                          >
                            {evidenceRecovery.actions[1].label}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <ul className="space-y-2">
                        {cellEvidence.map((item) => {
                          const selected = (cell.evidenceIds || []).includes(
                            item.id
                          );
                          return (
                            <li key={item.id}>
                              <button
                                type="button"
                                onClick={() => toggleEvidenceLocally(item.id)}
                                className={`w-full min-h-[44px] rounded border px-3 py-2 text-left text-sm ${
                                  selected
                                    ? "border-theme-blue bg-theme-blue/10"
                                    : "border-border-soft bg-white"
                                }`}
                                aria-pressed={selected}
                              >
                                <p className="font-medium">
                                  {sourceLabel(item.sourceType)} ·{" "}
                                  {item.appeal || cell.appeal}
                                </p>
                                <p className="mt-1">{item.quotation}</p>
                                <p className="text-text-muted">
                                  {item.studentObservation}
                                </p>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                ) : null}

                {microtask === "function" ? (
                  <div
                    className="mt-4 space-y-2"
                    data-testid="matrix-function-mode"
                  >
                    <textarea
                      className="min-h-[7rem] w-full max-w-full rounded-xl border-2 border-theme-dark/20 px-3 py-2 text-sm"
                      value={localFunctionNote}
                      onChange={(e) => setLocalFunctionNote(e.target.value)}
                      aria-label="Explain the appeal function for this audience"
                    />
                    <p className="text-xs text-text-muted">
                      Write at least 20 characters. Saved when you continue.
                    </p>
                  </div>
                ) : null}

                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={goBack}
                    className="min-h-[44px] rounded border-2 border-border-soft bg-white px-4 py-2"
                    aria-label="Go back"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleContinue}
                    disabled={
                      !canAdvanceMicrotask(workingCell, microtask) || saving
                    }
                    className={`min-h-[44px] w-full sm:w-auto rounded px-4 py-2 text-white ${
                      canAdvanceMicrotask(workingCell, microtask) && !saving
                        ? "bg-theme-blue"
                        : "bg-gray-400"
                    }`}
                    aria-label="Continue matrix microtask"
                    data-testid="matrix-continue"
                  >
                    {saving ? "Saving…" : "Continue"}
                  </button>
                </div>
              </Card>
            ) : null}

            {stage === MATRIX_FLOW_STAGES.PAIR_PAUSE ? (
              <Card className="border-theme-green/30 bg-theme-green/5">
                <h2 className="text-lg font-bold">Speech / Letter pair</h2>
                <p className="mt-2 text-sm text-text-muted">
                  Here are the two ratings you just finished. No new decision
                  yet.
                </p>
                <div className="mt-3 flex flex-wrap gap-3">
                  {[0, 1].map((offset) => {
                    const idx = Math.floor(cellIndex / 2) * 2 + offset;
                    const c = bundle.cells[idx];
                    return (
                      <div
                        key={c.id}
                        className="rounded-lg border border-border-soft bg-white px-3 py-2 text-sm"
                      >
                        {sourceLabel(c.sourceType)} {c.appeal}: {c.rating}/10
                      </div>
                    );
                  })}
                </div>
                <button
                  type="button"
                  className="mt-4 min-h-[44px] w-full sm:w-auto rounded bg-theme-blue px-4 py-2 text-white"
                  onClick={() => {
                    if (cellIndex < 5) {
                      setCellIndex(cellIndex + 1);
                      setMicrotask("rate");
                      setStage(MATRIX_FLOW_STAGES.CELL);
                    } else {
                      setStage(MATRIX_FLOW_STAGES.REVIEW);
                    }
                  }}
                >
                  Continue
                </button>
              </Card>
            ) : null}

            {stage === MATRIX_FLOW_STAGES.REVIEW ? (
              <Card data-testid="matrix-review">
                <h2 className="text-lg font-bold">
                  Completed matrix (read-only until you edit a cell)
                </h2>
                {bundle.reviewState?.dependentsNeedReview ? (
                  <p className="mt-2 text-sm text-theme-orange">
                    Reconfirm a pattern after reviewing changes.
                  </p>
                ) : null}
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {["ethos", "pathos", "logos"].map((appeal) => (
                    <div key={appeal} className="space-y-2">
                      <p className="text-xs font-semibold uppercase text-text-muted">
                        {appeal}
                      </p>
                      {["speech", "letter"].map((sourceType) => {
                        const c = bundle.cells.find(
                          (x) =>
                            x.sourceType === sourceType && x.appeal === appeal
                        );
                        return (
                          <button
                            key={c.id}
                            type="button"
                            className="w-full rounded border border-border-soft bg-white px-2 py-2 text-left text-sm"
                            onClick={() => openCompletedCellForEdit(
                              bundle.cells.findIndex((x) => x.id === c.id)
                            )}
                            aria-label={`Edit ${sourceType} ${appeal}`}
                          >
                            {sourceLabel(sourceType)}: {c.rating}/10
                            <span className="block text-xs text-text-muted">
                              {c.explicitNoEvidence
                                ? "Explicitly no evidence"
                                : `${(c.evidenceIds || []).length} evidence`}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  className="mt-5 min-h-[44px] w-full sm:w-auto rounded bg-theme-blue px-4 py-2 text-white"
                  onClick={() => setStage(MATRIX_FLOW_STAGES.PATTERN)}
                  disabled={!allCellsComplete(bundle)}
                >
                  {bundle.reviewState?.dependentsNeedReview
                    ? "Reconfirm pattern direction"
                    : "Choose a pattern direction"}
                </button>
              </Card>
            ) : null}

            {stage === MATRIX_FLOW_STAGES.PATTERN ? (
              <Card data-testid="matrix-pattern-select">
                <h2 className="text-lg font-bold">
                  Which direction should your essay explore?
                </h2>
                <p className="mt-2 text-sm text-text-muted">
                  Ratings express a reasoned judgment (0–10), not a precise
                  scientific score. You decide the direction — the app does
                  not write your claim or thesis.
                </p>
                {recommendations.interpretation ? (
                  <p
                    className="mt-3 rounded border border-border-soft bg-surface-soft/50 px-3 py-2 text-sm text-text-primary"
                    data-testid="matrix-ratings-interpretation"
                    role="status"
                  >
                    <span className="font-semibold">What your ratings suggest: </span>
                    {recommendations.interpretation}
                  </p>
                ) : null}
                {recommendations.flags?.weakSignal ? (
                  <p className="mt-2 text-sm text-text-muted" role="status">
                    No strong automatic recommendation — choose carefully or
                    write your own direction.
                  </p>
                ) : null}
                <p className="mt-2 text-sm text-text-muted">
                  Up to three primary essay directions. Open additional supported
                  directions if you want another choice.
                </p>
                <ul
                  className="mt-4 space-y-2"
                  data-testid="matrix-primary-options"
                  role="radiogroup"
                  aria-label="Primary essay directions"
                >
                  {recommendations.primary.map((opt) => {
                    const readable = buildReadableProvenance(opt, evidence);
                    return (
                      <li key={opt.id}>
                        <label className="flex min-h-[44px] cursor-pointer gap-2 rounded border border-border-soft bg-white px-3 py-2 text-sm">
                          <input
                            type="radio"
                            name="pattern"
                            checked={selectedOptionId === opt.id}
                            onChange={() => setSelectedOptionId(opt.id)}
                          />
                          <span>
                            <span className="font-semibold">{opt.label}</span>
                            {opt.tiedWith?.length > 1 ? (
                              <span className="mt-1 block text-xs text-theme-orange">
                                Tied with another equally supported direction —
                                either choice is fair.
                              </span>
                            ) : null}
                            <span className="mt-1 block text-text-muted">
                              {readable.readable.why}
                            </span>
                            <span className="mt-1 block text-xs text-text-primary">
                              {readable.readable.ratings
                                .map((r) => r.visibleLabel)
                                .join(" · ")}
                            </span>
                            {readable.readable.evidence.length ? (
                              <span className="mt-1 block text-xs text-text-muted">
                                Evidence:{" "}
                                {readable.readable.evidence
                                  .map((e) => e.visibleLabel)
                                  .join("; ")}
                              </span>
                            ) : null}
                            <span className="sr-only">
                              Internal evidence IDs:{" "}
                              {readable.evidenceIds.join(", ")}
                            </span>
                          </span>
                        </label>
                      </li>
                    );
                  })}
                  <li>
                    <label className="flex min-h-[44px] cursor-pointer gap-2 rounded border border-border-soft bg-white px-3 py-2 text-sm">
                      <input
                        type="radio"
                        name="pattern"
                        checked={selectedOptionId === "student_created"}
                        onChange={() => setSelectedOptionId("student_created")}
                      />
                      <span>
                        <span className="font-semibold">
                          {recommendations.custom.label}
                        </span>
                        <span className="mt-1 block text-text-muted">
                          {recommendations.custom.why}
                        </span>
                      </span>
                    </label>
                  </li>
                </ul>

                {selectedOptionId === "student_created" ? (
                  <input
                    className="mt-3 w-full rounded border border-border-soft px-3 py-2 text-sm"
                    placeholder="Describe the pattern you notice (at least 15 characters)"
                    value={customPattern}
                    onChange={(e) => setCustomPattern(e.target.value)}
                    aria-label="Custom pattern description"
                  />
                ) : null}

                {recommendations.supporting.length ? (
                  <details
                    className="mt-4 rounded border border-border-soft bg-surface-soft/40 px-3 py-2"
                    open={supportingOpen}
                    onToggle={(e) => setSupportingOpen(e.target.open)}
                    data-testid="matrix-supporting-directions"
                  >
                    <summary className="cursor-pointer text-sm font-medium text-text-muted">
                      Additional supported directions and matrix notes
                    </summary>
                    <ul
                      className="mt-2 space-y-2"
                      role="radiogroup"
                      aria-label="Additional essay directions"
                    >
                      {recommendations.supporting.map((opt) => (
                        <li key={opt.id}>
                          <label className="flex min-h-[44px] cursor-pointer gap-2 rounded border border-border-soft/80 bg-white px-3 py-2 text-sm">
                            <input
                              type="radio"
                              name="pattern"
                              checked={selectedOptionId === opt.id}
                              onChange={() => setSelectedOptionId(opt.id)}
                            />
                            <span>
                              <span className="font-semibold">{opt.label}</span>
                              <span className="mt-1 block text-xs text-text-muted">
                                {opt.why}
                              </span>
                              {opt.observationOnly ? (
                                <span className="mt-1 block text-xs text-text-muted">
                                  Observation note — usually not a full essay
                                  direction by itself.
                                </span>
                              ) : null}
                            </span>
                          </label>
                        </li>
                      ))}
                    </ul>
                  </details>
                ) : null}

                {cue ? (
                  <p
                    className="mt-3 rounded border border-theme-orange/40 bg-theme-orange/10 px-3 py-2 text-sm text-theme-orange"
                    role="status"
                  >
                    {cue.message}
                  </p>
                ) : null}

                {showEvidencePairPanel ? (
                  <RepresentativeDirectionEvidencePanel
                    selectedOptionId={selectedOptionId}
                    evidenceRecords={evidenceArgumentRecords}
                    matrixBundle={bundle}
                    customMapping={customMapping}
                    onCustomMappingChange={setCustomMapping}
                    speechCandidates={evidenceArgumentRecords.filter(
                      (r) =>
                        r.sourceKind === "speech" &&
                        (!directionDescriptor.speechAppeal ||
                          r.rhetoricalChoice === directionDescriptor.speechAppeal)
                    )}
                    letterCandidates={evidenceArgumentRecords.filter(
                      (r) =>
                        r.sourceKind === "letter" &&
                        (!directionDescriptor.letterAppeal ||
                          r.rhetoricalChoice === directionDescriptor.letterAppeal)
                    )}
                    onReplaceSpeechId={(id) => {
                      const appeal = directionDescriptor.speechAppeal;
                      if (!appeal) {
                        setCustomMapping((prev) => ({
                          ...(prev || {}),
                          speechEvidenceId: id,
                        }));
                        return;
                      }
                      setBundle((prev) => {
                        const cells = prev.cells.map((c) =>
                          c.sourceType === "speech" && c.appeal === appeal
                            ? { ...c, evidenceIds: id ? [id] : [] }
                            : c
                        );
                        return { ...prev, cells };
                      });
                    }}
                    onReplaceLetterId={(id) => {
                      const appeal = directionDescriptor.letterAppeal;
                      if (!appeal) {
                        setCustomMapping((prev) => ({
                          ...(prev || {}),
                          letterEvidenceId: id,
                        }));
                        return;
                      }
                      setBundle((prev) => {
                        const cells = prev.cells.map((c) =>
                          c.sourceType === "letter" && c.appeal === appeal
                            ? { ...c, evidenceIds: id ? [id] : [] }
                            : c
                        );
                        return { ...prev, cells };
                      });
                    }}
                  />
                ) : null}

                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={goBack}
                    className="min-h-[44px] rounded border-2 px-4 py-2"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    disabled={
                      !canContinuePatternSelection({
                        selectedOptionId,
                        customLabel: customPattern,
                      }) || saving
                    }
                    onClick={handleSelectPattern}
                    className="min-h-[44px] w-full sm:w-auto rounded bg-theme-blue px-4 py-2 text-white disabled:bg-gray-400"
                  >
                    Continue
                  </button>
                </div>
              </Card>
            ) : null}

            {stage === MATRIX_FLOW_STAGES.REASONING ? (
              <Card data-testid="matrix-reasoning">
                <h2 className="text-lg font-bold">
                  Why does this direction make sense for these audiences and
                  purposes?
                </h2>
                <p className="mt-2 text-sm text-text-muted">
                  Selected: {bundle.selectedPattern?.label}
                </p>
                <textarea
                  className="mt-3 min-h-[7rem] w-full rounded-xl border-2 px-3 py-2 text-sm"
                  value={bundle.audiencePurposeReasoning || ""}
                  onChange={(e) =>
                    setBundle((prev) => {
                      const next = {
                        ...prev,
                        audiencePurposeReasoning: e.target.value,
                      };
                      bundleRef.current = next;
                      return next;
                    })
                  }
                  aria-label="Audience and purpose reasoning"
                />
                <button
                  type="button"
                  disabled={
                    !reasoningMeetsThreshold(bundle.audiencePurposeReasoning) ||
                    saving
                  }
                  onClick={handleSaveReasoning}
                  className="mt-4 min-h-[44px] w-full sm:w-auto rounded bg-theme-blue px-4 py-2 text-white disabled:bg-gray-400"
                >
                  {saving ? "Saving…" : "Save and continue to Module 2 success"}
                </button>
              </Card>
            ) : null}

            {stage === MATRIX_FLOW_STAGES.COMPLETE ? (
              <Card>
                <h2 className="text-lg font-bold text-theme-green">
                  Matrix handoff ready
                </h2>
                <p className="mt-2 text-sm">
                  Pattern: {bundle.selectedPattern?.label}
                </p>
                <button
                  type="button"
                  className="mt-4 min-h-[44px] rounded bg-theme-blue px-4 py-2 text-white"
                  onClick={() => router.push("/modules/2/success")}
                >
                  Continue
                </button>
              </Card>
            ) : null}

            <p className="sr-only">
              Layout contract viewports:{" "}
              {MATRIX_LAYOUT_CONTRACT.viewports.join(", ")}
            </p>
          </div>
        </WorkspaceCenter>

        <WorkspaceGuide className="opacity-90">
          <aside className="space-y-4 rounded-xl bg-surface-soft/70 px-5 py-5 text-left">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-text-muted">
              From your teacher
            </p>
            <p className="text-sm text-text-primary">
              Rate how central each appeal is for persuading that audience. Link
              evidence. Then explain the job the appeal does. One decision at a
              time. Your work saves when you continue.
            </p>
          </aside>
        </WorkspaceGuide>
      </WorkspaceColumns>
    </ModulePageShell>
  );
}
