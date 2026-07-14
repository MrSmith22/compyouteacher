// components/ModuleEight.js
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef, useMemo } from "react";
import { useSession } from "next-auth/react";
import { mlkRhetoricalAnalysisAssignment } from "@/lib/assignments";
import {
  getModule7DraftRow,
  getModule8DraftRow,
  getOutlineRow,
} from "@/lib/artifacts/readArtifactsClient";
import { upsertModule8DraftArtifact } from "@/lib/artifacts/writeArtifacts";
import {
  getModule9Checklist,
  upsertModule9Checklist,
} from "@/lib/supabase/helpers/module9Checklist";
import {
  createOrUpdateSubmissionGoogleDoc,
  hydrateSubmissionGoogleDoc,
  verifySubmissionGoogleDocContent,
  logSubmissionDocReplacementCancelled,
  SUBMISSION_DOC_STATUS,
  SUBMISSION_DOC_VERIFICATION_STATUS,
  getSubmissionDocVerificationMessage,
  SUBMISSION_DOC_VERIFICATION_EXPLAIN,
  SUBMISSION_DOC_MISMATCH_RECOVERY,
} from "@/lib/exports/createOrUpdateSubmissionGoogleDocClient";
import SubmissionDocRecoveryPanel from "@/components/exports/SubmissionDocRecoveryPanel";
import ModuleSixStepFrame from "@/components/module6/ModuleSixStepFrame";
import ModulePageShell from "@/components/layout/ModulePageShell";
import { WorkingSetSection } from "@/components/module3/ModuleThreeDeskFrame";
import {
  HIERARCHY_ACTION_FINAL_CLASS,
  HIERARCHY_ACTION_PRIMARY_CLASS,
  HIERARCHY_ACTION_SECONDARY_CLASS,
  HIERARCHY_FOCUS_RING_CLASS,
  HIERARCHY_WORK_SURFACE_CLASS,
} from "@/lib/ui/hierarchyContract";
import SuccessCriteriaPanel from "@/components/shared/SuccessCriteriaPanel";
import InstructionalDisclosure from "@/components/shared/InstructionalDisclosure";
import ModuleEightReferenceShelf from "@/components/module8/ModuleEightReferenceShelf";
import {
  getSectionCountFromOutline,
  splitDraftIntoSections,
} from "@/components/module7/module7DraftSections";
import EssayProseView from "@/components/module7/EssayProseView";
import { buildDraftSectionSteps } from "@/components/module6/module6StepPresentation";
import {
  getModule8StepPresentation,
  MODULE8_STEP_TYPES,
  MODULE8_WORKSPACE_STEPS,
  MODULE8_FORMAT_APA_DOES,
  MODULE8_FORMAT_CHANGE_CATEGORIES,
  MODULE8_READY_CONFIDENCE_ITEMS,
} from "@/components/module8/module8StepPresentation";
import { logActivity } from "../lib/logActivity";

const CHECKLIST_ITEMS = [
  "Font: Times New Roman, size 12.",
  "Spacing: double spaced everywhere, including references.",
  "Margins: one inch on all sides.",
  "Title page: includes title, your name, school, course, teacher, and date in the correct spots.",
  "Page numbers: page number in the top right corner of every page.",
  "References page: starts on a new page, entries in alphabetical order by author last name, double spaced.",
];

const FINISHED_ESSAY_PREVIEW_CLASS =
  "max-h-[min(280px,40vh)] overflow-y-auto rounded-xl border border-border-soft/70 bg-surface-soft/40 px-4 py-3 text-sm leading-7 text-text-primary";

function PreparationProgressPanel({
  hasGoogleDoc,
  checklistComplete,
  isReadyStep,
  preparationComplete,
}) {
  const apaStatus = checklistComplete
    ? { mark: "✓", label: "Complete", className: "text-theme-green" }
    : hasGoogleDoc
      ? { mark: "○", label: "In progress", className: "text-text-primary" }
      : { mark: "○", label: "Next", className: "text-text-muted" };

  const docStatus = hasGoogleDoc
    ? { mark: "✓", label: "Created", className: "text-theme-green" }
    : { mark: "○", label: "Next", className: "text-text-muted" };

  const readyStatus = preparationComplete
    ? { mark: "✓", label: "Ready", className: "text-theme-green" }
    : isReadyStep
      ? { mark: "○", label: "Almost there", className: "text-text-primary" }
      : { mark: "○", label: "Next", className: "text-text-muted" };

  const rows = [
    { label: "Your finished essay", mark: "✓", status: "Complete", className: "text-theme-green" },
    { label: "Google Doc", mark: docStatus.mark, status: docStatus.label, className: docStatus.className },
    { label: "APA formatting", mark: apaStatus.mark, status: apaStatus.label, className: apaStatus.className },
    { label: "Ready to turn in", mark: readyStatus.mark, status: readyStatus.label, className: readyStatus.className },
  ];

  return (
    <div className="rounded-lg border border-border-soft/60 bg-surface-soft/25 px-4 py-3 text-left">
      <p className="text-[11px] font-medium uppercase tracking-wide text-text-muted">
        Preparing your paper
      </p>
      <ul className="mt-2 space-y-1.5">
        {rows.map((row) => (
          <li
            key={row.label}
            className="flex items-center justify-between gap-3 text-sm"
          >
            <span className="text-text-primary">{row.label}</span>
            <span className={`text-xs font-medium ${row.className}`}>
              {row.mark} {row.status}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function ModuleEight() {
  const { data: session } = useSession();
  const router = useRouter();

  const [outline, setOutline] = useState(null);
  const [outlineLoading, setOutlineLoading] = useState(true);
  const [outlineMissing, setOutlineMissing] = useState(false);

  const [finishedEssayText, setFinishedEssayText] = useState("");
  const [sections, setSections] = useState([]);
  const [locked, setLocked] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const [submissionDocUrl, setSubmissionDocUrl] = useState(null);
  const [docVerifiedThisSession, setDocVerifiedThisSession] = useState(false);
  const [previouslyFinalized, setPreviouslyFinalized] = useState(false);
  const [creatingDoc, setCreatingDoc] = useState(false);
  const [popupBlocked, setPopupBlocked] = useState(false);
  const [docExportNotice, setDocExportNotice] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [exportStatus, setExportStatus] = useState(null);
  const [lastDocOperation, setLastDocOperation] = useState(null);
  const verificationInFlightRef = useRef(false);
  const exportInFlightRef = useRef(false);

  const [checklistState, setChecklistState] = useState(Array(6).fill(false));
  const [checklistLoading, setChecklistLoading] = useState(true);
  const [checklistError, setChecklistError] = useState(null);
  // WP-035: local Ready-step confidence confirmations (not persisted APA checklist).
  const [confidenceState, setConfidenceState] = useState(
    () => Array(MODULE8_READY_CONFIDENCE_ITEMS.length).fill(false)
  );

  const hasLoggedStartRef = useRef(false);
  const checklistLoadedRef = useRef(false);
  const saveDebounceRef = useRef(null);
  const hasInitialChecklistLoadRef = useRef(false);
  const navigatedToSuccessRef = useRef(false);

  const email = session?.user?.email ?? null;
  const assignmentQuestion = mlkRhetoricalAnalysisAssignment.essentialQuestion;

  const sectionSteps = useMemo(
    () => (outline ? buildDraftSectionSteps(outline) : []),
    [outline]
  );

  const currentStep = MODULE8_WORKSPACE_STEPS[currentStepIndex] ?? MODULE8_WORKSPACE_STEPS[0];
  const presentation = useMemo(
    () =>
      getModule8StepPresentation(currentStep, {
        hasExistingDoc: !!submissionDocUrl,
      }),
    [currentStep, submissionDocUrl]
  );

  const checklistComplete = checklistState.every(Boolean);
  const confidenceComplete = confidenceState.every(Boolean);

  const getTextMetrics = (value) => {
    const raw = typeof value === "string" ? value : finishedEssayText;
    const words = raw
      .trim()
      .split(/\s+/)
      .filter(Boolean).length;
    return { wordCount: words, charCount: raw.length };
  };

  useEffect(() => {
    const load = async () => {
      if (!email) return;

      setOutlineLoading(true);
      setOutlineMissing(false);

      const outlineResult = await getOutlineRow(5);
      if (!outlineResult.ok) {
        console.error("Error loading outline for Module 8:", outlineResult.error);
      }

      const outlineRow = outlineResult.data;
      const hasOutline = !!outlineRow?.outline;
      const sectionCount = getSectionCountFromOutline(outlineRow?.outline);

      setOutline(outlineRow?.outline ?? null);
      setOutlineMissing(!hasOutline);
      setOutlineLoading(false);

      if (!hasOutline) return;

      const [m7Result, m8Result, docResult] = await Promise.all([
        getModule7DraftRow(),
        getModule8DraftRow(),
        hydrateSubmissionGoogleDoc({ userEmail: email }),
      ]);

      if (!m7Result.ok) console.error("Module 7 fetch error:", m7Result.error);
      if (!m8Result.ok) console.error("Module 8 fetch error:", m8Result.error);

      const m7 = m7Result.data;
      const m8 = m8Result.data;
      const essayText = String(m7?.final_text || m7?.full_text || "").trim();

      setFinishedEssayText(essayText);
      setSections(splitDraftIntoSections(essayText, sectionCount));

      if (docResult.url) {
        setSubmissionDocUrl(docResult.url);
        if (!verificationInFlightRef.current) {
          verificationInFlightRef.current = true;
          setVerificationStatus(SUBMISSION_DOC_VERIFICATION_STATUS.CHECKING);
          verifySubmissionGoogleDocContent({
            userEmail: email,
            module: 8,
          })
            .then((v) => {
              setVerificationStatus(v.status);
              if (v.url) setSubmissionDocUrl(v.url);
              // Informational only — WP-002 still requires this-session Create/Update.
              if (v.status === SUBMISSION_DOC_VERIFICATION_STATUS.MISMATCH) {
                setDocExportNotice({
                  type: "error",
                  status: v.status,
                  message: `${v.message} ${SUBMISSION_DOC_MISMATCH_RECOVERY}`,
                });
              }
            })
            .finally(() => {
              verificationInFlightRef.current = false;
            });
        }
      }
      if (docResult.error) {
        console.warn("Submission doc hydrate:", docResult.error);
      }

      // WP-002: never treat final_ready, exported_docs, or seeded history as a
      // verified Google Doc for this visit. Only a successful Create/Update
      // in this session that also verifies content sets docVerifiedThisSession.
      setDocVerifiedThisSession(false);
      // Do not clear verificationStatus here — the in-flight revisit verify
      // owns status updates and must not be wiped by a race.

      if (m8?.final_ready) {
        setPreviouslyFinalized(true);
        if (m8?.final_text) {
          const lockedText = String(m8.final_text).trim();
          setFinishedEssayText(lockedText);
          setSections(splitDraftIntoSections(lockedText, sectionCount));
        }
        // Stay on CREATE_DOC so the student must confirm/export this visit.
        setCurrentStepIndex(0);
        setLocked(false);
      } else {
        setPreviouslyFinalized(false);
      }

      if (!hasLoggedStartRef.current) {
        hasLoggedStartRef.current = true;
        const metrics = getTextMetrics(essayText);
        await logActivity(email, "module_started", {
          module: 8,
          from_module7_final: !!m7?.final_text,
          module8_already_locked: !!m8?.final_ready,
          has_submission_doc: !!docResult.url,
          ...metrics,
        });
      }
    };

    load();
  }, [email]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const email = session?.user?.email;
    if (!email || checklistLoadedRef.current) {
      if (!email) setChecklistLoading(false);
      return;
    }
    checklistLoadedRef.current = true;
    (async () => {
      const { data, error } = await getModule9Checklist({ userEmail: email });
      if (error) {
        setChecklistError(error.message ?? "Could not load checklist");
      }
      if (data?.items && Array.isArray(data.items) && data.items.length === 6) {
        setChecklistState(data.items.map(Boolean));
      }
      setChecklistLoading(false);
      hasInitialChecklistLoadRef.current = true;
    })();
  }, [session?.user?.email]);

  useEffect(() => {
    const email = session?.user?.email;
    if (!email || checklistLoading || !hasInitialChecklistLoadRef.current) return;
    if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current);
    saveDebounceRef.current = setTimeout(async () => {
      saveDebounceRef.current = null;
      const { error } = await upsertModule9Checklist({
        userEmail: email,
        items: checklistState,
      });
      if (error) {
        setChecklistError(error.message ?? "Could not save checklist");
      }
    }, 400);
    return () => {
      if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current);
    };
  }, [session?.user?.email, checklistState, checklistLoading]);

  // WP-068 + WP-035: after this-visit verify and APA checklist, previously
  // finalized students land on Ready (same as first-time) so the confidence
  // checklist can complete before /modules/8/success (WP-067 advance).
  useEffect(() => {
    if (
      !previouslyFinalized ||
      !docVerifiedThisSession ||
      !checklistComplete ||
      confidenceComplete ||
      navigatedToSuccessRef.current
    ) {
      return;
    }
    setCurrentStepIndex(MODULE8_WORKSPACE_STEPS.length - 1);
  }, [
    previouslyFinalized,
    docVerifiedThisSession,
    checklistComplete,
    confidenceComplete,
  ]);

  const handleCreateOrUpdateSubmissionDoc = async ({
    forceCreate = false,
  } = {}) => {
    if (!email) return;
    if (locked && docVerifiedThisSession) return;
    if (exportInFlightRef.current) return;
    exportInFlightRef.current = true;

    const hadExistingDoc = !!submissionDocUrl;
    setCreatingDoc(true);
    setDocExportNotice(null);
    setExportStatus(SUBMISSION_DOC_STATUS.PREPARING);
    setVerificationStatus(SUBMISSION_DOC_VERIFICATION_STATUS.CHECKING);
    setPopupBlocked(false);
    try {
      const result = await createOrUpdateSubmissionGoogleDoc({
        userEmail: email,
        module: 8,
        hadExistingDoc,
        openInNewTab: true,
        forceCreate: !!forceCreate,
        recoveryAction: forceCreate
          ? "create_new"
          : hadExistingDoc
            ? "update"
            : "create",
      });

      if (!result.ok) {
        setDocVerifiedThisSession(false);
        setLastDocOperation(null);
        setExportStatus(result.reason);
        setVerificationStatus(
          result.reason === SUBMISSION_DOC_STATUS.EXISTING_DOCUMENT_UNAVAILABLE
            ? SUBMISSION_DOC_VERIFICATION_STATUS.DOCUMENT_UNAVAILABLE
            : result.reason === SUBMISSION_DOC_STATUS.MISSING_ESSAY
              ? SUBMISSION_DOC_VERIFICATION_STATUS.MISSING_ESSAY
              : result.verification?.status ||
                SUBMISSION_DOC_VERIFICATION_STATUS.VERIFICATION_ERROR
        );
        setDocExportNotice({
          type: "error",
          status: result.reason,
          message: result.message,
        });
        return;
      }

      setSubmissionDocUrl(result.url);
      if (result.popupBlocked) setPopupBlocked(true);
      setLastDocOperation(result.operation);
      setExportStatus(result.reason);

      const verification = result.verification;
      setVerificationStatus(
        verification?.status ||
          (result.contentVerified
            ? SUBMISSION_DOC_VERIFICATION_STATUS.VERIFIED
            : null)
      );

      // WP-029: unlock only when immediate write verification passes.
      // WP-002: this-session Create/Update/Create-new that verifies.
      if (result.contentVerified) {
        setDocVerifiedThisSession(true);
        // WP-036: verified Create/Update/Create-new replaces the Google Doc body
        // (deleteContentRange + insertText). Manual APA formatting applied in the
        // Doc is therefore stale—reset Format and Ready confirmations only here,
        // not on navigate/cancel/timeout/mismatch/failed verification.
        setChecklistState(Array(CHECKLIST_ITEMS.length).fill(false));
        setConfidenceState(
          Array(MODULE8_READY_CONFIDENCE_ITEMS.length).fill(false)
        );
      } else {
        setDocVerifiedThisSession(false);
      }

      const notices = [];
      if (result.usedModule6Fallback) {
        notices.push(
          "Using your Module 6 draft because a finalized Module 7 version was not found. If you finished revising in Module 7, go back and finalize first."
        );
      }

      if (result.contentVerified && result.confirmation) {
        // WP-032: compact verified confirmation (statement + metadata in panel).
        if (notices.length === 0) {
          notices.push(result.confirmation.statement);
        }
        setDocExportNotice({
          type: "success",
          status: verification?.status || result.reason,
          message: notices.join(" "),
          confirmation: result.confirmation,
        });
      } else {
        notices.push(result.message);
        if (
          verification?.status === SUBMISSION_DOC_VERIFICATION_STATUS.MISMATCH
        ) {
          notices.push(SUBMISSION_DOC_MISMATCH_RECOVERY);
        }
        setDocExportNotice({
          type: "error",
          status: verification?.status || result.reason,
          message: notices.join(" "),
          confirmation: null,
        });
      }
    } finally {
      setCreatingDoc(false);
      exportInFlightRef.current = false;
    }
  };

  const handleRetryDocVerification = async () => {
    if (!email || verificationInFlightRef.current) return;
    verificationInFlightRef.current = true;
    setVerificationStatus(SUBMISSION_DOC_VERIFICATION_STATUS.CHECKING);
    setDocExportNotice(null);
    try {
      const v = await verifySubmissionGoogleDocContent({
        userEmail: email,
        module: 8,
      });
      setVerificationStatus(v.status);
      if (v.url) setSubmissionDocUrl(v.url);
      // WP-002: Retry alone does not unlock progression.
      setDocExportNotice({
        type: v.verified ? "success" : "error",
        status: v.status,
        message: v.verified
          ? `${v.message} ${SUBMISSION_DOC_VERIFICATION_EXPLAIN}`
          : v.status === SUBMISSION_DOC_VERIFICATION_STATUS.MISMATCH
            ? `${v.message} ${SUBMISSION_DOC_MISMATCH_RECOVERY}`
            : v.message,
      });
    } finally {
      verificationInFlightRef.current = false;
    }
  };

  const goBack = () => {
    setCurrentStepIndex((index) => Math.max(0, index - 1));
  };

  const goNext = () => {
    setCurrentStepIndex((index) => Math.min(MODULE8_WORKSPACE_STEPS.length - 1, index + 1));
  };

  /** WP-036: navigate to Create/Update only—does not export or clear checklists. */
  const openUpdateGoogleDocWorkingSet = () => {
    setCurrentStepIndex(0);
  };

  const finishPreparing = async () => {
    if (!email) return;
    // WP-035 + existing gates: never complete without verified Doc, APA checklist,
    // and Ready confidence confirmations.
    if (
      !docVerifiedThisSession ||
      !submissionDocUrl ||
      !checklistComplete ||
      !confidenceComplete
    ) {
      return;
    }

    const text = finishedEssayText;
    if (!text.trim()) {
      alert("We could not find your finished essay. Return to Module 7 and try again.");
      return;
    }

    const result = await upsertModule8DraftArtifact({
      userEmail: email,
      full_text: text,
      final_text: text,
      revised: false,
      final_ready: true,
    });

    if (!result.ok) {
      console.error("Module 8 save error:", result.error);
      alert("We could not save your progress. Please try again.");
      return;
    }

    setLocked(true);

    const metrics = getTextMetrics(text);
    await logActivity(email, "module_completed", {
      module: 8,
      has_submission_doc: !!submissionDocUrl,
      checklist_complete: checklistComplete,
      confidence_complete: confidenceComplete,
      ...metrics,
    });

    navigatedToSuccessRef.current = true;
    router.push("/modules/8/success");
  };

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-base">
        <div className="w-full max-w-md rounded-xl border border-border-soft bg-white px-6 py-5 shadow-soft">
          <h1 className="mb-2 text-2xl font-semibold text-text-primary">
            Please sign in
          </h1>
          <p className="mb-4 text-sm text-text-muted">
            Sign in to prepare your essay for submission.
          </p>
          <Link
            href="/api/auth/signin"
            className="inline-block rounded-lg bg-theme-blue px-4 py-2 text-sm font-semibold text-white"
          >
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  if (outlineLoading || checklistLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-base">
        <p className="text-text-primary">Loading your finished essay…</p>
      </div>
    );
  }

  if (outlineMissing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-base">
        <div className="max-w-md space-y-4 px-4 text-center">
          <p className="text-text-primary">
            We could not find your outline from Module 5 yet.
          </p>
          <p className="text-sm text-text-muted">
            Finish your outline in Module 5, then return here to prepare your essay
            for submission.
          </p>
          <button
            type="button"
            onClick={() => router.push("/modules/5")}
            className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-theme-blue px-5 py-2.5 text-sm font-semibold text-white hover:brightness-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-dark focus-visible:ring-offset-2"
            data-testid="module8-go-module-5"
          >
            Go to Module 5
          </button>
        </div>
      </div>
    );
  }

  if (!outline || !finishedEssayText.trim()) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-base">
        <div className="max-w-md space-y-4 px-4 text-center">
          <p className="text-text-primary">
            Finish your essay in Module 7 before preparing it for submission.
          </p>
          <button
            type="button"
            onClick={() => router.push("/modules/7")}
            className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-theme-blue px-5 py-2.5 text-sm font-semibold text-white hover:brightness-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-dark focus-visible:ring-offset-2"
            data-testid="module8-go-module-7"
          >
            Go to Module 7
          </button>
        </div>
      </div>
    );
  }

  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === MODULE8_WORKSPACE_STEPS.length - 1;
  const { wordCount } = getTextMetrics();

  const canAdvanceFromStep1 = docVerifiedThisSession;
  const canAdvanceFromStep2 = checklistComplete;
  const canFinish =
    docVerifiedThisSession &&
    !!submissionDocUrl &&
    checklistComplete &&
    confidenceComplete;
  const exportControlsDisabled =
    creatingDoc || (locked && docVerifiedThisSession);
  // WP-031: recovery panel already shows primary Continue after this-session verify.
  const showFooterKeepGoing =
    !isLastStep &&
    !locked &&
    !(
      currentStep.type === MODULE8_STEP_TYPES.CREATE_DOC &&
      docVerifiedThisSession
    );

  const openSubmissionGoogleDoc = () => {
    if (!submissionDocUrl || typeof window === "undefined") return;
    const opened = window.open(
      submissionDocUrl,
      "_blank",
      "noopener,noreferrer"
    );
    if (!opened) setPopupBlocked(true);
  };

  const referenceShelf = (
    <ModuleEightReferenceShelf
      assignmentQuestion={assignmentQuestion}
      sectionSteps={sectionSteps}
      sections={sections}
      activeStepType={currentStep.type}
      submissionDocUrl={submissionDocUrl}
      checklistComplete={checklistComplete}
    />
  );

  const finishedEssayPreview = (
    <InstructionalDisclosure
      title={`More saved work — finished essay (${wordCount} words)`}
    >      <div className={FINISHED_ESSAY_PREVIEW_CLASS}>
        <EssayProseView
          sectionSteps={sectionSteps}
          sections={sections}
          blockClassName="mb-4 last:mb-0"
        />
      </div>
      <p className="text-[11px] leading-relaxed text-text-muted">
        Your finished essay stays here (reference only). Your Google Doc is the
        paper you will format and turn in.
      </p>
    </InstructionalDisclosure>
  );

  return (
    <ModulePageShell>
      <ModuleSixStepFrame
        question={presentation.question}
        whyMatters={presentation.whyMatters}
        successLooksLike={presentation.successLooksLike}
        coachingMessage={presentation.coachingMessage}
        nextStepText={presentation.nextStepText}
        howToSucceed={presentation.howToSucceed || ""}
        sidebar={referenceShelf}
      >
        <div className="space-y-3">
          <div
            className="rounded-lg border border-border-soft/70 bg-surface-soft/40 px-4 py-3 text-left"
            data-hierarchy-level="instruction"
            data-testid="module8-submission-doc-framing"
          >
            <p className="text-sm font-semibold text-text-primary">
              Prepare Your Essay for Submission
            </p>
            <p className="mt-2 text-sm leading-relaxed text-text-primary">
              Your writing is complete. You are preparing the paper—not rewriting it.
            </p>
            {/* WP-037 — Persistent reassurance on every Module 8 step */}
            <div
              className="mt-3 border-t border-theme-blue/15 pt-3"
              data-testid="module8-submission-reassurance"
            >
              <ul className="space-y-1 text-sm leading-relaxed text-text-primary">
                <li>Your writing has been saved.</li>
                <li>
                  Nothing has been submitted yet. Module 8 prepares your Google
                  Doc; Module 9 is when you create the final PDF to turn in.
                </li>
                <li>You can return and update your Google Doc.</li>
              </ul>
            </div>
            <div className="mt-3">
              <InstructionalDisclosure title="More about preparing your paper">
                <ul className="space-y-1 text-sm leading-relaxed text-text-muted">
                  <li>You are no longer improving your ideas.</li>
                  <li>You are preparing the paper your teacher will read.</li>
                  <li>
                    Your finished essay stays here. Your Google Doc is what you will
                    format and turn in.
                  </li>
                </ul>
              </InstructionalDisclosure>
            </div>
          </div>

          <InstructionalDisclosure
            title="Preparation progress"
            data-testid="module8-preparation-progress-disclosure"
          >
            <PreparationProgressPanel
              hasGoogleDoc={docVerifiedThisSession && !!submissionDocUrl}
              checklistComplete={checklistComplete}
              isReadyStep={currentStep.type === MODULE8_STEP_TYPES.READY}
              preparationComplete={
                docVerifiedThisSession &&
                !!submissionDocUrl &&
                checklistComplete &&
                (locked || isLastStep)
              }
            />
          </InstructionalDisclosure>

          <p className="text-[11px] leading-relaxed text-text-muted/80">
            Step {currentStepIndex + 1} of {MODULE8_WORKSPACE_STEPS.length}
            {" · "}
            {currentStep.type === MODULE8_STEP_TYPES.CREATE_DOC
              ? "Create your Google Doc"
              : currentStep.type === MODULE8_STEP_TYPES.FORMAT
                ? "Format your paper"
                : "Make sure you're ready"}
          </p>
        </div>

        <WorkingSetSection
          className={HIERARCHY_WORK_SURFACE_CLASS}
          label={presentation.workingSetLabel}
          description={presentation.workingSetDescription}
        >
          {currentStep.type === MODULE8_STEP_TYPES.CREATE_DOC ? (
            <div className="space-y-4 text-left">
              {finishedEssayPreview}

              {verificationStatus ===
              SUBMISSION_DOC_VERIFICATION_STATUS.CHECKING ? (
                <p
                  role="status"
                  aria-live="polite"
                  data-testid="module8-doc-verification-status"
                  className="text-sm text-text-muted"
                >
                  {getSubmissionDocVerificationMessage(
                    SUBMISSION_DOC_VERIFICATION_STATUS.CHECKING
                  )}
                </p>
              ) : (
                <SubmissionDocRecoveryPanel
                  module={8}
                  verificationStatus={verificationStatus}
                  exportStatus={exportStatus}
                  hasUrl={!!submissionDocUrl}
                  contentVerified={docVerifiedThisSession}
                  operation={lastDocOperation}
                  docUrl={submissionDocUrl}
                  busy={creatingDoc || exportControlsDisabled}
                  notice={docExportNotice}
                  testIdPrefix="module8-doc"
                  showProgressContinue={docVerifiedThisSession}
                  onContinue={goNext}
                  onUpdate={() =>
                    handleCreateOrUpdateSubmissionDoc({ forceCreate: false })
                  }
                  onCreate={() =>
                    handleCreateOrUpdateSubmissionDoc({ forceCreate: false })
                  }
                  onCreateNew={() =>
                    handleCreateOrUpdateSubmissionDoc({ forceCreate: true })
                  }
                  onRetry={handleRetryDocVerification}
                  onFinishEssay={() => router.push("/modules/7")}
                  onReplacementCancelled={() =>
                    logSubmissionDocReplacementCancelled({
                      userEmail: email,
                      module: 8,
                      hadExistingDoc: !!submissionDocUrl,
                    })
                  }
                />
              )}

              {popupBlocked && submissionDocUrl ? (
                <p className="text-xs text-text-muted">
                  If a popup blocker stopped the new tab, use Open current Google Doc.
                </p>
              ) : null}
            </div>
          ) : null}

          {currentStep.type === MODULE8_STEP_TYPES.FORMAT ? (
            <div className="space-y-4 text-left" data-testid="module8-format-working-set">
              <InstructionalDisclosure
                title="More about APA formatting"
                data-testid="module8-format-what-apa-does"
              >
                <section aria-labelledby="module8-format-apa-does-heading">
                  <h3
                    id="module8-format-apa-does-heading"
                    className="text-sm font-semibold text-text-primary"
                  >
                    What APA formatting does
                  </h3>
                  <ul className="mt-2 space-y-1 text-sm leading-relaxed text-text-muted">
                    {MODULE8_FORMAT_APA_DOES.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                </section>
              </InstructionalDisclosure>

              {/* Stage 2 — What you will change */}
              <section
                className="rounded-lg border border-border-soft/60 bg-surface-soft/30 px-4 py-3"
                data-testid="module8-format-what-you-change"
                aria-labelledby="module8-format-change-heading"
              >
                <h3
                  id="module8-format-change-heading"
                  className="text-sm font-semibold text-text-primary"
                >
                  What you will change
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-text-primary">
                  Your writing is finished. Do not rewrite your essay here—make these
                  formatting changes inside your Google Doc.
                </p>
                <ul
                  className="mt-2 flex flex-wrap gap-1.5"
                  data-testid="module8-format-change-categories"
                >
                  {MODULE8_FORMAT_CHANGE_CATEGORIES.map((category) => (
                    <li
                      key={category}
                      className="rounded-md border border-border-soft/70 bg-white px-2.5 py-1 text-xs font-medium text-text-primary"
                    >
                      {category}
                    </li>
                  ))}
                </ul>
                {submissionDocUrl ? (
                  <button
                    type="button"
                    onClick={openSubmissionGoogleDoc}
                    className={`mt-3 inline-flex min-h-[44px] items-center justify-center rounded-lg px-5 py-2.5 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-dark focus-visible:ring-offset-2 ${
                      canAdvanceFromStep2
                        ? "border border-border-soft bg-white font-medium text-text-primary"
                        : "bg-theme-blue text-white shadow-soft"
                    }`}
                    data-testid="module8-format-open-doc"
                  >
                    Open your Google Doc
                  </button>
                ) : (
                  <p className="mt-3 text-xs text-text-muted">
                    Create or update your Google Doc in the previous step before formatting.
                  </p>
                )}
              </section>

              {/* Stage 3 — Formatting checklist (same persisted checklist) */}
              <section
                data-testid="module8-format-checklist"
                aria-labelledby="module8-format-checklist-heading"
              >
                <h3
                  id="module8-format-checklist-heading"
                  className="text-sm font-semibold text-text-primary"
                >
                  Formatting checklist
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-text-muted">
                  After you finish each item in your Google Doc, check it off here.
                </p>
                <div className="mt-3 space-y-2">
                  {CHECKLIST_ITEMS.map((label, index) => (
                    <label
                      key={label}
                      className="flex items-start gap-2 text-sm leading-relaxed text-text-primary"
                    >
                      <input
                        type="checkbox"
                        checked={checklistState[index] || false}
                        disabled={locked}
                        onChange={(e) => {
                          const next = [...checklistState];
                          next[index] = e.target.checked;
                          setChecklistState(next);
                        }}
                        className="mt-1 rounded border-border-soft text-theme-blue"
                      />
                      {label}
                    </label>
                  ))}
                </div>

                {checklistError ? (
                  <p className="mt-2 text-xs text-red-700">
                    Checklist could not be saved: {checklistError}. Your selections are
                    kept for this session.
                  </p>
                ) : null}

                {checklistComplete ? (
                  <p className="mt-2 text-sm font-medium text-theme-green">
                    All formatting items complete.
                  </p>
                ) : null}
              </section>

              {/* Stage 4 — Continue cue (footer Keep going stays the gated control) */}
              <section
                className="rounded-lg border border-border-soft/50 bg-white px-4 py-3"
                data-testid="module8-format-continue-cue"
                aria-labelledby="module8-format-continue-heading"
              >
                <h3
                  id="module8-format-continue-heading"
                  className="text-sm font-semibold text-text-primary"
                >
                  Continue
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-text-muted">
                  {checklistComplete
                    ? "Checklist complete. Use Keep going below to move to the ready check."
                    : "Keep going unlocks after every checklist item is complete."}
                </p>
              </section>

              {/* WP-036 — Escape hatch: navigate only; Keep going remains primary */}
              <div
                className="flex flex-wrap gap-2"
                data-testid="module8-format-escape-hatches"
              >
                <button
                  type="button"
                  onClick={openUpdateGoogleDocWorkingSet}
                  className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-border-soft bg-white px-4 py-2 text-sm font-medium text-text-primary hover:bg-surface-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-dark focus-visible:ring-offset-2"
                  data-testid="module8-format-update-doc-escape"
                >
                  Update Google Doc
                </button>
              </div>
            </div>
          ) : null}

          {currentStep.type === MODULE8_STEP_TYPES.READY ? (
            <div className="space-y-4 text-left" data-testid="module8-ready-working-set">
              <p className="text-sm leading-relaxed text-text-muted">
                You finished writing in Module 7. This step closes your preparation—not
                another writing assignment.
              </p>
              <ul className="space-y-2 text-sm text-text-primary">
                <li
                  className={
                    docVerifiedThisSession && submissionDocUrl
                      ? "text-theme-green"
                      : "text-text-muted"
                  }
                >
                  {docVerifiedThisSession && submissionDocUrl ? "✓" : "○"} Google Doc
                  confirmed with latest essay
                </li>
                <li className={checklistComplete ? "text-theme-green" : "text-text-muted"}>
                  {checklistComplete ? "✓" : "○"} APA formatting complete
                </li>
              </ul>

              <section
                className="rounded-lg border border-theme-blue/20 bg-theme-blue/5 px-4 py-3"
                data-testid="module8-ready-confidence-checklist"
                aria-labelledby="module8-ready-confidence-heading"
              >
                <h3
                  id="module8-ready-confidence-heading"
                  className="text-sm font-semibold text-text-primary"
                >
                  Before continuing
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-text-muted">
                  These checks do not submit your paper. They confirm your Google Doc is
                  ready before you move to Module 9.
                </p>
                <div className="mt-3 space-y-2">
                  {MODULE8_READY_CONFIDENCE_ITEMS.map((label, index) => (
                    <label
                      key={label}
                      className="flex min-h-[44px] items-start gap-2 text-sm leading-relaxed text-text-primary"
                    >
                      <input
                        type="checkbox"
                        checked={confidenceState[index] || false}
                        disabled={locked}
                        onChange={(e) => {
                          const next = [...confidenceState];
                          next[index] = e.target.checked;
                          setConfidenceState(next);
                        }}
                        className="mt-1 rounded border-border-soft text-theme-blue focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-dark focus-visible:ring-offset-2"
                        data-testid={`module8-ready-confidence-${index}`}
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </section>

              <div className="mt-1">
                <InstructionalDisclosure title="Reflection (optional)">
                  <p className="text-sm font-medium text-text-primary">Reflection</p>
                  <p className="mt-1 text-sm leading-relaxed text-text-muted">
                    What is one formatting choice you made that helps your reader?
                  </p>
                </InstructionalDisclosure>
              </div>

              {/* WP-036 — Escape hatches: secondary only; Finish stays sole primary */}
              <div
                className="flex flex-wrap gap-2"
                data-testid="module8-ready-escape-hatches"
              >
                {submissionDocUrl ? (
                  <button
                    type="button"
                    onClick={openSubmissionGoogleDoc}
                    className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-border-soft bg-white px-4 py-2 text-sm font-medium text-text-primary hover:bg-surface-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-dark focus-visible:ring-offset-2"
                    data-testid="module8-ready-open-doc"
                  >
                    Open Google Doc
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={openUpdateGoogleDocWorkingSet}
                  className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-border-soft bg-white px-4 py-2 text-sm font-medium text-text-primary hover:bg-surface-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-dark focus-visible:ring-offset-2"
                  data-testid="module8-ready-update-doc-escape"
                >
                  Update Google Doc
                </button>
              </div>

              {!canFinish && !locked ? (
                <p className="text-xs text-text-muted" data-testid="module8-ready-finish-hint">
                  {!docVerifiedThisSession || !submissionDocUrl
                    ? "Create or update your Google Doc with your latest essay first."
                    : !checklistComplete
                      ? "Complete the APA formatting checklist before finishing."
                      : "Check every item under Before continuing, then finish preparing."}
                </p>
              ) : null}
            </div>
          ) : null}
        </WorkingSetSection>

        {locked ? (
          <div className="space-y-2 rounded-lg border border-theme-green/30 bg-theme-green/5 px-4 py-3 text-sm text-theme-green">
            <p className="font-semibold">Your paper is ready.</p>
            <p>
              You prepared your Google Doc and got your paper ready to turn in.
              Continue to see your completion screen, then Module 9.
            </p>
            <button
              type="button"
              onClick={() => router.push("/modules/8/success")}
              className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-theme-blue px-4 py-2 text-sm font-semibold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-dark focus-visible:ring-offset-2"
              data-testid="module8-locked-continue"
            >
              Continue
            </button>
          </div>
        ) : null}

        {currentStep.type === MODULE8_STEP_TYPES.CREATE_DOC && !locked ? (
          <SuccessCriteriaPanel
            mode="gate"
            items={[
              "Your Google Doc is verified this session with your newest finished essay.",
            ]}
            lead="You’re ready when…"
            note="Keep going unlocks after verification succeeds. Update or recovery actions stay available if the Doc needs repair."
          />
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border-soft/60 pt-4">
          <div>
            {!isFirstStep && !locked ? (
              <button
                type="button"
                onClick={goBack}
                className={`${HIERARCHY_ACTION_SECONDARY_CLASS} ${HIERARCHY_FOCUS_RING_CLASS}`}
                data-testid="module8-back"
              >
                Back
              </button>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            {showFooterKeepGoing ? (
              <button
                type="button"
                onClick={goNext}
                disabled={
                  (currentStepIndex === 0 && !canAdvanceFromStep1) ||
                  (currentStepIndex === 1 && !canAdvanceFromStep2)
                }
                className={`${HIERARCHY_ACTION_PRIMARY_CLASS} ${HIERARCHY_FOCUS_RING_CLASS}`}
                data-testid="module8-keep-going"
                data-hierarchy-action="primary"
              >
                Keep going
              </button>
            ) : null}
            {isLastStep && !locked ? (
              <button
                type="button"
                onClick={finishPreparing}
                disabled={!canFinish}
                className={`${HIERARCHY_ACTION_FINAL_CLASS} ${HIERARCHY_FOCUS_RING_CLASS}`}
                data-testid="module8-finish-prepare"
                data-hierarchy-action="final"
              >
                Finish preparing your essay and continue
              </button>
            ) : null}
          </div>
        </div>
      </ModuleSixStepFrame>
    </ModulePageShell>
  );
}
