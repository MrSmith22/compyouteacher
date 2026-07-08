"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Panel from "@/components/ui/Panel";
import {
  ReferenceSection,
  WorkingSetSection,
} from "@/components/module3/ModuleThreeDeskFrame";
import ModuleTwoNotebook from "@/components/module2/ModuleTwoNotebook";
import { mlkAssignmentDefinition } from "@/lib/assignments";
import { parseModule2Observation } from "@/lib/parseModule2Observation";
import { getTChartEntries } from "@/lib/supabase/helpers/tchartEntries";
import { makeStudentKey } from "@/lib/storage/studentCache";

const APPEALS = ["ethos", "pathos", "logos"];
const MODULE2_SOURCES = mlkAssignmentDefinition.sources;
const FALLBACK_SPEECH_URL = MODULE2_SOURCES.speech.analysisFallbackUrl;
const FALLBACK_LETTER_URL = MODULE2_SOURCES.letter.analysisFallbackUrl;

const OBSERVATION_SEP = "\n---AUDIENCE---\n";
const OBSERVATION_SEP2 = "\n---PURPOSE---\n";

function buildObservation(why, audience, purpose) {
  return [why || "", OBSERVATION_SEP, audience || "", OBSERVATION_SEP2, purpose || ""].join("");
}

const emptyAppeal = () => ({
  speechQuote: "",
  speechWhy: "",
  speechAudience: "",
  speechPurpose: "",
  letterQuote: "",
  letterWhy: "",
  letterAudience: "",
  letterPurpose: "",
});

function formDataFromTchartRows(rows) {
  const next = {
    ethos: emptyAppeal(),
    pathos: emptyAppeal(),
    logos: emptyAppeal(),
  };

  for (const row of rows || []) {
    const appeal = row?.category;
    if (!APPEALS.includes(appeal)) continue;

    const parsed = parseModule2Observation(row?.observation);
    if (row.type === "speech") {
      next[appeal].speechQuote = row.quote || "";
      next[appeal].speechWhy = parsed.main || "";
      next[appeal].speechAudience = parsed.audience || "";
      next[appeal].speechPurpose = parsed.purpose || "";
    } else if (row.type === "letter") {
      next[appeal].letterQuote = row.quote || "";
      next[appeal].letterWhy = parsed.main || "";
      next[appeal].letterAudience = parsed.audience || "";
      next[appeal].letterPurpose = parsed.purpose || "";
    }
  }

  return next;
}

function formDataFromLocalStorage(email) {
  const next = { ethos: emptyAppeal(), pathos: emptyAppeal(), logos: emptyAppeal() };
  APPEALS.forEach((appeal) => {
    const get = (suffix) =>
      localStorage.getItem(makeStudentKey(email, ["mlk", "module2", "tcharts", appeal + suffix])) ||
      "";
    next[appeal].speechQuote = get("SpeechQuote");
    next[appeal].speechWhy = get("SpeechWhy") || get("SpeechNote");
    next[appeal].speechAudience = get("SpeechAudience");
    next[appeal].speechPurpose = get("SpeechPurpose");
    next[appeal].letterQuote = get("LetterQuote");
    next[appeal].letterWhy = get("LetterWhy") || get("LetterNote");
    next[appeal].letterAudience = get("LetterAudience");
    next[appeal].letterPurpose = get("LetterPurpose");
  });
  return next;
}

export default function ModuleTwoTCharts() {
  const router = useRouter();
  const { data: session } = useSession();
  const email = session?.user?.email ?? null;

  const [activeAppeal, setActiveAppeal] = useState("ethos");
  const [activeTextType, setActiveTextType] = useState("speech"); // "speech" | "letter" (presentation only)
  const [sources, setSources] = useState({ speechUrl: "", letterUrl: "" });
  const [formData, setFormData] = useState({
    ethos: emptyAppeal(),
    pathos: emptyAppeal(),
    logos: emptyAppeal(),
  });
  const [toast, setToast] = useState("");
  const [saving, setSaving] = useState(false);

  // Load saved sources from API (for original URLs)
  useEffect(() => {
    if (!email) return;
    let cancelled = false;
    fetch("/api/module2/sources")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        setSources({
          speechUrl: data.speech_source_url || data.mlk_url || FALLBACK_SPEECH_URL,
          letterUrl: data.letter_source_url || data.lfbj_url || FALLBACK_LETTER_URL,
        });
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [email]);

  // Load persisted analysis: Supabase first, then localStorage fallback
  useEffect(() => {
    if (!email) return;

    let cancelled = false;

    (async () => {
      try {
        const { data: rows, error } = await getTChartEntries({ userEmail: email });
        if (cancelled) return;

        if (!error && Array.isArray(rows) && rows.length > 0) {
          setFormData(formDataFromTchartRows(rows));
          return;
        }
      } catch (_) {
        if (cancelled) return;
      }

      try {
        setFormData(formDataFromLocalStorage(email));
      } catch (_) {}
    })();

    return () => {
      cancelled = true;
    };
  }, [email]);

  const updateAppeal = useCallback((appeal, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [appeal]: { ...prev[appeal], [field]: value },
    }));
  }, []);

  const currentFields = formData[activeAppeal];
  const appealIndex = APPEALS.indexOf(activeAppeal);
  const isLastAppeal = appealIndex === APPEALS.length - 1;
  const nextAppeal = isLastAppeal ? null : APPEALS[appealIndex + 1];

  const speechFilledForCurrent = [
    currentFields.speechQuote,
    currentFields.speechWhy,
    currentFields.speechAudience,
    currentFields.speechPurpose,
  ].every((v) => typeof v === "string" && v.trim() !== "");

  const letterFilledForCurrent = [
    currentFields.letterQuote,
    currentFields.letterWhy,
    currentFields.letterAudience,
    currentFields.letterPurpose,
  ].every((v) => typeof v === "string" && v.trim() !== "");

  const allFilledForCurrent = [
    currentFields.speechQuote,
    currentFields.speechWhy,
    currentFields.speechAudience,
    currentFields.speechPurpose,
    currentFields.letterQuote,
    currentFields.letterWhy,
    currentFields.letterAudience,
    currentFields.letterPurpose,
  ].every((v) => typeof v === "string" && v.trim() !== "");

  const saveLocalOnly = useCallback(() => {
    if (!email) return;
    try {
      APPEALS.forEach((appeal) => {
        const d = formData[appeal];
        const set = (suffix, val) => localStorage.setItem(makeStudentKey(email, ["mlk", "module2", "tcharts", appeal + suffix]), val ?? "");
        set("SpeechQuote", d.speechQuote);
        set("SpeechWhy", d.speechWhy);
        set("SpeechAudience", d.speechAudience);
        set("SpeechPurpose", d.speechPurpose);
        set("LetterQuote", d.letterQuote);
        set("LetterWhy", d.letterWhy);
        set("LetterAudience", d.letterAudience);
        set("LetterPurpose", d.letterPurpose);
      });
      setToast("Saved a draft on this device.");
      setTimeout(() => setToast(""), 1200);
    } catch (_) {
      setToast("Local save failed");
      setTimeout(() => setToast(""), 1500);
    }
  }, [email, formData]);

  const buildEntries = useCallback(() => {
    const row = (category, type, quote, observation, letterUrl) => ({
      category,
      type,
      quote: quote || "",
      observation: observation || "",
      letter_url: letterUrl || null,
    });
    const letterUrl = sources.letterUrl || null;
    return [
      row("ethos", "speech", formData.ethos.speechQuote, buildObservation(formData.ethos.speechWhy, formData.ethos.speechAudience, formData.ethos.speechPurpose), letterUrl),
      row("ethos", "letter", formData.ethos.letterQuote, buildObservation(formData.ethos.letterWhy, formData.ethos.letterAudience, formData.ethos.letterPurpose), letterUrl),
      row("pathos", "speech", formData.pathos.speechQuote, buildObservation(formData.pathos.speechWhy, formData.pathos.speechAudience, formData.pathos.speechPurpose), letterUrl),
      row("pathos", "letter", formData.pathos.letterQuote, buildObservation(formData.pathos.letterWhy, formData.pathos.letterAudience, formData.pathos.letterPurpose), letterUrl),
      row("logos", "speech", formData.logos.speechQuote, buildObservation(formData.logos.speechWhy, formData.logos.speechAudience, formData.logos.speechPurpose), letterUrl),
      row("logos", "letter", formData.logos.letterQuote, buildObservation(formData.logos.letterWhy, formData.logos.letterAudience, formData.logos.letterPurpose), letterUrl),
    ];
  }, [formData, sources.letterUrl]);

  const saveAndContinue = async () => {
    if (!allFilledForCurrent) return;
    setSaving(true);
    saveLocalOnly();
    try {
      const res = await fetch("/api/tchart/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries: buildEntries() }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setToast(data?.error || `Save failed`);
        setTimeout(() => setToast(""), 2000);
        setSaving(false);
        return;
      }
      setToast("Saved to your evidence library.");
      setTimeout(() => setToast(""), 1200);
      if (isLastAppeal) {
        setTimeout(() => router.push("/modules/2/success"), 500);
        return;
      }
      setActiveAppeal(nextAppeal);
      setActiveTextType("speech");
    } catch (err) {
      setToast(`Network error: ${String(err)}`);
      setTimeout(() => setToast(""), 2000);
    }
    setSaving(false);
  };

  const openInNewTab = (url) => {
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const appealLabels = { ethos: "Ethos", pathos: "Pathos", logos: "Logos" };
  const introCopy = {
    ethos:
      "Ethos is about credibility and trust. Look for moments where Dr. King presents himself as moral, responsible, experienced, or worth listening to.",
    pathos:
      "Pathos is about emotion. Look for words or images that stir feelings such as hope, anger, guilt, pride, fear, or compassion.",
    logos:
      "Logos is about logic and reasoning. Look for facts, clear claims, cause-and-effect reasoning, or examples that support King's argument.",
  };

  const guidingQuestionByAppeal = {
    ethos: "What makes this quote an example of ethos?",
    pathos: "What feeling is this quote trying to stir?",
    logos: "What makes this quote an example of logos?",
  };

  const activeLabel = appealLabels[activeAppeal];
  const activeSourceTitle =
    activeTextType === "speech"
      ? MODULE2_SOURCES.speech.title
      : MODULE2_SOURCES.letter.title;

  const quoteField = activeTextType === "speech" ? "speechQuote" : "letterQuote";
  const whyField = activeTextType === "speech" ? "speechWhy" : "letterWhy";
  const audienceField =
    activeTextType === "speech" ? "speechAudience" : "letterAudience";
  const purposeField =
    activeTextType === "speech" ? "speechPurpose" : "letterPurpose";

  return (
    <div className="min-h-screen bg-theme-light text-theme-dark p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="space-y-2 text-left">
          <p className="text-xs font-semibold uppercase tracking-wide text-theme-dark/60">
            Today’s question
          </p>
          <h1 className="text-2xl font-extrabold text-theme-dark leading-snug">
            {guidingQuestionByAppeal[activeAppeal]}
          </h1>
          <p className="text-sm text-theme-dark/70">
            We’ll study one quote at a time. Keep it short and accurate.
          </p>
        </div>

        <WorkingSetSection
          label={`${activeLabel} • ${activeTextType === "speech" ? "Speech" : "Letter"}`}
          description="Read your quote first. Then explain what you notice in simple words."
        >
          <div className="space-y-5">
            <div className="rounded-2xl border border-theme-dark/12 bg-white px-6 py-6 shadow-soft ring-1 ring-theme-dark/[0.03] md:px-8 md:py-7">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-theme-dark/50">
                The quote you’re studying
              </p>
              <p className="mt-2 text-xs text-theme-dark/55">
                From: {activeSourceTitle}
              </p>
              <textarea
                className="mt-4 w-full min-h-[140px] rounded-xl border border-theme-dark/12 bg-white px-4 py-4 text-[15px] leading-[1.8] text-theme-dark focus:outline-none focus:ring-2 focus:ring-theme-blue/30"
                value={currentFields[quoteField]}
                onChange={(e) => updateAppeal(activeAppeal, quoteField, e.target.value)}
                placeholder={`Paste one short quote from the ${activeTextType}.`}
              />
              <p className="mt-3 text-sm text-theme-dark/70">
                You don’t need a perfect quote. Choose one that clearly fits{" "}
                <span className="font-semibold text-theme-dark">{activeLabel}</span>.
              </p>
            </div>

            <div className="space-y-5 text-left">
              {[
                {
                  lead: "First…",
                  field: whyField,
                  label: `What makes this quote ${activeLabel}?`,
                  reassurance: "There isn’t one perfect answer—just explain what you notice.",
                  good: "Good answers point to specific words or details in the quote.",
                  placeholder: "Explain why this quote fits this appeal.",
                },
                {
                  lead: "Next…",
                  field: audienceField,
                  label: "How might this affect the audience?",
                  reassurance:
                    "Use your own words. Your explanation matters more than fancy vocabulary.",
                  good:
                    "Good answers explain a cause → effect (what King does → what it makes people think/feel).",
                  placeholder: "Describe a possible audience reaction.",
                },
                {
                  lead: "Finally…",
                  field: purposeField,
                  label: "How does this help King’s purpose?",
                  reassurance:
                    "It’s okay to be simple. Just make the connection as clearly as you can.",
                  good:
                    "Good answers connect the quote to the bigger goal of the text.",
                  placeholder: "Connect the quote to King’s purpose.",
                },
              ].map((step) => (
                <div key={step.field} className="space-y-2">
                  <p className="text-sm font-semibold text-theme-dark">
                    {step.lead}{" "}
                    <span className="font-normal text-theme-dark/80">
                      {step.label}
                    </span>
                  </p>
                  <p className="text-sm text-theme-dark/70">{step.reassurance}</p>
                  <textarea
                    className="w-full min-h-[96px] rounded-lg border border-theme-dark/12 bg-white px-3 py-3 text-sm text-theme-dark focus:outline-none focus:ring-2 focus:ring-theme-blue/30"
                    value={currentFields[step.field]}
                    onChange={(e) => updateAppeal(activeAppeal, step.field, e.target.value)}
                    placeholder={step.placeholder}
                  />
                  <p className="text-xs text-theme-dark/55">
                    What good answers usually do: {step.good}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </WorkingSetSection>

        <ReferenceSection
          label="Shelf"
          description="Glance here when you need it, then come back to your quote."
        >
          <div className="space-y-4">
            <ModuleTwoNotebook
              sources={sources}
              sourceTitles={{
                speechTitle: MODULE2_SOURCES.speech.title,
                letterTitle: MODULE2_SOURCES.letter.title,
              }}
              tcharts={{
                formData,
                appealLabels,
              }}
            />

            <details className="rounded-lg border border-theme-dark/10 bg-white px-4 py-3">
              <summary className="cursor-pointer select-none text-sm font-medium text-theme-dark/80">
                Keep the texts open
              </summary>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => openInNewTab("/texts/speech")}
                  className="text-left bg-theme-blue text-white px-4 py-2 rounded-lg font-medium hover:opacity-90"
                >
                  Open my saved speech copy
                </button>
                <button
                  type="button"
                  onClick={() => openInNewTab(sources.speechUrl || FALLBACK_SPEECH_URL)}
                  className="text-left bg-theme-blue/90 text-white px-4 py-2 rounded-lg font-medium hover:opacity-90"
                >
                  Open original speech source
                </button>
                <button
                  type="button"
                  onClick={() => openInNewTab("/texts/letter")}
                  className="text-left bg-theme-blue text-white px-4 py-2 rounded-lg font-medium hover:opacity-90"
                >
                  Open my saved letter copy
                </button>
                <button
                  type="button"
                  onClick={() => openInNewTab(sources.letterUrl || FALLBACK_LETTER_URL)}
                  className="text-left bg-theme-blue/90 text-white px-4 py-2 rounded-lg font-medium hover:opacity-90"
                >
                  Open original letter source
                </button>
              </div>
            </details>

            <details
              className="rounded-lg border border-theme-dark/10 bg-white px-4 py-3"
              open
            >
              <summary className="cursor-pointer select-none text-sm font-medium text-theme-dark/80">
                What are we looking for?
              </summary>
              <div className="mt-3 space-y-2">
                <p className="text-sm font-semibold text-theme-dark">
                  {activeLabel}
                </p>
                <p className="text-sm text-theme-dark/75">{introCopy[activeAppeal]}</p>
              </div>
            </details>

            <details className="rounded-lg border border-theme-dark/10 bg-white px-4 py-3">
              <summary className="cursor-pointer select-none text-sm font-medium text-theme-dark/80">
                Choose which text you’re working with
              </summary>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTextType("speech")}
                  className={[
                    "text-sm px-3 py-1.5 rounded-lg border transition-colors",
                    activeTextType === "speech"
                      ? "bg-theme-blue text-white border-theme-blue"
                      : "bg-white text-theme-dark/80 border-theme-dark/10 hover:bg-theme-dark/5",
                  ].join(" ")}
                >
                  Speech {speechFilledForCurrent ? "✓" : ""}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTextType("letter")}
                  className={[
                    "text-sm px-3 py-1.5 rounded-lg border transition-colors",
                    activeTextType === "letter"
                      ? "bg-theme-blue text-white border-theme-blue"
                      : "bg-white text-theme-dark/80 border-theme-dark/10 hover:bg-theme-dark/5",
                  ].join(" ")}
                >
                  Letter {letterFilledForCurrent ? "✓" : ""}
                </button>
              </div>
              <p className="mt-2 text-sm text-theme-dark/70">
                For each appeal, you’ll save <strong>one</strong> quote from the speech
                and <strong>one</strong> quote from the letter.
              </p>
            </details>

            <details className="rounded-lg border border-theme-dark/10 bg-white px-4 py-3">
              <summary className="cursor-pointer select-none text-sm font-medium text-theme-dark/80">
                Appeal progress
              </summary>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-left">
                <span className="text-sm text-theme-dark/70">
                  Appeal {appealIndex + 1} of {APPEALS.length}
                </span>
                {APPEALS.map((a, i) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => {
                      setActiveAppeal(a);
                      setActiveTextType("speech");
                    }}
                    className={[
                      "text-sm px-2.5 py-1.5 rounded-lg border transition-colors",
                      activeAppeal === a
                        ? "bg-theme-blue text-white border-theme-blue"
                        : "bg-white text-theme-dark/80 border-theme-dark/10 hover:bg-theme-dark/5",
                    ].join(" ")}
                  >
                    {i + 1}. {appealLabels[a]}
                  </button>
                ))}
              </div>
            </details>
          </div>
        </ReferenceSection>

        {/* D. Continue control */}
        <Panel className="space-y-3">
          {!allFilledForCurrent && (
            <p className="text-left text-sm text-theme-dark/80">
              Finished means: you have one complete quote + explanation for the speech
              and one complete quote + explanation for the letter.
            </p>
          )}
          {allFilledForCurrent && (
            <p className="text-left text-sm text-theme-dark/80">
              Nice work. You’re ready to add this evidence to your library.
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={saveAndContinue}
              disabled={!allFilledForCurrent || saving}
              className="bg-theme-green text-white px-4 py-2 rounded-lg font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLastAppeal
                ? "Save and finish"
                : `Save and continue to ${nextAppeal ? appealLabels[nextAppeal] : ""}`}
            </button>
            <button
              type="button"
              onClick={() => router.push("/modules/2")}
              className="text-theme-blue font-medium underline"
            >
              Back to Module 2
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
