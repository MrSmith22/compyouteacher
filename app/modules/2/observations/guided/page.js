"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Panel from "@/components/ui/Panel";
import {
  ReferenceSection,
  WorkingSetSection,
} from "@/components/module3/ModuleThreeDeskFrame";
import ModuleTwoNotebook from "@/components/module2/ModuleTwoNotebook";
import { mlkAssignmentDefinition } from "@/lib/assignments";

const ASSIGNMENT = mlkAssignmentDefinition;
const PASSAGES = ASSIGNMENT?.observationSchema?.guidedPassages ?? [];
const TOTAL = PASSAGES.length;
const CONFIG_OK = Boolean(ASSIGNMENT?.identity?.assignmentId && TOTAL > 0);
const REQUIRED_SOURCE_IDS = new Set(PASSAGES.map((p) => p.id));

const OBSERVATION_FIELD_ORDER = [
  "studentObservation",
  "audienceEffect",
  "purposeConnection",
  "essentialQuestionConnection",
];

const SOURCE_TYPE_LABELS = {
  speech: ASSIGNMENT.sources.speech.label,
  letter: ASSIGNMENT.sources.letter.label,
};

function sourceLabelForId(sourceId) {
  return SOURCE_TYPE_LABELS[sourceId] ?? "";
}

function sourceTitleForId(sourceId) {
  return ASSIGNMENT.sources[sourceId]?.title ?? "";
}

function audienceHintForSourceId(sourceId) {
  return ASSIGNMENT.sources[sourceId]?.audience ?? "";
}

function purposeHintForSourceId(sourceId) {
  return ASSIGNMENT.sources[sourceId]?.purpose ?? "";
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
        <h2 className="text-base font-semibold text-theme-dark">{title}</h2>
        <p className="text-sm text-theme-dark/70 mt-1">
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
              className="rounded-lg border border-theme-dark/10 bg-white p-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium text-theme-dark">
                    {p.rhetoricalStrategyLabel} ({sourceLabelForId(p.sourceId)})
                  </p>
                  <p className="text-sm text-theme-dark/70">
                    {sourceTitleForId(p.sourceId)}
                  </p>
                </div>
                <span
                  className={[
                    "text-[11px] font-medium uppercase tracking-[0.16em] px-2 py-1 rounded",
                    isSaved
                      ? "bg-theme-green/15 text-theme-dark"
                      : "bg-theme-dark/5 text-theme-dark/70",
                  ].join(" ")}
                >
                  {isSaved ? "Done" : "Not yet"}
                </span>
              </div>
              {isSaved && observationPreview(saved) && (
                <p className="text-sm text-theme-dark/70 mt-2 italic">
                  &ldquo;{observationPreview(saved)}&rdquo;
                </p>
              )}
              {!isSaved && (
                <button
                  type="button"
                  onClick={() => onGoToPassage(i)}
                  className="mt-2 text-sm bg-theme-blue text-white px-3 py-1.5 rounded-lg font-medium hover:opacity-90"
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
  const strategyLabel = currentPassage?.rhetoricalStrategyLabel ?? "";
  const strategyReminder = currentPassage?.strategyReminder ?? null;
  const sourceTitle = currentPassage
    ? sourceTitleForId(currentPassage.sourceId)
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
          source_title: sourceTitleForId(currentPassage.sourceId),
          source_type: currentPassage.sourceId,
          quote: currentPassage.quotedPassage,
          rhetorical_strategy: currentPassage.rhetoricalStrategy,
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
      setToast("Saved to your evidence library.");
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
          <Panel className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-theme-dark/70">
              Guided observations
            </p>
            <h1 className="text-2xl font-extrabold text-theme-dark text-left">
              You’ve saved all {TOTAL} observations.
            </h1>
            <p className="text-left text-theme-dark/80">
              Success looks like this: you have one saved observation for each
              guided passage.
            </p>
          </Panel>

          <ReferenceSection
            label="Assignment question (reference)"
            description="Keep this nearby, but you don’t need to rewrite it in every box."
          >
            <Panel className="border border-theme-dark/10 bg-white">
              <p className="text-left text-theme-dark font-medium">
                {ASSIGNMENT.essentialQuestion}
              </p>
            </Panel>
          </ReferenceSection>

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
        <div
          className="rounded-xl border-2 border-theme-orange/40 bg-theme-orange/10 px-4 py-3 text-sm text-theme-dark"
          role="status"
          data-testid="legacy-guided-route-banner"
        >
          <p className="font-semibold text-theme-orange">
            Legacy guided observations
          </p>
          <p className="mt-1">
            Guided observations remain readable evidence for older work. The
            primary Module 2 evidence path is T-charts. Saved guided rows are
            not deleted.
          </p>
          <a
            href="/modules/2/tcharts"
            className="mt-2 inline-block font-semibold text-theme-blue underline"
          >
            Go to the primary evidence path (T-charts)
          </a>
        </div>
        <div className="space-y-2 text-left">
          <p className="text-xs font-semibold uppercase tracking-wide text-theme-dark/70">
            Guided observation {currentIndex + 1} of {TOTAL}
          </p>
          <h1 className="text-2xl font-extrabold text-theme-dark leading-snug">
            {currentPassage.observationQuestion}
          </h1>
          <p className="text-sm text-theme-dark/70">
            Read the passage first. Then we’ll put your thinking into words—one
            small step at a time.
          </p>
        </div>

        <WorkingSetSection
          label={`Passage ${currentIndex + 1} • ${strategyLabel}`}
          description="Start by reading. Then write in your own words."
        >
          <div className="space-y-5">
            <div className="rounded-2xl border border-theme-dark/12 bg-white px-6 py-6 shadow-soft ring-1 ring-theme-dark/[0.03] md:px-8 md:py-7">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-theme-dark/50">
                Read this passage
              </p>
              <blockquote className="mt-4 text-left text-theme-dark">
                <p className="text-[17px] leading-[1.85] md:text-[18px] md:leading-[1.9]">
                  &ldquo;{currentPassage.quotedPassage}&rdquo;
                </p>
              </blockquote>
              <p className="mt-5 text-xs text-theme-dark/55">
                From: {sourceTitle} ({sourceLabelForId(currentPassage.sourceId)})
              </p>
            </div>

            {strategyReminder ? (
              <div className="rounded-lg border border-theme-dark/10 bg-white p-4 space-y-2 text-left">
                <p className="text-xs font-semibold uppercase tracking-wide text-theme-dark/60">
                  A quick reminder: {strategyReminder.title}
                </p>
                <p className="text-sm text-theme-dark/85">
                  {strategyReminder.definition}
                </p>
                <p className="text-sm text-theme-dark/85">
                  {strategyReminder.lookFor}
                </p>
                <p className="text-sm font-medium text-theme-dark">
                  Ask yourself: {strategyReminder.keyQuestion}
                </p>
              </div>
            ) : null}

            <div className="space-y-5 text-left">
              {OBSERVATION_FIELD_ORDER.map((fieldKey, index) => {
                const fieldDefinition = currentPassage.fields[fieldKey];
                const stepNumber = index + 1;

                const teacherIntro = (() => {
                  if (fieldKey === "studentObservation") {
                    return {
                      lead: "First…",
                      why: "Tell me what you notice the author doing here.",
                      reassurance: "There isn’t one perfect answer—just explain what you notice.",
                      whatGoodLooksLike:
                        "Good answers point to a specific move (word choice, repetition, contrast, tone, etc.).",
                    };
                  }
                  if (fieldKey === "audienceEffect") {
                    return {
                      lead: "Next…",
                      why: "Now tell me how that move could affect the audience.",
                      reassurance: "Use your own words. Your explanation matters more than fancy vocabulary.",
                      whatGoodLooksLike:
                        "Good answers explain a clear cause → effect (what the author does → what it makes the audience think/feel).",
                    };
                  }
                  if (fieldKey === "purposeConnection") {
                    return {
                      lead: "Now…",
                      why: "Connect what you noticed to the author’s bigger purpose.",
                      reassurance: "It’s okay to be simple. Just make the connection as clearly as you can.",
                      whatGoodLooksLike:
                        "Good answers explain how this moment helps the author reach their goal.",
                    };
                  }
                  return {
                    lead: "Finally…",
                    why: "Tie it back to the assignment’s essential question.",
                    reassurance: "If you’re unsure, take your best honest guess and explain why.",
                    whatGoodLooksLike:
                      "Good answers explain how this passage helps you answer the big question for the assignment.",
                  };
                })();

                return (
                  <div key={fieldKey} className="space-y-2">
                    <p className="text-sm font-semibold text-theme-dark">
                      {teacherIntro.lead}{" "}
                      <span className="font-normal text-theme-dark/80">
                        {teacherIntro.why}
                      </span>
                    </p>
                    <p className="text-sm text-theme-dark/70">
                      {teacherIntro.reassurance}
                    </p>
                    <label className="block text-sm font-semibold text-theme-dark/90">
                      {fieldDefinition.label}
                    </label>
                    <textarea
                      className="w-full min-h-[88px] border border-theme-dark/12 rounded-lg px-3 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-theme-blue/30"
                      value={currentFields[fieldKey]}
                      onChange={(e) =>
                        updateField(currentPassage.id, fieldKey, e.target.value)
                      }
                      placeholder={fieldDefinition.placeholder}
                    />
                    <div className="space-y-1">
                      <p className="text-xs text-theme-dark/65">
                        Try starting like this: &ldquo;{fieldDefinition.sentenceStarter}
                        &rdquo;
                      </p>
                      <p className="text-xs text-theme-dark/55">
                        What good answers usually do: {teacherIntro.whatGoodLooksLike}
                      </p>
                      {fieldDefinition.coachingText ? (
                        <p className="text-xs text-theme-dark/50">
                          {fieldDefinition.coachingText}
                        </p>
                      ) : null}
                      {fieldKey === "audienceEffect" ? (
                        <p className="text-xs text-theme-dark/50">
                          Audience:{" "}
                          {audienceHintForSourceId(currentPassage.sourceId)}
                        </p>
                      ) : null}
                      {fieldKey === "purposeConnection" ? (
                        <p className="text-xs text-theme-dark/50">
                          Purpose:{" "}
                          {purposeHintForSourceId(currentPassage.sourceId)}
                        </p>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="rounded-lg border border-theme-dark/10 bg-white p-4 space-y-3">
              {currentPassageIsDirty ? (
                <p className="text-sm text-theme-dark/80 text-left bg-theme-dark/5 border border-theme-dark/10 rounded-lg px-3 py-2">
                  You have unsaved changes on this observation.
                </p>
              ) : null}

              {!allFieldsFilled(currentFields) ? (
                <p className="text-left text-sm text-theme-dark/70">
                  Finished means:
                  <span className="block mt-2 text-theme-dark/70">
                    • I named the strategy/move I see in the passage.<br />
                    • I explained what the author is doing.<br />
                    • I explained how it could affect the audience.<br />
                    • I connected it back to the essential question.
                  </span>
                </p>
              ) : (
                <p className="text-left text-sm text-theme-dark/80">
                  Nice work. Your observation is ready to add to your evidence
                  library.
                </p>
              )}

              {saveError ? (
                <p className="text-left text-sm text-theme-red border border-theme-red/30 bg-theme-red/5 rounded-lg px-3 py-2">
                  {saveError}
                </p>
              ) : null}

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
            </div>
          </div>
        </WorkingSetSection>

        <ReferenceSection
          label="Shelf"
          description="Glance here when you need it, then come back to the passage."
        >
          <div className="space-y-4">
            <ModuleTwoNotebook
              guided={{
                savedBySourceId,
                passageMetaById: PASSAGES.reduce((acc, p) => {
                  acc[p.id] = p;
                  return acc;
                }, {}),
              }}
            />

            <details className="rounded-lg border border-theme-dark/10 bg-white px-4 py-3">
              <summary className="cursor-pointer select-none text-sm font-medium text-theme-dark/80">
                Switch passages
              </summary>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-left">
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
                          ? "Done"
                          : "Not yet — write your observation and save"
                      }
                      className={[
                        "text-sm px-2.5 py-1.5 rounded-lg border transition-colors",
                        isCurrent
                          ? "bg-theme-blue text-white border-theme-blue"
                          : "bg-white text-theme-dark/80 border-theme-dark/10 hover:bg-theme-dark/5",
                      ].join(" ")}
                    >
                      {i + 1}
                      {isSaved ? <span className="ml-1">✓</span> : null}
                    </button>
                  );
                })}
              </div>
            </details>

            <details className="rounded-lg border border-theme-dark/10 bg-white px-4 py-3">
              <summary className="cursor-pointer select-none text-sm font-medium text-theme-dark/80">
                Essential question
              </summary>
              <p className="mt-3 text-left text-theme-dark/80 font-medium">
                {ASSIGNMENT.essentialQuestion}
              </p>
            </details>

            <details className="rounded-lg border border-theme-dark/10 bg-white px-4 py-3">
              <summary className="cursor-pointer select-none text-sm font-medium text-theme-dark/80">
                Progress
              </summary>
              <div className="mt-3">
                <ReviewPanel
                  savedBySourceId={savedBySourceId}
                  onGoToPassage={attemptPassageSwitch}
                  title="Your saved observations"
                />
              </div>
            </details>
          </div>
        </ReferenceSection>

        {toast && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-theme-dark text-white text-sm px-3 py-2 rounded shadow">
            {toast}
          </div>
        )}
      </div>
    </div>
  );
}
