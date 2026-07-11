"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import ModulePageShell from "@/components/layout/ModulePageShell";
import WorkspaceCenter from "@/components/layout/WorkspaceCenter";
import WorkspaceColumns from "@/components/layout/WorkspaceColumns";
import WorkspaceGuide from "@/components/layout/WorkspaceGuide";
import WorkspaceSidebar from "@/components/layout/WorkspaceSidebar";
import ModuleTwoNotebook from "@/components/module2/ModuleTwoNotebook";
import { mlkAssignmentDefinition } from "@/lib/assignments";
import { parseModule2Observation } from "@/lib/parseModule2Observation";
import { getTChartEntries } from "@/lib/supabase/helpers/tchartEntries";
import { makeStudentKey } from "@/lib/storage/studentCache";

const APPEALS = ["ethos", "pathos", "logos"];
const MODULE2_SOURCES = mlkAssignmentDefinition.sources;
const FALLBACK_SPEECH_URL = MODULE2_SOURCES.speech.analysisFallbackUrl;
const FALLBACK_LETTER_URL = MODULE2_SOURCES.letter.analysisFallbackUrl;

/**
 * Subtle visual identity for Speech vs Letter.
 * Reuse across Ethos / Pathos / Logos evidence workspaces.
 * Speech = cool blue · Letter = warm orange (complementary, not loud).
 */
const SOURCE_IDENTITY = {
  speech: {
    label: "Speech",
    inPhrase: "in the speech",
    accentText: "text-theme-blue",
    accentBar: "border-l-[3px] border-l-theme-blue",
    softWash: "bg-theme-blue/[0.04]",
    chip: "border border-theme-blue/30 bg-theme-blue/10 text-theme-blue",
    panelBorder: "border-theme-blue/25",
    sidebarCurrent:
      "border-theme-blue/40 bg-theme-blue/10 text-theme-blue ring-1 ring-theme-blue/15",
    sidebarComplete: "border-theme-green/30 bg-theme-green/5 text-theme-green",
    sidebarNext: "border-border-soft/70 bg-white text-text-primary",
  },
  letter: {
    label: "Letter",
    inPhrase: "in the letter",
    accentText: "text-theme-orange",
    accentBar: "border-l-[3px] border-l-theme-orange",
    softWash: "bg-theme-orange/[0.04]",
    chip: "border border-theme-orange/30 bg-theme-orange/10 text-theme-orange",
    panelBorder: "border-theme-orange/25",
    sidebarCurrent:
      "border-theme-orange/40 bg-theme-orange/10 text-theme-orange ring-1 ring-theme-orange/15",
    sidebarComplete: "border-theme-green/30 bg-theme-green/5 text-theme-green",
    sidebarNext:
      "border-theme-orange/35 bg-theme-orange/[0.07] text-text-primary",
  },
};


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

  /** Progressive coaching copy — template for all appeals; Ethos is the reference pattern. */
  const coachingByAppeal = {
    ethos: {
      phase1: {
        headline: {
          speech:
            "Find one place in the speech where King tries to seem trustworthy.",
          letter:
            "Find one place in the letter where King tries to seem trustworthy.",
        },
        coach:
          "Ethos is when King is trying to show readers that he is trustworthy, reasonable, honest, fair, or someone worth believing.",
        guides: [
          "Where does King seem trustworthy?",
          "Where does he establish credibility?",
          "Where does he sound fair or reasonable?",
          "What words make you believe him?",
        ],
        job: {
          speech: "Paste one short quote from the speech.",
          letter: "Paste one short quote from the letter.",
        },
        placeholder: "Paste one short quote here.",
      },
      phase2: {
        headline: "Why do you think this makes King seem trustworthy?",
        coach:
          "There is not one perfect answer. In your own words, explain why you chose this quote. Point to what makes King sound trustworthy, fair, or worth believing.",
        bridge: "Great. Now let’s think about one more thing.",
        job: "Explain why this quote makes King seem trustworthy.",
        placeholder: "Explain in your own words…",
      },
      phase3: {
        headline: "How might this affect King’s audience?",
        coach:
          "Imagine how readers might react. Would this make readers trust King? Would it make him sound fair? Would they believe him more?",
        bridge: "Great. Now let’s think about one more thing.",
        job: "Explain how this might affect King’s audience.",
        placeholder: "Describe a possible audience reaction…",
      },
      phase4: {
        headline: "How does this help King accomplish his purpose?",
        coach:
          "King’s purpose is what he is trying to achieve with his audience. Connect the trustworthy language in your quote to his larger goal.",
        bridge: "Great. Now let’s think about one more thing.",
        job: "Connect this quote to King’s larger purpose.",
        placeholder: "Connect the quote to King’s purpose…",
      },
    },
    pathos: {
      phase1: {
        headline: {
          speech:
            "Find one place in the speech where King tries to stir strong feeling.",
          letter:
            "Find one place in the letter where King tries to stir strong feeling.",
        },
        coach:
          "Pathos is when King is trying to make readers feel something—hope, anger, guilt, pride, fear, compassion, or urgency—so they care about his message.",
        guides: [
          "Where does King try to make people feel something?",
          "Where does the language sound emotional or vivid?",
          "What words might stir hope, anger, or compassion?",
        ],
        job: {
          speech: "Paste one short quote from the speech.",
          letter: "Paste one short quote from the letter.",
        },
        placeholder: "Paste one short quote here.",
      },
      phase2: {
        headline: "Why do you think this quote stirs feeling?",
        coach:
          "There is not one perfect answer. In your own words, explain why you chose this quote and what feeling it seems to create.",
        bridge: "Great. Now let’s think about one more thing.",
        job: "Explain why this quote stirs feeling.",
        placeholder: "Explain in your own words…",
      },
      phase3: {
        headline: "How might this affect King’s audience?",
        coach:
          "Imagine how readers might react. Would this make them care more? Feel urgency? Feel hope, anger, or compassion?",
        bridge: "Great. Now let’s think about one more thing.",
        job: "Explain how this might affect King’s audience.",
        placeholder: "Describe a possible audience reaction…",
      },
      phase4: {
        headline: "How does this help King accomplish his purpose?",
        coach:
          "King’s purpose is what he is trying to achieve with his audience. Connect the emotional language in your quote to his larger goal.",
        bridge: "Great. Now let’s think about one more thing.",
        job: "Connect this quote to King’s larger purpose.",
        placeholder: "Connect the quote to King’s purpose…",
      },
    },
    logos: {
      phase1: {
        headline: {
          speech:
            "Find one place in the speech where King uses reasoning or clear logic.",
          letter:
            "Find one place in the letter where King uses reasoning or clear logic.",
        },
        coach:
          "Logos is when King is trying to persuade with facts, examples, cause-and-effect thinking, or clear reasoning so his argument makes sense.",
        guides: [
          "Where does King give a reason or example?",
          "Where does he explain cause and effect?",
          "What words make his argument feel logical?",
        ],
        job: {
          speech: "Paste one short quote from the speech.",
          letter: "Paste one short quote from the letter.",
        },
        placeholder: "Paste one short quote here.",
      },
      phase2: {
        headline: "Why do you think this quote shows reasoning?",
        coach:
          "There is not one perfect answer. In your own words, explain why you chose this quote and what makes it feel logical or well reasoned.",
        bridge: "Great. Now let’s think about one more thing.",
        job: "Explain why this quote shows reasoning.",
        placeholder: "Explain in your own words…",
      },
      phase3: {
        headline: "How might this affect King’s audience?",
        coach:
          "Imagine how readers might react. Would this make his argument clearer? Would they find it more convincing or harder to dismiss?",
        bridge: "Great. Now let’s think about one more thing.",
        job: "Explain how this might affect King’s audience.",
        placeholder: "Describe a possible audience reaction…",
      },
      phase4: {
        headline: "How does this help King accomplish his purpose?",
        coach:
          "King’s purpose is what he is trying to achieve with his audience. Connect the reasoning in your quote to his larger goal.",
        bridge: "Great. Now let’s think about one more thing.",
        job: "Connect this quote to King’s larger purpose.",
        placeholder: "Connect the quote to King’s purpose…",
      },
    },
  };

  const activeLabel = appealLabels[activeAppeal];
  const sourceId = SOURCE_IDENTITY[activeTextType];
  const activeSourceTitle =
    activeTextType === "speech"
      ? MODULE2_SOURCES.speech.title
      : MODULE2_SOURCES.letter.title;
  const activeTextLabel = sourceId.label;
  const coaching = coachingByAppeal[activeAppeal];
  const phase1Headline = coaching.phase1.headline[activeTextType];
  const phase1Job = coaching.phase1.job[activeTextType];

  const quoteField = activeTextType === "speech" ? "speechQuote" : "letterQuote";
  const whyField = activeTextType === "speech" ? "speechWhy" : "letterWhy";
  const audienceField =
    activeTextType === "speech" ? "speechAudience" : "letterAudience";
  const purposeField =
    activeTextType === "speech" ? "speechPurpose" : "letterPurpose";

  const quoteValue = String(currentFields[quoteField] || "").trim();
  const whyValue = String(currentFields[whyField] || "").trim();
  const audienceValue = String(currentFields[audienceField] || "").trim();
  const purposeValue = String(currentFields[purposeField] || "").trim();

  const showPhase2 = quoteValue.length > 0;
  const showPhase3 = showPhase2 && whyValue.length > 0;
  const showPhase4 = showPhase3 && audienceValue.length > 0;
  const thisTextComplete = showPhase4 && purposeValue.length > 0;

  const speechComplete = speechFilledForCurrent;
  const letterComplete = letterFilledForCurrent;
  const bothTextsComplete = allFilledForCurrent;

  const waitingForLetterAfterSpeech =
    speechComplete && !letterComplete && activeTextType === "speech";
  const waitingForSpeechAfterLetter =
    letterComplete && !speechComplete && activeTextType === "letter";

  const letterTitle = MODULE2_SOURCES.letter.title;
  const speechTitle = MODULE2_SOURCES.speech.title;

  const currentJob = waitingForLetterAfterSpeech
    ? `Continue to the letter to find one ${activeLabel} example.`
    : waitingForSpeechAfterLetter
      ? `Continue to the speech to find one ${activeLabel} example.`
      : bothTextsComplete
        ? isLastAppeal
          ? "Both texts are complete. Save and finish when you are ready."
          : `Both texts are complete. Continue to ${appealLabels[nextAppeal]} when you are ready.`
        : !showPhase2
          ? phase1Job
          : !showPhase3
            ? coaching.phase2.job
            : !showPhase4
              ? coaching.phase3.job
              : !thisTextComplete
                ? coaching.phase4.job
                : `This ${activeTextType} is complete.`;

  const speechSidebarClass = speechComplete
    ? SOURCE_IDENTITY.speech.sidebarComplete
    : activeTextType === "speech"
      ? SOURCE_IDENTITY.speech.sidebarCurrent
      : SOURCE_IDENTITY.speech.sidebarNext;

  const letterSidebarClass = letterComplete
    ? SOURCE_IDENTITY.letter.sidebarComplete
    : activeTextType === "letter"
      ? SOURCE_IDENTITY.letter.sidebarCurrent
      : speechComplete
        ? SOURCE_IDENTITY.letter.sidebarNext
        : "border-border-soft/70 bg-white text-text-primary";

  const speechSidebarLabel = speechComplete
    ? "✓ Speech complete"
    : activeTextType === "speech"
      ? "Speech (current)"
      : "Speech";

  const letterSidebarLabel = letterComplete
    ? "✓ Letter complete"
    : activeTextType === "letter"
      ? "Letter (current)"
      : speechComplete
        ? "→ Letter next"
        : "Letter (next)";

  const nextAppealLabel = nextAppeal ? appealLabels[nextAppeal] : null;
  const saveContinueLabel = isLastAppeal
    ? "Save and finish"
    : `Continue to ${nextAppealLabel} →`;

  const unlockHint = !speechComplete
    ? `Complete the Speech example to continue.`
    : !letterComplete
      ? `Complete the Letter example to unlock ${
          isLastAppeal ? "finishing Module 2" : nextAppealLabel
        }.`
      : null;

  return (
    <ModulePageShell>
      <WorkspaceColumns variant="drafting" className="gap-5 xl:gap-8">
        <WorkspaceSidebar className="opacity-80 lg:col-span-1">
          <aside className="space-y-4 rounded-xl bg-surface-soft/70 px-4 py-5 text-left">
            <div className="space-y-1">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-text-muted">
                Module 2
              </p>
              <p className="text-sm font-semibold text-text-primary">
                Collect evidence
              </p>
            </div>

            <div className="space-y-1 border-t border-border-soft/60 pt-4">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-text-muted">
                Where you are
              </p>
              <p className="text-sm leading-relaxed text-text-primary">
                {activeLabel}
              </p>
              <p
                className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ${sourceId.chip}`}
              >
                Analyzing: {activeTextLabel}
              </p>
              <p className="text-sm leading-relaxed text-text-muted">
                Appeal {appealIndex + 1} of {APPEALS.length}. One quote from each
                text.
              </p>
            </div>

            <div className="space-y-3 border-t border-border-soft/60 pt-4">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-text-muted">
                Text progress
              </p>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTextType("speech")}
                  className={[
                    "rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                    speechSidebarClass,
                  ].join(" ")}
                >
                  <span className="block font-semibold">
                    {speechSidebarLabel}
                  </span>
                  <span className="mt-0.5 block text-[11px] opacity-80">
                    {MODULE2_SOURCES.speech.title}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTextType("letter")}
                  className={[
                    "rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                    letterSidebarClass,
                  ].join(" ")}
                >
                  <span className="block font-semibold">
                    {letterSidebarLabel}
                  </span>
                  <span className="mt-0.5 block text-[11px] opacity-80">
                    {MODULE2_SOURCES.letter.title}
                  </span>
                </button>
              </div>
              {bothTextsComplete ? (
                <p className="text-xs font-medium text-theme-green">
                  ✓ Speech complete · ✓ Letter complete
                </p>
              ) : null}
            </div>

            <div className="space-y-3 border-t border-border-soft/60 pt-4">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-text-muted">
                Appeal progress
              </p>
              <div className="flex flex-col gap-2">
                {APPEALS.map((a, i) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => {
                      setActiveAppeal(a);
                      setActiveTextType("speech");
                    }}
                    className={[
                      "rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                      activeAppeal === a
                        ? "border-theme-blue bg-theme-blue text-white"
                        : "border-border-soft/70 bg-white text-text-primary hover:bg-surface-soft",
                    ].join(" ")}
                  >
                    {i + 1}. {appealLabels[a]}
                  </button>
                ))}
              </div>
            </div>
          </aside>
        </WorkspaceSidebar>

        <WorkspaceCenter className="min-w-0">
          <div className="space-y-5 md:space-y-6">
            {waitingForLetterAfterSpeech || waitingForSpeechAfterLetter ? (
              <section className="space-y-5 rounded-xl border-2 border-theme-green/30 bg-theme-green/5 px-5 py-6 shadow-soft md:px-8 md:py-8">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-theme-green">
                  Nice work
                </p>
                <h1 className="max-w-4xl text-[1.85rem] font-bold leading-[1.1] tracking-tight text-text-primary md:text-[2.35rem] md:leading-[1.08]">
                  {waitingForLetterAfterSpeech
                    ? `Great job. You found one example of ${activeLabel} from the speech. Now let’s find one from ${letterTitle}.`
                    : `Great job. You found one example of ${activeLabel} from the letter. Now let’s find one from ${speechTitle}.`}
                </h1>
                <div className="space-y-2 text-sm text-text-muted">
                  <p>
                    {speechComplete ? "✓ Speech complete" : "Speech still needed"}
                  </p>
                  <p>
                    {letterComplete
                      ? "✓ Letter complete"
                      : "→ Letter next"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setActiveTextType(
                      waitingForLetterAfterSpeech ? "letter" : "speech"
                    )
                  }
                  className="rounded-lg bg-theme-blue px-5 py-2.5 text-base font-semibold text-white hover:opacity-90"
                >
                  {waitingForLetterAfterSpeech
                    ? "Continue to Letter →"
                    : "Continue to Speech →"}
                </button>
                <details className="rounded-lg bg-white/70 px-3 py-2.5">
                  <summary className="cursor-pointer list-none text-xs font-medium text-text-muted">
                    Review or edit your {activeTextType} answers
                  </summary>
                  <p className="mt-2 text-sm text-text-muted">
                    Your answers are saved below. You can change them anytime
                    before you move on.
                  </p>
                </details>
              </section>
            ) : (
              <>
                <header
                  className={`space-y-3 rounded-xl border px-4 py-4 text-left md:px-5 ${sourceId.panelBorder} ${sourceId.softWash} ${sourceId.accentBar}`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-text-muted">
                      Start here
                    </p>
                    <span
                      className={`rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.14em] ${sourceId.chip}`}
                    >
                      {activeTextLabel}
                    </span>
                  </div>
                  <h1 className="max-w-4xl text-[1.85rem] font-bold leading-[1.1] tracking-tight text-text-primary md:text-[2.5rem] md:leading-[1.08]">
                    {phase1Headline}
                  </h1>
                  <p className="max-w-3xl text-sm leading-relaxed text-text-muted md:text-base">
                    Working with: {activeSourceTitle}. Keep your evidence
                    notebook open while you work.
                  </p>
                </header>

                <div className="rounded-xl border-2 border-theme-orange/40 bg-theme-orange/10 px-4 py-4 shadow-soft ring-1 ring-theme-orange/15 md:px-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-theme-orange">
                    Your job right now
                  </p>
                  <p className="mt-2 text-base font-semibold leading-snug text-text-primary">
                    {currentJob}
                  </p>
                </div>
              </>
            )}

            <section
              aria-labelledby="module-2-tchart-workspace-heading"
              className={`min-w-0 space-y-5 ${
                waitingForLetterAfterSpeech || waitingForSpeechAfterLetter
                  ? "opacity-70"
                  : ""
              }`}
            >
              <div className="flex flex-wrap items-end justify-between gap-2">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-theme-blue">
                    Workspace
                  </p>
                  <h2
                    id="module-2-tchart-workspace-heading"
                    className="text-lg font-semibold text-text-primary"
                  >
                    {activeTextLabel} · one question at a time
                  </h2>
                </div>
                <span
                  className={`rounded-md px-2.5 py-1 text-xs font-semibold ${sourceId.chip}`}
                >
                  Source: {activeTextLabel}
                </span>
              </div>

              {/* Phase 1 — quote only */}
              <div
                className={`space-y-4 rounded-xl border-2 bg-white px-5 py-6 shadow-soft md:px-8 md:py-8 ${sourceId.panelBorder} ${sourceId.accentBar}`}
              >                <div className="space-y-3 text-left">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-text-muted">
                    Coach
                  </p>
                  <p className="text-sm leading-relaxed text-text-primary md:text-base">
                    {coaching.phase1.coach}
                  </p>
                  <ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed text-text-muted">
                    {coaching.phase1.guides.map((q) => (
                      <li key={q}>{q}</li>
                    ))}
                  </ul>
                </div>
                <div className="border-t border-border-soft/60 pt-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-text-muted">
                    Paste one short quote from the {activeTextType}
                  </p>
                  <textarea
                    className="mt-3 w-full min-h-[160px] rounded-xl border border-border-soft/70 bg-white px-4 py-4 text-[15px] leading-[1.8] text-text-primary focus:outline-none focus:ring-2 focus:ring-theme-blue/30 md:min-h-[180px]"
                    value={currentFields[quoteField]}
                    onChange={(e) =>
                      updateAppeal(activeAppeal, quoteField, e.target.value)
                    }
                    placeholder={coaching.phase1.placeholder}
                  />
                </div>
              </div>

              {/* Phase 2 — why */}
              {showPhase2 ? (
                <div className="space-y-4 rounded-xl border-2 border-theme-dark/15 bg-white px-5 py-6 shadow-soft md:px-8 md:py-8">
                  <p className="text-sm font-medium text-theme-green">
                    {coaching.phase2.bridge}
                  </p>
                  <h3 className="text-xl font-bold leading-snug text-text-primary md:text-2xl">
                    {coaching.phase2.headline}
                  </h3>
                  <div className="space-y-2 text-left">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-text-muted">
                      Coach
                    </p>
                    <p className="text-sm leading-relaxed text-text-primary md:text-base">
                      {coaching.phase2.coach}
                    </p>
                  </div>
                  <textarea
                    className="w-full min-h-[128px] rounded-lg border border-border-soft/70 bg-white px-3 py-3 text-sm leading-relaxed text-text-primary focus:outline-none focus:ring-2 focus:ring-theme-blue/30 md:min-h-[140px]"
                    value={currentFields[whyField]}
                    onChange={(e) =>
                      updateAppeal(activeAppeal, whyField, e.target.value)
                    }
                    placeholder={coaching.phase2.placeholder}
                  />
                </div>
              ) : null}

              {/* Phase 3 — audience */}
              {showPhase3 ? (
                <div className="space-y-4 rounded-xl border-2 border-theme-dark/15 bg-white px-5 py-6 shadow-soft md:px-8 md:py-8">
                  <p className="text-sm font-medium text-theme-green">
                    {coaching.phase3.bridge}
                  </p>
                  <h3 className="text-xl font-bold leading-snug text-text-primary md:text-2xl">
                    {coaching.phase3.headline}
                  </h3>
                  <div className="space-y-2 text-left">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-text-muted">
                      Coach
                    </p>
                    <p className="text-sm leading-relaxed text-text-primary md:text-base">
                      {coaching.phase3.coach}
                    </p>
                  </div>
                  <textarea
                    className="w-full min-h-[128px] rounded-lg border border-border-soft/70 bg-white px-3 py-3 text-sm leading-relaxed text-text-primary focus:outline-none focus:ring-2 focus:ring-theme-blue/30 md:min-h-[140px]"
                    value={currentFields[audienceField]}
                    onChange={(e) =>
                      updateAppeal(activeAppeal, audienceField, e.target.value)
                    }
                    placeholder={coaching.phase3.placeholder}
                  />
                </div>
              ) : null}

              {/* Phase 4 — purpose */}
              {showPhase4 ? (
                <div className="space-y-4 rounded-xl border-2 border-theme-dark/15 bg-white px-5 py-6 shadow-soft md:px-8 md:py-8">
                  <p className="text-sm font-medium text-theme-green">
                    {coaching.phase4.bridge}
                  </p>
                  <h3 className="text-xl font-bold leading-snug text-text-primary md:text-2xl">
                    {coaching.phase4.headline}
                  </h3>
                  <div className="space-y-2 text-left">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-text-muted">
                      Coach
                    </p>
                    <p className="text-sm leading-relaxed text-text-primary md:text-base">
                      {coaching.phase4.coach}
                    </p>
                  </div>
                  <textarea
                    className="w-full min-h-[128px] rounded-lg border border-border-soft/70 bg-white px-3 py-3 text-sm leading-relaxed text-text-primary focus:outline-none focus:ring-2 focus:ring-theme-blue/30 md:min-h-[140px]"
                    value={currentFields[purposeField]}
                    onChange={(e) =>
                      updateAppeal(activeAppeal, purposeField, e.target.value)
                    }
                    placeholder={coaching.phase4.placeholder}
                  />
                </div>
              ) : null}

              <div className="space-y-3 pt-1">
                {bothTextsComplete ? (
                  <div className="space-y-3 rounded-xl border-2 border-theme-green/30 bg-theme-green/5 px-4 py-4 md:px-5">
                    <p className="text-sm font-semibold text-theme-green">
                      ✓ Speech complete
                    </p>
                    <p className="text-sm font-semibold text-theme-green">
                      ✓ Letter complete
                    </p>
                    <p className="text-sm text-text-muted">
                      {isLastAppeal
                        ? "You’re ready to save and finish this evidence set."
                        : `You’re ready to continue to ${nextAppealLabel}.`}
                    </p>
                    <button
                      type="button"
                      onClick={saveAndContinue}
                      disabled={saving}
                      className="rounded-lg bg-theme-green px-5 py-2.5 text-base font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {saveContinueLabel}
                    </button>
                  </div>
                ) : waitingForLetterAfterSpeech ||
                  waitingForSpeechAfterLetter ? (
                  <p className="text-sm text-text-muted">
                    {waitingForLetterAfterSpeech
                      ? `Use Continue to Letter above when you are ready. ${unlockHint}`
                      : `Use Continue to Speech above when you are ready. ${unlockHint}`}
                  </p>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-text-muted">{unlockHint}</p>
                    <button
                      type="button"
                      disabled
                      className="cursor-not-allowed rounded-lg bg-gray-300 px-5 py-2.5 text-base font-semibold text-gray-500"
                    >
                      {saveContinueLabel}
                    </button>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => router.push("/modules/2")}
                  className="text-sm font-semibold text-theme-blue underline"
                >
                  Back to Module 2
                </button>
              </div>
            </section>

            <section
              id="module-2-tchart-need-help"
              className="scroll-mt-24 space-y-3 rounded-xl border border-theme-orange/20 bg-theme-orange/[0.03] px-4 py-4 md:px-5"
              aria-labelledby="module-2-tchart-need-help-heading"
            >
              <p
                id="module-2-tchart-need-help-heading"
                className="text-[11px] font-semibold uppercase tracking-[0.2em] text-theme-orange"
              >
                Need Help
              </p>

              <details className="rounded-lg bg-white/60 px-3 py-2.5">
                <summary className="cursor-pointer list-none text-xs font-medium text-text-muted">
                  Closed a source tab by accident?
                </summary>
                <p className="mt-2 text-sm leading-relaxed text-text-muted">
                  Use Open saved speech or Open saved letter in the teacher guide
                  on the right. You do not need to leave this page.
                </p>
              </details>

              <details className="rounded-lg bg-white/60 px-3 py-2.5">
                <summary className="cursor-pointer list-none text-xs font-medium text-text-muted">
                  Prefer the original archive pages?
                </summary>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      openInNewTab(sources.speechUrl || FALLBACK_SPEECH_URL)
                    }
                    className="rounded-lg border border-theme-blue/30 bg-theme-blue/10 px-3 py-1.5 text-sm font-semibold text-theme-blue"
                  >
                    Open original speech source
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      openInNewTab(sources.letterUrl || FALLBACK_LETTER_URL)
                    }
                    className="rounded-lg border border-theme-blue/30 bg-theme-blue/10 px-3 py-1.5 text-sm font-semibold text-theme-blue"
                  >
                    Open original letter source
                  </button>
                </div>
              </details>
            </section>
          </div>
        </WorkspaceCenter>

        <WorkspaceGuide className="opacity-90">
          <aside className="space-y-5 rounded-xl bg-surface-soft/70 px-5 py-5 text-left">
            <div className="space-y-2">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-text-muted">
                From your teacher
              </p>
              <p className="text-sm leading-relaxed text-text-primary">
                Keep both notebook pages open while you work. Look at the real
                words, choose a short quote, and explain what you notice.
              </p>
            </div>

            <div className="space-y-3 border-t border-border-soft/60 pt-4">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-text-muted">
                Evidence notebook
              </p>
              <p className="text-sm leading-relaxed text-text-muted">
                Reopen your saved texts anytime without leaving this page.
              </p>
              <p
                className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ${sourceId.chip}`}
              >
                Currently analyzing: {activeTextLabel}
              </p>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => openInNewTab("/texts/speech")}
                  className="rounded-lg border border-theme-blue/30 bg-theme-blue/10 px-4 py-2.5 text-sm font-semibold text-theme-blue hover:opacity-90"
                >
                  Open saved speech
                </button>
                <button
                  type="button"
                  onClick={() => openInNewTab("/texts/letter")}
                  className="rounded-lg border border-theme-orange/30 bg-theme-orange/10 px-4 py-2.5 text-sm font-semibold text-theme-orange hover:opacity-90"
                >
                  Open saved letter
                </button>
              </div>
            </div>

            <div className="border-t border-border-soft/60 pt-4">
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
            </div>

            <div className="space-y-2 border-t border-border-soft/60 pt-4">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-text-muted">
                What comes next
              </p>
              <p className="text-sm leading-relaxed text-text-muted">
                {isLastAppeal
                  ? "After you save Logos for both texts, you’ll finish Module 2 and move toward grouping evidence."
                  : `After ${activeLabel}, you’ll collect evidence for ${
                      nextAppeal ? appealLabels[nextAppeal] : "the next appeal"
                    }.`}
              </p>
            </div>
          </aside>
        </WorkspaceGuide>
      </WorkspaceColumns>

      {toast ? (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded bg-theme-dark px-3 py-2 text-sm text-white shadow">
          {toast}
        </div>
      ) : null}
    </ModulePageShell>
  );
}
