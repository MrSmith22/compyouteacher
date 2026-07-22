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
import TaskRelevantArtifacts from "@/components/shared/TaskRelevantArtifacts";
import SuccessCriteriaPanel from "@/components/shared/SuccessCriteriaPanel";
import ProgressCelebrationBridge from "@/components/shared/ProgressCelebrationBridge";
import { selectTaskRelevantArtifacts } from "@/lib/module6/taskRelevantArtifacts";
import {
  HIERARCHY_ACTION_FINAL_CLASS,
  HIERARCHY_ACTION_PRIMARY_CLASS,
  HIERARCHY_ACTION_SECONDARY_CLASS,
  HIERARCHY_FOCUS_RING_CLASS,
} from "@/lib/ui/hierarchyContract";
import { getModule6ProgressCelebration } from "@/lib/ui/moduleProgressCelebrations";
import { RHYTHM_WITHIN_SURFACE_CLASS } from "@/lib/ui/instructionalRhythmContract";
import {
  ROLE_WRITING_TEXTAREA_CLASS,
  ROLE_WRITING_WORK_SURFACE_CLASS,
} from "@/lib/ui/instructionalColorContract";
import {
  getWritingSectionLabel,
  getModule6StepPresentation,
  getModule6ReviewPresentation,
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
import {
  isBodyParagraphVerticalSliceStep,
  isIntroConclusionVerticalSliceStep,
  isWholeEssayReviewEnabled,
} from "@/lib/dev/isBodyParagraphVerticalSliceEnabled";
import { buildModule6HandoffReview } from "@/lib/artifacts/wholeEssayReview";
import {
  getMovesFromDraftMeta,
  setMovesInDraftMeta,
  normalizeBodyParagraphMoveState,
  resolveAssembledBodyParagraphProse,
  countBodyParagraphEvidence,
  buildBodyParagraphMoveOrder,
} from "@/lib/module6/bodyParagraphMoves";
import {
  INTRODUCTION_MOVE_META,
  INTRODUCTION_DESK_FIELD_LABELS,
  normalizeIntroductionMoveState,
  resolveAssembledIntroductionProse,
  getIntroductionMovesFromDraftMeta,
  setIntroductionMovesInDraftMeta,
} from "@/lib/module6/introductionMoves";
import {
  CONCLUSION_MOVE_META,
  CONCLUSION_DESK_FIELD_LABELS,
  normalizeConclusionMoveState,
  resolveAssembledConclusionProse,
  getConclusionMovesFromDraftMeta,
  setConclusionMovesInDraftMeta,
} from "@/lib/module6/conclusionMoves";
import { compactBodyPurposes } from "@/lib/artifacts/introConclusionSliceContract";
import BodyParagraphMoveWorkspace from "@/components/module6/BodyParagraphMoveWorkspace";
import SectionMoveWorkspace from "@/components/module6/SectionMoveWorkspace";

const DRAFT_TEXTAREA_CLASS = ROLE_WRITING_TEXTAREA_CLASS;

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
  /** WP-056 — local transient celebration; never persisted. */
  const [progressCelebration, setProgressCelebration] = useState(null);

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

  const bpSliceActive = isBodyParagraphVerticalSliceStep(currentStep);
  const introConclusionSliceActive =
    isIntroConclusionVerticalSliceStep(currentStep);

  const presentation = useMemo(() => {
    if (isReviewStage) {
      return getModule6ReviewPresentation();
    }
    const base = getModule6StepPresentation(currentStep, outline);
    if (isIntroConclusionVerticalSliceStep(currentStep)) {
      const isIntro =
        String(currentStep?.type || "").toLowerCase() === "intro" ||
        String(currentStep?.type || "").toLowerCase() === "introduction";
      return {
        ...base,
        whyMatters: [
          isIntro
            ? "Open the essay one move at a time so your reader arrives at your thesis."
            : "Close the essay one move at a time so your reader leaves with a clear ending.",
        ],
        jobRightNow: {
          lead: isIntro
            ? "Build the introduction one sentence move at a time."
            : "Build the conclusion one sentence move at a time.",
          steps: [
            {
              text: isIntro
                ? "Step 1 — Give your reader the essential situation (labeled Step 1)."
                : "Step 1 — Return to your thesis in fresh language (labeled Step 1).",
            },
            isIntro
              ? "Continue through background, bridge, and thesis destination."
              : "Continue through synthesis, insight, and a purposeful final thought.",
            "Watch this section grow in the preview under the writing box.",
          ],
          closing:
            "Start with Step 1 in the writing box below — it is labeled Step 1 of your moves.",
          findHint:
            "Optional help stays in the shelf. Your desk shows only what this move needs.",
        },
        workingSetLabel: isIntro ? "Introduction" : "Conclusion",
      };
    }
    if (!isBodyParagraphVerticalSliceStep(currentStep)) return base;
    // WP-081: one brief orientation; move workspace owns the active job.
    return {
      ...base,
      whyMatters: [
        "Draft this paragraph one move at a time. Only the plan for the active move sits on your desk.",
      ],
      jobRightNow: {
        lead: "Build this paragraph one sentence move at a time.",
        steps: [
          {
            text: "Step 1 — State the paragraph’s point in the writing box below (labeled Step 1).",
          },
          "Continue through context, evidence, explanation, and thesis connection.",
          "Watch your paragraph grow in the preview under the writing box.",
        ],
        closing:
          "Start with Step 1 in the writing box below — it is labeled Step 1 of your moves.",
        findHint:
          "Optional help stays in the shelf. Your desk shows only what this move needs.",
      },
      successLooksLike: [
        "Step 1 and the later moves each have clear sentences when I need them.",
        "My paragraph preview reads as one paragraph in my own words.",
        "I can keep going when this section has enough prose.",
      ],
      coachingMessage:
        "One move at a time. Keep your ideas and wording.",
      workingSetDescription:
        "Write the active move. Your paragraph preview updates as you go.",
      organizationalJob: null,
      paragraphPoint: null,
    };
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
      setProgressCelebration(null);
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

  const updateBodyParagraphMoves = useCallback(
    (nextMoveState) => {
      if (locked || !writesAllowed) return;
      const stepDraftIndex =
        typeof currentStep?.draftIndex === "number"
          ? currentStep.draftIndex
          : null;
      const sourceIndex =
        typeof currentStep?.sourceParagraphIndex === "number"
          ? currentStep.sourceParagraphIndex
          : 0;
      const bodyCard =
        typeof currentStep?.bodyIndex === "number"
          ? outline?.body?.[currentStep.bodyIndex]
          : null;
      const includeTransition =
        typeof currentStep?.bodyIndex === "number" &&
        Array.isArray(outline?.body) &&
        currentStep.bodyIndex < outline.body.length - 1;
      const evidenceCount = countBodyParagraphEvidence(bodyCard);
      const moveOrder =
        Array.isArray(bodyCard?.moveOrder) && bodyCard.moveOrder.length
          ? bodyCard.moveOrder
          : buildBodyParagraphMoveOrder({ includeTransition, evidenceCount });
      const normalized = normalizeBodyParagraphMoveState(nextMoveState, {
        includeTransition,
        evidenceCount,
        moveOrder,
      });
      const assembled = resolveAssembledBodyParagraphProse(normalized, {
        includeTransition,
        evidenceCount,
        moveOrder,
      });

      markDirty();
      setSectionGateMessage("");
      setDraftMeta((prev) => {
        const nextMeta = setMovesInDraftMeta(prev, sourceIndex, normalized, {
          includeTransition,
          evidenceCount,
          moveOrder,
        });
        draftSnapshotRef.current = {
          sections: draftSnapshotRef.current?.sections ?? draft,
          meta: nextMeta,
        };
        return nextMeta;
      });
      if (stepDraftIndex != null) {
        setDraft((prev) => {
          const copy = [...prev];
          copy[stepDraftIndex] = assembled;
          draftSnapshotRef.current = {
            sections: copy,
            meta: draftSnapshotRef.current?.meta ?? draftMeta,
          };
          return copy;
        });
      }
    },
    [locked, writesAllowed, currentStep, draft, draftMeta, outline, markDirty]
  );

  const updateIntroConclusionMoves = useCallback(
    (nextMoveState) => {
      if (locked || !writesAllowed) return;
      const stepDraftIndex =
        typeof currentStep?.draftIndex === "number"
          ? currentStep.draftIndex
          : null;
      const type = String(currentStep?.type || "").toLowerCase();
      const isIntro = type === "intro" || type === "introduction";
      const normalized = isIntro
        ? normalizeIntroductionMoveState(nextMoveState)
        : normalizeConclusionMoveState(nextMoveState);
      const assembled = isIntro
        ? resolveAssembledIntroductionProse(normalized)
        : resolveAssembledConclusionProse(normalized);

      markDirty();
      setSectionGateMessage("");
      setDraftMeta((prev) => {
        const nextMeta = isIntro
          ? setIntroductionMovesInDraftMeta(prev, normalized)
          : setConclusionMovesInDraftMeta(prev, normalized);
        draftSnapshotRef.current = {
          sections: draftSnapshotRef.current?.sections ?? draft,
          meta: nextMeta,
        };
        return nextMeta;
      });
      if (stepDraftIndex != null) {
        setDraft((prev) => {
          const copy = [...prev];
          copy[stepDraftIndex] = assembled;
          draftSnapshotRef.current = {
            sections: copy,
            meta: draftSnapshotRef.current?.meta ?? draftMeta,
          };
          return copy;
        });
      }
    },
    [locked, writesAllowed, currentStep, draft, draftMeta, markDirty]
  );

  const goBack = async () => {
    if (uiStageIndex <= 0 || navBusy) return;
    setProgressCelebration(null);
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
    const fromIndex = uiStageIndex;
    const toIndex = uiStageIndex + 1;
    const fromStep = uiStages[fromIndex];
    const toStep = uiStages[toIndex];
    const result = await persistAndNavigateStage(toIndex, liveSections);
    if (result?.ok) {
      setProgressCelebration(
        getModule6ProgressCelebration({ fromStep, toStep })
      );
    }
  };

  const editFromReview = async (proseIndex) => {
    const target = uiStages.findIndex(
      (s) => s.type !== MODULE6_DRAFT_STAGE.REVIEW && s.draftIndex === proseIndex
    );
    if (target < 0) return;
    setProgressCelebration(null);
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

  const deskStepType = isReviewStage ? "review" : currentStep?.type || "";
  const deskArtifacts = selectTaskRelevantArtifacts({
    stepType: deskStepType,
    bodyIndex:
      typeof currentStep?.bodyIndex === "number" ? currentStep.bodyIndex : -1,
    thesis: thesisText,
    outline,
    paragraphPlans,
    assignmentQuestion,
  });
  const notebookSectionLabel = isReviewStage
    ? "Whole-draft review"
    : sectionLabel;

  const referenceShelf = (
    <ModuleSixReferenceShelf
      assignmentQuestion={assignmentQuestion}
      thesis={thesisText}
      proofPlan={proofPlan}
      outline={outline}
      paragraphPlans={paragraphPlans}
      observations={observations}
      activeStep={currentStep}
      deskItems={
        bpSliceActive || introConclusionSliceActive ? [] : deskArtifacts.items
      }
      stepType={deskStepType}
      sectionLabel={notebookSectionLabel}
    />
  );

  const supportingResources = bpSliceActive || introConclusionSliceActive ? (
    <div className="space-y-3 text-left">
      <p className="text-sm leading-relaxed text-text-muted">
        Optional help stays in the shelf. Your desk shows only what the active
        move needs.
      </p>
    </div>
  ) : (
    <div className="space-y-3 text-left">
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

      <p className="text-sm leading-relaxed text-text-muted">
        Task-relevant notes are on your desk above the writing box. Open More
        saved work in the shelf for the full thesis, outline, and evidence.
      </p>
    </div>
  );

  const reviewBlocks = uiStages
    .filter((s) => s.type !== MODULE6_DRAFT_STAGE.REVIEW)
    .map((step) => {
      const text = draft[step.draftIndex] || "";
      const ready = evaluateSectionReadiness(text).ok;
      return { step, text, ready, words: wordCount(text) };
    });

  const module6HandoffReview =
    isReviewStage && isWholeEssayReviewEnabled()
      ? buildModule6HandoffReview({
          thesis: thesisText || outline?.thesis || "",
          outline,
          sections: draft,
          wordCountSettings: { mode: "off" },
        })
      : null;

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
          deferSuccessCriteria
          psychologicalModule={6}
        >
          <div className="rounded-lg bg-surface-soft/30 px-3 py-2 text-left">
            <p className="text-[11px] leading-relaxed text-text-muted">
              Module 6 · Draft · step {uiStageIndex + 1} of {uiStages.length}
              {proseStageCount ? ` · ${proseStageCount} writing sections` : ""}.
              One section at a time.
            </p>
            {!locked ? (
              <p
                className="mt-1 text-[11px] leading-relaxed text-text-muted/90"
                data-testid="module6-build-forward-framing"
                data-build-forward-module="6"
              >
                {isReviewStage
                  ? "You are still using the same draft sections you wrote earlier—this check confirms each one is ready before Module 7."
                  : "You are not starting over. You already figured out what you want to say. Now you help your reader understand it—one section at a time."}
              </p>
            ) : null}
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

          {!bpSliceActive && !introConclusionSliceActive ? (
            <TaskRelevantArtifacts
              items={deskArtifacts.items}
              heading="Notebook page open on your desk"
            />
          ) : null}
          {progressCelebration?.message ? (
            <ProgressCelebrationBridge
              module={6}
              fromStep={progressCelebration.fromStep}
              toStep={progressCelebration.toStep}
              message={progressCelebration.message}
            />
          ) : null}

          {isReviewStage ? (
            <WorkingSetSection
              className={ROLE_WRITING_WORK_SURFACE_CLASS}
              label={presentation.workingSetLabel}
              description={presentation.workingSetDescription}
            >
              <div
                className={`${RHYTHM_WITHIN_SURFACE_CLASS} text-left`}
                ref={deskFocusRef}
                tabIndex={-1}
                data-rhythm-contract="within-surface"
                data-testid="module6-review-section-list"
                data-instructional-color-role="writing"
              >
                {reviewBlocks.map(({ step, text, ready, words }) => (
                  <div
                    key={step.id}
                    className="w-full rounded-lg border border-border-soft bg-white px-3 py-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-theme-blue">
                          {getWritingSectionLabel(step)}
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
                <p className="text-sm text-text-muted">
                  Module 7 will read and revise these paragraphs as wholes. Fix empty
                  or duplicated sections here before you continue.
                </p>
                {module6HandoffReview?.primaryFinding ? (
                  <div
                    className="rounded-md border border-theme-orange/40 bg-theme-orange/[0.07] px-3 py-2 text-sm"
                    data-testid="module6-handoff-finding"
                  >
                    <p className="font-semibold text-theme-dark">
                      {module6HandoffReview.primaryFinding.title}
                    </p>
                    <p className="mt-1 text-theme-dark/85">
                      {module6HandoffReview.primaryFinding.whatToCheck}
                    </p>
                    {typeof module6HandoffReview.primaryFinding.draftIndex ===
                    "number" ? (
                      <button
                        type="button"
                        className="mt-2 min-h-[44px] rounded-md border border-border-soft px-3 text-sm font-semibold"
                        onClick={() =>
                          editFromReview(
                            module6HandoffReview.primaryFinding.draftIndex
                          )
                        }
                      >
                        Fix{" "}
                        {module6HandoffReview.primaryFinding.sectionLabel ||
                          "this section"}
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </WorkingSetSection>
          ) : (
            <WorkingSetSection
              className={ROLE_WRITING_WORK_SURFACE_CLASS}
              label={presentation.workingSetLabel}
              description={
                presentation.workingSetDescription ||
                "Write this section first. Then continue."
              }
            >
              <div
                className="space-y-3 text-left"
                ref={deskFocusRef}
                tabIndex={-1}
                data-instructional-color-role="writing"
              >
                {isBodyParagraphVerticalSliceStep(currentStep) ? (
                  (() => {
                    const bodyCard =
                      typeof currentStep?.bodyIndex === "number"
                        ? outline?.body?.[currentStep.bodyIndex]
                        : null;
                    const includeTransition =
                      typeof currentStep?.bodyIndex === "number" &&
                      Array.isArray(outline?.body) &&
                      currentStep.bodyIndex < outline.body.length - 1;
                    const evidenceCount = countBodyParagraphEvidence(bodyCard);
                    const moveOrder =
                      Array.isArray(bodyCard?.moveOrder) &&
                      bodyCard.moveOrder.length
                        ? bodyCard.moveOrder
                        : buildBodyParagraphMoveOrder({
                            includeTransition,
                            evidenceCount,
                          });
                    const evidenceList = Array.isArray(bodyCard?.evidence)
                      ? bodyCard.evidence
                      : [];
                    const indexedDesk = {};
                    evidenceList.forEach((item, i) => {
                      const quote = String(
                        item?.quote || item?.text || item || ""
                      ).trim();
                      const obs = String(
                        item?.observation || item?.context || ""
                      ).trim();
                      if (quote) indexedDesk[`evidence_${i}`] = quote;
                      if (obs) indexedDesk[`evidenceContext_${i}`] = obs;
                      const reason = String(
                        bodyCard?.reasoning || ""
                      ).trim();
                      if (reason) indexedDesk[`reasoning_${i}`] = reason;
                    });
                    return (
                  <BodyParagraphMoveWorkspace
                    label={sectionLabel}
                    moveState={normalizeBodyParagraphMoveState(
                      getMovesFromDraftMeta(
                        draftMeta,
                        typeof currentStep?.sourceParagraphIndex === "number"
                          ? currentStep.sourceParagraphIndex
                          : 0
                      ),
                      {
                        includeTransition,
                        evidenceCount,
                        moveOrder,
                        legacyProse:
                          draft[
                            typeof currentStep?.draftIndex === "number"
                              ? currentStep.draftIndex
                              : 0
                          ] || "",
                      }
                    )}
                    deskArtifacts={{
                      purpose: deskArtifacts.items
                        ?.find?.((a) => a?.kind === "claim")
                        ?.lines?.[0],
                      evidence: deskArtifacts.items
                        ?.filter?.((a) => a?.kind === "evidence")
                        ?.flatMap((a) => a.lines || [])
                        ?.filter(Boolean)
                        ?.join(" · "),
                      evidenceContext: (() => {
                        if (evidenceList.length) {
                          return evidenceList
                            .map((e) =>
                              String(e?.observation || e?.context || "").trim()
                            )
                            .filter(Boolean)
                            .join(" · ");
                        }
                        return String(
                          bodyCard?.context ||
                            bodyCard?.evidenceContext ||
                            bodyCard?.setup ||
                            ""
                        ).trim();
                      })(),
                      reasoning: deskArtifacts.items
                        ?.find?.((a) => a?.kind === "reasoning")
                        ?.lines?.[0],
                      thesis: deskArtifacts.items
                        ?.find?.((a) => a?.kind === "thesis")
                        ?.lines?.[0],
                      adjacentParagraph: (() => {
                        if (
                          typeof currentStep?.bodyIndex !== "number" ||
                          !Array.isArray(outline?.body)
                        ) {
                          return "";
                        }
                        const next = outline.body[currentStep.bodyIndex + 1];
                        return String(next?.point || next?.bucket || "").trim();
                      })(),
                      ...indexedDesk,
                    }}
                    disabled={locked || !writesAllowed}
                    onChange={updateBodyParagraphMoves}
                  />
                    );
                  })()
                ) : isIntroConclusionVerticalSliceStep(currentStep) ? (
                  (() => {
                    const type = String(currentStep?.type || "").toLowerCase();
                    const isIntro =
                      type === "intro" || type === "introduction";
                    const prefix = isIntro ? "intro-move" : "conclusion-move";
                    const moveState = isIntro
                      ? normalizeIntroductionMoveState(
                          getIntroductionMovesFromDraftMeta(draftMeta)
                        )
                      : normalizeConclusionMoveState(
                          getConclusionMovesFromDraftMeta(draftMeta)
                        );
                    const bodyPurposeLines = compactBodyPurposes(
                      outline?.body
                    ).join(" · ");
                    return (
                      <SectionMoveWorkspace
                        label={sectionLabel}
                        moveState={moveState}
                        moveMeta={
                          isIntro ? INTRODUCTION_MOVE_META : CONCLUSION_MOVE_META
                        }
                        fieldLabels={
                          isIntro
                            ? INTRODUCTION_DESK_FIELD_LABELS
                            : CONCLUSION_DESK_FIELD_LABELS
                        }
                        deskArtifacts={{
                          assignmentQuestion,
                          textRelationship: assignmentQuestion
                            ? `Compare the texts for this assignment: ${assignmentQuestion}`
                            : "",
                          thesis: thesisText,
                          bodyPurposes: bodyPurposeLines,
                          conclusionSummary: String(
                            outline?.conclusion?.summary || ""
                          ).trim(),
                          conclusionFinalThought: String(
                            outline?.conclusion?.finalThought || ""
                          ).trim(),
                        }}
                        disabled={locked || !writesAllowed}
                        onChange={updateIntroConclusionMoves}
                        testIdPrefix={prefix}
                        advancedLabel={
                          isIntro
                            ? "Advanced: write whole introduction"
                            : "Advanced: write whole conclusion"
                        }
                        previewLabel={
                          isIntro ? "Your introduction" : "Your conclusion"
                        }
                      />
                    );
                  })()
                ) : (
                  <>
                    <p className="text-sm font-medium text-text-primary">
                      {sectionLabel}
                    </p>
                    <textarea
                      spellCheck
                      autoCorrect="on"
                      autoCapitalize="sentences"
                      lang="en"
                      enterKeyHint="enter"
                      className={DRAFT_TEXTAREA_CLASS}
                      value={draftIndex != null ? draft[draftIndex] || "" : ""}
                      onChange={(e) =>
                        draftIndex != null &&
                        updateSection(draftIndex, e.target.value)
                      }
                      disabled={locked || !writesAllowed}
                      placeholder={
                        currentStep.type === SECTION_TYPES.INTRO
                          ? "What's the first thing your reader needs to know?"
                          : "Start writing this section…"
                      }
                    />
                  </>
                )}
              </div>
            </WorkingSetSection>
          )}

          <div className="mt-4 space-y-3 border-t border-border-soft/60 pt-4">
            {sectionGateMessage ? (
              <p
                className="text-sm text-theme-orange break-words"
                role="status"
                aria-live="polite"
              >
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

            <SuccessCriteriaPanel
              items={presentation.successLooksLike}
              lead="You’re ready when…"
              note={
                isReviewStage
                  ? "These are self-checks. The app still requires every section to have prose before your draft can finish."
                  : "These are self-checks for your writing. Keep going still uses the same section-readiness rules as before."
              }
            />

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                {!isFirstStage ? (
                  <button
                    type="button"
                    onClick={() => goBack()}
                    disabled={locked || navBusy || !writesAllowed}
                    className={`${HIERARCHY_ACTION_SECONDARY_CLASS} ${HIERARCHY_FOCUS_RING_CLASS}`}
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
                    className={`${HIERARCHY_ACTION_PRIMARY_CLASS} ${HIERARCHY_FOCUS_RING_CLASS}`}
                    data-hierarchy-action="primary"
                  >
                    Keep going
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => finalizeDraft()}
                    disabled={locked || isFinalizing || !writesAllowed}
                    className={`${HIERARCHY_ACTION_FINAL_CLASS} ${HIERARCHY_FOCUS_RING_CLASS}`}
                    data-hierarchy-action="final"
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
