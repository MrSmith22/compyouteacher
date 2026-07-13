"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { logActivity } from "../lib/logActivity";
import { requireModuleAccess } from "@/lib/supabase/helpers/moduleGate";
import { MLK_ASSIGNMENT_NAME, mlkRhetoricalAnalysisAssignment } from "@/lib/assignments";
import {
  getModule6DraftRow,
  getOutlineRow,
  getParagraphPlanRow,
  getTChartEntriesRows,
} from "@/lib/artifacts/readArtifactsClient";
import { upsertModule6DraftArtifact } from "@/lib/artifacts/writeArtifacts";
import { parseApiResponse } from "@/lib/api/clientFetch";
import ModuleSixStepFrame from "@/components/module6/ModuleSixStepFrame";
import ModulePageShell from "@/components/layout/ModulePageShell";
import { WorkingSetSection } from "@/components/module3/ModuleThreeDeskFrame";
import ModuleSixReferenceShelf from "@/components/module6/ModuleSixReferenceShelf";
import InfoCallout from "@/components/ui/InfoCallout";
import {
  getWritingSectionLabel,
  getModule6StepPresentation,
  SECTION_TYPES,
} from "@/components/module6/module6StepPresentation";
import {
  buildModule6UiStages,
  buildModule5DraftSourceSignature,
  createEmptyDraftSections,
  expectedProseSectionCount,
  resolveModule6OutlineChangeReview,
  bodyJobSentence,
  CPG_LAYOUT_CONTRACT,
  MODULE6_DRAFT_STAGE,
  alignDraftSectionsToExpected,
} from "@/lib/module6/draftOutlineMapping";
import {
  MODULE6_DRAFT_READ_STATE,
  MODULE6_DRAFT_READ_ERROR,
  MODULE6_OUTLINE_READ_ERROR,
  MODULE6_OUTLINE_UNFINALIZED,
  resolveModule6OutlineReadState,
  resolveModule6DraftReadState,
  shouldAllowModule6DraftWrites,
  normalizeModule6DraftMeta,
  createDefaultModule6DraftMeta,
} from "@/lib/module6/draftHydrationHelpers";
import {
  MODULE6_WRITE_ACTION,
  createDraftWriteController,
  createHydrationDraftAutosaveGate,
  draftContentSignature,
  shouldAutosaveDraft,
  evaluateSectionReadiness,
  evaluateForwardNavigationGate,
  resolveLiveDraftSections,
  evaluateDraftFinalizeReadiness,
  wordCount,
  deriveModule6FullText,
} from "@/lib/module6/draftPersistenceHelpers";

const DRAFT_TEXTAREA_CLASS =
  "min-h-[min(420px,52vh)] w-full max-w-full resize-y rounded-xl border-2 border-theme-dark/20 bg-white px-4 py-4 text-base leading-7 text-text-primary shadow-soft focus:border-theme-blue/50 focus:outline-none focus:ring-2 focus:ring-theme-blue/20 disabled:cursor-not-allowed disabled:opacity-60";

export default function ModuleSix() {
  const { data: session } = useSession();
  const router = useRouter();

  const [outline, setOutline] = useState(null);
  const [outlineLoading, setOutlineLoading] = useState(true);
  const [readState, setReadState] = useState(MODULE6_DRAFT_READ_STATE.PENDING);
  const [readError, setReadError] = useState("");
  const [hydrateAttempt, setHydrateAttempt] = useState(0);

  const [observations, setObservations] = useState([]);
  const [paragraphPlans, setParagraphPlans] = useState([]);
  const [proofPlan, setProofPlan] = useState([]);
  const [thesisText, setThesisText] = useState("");

  const [draft, setDraft] = useState([]);
  const [draftMeta, setDraftMeta] = useState(null);
  const [locked, setLocked] = useState(false);
  const [uiStageIndex, setUiStageIndex] = useState(0);
  const [hydrationReady, setHydrationReady] = useState(false);
  const [outlineReview, setOutlineReview] = useState(null);

  const [gateBlocked, setGateBlocked] = useState(false);
  const [navBusy, setNavBusy] = useState(false);
  const [navError, setNavError] = useState("");
  const [finalizeError, setFinalizeError] = useState("");
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [sectionGateMessage, setSectionGateMessage] = useState("");

  const hasLoggedStartRef = useRef(false);
  const loadGenerationRef = useRef(0);
  const studentDirtyRef = useRef(false);
  const lastPostedSignatureRef = useRef(null);
  const autosaveTimerRef = useRef(null);
  const persistEpochRef = useRef(0);
  const draftSnapshotRef = useRef({ sections: [], meta: null });
  const draftRevisionRef = useRef(0);
  const writeControllerRef = useRef(createDraftWriteController());
  const deskFocusRef = useRef(null);

  const uiStages = useMemo(
    () => (outline ? buildModule6UiStages(outline) : []),
    [outline]
  );
  const proseStageCount = useMemo(
    () => uiStages.filter((s) => s.type !== MODULE6_DRAFT_STAGE.REVIEW).length,
    [uiStages]
  );
  const currentStep = uiStages[uiStageIndex] ?? uiStages[0] ?? null;
  const isReviewStage = currentStep?.type === MODULE6_DRAFT_STAGE.REVIEW;

  const presentation = useMemo(() => {
    if (isReviewStage) {
      return {
        question: "Is each section ready for revision?",
        whyMatters: [
          "A quick whole-draft check catches empty sections before you leave Module 6.",
          "You are not grading style here—only confirming every required section has prose.",
        ],
        coachingMessage:
          "Scan each section. Use Edit to return to a section that needs more writing.",
        nextStepText: "When every section has prose, finish your draft and continue to revision.",
        jobRightNow: {
          lead: "Review your draft as a whole.",
          steps: [
            "Confirm introduction, each body paragraph, and conclusion have writing.",
            "Edit any empty section before you finish.",
          ],
        },
        workingSetLabel: "Whole-draft review",
        workingSetDescription: "Check section readiness, then finish when ready.",
      };
    }
    return getModule6StepPresentation(currentStep, outline);
  }, [currentStep, outline, isReviewStage]);

  const assignmentQuestion = mlkRhetoricalAnalysisAssignment.essentialQuestion;

  const writesAllowed = shouldAllowModule6DraftWrites({
    readState,
    hydrationReady,
    locked,
    outlineReviewBlocksWrites: Boolean(
      outlineReview?.required && !draftMeta?.outlineReviewAcknowledged
    ),
  });

  const buildMetaPayload = useCallback(
    (overrides = {}) =>
      normalizeModule6DraftMeta({
        ...(draftMeta || {}),
        ...overrides,
        sourceOutlineSignature:
          overrides.sourceOutlineSignature ??
          draftMeta?.sourceOutlineSignature ??
          buildModule5DraftSourceSignature(outline || {}),
      }),
    [draftMeta, outline]
  );

  const getDraftMetrics = useCallback(() => {
    const sectionWordCounts = draft.map((s) => wordCount(s));
    return {
      sectionCount: draft.length,
      sectionWordCounts,
      totalWords: sectionWordCounts.reduce((a, b) => a + b, 0),
    };
  }, [draft]);

  useEffect(() => {
    draftSnapshotRef.current = {
      sections: draft,
      meta: draftMeta,
    };
  }, [draft, draftMeta]);

  // Hydration — zero writes on success alone
  useEffect(() => {
    const loadData = async () => {
      const email = session?.user?.email;
      if (!email) return;

      const generation = ++loadGenerationRef.current;
      setHydrationReady(false);
      setReadState(MODULE6_DRAFT_READ_STATE.PENDING);
      setReadError("");
      setOutlineReview(null);
      setGateBlocked(false);
      setOutlineLoading(true);

      const { ok } = await requireModuleAccess({
        userEmail: email,
        assignmentName: MLK_ASSIGNMENT_NAME,
        minModule: 6,
      });
      if (generation !== loadGenerationRef.current) return;

      if (!ok) {
        setGateBlocked(true);
        setOutlineLoading(false);
        setHydrationReady(true);
        return;
      }

      let outlineGet = { ok: false, networkError: false, data: null };
      try {
        const outlineResult = await getOutlineRow(5);
        if (outlineResult.ok) {
          outlineGet = { ok: true, data: outlineResult.data ?? null };
        } else {
          outlineGet = { ok: false, data: null };
        }
      } catch {
        outlineGet = { ok: false, networkError: true, data: null };
      }
      if (generation !== loadGenerationRef.current) return;

      const outlineClassified = resolveModule6OutlineReadState(outlineGet);
      if (outlineClassified.state !== "outline_ready") {
        setReadState(outlineClassified.state);
        setReadError(outlineClassified.message || MODULE6_OUTLINE_READ_ERROR);
        setOutline(null);
        setDraft([]);
        setOutlineLoading(false);
        setHydrationReady(true);
        return;
      }

      const outlineRow = outlineClassified.outlineRow;
      const nextOutline = outlineRow.outline;
      setOutline(nextOutline);
      setThesisText(String(nextOutline?.thesis || "").trim());
      setOutlineLoading(false);

      if (!hasLoggedStartRef.current) {
        hasLoggedStartRef.current = true;
        logActivity(email, "module_started", { module: 6, hasOutline: true });
      }

      const [obsResult, draftResult, planResult] = await Promise.all([
        getTChartEntriesRows(),
        getModule6DraftRow(),
        getParagraphPlanRow(),
      ]);
      if (generation !== loadGenerationRef.current) return;

      if (obsResult.ok) setObservations(obsResult.data || []);
      if (planResult.ok && Array.isArray(planResult.data?.buckets)) {
        setParagraphPlans(planResult.data.buckets);
      }

      try {
        const thesisRes = await fetch("/api/module3/thesis");
        const thesisJson = await parseApiResponse(thesisRes);
        const thesisRow = thesisJson?.thesis ?? null;
        if (thesisRow) {
          if (!String(nextOutline?.thesis || "").trim() && thesisRow.thesis) {
            setThesisText(String(thesisRow.thesis).trim());
          }
          if (Array.isArray(thesisRow.proofPlan)) {
            setProofPlan(
              thesisRow.proofPlan
                .map((line) => String(line || "").trim())
                .filter(Boolean)
            );
          }
        }
      } catch {
        // Reference shelf optional
      }
      if (generation !== loadGenerationRef.current) return;

      const draftGet = draftResult.ok
        ? { ok: true, data: draftResult.data ?? null }
        : { ok: false, data: null, networkError: Boolean(draftResult.error) };
      const draftClassified = resolveModule6DraftReadState(draftGet);
      setReadState(draftClassified.state);

      if (draftClassified.state === MODULE6_DRAFT_READ_STATE.DRAFT_READ_FAILED) {
        setReadError(draftClassified.message || MODULE6_DRAFT_READ_ERROR);
        setDraft([]);
        setDraftMeta(null);
        setLocked(false);
        studentDirtyRef.current = false;
        setHydrationReady(true);
        return;
      }

      const sourceSig = buildModule5DraftSourceSignature(nextOutline);
      let nextSections = [];
      let nextMeta = createDefaultModule6DraftMeta({
        sourceOutlineSignature: sourceSig,
      });
      let nextLocked = false;
      let nextRevision = 0;

      if (draftClassified.state === MODULE6_DRAFT_READ_STATE.DRAFT_LOADED) {
        const row = draftClassified.draftRow;
        nextSections = (row.sections || []).map((s) => String(s ?? ""));
        nextLocked = row.locked === true;
        nextRevision =
          typeof row.draft_revision === "number" ? row.draft_revision : 0;
        nextMeta = normalizeModule6DraftMeta(row.draft_meta, {
          sourceOutlineSignature:
            row.draft_meta?.sourceOutlineSignature || sourceSig,
        });

        const review = resolveModule6OutlineChangeReview({
          savedSignature: nextMeta.sourceOutlineSignature,
          currentOutline: nextOutline,
        });
        if (review.required && !nextMeta.outlineReviewAcknowledged) {
          setOutlineReview(review);
          nextMeta = {
            ...nextMeta,
            outlineReviewRequired: true,
          };
        } else {
          setOutlineReview(null);
          // Keep section length stable when no structural review required.
          const expected = expectedProseSectionCount(nextOutline);
          if (
            nextSections.length !== expected &&
            !review.required &&
            nextMeta.sourceOutlineSignature === sourceSig
          ) {
            // Legacy length drift only — do not remap on meaningful change.
            nextSections = alignDraftSectionsToExpected(nextSections, expected);
          }
        }
      } else {
        // Confirmed empty — initialize blank sections locally; no POST yet.
        nextSections = createEmptyDraftSections(nextOutline);
        nextMeta = createDefaultModule6DraftMeta({
          sourceOutlineSignature: sourceSig,
        });
        nextLocked = false;
      }

      if (generation !== loadGenerationRef.current) return;

      setDraft(nextSections);
      setDraftMeta(nextMeta);
      setLocked(nextLocked);
      draftRevisionRef.current = nextRevision;

      const stages = buildModule6UiStages(nextOutline);
      let stageIndex = 0;
      if (nextMeta.currentStageId) {
        const found = stages.findIndex((s) => s.id === nextMeta.currentStageId);
        if (found >= 0) stageIndex = found;
      } else if (Number.isInteger(nextMeta.currentSectionIndex)) {
        stageIndex = Math.min(
          nextMeta.currentSectionIndex,
          Math.max(stages.length - 1, 0)
        );
      }
      setUiStageIndex(stageIndex);

      const gate = createHydrationDraftAutosaveGate(nextSections, nextMeta);
      lastPostedSignatureRef.current = gate.lastPostedSignature;
      studentDirtyRef.current = false;
      setHydrationReady(true);
    };

    loadData();
  }, [session, hydrateAttempt]);

  const cancelPendingAutosave = useCallback(() => {
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = null;
    }
    persistEpochRef.current += 1;
  }, []);

  const markDirty = useCallback(() => {
    studentDirtyRef.current = true;
    writeControllerRef.current.noteLocalEdit();
  }, []);

  // Ordered autosave — never sends locked; never writes on hydrate echo
  useEffect(() => {
    if (!session?.user?.email || !hydrationReady || locked) return;
    if (!writesAllowed) return;
    if (!studentDirtyRef.current) return;

    const signature = draftContentSignature(draft, draftMeta);
    if (
      !shouldAutosaveDraft({
        hydrationReady,
        locked,
        writesAllowed,
        signature,
        lastPostedSignature: lastPostedSignatureRef.current,
      })
    ) {
      return;
    }
    if (!writeControllerRef.current.areAutosavesAllowed()) return;

    const scheduledEpoch = persistEpochRef.current;
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);

    autosaveTimerRef.current = setTimeout(() => {
      if (scheduledEpoch !== persistEpochRef.current) return;
      if (!writeControllerRef.current.areAutosavesAllowed()) return;

      const latest = draftSnapshotRef.current;
      const run = writeControllerRef.current.beginAutosave(async () => {
        const result = await upsertModule6DraftArtifact({
          userEmail: session.user.email,
          sections: latest.sections,
          action: MODULE6_WRITE_ACTION.AUTOSAVE,
          draft_meta: latest.meta,
          expected_revision: draftRevisionRef.current,
        });
        if (result.ok && typeof result.revision === "number") {
          draftRevisionRef.current = result.revision;
        }
        return {
          ok: result.ok,
          error: result.error?.message,
          sections: latest.sections,
        };
      }, { sections: latest.sections, meta: latest.meta });

      if (!run) return;
      run.then((outcome) => {
        if (!outcome?.applied) return;
        lastPostedSignatureRef.current = draftContentSignature(
          latest.sections,
          latest.meta
        );
        studentDirtyRef.current = false;
        logActivity(session.user.email, "draft_autosaved", {
          module: 6,
          ...getDraftMetrics(),
        });
      });
    }, 800);

    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
        autosaveTimerRef.current = null;
      }
    };
  }, [
    draft,
    draftMeta,
    session,
    hydrationReady,
    locked,
    writesAllowed,
    getDraftMetrics,
  ]);

  const persistAndNavigateStage = useCallback(
    async (targetIndex, sectionsOverride = null) => {
      if (navBusy || locked || !writesAllowed) {
        return { ok: false, blocked: true };
      }
      setNavBusy(true);
      setNavError("");
      cancelPendingAutosave();

      const sections = sectionsOverride || draft;
      const stage = uiStages[targetIndex];
      if (!stage) {
        setNavBusy(false);
        return { ok: false };
      }

      const nextMeta = buildMetaPayload({
        currentSectionIndex: targetIndex,
        currentStageId: stage.id,
        completedSectionIds: [
          ...new Set([
            ...(draftMeta?.completedSectionIds || []),
            currentStep?.id,
          ].filter(Boolean)),
        ],
      });

      const payload = { sections, meta: nextMeta };
      draftSnapshotRef.current = payload;

      try {
        const run = writeControllerRef.current.beginNavigate(async () => {
          const result = await upsertModule6DraftArtifact({
            userEmail: session?.user?.email,
            sections,
            action: MODULE6_WRITE_ACTION.NAVIGATE,
            draft_meta: nextMeta,
            expected_revision: draftRevisionRef.current,
          });
          if (result.ok && typeof result.revision === "number") {
            draftRevisionRef.current = result.revision;
          }
          return {
            ok: result.ok,
            error: result.error?.message,
            sections,
          };
        }, payload);

        const outcome = run ? await run : { ok: false, blocked: true };
        setNavBusy(false);
        if (!outcome?.ok || !outcome?.applied) {
          setNavError(
            outcome?.error ||
              "Could not save this section. Your writing is still here. Try again."
          );
          return { ok: false };
        }

        persistEpochRef.current += 1;
        lastPostedSignatureRef.current = draftContentSignature(sections, nextMeta);
        studentDirtyRef.current = false;
        setDraftMeta(nextMeta);
        setUiStageIndex(targetIndex);
        setSectionGateMessage("");
        requestAnimationFrame(() => {
          deskFocusRef.current?.focus?.();
        });
        return { ok: true };
      } catch {
        setNavBusy(false);
        setNavError(
          "Could not save this section. Check your connection and try again."
        );
        return { ok: false };
      }
    },
    [
      navBusy,
      locked,
      writesAllowed,
      cancelPendingAutosave,
      draft,
      uiStages,
      buildMetaPayload,
      draftMeta,
      currentStep,
      session,
    ]
  );

  const updateSection = (i, val) => {
    if (locked || !writesAllowed) return;
    markDirty();
    setSectionGateMessage("");
    setDraft((prev) => {
      const copy = [...prev];
      copy[i] = val;
      // Keep a synchronous live snapshot so Keep going can gate on the newest
      // textarea value even before React re-renders.
      draftSnapshotRef.current = {
        sections: copy,
        meta: draftSnapshotRef.current?.meta ?? draftMeta,
      };
      return copy;
    });
  };

  const goBack = async () => {
    if (uiStageIndex <= 0 || navBusy) return;
    const liveSections = resolveLiveDraftSections(
      draftSnapshotRef.current?.sections,
      draft
    );
    await persistAndNavigateStage(uiStageIndex - 1, liveSections);
  };

  const goNext = async () => {
    if (navBusy || locked) return;

    const liveSections = resolveLiveDraftSections(
      draftSnapshotRef.current?.sections,
      draft
    );
    const draftIndex = currentStep?.draftIndex;
    const gate = evaluateForwardNavigationGate({
      sections: liveSections,
      draftIndex,
      isReviewStage,
    });
    if (gate.blocked) {
      setSectionGateMessage(gate.message);
      return;
    }

    if (uiStageIndex >= uiStages.length - 1) return;
    await persistAndNavigateStage(uiStageIndex + 1, liveSections);
  };

  const editFromReview = async (proseIndex) => {
    const target = uiStages.findIndex(
      (s) => s.type !== MODULE6_DRAFT_STAGE.REVIEW && s.draftIndex === proseIndex
    );
    if (target < 0) return;
    await persistAndNavigateStage(target);
  };

  const acknowledgeOutlineReview = () => {
    if (locked) return;
    markDirty();
    const next = buildMetaPayload({
      outlineReviewAcknowledged: true,
      outlineReviewRequired: false,
      sourceOutlineSignature: buildModule5DraftSourceSignature(outline || {}),
    });
    setDraftMeta(next);
    setOutlineReview(null);
  };

  const finalizeDraft = async () => {
    const email = session?.user?.email;
    if (!email || isFinalizing || locked || !writesAllowed) return;

    const expected = expectedProseSectionCount(outline);
    const gate = evaluateDraftFinalizeReadiness({
      sections: draft,
      expectedCount: expected,
    });
    if (!gate.ok) {
      setFinalizeError(gate.message);
      return;
    }

    setFinalizeError("");
    setIsFinalizing(true);
    cancelPendingAutosave();

    const nextMeta = buildMetaPayload({
      currentStageId: "stage-review",
      currentSectionIndex: uiStages.length - 1,
      completedSectionIds: uiStages
        .filter((stage) => stage.type !== MODULE6_DRAFT_STAGE.REVIEW)
        .map((stage) => stage.id),
    });
    const payload = { sections: draft, meta: nextMeta };

    try {
      const outcome = await writeControllerRef.current.finalize({
        payload,
        cancelPendingTimer: cancelPendingAutosave,
        sendFinalize: async (latest) => {
          const result = await upsertModule6DraftArtifact({
            userEmail: email,
            sections: latest.sections,
            action: MODULE6_WRITE_ACTION.FINALIZE,
            draft_meta: latest.meta,
            expected_revision: draftRevisionRef.current,
          });
          if (result.ok && typeof result.revision === "number") {
            draftRevisionRef.current = result.revision;
          }
          return {
            ok: result.ok,
            error: result.error?.message || null,
          };
        },
      });

      if (!outcome?.ok) {
        writeControllerRef.current.unlockAfterFailedFinalize();
        setFinalizeError(
          outcome?.error ||
            "We could not save your draft. Your writing is still here. Try again."
        );
        setIsFinalizing(false);
        return;
      }

      setLocked(true);
      lastPostedSignatureRef.current = draftContentSignature(draft, nextMeta);
      await logActivity(email, "module_completed", {
        module: 6,
        locked: true,
        ...getDraftMetrics(),
      });
      router.push("/modules/6/success");
    } catch {
      writeControllerRef.current.unlockAfterFailedFinalize();
      setFinalizeError(
        "We could not save your draft. Check your connection and try again."
      );
      setIsFinalizing(false);
    }
  };

  if (gateBlocked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-base">
        <p className="text-text-primary">
          Finish earlier modules before you begin drafting here. Complete Module 5 and
          continue from its success page when your outline is ready.
        </p>
      </div>
    );
  }

  if (
    readState === MODULE6_DRAFT_READ_STATE.DRAFT_READ_FAILED ||
    readState === MODULE6_DRAFT_READ_STATE.OUTLINE_READ_FAILED
  ) {
    return (
      <ModulePageShell>
        <div
          className="mx-auto w-full max-w-3xl overflow-x-hidden rounded-lg border border-theme-orange/40 bg-white px-4 py-4"
          role="alert"
          data-testid="module6-draft-read-error"
        >
          <p className="text-sm font-semibold text-theme-dark break-words">
            {readError || MODULE6_DRAFT_READ_ERROR}
          </p>
          <p className="mt-2 text-sm text-theme-dark/85">
            Your saved writing was not changed. Retry before editing or continuing.
          </p>
          <button
            type="button"
            className="mt-3 min-h-[44px] rounded-md border border-theme-orange/40 px-3 text-sm font-semibold"
            data-testid="module6-draft-read-retry"
            onClick={() => setHydrateAttempt((n) => n + 1)}
          >
            Retry
          </button>
        </div>
      </ModulePageShell>
    );
  }

  if (outlineLoading || readState === MODULE6_DRAFT_READ_STATE.PENDING) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-base">
        <p className="text-text-primary">Loading your outline and draft…</p>
      </div>
    );
  }

  if (readState === MODULE6_DRAFT_READ_STATE.OUTLINE_MISSING_OR_UNFINALIZED) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-base">
        <div className="max-w-md space-y-4 px-4 text-center">
          <p className="text-text-primary" role="status">
            {readError || MODULE6_OUTLINE_UNFINALIZED}
          </p>
          <a
            href="/modules/5"
            className="inline-block min-h-[44px] rounded-lg bg-theme-blue px-5 py-2.5 text-sm font-semibold text-white hover:brightness-105"
          >
            Go to Module 5
          </a>
        </div>
      </div>
    );
  }

  if (!outline || !currentStep) {
    return null;
  }

  const draftIndex =
    typeof currentStep.draftIndex === "number" ? currentStep.draftIndex : null;
  const isFirstStage = uiStageIndex === 0;
  const sectionLabel = getWritingSectionLabel(currentStep);

  const activeOutlinePoints =
    currentStep.type === SECTION_TYPES.BODY &&
    Array.isArray(outline?.body?.[currentStep.bodyIndex]?.points)
      ? outline.body[currentStep.bodyIndex].points
          .map((point) => String(point || "").trim())
          .filter(Boolean)
      : [];

  const activeEvidence =
    currentStep.type === SECTION_TYPES.BODY &&
    Array.isArray(outline?.body?.[currentStep.bodyIndex]?.evidence)
      ? outline.body[currentStep.bodyIndex].evidence
      : [];

  const activeReasoning =
    currentStep.type === SECTION_TYPES.BODY
      ? String(outline?.body?.[currentStep.bodyIndex]?.reasoning || "").trim()
      : "";

  const conclusionPlanLines = [];
  if (currentStep.type === SECTION_TYPES.CONCLUSION && outline?.conclusion) {
    const summary = String(outline.conclusion.summary || "").trim();
    const finalThought = String(outline.conclusion.finalThought || "").trim();
    if (summary) conclusionPlanLines.push(`Restate / summarize: ${summary}`);
    if (finalThought) conclusionPlanLines.push(`Final thought: ${finalThought}`);
  }

  const referenceShelf = (
    <ModuleSixReferenceShelf
      assignmentQuestion={assignmentQuestion}
      thesis={thesisText}
      proofPlan={proofPlan}
      outline={outline}
      paragraphPlans={paragraphPlans}
      observations={observations}
      activeStep={currentStep}
    />
  );

  const supportingResources = (
    <div className="space-y-3 text-left">
      {isFirstStage && !locked ? (
        <InfoCallout title="You are not starting over.">
          <p>
            You already figured out what you want to say. Now you help your reader
            understand it—one section at a time.
          </p>
        </InfoCallout>
      ) : null}

      {currentStep.type === SECTION_TYPES.BODY && presentation.organizationalJob ? (
        <div className="rounded-xl border-2 border-theme-orange/35 bg-theme-orange/5 px-4 py-3">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-theme-orange">
            This section&apos;s job
          </p>
          <p className="mt-1 text-sm font-medium text-text-primary">
            {presentation.organizationalJob || bodyJobSentence(currentStep)}
          </p>
          {presentation.paragraphPoint ? (
            <p className="mt-2 text-sm text-text-muted break-words">
              Point: {presentation.paragraphPoint}
            </p>
          ) : null}
        </div>
      ) : null}

      <div
        id="module-6-thesis-card"
        className="rounded-xl border-2 border-theme-blue/40 bg-theme-blue/5 px-4 py-3 shadow-soft"
      >
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-theme-blue">
          {presentation.thesisCardTitle || "Your thesis (already written)"}
        </p>
        {thesisText ? (
          <p className="mt-2 text-sm font-medium leading-relaxed text-text-primary whitespace-pre-wrap">
            {thesisText}
          </p>
        ) : (
          <p className="mt-2 text-sm leading-relaxed text-text-muted">
            Your thesis will appear here once it is saved from planning.
          </p>
        )}
      </div>

      {activeOutlinePoints.length > 0 ||
      activeEvidence.length > 0 ||
      activeReasoning ||
      conclusionPlanLines.length > 0 ||
      presentation.outlineHelpNote ? (
        <div
          id="module-6-outline-card"
          className="rounded-xl border-2 border-theme-green/40 bg-theme-green/5 px-4 py-3 shadow-soft"
        >
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-theme-green">
            {presentation.outlineHelpTitle || "Outline notes for this section"}
          </p>
          {presentation.outlineHelpNote ? (
            <p className="mt-2 text-sm leading-relaxed text-text-muted">
              {presentation.outlineHelpNote}
            </p>
          ) : null}
          {activeOutlinePoints.length > 0 ? (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-text-primary">
              {activeOutlinePoints.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          ) : null}
          {activeEvidence.length > 0 ? (
            <ul className="mt-2 space-y-2 text-sm text-text-primary">
              {activeEvidence.map((ev, i) => (
                <li key={`ev-${i}`} className="break-words">
                  {ev.quote ? <span className="italic">“{ev.quote}”</span> : null}
                  {ev.observation ? (
                    <span className="block text-text-muted">{ev.observation}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : null}
          {activeReasoning ? (
            <p className="mt-2 text-sm text-text-primary break-words">
              Reasoning: {activeReasoning}
            </p>
          ) : null}
          {conclusionPlanLines.length > 0 ? (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-text-primary">
              {conclusionPlanLines.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );

  const reviewBlocks = uiStages
    .filter((s) => s.type !== MODULE6_DRAFT_STAGE.REVIEW)
    .map((step) => {
      const text = draft[step.draftIndex] || "";
      const ready = evaluateSectionReadiness(text).ok;
      return { step, text, ready, words: wordCount(text) };
    });

  return (
    <ModulePageShell>
      <div
        className="w-full overflow-x-hidden"
        data-cpf-layout={CPG_LAYOUT_CONTRACT.viewports.join("-")}
      >
        {outlineReview?.required && !draftMeta?.outlineReviewAcknowledged ? (
          <div
            className="mb-4 rounded-lg border border-theme-orange/40 bg-theme-orange/[0.07] px-4 py-3"
            role="status"
            data-testid="module6-outline-review-notice"
          >
            <p className="text-sm font-semibold text-theme-dark">
              Your Module 5 outline changed after you started drafting
            </p>
            <p className="mt-1 text-sm text-theme-dark/85">
              Your existing draft sections were kept. Nothing was rewritten or
              reordered automatically.
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
              {(outlineReview.changed || []).map((c) => (
                <li key={c.label}>{c.label}</li>
              ))}
            </ul>
            <div className="mt-3 flex flex-wrap gap-2">
              <a
                href="/modules/5"
                className="inline-flex min-h-[44px] items-center rounded-md border border-theme-orange/40 px-3 text-sm font-semibold"
              >
                Review Module 5 outline
              </a>
              <button
                type="button"
                className="min-h-[44px] rounded-md bg-theme-blue px-3 text-sm font-semibold text-white"
                onClick={acknowledgeOutlineReview}
              >
                Keep my draft and continue
              </button>
            </div>
          </div>
        ) : null}

        <ModuleSixStepFrame
          question={presentation.question}
          whyMatters={presentation.whyMatters}
          example={presentation.example}
          successLooksLike={presentation.successLooksLike}
          coachingMessage={presentation.coachingMessage}
          nextStepText={presentation.nextStepText}
          jobRightNow={presentation.jobRightNow}
          supportingResources={supportingResources}
          sidebar={referenceShelf}
        >
          <div className="rounded-lg bg-surface-soft/30 px-3 py-2 text-left">
            <p className="text-[11px] leading-relaxed text-text-muted">
              Module 6 · Draft · step {uiStageIndex + 1} of {uiStages.length}
              {proseStageCount ? ` · ${proseStageCount} writing sections` : ""}.
              One section at a time.
            </p>
            {!locked ? (
              <p className="text-[11px] leading-relaxed text-text-muted/80" aria-live="off">
                Your draft saves as you type.
              </p>
            ) : (
              <p className="text-[11px] font-medium text-theme-green">
                This draft is finished and locked.
              </p>
            )}
          </div>

          {isReviewStage ? (
            <WorkingSetSection
              className="[&>div:last-child]:border-theme-blue/20 [&>div:last-child]:shadow-md"
              label={presentation.workingSetLabel}
              description={presentation.workingSetDescription}
            >
              <div className="space-y-3 text-left" ref={deskFocusRef} tabIndex={-1}>
                {reviewBlocks.map(({ step, text, ready, words }) => (
                  <div
                    key={step.id}
                    className="w-full rounded-lg border border-border-soft bg-white px-3 py-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-theme-blue">
                          {getWritingSectionLabel(step)}
                          {step.job ? ` · ${step.job}` : ""}
                        </p>
                        <p className="mt-1 text-xs text-text-muted">
                          {words} words ·{" "}
                          <span className={ready ? "text-theme-green" : "text-theme-orange"}>
                            {ready ? "Has prose" : "Empty or too short"}
                          </span>
                        </p>
                      </div>
                      {!locked ? (
                        <button
                          type="button"
                          className="min-h-[44px] rounded-md border border-border-soft px-3 text-sm font-semibold"
                          onClick={() => editFromReview(step.draftIndex)}
                        >
                          Edit
                        </button>
                      ) : null}
                    </div>
                    <p className="mt-2 max-h-24 overflow-y-auto whitespace-pre-wrap break-words text-sm text-text-primary">
                      {text.trim() || "—"}
                    </p>
                  </div>
                ))}
                <p className="text-sm text-text-muted">
                  Total words: {getDraftMetrics().totalWords}
                </p>
              </div>
            </WorkingSetSection>
          ) : (
            <WorkingSetSection
              className="[&>div:last-child]:border-theme-blue/20 [&>div:last-child]:shadow-md"
              label={presentation.workingSetLabel}
              description={
                presentation.workingSetDescription ||
                "Write this section first. Then continue."
              }
            >
              <div className="space-y-3 text-left" ref={deskFocusRef} tabIndex={-1}>
                <p className="text-sm font-medium text-text-primary">{sectionLabel}</p>
                <textarea
                  spellCheck
                  autoCorrect="on"
                  autoCapitalize="sentences"
                  lang="en"
                  enterKeyHint="enter"
                  className={DRAFT_TEXTAREA_CLASS}
                  value={draftIndex != null ? draft[draftIndex] || "" : ""}
                  onChange={(e) =>
                    draftIndex != null && updateSection(draftIndex, e.target.value)
                  }
                  disabled={locked || !writesAllowed}
                  placeholder={
                    currentStep.type === SECTION_TYPES.INTRO
                      ? "What's the first thing your reader needs to know?"
                      : "Start writing this section…"
                  }
                />
              </div>
            </WorkingSetSection>
          )}

          <div className="mt-4 space-y-3 border-t border-border-soft/60 pt-4">
            {sectionGateMessage ? (
              <p className="text-sm text-theme-orange break-words" role="status">
                {sectionGateMessage}
              </p>
            ) : null}
            {navError ? (
              <div
                className="rounded-md border border-theme-orange/40 bg-white px-3 py-2"
                role="alert"
                data-testid="module6-navigation-save-error"
              >
                <p className="text-sm break-words">{navError}</p>
                <button
                  type="button"
                  className="mt-2 min-h-[44px] rounded-md border border-theme-orange/40 px-3 text-sm font-semibold"
                  disabled={navBusy}
                  onClick={() => goNext()}
                >
                  Retry
                </button>
              </div>
            ) : null}
            {finalizeError ? (
              <div
                className="rounded-md border border-red-300 bg-white px-3 py-2"
                role="alert"
                data-testid="module6-finalize-error"
              >
                <p className="text-sm font-semibold text-red-700 break-words">
                  {finalizeError}
                </p>
                <button
                  type="button"
                  className="mt-2 min-h-[44px] rounded-md border border-red-300 px-3 text-sm font-semibold"
                  disabled={isFinalizing}
                  onClick={() => finalizeDraft()}
                >
                  Retry
                </button>
              </div>
            ) : null}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                {!isFirstStage ? (
                  <button
                    type="button"
                    onClick={() => goBack()}
                    disabled={locked || navBusy || !writesAllowed}
                    className="min-h-[44px] rounded-lg bg-surface-soft px-4 py-2 text-text-primary hover:bg-border-soft/60 disabled:opacity-50"
                  >
                    Back
                  </button>
                ) : null}
              </div>
              <div className="flex gap-2">
                {!isReviewStage ? (
                  <button
                    type="button"
                    onClick={() => goNext()}
                    disabled={locked || navBusy || !writesAllowed}
                    className="min-h-[44px] rounded-lg bg-theme-blue px-4 py-2 font-medium text-white disabled:opacity-50"
                  >
                    Keep going
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => finalizeDraft()}
                    disabled={locked || isFinalizing || !writesAllowed}
                    className="min-h-[44px] rounded-lg bg-theme-orange px-4 py-2 font-medium text-white shadow-soft disabled:opacity-50"
                  >
                    {isFinalizing ? "Saving draft…" : "Finish draft and continue"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </ModuleSixStepFrame>
      </div>
    </ModulePageShell>
  );
}

// Re-export for tests that assert production wiring.
export const __MODULE6_CPG = {
  deriveModule6FullText,
  CPG_LAYOUT_CONTRACT,
};
