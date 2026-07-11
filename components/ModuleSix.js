"use client";

import { useState, useEffect, useRef, useMemo } from "react";
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
  buildDraftSectionSteps,
  getWritingSectionLabel,
  getModule6StepPresentation,
} from "@/components/module6/module6StepPresentation";

const DRAFT_TEXTAREA_CLASS =
  "min-h-[min(420px,52vh)] w-full resize-y rounded-xl border-2 border-theme-dark/20 bg-white px-4 py-4 text-base leading-7 text-text-primary shadow-soft focus:border-theme-blue/50 focus:outline-none focus:ring-2 focus:ring-theme-blue/20 disabled:cursor-not-allowed disabled:opacity-60";

export default function ModuleSix() {
  const { data: session } = useSession();
  const router = useRouter();

  const [outline, setOutline] = useState(null);
  const [outlineLoading, setOutlineLoading] = useState(true);
  const [outlineMissing, setOutlineMissing] = useState(false);

  const [observations, setObservations] = useState([]);
  const [paragraphPlans, setParagraphPlans] = useState([]);
  const [proofPlan, setProofPlan] = useState([]);
  const [thesisText, setThesisText] = useState("");

  const [draft, setDraft] = useState([]);
  const [locked, setLocked] = useState(false);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);

  const [gateBlocked, setGateBlocked] = useState(false);

  const hasLoggedStartRef = useRef(false);

  const sectionSteps = useMemo(
    () => (outline ? buildDraftSectionSteps(outline) : []),
    [outline]
  );

  const currentStep = sectionSteps[currentSectionIndex] ?? sectionSteps[0] ?? null;
  const presentation = useMemo(
    () => getModule6StepPresentation(currentStep, outline),
    [currentStep, outline]
  );

  const assignmentQuestion = mlkRhetoricalAnalysisAssignment.essentialQuestion;

  const getDraftMetrics = () => {
    const sectionCount = draft.length;
    const sectionWordCounts = draft.map((s) =>
      (s || "")
        .trim()
        .split(/\s+/)
        .filter(Boolean).length
    );
    const totalWords = sectionWordCounts.reduce((a, b) => a + b, 0);
    return { sectionCount, sectionWordCounts, totalWords };
  };

  useEffect(() => {
    const loadData = async () => {
      const email = session?.user?.email;
      if (!email) return;

      setGateBlocked(false);
      setOutlineMissing(false);
      setOutlineLoading(true);

      const { ok } = await requireModuleAccess({
        userEmail: email,
        assignmentName: MLK_ASSIGNMENT_NAME,
        minModule: 6,
      });

      if (!ok) {
        setGateBlocked(true);
        setOutlineLoading(false);
        return;
      }

      const outlineResult = await getOutlineRow(5);

      if (!outlineResult.ok) {
        console.error("Error loading outline for Module 6:", outlineResult.error);
      }

      const outlineRow = outlineResult.data;
      const hasOutline = !!outlineRow?.outline;

      setOutline(outlineRow?.outline ?? null);
      setThesisText(String(outlineRow?.outline?.thesis || "").trim());
      setOutlineMissing(!hasOutline);
      setOutlineLoading(false);

      if (!hasOutline) {
        return;
      }

      if (!hasLoggedStartRef.current) {
        hasLoggedStartRef.current = true;
        logActivity(email, "module_started", { module: 6, hasOutline });
      }

      const [obsResult, draftResult, planResult] = await Promise.all([
        getTChartEntriesRows(),
        getModule6DraftRow(),
        getParagraphPlanRow(),
      ]);

      if (!obsResult.ok) {
        console.error("Error loading observations for Module 6:", obsResult.error);
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
        console.error("Error loading thesis for Module 6 reference shelf:", err);
      }

      if (!draftResult.ok) {
        console.error("Error loading draft for Module 6:", draftResult.error);
      }

      const draftRow = draftResult.data;

      if (Array.isArray(draftRow?.sections) && draftRow.sections.length) {
        setDraft(draftRow.sections);
        setLocked(draftRow.locked === true);
      } else {
        const emptySections = [
          "",
          ...(outlineRow?.outline?.body || []).map(() => ""),
          "",
        ];
        setDraft(emptySections);
        setLocked(false);
      }
    };

    loadData();
  }, [session]);

  useEffect(() => {
    if (!session?.user?.email || draft.length === 0) return;

    const id = setTimeout(async () => {
      const email = session.user.email;

      try {
        const result = await upsertModule6DraftArtifact({
          userEmail: email,
          sections: draft,
          full_text: draft.join("\n\n"),
          locked,
        });

        if (!result.ok) {
          console.error("Module 6 autosave error:", result.error);
        } else {
          const metrics = getDraftMetrics();
          logActivity(email, "draft_autosaved", {
            module: 6,
            locked,
            ...metrics,
          });
        }
      } catch (err) {
        console.error("Module 6 autosave failed:", err);
      }
    }, 800);

    return () => clearTimeout(id);
  }, [draft, locked, session]);

  useEffect(() => {
    if (sectionSteps.length === 0) return;
    if (currentSectionIndex > sectionSteps.length - 1) {
      setCurrentSectionIndex(sectionSteps.length - 1);
    }
  }, [sectionSteps.length, currentSectionIndex]);

  const updateSection = (i, val) => {
    if (locked) return;
    setDraft((prev) => {
      const copy = [...prev];
      copy[i] = val;
      return copy;
    });
  };

  const markComplete = async () => {
    const email = session?.user?.email;
    if (!email) return;

    setLocked(true);

    const result = await upsertModule6DraftArtifact({
      userEmail: email,
      sections: draft,
      full_text: draft.join("\n\n"),
      locked: true,
    });

    if (!result.ok) {
      alert(
        "We could not save your draft. Please try again. " +
          (result.error?.message || "")
      );
      setLocked(false);
      return;
    }

    const metrics = getDraftMetrics();
    await logActivity(email, "module_completed", {
      module: 6,
      locked: true,
      ...metrics,
    });

    router.push("/modules/6/success");
  };

  const goBack = () => {
    setCurrentSectionIndex((index) => Math.max(0, index - 1));
  };

  const goNext = () => {
    setCurrentSectionIndex((index) =>
      Math.min(sectionSteps.length - 1, index + 1)
    );
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

  if (outlineLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-base">
        <p className="text-text-primary">Loading your outline and draft…</p>
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
            then return here to draft.
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
  const sectionLabel = getWritingSectionLabel(currentStep);

  const activeOutlinePoints =
    currentStep.type === "body" &&
    Array.isArray(outline?.body?.[currentStep.bodyIndex]?.points)
      ? outline.body[currentStep.bodyIndex].points
          .map((point) => String(point || "").trim())
          .filter(Boolean)
      : [];

  const conclusionPlanLines = [];
  if (currentStep.type === "conclusion" && outline?.conclusion) {
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
      {isFirstSection && !locked ? (
        <InfoCallout title="You are not starting over.">
          <p>
            You already figured out what you want to say. Now you help your reader
            understand it—one section at a time.
          </p>
        </InfoCallout>
      ) : null}

      <div
        id="module-6-thesis-card"
        className="rounded-xl border-2 border-theme-blue/40 bg-theme-blue/5 px-4 py-3 shadow-soft"
      >
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-theme-blue">
          {presentation.thesisCardTitle || "Your thesis (already written)"}
        </p>
        <p className="mt-1 text-[11px] font-medium text-theme-blue/80">
          Blue card · look here when coaching mentions your thesis
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
        {presentation.thesisCardHint ? (
          <p className="mt-2 text-xs leading-relaxed text-text-muted">
            {presentation.thesisCardHint}
          </p>
        ) : null}
      </div>

      {activeOutlinePoints.length > 0 ||
      conclusionPlanLines.length > 0 ||
      presentation.outlineHelpNote ? (
        <div
          id="module-6-outline-card"
          className="rounded-xl border-2 border-theme-green/40 bg-theme-green/5 px-4 py-3 shadow-soft"
        >
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-theme-green">
            {presentation.outlineHelpTitle || "Outline notes for this section"}
          </p>
          <p className="mt-1 text-[11px] font-medium text-theme-green/80">
            Green card · look here when coaching mentions your outline
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

  return (
    <ModulePageShell>
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
              Module 6 · Draft · section {currentSectionIndex + 1} of{" "}
              {sectionSteps.length}. One section at a time.
            </p>
            {!locked ? (
              <p className="text-[11px] leading-relaxed text-text-muted/80">
                Your draft saves as you type.
              </p>
            ) : null}
          </div>

          <WorkingSetSection
            className="[&>div:last-child]:border-theme-blue/20 [&>div:last-child]:shadow-md"
            label={presentation.workingSetLabel}
            description={
              presentation.workingSetDescription ||
              "Write Step 1 first. Then continue through the steps in order."
            }
          >
            <div className="space-y-3 text-left">
              <p className="text-sm font-medium text-text-primary">{sectionLabel}</p>
              <textarea
                spellCheck
                autoCorrect="on"
                autoCapitalize="sentences"
                lang="en"
                enterKeyHint="enter"
                className={DRAFT_TEXTAREA_CLASS}
                value={draft[draftIndex] || ""}
                onChange={(e) => updateSection(draftIndex, e.target.value)}
                disabled={locked}
                placeholder={
                  currentStep.type === "intro"
                    ? "What's the first thing your reader needs to know?"
                    : "Start with Step 1…"
                }
              />
            </div>
          </WorkingSetSection>

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
            <div className="flex gap-2">
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
                  onClick={markComplete}
                  disabled={locked}
                  className="rounded-lg bg-theme-orange px-4 py-2 font-medium text-white shadow-soft disabled:opacity-50"
                >
                  Finish draft and continue
                </button>
              )}
            </div>
          </div>
        </ModuleSixStepFrame>
    </ModulePageShell>
  );
}
