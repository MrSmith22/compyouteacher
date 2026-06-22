"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Panel from "@/components/ui/Panel";
import { mlkAssignmentDefinition } from "@/lib/assignments";

const ASSIGNMENT = mlkAssignmentDefinition;
const PASSAGES = ASSIGNMENT?.guidedPassages ?? [];
const TOTAL = PASSAGES.length;
const CONFIG_OK = Boolean(ASSIGNMENT?.assignmentId && TOTAL > 0);
const REQUIRED_SOURCE_IDS = new Set(PASSAGES.map((p) => p.id));

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

function fieldsHaveContent(fields) {
  return (
    fields.studentObservation.trim().length > 0 ||
    fields.audienceEffect.trim().length > 0 ||
    fields.purposeConnection.trim().length > 0 ||
    fields.essentialQuestionConnection.trim().length > 0
  );
}

function fieldsMatch(a, b) {
  return (
    a.studentObservation.trim() === b.studentObservation.trim() &&
    a.audienceEffect.trim() === b.audienceEffect.trim() &&
    a.purposeConnection.trim() === b.purposeConnection.trim() &&
    a.essentialQuestionConnection.trim() === b.essentialQuestionConnection.trim()
  );
}

function buildSavedLookup(rows) {
  const lookup = {};
  for (const row of rows || []) {
    if (!row?.source_id || !REQUIRED_SOURCE_IDS.has(row.source_id)) continue;
    lookup[row.source_id] = row;
  }
  return lookup;
}

function allRequiredSaved(savedBySourceId) {
  return PASSAGES.every((p) => Boolean(savedBySourceId[p.id]));
}

function observationPreview(row) {
  const text = row?.student_observation?.trim();
  if (!text) return "";
  return text.length > 120 ? `${text.slice(0, 120)}…` : text;
}

function ReviewPanel({ savedBySourceId, onGoToPassage, title }) {
  const missingCount = PASSAGES.filter((p) => !savedBySourceId[p.id]).length;

  return (
    <Panel className="space-y-4">
      <div className="text-left">
        <h2 className="text-lg font-bold text-theme-dark">{title}</h2>
        <p className="text-sm text-theme-dark/80 mt-1">
          {missingCount === 0
            ? "All six guided observations are saved."
            : `${missingCount} observation${missingCount === 1 ? "" : "s"} still need to be saved.`}
        </p>
      </div>
      <ul className="space-y-3 text-left">
        {PASSAGES.map((p, i) => {
          const saved = savedBySourceId[p.id];
          const isSaved = Boolean(saved);
          return (
            <li
              key={p.id}
              className={`rounded-lg border p-3 ${
                isSaved
                  ? "border-theme-green/40 bg-theme-green/5"
                  : "border-theme-red/30 bg-theme-red/5"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium text-theme-dark">
                    {STRATEGY_LABELS[p.strategy]} ({SOURCE_TYPE_LABELS[p.sourceType]})
                  </p>
                  <p className="text-sm text-theme-dark/80">
                    {sourceTitleForType(p.sourceType)}
                  </p>
                </div>
                <span
                  className={`text-xs font-semibold uppercase tracking-wide px-2 py-1 rounded ${
                    isSaved
                      ? "bg-theme-green/20 text-theme-dark"
                      : "bg-theme-red/20 text-theme-dark"
                  }`}
                >
                  {isSaved ? "Saved" : "Missing"}
                </span>
              </div>
              {isSaved && observationPreview(saved) && (
                <p className="text-sm text-theme-dark/80 mt-2 italic">
                  &ldquo;{observationPreview(saved)}&rdquo;
                </p>
              )}
              {!isSaved && (
                <button
                  type="button"
                  onClick={() => onGoToPassage(i)}
                  className="mt-2 text-sm bg-theme-blue text-white px-3 py-1.5 rounded font-medium hover:opacity-90"
                >
                  Go to this observation
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </Panel>
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
  const [savedBySourceId, setSavedBySourceId] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [toast, setToast] = useState("");

  const currentPassage = PASSAGES[currentIndex];
  const savedFieldsForCurrent = fieldsFromObservation(
    savedBySourceId[currentPassage?.id]
  );
  const currentFields =
    fieldsByPassageId[currentPassage?.id] ?? savedFieldsForCurrent;
  const strategyLabel = STRATEGY_LABELS[currentPassage?.strategy] ?? "";
  const strategyScaffolding = getStrategyScaffolding(currentPassage?.strategy);
  const sourceTitle = currentPassage
    ? sourceTitleForType(currentPassage.sourceType)
    : "";

  const allPassagesSaved = useMemo(
    () => allRequiredSaved(savedBySourceId),
    [savedBySourceId]
  );

  const currentPassageIsDirty = useMemo(() => {
    if (!currentPassage) return false;
    const saved = savedBySourceId[currentPassage.id];
    if (!saved) return fieldsHaveContent(currentFields);
    return !fieldsMatch(currentFields, fieldsFromObservation(saved));
  }, [currentPassage, currentFields, savedBySourceId]);

  const loadPassageFields = useCallback(
    (passageId) => {
      setFieldsByPassageId((prev) => ({
        ...prev,
        [passageId]: fieldsFromObservation(savedBySourceId[passageId]),
      }));
    },
    [savedBySourceId]
  );

  useEffect(() => {
    if (status === "loading") return;

    if (!email) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const res = await fetch("/api/module2/observations/guided");
        const json = await res.json();

        if (cancelled) return;

        if (!res.ok || !json.ok) {
          const message = json?.error || "Could not load saved observations";
          console.error("[guided-observations] API error:", message);
          setLoadError(message);
          return;
        }

        const lookup = buildSavedLookup(json.data);
        const nextFields = {};
        for (const passage of PASSAGES) {
          if (lookup[passage.id]) {
            nextFields[passage.id] = fieldsFromObservation(lookup[passage.id]);
          }
        }

        setSavedBySourceId(lookup);
        setFieldsByPassageId(nextFields);

        const firstIncomplete = PASSAGES.findIndex((p) => !lookup[p.id]);
        setCurrentIndex(firstIncomplete === -1 ? TOTAL - 1 : firstIncomplete);
      } catch (err) {
        if (!cancelled) {
          console.error("[guided-observations] fetch error:", err);
          setLoadError(`Network error: ${String(err)}`);
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
    setSaveError(null);
    setFieldsByPassageId((prev) => ({
      ...prev,
      [passageId]: {
        ...(prev[passageId] ??
          fieldsFromObservation(savedBySourceId[passageId])),
        [key]: value,
      },
    }));
  }, [savedBySourceId]);

  const goToPassage = useCallback(
    (index) => {
      if (index < 0 || index >= TOTAL) return;
      const targetPassage = PASSAGES[index];
      setFieldsByPassageId((prev) => ({
        ...prev,
        [targetPassage.id]: fieldsFromObservation(savedBySourceId[targetPassage.id]),
      }));
      setCurrentIndex(index);
      setSaveError(null);
    },
    [savedBySourceId]
  );

  const attemptPassageSwitch = useCallback(
    (index) => {
      if (index === currentIndex) return;

      if (currentPassageIsDirty) {
        const discard = window.confirm(
          "You have unsaved changes on this observation. Switch passages anyway? Your unsaved work will be lost."
        );
        if (!discard) return;
        if (currentPassage) {
          loadPassageFields(currentPassage.id);
        }
      }

      goToPassage(index);
    },
    [currentIndex, currentPassage, currentPassageIsDirty, goToPassage, loadPassageFields]
  );

  const saveCurrentPassage = async () => {
    if (!currentPassage || !allFieldsFilled(currentFields)) return;

    setSaving(true);
    setSaveError(null);
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
        const message = json?.error || "Save failed";
        setSaveError(message);
        setToast(message);
        setTimeout(() => setToast(""), 3000);
        return null;
      }

      const savedRow = json.data;
      const savedFields = fieldsFromObservation(savedRow);

      setSavedBySourceId((prev) => ({
        ...prev,
        [currentPassage.id]: savedRow,
      }));
      setFieldsByPassageId((prev) => ({
        ...prev,
        [currentPassage.id]: savedFields,
      }));
      setToast("Saved");
      setTimeout(() => setToast(""), 1200);

      return savedRow;
    } catch (err) {
      console.error("[guided-observations] save error:", err);
      const message = `Network error: ${String(err)}`;
      setSaveError(message);
      setToast(message);
      setTimeout(() => setToast(""), 3000);
      return null;
    } finally {
      setSaving(false);
    }
  };

  const saveAndContinue = async () => {
    const savedRow = await saveCurrentPassage();
    if (!savedRow || !currentPassage) return;

    const nextLookup = {
      ...savedBySourceId,
      [currentPassage.id]: savedRow,
    };

    if (allRequiredSaved(nextLookup)) {
      return;
    }

    if (currentIndex < TOTAL - 1) {
      goToPassage(currentIndex + 1);
    }
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

  if (allPassagesSaved) {
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
              You saved all six guided observations. These will help you build
              your thesis and essay.
            </p>
          </Panel>

          <ReviewPanel
            savedBySourceId={savedBySourceId}
            onGoToPassage={goToPassage}
            title="Review your observations"
          />

          <Panel>
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
          {PASSAGES.map((p, i) => {
            const isSaved = Boolean(savedBySourceId[p.id]);
            const isCurrent = currentIndex === i;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => attemptPassageSwitch(i)}
                title={
                  isSaved
                    ? "Saved to your account"
                    : "Not saved yet — complete and save this observation"
                }
                className={`text-sm px-2 py-1 rounded border ${
                  isCurrent
                    ? "bg-theme-blue text-white border-theme-blue"
                    : isSaved
                      ? "bg-theme-green/20 text-theme-dark/90 border-theme-green/40 hover:bg-theme-green/30"
                      : "bg-theme-dark/10 text-theme-dark/80 border-transparent hover:bg-theme-dark/20"
                }`}
              >
                {i + 1}. {STRATEGY_LABELS[p.strategy]} ({SOURCE_TYPE_LABELS[p.sourceType]})
                {isSaved ? " ✓" : ""}
              </button>
            );
          })}
        </div>

        {currentPassageIsDirty && (
          <p className="text-sm text-theme-dark/90 text-left bg-theme-dark/5 border border-theme-dark/10 rounded-lg px-3 py-2">
            You have unsaved changes on this observation. Save before leaving, or
            you will be asked to confirm if you switch passages.
          </p>
        )}

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
            <span
              className={`px-2 py-1 rounded ${
                savedBySourceId[currentPassage.id]
                  ? "bg-theme-green/20"
                  : "bg-theme-dark/10"
              }`}
            >
              {savedBySourceId[currentPassage.id] ? "Saved" : "Not saved yet"}
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
              Complete all four fields above to save this observation.
            </p>
          )}
          {saveError && (
            <p className="text-left text-sm text-theme-red border border-theme-red/30 bg-theme-red/5 rounded-lg px-3 py-2">
              {saveError}
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={saveAndContinue}
              disabled={!allFieldsFilled(currentFields) || saving}
              className="bg-theme-green text-white px-4 py-2 rounded-lg font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving
                ? "Saving…"
                : currentIndex === TOTAL - 1
                  ? "Save and Finish Guided Observations"
                  : "Save & Continue"}
            </button>
          </div>
        </Panel>

        <ReviewPanel
          savedBySourceId={savedBySourceId}
          onGoToPassage={attemptPassageSwitch}
          title="Progress check"
        />

        {toast && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-theme-dark text-white text-sm px-3 py-2 rounded shadow">
            {toast}
          </div>
        )}
      </div>
    </div>
  );
}
