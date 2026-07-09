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
  getExportedDocLink,
} from "@/lib/supabase/helpers/studentExports";
import {
  getModule9Checklist,
  upsertModule9Checklist,
} from "@/lib/supabase/helpers/module9Checklist";
import { getFinalTextForExport } from "@/lib/supabase/helpers/studentDrafts";
import ModuleSixStepFrame from "@/components/module6/ModuleSixStepFrame";
import { WorkingSetSection } from "@/components/module3/ModuleThreeDeskFrame";
import ModuleEightReferenceShelf from "@/components/module8/ModuleEightReferenceShelf";
import {
  getSectionCountFromOutline,
  splitDraftIntoSections,
} from "@/components/module7/module7DraftSections";
import { buildDraftSectionSteps, romanNumeral } from "@/components/module6/module6StepPresentation";
import {
  getModule8StepPresentation,
  MODULE8_STEP_TYPES,
  MODULE8_WORKSPACE_STEPS,
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
  const [creatingDoc, setCreatingDoc] = useState(false);
  const [popupBlocked, setPopupBlocked] = useState(false);

  const [checklistState, setChecklistState] = useState(Array(6).fill(false));
  const [checklistLoading, setChecklistLoading] = useState(true);
  const [checklistError, setChecklistError] = useState(null);

  const hasLoggedStartRef = useRef(false);
  const checklistLoadedRef = useRef(false);
  const saveDebounceRef = useRef(null);
  const hasInitialChecklistLoadRef = useRef(false);

  const email = session?.user?.email ?? null;
  const assignmentQuestion = mlkRhetoricalAnalysisAssignment.essentialQuestion;

  const sectionSteps = useMemo(
    () => (outline ? buildDraftSectionSteps(outline) : []),
    [outline]
  );

  const currentStep = MODULE8_WORKSPACE_STEPS[currentStepIndex] ?? MODULE8_WORKSPACE_STEPS[0];
  const presentation = useMemo(
    () => getModule8StepPresentation(currentStep),
    [currentStep]
  );

  const checklistComplete = checklistState.every(Boolean);

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
        getExportedDocLink({ userEmail: email }),
      ]);

      if (!m7Result.ok) console.error("Module 7 fetch error:", m7Result.error);
      if (!m8Result.ok) console.error("Module 8 fetch error:", m8Result.error);

      const m7 = m7Result.data;
      const m8 = m8Result.data;
      const essayText = String(m7?.final_text || m7?.full_text || "").trim();

      setFinishedEssayText(essayText);
      setSections(splitDraftIntoSections(essayText, sectionCount));

      if (docResult.data?.web_view_link) {
        setSubmissionDocUrl(docResult.data.web_view_link);
      }

      if (m8?.final_ready) {
        setLocked(true);
        setCurrentStepIndex(2);
        if (m8?.final_text) {
          const lockedText = String(m8.final_text).trim();
          setFinishedEssayText(lockedText);
          setSections(splitDraftIntoSections(lockedText, sectionCount));
        }
      }

      if (!hasLoggedStartRef.current) {
        hasLoggedStartRef.current = true;
        const metrics = getTextMetrics(essayText);
        await logActivity(email, "module_started", {
          module: 8,
          from_module7_final: !!m7?.final_text,
          module8_already_locked: !!m8?.final_ready,
          has_submission_doc: !!docResult.data?.web_view_link,
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

  const handleCreateSubmissionDoc = async () => {
    if (!email || locked) return;

    setCreatingDoc(true);
    try {
      const exportRes = await getFinalTextForExport({ userEmail: email });

      await logActivity(email, "export_to_docs_attempt", {
        module: 8,
        status: exportRes.status,
        sourceModule: exportRes.sourceModule,
        details: exportRes.details,
      });

      if (exportRes.status !== "ok" || !exportRes.text) {
        if (exportRes.status === "missing") {
          alert(
            "We could not find your finished essay yet. Go back to Module 7 and finish revising your essay, then try again."
          );
          return;
        }
        alert(
          "We hit a problem while trying to load your essay. Please refresh and try again."
        );
        return;
      }

      if (exportRes.sourceModule === 6) {
        alert(
          "We are using your Module 6 draft because we could not find a finalized Module 7 version yet. If you finished revising in Module 7, go back and finalize first."
        );
      }

      const res = await fetch("/api/export-to-docs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: exportRes.text, email }),
      });

      const result = await res.json();
      if (!res.ok) {
        alert("We could not create your Google Doc. Please try again.");
        await logActivity(email, "export_to_docs_failed", {
          module: 8,
          status: "api_failed",
        });
        return;
      }

      setSubmissionDocUrl(result.url);

      await logActivity(email, "export_to_docs", {
        module: 8,
        url: result.url,
        sourceModule: exportRes.sourceModule,
        status: exportRes.status,
        details: exportRes.details,
      });

      const win = window.open(result.url, "_blank");
      if (!win || win.closed || typeof win.closed === "undefined") {
        setPopupBlocked(true);
      }
    } finally {
      setCreatingDoc(false);
    }
  };

  const goBack = () => {
    setCurrentStepIndex((index) => Math.max(0, index - 1));
  };

  const goNext = () => {
    setCurrentStepIndex((index) => Math.min(MODULE8_WORKSPACE_STEPS.length - 1, index + 1));
  };

  const finishPreparing = async () => {
    if (!email) return;

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
      ...metrics,
    });

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
          <a
            href="/modules/5"
            className="inline-block rounded-lg bg-theme-blue px-5 py-2.5 text-sm font-semibold text-white hover:brightness-105"
          >
            Go to Module 5
          </a>
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
          <a
            href="/modules/7"
            className="inline-block rounded-lg bg-theme-blue px-5 py-2.5 text-sm font-semibold text-white hover:brightness-105"
          >
            Go to Module 7
          </a>
        </div>
      </div>
    );
  }

  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === MODULE8_WORKSPACE_STEPS.length - 1;
  const { wordCount } = getTextMetrics();

  const canAdvanceFromStep1 = !!submissionDocUrl;
  const canAdvanceFromStep2 = checklistComplete;
  const canFinish = submissionDocUrl && checklistComplete;

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
    <details className="rounded-lg border border-border-soft/60 bg-surface-soft/20 px-3 py-2">
      <summary className="cursor-pointer list-none text-xs font-medium text-text-muted">
        Your finished essay ({wordCount} words) — reference only
      </summary>
      <div className={`mt-3 ${FINISHED_ESSAY_PREVIEW_CLASS}`}>
        {sectionSteps.map((step) => {
          const text = String(sections[step.draftIndex] || "").trim();
          if (!text) return null;
          return (
            <div key={step.id} className="mb-4 last:mb-0">
              <p className="mb-1 text-xs font-medium text-text-muted">
                {romanNumeral(step.roman)}. {step.title}
              </p>
              <p className="whitespace-pre-wrap">{text}</p>
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-[11px] leading-relaxed text-text-muted">
        Your finished essay stays here (reference only). Your Google Doc is the
        paper you will format and turn in.
      </p>
    </details>
  );

  return (
    <div className="w-full pb-10">
      <ModuleSixStepFrame
        question={presentation.question}
        whyMatters={presentation.whyMatters}
        successLooksLike={presentation.successLooksLike}
        coachingMessage={presentation.coachingMessage}
        nextStepText={presentation.nextStepText}
        sidebar={referenceShelf}
      >
        <div className="space-y-3">
          <div className="rounded-lg border border-theme-blue/20 bg-theme-blue/5 px-4 py-3 text-left">
            <p className="text-sm font-semibold text-text-primary">
              Prepare Your Essay for Submission
            </p>
            <p className="mt-2 text-sm leading-relaxed text-text-primary">
              Your writing is complete.
            </p>
            <ul className="mt-2 space-y-1 text-sm leading-relaxed text-text-muted">
              <li>You are no longer improving your ideas.</li>
              <li>You are preparing the paper your teacher will read.</li>
              <li>
                Your finished essay stays here. Your Google Doc is what you will
                format and turn in.
              </li>
            </ul>
          </div>

          <PreparationProgressPanel
            hasGoogleDoc={!!submissionDocUrl}
            checklistComplete={checklistComplete}
            isReadyStep={currentStep.type === MODULE8_STEP_TYPES.READY}
            preparationComplete={locked || (canFinish && isLastStep)}
          />

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
          className="[&>div:last-child]:border-theme-blue/20 [&>div:last-child]:shadow-md"
          label={presentation.workingSetLabel}
          description={presentation.workingSetDescription}
        >
          {currentStep.type === MODULE8_STEP_TYPES.CREATE_DOC ? (
            <div className="space-y-4 text-left">
              {finishedEssayPreview}

              {!submissionDocUrl ? (
                <div className="rounded-xl border-2 border-theme-blue/25 bg-theme-blue/5 px-5 py-4 shadow-soft">
                  <p className="text-sm leading-relaxed text-text-primary">
                    Your finished essay will be placed into a Google Doc.
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-text-muted">
                    This is the paper you&apos;ll format in APA style before turning
                    it in—not a place to rewrite your essay.
                  </p>
                  <button
                    type="button"
                    onClick={handleCreateSubmissionDoc}
                    disabled={locked || creatingDoc}
                    className="mt-4 rounded-lg bg-theme-blue px-6 py-3 text-base font-semibold text-white shadow-soft disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {creatingDoc ? "Creating your Google Doc…" : "Create your Google Doc"}
                  </button>
                </div>
              ) : (
                <div className="space-y-3 rounded-xl border border-theme-green/30 bg-theme-green/5 px-4 py-4">
                  <p className="text-sm font-semibold text-theme-green">
                    Your Google Doc is ready
                  </p>
                  <ul className="space-y-1.5 text-sm text-text-primary">
                    <li>✓ Google Doc created</li>
                    <li>
                      ✓{" "}
                      <a
                        href={submissionDocUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-theme-blue underline"
                      >
                        Open your Google Doc
                      </a>
                    </li>
                    <li>✓ Check that your title page is in the document</li>
                  </ul>
                  {popupBlocked ? (
                    <p className="text-xs text-text-muted">
                      If a popup blocker stopped the new tab, use the link above.
                    </p>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(submissionDocUrl)}
                    className="text-xs text-theme-blue underline"
                  >
                    Copy link to your Google Doc
                  </button>
                </div>
              )}
            </div>
          ) : null}

          {currentStep.type === MODULE8_STEP_TYPES.FORMAT ? (
            <div className="space-y-4 text-left">
              {submissionDocUrl ? (
                <div className="rounded-lg border border-border-soft/60 bg-surface-soft/30 px-4 py-3">
                  <p className="text-sm font-medium text-text-primary">Your Google Doc</p>
                  <a
                    href={submissionDocUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-theme-blue underline"
                  >
                    Open your Google Doc
                  </a>
                </div>
              ) : null}

              <p className="text-sm font-medium text-text-primary">
                Most of the work in this step happens in your Google Doc.
              </p>
              <p className="text-sm leading-relaxed text-text-muted">
                Come back here as you complete each formatting task. You should not
                be editing your essay in the processor—only checking off what you
                finished in your Google Doc.
              </p>

              <div className="space-y-2">
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
                <p className="text-xs text-red-700">
                  Checklist could not be saved: {checklistError}. Your selections are
                  kept for this session.
                </p>
              ) : null}

              {checklistComplete ? (
                <p className="text-sm font-medium text-theme-green">
                  All formatting items complete.
                </p>
              ) : null}
            </div>
          ) : null}

          {currentStep.type === MODULE8_STEP_TYPES.READY ? (
            <div className="space-y-4 text-left">
              <p className="text-sm leading-relaxed text-text-muted">
                You finished writing in Module 7. This step closes your preparation—not
                another writing assignment.
              </p>
              <ul className="space-y-2 text-sm text-text-primary">
                <li className={submissionDocUrl ? "text-theme-green" : "text-text-muted"}>
                  {submissionDocUrl ? "✓" : "○"} Google Doc created
                </li>
                <li className={checklistComplete ? "text-theme-green" : "text-text-muted"}>
                  {checklistComplete ? "✓" : "○"} APA formatting complete
                </li>
              </ul>

              <div className="rounded-lg bg-surface-soft/40 px-4 py-3">
                <p className="text-sm font-medium text-text-primary">Reflection</p>
                <p className="mt-1 text-sm leading-relaxed text-text-muted">
                  What is one formatting choice you made that helps your reader?
                </p>
              </div>

              {!canFinish && !locked ? (
                <p className="text-xs text-text-muted">
                  Create your Google Doc and complete the APA checklist before continuing.
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
              Continue to Module 9 to demonstrate your understanding of APA
              formatting and submit your final PDF.
            </p>
            <Link
              href="/modules/9"
              className="inline-block rounded-lg bg-theme-blue px-4 py-2 text-sm font-semibold text-white"
            >
              Continue to Module 9
            </Link>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border-soft/60 pt-4">
          <div>
            {!isFirstStep && !locked ? (
              <button
                type="button"
                onClick={goBack}
                className="rounded-lg bg-surface-soft px-4 py-2 text-text-primary hover:bg-border-soft/60"
              >
                Back
              </button>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            {!isLastStep && !locked ? (
              <button
                type="button"
                onClick={goNext}
                disabled={
                  (currentStepIndex === 0 && !canAdvanceFromStep1) ||
                  (currentStepIndex === 1 && !canAdvanceFromStep2)
                }
                className="rounded-lg bg-theme-blue px-4 py-2 font-medium text-white disabled:opacity-50"
              >
                Keep going
              </button>
            ) : null}
            {isLastStep && !locked ? (
              <button
                type="button"
                onClick={finishPreparing}
                disabled={!canFinish}
                className="rounded-lg bg-theme-orange px-4 py-2 font-medium text-white shadow-soft disabled:opacity-50"
              >
                Finish preparing your essay and continue
              </button>
            ) : null}
          </div>
        </div>
      </ModuleSixStepFrame>
    </div>
  );
}
