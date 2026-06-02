"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Panel from "@/components/ui/Panel";
import { mlkRhetoricalAnalysisAssignment } from "@/lib/assignments/mlkRhetoricalAnalysis";

const ASSIGNMENT = mlkRhetoricalAnalysisAssignment;
const PASSAGES = ASSIGNMENT?.guidedPassages ?? [];
const TOTAL = PASSAGES.length;
const CONFIG_OK = Boolean(ASSIGNMENT?.assignmentId && TOTAL > 0);

const STRATEGY_LABELS = {
  ethos: "Ethos",
  pathos: "Pathos",
  logos: "Logos",
};

const STRATEGY_SCAFFOLDING = {
  ethos: {
    definition: "Ethos is about credibility and trust.",
    lookFor:
      "Look for how King presents himself as trustworthy, moral, knowledgeable, fair, religious, patriotic, or connected to respected ideas.",
    keyQuestion: "Why should this audience believe him?",
    observationPrompt:
      "What do you notice about how King builds credibility or earns trust here?",
    observationPlaceholder: "King builds credibility here by…",
    sentenceStarter: "King builds credibility here by…",
    audienceHint: "How might credibility or trust affect this audience?",
    purposeHint:
      "How might building trust help King accomplish his purpose with this audience?",
    essentialQuestionHint:
      "How does King’s credibility work differently with this audience than with another?",
  },
  pathos: {
    definition: "Pathos is about emotion.",
    lookFor:
      "Look for words or images that make the audience feel hope, anger, sadness, urgency, guilt, pride, or sympathy.",
    keyQuestion: "What feeling is King trying to create?",
    observationPrompt:
      "What do you notice about how King creates emotion here?",
    observationPlaceholder: "King creates emotion here by…",
    sentenceStarter: "King creates emotion here by…",
    audienceHint: "What might this make the audience feel?",
    purposeHint:
      "How might this emotion help King accomplish his purpose with this audience?",
    essentialQuestionHint:
      "How does King use emotion differently with this audience than with another?",
  },
  logos: {
    definition: "Logos is about reasoning.",
    lookFor:
      "Look for definitions, examples, cause and effect, comparisons, facts, or logical explanations.",
    keyQuestion: "How is King trying to make his argument make sense?",
    observationPrompt:
      "What do you notice about how King uses reasoning or explanation here?",
    observationPlaceholder: "King uses reasoning here by…",
    sentenceStarter: "King uses reasoning here by…",
    audienceHint:
      "How might this reasoning help the audience understand his argument?",
    purposeHint:
      "How might this logical explanation help King accomplish his purpose?",
    essentialQuestionHint:
      "How does King’s reasoning work differently with this audience than with another?",
  },
};

function getStrategyScaffolding(strategy) {
  return STRATEGY_SCAFFOLDING[strategy] ?? null;
}

const SOURCE_TYPE_LABELS = {
  speech: "Speech",
  letter: "Letter",
};

function sourceTitleForType(sourceType) {
  return sourceType === "speech" ? ASSIGNMENT.speech.title : ASSIGNMENT.letter.title;
}

function audienceHintForType(sourceType) {
  return sourceType === "speech"
    ? ASSIGNMENT.speech.audience
    : ASSIGNMENT.letter.audience;
}

function purposeHintForType(sourceType) {
  return sourceType === "speech"
    ? ASSIGNMENT.speech.purpose
    : ASSIGNMENT.letter.purpose;
}

function emptyFields() {
  return {
    studentObservation: "",
    audienceEffect: "",
    purposeConnection: "",
    essentialQuestionConnection: "",
  };
}

function fieldsFromObservation(row) {
  if (!row) return emptyFields();
  return {
    studentObservation: row.student_observation || "",
    audienceEffect: row.audience_effect || "",
    purposeConnection: row.purpose_connection || "",
    essentialQuestionConnection: row.essential_question_connection || "",
  };
}

function allFieldsFilled(fields) {
  return (
    fields.studentObservation.trim().length > 0 &&
    fields.audienceEffect.trim().length > 0 &&
    fields.purposeConnection.trim().length > 0 &&
    fields.essentialQuestionConnection.trim().length > 0
  );
}

export default function GuidedObservationsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const email = session?.user?.email ?? null;

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [fetchKey, setFetchKey] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fieldsByPassageId, setFieldsByPassageId] = useState({});
  const [savedPassageIds, setSavedPassageIds] = useState(new Set());
  const [showComplete, setShowComplete] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  const currentPassage = PASSAGES[currentIndex];
  const currentFields = fieldsByPassageId[currentPassage?.id] ?? emptyFields();
  const strategyLabel = STRATEGY_LABELS[currentPassage?.strategy] ?? "";
  const strategyScaffolding = getStrategyScaffolding(currentPassage?.strategy);
  const sourceTitle = currentPassage
    ? sourceTitleForType(currentPassage.sourceType)
    : "";

  const allPassagesSaved = useMemo(() => {
    return PASSAGES.every((p) => savedPassageIds.has(p.id));
  }, [savedPassageIds]);

  useEffect(() => {
    console.log("[guided-observations] session status:", status);
    console.log("[guided-observations] guided passage count:", TOTAL);
    console.log("[guided-observations] config ok:", CONFIG_OK);
  }, [status]);

  useEffect(() => {
    if (status === "loading") return;

    if (!email) {
      console.log("[guided-observations] no email on session; skipping fetch");
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const res = await fetch("/api/module2/observations/guided");
        console.log("[guided-observations] API response status:", res.status);
        const json = await res.json();

        if (cancelled) return;

        if (!res.ok || !json.ok) {
          const message = json?.error || "Could not load saved observations";
          console.error("[guided-observations] API error:", message);
          setLoadError(message);
          setToast(message);
          setTimeout(() => setToast(""), 2500);
          return;
        }

        const nextFields = {};
        const nextSaved = new Set();

        for (const row of json.data || []) {
          if (!row?.source_id) continue;
          nextFields[row.source_id] = fieldsFromObservation(row);
          if (allFieldsFilled(nextFields[row.source_id])) {
            nextSaved.add(row.source_id);
          }
        }

        setFieldsByPassageId(nextFields);
        setSavedPassageIds(nextSaved);

        const firstIncomplete = PASSAGES.findIndex(
          (p) => !nextSaved.has(p.id)
        );
        if (firstIncomplete === -1) {
          setShowComplete(true);
          setCurrentIndex(TOTAL - 1);
        } else {
          setCurrentIndex(firstIncomplete);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("[guided-observations] fetch error:", err);
          const message = `Network error: ${String(err)}`;
          setLoadError(message);
          setToast(message);
          setTimeout(() => setToast(""), 2500);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [email, status, fetchKey]);

  const updateField = useCallback((passageId, key, value) => {
    setFieldsByPassageId((prev) => ({
      ...prev,
      [passageId]: {
        ...(prev[passageId] ?? emptyFields()),
        [key]: value,
      },
    }));
  }, []);

  const saveAndContinue = async () => {
    if (!currentPassage || !allFieldsFilled(currentFields)) return;

    setSaving(true);
    try {
      const res = await fetch("/api/module2/observations/guided", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source_id: currentPassage.id,
          source_title: sourceTitleForType(currentPassage.sourceType),
          source_type: currentPassage.sourceType,
          quote: currentPassage.quote,
          rhetorical_strategy: currentPassage.strategy,
          student_observation: currentFields.studentObservation.trim(),
          audience_effect: currentFields.audienceEffect.trim(),
          purpose_connection: currentFields.purposeConnection.trim(),
          essential_question_connection:
            currentFields.essentialQuestionConnection.trim(),
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        setToast(json?.error || "Save failed");
        setTimeout(() => setToast(""), 2500);
        setSaving(false);
        return;
      }

      setSavedPassageIds((prev) => new Set([...prev, currentPassage.id]));
      setToast("Saved");
      setTimeout(() => setToast(""), 1200);

      const isLast = currentIndex === TOTAL - 1;
      if (isLast) {
        setShowComplete(true);
        setSaving(false);
        return;
      }

      setCurrentIndex((i) => i + 1);
    } catch (err) {
      setToast(`Network error: ${String(err)}`);
      setTimeout(() => setToast(""), 2500);
    }
    setSaving(false);
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-theme-light text-theme-dark p-6 flex items-center justify-center">
        <p className="text-sm text-theme-dark/80">Loading guided observations…</p>
      </div>
    );
  }

  if (status === "unauthenticated" || !session) {
    return (
      <div className="min-h-screen bg-theme-light text-theme-dark p-6 flex items-center justify-center">
        <Panel className="max-w-md w-full space-y-3 text-center">
          <h1 className="text-xl font-bold text-theme-dark">Please sign in</h1>
          <p className="text-sm text-theme-dark/80">
            You need to be signed in to complete guided observations.
          </p>
          <Link
            href="/api/auth/signin"
            className="inline-block bg-theme-blue text-white px-4 py-2 rounded-lg font-medium hover:opacity-90"
          >
            Sign in
          </Link>
        </Panel>
      </div>
    );
  }

  if (!CONFIG_OK) {
    return (
      <div className="min-h-screen bg-theme-light text-theme-dark p-6">
        <div className="max-w-3xl mx-auto">
          <Panel className="space-y-3 border-l-4 border-theme-red">
            <h1 className="text-xl font-bold text-theme-dark">
              Guided observations unavailable
            </h1>
            <p className="text-sm text-theme-dark/80">
              Assignment configuration is missing or has no guided passages.
              Expected {TOTAL} passages; check{" "}
              <code className="text-xs">lib/assignments/mlkRhetoricalAnalysis.ts</code>.
            </p>
          </Panel>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-theme-light text-theme-dark p-6 flex items-center justify-center">
        <p className="text-sm text-theme-dark/80">
          Loading saved guided observations…
        </p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-theme-light text-theme-dark p-6">
        <div className="max-w-3xl mx-auto">
          <Panel className="space-y-3 border-l-4 border-theme-red">
            <h1 className="text-xl font-bold text-theme-dark">
              Could not load guided observations
            </h1>
            <p className="text-sm text-theme-dark/80">{loadError}</p>
            <button
              type="button"
              onClick={() => setFetchKey((k) => k + 1)}
              className="bg-theme-blue text-white px-4 py-2 rounded-lg font-medium hover:opacity-90"
            >
              Try again
            </button>
          </Panel>
        </div>
      </div>
    );
  }

  if (!currentPassage) {
    return (
      <div className="min-h-screen bg-theme-light text-theme-dark p-6">
        <div className="max-w-3xl mx-auto">
          <Panel className="space-y-3 border-l-4 border-theme-red">
            <h1 className="text-xl font-bold text-theme-dark">
              No guided passage available
            </h1>
            <p className="text-sm text-theme-dark/80">
              Passage index {currentIndex + 1} of {TOTAL} is out of range.
            </p>
          </Panel>
        </div>
      </div>
    );
  }

  if (showComplete || allPassagesSaved) {
    return (
      <div className="min-h-screen bg-theme-light text-theme-dark p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          <Panel className="border-l-4 border-theme-blue space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-theme-blue">
              Essential Question
            </p>
            <p className="text-left text-theme-dark font-medium">
              {ASSIGNMENT.essentialQuestion}
            </p>
          </Panel>

          <Panel className="space-y-4">
            <h1 className="text-2xl font-extrabold text-theme-dark text-left">
              Guided Observations Complete
            </h1>
            <p className="text-left text-theme-dark/90">
              You completed six guided observations. These will help you build
              your thesis and essay.
            </p>
            <button
              type="button"
              onClick={() => router.push("/modules/2/success")}
              className="bg-theme-green text-white px-4 py-2 rounded-lg font-medium hover:opacity-90"
            >
              Continue
            </button>
          </Panel>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-theme-light text-theme-dark p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <Panel className="border-l-4 border-theme-blue space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-theme-blue">
            Essential Question
          </p>
          <p className="text-left text-theme-dark font-medium">
            {ASSIGNMENT.essentialQuestion}
          </p>
        </Panel>

        <div className="text-left">
          <h1 className="text-2xl font-extrabold text-theme-dark">
            Guided Observations
          </h1>
          <p className="text-sm font-medium text-theme-dark/80 mt-2">
            Guided Observation {currentIndex + 1} of {TOTAL}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-left">
          {PASSAGES.map((p, i) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setCurrentIndex(i)}
              className={`text-sm px-2 py-1 rounded ${
                currentIndex === i
                  ? "bg-theme-blue text-white"
                  : savedPassageIds.has(p.id)
                    ? "bg-theme-green/20 text-theme-dark/90 hover:bg-theme-green/30"
                    : "bg-theme-dark/10 text-theme-dark/80 hover:bg-theme-dark/20"
              }`}
            >
              {i + 1}. {STRATEGY_LABELS[p.strategy]} ({SOURCE_TYPE_LABELS[p.sourceType]})
            </button>
          ))}
        </div>

        <Panel className="space-y-4">
          <div className="flex flex-wrap gap-2 text-sm text-left">
            <span className="bg-theme-dark/10 px-2 py-1 rounded">
              Source: {sourceTitle}
            </span>
            <span className="bg-theme-dark/10 px-2 py-1 rounded">
              Type: {SOURCE_TYPE_LABELS[currentPassage.sourceType]}
            </span>
            <span className="bg-theme-dark/10 px-2 py-1 rounded">
              Strategy: {strategyLabel}
            </span>
          </div>

          <blockquote className="text-left border-l-4 border-theme-blue pl-4 italic text-theme-dark/90">
            &ldquo;{currentPassage.quote}&rdquo;
          </blockquote>

          <p className="text-left text-theme-dark/90 text-sm">
            {currentPassage.shortInstruction}
          </p>
        </Panel>

        <Panel className="space-y-4">
          <h2 className="text-xl font-bold text-theme-dark text-left">
            Your Observation
          </h2>

          {strategyScaffolding && (
            <div className="text-left bg-theme-blue/5 border border-theme-blue/20 rounded-lg p-4 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-theme-blue">
                Strategy reminder — {strategyLabel}
              </p>
              <p className="text-sm text-theme-dark/90">
                {strategyScaffolding.definition}
              </p>
              <p className="text-sm text-theme-dark/90">
                {strategyScaffolding.lookFor}
              </p>
              <p className="text-sm font-medium text-theme-dark">
                Ask yourself: {strategyScaffolding.keyQuestion}
              </p>
            </div>
          )}

          <div className="space-y-3 text-left">
            <div>
              <label className="block text-sm font-medium text-theme-dark/90 mb-1">
                {strategyScaffolding?.observationPrompt ??
                  `What do you notice about how King uses ${strategyLabel}?`}
              </label>
              <textarea
                className="w-full min-h-[80px] border border-theme-dark/20 rounded-lg p-2 text-sm bg-white"
                value={currentFields.studentObservation}
                onChange={(e) =>
                  updateField(
                    currentPassage.id,
                    "studentObservation",
                    e.target.value
                  )
                }
                placeholder={
                  strategyScaffolding?.observationPlaceholder ??
                  `This quote uses ${strategyLabel.toLowerCase()} because…`
                }
              />
              <p className="text-xs text-theme-dark/70 mt-1">
                Sentence starter: &ldquo;
                {strategyScaffolding?.sentenceStarter ??
                  `This quote uses ${strategyLabel.toLowerCase()} because King…`}
                &rdquo;
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-theme-dark/90 mb-1">
                What effect might this have on King&apos;s audience?
              </label>
              <textarea
                className="w-full min-h-[80px] border border-theme-dark/20 rounded-lg p-2 text-sm bg-white"
                value={currentFields.audienceEffect}
                onChange={(e) =>
                  updateField(
                    currentPassage.id,
                    "audienceEffect",
                    e.target.value
                  )
                }
                placeholder="King wants his audience to feel…"
              />
              <p className="text-xs text-theme-dark/70 mt-1">
                Sentence starter: &ldquo;King wants his audience to feel…&rdquo;
              </p>
              {strategyScaffolding?.audienceHint && (
                <p className="text-xs text-theme-dark/60 mt-1">
                  {strategyLabel} hint: {strategyScaffolding.audienceHint}
                </p>
              )}
              <p className="text-xs text-theme-dark/60 mt-1">
                Audience: {audienceHintForType(currentPassage.sourceType)}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-theme-dark/90 mb-1">
                How does this help King accomplish his purpose?
              </label>
              <textarea
                className="w-full min-h-[80px] border border-theme-dark/20 rounded-lg p-2 text-sm bg-white"
                value={currentFields.purposeConnection}
                onChange={(e) =>
                  updateField(
                    currentPassage.id,
                    "purposeConnection",
                    e.target.value
                  )
                }
                placeholder={`By using ${strategyLabel.toLowerCase()}, King…`}
              />
              <p className="text-xs text-theme-dark/70 mt-1">
                Sentence starter: &ldquo;By using {strategyLabel.toLowerCase()},
                King…&rdquo;
              </p>
              {strategyScaffolding?.purposeHint && (
                <p className="text-xs text-theme-dark/60 mt-1">
                  {strategyLabel} hint: {strategyScaffolding.purposeHint}
                </p>
              )}
              <p className="text-xs text-theme-dark/60 mt-1">
                Purpose: {purposeHintForType(currentPassage.sourceType)}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-theme-dark/90 mb-1">
                How does this connect to the essential question?
              </label>
              <textarea
                className="w-full min-h-[80px] border border-theme-dark/20 rounded-lg p-2 text-sm bg-white"
                value={currentFields.essentialQuestionConnection}
                onChange={(e) =>
                  updateField(
                    currentPassage.id,
                    "essentialQuestionConnection",
                    e.target.value
                  )
                }
                placeholder={`This shows how King uses ${strategyLabel.toLowerCase()} differently with this audience because…`}
              />
              <p className="text-xs text-theme-dark/70 mt-1">
                Sentence starter: &ldquo;This shows how King uses{" "}
                {strategyLabel.toLowerCase()} differently with this audience
                because…&rdquo;
              </p>
              {strategyScaffolding?.essentialQuestionHint && (
                <p className="text-xs text-theme-dark/60 mt-1">
                  {strategyLabel} hint: {strategyScaffolding.essentialQuestionHint}
                </p>
              )}
            </div>
          </div>
        </Panel>

        <Panel className="space-y-3">
          {!allFieldsFilled(currentFields) && (
            <p className="text-left text-sm text-theme-dark/80">
              Complete all four fields above to continue.
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={saveAndContinue}
              disabled={!allFieldsFilled(currentFields) || saving}
              className="bg-theme-green text-white px-4 py-2 rounded-lg font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {currentIndex === TOTAL - 1
                ? "Save and Finish Guided Observations"
                : "Save & Continue"}
            </button>
          </div>
        </Panel>

        {toast && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-theme-dark text-white text-sm px-3 py-2 rounded shadow">
            {toast}
          </div>
        )}
      </div>
    </div>
  );
}
