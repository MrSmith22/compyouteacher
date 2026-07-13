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
import ModuleNineApaLesson from "@/components/module9/ModuleNineApaLesson";
import ModuleNineApaQuickGuide from "@/components/module9/ModuleNineApaQuickGuide";
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
  SUBMISSION_DOC_VERIFICATION_STATUS,
  getSubmissionDocVerificationMessage,
  SUBMISSION_DOC_VERIFICATION_EXPLAIN,
  SUBMISSION_DOC_MISMATCH_RECOVERY,
} from "@/lib/exports/createOrUpdateSubmissionGoogleDocClient";

const ASSIGNMENT_NAME = MLK_ASSIGNMENT_NAME;
const CHECKLIST_ITEMS = getModule9FormattingChecklistItems();
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
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [exportUrl, setExportUrl] = useState(null);
  const [docHydrated, setDocHydrated] = useState(false);
  const [docBusy, setDocBusy] = useState(false);
  const [popupBlocked, setPopupBlocked] = useState(false);
  const [docNotice, setDocNotice] = useState(null);
  const [docContentVerified, setDocContentVerified] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [finalPdfRow, setFinalPdfRow] = useState(null);
  const [guidedMode, setGuidedMode] = useState(true);
  const [viewedStep, setViewedStep] = useState(1);
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
  const checklistComplete = checklistState.every(Boolean);
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

  // Hydrate APA practice completion from module9_quiz (not authoritative for PDF submission).
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
        setScore(typeof data.score === "number" ? data.score : 0);
        setViewedStep((step) => Math.max(step, 2));
      }
    })();
  }, [session?.user?.email]);

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
    if (guidedMode) {
      setViewedStep(2);
      setTimeout(() => step2Ref.current?.scrollIntoView({ behavior: "smooth" }), 0);
    }
  };

  const handleCreateOrUpdateSubmissionDoc = async () => {
    if (!session?.user?.email) return;
    const email = session.user.email;
    const hadExistingDoc = !!exportUrl;

    setDocBusy(true);
    setDocNotice(null);
    setPopupBlocked(false);
    setVerificationStatus(SUBMISSION_DOC_VERIFICATION_STATUS.CHECKING);
    try {
      const result = await createOrUpdateSubmissionGoogleDoc({
        userEmail: email,
        module: 9,
        hadExistingDoc,
        openInNewTab: true,
      });

      if (!result.ok) {
        setDocContentVerified(false);
        setDocNotice({
          type: "error",
          status: result.reason,
          message: result.message,
        });
        setVerificationStatus(null);
        return;
      }

      setExportUrl(result.url);
      if (result.popupBlocked) setPopupBlocked(true);

      const verification = result.verification;
      setVerificationStatus(verification?.status || null);
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
      return;
    }
    const isPdf =
      file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      setUploadError("File must be a PDF. Please select a file ending in .pdf");
      setPdfFile(null);
      e.target.value = "";
      return;
    }
    if (file.size > MAX_PDF_SIZE_BYTES) {
      setUploadError("File is too large. Maximum size is 15 MB.");
      setPdfFile(null);
      e.target.value = "";
      return;
    }
    setPdfFile(file);
  };

  const canUpload =
    submitted &&
    docReady &&
    checklistComplete &&
    !!pdfFile &&
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
        <header className="space-y-4 rounded-xl border border-border-soft bg-white px-6 py-5 shadow-soft md:px-8 md:py-6">
          <h1 className="text-3xl font-extrabold text-theme-blue">
            Module 9: APA Format and Final Submission
          </h1>
          <div className="space-y-3 text-sm text-text-primary md:text-base">
            <p className="font-semibold">{MODULE9_APA_ENTRY.title}</p>
            <p>{MODULE9_APA_ENTRY.lead}</p>
            <p>{MODULE9_APA_ENTRY.framing}</p>
            <ol className="list-inside list-decimal space-y-1">
              {MODULE9_APA_JOURNEY.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </div>
          {!alreadySubmitted && (
            <div className="flex flex-wrap items-center gap-4 border-t border-border-soft pt-2">
              <label className="flex min-h-[44px] items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={guidedMode}
                  onChange={(e) => setGuidedMode(e.target.checked)}
                  className="rounded border-border-soft text-theme-blue"
                />
                Guided mode
              </label>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span
                  className={`rounded px-2 py-1 ${
                    activeStep >= 1 ? "bg-theme-green text-white" : "bg-surface-soft"
                  }`}
                >
                  1. Learn APA {submitted ? "✓" : ""}
                </span>
                <span
                  className={`rounded px-2 py-1 ${
                    activeStep >= 2 ? "bg-theme-green text-white" : "bg-surface-soft"
                  }`}
                >
                  2. Google Doc {docReady ? "✓" : ""}
                </span>
                <span
                  className={`rounded px-2 py-1 ${
                    activeStep >= 3 ? "bg-theme-green text-white" : "bg-surface-soft"
                  }`}
                >
                  3. Checklist {checklistComplete ? "✓" : ""}
                </span>
                <span
                  className={`rounded px-2 py-1 ${
                    activeStep >= 4 ? "bg-theme-green text-white" : "bg-surface-soft"
                  }`}
                >
                  4. Upload PDF
                </span>
              </div>
            </div>
          )}
        </header>

        {alreadySubmitted && (
          <section className="space-y-4 rounded-xl border border-border-soft bg-white px-6 py-5 shadow-soft md:px-8 md:py-6">
            <h2 className="text-lg font-semibold text-text-primary">
              Submitted: Final PDF received
            </h2>
            <p className="text-sm text-text-primary">
              Your work for this module is complete. Use the links below to open your
              documents.
            </p>
            <div className="flex flex-wrap gap-3">
              {(finalPdfRow?.public_url || finalPdfRow?.web_view_link) && (
                <a
                  href={finalPdfRow.public_url || finalPdfRow.web_view_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex min-h-[44px] items-center rounded bg-theme-blue px-4 py-2 text-sm font-semibold text-white shadow hover:opacity-90 ${FOCUS_RING}`}
                >
                  Open final PDF
                </a>
              )}
              {exportUrl && (
                <a
                  href={exportUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex min-h-[44px] items-center rounded bg-theme-green px-4 py-2 text-sm font-semibold text-white shadow hover:opacity-90 ${FOCUS_RING}`}
                >
                  Open Google Doc
                </a>
              )}
            </div>
            <ModuleNineApaQuickGuide compact />
          </section>
        )}

        {(!guidedMode || viewedStep === 1) && !alreadySubmitted && !submitted && (
          <ModuleNineApaLesson
            lessonState={lessonState}
            onLessonStateChange={setLessonState}
            onComplete={persistApaPractice}
            alreadyPersisted={false}
          />
        )}

        {(!guidedMode || viewedStep >= 1) && !alreadySubmitted && submitted && (
          <section className="space-y-3 rounded-xl border border-theme-green/30 bg-theme-green/5 px-4 py-4 shadow-soft md:px-6">
            <h2 className="text-lg font-semibold text-text-primary">
              APA practice complete
            </h2>
            <p className="text-sm text-text-primary">
              You practiced the APA choices this assignment uses
              {typeof score === "number"
                ? ` (first-try matches: ${score} / ${MODULE9_APA_QUIZ_TOTAL})`
                : ""}
              . Keep the Quick Guide nearby while you format your Google Doc.
            </p>
            <ModuleNineApaQuickGuide defaultOpen={false} compact />
            {guidedMode && !docReady && (
              <button
                type="button"
                onClick={() => {
                  setViewedStep(2);
                  setTimeout(
                    () => step2Ref.current?.scrollIntoView({ behavior: "smooth" }),
                    0
                  );
                }}
                className={`min-h-[44px] rounded-lg bg-theme-blue px-4 py-2 text-sm font-semibold text-white ${FOCUS_RING}`}
              >
                Continue to prepare your Google Doc
              </button>
            )}
          </section>
        )}

        {(!guidedMode || viewedStep === 2) && submitted && !alreadySubmitted && (
          <section
            ref={step2Ref}
            className="space-y-4 rounded-xl border border-border-soft bg-white px-6 py-5 shadow-soft md:px-8 md:py-6"
            data-testid="module9-submission-doc-step"
          >
            <h2 className="flex items-center gap-2 text-xl font-semibold text-text-primary">
              Step 2 of 4: Your submission Google Doc{docReady ? " ✓" : ""}
            </h2>

            {docNotice ? (
              <div
                role="status"
                aria-live="polite"
                data-testid="module9-doc-notice"
                data-status={docNotice.status || ""}
                className={[
                  "rounded-lg border px-4 py-3 text-sm leading-relaxed",
                  docNotice.type === "success"
                    ? "border-theme-green/30 bg-theme-green/5 text-text-primary"
                    : "border-theme-red/30 bg-red-50 text-text-primary",
                ].join(" ")}
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
            ) : null}

            {docHydrated &&
            verificationStatus ===
              SUBMISSION_DOC_VERIFICATION_STATUS.MISMATCH ? (
              <div
                className="rounded-lg border border-theme-red/30 bg-red-50 px-4 py-3 text-sm text-text-primary"
                data-testid="module9-doc-mismatch"
              >
                <p className="font-semibold">
                  {getSubmissionDocVerificationMessage(
                    SUBMISSION_DOC_VERIFICATION_STATUS.MISMATCH
                  )}
                </p>
                <p className="mt-1">{SUBMISSION_DOC_MISMATCH_RECOVERY}</p>
                <button
                  type="button"
                  className={`mt-3 min-h-[44px] rounded bg-theme-blue px-4 py-2 text-sm font-semibold text-white ${FOCUS_RING}`}
                  onClick={handleCreateOrUpdateSubmissionDoc}
                  disabled={docBusy}
                  data-testid="module9-update-google-doc-primary"
                >
                  {docBusy ? "Updating your Google Doc…" : "Update Google Doc"}
                </button>
              </div>
            ) : null}

            {docHydrated &&
            (verificationStatus ===
              SUBMISSION_DOC_VERIFICATION_STATUS.VERIFICATION_ERROR ||
              verificationStatus ===
                SUBMISSION_DOC_VERIFICATION_STATUS.DOCUMENT_UNAVAILABLE) ? (
              <div
                className="rounded-lg border border-theme-orange/30 bg-orange-50 px-4 py-3 text-sm text-text-primary"
                data-testid="module9-doc-verification-error"
              >
                <p>
                  {getSubmissionDocVerificationMessage(verificationStatus)}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className={`min-h-[44px] rounded bg-theme-blue px-4 py-2 text-sm font-semibold text-white ${FOCUS_RING}`}
                    onClick={handleRetryVerification}
                  >
                    Retry check
                  </button>
                  {exportUrl ? (
                    <a
                      href={exportUrl}
                      target="_blank"
                      rel="noreferrer"
                      className={`inline-flex min-h-[44px] items-center rounded border border-border-soft bg-white px-4 py-2 text-sm font-medium ${FOCUS_RING}`}
                    >
                      Open current Google Doc
                    </a>
                  ) : null}
                </div>
              </div>
            ) : null}

            {docHydrated &&
            verificationStatus !==
              SUBMISSION_DOC_VERIFICATION_STATUS.CHECKING &&
            exportUrl ? (
              <div className="space-y-3">
                <p className="text-sm text-text-primary">
                  The Google Doc you prepared in Module 8 is the document you will
                  format in APA style. You are changing how it looks—not rewriting
                  your essay.
                </p>
                <div className="rounded-lg border border-border-soft bg-surface-soft p-3 text-sm shadow-soft">
                  <div className="mb-2 font-semibold">Your submission Google Doc</div>
                  <div className="flex flex-wrap items-center gap-3">
                    <a
                      className={`inline-flex min-h-[44px] items-center rounded bg-theme-blue px-4 py-2 text-sm font-semibold text-white ${FOCUS_RING}`}
                      href={exportUrl}
                      target="_blank"
                      rel="noreferrer"
                      data-testid="module9-open-submission-doc"
                    >
                      Open your Google Doc
                    </a>
                    <button
                      type="button"
                      className={`min-h-[44px] rounded border border-border-soft bg-white px-4 py-2 text-sm font-medium text-text-primary ${FOCUS_RING}`}
                      onClick={handleCreateOrUpdateSubmissionDoc}
                      disabled={docBusy}
                      data-testid="module9-update-submission-doc"
                    >
                      {docBusy
                        ? "Updating your Google Doc…"
                        : "Update with your latest essay"}
                    </button>
                    <button
                      type="button"
                      className={`min-h-[44px] rounded border border-border-soft px-3 py-1 text-xs ${FOCUS_RING}`}
                      onClick={() => navigator.clipboard.writeText(exportUrl)}
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
                    className={`inline-flex min-h-[44px] items-center text-theme-blue underline ${FOCUS_RING}`}
                  >
                    Copy APA Google Docs Template
                  </a>
                </p>
              </div>
            ) : null}

            {docHydrated &&
            verificationStatus !==
              SUBMISSION_DOC_VERIFICATION_STATUS.CHECKING &&
            !exportUrl ? (
              <div className="space-y-3 rounded-xl border-2 border-theme-blue/25 bg-theme-blue/5 px-4 py-4">
                <p className="text-sm font-semibold text-text-primary">
                  Your submission Google Doc still needs to be prepared
                </p>
                <p className="text-sm text-text-primary">
                  Module 8 usually creates this document. Create it here with the same
                  pathway so you have one submission Google Doc to format.
                </p>
                <button
                  type="button"
                  onClick={handleCreateOrUpdateSubmissionDoc}
                  disabled={docBusy}
                  className={`min-h-[44px] rounded bg-theme-blue px-6 py-3 text-sm font-semibold text-white shadow disabled:opacity-50 ${FOCUS_RING}`}
                  data-testid="module9-create-submission-doc"
                >
                  {docBusy ? "Creating your Google Doc…" : "Create your Google Doc"}
                </button>
              </div>
            ) : null}

            {guidedMode && docReady && (
              <button
                type="button"
                onClick={() => {
                  setViewedStep(3);
                  setTimeout(
                    () => step3Ref.current?.scrollIntoView({ behavior: "smooth" }),
                    0
                  );
                }}
                className={`min-h-[44px] rounded bg-theme-blue px-4 py-2 text-sm font-semibold text-white shadow hover:opacity-90 ${FOCUS_RING}`}
              >
                Continue to checklist →
              </button>
            )}
          </section>
        )}

        {(!guidedMode || viewedStep === 3) &&
          submitted &&
          docReady &&
          !alreadySubmitted && (
            <section
              ref={step3Ref}
              className="space-y-4 rounded-xl border border-border-soft bg-white px-6 py-5 shadow-soft md:px-8 md:py-6"
            >
              <h2 className="flex items-center gap-2 text-xl font-semibold text-text-primary">
                Step 3 of 4: Format checklist confirmation
                {checklistComplete ? " ✓" : ""}
              </h2>
              <p className="text-sm text-text-primary">
                Confirm you have applied each APA formatting item in your Google Doc
                before uploading your PDF.
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
                  All items confirmed. Proceed to upload your PDF.
                </p>
              )}
              {guidedMode && checklistComplete && (
                <button
                  type="button"
                  onClick={() => {
                    setViewedStep(4);
                    setTimeout(
                      () => step4Ref.current?.scrollIntoView({ behavior: "smooth" }),
                      0
                    );
                  }}
                  className={`min-h-[44px] rounded bg-theme-blue px-4 py-2 text-sm font-semibold text-white shadow hover:opacity-90 ${FOCUS_RING}`}
                >
                  Continue to upload →
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

        {(!guidedMode || viewedStep === 4) &&
          submitted &&
          docReady &&
          checklistComplete &&
          !alreadySubmitted && (
            <section
              ref={step4Ref}
              className="space-y-4 rounded-xl border border-border-soft bg-white px-6 py-5 shadow-soft md:px-8 md:py-6"
            >
              <h2 className="flex items-center gap-2 text-lg font-semibold text-text-primary">
                Step 4 of 4: Submit your final essay as a PDF
              </h2>
              <ModuleNineApaQuickGuide compact />
              <div className="space-y-3 text-sm text-text-primary">
                <p>Follow these steps to turn your Google Doc into a PDF:</p>
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
                <p>
                  When the PDF has finished downloading, come back to this page and
                  upload that PDF. This is the version your teacher will grade.
                </p>
              </div>

              <div className="mb-3 space-y-1 rounded-lg border border-border-soft bg-surface-soft px-4 py-3 text-xs">
                <p className="font-semibold">Before you upload:</p>
                <p>• Make sure your file name ends with .pdf</p>
                <p>• Choose the PDF you just downloaded—not a Word file or a screenshot</p>
              </div>

              <input
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileSelect}
                className="mb-2 min-h-[44px] text-sm"
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

              <button
                onClick={handleUploadPDF}
                disabled={!canUpload}
                className={`min-h-[44px] rounded bg-theme-orange px-6 py-2 text-sm font-semibold text-white shadow ${
                  !canUpload ? "cursor-not-allowed opacity-50" : ""
                } ${FOCUS_RING}`}
              >
                {uploading ? "Uploading…" : "Upload Final PDF"}
              </button>

              {pdfFile && !uploading && (
                <div className="mt-1 text-xs text-text-muted">
                  Selected: {pdfFile.name} ({(pdfFile.size / (1024 * 1024)).toFixed(1)}{" "}
                  MB)
                </div>
              )}
            </section>
          )}
      </div>
    </ModulePageShell>
  );
}
