"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Panel from "@/components/ui/Panel";
import { makeStudentKey } from "@/lib/storage/studentCache";

const APPEALS = ["ethos", "pathos", "logos"];
const FALLBACK_SPEECH_URL =
  "https://www.archives.gov/files/press/exhibits/dream-speech.pdf";
const FALLBACK_LETTER_URL =
  "https://kinginstitute.stanford.edu/king-papers/documents/letter-birmingham-jail";

const OBSERVATION_SEP = "\n---AUDIENCE---\n";
const OBSERVATION_SEP2 = "\n---PURPOSE---\n";

function parseObservation(obs) {
  if (!obs || typeof obs !== "string") return { why: "", audience: "", purpose: "" };
  const i = obs.indexOf(OBSERVATION_SEP);
  const j = obs.indexOf(OBSERVATION_SEP2);
  if (i === -1 && j === -1) return { why: obs.trim(), audience: "", purpose: "" };
  const why = i === -1 ? obs : obs.slice(0, i).trim();
  const mid = i === -1 ? obs : obs.slice(i + OBSERVATION_SEP.length);
  const audience = j === -1 ? mid.trim() : mid.slice(0, mid.indexOf(OBSERVATION_SEP2)).trim();
  const purpose = j === -1 ? "" : mid.slice(mid.indexOf(OBSERVATION_SEP2) + OBSERVATION_SEP2.length).trim();
  return { why, audience, purpose };
}

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

export default function ModuleTwoTCharts() {
  const router = useRouter();
  const { data: session } = useSession();
  const email = session?.user?.email ?? null;

  const [activeAppeal, setActiveAppeal] = useState("ethos");
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

  // Load persisted analysis from localStorage (and support legacy Note keys)
  useEffect(() => {
    if (!email) return;
    try {
      const next = { ethos: emptyAppeal(), pathos: emptyAppeal(), logos: emptyAppeal() };
      APPEALS.forEach((appeal) => {
        const get = (suffix) => localStorage.getItem(makeStudentKey(email, ["mlk", "module2", "tcharts", appeal + suffix])) || "";
        // Keys match existing: ethosSpeechQuote, ethosSpeechNote (legacy), etc.
        next[appeal].speechQuote = get("SpeechQuote");
        next[appeal].speechWhy = get("SpeechWhy") || get("SpeechNote"); // legacy
        next[appeal].speechAudience = get("SpeechAudience");
        next[appeal].speechPurpose = get("SpeechPurpose");
        next[appeal].letterQuote = get("LetterQuote");
        next[appeal].letterWhy = get("LetterWhy") || get("LetterNote");
        next[appeal].letterAudience = get("LetterAudience");
        next[appeal].letterPurpose = get("LetterPurpose");
      });
      setFormData(next);
    } catch (_) {}
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
      setToast("Saved locally");
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
      setToast("Saved");
      setTimeout(() => setToast(""), 1200);
      if (isLastAppeal) {
        setTimeout(() => router.push("/modules/2/success"), 500);
        return;
      }
      setActiveAppeal(nextAppeal);
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

  return (
    <div className="min-h-screen bg-theme-light text-theme-dark p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-2xl font-extrabold text-theme-dark text-left">
          Module 2 Analysis
        </h1>

        <p className="text-left text-theme-dark/90">
          You are collecting evidence that will later help you compare how King
          uses rhetorical strategies in both texts.
        </p>

        {/* PART 1: Source access */}
        <Panel className="space-y-4">
          <h2 className="text-xl font-bold text-theme-dark text-left">
            Keep your texts open while you work
          </h2>
          <p className="text-left text-theme-dark/90">
            As you analyze, keep either your saved copy or the original source
            open in another tab so you can find short, accurate quotes.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => openInNewTab("/texts/speech")}
              className="text-left bg-theme-blue text-white px-4 py-2 rounded-lg font-medium hover:opacity-90"
            >
              Open My Saved Speech Copy
            </button>
            <button
              type="button"
              onClick={() => openInNewTab(sources.speechUrl || FALLBACK_SPEECH_URL)}
              className="text-left bg-theme-blue/90 text-white px-4 py-2 rounded-lg font-medium hover:opacity-90"
            >
              Open Original Speech Source
            </button>
            <button
              type="button"
              onClick={() => openInNewTab("/texts/letter")}
              className="text-left bg-theme-blue text-white px-4 py-2 rounded-lg font-medium hover:opacity-90"
            >
              Open My Saved Letter Copy
            </button>
            <button
              type="button"
              onClick={() => openInNewTab(sources.letterUrl || FALLBACK_LETTER_URL)}
              className="text-left bg-theme-blue/90 text-white px-4 py-2 rounded-lg font-medium hover:opacity-90"
            >
              Open Original Letter Source
            </button>
          </div>
        </Panel>

        {/* PART 2: Progress and one appeal at a time */}
        <div className="flex flex-wrap items-center gap-2 text-left">
          <span className="text-sm font-medium text-theme-dark/80">
            Appeal {appealIndex + 1} of {APPEALS.length}: {appealLabels[activeAppeal]}
          </span>
          {APPEALS.map((a, i) => (
            <button
              key={a}
              type="button"
              onClick={() => setActiveAppeal(a)}
              className={`text-sm px-2 py-1 rounded ${
                activeAppeal === a
                  ? "bg-theme-blue text-white"
                  : "bg-theme-dark/10 text-theme-dark/80 hover:bg-theme-dark/20"
              }`}
            >
              {i + 1}. {appealLabels[a]}
            </button>
          ))}
        </div>

        {/* A. Appeal intro card */}
        <Panel className="space-y-3">
          <h2 className="text-xl font-bold text-theme-dark text-left">
            {appealLabels[activeAppeal]}
          </h2>
          <p className="text-left text-theme-dark/90">
            {introCopy[activeAppeal]}
          </p>
          <p className="text-left text-theme-dark/90">
            Your job is to find one strong example from the speech and one
            strong example from the letter.
          </p>
        </Panel>

        {/* B. Speech task card */}
        <Panel className="space-y-4">
          <h3 className="text-lg font-bold text-theme-dark text-left">
            {appealLabels[activeAppeal]} in the Speech
          </h3>
          <p className="text-left text-theme-dark/90 text-sm">
            Read the speech and choose a short quote that clearly shows{" "}
            {appealLabels[activeAppeal]}.
          </p>
          <div className="space-y-3 text-left">
            <div>
              <label className="block text-sm font-medium text-theme-dark/90 mb-1">
                Quote from the Speech
              </label>
              <textarea
                className="w-full min-h-[80px] border border-theme-dark/20 rounded-lg p-2 text-sm bg-white"
                value={currentFields.speechQuote}
                onChange={(e) => updateAppeal(activeAppeal, "speechQuote", e.target.value)}
                placeholder="Short quote from the speech"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-theme-dark/90 mb-1">
                Why does this quote show {appealLabels[activeAppeal]}?
              </label>
              <textarea
                className="w-full min-h-[80px] border border-theme-dark/20 rounded-lg p-2 text-sm bg-white"
                value={currentFields.speechWhy}
                onChange={(e) => updateAppeal(activeAppeal, "speechWhy", e.target.value)}
                placeholder="Explain how this quote demonstrates the appeal"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-theme-dark/90 mb-1">
                What effect might this have on King&apos;s audience?
              </label>
              <textarea
                className="w-full min-h-[80px] border border-theme-dark/20 rounded-lg p-2 text-sm bg-white"
                value={currentFields.speechAudience}
                onChange={(e) => updateAppeal(activeAppeal, "speechAudience", e.target.value)}
                placeholder="Consider the audience&apos;s response"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-theme-dark/90 mb-1">
                How does this help King accomplish his purpose?
              </label>
              <textarea
                className="w-full min-h-[80px] border border-theme-dark/20 rounded-lg p-2 text-sm bg-white"
                value={currentFields.speechPurpose}
                onChange={(e) => updateAppeal(activeAppeal, "speechPurpose", e.target.value)}
                placeholder="Connect to King&apos;s purpose"
              />
            </div>
          </div>
        </Panel>

        {/* C. Letter task card */}
        <Panel className="space-y-4">
          <h3 className="text-lg font-bold text-theme-dark text-left">
            {appealLabels[activeAppeal]} in the Letter
          </h3>
          <p className="text-left text-theme-dark/90 text-sm">
            Read the letter and choose a short quote that clearly shows{" "}
            {appealLabels[activeAppeal]}.
          </p>
          <div className="space-y-3 text-left">
            <div>
              <label className="block text-sm font-medium text-theme-dark/90 mb-1">
                Quote from the Letter
              </label>
              <textarea
                className="w-full min-h-[80px] border border-theme-dark/20 rounded-lg p-2 text-sm bg-white"
                value={currentFields.letterQuote}
                onChange={(e) => updateAppeal(activeAppeal, "letterQuote", e.target.value)}
                placeholder="Short quote from the letter"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-theme-dark/90 mb-1">
                Why does this quote show {appealLabels[activeAppeal]}?
              </label>
              <textarea
                className="w-full min-h-[80px] border border-theme-dark/20 rounded-lg p-2 text-sm bg-white"
                value={currentFields.letterWhy}
                onChange={(e) => updateAppeal(activeAppeal, "letterWhy", e.target.value)}
                placeholder="Explain how this quote demonstrates the appeal"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-theme-dark/90 mb-1">
                What effect might this have on King&apos;s audience?
              </label>
              <textarea
                className="w-full min-h-[80px] border border-theme-dark/20 rounded-lg p-2 text-sm bg-white"
                value={currentFields.letterAudience}
                onChange={(e) => updateAppeal(activeAppeal, "letterAudience", e.target.value)}
                placeholder="Consider the audience&apos;s response"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-theme-dark/90 mb-1">
                How does this help King accomplish his purpose?
              </label>
              <textarea
                className="w-full min-h-[80px] border border-theme-dark/20 rounded-lg p-2 text-sm bg-white"
                value={currentFields.letterPurpose}
                onChange={(e) => updateAppeal(activeAppeal, "letterPurpose", e.target.value)}
                placeholder="Connect to King&apos;s purpose"
              />
            </div>
          </div>
        </Panel>

        {/* D. Continue control */}
        <Panel className="space-y-3">
          {!allFilledForCurrent && (
            <p className="text-left text-sm text-theme-dark/80">
              Complete all eight fields above for {appealLabels[activeAppeal]} to
              continue.
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
                ? "Save and Finish Module 2 Analysis"
                : `Save and Continue to ${nextAppeal ? appealLabels[nextAppeal] : ""}`}
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
