"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";
import { requireModuleAccess } from "@/lib/supabase/helpers/moduleGate";
import {
  getStudentExport,
} from "@/lib/supabase/helpers/studentExports";
import {
  getModule9Checklist,
  upsertModule9Checklist,
} from "@/lib/supabase/helpers/module9Checklist";
import { logActivity } from "../lib/logActivity";
import { MLK_ASSIGNMENT_NAME } from "@/lib/assignments";
import ModulePageShell from "@/components/layout/ModulePageShell";
import ScreenContractCues from "@/components/shared/ScreenContractCues";
import {
  HIERARCHY_ACTION_FINAL_CLASS,
  HIERARCHY_ACTION_PRIMARY_CLASS,
  HIERARCHY_ACTION_SECONDARY_CLASS,
  HIERARCHY_FOCUS_RING_CLASS,
  HIERARCHY_LEVELS,
  HIERARCHY_MODULE_CHROME_CLASS,
  HIERARCHY_REFERENCE_LINK_CLASS,
  HIERARCHY_TASK_CLASS,
} from "@/lib/ui/hierarchyContract";
import { openExternalResource } from "@/lib/ui/openExternalResource";
import ModuleNineApaLesson from "@/components/module9/ModuleNineApaLesson";
import ModuleNineApaQuickGuide from "@/components/module9/ModuleNineApaQuickGuide";
import ModuleNinePdfDownloadVisual from "@/components/module9/ModuleNinePdfDownloadVisual";
import InstructionalDisclosure from "@/components/shared/InstructionalDisclosure";
import ProgressCelebrationBridge from "@/components/shared/ProgressCelebrationBridge";
import { getModule9ProgressCelebration } from "@/lib/ui/moduleProgressCelebrations";
import {
  MODULE9_APA_ENTRY,
  MODULE9_APA_JOURNEY,
  MODULE9_APA_QUIZ_TOTAL,
  MODULE9_LAYOUT_CONTRACT,
  buildEmptyApaLessonState,
  getModule9FormattingChecklistItems,
} from "@/lib/module9/module9ApaLearning";
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
import { MODULE9_SCREEN_CONTRACT } from "@/lib/module9/module9ScreenContract";

const ASSIGNMENT_NAME = MLK_ASSIGNMENT_NAME;
const CHECKLIST_ITEMS = getModule9FormattingChecklistItems();
/** Step 4 only — local confirmations for the PDF selected to upload (not Step 3 APA). */
const FINAL_UPLOAD_CHECKLIST_ITEMS = Object.freeze([
  "The PDF opens correctly.",
  "The title page appears.",
  "The references page appears.",
  "The paper is double-spaced.",
  "This is the newest version of the essay.",
]);
const EMPTY_FINAL_UPLOAD_CHECKLIST = () =>
  Array(FINAL_UPLOAD_CHECKLIST_ITEMS.length).fill(false);
const FOCUS_RING =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-dark focus-visible:ring-offset-2";

export default function ModuleNine() {
  const { data: session } = useSession();
  const router = useRouter();

  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [lessonState, setLessonState] = useState(() => buildEmptyApaLessonState());
  const [apaPersisting, setApaPersisting] = useState(false);

  const [pdfFile, setPdfFile] = useState(null);
  const [finalUploadChecklistState, setFinalUploadChecklistState] = useState(
    () => EMPTY_FINAL_UPLOAD_CHECKLIST()
  );
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [exportUrl, setExportUrl] = useState(null);
  const [docHydrated, setDocHydrated] = useState(false);
  const [docBusy, setDocBusy] = useState(false);
  const [popupBlocked, setPopupBlocked] = useState(false);
  const [docNotice, setDocNotice] = useState(null);
  const [docContentVerified, setDocContentVerified] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [exportStatus, setExportStatus] = useState(null);
  const [lastDocOperation, setLastDocOperation] = useState(null);
  const [finalPdfRow, setFinalPdfRow] = useState(null);
  const [viewedStep, setViewedStep] = useState(1);
  /** WP-056 — local transient celebration; never persisted. */
  const [progressCelebration, setProgressCelebration] = useState(null);
  const hasResumedJourneyRef = useRef(false);
  const [checklistState, setChecklistState] = useState(Array(6).fill(false));
  const [checklistLoading, setChecklistLoading] = useState(true);
  const [checklistError, setChecklistError] = useState(null);

  const hasLoggedStartRef = useRef(false);
  const hasLoggedSubmissionDetectedRef = useRef(false);
  const verificationInFlightRef = useRef(false);
  const step2Ref = useRef(null);
  const step3Ref = useRef(null);
  const step4Ref = useRef(null);
  const [gateOk, setGateOk] = useState(null);

  const alreadySubmitted = !!finalPdfRow;

  useEffect(() => {
    if (alreadySubmitted) setProgressCelebration(null);
  }, [alreadySubmitted]);
  const checklistComplete = checklistState.every(Boolean);
  const finalUploadChecklistComplete = finalUploadChecklistState.every(Boolean);
  // WP-029: link alone is not enough for Google Doc ✓ / progression.
  const docReady = !!exportUrl && docContentVerified;
  const activeStep = !submitted
    ? 1
    : !docReady
      ? 2
      : !checklistComplete
        ? 3
        : 4;

  const checklistLoadedRef = useRef(false);
  const saveDebounceRef = useRef(null);
  const hasInitialLoadDoneRef = useRef(false);
  const quizHydratedRef = useRef(false);

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
      hasInitialLoadDoneRef.current = true;
    })();
  }, [session?.user?.email]);

  useEffect(() => {
    const email = session?.user?.email;
    if (!email || checklistLoading || !hasInitialLoadDoneRef.current) return;
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

  useEffect(() => {
    if (!session?.user?.email) return;
    (async () => {
      const { ok } = await requireModuleAccess({
        userEmail: session.user.email,
        assignmentName: ASSIGNMENT_NAME,
        minModule: 9,
      });
      setGateOk(ok);
    })();
  }, [session?.user?.email]);

  useEffect(() => {
    if (!session?.user?.email) return;
    if (hasLoggedStartRef.current) return;
    hasLoggedStartRef.current = true;

    logActivity(session.user.email, "module_started", {
      module: 9,
    });
  }, [session]);

  useEffect(() => {
    (async () => {
      if (!session?.user?.email) return;
      if (verificationInFlightRef.current) return;
      verificationInFlightRef.current = true;
      const email = session.user.email;
      try {
        const hydrated = await hydrateSubmissionGoogleDoc({
          userEmail: email,
        });
        if (hydrated.url) setExportUrl(hydrated.url);
        setDocHydrated(true);
        if (hydrated.error) {
          console.warn(hydrated.error);
        }

        if (!hydrated.url) {
          setDocContentVerified(false);
          setVerificationStatus(
            SUBMISSION_DOC_VERIFICATION_STATUS.MISSING_DOCUMENT
          );
          return;
        }

        setVerificationStatus(SUBMISSION_DOC_VERIFICATION_STATUS.CHECKING);
        const v = await verifySubmissionGoogleDocContent({
          userEmail: email,
          module: 9,
        });
        setVerificationStatus(v.status);
        setDocContentVerified(!!v.verified);
        if (v.url) setExportUrl(v.url);

        if (v.status === SUBMISSION_DOC_VERIFICATION_STATUS.MISMATCH) {
          setDocNotice({
            type: "error",
            status: v.status,
            message: `${v.message} ${SUBMISSION_DOC_MISMATCH_RECOVERY}`,
          });
        } else if (
          v.status === SUBMISSION_DOC_VERIFICATION_STATUS.VERIFICATION_ERROR ||
          v.status === SUBMISSION_DOC_VERIFICATION_STATUS.DOCUMENT_UNAVAILABLE
        ) {
          setDocNotice({
            type: "error",
            status: v.status,
            message: v.message,
          });
        } else if (v.verified) {
          setDocNotice({
            type: "success",
            status: v.status,
            message: `${v.message} ${SUBMISSION_DOC_VERIFICATION_EXPLAIN}`,
          });
        }
      } finally {
        verificationInFlightRef.current = false;
      }
    })();
  }, [session]);

  useEffect(() => {
    (async () => {
      if (!session?.user?.email) return;
      const result = await getStudentExport({
        userEmail: session.user.email,
        module: 9,
        kind: "final_pdf",
      });
      if (result.error) {
        console.warn(result.error);
        setFinalPdfRow(null);
        return;
      }
      if (result.data) setFinalPdfRow(result.data);
      else setFinalPdfRow(null);
    })();
  }, [session?.user?.email]);

  useEffect(() => {
    if (!session?.user?.email || !finalPdfRow || hasLoggedSubmissionDetectedRef.current)
      return;
    hasLoggedSubmissionDetectedRef.current = true;
    logActivity(session.user.email, "submission_detected", { module: 9 });
  }, [session?.user?.email, finalPdfRow]);

  // Hydrate APA teaching completion from module9_quiz (teacher analytics; not PDF authority).
  useEffect(() => {
    if (!session?.user?.email || quizHydratedRef.current) return;
    quizHydratedRef.current = true;
    (async () => {
      const { data, error } = await supabase
        .from("module9_quiz")
        .select("score, total, submitted_at")
        .eq("user_email", session.user.email)
        .maybeSingle();
      if (error) {
        console.warn(error);
        return;
      }
      if (data?.submitted_at) {
        setSubmitted(true);
        // Keep score/total in state for teacher analytics contracts; never surface to students.
        setScore(typeof data.score === "number" ? data.score : 0);
      }
    })();
  }, [session?.user?.email]);

  // Returning students resume at the earliest incomplete step once gates are known.
  useEffect(() => {
    if (hasResumedJourneyRef.current) return;
    if (!submitted || alreadySubmitted) return;
    if (!docHydrated || checklistLoading) return;
    hasResumedJourneyRef.current = true;
    const resumeAt = !docReady ? 2 : !checklistComplete ? 3 : 4;
    // WP-056: resume must not present a fresh mid-module celebration.
    setProgressCelebration(null);
    setViewedStep(resumeAt);
  }, [
    submitted,
    alreadySubmitted,
    docHydrated,
    checklistLoading,
    docReady,
    checklistComplete,
  ]);

  const persistApaPractice = async (summary) => {
    if (apaPersisting || submitted) return;
    setApaPersisting(true);
    setScore(summary.score);
    setSubmitted(true);

    if (session?.user?.email) {
      await supabase.from("module9_quiz").upsert({
        user_email: session.user.email,
        score: summary.score,
        total: summary.total || MODULE9_APA_QUIZ_TOTAL,
        submitted_at: new Date().toISOString(),
      });

      await logActivity(session.user.email, "quiz_submitted", {
        module: 9,
        score: summary.score,
        total: summary.total || MODULE9_APA_QUIZ_TOTAL,
        details: summary.details.map((r) => ({
          index: r.index,
          conceptId: r.conceptId,
          correct: r.correct,
        })),
        score_definition: "first_attempt",
      });
    }

    setApaPersisting(false);
    hasResumedJourneyRef.current = true;
    setProgressCelebration(
      getModule9ProgressCelebration({ fromStep: 1, toStep: 2 })
    );
    setViewedStep(2);
    setTimeout(() => step2Ref.current?.scrollIntoView({ behavior: "smooth" }), 0);
  };

  const handleCreateOrUpdateSubmissionDoc = async ({
    forceCreate = false,
  } = {}) => {
    if (!session?.user?.email) return;
    if (docBusy) return;
    const email = session.user.email;
    const hadExistingDoc = !!exportUrl;

    setDocBusy(true);
    setDocNotice(null);
    setPopupBlocked(false);
    setExportStatus(SUBMISSION_DOC_STATUS.PREPARING);
    setVerificationStatus(SUBMISSION_DOC_VERIFICATION_STATUS.CHECKING);
    try {
      const result = await createOrUpdateSubmissionGoogleDoc({
        userEmail: email,
        module: 9,
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
        setDocContentVerified(false);
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
        setDocNotice({
          type: "error",
          status: result.reason,
          message: result.message,
        });
        return;
      }

      setExportUrl(result.url);
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
      setDocContentVerified(!!result.contentVerified);

      const notices = [];
      if (result.usedModule6Fallback) {
        notices.push(
          "Using your Module 6 draft because a finalized Module 7 version was not found. If you finished revising in Module 7, finalize there first."
        );
      }
      notices.push(result.message);
      if (result.contentVerified) {
        notices.push(SUBMISSION_DOC_VERIFICATION_EXPLAIN);
        if (
          result.operation === "updated" ||
          result.operation === "replacement_created"
        ) {
          notices.push("Review your APA formatting before downloading the PDF.");
        }
      } else if (
        verification?.status === SUBMISSION_DOC_VERIFICATION_STATUS.MISMATCH
      ) {
        notices.push(SUBMISSION_DOC_MISMATCH_RECOVERY);
      }

      setDocNotice({
        type: result.contentVerified ? "success" : "error",
        status: verification?.status || result.reason,
        message: notices.join(" "),
      });
    } finally {
      setDocBusy(false);
    }
  };

  const handleRetryVerification = async () => {
    if (!session?.user?.email || verificationInFlightRef.current) return;
    verificationInFlightRef.current = true;
    setVerificationStatus(SUBMISSION_DOC_VERIFICATION_STATUS.CHECKING);
    setDocNotice(null);
    try {
      const v = await verifySubmissionGoogleDocContent({
        userEmail: session.user.email,
        module: 9,
      });
      setVerificationStatus(v.status);
      setDocContentVerified(!!v.verified);
      if (v.url) setExportUrl(v.url);
      setDocNotice({
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

  const MAX_PDF_SIZE_BYTES = 15 * 1024 * 1024;

  const handleFileSelect = (e) => {
    setUploadError(null);
    const file = e.target.files?.[0];
    if (!file) {
      setPdfFile(null);
      setFinalUploadChecklistState(EMPTY_FINAL_UPLOAD_CHECKLIST());
      return;
    }
    const isPdf =
      file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      setUploadError("File must be a PDF. Please select a file ending in .pdf");
      setPdfFile(null);
      setFinalUploadChecklistState(EMPTY_FINAL_UPLOAD_CHECKLIST());
      e.target.value = "";
      return;
    }
    if (file.size > MAX_PDF_SIZE_BYTES) {
      setUploadError("File is too large. Maximum size is 15 MB.");
      setPdfFile(null);
      setFinalUploadChecklistState(EMPTY_FINAL_UPLOAD_CHECKLIST());
      e.target.value = "";
      return;
    }
    setPdfFile(file);
    setFinalUploadChecklistState(EMPTY_FINAL_UPLOAD_CHECKLIST());
  };

  const canUpload =
    submitted &&
    docReady &&
    checklistComplete &&
    !!pdfFile &&
    finalUploadChecklistComplete &&
    !uploading;

  const handleUploadPDF = async () => {
    if (!session?.user?.email) return;
    if (!submitted || !docReady || !checklistComplete) {
      setUploadError(
        "Complete all previous steps (APA practice, verified Google Doc, checklist) before uploading."
      );
      return;
    }
    if (!pdfFile) {
      setUploadError("Please select a PDF first.");
      return;
    }
    if (!finalUploadChecklistComplete) {
      setUploadError(
        "Confirm each item on the final upload checklist for this PDF before uploading."
      );
      return;
    }

    const isPdf =
      pdfFile.type === "application/pdf" ||
      pdfFile.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      setUploadError("File must be a PDF.");
      return;
    }
    if (pdfFile.size > MAX_PDF_SIZE_BYTES) {
      setUploadError("File is too large. Maximum size is 15 MB.");
      return;
    }

    setUploadError(null);
    try {
      setUploading(true);

      const formData = new FormData();
      formData.append("file", pdfFile);

      const res = await fetch("/api/final-pdf", {
        method: "POST",
        body: formData,
      });

      const result = await res.json().catch(() => ({}));

      if (res.status === 409) {
        const refetch = await getStudentExport({
          userEmail: session.user.email,
          module: 9,
          kind: "final_pdf",
        });
        if (refetch.data) setFinalPdfRow(refetch.data);
        setUploadError(null);
        alert("Your final PDF has already been submitted. The page has been updated.");
        return;
      }

      if (!res.ok) {
        const msg = result?.error || "Upload failed. Please try again.";
        setUploadError(msg);
        alert(msg);
        return;
      }

      await logActivity(session.user.email, "pdf_uploaded", {
        module: 9,
        file_name: pdfFile.name,
        storage_path: result.storage_path,
        public_url: result.publicUrl,
      });

      setFinalPdfRow((prev) => ({
        ...prev,
        public_url: result.publicUrl,
        web_view_link: result.webViewLink ?? result.publicUrl,
      }));
      router.push("/modules/9/success");
    } catch (err) {
      console.error(err);
      const msg = "Upload failed. Please try again.";
      setUploadError(msg);
      alert(msg);
    } finally {
      setUploading(false);
    }
  };

  if (!session) return <p className="p-6">Loading…</p>;

  if (gateOk === false) {
    return (
      <ModulePageShell contentMax="md">
        <p className="text-center text-text-primary">
          Finish Module 8 before starting Module 9.
        </p>
      </ModulePageShell>
    );
  }

  if (gateOk !== true) {
    return (
      <ModulePageShell contentMax="md">
        <p className="text-text-primary">Loading…</p>
      </ModulePageShell>
    );
  }

  return (
    <ModulePageShell contentMax={MODULE9_LAYOUT_CONTRACT.contentMax}>
      <div
        className="space-y-8 overflow-x-hidden"
        data-wp006-layout={MODULE9_LAYOUT_CONTRACT.viewports.join("-")}
      >
        <header
          className="space-y-3 rounded-xl border border-border-soft/70 bg-surface-soft/40 px-6 py-4 md:px-8 md:py-5"
          data-hierarchy-level={HIERARCHY_LEVELS.reference}
        >
          <h1 className={HIERARCHY_MODULE_CHROME_CLASS}>
            Module 9: APA Format and Final Submission
          </h1>
          <p className="text-sm leading-relaxed text-text-muted md:text-[0.95rem]">
            {MODULE9_APA_ENTRY.framing}
          </p>
          {!alreadySubmitted && (
            <nav
              aria-label="Your Module 9 journey"
              data-testid="module9-journey-progress"
              className="border-t border-border-soft/70 pt-3"
            >
              <ol className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
                {MODULE9_APA_JOURNEY.map((label, index) => {
                  const stepNumber = index + 1;
                  const isComplete = activeStep > stepNumber;
                  const isCurrent = viewedStep === stepNumber;
                  return (
                    <li
                      key={label}
                      className={`rounded-lg px-3 py-2 text-xs leading-snug sm:text-sm ${
                        isCurrent
                          ? "bg-theme-blue text-white"
                          : isComplete
                            ? "bg-theme-green/15 text-theme-dark"
                            : "bg-surface-soft text-text-muted"
                      }`}
                      aria-current={isCurrent ? "step" : undefined}
                    >
                      <span className="font-semibold">
                        {isComplete ? "✓ " : `${stepNumber}. `}
                      </span>
                      {label}
                    </li>
                  );
                })}
              </ol>
            </nav>
          )}
        </header>

        {alreadySubmitted && (
          <section className="space-y-4 rounded-xl border border-border-soft bg-white px-6 py-5 shadow-soft md:px-8 md:py-6">
            <h2 className="text-lg font-semibold text-text-primary">
              Your PDF was received
            </h2>
            <p className="text-sm text-text-primary">
              Your work for this module is complete. Use the buttons below to open your
              documents. Opening a file does not submit anything again.
            </p>
            <div className="flex flex-wrap gap-3">
              {(finalPdfRow?.public_url || finalPdfRow?.web_view_link) && (
                <button
                  type="button"
                  className={`${HIERARCHY_ACTION_SECONDARY_CLASS} ${HIERARCHY_FOCUS_RING_CLASS}`}
                  onClick={() =>
                    openExternalResource(
                      finalPdfRow.public_url || finalPdfRow.web_view_link
                    )
                  }
                  data-testid="module9-open-final-pdf"
                  aria-label="Open final PDF in a new tab"
                >
                  Open final PDF
                </button>
              )}
              {exportUrl && (
                <button
                  type="button"
                  className={`${HIERARCHY_ACTION_SECONDARY_CLASS} ${HIERARCHY_FOCUS_RING_CLASS}`}
                  onClick={() => openExternalResource(exportUrl)}
                  data-testid="module9-open-submitted-doc"
                  aria-label="Open Google Doc in a new tab"
                >
                  Open Google Doc
                </button>
              )}
            </div>
            <ModuleNineApaQuickGuide compact />
          </section>
        )}

        {viewedStep === 1 && !alreadySubmitted && !submitted && (
          <div className="space-y-4">
            <header className="space-y-3 rounded-xl border border-border-soft/70 bg-white px-6 py-5 md:px-8">
              <h2
                className={HIERARCHY_TASK_CLASS}
                data-testid="screen-contract-task"
                data-hierarchy-level={HIERARCHY_LEVELS.task}
              >
                {MODULE9_SCREEN_CONTRACT[1].task}
              </h2>
              <ScreenContractCues
                purpose={MODULE9_SCREEN_CONTRACT[1].purpose}
                how={MODULE9_SCREEN_CONTRACT[1].how}
                finished={MODULE9_SCREEN_CONTRACT[1].finished}
              />
            </header>
            <div data-hierarchy-level={HIERARCHY_LEVELS.work} data-hierarchy-emphasis="active">
            <ModuleNineApaLesson
              lessonState={lessonState}
              onLessonStateChange={setLessonState}
              onComplete={persistApaPractice}
              alreadyPersisted={false}
            />
            </div>
          </div>
        )}

        {viewedStep === 2 && submitted && !alreadySubmitted && (
          <section
            ref={step2Ref}
            className="space-y-4 rounded-xl border border-border-soft/70 bg-white px-6 py-5 md:px-8 md:py-6"
            data-testid="module9-submission-doc-step"
            data-hierarchy-level={HIERARCHY_LEVELS.work}
            data-hierarchy-emphasis="active"
          >
            <h2
              className={HIERARCHY_TASK_CLASS}
              data-testid="screen-contract-task"
              data-hierarchy-level={HIERARCHY_LEVELS.task}
            >
              Open the paper you prepared{docReady ? " ✓" : ""}
            </h2>
            <ScreenContractCues
              purpose={MODULE9_SCREEN_CONTRACT[2].purpose}
              how={MODULE9_SCREEN_CONTRACT[2].how}
              finished={MODULE9_SCREEN_CONTRACT[2].finished}
            />
            {progressCelebration?.message &&
            progressCelebration.toStep === "google-doc" ? (
              <ProgressCelebrationBridge
                module={9}
                fromStep={progressCelebration.fromStep}
                toStep={progressCelebration.toStep}
                message={progressCelebration.message}
              />
            ) : null}
            <p className="text-sm text-text-primary">
              Open and verify the Google Doc you prepared in Module 8. You do not need
              to create a new export when that document is already ready.
            </p>
            {docNotice ? (
              <div
                role="status"
                aria-live="polite"
                data-testid="module9-doc-notice"
                data-status={docNotice.status || ""}
                className="sr-only"
              >
                {docNotice.message}
              </div>
            ) : null}

            {!docHydrated ||
            verificationStatus ===
              SUBMISSION_DOC_VERIFICATION_STATUS.CHECKING ? (
              <p
                role="status"
                aria-live="polite"
                data-testid="module9-doc-verification-status"
                className="text-sm text-text-muted"
              >
                {!docHydrated
                  ? "Checking for your Google Doc…"
                  : getSubmissionDocVerificationMessage(
                      SUBMISSION_DOC_VERIFICATION_STATUS.CHECKING
                    )}
              </p>
            ) : (
              <SubmissionDocRecoveryPanel
                module={9}
                verificationStatus={verificationStatus}
                exportStatus={exportStatus}
                hasUrl={!!exportUrl}
                contentVerified={docContentVerified}
                operation={lastDocOperation}
                docUrl={exportUrl}
                busy={docBusy}
                notice={docNotice}
                testIdPrefix="module9-doc"
                showProgressContinue={docReady}
                onContinue={() => {
                  if (!docReady) return;
                  setProgressCelebration(
                    getModule9ProgressCelebration({ fromStep: 2, toStep: 3 })
                  );
                  setViewedStep(3);
                  setTimeout(
                    () => step3Ref.current?.scrollIntoView({ behavior: "smooth" }),
                    0
                  );
                }}
                onUpdate={() =>
                  handleCreateOrUpdateSubmissionDoc({ forceCreate: false })
                }
                onCreate={() =>
                  handleCreateOrUpdateSubmissionDoc({ forceCreate: false })
                }
                onCreateNew={() =>
                  handleCreateOrUpdateSubmissionDoc({ forceCreate: true })
                }
                onRetry={handleRetryVerification}
                onFinishEssay={() => router.push("/modules/7")}
                onReplacementCancelled={() =>
                  logSubmissionDocReplacementCancelled({
                    userEmail: session?.user?.email,
                    module: 9,
                    hadExistingDoc: !!exportUrl,
                  })
                }
              />
            )}

            {docHydrated &&
            verificationStatus !==
              SUBMISSION_DOC_VERIFICATION_STATUS.CHECKING &&
            exportUrl &&
            docReady ? (
              <div className="space-y-3">
                <p
                  className="text-sm text-text-primary"
                  data-testid="module9-do-not-rewrite-coaching"
                >
                  The Google Doc you prepared in Module 8 is the document you will
                  format in APA style. You are changing how it looks—not rewriting
                  your essay.
                </p>
                <div className="rounded-lg border border-border-soft bg-surface-soft p-3 text-sm shadow-soft">
                  <div className="mb-2 font-semibold">Your submission Google Doc</div>
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      className={`${HIERARCHY_ACTION_SECONDARY_CLASS} ${HIERARCHY_FOCUS_RING_CLASS}`}
                      onClick={() => {
                        const result = openExternalResource(exportUrl);
                        if (!result.opened && result.reason === "blocked") {
                          setPopupBlocked(true);
                        }
                      }}
                      data-testid="module9-open-submission-doc"
                      aria-label="Open your Google Doc in a new tab"
                    >
                      Open your Google Doc
                    </button>
                    <button
                      type="button"
                      className={`${HIERARCHY_ACTION_SECONDARY_CLASS} ${HIERARCHY_FOCUS_RING_CLASS}`}
                      onClick={() => navigator.clipboard.writeText(exportUrl)}
                      aria-label="Copy Google Doc link"
                    >
                      Copy link
                    </button>
                  </div>
                  {popupBlocked ? (
                    <p className="mt-2 text-xs text-theme-orange">
                      If a popup blocker stopped the new tab, use Open your Google Doc
                      above.
                    </p>
                  ) : null}
                </div>
                <p className="text-sm text-text-muted">
                  Optional template (if you need a blank APA layout):{" "}
                  <a
                    href="https://docs.google.com/document/d/14oSW0QNGaDbnmF3QL3UzFku2dJIgw3nGDV6K-HGvNtY/copy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={HIERARCHY_REFERENCE_LINK_CLASS}
                  >
                    Copy APA Google Docs Template
                  </a>
                </p>
              </div>
            ) : null}
          </section>
        )}

        {viewedStep === 3 &&
          submitted &&
          docReady &&
          !alreadySubmitted && (
            <section
              ref={step3Ref}
              className="space-y-4 rounded-xl border border-border-soft/70 bg-white px-6 py-5 md:px-8 md:py-6"
              data-hierarchy-level={HIERARCHY_LEVELS.work}
              data-hierarchy-emphasis="active"
            >
              <h2
                className={HIERARCHY_TASK_CLASS}
                data-testid="screen-contract-task"
                data-hierarchy-level={HIERARCHY_LEVELS.task}
              >
                Format your paper with the APA guide
                {checklistComplete ? " ✓" : ""}
              </h2>
              <ScreenContractCues
                purpose={MODULE9_SCREEN_CONTRACT[3].purpose}
                how={MODULE9_SCREEN_CONTRACT[3].how}
                finished={MODULE9_SCREEN_CONTRACT[3].finished}
              />
              {progressCelebration?.message &&
              progressCelebration.toStep === "formatting-checklist" ? (
                <ProgressCelebrationBridge
                  module={9}
                  fromStep={progressCelebration.fromStep}
                  toStep={progressCelebration.toStep}
                  message={progressCelebration.message}
                />
              ) : null}
              <p className="text-sm text-text-primary">
                Use the APA guide and confirm each formatting item in your Google Doc
                before you download the PDF.
              </p>
              <ModuleNineApaQuickGuide compact />
              <div className="space-y-2">
                {CHECKLIST_ITEMS.map((label, i) => (
                  <label
                    key={label}
                    className="flex min-h-[44px] items-center gap-2 text-sm text-text-primary"
                  >
                    <input
                      type="checkbox"
                      checked={checklistState[i] || false}
                      onChange={(e) => {
                        const next = [...checklistState];
                        next[i] = e.target.checked;
                        setChecklistState(next);
                      }}
                      className="rounded border-border-soft text-theme-blue"
                    />
                    {label}
                  </label>
                ))}
              </div>
              {checklistError && (
                <p className="mt-1 text-xs text-theme-red">
                  Checklist could not be saved: {checklistError}. Your selections are
                  kept for this session.
                </p>
              )}
              {checklistComplete && (
                <p className="text-sm font-medium text-theme-green">
                  Formatting looks ready. Continue to download and submit your PDF.
                </p>
              )}
              {checklistComplete && (
                <button
                  type="button"
                  onClick={() => {
                    if (!checklistComplete) return;
                    setProgressCelebration(
                      getModule9ProgressCelebration({ fromStep: 3, toStep: 4 })
                    );
                    setViewedStep(4);
                    setTimeout(
                      () => step4Ref.current?.scrollIntoView({ behavior: "smooth" }),
                      0
                    );
                  }}
                  className={`${HIERARCHY_ACTION_PRIMARY_CLASS} ${FOCUS_RING}`}
                  data-hierarchy-action="primary"
                >
                  Continue to download and submit →
                </button>
              )}
            </section>
          )}

        {alreadySubmitted && (
          <section className="mt-6 border-t border-border-soft pt-6">
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className={`min-h-[44px] rounded bg-theme-red px-6 py-3 text-sm font-semibold text-white shadow hover:opacity-90 ${FOCUS_RING}`}
            >
              Back to Dashboard
            </button>
          </section>
        )}

        {viewedStep === 4 &&
          submitted &&
          docReady &&
          checklistComplete &&
          !alreadySubmitted && (
            <section
              ref={step4Ref}
              className="space-y-4 rounded-xl border border-border-soft/70 bg-white px-6 py-5 md:px-8 md:py-6"
              data-hierarchy-level={HIERARCHY_LEVELS.work}
              data-hierarchy-emphasis="active"
            >
              <h2
                className={HIERARCHY_TASK_CLASS}
                data-testid="screen-contract-task"
                data-hierarchy-level={HIERARCHY_LEVELS.task}
              >
                Download, check, and submit your PDF
              </h2>
              <ScreenContractCues
                purpose={MODULE9_SCREEN_CONTRACT[4].purpose}
                how={MODULE9_SCREEN_CONTRACT[4].how}
                finished={MODULE9_SCREEN_CONTRACT[4].finished}
              />
              {progressCelebration?.message &&
              progressCelebration.toStep === "download-upload" ? (
                <ProgressCelebrationBridge
                  module={9}
                  fromStep={progressCelebration.fromStep}
                  toStep={progressCelebration.toStep}
                  message={progressCelebration.message}
                />
              ) : null}
              <ModuleNineApaQuickGuide compact />

              <div
                className="space-y-3 text-sm text-text-primary"
                data-testid="module9-pdf-download-instructions"
              >
                <h3 className="text-base font-semibold text-text-primary">
                  Download your Google Doc as a PDF
                </h3>
                <p>Follow these steps to turn your Google Doc into a PDF:</p>
                <ModuleNinePdfDownloadVisual />
                <InstructionalDisclosure title="More download steps">
                  <ol className="list-inside list-decimal space-y-2">
                    <li>Open your Google Doc.</li>
                    <li>
                      Click <strong>File</strong> at the top of the page.
                    </li>
                    <li>
                      Click <strong>Download</strong>.
                    </li>
                    <li>
                      Click <strong>PDF Document (.pdf)</strong>.
                    </li>
                    <li>
                      Save the PDF somewhere easy to find, such as your{" "}
                      <strong>Downloads</strong> folder or your <strong>Desktop</strong>.
                    </li>
                  </ol>
                  <p className="mt-2">
                    When the PDF has finished downloading, come back to this page and
                    upload that PDF. This is the version your teacher will grade.
                  </p>
                </InstructionalDisclosure>
              </div>

              <div
                className="space-y-3 rounded-lg border border-theme-orange/25 bg-theme-orange/[0.05] px-4 py-3 text-sm text-text-primary"
                data-testid="module9-pdf-upload-coaching"
              >
                <h3 className="text-base font-semibold text-text-primary">
                  Upload your PDF
                </h3>
                <p className="text-sm leading-relaxed text-text-muted">
                  After the PDF is saved on your device, upload it here.
                </p>
                <InstructionalDisclosure title="More upload steps">
                  <ol className="list-decimal space-y-2 pl-5 leading-relaxed">
                    <li>
                      Choose the file control below (your browser may label it Choose
                      File or Browse).
                    </li>
                    <li>
                      Locate the PDF in Downloads, Desktop, or the folder where you
                      saved it.
                    </li>
                    <li>
                      Select the newest PDF, then choose Open.
                    </li>
                    <li>
                      Check the Selected filename on this page, then choose{" "}
                      <strong>Upload Final PDF</strong>.
                    </li>
                    <li>
                      Wait for the successful upload confirmation.
                    </li>
                  </ol>
                </InstructionalDisclosure>
              </div>

              <InstructionalDisclosure title="File tips before you choose">
                <div className="space-y-1 text-xs">
                  <p className="font-semibold">Before you upload:</p>
                  <p>• Make sure your file name ends with .pdf</p>
                  <p>• Choose the PDF you just downloaded—not a Word file or a screenshot</p>
                </div>
              </InstructionalDisclosure>

              <div
                className="mb-3 space-y-1 rounded-lg border border-theme-dark/15 bg-surface-soft px-4 py-3 text-sm leading-relaxed text-text-primary"
                data-testid="module9-wrong-pdf-reassurance"
              >
                <p>
                  Chose the wrong PDF? Use the file control again and select the
                  correct one before you upload.
                </p>
                <p className="text-text-muted">
                  After your PDF is uploaded, contact your teacher before trying to
                  resubmit.
                </p>
              </div>

              <input
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileSelect}
                className="mb-2 min-h-[44px] text-sm"
                data-testid="module9-pdf-file-input"
              />

              {uploadError && (
                <div
                  className="mb-2 rounded-lg border border-theme-red bg-red-50 px-4 py-3 text-sm text-theme-red"
                  role="status"
                  aria-live="polite"
                >
                  {uploadError}
                </div>
              )}

              {pdfFile ? (
                <div
                  className="rounded-lg border border-theme-blue/20 bg-theme-blue/[0.04] px-4 py-3 text-sm text-text-primary"
                  data-testid="module9-pdf-selected"
                >
                  Selected: {pdfFile.name} ({(pdfFile.size / (1024 * 1024)).toFixed(1)}{" "}
                  MB)
                </div>
              ) : (
                <p className="text-sm text-text-muted" data-testid="module9-pdf-selected-empty">
                  Select a PDF above before confirming the checklist.
                </p>
              )}

              <div
                className="space-y-3 rounded-lg border border-theme-blue/30 bg-theme-blue/[0.05] px-4 py-4"
                data-testid="module9-final-upload-checklist"
              >
                <h3 className="text-base font-semibold text-text-primary">
                  Confirm this PDF before you upload
                </h3>
                <p className="text-sm leading-relaxed text-text-muted">
                  Open the selected file on your device and check each item. This is
                  not the Step 3 APA formatting checklist—these confirmations apply only
                  to the PDF you are about to upload.
                </p>
                <div className="space-y-2">
                  {FINAL_UPLOAD_CHECKLIST_ITEMS.map((label, i) => (
                    <label
                      key={label}
                      className={`flex min-h-[44px] items-center gap-2 text-sm text-text-primary ${
                        !pdfFile ? "cursor-not-allowed opacity-60" : ""
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={finalUploadChecklistState[i] || false}
                        disabled={!pdfFile}
                        data-testid={`module9-final-upload-check-${i}`}
                        onChange={(e) => {
                          const next = [...finalUploadChecklistState];
                          next[i] = e.target.checked;
                          setFinalUploadChecklistState(next);
                        }}
                        className="rounded border-border-soft text-theme-blue"
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>

              <button
                onClick={handleUploadPDF}
                disabled={!canUpload}
                className={`${HIERARCHY_ACTION_FINAL_CLASS} ${
                  !canUpload ? "cursor-not-allowed opacity-50" : ""
                } ${FOCUS_RING}`}
                data-testid="module9-upload-final-pdf"
                data-hierarchy-action="final"
              >
                {uploading ? "Uploading…" : "Upload Final PDF"}
              </button>
            </section>
          )}
      </div>
    </ModulePageShell>
  );
}
