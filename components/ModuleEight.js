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
  getParagraphPlanRow,
  getTChartEntriesRows,
} from "@/lib/artifacts/readArtifactsClient";
import { upsertModule8DraftArtifact } from "@/lib/artifacts/writeArtifacts";
import { parseApiResponse } from "@/lib/api/clientFetch";
import ModuleSixStepFrame from "@/components/module6/ModuleSixStepFrame";
import { WorkingSetSection } from "@/components/module3/ModuleThreeDeskFrame";
import ModuleSevenReferenceShelf from "@/components/module7/ModuleSevenReferenceShelf";
import {
  getSectionCountFromOutline,
  joinSections,
  splitDraftIntoSections,
} from "@/components/module7/module7DraftSections";
import {
  buildDraftSectionSteps,
  romanNumeral,
} from "@/components/module6/module6StepPresentation";
import { getModule8StepPresentation } from "@/components/module8/module8StepPresentation";
import { logActivity } from "../lib/logActivity";

const POLISH_TEXTAREA_CLASS =
  "min-h-[min(320px,48vh)] w-full resize-y rounded-xl border-2 border-theme-dark/20 bg-white px-4 py-4 text-base leading-7 text-text-primary shadow-soft focus:border-theme-blue/50 focus:outline-none focus:ring-2 focus:ring-theme-blue/20 disabled:cursor-not-allowed disabled:opacity-60";

export default function ModuleEight() {
  const { data: session } = useSession();
  const router = useRouter();

  const [outline, setOutline] = useState(null);
  const [outlineLoading, setOutlineLoading] = useState(true);
  const [outlineMissing, setOutlineMissing] = useState(false);

  const [observations, setObservations] = useState([]);
  const [paragraphPlans, setParagraphPlans] = useState([]);
  const [proofPlan, setProofPlan] = useState([]);
  const [thesisText, setThesisText] = useState("");

  const [sections, setSections] = useState([]);
  const [locked, setLocked] = useState(false);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);

  const hasLoggedStartRef = useRef(false);
  const email = session?.user?.email ?? null;
  const assignmentQuestion = mlkRhetoricalAnalysisAssignment.essentialQuestion;

  const sectionSteps = useMemo(
    () => (outline ? buildDraftSectionSteps(outline) : []),
    [outline]
  );

  const currentStep = sectionSteps[currentSectionIndex] ?? sectionSteps[0] ?? null;
  const presentation = useMemo(
    () => getModule8StepPresentation(currentStep, outline),
    [currentStep, outline]
  );

  const fullText = useMemo(() => joinSections(sections), [sections]);

  const getTextMetrics = (value) => {
    const raw = typeof value === "string" ? value : fullText;
    const words = raw
      .trim()
      .split(/\s+/)
      .filter(Boolean).length;
    return {
      wordCount: words,
      charCount: raw.length,
    };
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
      setThesisText(String(outlineRow?.outline?.thesis || "").trim());
      setOutlineMissing(!hasOutline);
      setOutlineLoading(false);

      if (!hasOutline) {
        return;
      }

      const [m7Result, m8Result, obsResult, planResult] = await Promise.all([
        getModule7DraftRow(),
        getModule8DraftRow(),
        getTChartEntriesRows(),
        getParagraphPlanRow(),
      ]);

      if (!m7Result.ok) console.error("Module 7 fetch error:", m7Result.error);
      if (!m8Result.ok) console.error("Module 8 fetch error:", m8Result.error);

      if (!obsResult.ok) {
        console.error("Error loading observations for Module 8:", obsResult.error);
      }
      setObservations(obsResult.data || []);

      if (planResult.ok && Array.isArray(planResult.data?.buckets)) {
        setParagraphPlans(planResult.data.buckets);
      }

      try {
        const thesisRes = await fetch("/api/module3/thesis");
        const thesisJson = await parseApiResponse(thesisRes);
        const thesisRow = thesisJson?.thesis ?? null;
        if (thesisRow) {
          if (!String(outlineRow?.outline?.thesis || "").trim() && thesisRow.thesis) {
            setThesisText(String(thesisRow.thesis).trim());
          }
          if (Array.isArray(thesisRow.proofPlan)) {
            setProofPlan(
              thesisRow.proofPlan.map((line) => String(line || "").trim()).filter(Boolean)
            );
          }
        }
      } catch (err) {
        console.error("Error loading thesis for Module 8 reference shelf:", err);
      }

      const m7 = m7Result.data;
      const m8 = m8Result.data;
      const seedDraft = m7?.final_text || m7?.full_text || "";
      let initialSections = splitDraftIntoSections(seedDraft, sectionCount);

      if (m8?.final_ready) {
        setLocked(true);
        if (m8?.final_text) {
          initialSections = splitDraftIntoSections(m8.final_text, sectionCount);
        }
      }

      setSections(initialSections);

      if (!hasLoggedStartRef.current) {
        hasLoggedStartRef.current = true;
        const metrics = getTextMetrics(
          m8?.final_text || joinSections(initialSections) || seedDraft || ""
        );
        await logActivity(email, "module_started", {
          module: 8,
          from_module7_final: !!m7?.final_text,
          module8_already_locked: !!m8?.final_ready,
          ...metrics,
        });
      }
    };

    load();
  }, [email]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (sectionSteps.length === 0) return;
    if (currentSectionIndex > sectionSteps.length - 1) {
      setCurrentSectionIndex(sectionSteps.length - 1);
    }
  }, [sectionSteps.length, currentSectionIndex]);

  const updateSection = (draftIndex, value) => {
    setSections((prev) => {
      const next = [...prev];
      next[draftIndex] = value;
      return next;
    });
  };

  const goBack = () => {
    setCurrentSectionIndex((i) => Math.max(0, i - 1));
  };

  const goNext = () => {
    setCurrentSectionIndex((i) => Math.min(sectionSteps.length - 1, i + 1));
  };

  const saveAndLock = async () => {
    if (!email) return;

    const text = joinSections(sections);
    const result = await upsertModule8DraftArtifact({
      userEmail: email,
      full_text: text,
      final_text: text,
      revised: false,
      final_ready: true,
    });

    if (!result.ok) {
      console.error("Module 8 save error:", result.error);
      alert("We couldn't save your polish. Please try again.");
      return;
    }

    setLocked(true);

    const metrics = getTextMetrics(text);
    await logActivity(email, "module_completed", {
      module: 8,
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
            Sign in to polish your essay and prepare it for formatting.
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

  if (outlineLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-base">
        <p className="text-text-primary">Loading your essay and reference materials…</p>
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
            Finish organizing your paragraph plans into an outline in Module 5,
            then return here to polish your essay.
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

  if (!outline || !currentStep) {
    return null;
  }

  const draftIndex = currentStep.draftIndex;
  const isFirstSection = currentSectionIndex === 0;
  const isLastSection = currentSectionIndex === sectionSteps.length - 1;
  const sectionLabel = `${romanNumeral(currentStep.roman)}. ${currentStep.title}`;
  const { wordCount, charCount } = getTextMetrics();

  const referenceShelf = (
    <ModuleSevenReferenceShelf
      assignmentQuestion={assignmentQuestion}
      thesis={thesisText}
      proofPlan={proofPlan}
      outline={outline}
      paragraphPlans={paragraphPlans}
      observations={observations}
      sectionSteps={sectionSteps}
      sections={sections}
      activeStep={currentStep}
      activeBadge="polishing now"
    />
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
        <div className="rounded-lg bg-surface-soft/30 px-3 py-2 text-left">
          <p className="text-[11px] leading-relaxed text-text-muted">
            Module 8 · Polish · section {currentSectionIndex + 1} of{" "}
            {sectionSteps.length}. Same essay—one section at a time.
          </p>
          <p className="text-[11px] leading-relaxed text-text-muted/80">
            You revised it in Module 7. Now you are strengthening clarity, flow,
            and sentence quality.
          </p>
          <p className="mt-1 text-[11px] text-text-muted/80">
            {wordCount} words · {charCount} characters
          </p>
        </div>

        <WorkingSetSection
          className="[&>div:last-child]:border-theme-blue/20 [&>div:last-child]:shadow-md"
          label={presentation.workingSetLabel}
          description={presentation.workingSetDescription}
        >
          <div className="space-y-3 text-left">
            <p className="text-sm font-medium text-text-primary">{sectionLabel}</p>
            <textarea
              spellCheck
              autoCorrect="on"
              autoCapitalize="sentences"
              lang="en"
              enterKeyHint="enter"
              className={POLISH_TEXTAREA_CLASS}
              value={sections[draftIndex] || ""}
              onChange={(e) => updateSection(draftIndex, e.target.value)}
              disabled={locked}
              placeholder="Polish this section in your own words…"
            />
          </div>
        </WorkingSetSection>

        {locked ? (
          <div className="space-y-2 rounded-lg border border-theme-green/30 bg-theme-green/5 px-4 py-3 text-sm text-theme-green">
            <p className="font-semibold">Your essay polish is complete for Module 8.</p>
            <p>
              This is your final content draft. Next you will prepare your essay
              for formatting and submission in Module 9.
            </p>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border-soft/60 pt-4">
          <div>
            {!isFirstSection ? (
              <button
                type="button"
                onClick={goBack}
                disabled={locked}
                className="rounded-lg bg-surface-soft px-4 py-2 text-text-primary hover:bg-border-soft/60 disabled:opacity-50"
              >
                Back
              </button>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            {!isLastSection ? (
              <button
                type="button"
                onClick={goNext}
                disabled={locked}
                className="rounded-lg bg-theme-blue px-4 py-2 font-medium text-white disabled:opacity-50"
              >
                Keep going
              </button>
            ) : (
              <button
                type="button"
                onClick={saveAndLock}
                disabled={locked}
                className="rounded-lg bg-theme-orange px-4 py-2 font-medium text-white shadow-soft disabled:opacity-50"
              >
                Finish polishing your essay and continue
              </button>
            )}
          </div>
        </div>
      </ModuleSixStepFrame>
    </div>
  );
}
