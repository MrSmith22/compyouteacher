// components/ModuleFive.js — CP-F sequenced outline (preserves CP-D0 write controller)
"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { logActivity } from "../lib/logActivity";
import { buildOutlineBodyFromModule4Plans } from "@/lib/module4/mapStudentBucketsToOutline";
import {
  getParagraphPlanRow,
  getTChartEntriesRows,
} from "@/lib/artifacts/readArtifactsClient";
import { parseApiResponse } from "@/lib/api/clientFetch";
import {
  buildAutosaveRequestBody,
  buildFinalizeRequestBody,
  createHydrationAutosaveGate,
  createOutlineWriteController,
  outlineContentSignature,
  readFinalizedFlag,
  resolveFinalizeNavigation,
  shouldAutosaveOutline,
} from "@/lib/module5/outlinePersistenceHelpers";
import {
  MODULE5_STAGE,
  MODULE5_STAGE_COUNT,
  CPF_LAYOUT_CONTRACT,
  MODULE5_IMPORT_MERGE_POLICY,
  getModule5StagePresentation,
  normalizeOutlineBodyOrder,
  moveOutlineBodyCard,
  evaluateModule5StageGate,
  resolveModule5ImportDecision,
  applyUpstreamBodyCardUpdate,
  buildOutlineOrderGuidance,
  outlineCardEvidenceCount,
  outlineCardReasoningReady,
  syncLegacyPointsFromStructuredFields,
  readModule5UiState,
  writeModule5UiState,
  validateConclusionPlan,
} from "@/lib/module5/module5OutlineStageHelpers";
import { getBodyParagraphLabel, getIntroductionLabel, getConclusionLabel } from "@/lib/essaySectionLabels";
import {
  isBodyParagraphVerticalSliceEnabled,
  isSectionVerticalSliceEnabled,
} from "@/lib/dev/isBodyParagraphVerticalSliceEnabled";
import {
  buildBodyParagraphSlice,
  formatBodyParagraphFormalOutlineLines,
  formatBodyParagraphWritingPlanSummary,
  withOutlineMoveOrder,
} from "@/lib/artifacts/bodyParagraphSliceContract";
import {
  buildIntroductionSlice,
  buildConclusionSlice,
  formatIntroductionWritingPlanSummary,
  formatIntroductionFormalOutlineLines,
  formatConclusionWritingPlanSummary,
  formatConclusionFormalOutlineLines,
} from "@/lib/artifacts/introConclusionSliceContract";
import {
  MODULE5_OUTLINE_READ_STATE,
  MODULE5_OUTLINE_READ_ERROR,
  resolveModule5OutlineReadState,
  shouldAllowModule5OutlineWrites,
  mayPerformModule5FirstImport,
  resolveUpstreamComparisonAvailability,
} from "@/lib/module5/module5HydrationHelpers";
import { buildModule4ProvenanceModel } from "@/lib/module4/module4ProvenanceHelpers";
import { resolveSelectedPattern } from "@/lib/module4/module4InstructionalLogic";
import ModuleFiveStepFrame from "@/components/module5/ModuleFiveStepFrame";
import ProgressDots from "@/components/ui/ProgressDots";

function emptyConclusion() {
  return { summary: "", finalThought: "" };
}

export default function ModuleFive() {
  const { data: session } = useSession();
  const router = useRouter();

  const [thesis, setThesis] = useState("");
  const [originalThesis, setOriginalThesis] = useState("");
  const [outline, setOutline] = useState([]);
  const [conclusion, setConclusion] = useState(emptyConclusion());
  const [stage, setStage] = useState(MODULE5_STAGE.BRING_IN);
  const [bodyReviewIndex, setBodyReviewIndex] = useState(0);
  /** WP-081: writing-plan vs formal-outline toggle for Body Paragraph slice. */
  const [outlineViewMode, setOutlineViewMode] = useState("writing");
  const [conclusionMicro, setConclusionMicro] = useState(0);
  const [reviewedBodyIndices, setReviewedBodyIndices] = useState([]);
  const [locked, setLocked] = useState(false);
  const [hydrationReady, setHydrationReady] = useState(false);
  const [finalizeError, setFinalizeError] = useState("");
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [navBusy, setNavBusy] = useState(false);
  const [navError, setNavError] = useState("");
  const [upstreamNotice, setUpstreamNotice] = useState(null);
  const [importedSnapshot, setImportedSnapshot] = useState([]);
  const [requiredBodyCount, setRequiredBodyCount] = useState(null);
  const [outlineReadState, setOutlineReadState] = useState(
    MODULE5_OUTLINE_READ_STATE.PENDING
  );
  const [outlineReadError, setOutlineReadError] = useState("");
  const [upstreamUnavailableMessage, setUpstreamUnavailableMessage] =
    useState("");
  const [provenanceModel, setProvenanceModel] = useState(null);
  const [hydrateAttempt, setHydrateAttempt] = useState(0);

  const hasLoggedStartRef = useRef(false);
  const lastPostedSignatureRef = useRef(null);
  const autosaveTimerRef = useRef(null);
  const loadGenerationRef = useRef(0);
  const writeControllerRef = useRef(createOutlineWriteController());
  const persistEpochRef = useRef(0);
  const navInFlightRef = useRef(false);
  const outlineSnapshotRef = useRef({
    thesis: "",
    body: [],
    conclusion: emptyConclusion(),
    module5Ui: null,
  });
  const studentDirtyRef = useRef(false);

  const buildCurrentOutlinePayload = useCallback(
    (overrides = {}) => {
      const nextStage = overrides.stage ?? stage;
      const nextBody = overrides.body ?? outline;
      const nextThesis = overrides.thesis ?? thesis;
      const nextConclusion = overrides.conclusion ?? conclusion;
      const nextReview = overrides.bodyReviewIndex ?? bodyReviewIndex;
      const nextMicro = overrides.conclusionMicro ?? conclusionMicro;
      const nextReviewed =
        overrides.reviewedBodyIndices ?? reviewedBodyIndices;
      return writeModule5UiState(
        {
          thesis: nextThesis,
          body: normalizeOutlineBodyOrder(nextBody),
          conclusion: nextConclusion,
        },
        {
          stage: nextStage,
          bodyReviewIndex: nextReview,
          conclusionMicro: nextMicro,
          reviewedBodyIndices: nextReviewed,
        }
      );
    },
    [
      stage,
      outline,
      thesis,
      conclusion,
      bodyReviewIndex,
      conclusionMicro,
      reviewedBodyIndices,
    ]
  );

  const markDirty = useCallback(() => {
    studentDirtyRef.current = true;
  }, []);

  const getOutlineMetrics = () => ({
    bucketCount: outline.length,
    totalPoints: outline.reduce(
      (sum, b) => sum + (Array.isArray(b.points) ? b.points.length : 0),
      0
    ),
    thesisLength: thesis.trim().length,
    conclusionLength:
      conclusion.summary.trim().length + conclusion.finalThought.trim().length,
    stage,
  });

  const writesAllowed = shouldAllowModule5OutlineWrites({
    readState: outlineReadState,
    hydrationReady,
    locked,
  });

  // Load outline + optional Module 4 import (no write on passive view)
  useEffect(() => {
    const loadData = async () => {
      const email = session?.user?.email;
      if (!email) return;

      const generation = ++loadGenerationRef.current;
      setHydrationReady(false);
      setOutlineReadState(MODULE5_OUTLINE_READ_STATE.PENDING);
      setOutlineReadError("");
      setUpstreamUnavailableMessage("");

      if (!hasLoggedStartRef.current) {
        hasLoggedStartRef.current = true;
        logActivity(email, "module_started", { module: 5 });
      }

      let nextThesis = "";
      let nextBody = [];
      let nextConclusion = emptyConclusion();
      let nextLocked = false;
      let nextUi = readModule5UiState({});
      let imported = [];
      let requiredCount = null;
      let upstream = null;
      let nextProvenance = null;
      let nextUpstreamUnavailable = "";

      let outlineGet = { ok: false, networkError: false, data: null };
      try {
        const res = await fetch("/api/outlines?module=5");
        const json = await res.json().catch(() => ({}));
        if (res.ok && json?.ok) {
          outlineGet = { ok: true, data: json.data ?? null };
        } else {
          outlineGet = {
            ok: false,
            status: res.status,
            data: null,
          };
        }
      } catch {
        outlineGet = { ok: false, networkError: true, data: null };
      }

      if (generation !== loadGenerationRef.current) return;

      const classified = resolveModule5OutlineReadState(outlineGet);
      setOutlineReadState(classified.state);

      if (classified.state === MODULE5_OUTLINE_READ_STATE.SAVED_OUTLINE_READ_FAILED) {
        setOutlineReadError(classified.message || MODULE5_OUTLINE_READ_ERROR);
        setThesis("");
        setOutline([]);
        setConclusion(emptyConclusion());
        setImportedSnapshot([]);
        setRequiredBodyCount(null);
        setUpstreamNotice(null);
        setProvenanceModel(null);
        studentDirtyRef.current = false;
        setHydrationReady(true);
        return;
      }

      setOutlineReadError("");
      const savedRow = classified.savedRow;

      if (savedRow?.outline) {
        nextThesis = savedRow.outline.thesis || "";
        nextBody = Array.isArray(savedRow.outline.body)
          ? savedRow.outline.body
          : [];
        nextConclusion =
          savedRow.outline.conclusion || emptyConclusion();
        nextLocked = readFinalizedFlag(savedRow.finalized);
        nextUi = readModule5UiState(savedRow.outline);

        // Paint the saved outline before optional upstream fetches so a slow
        // Module 3 / evidence read cannot leave the student on an empty BRING_IN.
        if (generation === loadGenerationRef.current) {
          setThesis(nextThesis);
          setOutline(normalizeOutlineBodyOrder(nextBody));
          setConclusion(nextConclusion);
          setLocked(nextLocked);
          setStage(nextUi.stage || MODULE5_STAGE.BRING_IN);
          setBodyReviewIndex(nextUi.bodyReviewIndex || 0);
          setConclusionMicro(nextUi.conclusionMicro || 0);
          setReviewedBodyIndices(nextUi.reviewedBodyIndices || []);
        }
      }

      let reminderThesis = "";
      try {
        const thesisRes = await fetch("/api/module3/thesis");
        const thesisJson = await parseApiResponse(thesisRes);
        const thesisRow = thesisJson?.thesis ?? null;
        if (thesisRow?.thesis) {
          reminderThesis = String(thesisRow.thesis).trim();
          if (!nextThesis) nextThesis = reminderThesis;
        }
      } catch {
        // Thesis reminder is optional when a saved outline already carries it.
      }

      if (generation !== loadGenerationRef.current) return;

      let upstreamOk = true;
      const m4Result = await getParagraphPlanRow();
      if (generation !== loadGenerationRef.current) return;

      let tchartData = [];
      if (m4Result.ok && Array.isArray(m4Result.data?.buckets)) {
        const tchartResult = await getTChartEntriesRows();
        if (generation !== loadGenerationRef.current) return;
        if (!tchartResult.ok) {
          upstreamOk = false;
        } else {
          tchartData = tchartResult.data || [];
        }

        if (upstreamOk) {
          const wantThird =
            m4Result.data?.flow_state?.wantThirdBucket ?? null;
          imported = buildOutlineBodyFromModule4Plans({
            buckets: m4Result.data.buckets,
            wantThirdBucket: wantThird,
            tchartRows: tchartData,
          });
          requiredCount = imported.length;
        }
      } else if (!m4Result.ok) {
        upstreamOk = false;
      }

      // Canonical Module 3 provenance for order guidance (read-only).
      try {
        const patternRes = await fetch("/api/module3/patterns");
        const patternJson = await patternRes.json().catch(() => ({}));
        if (generation !== loadGenerationRef.current) return;
        if (patternRes.ok && patternJson?.ok) {
          const patterns = Array.isArray(patternJson.patterns)
            ? patternJson.patterns
            : Array.isArray(patternJson.data?.patterns)
              ? patternJson.data.patterns
              : [];
          const selectedPatternId =
            patternJson.selectedPatternId ||
            patternJson.data?.selectedPatternId ||
            null;
          const artifactLike = patterns.map((p) => ({
            id: p.id,
            text: p.text,
            evidenceIds: Array.isArray(p.evidenceIds) ? p.evidenceIds : [],
            isSelected: selectedPatternId
              ? p.id === selectedPatternId
              : Boolean(p.isSelected),
            matrixProvenance: p.matrixProvenance || null,
            matrixReview: p.matrixReview || null,
          }));
          const selected =
            resolveSelectedPattern(artifactLike) ||
            artifactLike.find((p) => p.isSelected) ||
            null;
          const pool = (tchartData || []).map((row) => ({
            evidenceKey: String(row.id ?? ""),
            id: String(row.id ?? ""),
            type: row.type,
            category: row.category,
            quote: row.quote,
            observation: row.observation,
          }));
          nextProvenance = buildModule4ProvenanceModel({
            selectedPattern: selected,
            evidencePool: pool,
          });
        }
      } catch {
        // Provenance optional — Module 5 remains usable without guidance.
        nextProvenance = null;
      }

      if (generation !== loadGenerationRef.current) return;

      const upstreamAvail = resolveUpstreamComparisonAvailability({
        readState: classified.state,
        upstreamOk,
      });
      if (!upstreamAvail.available && classified.state === MODULE5_OUTLINE_READ_STATE.SAVED_OUTLINE_LOADED) {
        nextUpstreamUnavailable = upstreamAvail.message;
      }

      if (
        mayPerformModule5FirstImport({
          readState: classified.state,
          upstreamOk,
        })
      ) {
        const decision = resolveModule5ImportDecision({
          savedBody: [],
          importedBody: imported,
          savedConclusion: nextConclusion,
        });
        nextBody = decision.body;
        requiredCount = imported.length;
      } else if (
        classified.state === MODULE5_OUTLINE_READ_STATE.SAVED_OUTLINE_LOADED
      ) {
        // Keep saved outline. Upstream comparison only when Module 4 loaded.
        if (upstreamOk && imported.length) {
          const decision = resolveModule5ImportDecision({
            savedBody: nextBody,
            importedBody: imported,
            savedConclusion: nextConclusion,
          });
          nextBody = decision.body;
          if (decision.action === "upstream_review") {
            upstream = {
              changedSources: decision.changedSources,
              policy: MODULE5_IMPORT_MERGE_POLICY,
            };
          }
        } else {
          imported = [];
        }
      } else if (
        classified.state ===
          MODULE5_OUTLINE_READ_STATE.CONFIRMED_NO_SAVED_OUTLINE &&
        !upstreamOk
      ) {
        // Do not seed a partial import that could later overwrite a real outline.
        nextBody = [];
        imported = [];
        requiredCount = null;
      }

      if (generation !== loadGenerationRef.current) return;

      setOriginalThesis(reminderThesis);
      setThesis(nextThesis);
      setOutline(normalizeOutlineBodyOrder(nextBody));
      setConclusion(nextConclusion);
      setLocked(nextLocked);
      setStage(nextUi.stage || MODULE5_STAGE.BRING_IN);
      setBodyReviewIndex(nextUi.bodyReviewIndex || 0);
      setConclusionMicro(nextUi.conclusionMicro || 0);
      setReviewedBodyIndices(nextUi.reviewedBodyIndices || []);
      setImportedSnapshot(imported);
      setRequiredBodyCount(requiredCount);
      setUpstreamNotice(upstream);
      setUpstreamUnavailableMessage(nextUpstreamUnavailable);
      setProvenanceModel(nextProvenance);

      const applied = writeModule5UiState(
        {
          thesis: nextThesis,
          body: nextBody,
          conclusion: nextConclusion,
        },
        nextUi
      );
      const gate = createHydrationAutosaveGate(applied);
      lastPostedSignatureRef.current = gate.lastPostedSignature;
      studentDirtyRef.current = false;
      setHydrationReady(true);
    };

    loadData();
  }, [session, hydrateAttempt]);

  useEffect(() => {
    outlineSnapshotRef.current = buildCurrentOutlinePayload();
  }, [buildCurrentOutlinePayload]);

  // Hydration-safe autosave (CP-D0) — only after student dirty mutations
  useEffect(() => {
    if (!session?.user?.email || !hydrationReady || locked) return;
    if (!writesAllowed) return;
    if (!studentDirtyRef.current) return;

    const outlineData = buildCurrentOutlinePayload();
    const signature = outlineContentSignature(outlineData);

    if (
      !shouldAutosaveOutline({
        hydrationReady,
        locked,
        importing: false,
        signature,
        lastPostedSignature: lastPostedSignatureRef.current,
      })
    ) {
      return;
    }

    if (!writeControllerRef.current.areAutosavesAllowed()) return;

    writeControllerRef.current.noteLocalEdit();
    const scheduledEpoch = persistEpochRef.current;

    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);

    autosaveTimerRef.current = setTimeout(() => {
      if (scheduledEpoch !== persistEpochRef.current) return;
      if (navInFlightRef.current) return;
      if (!writeControllerRef.current.areAutosavesAllowed()) return;

      const latest = outlineSnapshotRef.current;
      const latestSignature = outlineContentSignature(latest);
      const email = session.user.email;

      const run = writeControllerRef.current.beginAutosave(async ({ revision }) => {
        const payload = latest;
        try {
          const res = await fetch("/api/outlines", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(buildAutosaveRequestBody(payload)),
          });
          const json = await res.json().catch(() => ({}));
          return { ok: res.ok && json?.ok, outline: payload, revision };
        } catch {
          return { ok: false, outline: payload, revision };
        }
      }, latest);

      if (!run) return;
      run.then((outcome) => {
        if (!outcome?.applied) return;
        lastPostedSignatureRef.current = latestSignature;
        studentDirtyRef.current = false;
        logActivity(email, "outline_autosaved", {
          module: 5,
          ...getOutlineMetrics(),
        });
      });
    }, 800);

    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
        autosaveTimerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    thesis,
    outline,
    conclusion,
    stage,
    bodyReviewIndex,
    conclusionMicro,
    reviewedBodyIndices,
    session,
    hydrationReady,
    locked,
    writesAllowed,
    buildCurrentOutlinePayload,
  ]);

  const cancelPendingAutosave = useCallback(() => {
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = null;
    }
    persistEpochRef.current += 1;
  }, []);

  const persistOutlineNow = useCallback(
    async (payload) => {
      const body = buildAutosaveRequestBody(payload);
      const res = await fetch("/api/outlines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({}));
      return { ok: res.ok && json?.ok, error: json?.error || null };
    },
    []
  );

  const persistAndNavigateStage = useCallback(
    async (targetStage, overrides = {}) => {
      if (navInFlightRef.current || locked || !writesAllowed) {
        return { ok: false, blocked: true };
      }
      navInFlightRef.current = true;
      setNavBusy(true);
      setNavError("");
      cancelPendingAutosave();

      const payload = buildCurrentOutlinePayload({
        ...overrides,
        stage: targetStage,
      });
      outlineSnapshotRef.current = payload;

      try {
        const result = await persistOutlineNow(payload);
        navInFlightRef.current = false;
        setNavBusy(false);
        if (!result.ok) {
          setNavError(
            result.error ||
              "Could not save your outline progress. Your work is still here. Try again."
          );
          return result;
        }
        persistEpochRef.current += 1;
        lastPostedSignatureRef.current = outlineContentSignature(payload);
        studentDirtyRef.current = false;
        setStage(targetStage);
        if (overrides.body) setOutline(normalizeOutlineBodyOrder(overrides.body));
        if (overrides.thesis != null) setThesis(overrides.thesis);
        if (overrides.conclusion) setConclusion(overrides.conclusion);
        if (overrides.bodyReviewIndex != null) {
          setBodyReviewIndex(overrides.bodyReviewIndex);
        }
        if (overrides.conclusionMicro != null) {
          setConclusionMicro(overrides.conclusionMicro);
        }
        if (overrides.reviewedBodyIndices) {
          setReviewedBodyIndices(overrides.reviewedBodyIndices);
        }
        return { ok: true };
      } catch {
        navInFlightRef.current = false;
        setNavBusy(false);
        setNavError(
          "Could not save your outline progress. Check your connection and try again."
        );
        return { ok: false };
      }
    },
    [
      locked,
      writesAllowed,
      cancelPendingAutosave,
      buildCurrentOutlinePayload,
      persistOutlineNow,
    ]
  );

  const stageGate = useMemo(
    () =>
      evaluateModule5StageGate({
        stage,
        thesis,
        body: outline,
        conclusion,
        bodyReviewIndex,
        conclusionMicro,
        requiredBodyCount,
      }),
    [
      stage,
      thesis,
      outline,
      conclusion,
      bodyReviewIndex,
      conclusionMicro,
      requiredBodyCount,
    ]
  );

  const presentation = useMemo(
    () =>
      getModule5StagePresentation(stage, {
        body: outline,
        bodyReviewIndex,
        conclusionMicro,
      }),
    [stage, outline, bodyReviewIndex, conclusionMicro]
  );

  const orderGuidance = useMemo(
    () =>
      buildOutlineOrderGuidance({
        provenanceModel,
        body: outline,
      }),
    [provenanceModel, outline]
  );

  const retryOutlineHydration = useCallback(() => {
    setHydrateAttempt((n) => n + 1);
  }, []);

  const updateBodyCard = (index, patch) => {
    if (locked) return;
    markDirty();
    setOutline((prev) =>
      normalizeOutlineBodyOrder(
        prev.map((card, i) => {
          if (i !== index) return card;
          return syncLegacyPointsFromStructuredFields({ ...card, ...patch });
        })
      )
    );
  };

  const moveCard = (from, to) => {
    if (locked) return;
    markDirty();
    setOutline((prev) => moveOutlineBodyCard(prev, from, to));
  };

  const advanceFromCurrentStage = async () => {
    if (!stageGate.ok || navBusy || !writesAllowed) return;

    if (stage === MODULE5_STAGE.BRING_IN) {
      await persistAndNavigateStage(MODULE5_STAGE.ORDER);
      return;
    }
    if (stage === MODULE5_STAGE.ORDER) {
      await persistAndNavigateStage(MODULE5_STAGE.REVIEW_BODY, {
        bodyReviewIndex: 0,
      });
      return;
    }
    if (stage === MODULE5_STAGE.REVIEW_BODY) {
      const nextReviewed = [
        ...new Set([...reviewedBodyIndices, bodyReviewIndex]),
      ];
      if (bodyReviewIndex + 1 < outline.length) {
        await persistAndNavigateStage(MODULE5_STAGE.REVIEW_BODY, {
          bodyReviewIndex: bodyReviewIndex + 1,
          reviewedBodyIndices: nextReviewed,
        });
        return;
      }
      await persistAndNavigateStage(MODULE5_STAGE.CONCLUSION, {
        reviewedBodyIndices: nextReviewed,
        conclusionMicro: 0,
      });
      return;
    }
    if (stage === MODULE5_STAGE.CONCLUSION) {
      if (conclusionMicro < 2) {
        await persistAndNavigateStage(MODULE5_STAGE.CONCLUSION, {
          conclusionMicro: conclusionMicro + 1,
        });
        return;
      }
      await persistAndNavigateStage(MODULE5_STAGE.FINALIZE);
      return;
    }
  };

  const finalizeOutline = async () => {
    const email = session?.user?.email;
    if (!email || isFinalizing || locked || !writesAllowed) return;

    const gate = evaluateModule5StageGate({
      stage: MODULE5_STAGE.FINALIZE,
      thesis,
      body: outline,
      conclusion,
      requiredBodyCount,
    });
    if (!gate.ok) {
      setFinalizeError(gate.message);
      return;
    }

    setFinalizeError("");
    setIsFinalizing(true);
    setLocked(true);
    cancelPendingAutosave();

    const outlinePayload = buildCurrentOutlinePayload({
      stage: MODULE5_STAGE.FINALIZE,
    });
    outlineSnapshotRef.current = outlinePayload;

    try {
      const outcome = await writeControllerRef.current.finalize({
        outline: outlinePayload,
        cancelPendingTimer: cancelPendingAutosave,
        sendFinalize: async (latestOutline) => {
          const res = await fetch("/api/outlines", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(buildFinalizeRequestBody(latestOutline)),
          });
          const json = await res.json().catch(() => ({}));
          return {
            ok: res.ok && json?.ok,
            error:
              json?.error ||
              (!res.ok
                ? "We could not save your outline. Please try again."
                : null),
          };
        },
      });

      const nav = resolveFinalizeNavigation({
        ok: outcome.ok,
        error: outcome.error,
      });

      if (!nav.navigate) {
        setFinalizeError(nav.error);
        setLocked(false);
        setIsFinalizing(false);
        return;
      }

      lastPostedSignatureRef.current = outlineContentSignature(outlinePayload);
      await logActivity(email, "module_completed", {
        module: 5,
        finalized: true,
        ...getOutlineMetrics(),
      });
      router.push(nav.path);
    } catch {
      setFinalizeError(
        "We could not save your outline. Check your connection and try again."
      );
      setLocked(false);
      setIsFinalizing(false);
    }
  };

  const applyUpstreamRefresh = (sourceParagraphIndex) => {
    if (locked) return;
    markDirty();
    setOutline((prev) =>
      applyUpstreamBodyCardUpdate({
        savedBody: prev,
        importedBody: importedSnapshot,
        sourceParagraphIndex,
      })
    );
    setUpstreamNotice((prev) => {
      if (!prev) return null;
      const remaining = (prev.changedSources || []).filter(
        (c) => c.sourceParagraphIndex !== sourceParagraphIndex
      );
      return remaining.length ? { ...prev, changedSources: remaining } : null;
    });
  };

  const readonly = locked ? "pointer-events-none opacity-60" : "";
  const activeCard = outline[bodyReviewIndex] || null;

  if (
    outlineReadState === MODULE5_OUTLINE_READ_STATE.SAVED_OUTLINE_READ_FAILED
  ) {
    return (
      <div className="mx-auto w-full max-w-[1200px] px-4 py-6 overflow-x-hidden">
        <div
          className="rounded-lg border border-theme-orange/40 bg-white px-4 py-4"
          role="alert"
          data-testid="module5-outline-read-error"
        >
          <p className="text-sm font-semibold text-theme-dark break-words">
            {outlineReadError || MODULE5_OUTLINE_READ_ERROR}
          </p>
          <p className="mt-2 text-sm text-theme-dark/85 break-words">
            Your saved outline was not changed. Retry to load it before editing
            or continuing.
          </p>
          <button
            type="button"
            className="mt-3 min-h-[44px] rounded-md border border-theme-orange/40 px-3 text-sm font-semibold"
            onClick={() => retryOutlineHydration()}
            data-testid="module5-outline-read-retry"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  let main = null;

  if (stage === MODULE5_STAGE.BRING_IN) {
    main = (
      <div
        className={`w-full space-y-4 overflow-x-hidden ${readonly}`}
        data-cpf-layout={CPF_LAYOUT_CONTRACT.viewports.join("-")}
      >
        <div className="rounded-lg border border-theme-green/30 bg-theme-green/5 px-3 py-3">
          <p className="text-[11px] font-bold uppercase tracking-wide text-theme-green">
            Thesis (read-only here)
          </p>
          <p className="mt-1 text-sm whitespace-pre-wrap break-words text-theme-dark">
            {thesis || originalThesis || "Your Module 3 thesis will appear here."}
          </p>
        </div>
        <p
          className="text-sm text-theme-dark/85"
          data-testid="module5-build-forward-framing"
          data-build-forward-module="5"
        >
          These cards are paragraph plans you already completed. You will arrange
          and review them—not recreate them.
        </p>
        <ul className="w-full space-y-3" data-module5-paragraph-cards="true">
          {outline.map((card, i) => (
            <li
              key={`bring-${card.sourceParagraphIndex ?? i}`}
              className={[
                "w-full rounded-lg border bg-white px-3 py-3 sm:px-4",
                i % 2 === 0
                  ? "border-theme-blue/30 border-l-4 border-l-theme-blue"
                  : "border-theme-orange/30 border-l-4 border-l-theme-orange",
              ].join(" ")}
              data-module5-paragraph-card="true"
            >
              <p className="text-[11px] font-bold uppercase tracking-wide text-text-muted">
                {getBodyParagraphLabel(i)} plan
                {typeof card.sourceParagraphIndex === "number"
                  ? ` · from Module 4 (${getBodyParagraphLabel(card.sourceParagraphIndex)})`
                  : ""}
              </p>
              <p className="mt-1 text-sm font-semibold text-theme-blue break-words">
                {card.job || "Organizational job"}
              </p>
              <p className="mt-1 text-sm break-words text-theme-dark">
                {card.point || card.bucket}
              </p>
              <p className="mt-2 flex flex-wrap gap-2 text-[11px] text-theme-dark/75">
                <span className="rounded border border-border-soft px-1.5 py-0.5">
                  Evidence: {outlineCardEvidenceCount(card)}
                </span>
                <span className="rounded border border-border-soft px-1.5 py-0.5">
                  {outlineCardReasoningReady(card)
                    ? "Reasoning ready"
                    : "Reasoning needed"}
                </span>
              </p>
            </li>
          ))}
        </ul>
        {outline.length === 0 ? (
          <p
            className="text-sm text-theme-orange break-words"
            role="status"
            data-testid="module5-incomplete-module4-warning"
          >
            Finish the required paragraph plans in Module 4, then return here.
          </p>
        ) : null}
      </div>
    );
  } else if (stage === MODULE5_STAGE.ORDER) {
    main = (
      <div className={`w-full space-y-4 overflow-x-hidden ${readonly}`}>
        {orderGuidance.available ? (
          <div className="w-full rounded-lg border border-theme-blue/25 bg-theme-blue/[0.04] px-3 py-3">
            <p className="text-[11px] font-bold uppercase tracking-wide text-theme-blue">
              Order guidance
            </p>
            <p className="mt-1 text-sm break-words text-theme-dark">
              {orderGuidance.reason}
            </p>
            <p className="mt-1 text-[11px] text-theme-dark/70">
              Guidance only — your current order stays until you move a card.
            </p>
          </div>
        ) : null}
        <ol className="w-full space-y-3" data-module5-paragraph-cards="true">
          {outline.map((card, i) => (
            <li
              key={`order-${card.sourceParagraphIndex ?? i}`}
              className={[
                "w-full rounded-lg border bg-white px-3 py-3 sm:px-4",
                i % 2 === 0
                  ? "border-theme-blue/30 border-l-4 border-l-theme-blue"
                  : "border-theme-orange/30 border-l-4 border-l-theme-orange",
              ].join(" ")}
              data-module5-paragraph-card="true"
            >
              <p className="text-[11px] font-bold uppercase tracking-wide text-text-muted">
                {getBodyParagraphLabel(i)}
                {typeof card.sourceParagraphIndex === "number"
                  ? ` · planned as ${getBodyParagraphLabel(card.sourceParagraphIndex)}`
                  : ""}
              </p>
              <p className="mt-1 text-sm font-semibold text-theme-blue break-words">
                {card.job || "Job"}
              </p>
              <p className="mt-1 text-sm break-words">{card.point || card.bucket}</p>
              <p className="mt-1 text-[11px] text-theme-dark/70">
                Evidence: {outlineCardEvidenceCount(card)}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="min-h-[44px] rounded-md border border-border-soft px-3 text-sm font-semibold disabled:opacity-40"
                  disabled={locked || i === 0}
                  aria-label={`Move paragraph ${i + 1} earlier`}
                  onClick={() => moveCard(i, i - 1)}
                >
                  Move earlier
                </button>
                <button
                  type="button"
                  className="min-h-[44px] rounded-md border border-border-soft px-3 text-sm font-semibold disabled:opacity-40"
                  disabled={locked || i === outline.length - 1}
                  aria-label={`Move paragraph ${i + 1} later`}
                  onClick={() => moveCard(i, i + 1)}
                >
                  Move later
                </button>
                <button
                  type="button"
                  className="min-h-[44px] rounded-md border border-border-soft px-3 text-sm font-semibold disabled:opacity-40"
                  disabled={locked || i === 0}
                  aria-label={`Move paragraph ${i + 1} to beginning`}
                  onClick={() => moveCard(i, 0)}
                >
                  To beginning
                </button>
                <button
                  type="button"
                  className="min-h-[44px] rounded-md border border-border-soft px-3 text-sm font-semibold disabled:opacity-40"
                  disabled={locked || i === outline.length - 1}
                  aria-label={`Move paragraph ${i + 1} to end`}
                  onClick={() => moveCard(i, outline.length - 1)}
                >
                  To end
                </button>
              </div>
            </li>
          ))}
        </ol>
      </div>
    );
  } else if (stage === MODULE5_STAGE.REVIEW_BODY) {
    const sliceEnabled =
      isBodyParagraphVerticalSliceEnabled() &&
      typeof bodyReviewIndex === "number" &&
      bodyReviewIndex >= 0 &&
      activeCard;
    const enrichedCard = activeCard
      ? withOutlineMoveOrder(activeCard, {
          essayOrderIndex: bodyReviewIndex,
          bodyCount: outline.length || 2,
        })
      : null;
    const bpSlice =
      sliceEnabled && enrichedCard
        ? buildBodyParagraphSlice({
            sourceParagraphIndex:
              typeof enrichedCard.sourceParagraphIndex === "number"
                ? enrichedCard.sourceParagraphIndex
                : bodyReviewIndex,
            essayOrderIndex: bodyReviewIndex,
            outlineCard: enrichedCard,
            thesis,
            includeTransition: bodyReviewIndex < (outline.length || 2) - 1,
          })
        : null;
    const writingSummary = bpSlice
      ? formatBodyParagraphWritingPlanSummary(bpSlice)
      : null;
    const formalLines = bpSlice
      ? formatBodyParagraphFormalOutlineLines(bpSlice, "II")
      : [];

    main = (
      <div className={`space-y-4 overflow-x-hidden ${readonly}`}>
        {reviewedBodyIndices
          .filter((idx) => idx !== bodyReviewIndex)
          .map((idx) => {
            const card = outline[idx];
            if (!card) return null;
            return (
              <div
                key={`reviewed-${idx}`}
                className="rounded-lg border border-theme-green/25 bg-theme-green/[0.04] px-3 py-2"
              >
                <p className="text-[11px] font-bold uppercase tracking-wide text-theme-green">
                  Reviewed · {getBodyParagraphLabel(idx)}
                </p>
                <p className="text-sm break-words text-theme-dark">
                  {card.job ? `${card.job} — ` : ""}
                  {card.point || card.bucket}
                </p>
              </div>
            );
          })}
        {activeCard ? (
          <div className="rounded-xl border-2 border-theme-orange/35 bg-white px-4 py-4 space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-wide text-theme-orange">
              Reviewing {getBodyParagraphLabel(bodyReviewIndex)}
            </p>
            {sliceEnabled ? (
              <div
                className="rounded-md border border-theme-blue/25 bg-theme-blue/[0.04] px-3 py-2 space-y-2"
                data-testid="module5-bp-slice-outline"
              >
                <p className="text-sm text-theme-dark">
                  <span className="font-semibold">Paragraph plan</span> is what
                  this paragraph will prove and which evidence it uses.{" "}
                  <span className="font-semibold">Outline</span> is where it sits
                  and the order of moves inside it.
                </p>
                <div className="flex flex-wrap gap-2" role="group" aria-label="Outline view">
                  <button
                    type="button"
                    className={`min-h-[44px] rounded-md border px-3 text-sm font-semibold ${
                      outlineViewMode === "writing"
                        ? "border-theme-blue bg-theme-blue/10 text-theme-blue"
                        : "border-border-soft"
                    }`}
                    aria-pressed={outlineViewMode === "writing"}
                    onClick={() => setOutlineViewMode("writing")}
                  >
                    Writing plan
                  </button>
                  <button
                    type="button"
                    className={`min-h-[44px] rounded-md border px-3 text-sm font-semibold ${
                      outlineViewMode === "formal"
                        ? "border-theme-blue bg-theme-blue/10 text-theme-blue"
                        : "border-border-soft"
                    }`}
                    aria-pressed={outlineViewMode === "formal"}
                    onClick={() => setOutlineViewMode("formal")}
                  >
                    Formal outline
                  </button>
                </div>
                {outlineViewMode === "formal" ? (
                  <pre
                    className="whitespace-pre-wrap break-words text-sm text-theme-dark font-mono"
                    data-testid="module5-formal-outline-bp1"
                  >
                    {formalLines.join("\n")}
                  </pre>
                ) : (
                  <ul className="space-y-1 text-sm" data-testid="module5-writing-plan-bp1">
                    <li>
                      <span className="font-semibold">{writingSummary?.label}:</span>{" "}
                      {writingSummary?.purpose || "(purpose)"}
                    </li>
                    {(writingSummary?.moves || []).map((m) => (
                      <li key={m.id}>• {m.title}</li>
                    ))}
                  </ul>
                )}
              </div>
            ) : null}
            <label className="block text-sm font-semibold text-theme-dark">
              Organizational job
              <input
                className="mt-1 w-full rounded-md border border-border-soft px-3 py-2 text-sm min-h-[44px]"
                value={activeCard.job || ""}
                disabled={locked}
                onChange={(e) =>
                  updateBodyCard(bodyReviewIndex, { job: e.target.value })
                }
              />
            </label>
            <label className="block text-sm font-semibold text-theme-dark">
              Paragraph point
              <textarea
                className="mt-1 w-full rounded-md border border-border-soft px-3 py-2 text-sm min-h-[80px]"
                value={activeCard.point || activeCard.bucket || ""}
                disabled={locked}
                onChange={(e) =>
                  updateBodyCard(bodyReviewIndex, {
                    point: e.target.value,
                    bucket: e.target.value,
                  })
                }
              />
            </label>
            <div>
              <p className="text-sm font-semibold text-theme-dark">Evidence</p>
              <ul className="mt-2 space-y-2">
                {(activeCard.evidence || []).map((ev, ei) => (
                  <li
                    key={`ev-${ei}`}
                    className="rounded-md border border-border-soft bg-surface-soft/40 px-3 py-2 text-sm break-words"
                  >
                    {ev.observation ? (
                      <span className="block">{ev.observation}</span>
                    ) : null}
                    {ev.quote ? (
                      <span className="block italic text-theme-dark/85">
                        “{ev.quote}”
                      </span>
                    ) : null}
                  </li>
                ))}
                {!(activeCard.evidence || []).length
                  ? (activeCard.points || [])
                      .filter((p) => p && p !== activeCard.reasoning)
                      .map((p, ei) => (
                        <li
                          key={`pt-${ei}`}
                          className="rounded-md border border-border-soft px-3 py-2 text-sm break-words"
                        >
                          {p}
                        </li>
                      ))
                  : null}
              </ul>
            </div>
            <label className="block text-sm font-semibold text-theme-dark">
              Reasoning / outline notes
              <textarea
                className="mt-1 w-full rounded-md border border-border-soft px-3 py-2 text-sm min-h-[100px]"
                value={activeCard.reasoning || ""}
                disabled={locked}
                onChange={(e) =>
                  updateBodyCard(bodyReviewIndex, {
                    reasoning: e.target.value,
                  })
                }
              />
            </label>
          </div>
        ) : null}
      </div>
    );
  } else if (stage === MODULE5_STAGE.CONCLUSION) {
    const conclusionSliceEnabled = isSectionVerticalSliceEnabled();
    const conclusionSlice = conclusionSliceEnabled
      ? buildConclusionSlice({
          thesis,
          outline: { body: outline, conclusion },
        })
      : null;
    const conclusionWriting = conclusionSlice
      ? formatConclusionWritingPlanSummary(conclusionSlice)
      : null;
    const conclusionFormal = conclusionSlice
      ? formatConclusionFormalOutlineLines(
          conclusionSlice,
          outline.length === 3 ? "V" : "IV"
        )
      : [];

    main = (
      <div className={`space-y-4 overflow-x-hidden ${readonly}`}>
        {conclusionSliceEnabled ? (
          <div
            className="rounded-md border border-theme-blue/25 bg-theme-blue/[0.04] px-3 py-2 space-y-2"
            data-testid="module5-conclusion-slice-outline"
          >
            <p className="text-sm font-semibold text-theme-dark">
              {getConclusionLabel()} — what this section does
            </p>
            <p className="text-sm text-theme-dark/85">
              Return to your argument in fresh language, bring the body
              paragraphs together, explain what the comparison shows, and end
              with one purposeful thought.
            </p>
            <ul className="space-y-1 text-sm" data-testid="module5-writing-plan-conclusion">
              {(conclusionWriting?.moves || []).map((m) => (
                <li key={m.id}>• {m.title}</li>
              ))}
            </ul>
            <pre
              className="whitespace-pre-wrap break-words text-xs text-theme-dark/70 font-mono"
              data-testid="module5-formal-outline-conclusion"
            >
              {conclusionFormal.join("\n")}
            </pre>
          </div>
        ) : null}
        {conclusionMicro === 0 || conclusionMicro === 2 ? (
          <label className="block text-sm font-semibold text-theme-dark">
            What should the reader understand after the body paragraphs?
            <textarea
              className="mt-1 w-full rounded-md border border-border-soft px-3 py-2 text-sm min-h-[90px]"
              value={conclusion.summary}
              disabled={locked}
              onChange={(e) => {
                markDirty();
                setConclusion((c) => ({ ...c, summary: e.target.value }));
              }}
            />
          </label>
        ) : null}
        {conclusionMicro >= 1 ? (
          <label className="block text-sm font-semibold text-theme-dark">
            Why does this argument matter?
            <textarea
              className="mt-1 w-full rounded-md border border-border-soft px-3 py-2 text-sm min-h-[90px]"
              value={conclusion.finalThought}
              disabled={locked}
              onChange={(e) => {
                markDirty();
                setConclusion((c) => ({
                  ...c,
                  finalThought: e.target.value,
                }));
              }}
            />
          </label>
        ) : null}
        {conclusionMicro === 2 && !validateConclusionPlan(conclusion).valid ? (
          <p className="text-sm text-theme-orange" role="status">
            {validateConclusionPlan(conclusion).message}
          </p>
        ) : null}
      </div>
    );
  } else {
    const introSliceEnabled = isSectionVerticalSliceEnabled();
    const introSlice = introSliceEnabled
      ? buildIntroductionSlice({ thesis })
      : null;
    const introWriting = introSlice
      ? formatIntroductionWritingPlanSummary(introSlice)
      : null;
    const introFormal = introSlice
      ? formatIntroductionFormalOutlineLines(introSlice, "I")
      : [];
    const finalizeConclusionSlice = introSliceEnabled
      ? buildConclusionSlice({
          thesis,
          outline: { body: outline, conclusion },
        })
      : null;
    const finalizeConclusionWriting = finalizeConclusionSlice
      ? formatConclusionWritingPlanSummary(finalizeConclusionSlice)
      : null;

    main = (
      <div className={`space-y-4 overflow-x-hidden ${readonly}`}>
        {introSliceEnabled ? (
          <div
            className="rounded-lg border border-theme-blue/25 bg-theme-blue/[0.04] px-3 py-3"
            data-testid="module5-intro-slice-outline"
          >
            <p className="text-[11px] font-bold uppercase tracking-wide text-theme-blue">
              {getIntroductionLabel()}
            </p>
            <p className="mt-1 text-sm text-theme-dark/85">
              Open the essay and arrive at the thesis.
            </p>
            <ul className="mt-2 space-y-1 text-sm" data-testid="module5-writing-plan-intro">
              {(introWriting?.moves || []).map((m) => (
                <li key={m.id}>• {m.title}</li>
              ))}
            </ul>
            <pre
              className="mt-2 whitespace-pre-wrap break-words text-xs text-theme-dark/70 font-mono"
              data-testid="module5-formal-outline-intro"
            >
              {introFormal.join("\n")}
            </pre>
          </div>
        ) : null}
        <div className="rounded-lg border border-theme-green/30 bg-theme-green/5 px-3 py-3">
          <p className="text-[11px] font-bold uppercase tracking-wide text-theme-green">
            Thesis
          </p>
          <p className="mt-1 text-sm whitespace-pre-wrap break-words">{thesis}</p>
        </div>
        <div className="space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wide text-text-muted">
            Body paragraphs (in order)
          </p>
          {outline.map((card, i) => (
            <div
              key={`final-${i}`}
              className="rounded-lg border border-border-soft bg-white px-3 py-2"
            >
              <p className="text-sm font-semibold text-theme-blue">
                {i + 1}. {card.job || "Paragraph"}
              </p>
              <p className="text-sm break-words">{card.point || card.bucket}</p>
            </div>
          ))}
        </div>
        <div className="rounded-lg border border-theme-blue/25 bg-theme-blue/[0.04] px-3 py-3">
          <p className="text-[11px] font-bold uppercase tracking-wide text-theme-blue">
            {getConclusionLabel()} plan
          </p>
          {finalizeConclusionWriting ? (
            <ul
              className="mt-2 space-y-1 text-sm"
              data-testid="module5-finalize-conclusion-moves"
            >
              {(finalizeConclusionWriting.moves || []).map((m) => (
                <li key={m.id}>• {m.title}</li>
              ))}
            </ul>
          ) : null}
          <p className="mt-1 text-sm break-words">{conclusion.summary}</p>
          <p className="mt-2 text-sm break-words">{conclusion.finalThought}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 py-6 overflow-x-hidden">
      <ProgressDots
        total={MODULE5_STAGE_COUNT}
        activeStep={stage}
        label="Outline steps"
      />

      {locked ? (
        <div className="mb-4 rounded-lg border border-theme-green/30 bg-theme-green/5 px-4 py-3 text-sm text-theme-dark">
          Your outline is complete. You can review it here, then continue to
          Module 6 when you are ready to draft.
        </div>
      ) : null}

      {upstreamUnavailableMessage ? (
        <div
          className="mb-4 rounded-lg border border-border-soft bg-white px-3 py-3"
          role="status"
          data-testid="module5-upstream-unavailable"
        >
          <p className="text-sm text-theme-dark/85 break-words">
            {upstreamUnavailableMessage}
          </p>
        </div>
      ) : null}

      {upstreamNotice?.changedSources?.length ? (
        <div
          className="mb-4 rounded-lg border border-theme-orange/35 bg-theme-orange/[0.07] px-3 py-3"
          role="status"
        >
          <p className="text-sm font-semibold text-theme-dark">
            Some Module 4 paragraph plans changed
          </p>
          <p className="mt-1 text-sm text-theme-dark/85">
            Your outline edits and order stayed as you left them. Review and
            update only if you want the newer Module 4 wording.
          </p>
          <ul className="mt-2 space-y-2">
            {upstreamNotice.changedSources.map((src) => (
              <li
                key={src.sourceParagraphIndex}
                className="flex flex-wrap items-center gap-2 text-sm"
              >
                <span className="break-words">{src.label}</span>
                <button
                  type="button"
                  className="min-h-[44px] rounded-md border border-theme-orange/40 px-3 text-sm font-semibold"
                  onClick={() =>
                    applyUpstreamRefresh(src.sourceParagraphIndex)
                  }
                >
                  Update this paragraph from Module 4
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <ModuleFiveStepFrame
        question={presentation.question}
        whyMatters={presentation.whyMatters}
        coachingMessage={presentation.coachingMessage}
        nextStepText={presentation.nextStepText}
        successLooksLike={[
          "One outline decision at a time",
          "Paragraph thinking came with you from Module 4",
        ]}
      >
        {main}

        <div className="mt-6 space-y-3 border-t border-border-soft/60 pt-4">
          {!stageGate.ok &&
          stage !== MODULE5_STAGE.FINALIZE &&
          !(stage === MODULE5_STAGE.BRING_IN && outline.length < 2) ? (
            <p className="text-xs text-theme-orange break-words" role="status">
              {stageGate.message}
            </p>
          ) : null}
          {navError ? (
            <div
              className="rounded-md border border-theme-orange/40 bg-white px-3 py-2"
              role="alert"
              data-testid="module5-navigation-save-error"
            >
              <p className="text-sm break-words">{navError}</p>
              <button
                type="button"
                className="mt-2 min-h-[44px] rounded-md border border-theme-orange/40 px-3 text-sm font-semibold"
                disabled={navBusy}
                onClick={() => advanceFromCurrentStage()}
              >
                Retry
              </button>
            </div>
          ) : null}
          {finalizeError ? (
            <div
              className="rounded-md border border-red-300 bg-white px-3 py-2"
              role="alert"
              data-testid="module5-finalize-error"
            >
              <p className="text-sm font-semibold text-red-700 break-words">
                {finalizeError}
              </p>
              <button
                type="button"
                className="mt-2 min-h-[44px] rounded-md border border-red-300 px-3 text-sm font-semibold"
                disabled={isFinalizing}
                onClick={() => finalizeOutline()}
              >
                Retry
              </button>
            </div>
          ) : null}

          {stage !== MODULE5_STAGE.FINALIZE ? (
            <button
              type="button"
              className="w-full sm:w-auto min-h-[44px] rounded-lg bg-theme-blue px-4 py-3 text-sm font-medium text-white disabled:opacity-50"
              disabled={!stageGate.ok || navBusy || locked || !writesAllowed}
              aria-busy={navBusy ? "true" : "false"}
              onClick={() => advanceFromCurrentStage()}
            >
              {presentation.primaryActionLabel}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => finalizeOutline()}
              aria-label="Finish my outline"
              className="w-full sm:w-auto min-h-[44px] rounded-lg bg-theme-orange px-4 py-3 text-sm font-medium text-white disabled:opacity-50"
              disabled={locked || isFinalizing || !stageGate.ok || !writesAllowed}
            >
              {isFinalizing ? "Saving outline…" : "Finish my outline"}
            </button>
          )}
        </div>
      </ModuleFiveStepFrame>
    </div>
  );
}
