"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Panel from "@/components/ui/Panel";
import { mlkRhetoricalAnalysisAssignment } from "@/lib/assignments/mlkRhetoricalAnalysis";

const ASSIGNMENT = mlkRhetoricalAnalysisAssignment;
const PASSAGES = ASSIGNMENT.guidedPassages;
const TOTAL = PASSAGES.length;

const STRATEGY_LABELS = {
  ethos: "Ethos",
  pathos: "Pathos",
  logos: "Logos",
};

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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fieldsByPassageId, setFieldsByPassageId] = useState({});
  const [savedPassageIds, setSavedPassageIds] = useState(new Set());
  const [showComplete, setShowComplete] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  const currentPassage = PASSAGES[currentIndex];
  const currentFields = fieldsByPassageId[currentPassage?.id] ?? emptyFields();
  const strategyLabel = STRATEGY_LABELS[currentPassage?.strategy] ?? "";
  const sourceTitle = currentPassage
    ? sourceTitleForType(currentPassage.sourceType)
    : "";

  const allPassagesSaved = useMemo(() => {
    return PASSAGES.every((p) => savedPassageIds.has(p.id));
  }, [savedPassageIds]);

  useEffect(() => {
    if (!email) return;

    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/module2/observations/guided");
        const json = await res.json();

        if (cancelled) return;

        if (!res.ok || !json.ok) {
          setToast(json?.error || "Could not load saved observations");
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
          setToast(`Network error: ${String(err)}`);
          setTimeout(() => setToast(""), 2500);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [email]);

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

  if (status === "loading" || (status === "authenticated" && loading)) {
    return (
      <div className="min-h-screen bg-theme-light text-theme-dark p-6 flex items-center justify-center">
        <p className="text-sm text-theme-dark/80">Loading…</p>
      </div>
    );
  }

  if (!session) {
    return null;
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

          <div className="space-y-3 text-left">
            <div>
              <label className="block text-sm font-medium text-theme-dark/90 mb-1">
                What do you notice about how King uses {strategyLabel}?
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
                placeholder={`This quote uses ${strategyLabel.toLowerCase()} because…`}
              />
              <p className="text-xs text-theme-dark/70 mt-1">
                Sentence starter: &ldquo;This quote uses {strategyLabel.toLowerCase()}{" "}
                because King…&rdquo;
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
              <p className="text-xs text-theme-dark/60 mt-1">
                Hint: {audienceHintForType(currentPassage.sourceType)}
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
              <p className="text-xs text-theme-dark/60 mt-1">
                Hint: {purposeHintForType(currentPassage.sourceType)}
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
