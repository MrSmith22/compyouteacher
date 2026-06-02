"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { logActivity } from "@/lib/logActivity";
import { tchartEntryKey } from "@/lib/module4/mapStudentBucketsToOutline";
import { parseModule2Observation } from "@/lib/parseModule2Observation";

const FLOW_VERSION = 2;

const STEP_WELCOME = 0;
const STEP_BIG_PICTURE = 1;
const STEP_EXPLAIN_BUCKETS = 2;
const STEP_PATTERN = 3;
const STEP_B1_SCAFFOLD = 4;
const STEP_B1_ROLE = 5;
const STEP_B1_EVIDENCE = 6;
const STEP_B1_REASONING = 7;
const STEP_B2_SCAFFOLD = 8;
const STEP_B2_ROLE = 9;
const STEP_B2_EVIDENCE = 10;
const STEP_B2_REASONING = 11;
const STEP_THIRD_DECISION = 12;
const STEP_B3_SCAFFOLD = 13;
const STEP_B3_ROLE = 14;
const STEP_B3_EVIDENCE = 15;
const STEP_B3_REASONING = 16;
const STEP_REFLECTION = 17;
const LAST_STEP = STEP_REFLECTION;

const APPEALS = ["ethos", "pathos", "logos"];

const STRUCTURE_LABELS = {
  "similarities-then-differences": "Similarities, then differences",
  "differences-then-similarities": "Differences, then similarities",
  "appeals-organization": "Appeals organization (Ethos / Pathos / Logos)",
};

/** Readable structure line for essay-plan reference (Module 3 + scaffold). */
function structurePlanLabel(structureChoice) {
  const c = structureChoice != null ? String(structureChoice).trim() : "";
  if (!c) return "Not set yet";
  const map = {
    "similarities-then-differences": "Similarities first, then differences",
    "differences-then-similarities": "Differences first, then similarities",
    "appeals-organization": "Organized by rhetorical appeals",
    similarities_then_differences: "Similarities first, then differences",
    differences_then_similarities: "Differences first, then similarities",
    appeals: "Organized by rhetorical appeals",
  };
  return map[c] ?? STRUCTURE_LABELS[c] ?? "Not set yet";
}

/** Readable pattern line for essay-plan reference (Module 4 pattern step). */
function patternPlanLabel(patternChoice) {
  const p = patternChoice != null ? String(patternChoice).trim() : "";
  if (!p) return "Not set yet";
  const map = {
    morally_responsible: "King presents himself as morally responsible",
    justice_leadership: "King connects himself to justice and leadership",
    trust_listen: "King builds trust so the audience will listen",
    unsure: "You are still exploring patterns",
  };
  return map[p] ?? "Not set yet";
}

/** Normalize Module 3 structure_choice variants to canonical keys. */
function canonicalStructureChoice(raw) {
  const c = raw != null ? String(raw).trim() : "";
  const map = {
    similarities_then_differences: "similarities-then-differences",
    "similarities-then-differences": "similarities-then-differences",
    differences_then_similarities: "differences-then-similarities",
    "differences-then-similarities": "differences-then-similarities",
    appeals: "appeals-organization",
    "appeals-organization": "appeals-organization",
  };
  return map[c] || c;
}

/**
 * What kind of paragraph this bucket should be, given Module 3 structure and bucket index (0-based).
 * Returns: "similarity" | "difference" | "appeal" | "general"
 */
function getScaffoldParagraphRole(structureChoice, bucketIndex) {
  if (bucketIndex < 0 || bucketIndex > 2) return "general";
  const sc = canonicalStructureChoice(structureChoice);

  if (sc === "similarities-then-differences") {
    if (bucketIndex === 0) return "similarity";
    if (bucketIndex === 1 || bucketIndex === 2) return "difference";
    return "general";
  }
  if (sc === "differences-then-similarities") {
    if (bucketIndex === 0 || bucketIndex === 1) return "difference";
    if (bucketIndex === 2) return "similarity";
    return "general";
  }
  if (sc === "appeals-organization") {
    return "appeal";
  }
  return "general";
}

/** Classify a built-in suggestion id for scaffold filtering. */
function suggestionScaffoldKind(suggestionId) {
  const id = String(suggestionId || "");
  if (
    id.startsWith("sim-") ||
    id === "gen-1" ||
    id === "credibility" ||
    id === "both-appeals"
  ) {
    return "similarity";
  }
  if (
    id.startsWith("diff-") ||
    id === "gen-2"
  ) {
    return "difference";
  }
  if (
    id === "ethos-para" ||
    id === "pathos-para" ||
    id === "logos-para" ||
    id === "speech-emotion" ||
    id === "letter-logic"
  ) {
    return "appeal";
  }
  return "other";
}

function filterSuggestionsByScaffoldRole(suggestions, role) {
  if (!Array.isArray(suggestions) || !suggestions.length) return suggestions;
  if (role === "general") return suggestions;

  const filtered = suggestions.filter((s) => {
    const k = suggestionScaffoldKind(s.id);
    if (role === "similarity") return k === "similarity";
    if (role === "difference") return k === "difference";
    if (role === "appeal") {
      return k === "appeal" || k === "similarity";
    }
    return true;
  });

  return filtered.length > 0 ? filtered : suggestions;
}

function scaffoldThinkAboutLine(role, isFirstParagraphScaffold) {
  if (isFirstParagraphScaffold) {
    if (role === "similarity") {
      return "Look at your thesis and the pattern you identified. Which shared idea helps you start proving that argument?";
    }
    if (role === "difference") {
      return "Look at your thesis and the pattern you identified. Which difference helps you start proving that argument?";
    }
    if (role === "appeal") {
      return "Look at your thesis and the pattern you identified. Which rhetorical strategy should this paragraph take on first?";
    }
    return "Look at your thesis and the pattern you identified. Which idea helps you start proving that argument?";
  }
  if (role === "similarity") {
    return "Given your thesis, which similarity belongs in this part of your essay?";
  }
  if (role === "difference") {
    return "Given your thesis, which difference belongs in this part of your essay?";
  }
  if (role === "appeal") {
    return "Given your thesis, which rhetorical strategy should this paragraph develop next?";
  }
  return "Look at your thesis and organization. Which idea fits this paragraph?";
}

function scaffoldStepTeacherCopy(role, paragraphNumber, isFirstParagraphGeneral) {
  const n = paragraphNumber;
  if (role === "similarity") {
    return {
      title: `Paragraph ${n}: show a key similarity between the texts`,
      focusLine:
        "In this paragraph, focus on what both texts have in common.",
      whatYouWillDo:
        "Pick a suggestion or write your own about a shared idea, then edit the text box.",
    };
  }
  if (role === "difference") {
    return {
      title: `Paragraph ${n}: explain an important difference`,
      focusLine:
        "In this paragraph, focus on how the speech and letter differ in an important way.",
      whatYouWillDo:
        "Pick a suggestion or write your own about a meaningful difference, then edit the text box.",
    };
  }
  if (role === "appeal") {
    return {
      title: `Paragraph ${n}: analyze one rhetorical strategy`,
      focusLine:
        "In this paragraph, focus on one rhetorical strategy and how King uses it.",
      whatYouWillDo:
        "Pick a suggestion or write your own about one appeal or strategy, then edit the text box.",
    };
  }
  if (isFirstParagraphGeneral) {
    return {
      title: "Paragraph 1: build a paragraph that proves part of your thesis",
      focusLine: null,
      whatYouWillDo:
        "Pick a suggestion or write your own idea that supports your thesis, then edit the text box",
    };
  }
  return {
    title: `Paragraph ${n}: choose a paragraph idea`,
    focusLine: null,
    whatYouWillDo:
      "Pick a suggestion or write your own, then edit the text box",
  };
}

const THESIS_BRIDGE_COPY =
  "Everything you do in this module should help you prove your thesis. Each bucket you create will become a body paragraph in your essay.";

const GUIDING_QUESTION = "Does this idea help prove your thesis?";

const GROUNDING_REMINDER_MODULE4 =
  "Keep the texts open while you work so your ideas stay grounded in King’s words.";

const MEANING_BODY_PARAGRAPH =
  "You are building one of your body paragraphs right now.";

const REASONING_PLAN_MEANING =
  "You are building one of your body paragraphs right now. Clear reasoning here will become the sentences that connect your evidence to your thesis.";

const GUIDANCE_THESIS_FOR_PARAGRAPH_IDEA =
  "This paragraph idea should directly support your thesis.";

/** Shared styling for real student inputs (textareas). */
const FIELD_INPUT_CLASS =
  "w-full bg-white border-2 border-theme-dark/20 rounded-lg p-3 text-sm text-theme-dark shadow-sm placeholder:text-theme-dark/45 focus:outline-none focus:border-theme-blue focus:ring-2 focus:ring-theme-blue/20";

/** Radio / checkbox row: clearly interactive, not guidance-colored. */
const CHOICE_ROW_CLASS =
  "flex gap-3 items-start rounded-lg border-2 border-theme-dark/15 bg-white p-3 cursor-pointer text-left shadow-sm hover:border-theme-blue/35 transition-colors";

const PATTERN_OPTIONS = [
  {
    id: "morally_responsible",
    label: "King presents himself as morally responsible",
  },
  {
    id: "justice_leadership",
    label: "King connects himself to justice and leadership",
  },
  {
    id: "trust_listen",
    label: "King builds trust so the audience will listen",
  },
  { id: "unsure", label: "I’m not sure" },
];

/** Teacher-style response after a pattern option is selected (choice-specific). */
const PATTERN_FEEDBACK_BY_CHOICE = {
  morally_responsible:
    "Reading your notes this way, both moments show King presenting himself as morally serious—as someone who takes responsibility for what he does and believes his stand is justified. When that same posture shows up in the speech and in the letter, you are looking at a real pattern, not a coincidence. That shared idea is something you can grow into a strong body paragraph.",
  justice_leadership:
    "That matches what many readers see here: in both excerpts King ties who he is to justice, moral leadership, and the wider struggle for civil rights. Naming that link in two different texts is comparative thinking in action. This repeated idea gives you a clear center for a body paragraph later on.",
  trust_listen:
    "Nice work—here King seems to be earning trust so people will actually hear his message instead of brushing it aside. Because that move appears in both the speech moment and the letter moment, you have spotted a strategy King uses more than once. A pattern like that is exactly the kind of material that can anchor a body paragraph.",
  unsure:
    "That’s completely fine—you don’t have to lock in a label yet. What I want you to remember is that when you do notice an idea that echoes across both texts, you are often right at the start of what can become a strong body paragraph. You’ll keep practicing that as you build your buckets.",
};

function patternStepFeedbackForChoice(choiceId) {
  if (!choiceId) return "";
  return (
    PATTERN_FEEDBACK_BY_CHOICE[choiceId] ?? PATTERN_FEEDBACK_BY_CHOICE.unsure
  );
}

const CUSTOM_SUGGESTION_ID = "__custom__";

const REASONING_STARTERS = [
  { id: "shows", label: "This shows that King is…", prefix: "This shows that King is " },
  {
    id: "feel",
    label: "This helps the audience feel…",
    prefix: "This helps the audience feel ",
  },
  {
    id: "matters",
    label: "This matters because…",
    prefix: "This matters because ",
  },
  {
    id: "uses",
    label: "King uses ___ to ___, which helps ___.",
    prefix: "King uses ",
  },
];

function openUrlInNewTab(href) {
  if (!href) return;
  window.open(href, "_blank", "noopener,noreferrer");
}

function StepGuidanceBox({ label = "Why this matters", children }) {
  return (
    <div className="rounded-lg border border-theme-blue/30 bg-theme-blue/5 p-3 text-left">
      <p className="text-xs font-bold uppercase tracking-wide text-theme-blue mb-2">
        {label}
      </p>
      <div className="text-sm text-theme-dark/90 leading-relaxed">{children}</div>
    </div>
  );
}

function StepMeaningBox({ label = "What this means", children }) {
  return (
    <div className="rounded-lg border-2 border-theme-green/40 bg-theme-green/10 p-3 text-left">
      <p className="text-xs font-bold uppercase tracking-wide text-theme-green mb-2">
        {label}
      </p>
      <div className="text-sm text-theme-dark/90 leading-relaxed">{children}</div>
    </div>
  );
}

function StepActionHeading({ children }) {
  return (
    <p className="text-sm font-bold text-theme-dark pt-2 border-t border-theme-dark/15">
      {children}
    </p>
  );
}

function StepReferenceNote({ title = "From your work", children }) {
  return (
    <div className="rounded-md border border-dashed border-theme-dark/25 bg-theme-light/80 p-3 text-sm text-theme-dark/85">
      <p className="text-xs font-semibold text-theme-dark/60 uppercase tracking-wide mb-1">
        {title}
      </p>
      <div>{children}</div>
    </div>
  );
}

function sourceTypeLabel(type) {
  const t = String(type || "").toLowerCase();
  return t === "letter" ? "Letter" : "Speech";
}

/**
 * Read-only summary of claim + selected Module 2 evidence for the reasoning step.
 */
function ParagraphPlanPanel({ paragraphNumber, bucket, tchartByKey }) {
  const keys = Array.isArray(bucket?.evidenceKeys) ? bucket.evidenceKeys : [];
  const claim = (bucket?.claim || "").trim();

  return (
    <div
      className="rounded-xl border border-dashed border-theme-dark/25 bg-theme-light/95 p-4 space-y-4 text-left"
      aria-readonly="true"
    >
      <div>
        <h3 className="text-lg font-extrabold text-theme-dark">
          Paragraph {paragraphNumber} Plan
        </h3>
        <p className="text-sm text-theme-dark/80 mt-1 leading-relaxed">
          Here is the idea and evidence you selected for this paragraph. Use this to
          explain how your paragraph supports your thesis.
        </p>
      </div>

      <div className="rounded-lg border border-theme-dark/15 bg-theme-light/90 p-3">
        <p className="text-xs font-bold uppercase tracking-wide text-theme-dark/55 mb-1">
          Your paragraph idea
        </p>
        <p className="text-sm text-theme-dark/90 whitespace-pre-wrap">
          {claim || "—"}
        </p>
      </div>

      {keys.length === 0 ? (
        <p className="text-sm text-theme-dark/85 font-medium">
          No evidence selected yet. Go back and assign quotes to this paragraph.
        </p>
      ) : (
        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-wide text-theme-dark/55">
            Selected evidence
          </p>
          {keys.map((evKey) => {
            const row = tchartByKey[evKey];
            if (!row) {
              return (
                <div
                  key={evKey}
                  className="rounded-lg border border-theme-orange/35 bg-theme-orange/5 p-3 text-sm text-theme-dark/80"
                >
                  This evidence slot is no longer linked to your saved Module 2 notes.
                </div>
              );
            }
            const parsed = parseModule2Observation(row.observation);
            const quote = (row.quote || "").trim();
            const explanation =
              (parsed.main || "").trim() ||
              (typeof row.observation === "string" ? row.observation.trim() : "");
            const appeal = String(row.category || "").toLowerCase();

            return (
              <div
                key={evKey}
                className="rounded-lg border border-theme-blue/25 bg-theme-light/90 p-3 space-y-2 text-sm text-left"
              >
                <div className="flex flex-wrap gap-2 text-xs font-semibold text-theme-dark">
                  <span className="rounded border border-theme-dark/15 bg-white/90 px-2 py-1">
                    Source: {sourceTypeLabel(row.type)}
                  </span>
                  <span className="rounded border border-theme-dark/15 bg-white/90 px-2 py-1 capitalize">
                    Appeal: {appeal || "—"}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-theme-dark/55 mb-0.5">
                    Quote
                  </p>
                  {quote ? (
                    <p className="italic text-theme-dark/90">&ldquo;{quote}&rdquo;</p>
                  ) : (
                    <p className="text-theme-dark/65 text-xs">No quote text saved.</p>
                  )}
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-theme-dark/55 mb-0.5">
                    Your explanation (Module 2)
                  </p>
                  <p className="text-theme-dark/90 leading-relaxed">
                    {explanation || "—"}
                  </p>
                </div>
                <div className="rounded-md border border-theme-blue/20 bg-theme-blue/5 p-2.5 mt-1">
                  <p className="text-xs font-bold uppercase tracking-wide text-theme-blue mb-1.5">
                    Why this evidence matters
                  </p>
                  {parsed.audience ? (
                    <p className="text-theme-dark/90 text-sm">
                      <span className="font-semibold">Audience effect: </span>
                      {parsed.audience}
                    </p>
                  ) : null}
                  {parsed.purpose ? (
                    <p className="text-theme-dark/90 text-sm mt-1">
                      <span className="font-semibold">Purpose connection: </span>
                      {parsed.purpose}
                    </p>
                  ) : null}
                  {!parsed.audience && !parsed.purpose ? (
                    <p className="text-xs text-theme-dark/70 leading-relaxed">
                      No separate audience or purpose lines were saved for this note in
                      Module 2. Use your explanation above as your grounding.
                    </p>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ModuleSourceAccess({ speechOriginalUrl, letterOriginalUrl }) {
  const btnClass =
    "text-left text-sm font-medium px-3 py-2 rounded-md border-2 border-theme-blue/35 bg-white text-theme-dark hover:bg-theme-blue/10 transition shadow-sm";

  return (
    <div className="rounded-lg border border-theme-blue/25 bg-theme-light/90 p-3 space-y-3 text-left">
      <p className="text-xs font-bold uppercase tracking-wide text-theme-dark/70">
        Support — your texts (optional)
      </p>
      <p className="text-xs text-theme-dark/85 leading-relaxed">
        {GROUNDING_REMINDER_MODULE4}
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={btnClass}
          onClick={() => openUrlInNewTab("/texts/speech")}
        >
          Open My Saved Speech Copy
        </button>
        <button
          type="button"
          className={btnClass}
          onClick={() => openUrlInNewTab(speechOriginalUrl)}
        >
          Open Original Speech Source
        </button>
        <button
          type="button"
          className={btnClass}
          onClick={() => openUrlInNewTab("/texts/letter")}
        >
          Open My Saved Letter Copy
        </button>
        <button
          type="button"
          className={btnClass}
          onClick={() => openUrlInNewTab(letterOriginalUrl)}
        >
          Open Original Letter Source
        </button>
      </div>
    </div>
  );
}

function buildBucketSuggestions(structureChoice, responses) {
  const sc = canonicalStructureChoice(structureChoice);

  const [sa, sp, la, lp] = [
    (responses?.[0] || "").trim() || "the speech audience",
    (responses?.[1] || "").trim() || "the speech’s purpose",
    (responses?.[2] || "").trim() || "the letter audience",
    (responses?.[3] || "").trim() || "the letter’s purpose",
  ];

  const shared = [
    {
      id: "credibility",
      label:
        "Both texts build King’s credibility (ethos) as a moral and religious leader.",
    },
    {
      id: "both-appeals",
      label: `King balances ethos, pathos, and logos in both texts as he speaks to ${sa} and ${la}.`,
    },
  ];

  switch (sc) {
    case "similarities-then-differences":
      return [
        {
          id: "sim-1",
          label:
            "Similarity: both the speech and the letter confront injustice and call people to act with moral courage.",
        },
        {
          id: "sim-2",
          label:
            "Similarity: King appeals to shared values, faith, and human dignity in both texts.",
        },
        {
          id: "diff-speech",
          label: `Difference: the speech is shaped for ${sa} and aims to ${sp}.`,
        },
        {
          id: "diff-letter",
          label: `Difference: the letter is shaped for ${la} and aims to ${lp}.`,
        },
        ...shared,
      ];
    case "differences-then-similarities":
      return [
        {
          id: "diff-s-1",
          label: `Difference: the speech reaches ${sa}, while the letter reaches ${la}.`,
        },
        {
          id: "diff-s-2",
          label: `Difference: the purposes differ—the speech works toward ${sp}, and the letter toward ${lp}.`,
        },
        {
          id: "sim-bridge",
          label:
            "Similarity: despite those differences, both texts still rely on King’s ethos and careful argument.",
        },
        ...shared,
      ];
    case "appeals-organization":
      return [
        {
          id: "ethos-para",
          label:
            "Ethos: how King builds trust and authority in the speech compared with the letter.",
        },
        {
          id: "pathos-para",
          label: `Pathos: emotional appeals aimed at ${sa} in the speech and ${la} in the letter.`,
        },
        {
          id: "logos-para",
          label:
            "Logos: logical arguments, definitions, and evidence King uses in both texts.",
        },
        {
          id: "speech-emotion",
          label:
            "The speech uses hopeful, rhythmic language to move a large public audience.",
        },
        {
          id: "letter-logic",
          label:
            "The letter uses tight, logical reasoning for skeptical or opposing readers.",
        },
        ...shared,
      ];
    default:
      return [
        {
          id: "gen-1",
          label:
            "A main idea King develops across both the speech and the letter.",
        },
        {
          id: "gen-2",
          label:
            "How the speech’s tone or strategy differs from the letter’s—and why that matters.",
        },
        ...shared,
      ];
  }
}

function paragraphRoleOptions(structureChoice) {
  if (canonicalStructureChoice(structureChoice) === "appeals-organization") {
    return [
      { id: "ethos", label: "Focuses on ethos" },
      { id: "pathos", label: "Focuses on pathos" },
      { id: "logos", label: "Focuses on logos" },
    ];
  }
  return [
    { id: "similarity", label: "Shows a similarity" },
    { id: "diff_speech", label: "Shows a difference in the speech" },
    { id: "diff_letter", label: "Shows a difference in the letter" },
  ];
}

function emptyBucket() {
  return {
    claim: "",
    reasoning: "",
    evidenceKeys: [],
    evidenceSnippets: [],
    paragraphRole: "",
    suggestionId: "",
  };
}

function mapRawBucket(b) {
  return {
    claim: String(b?.claim ?? ""),
    reasoning: String(b?.reasoning ?? ""),
    evidenceKeys: Array.isArray(b?.evidenceKeys) ? [...b.evidenceKeys] : [],
    evidenceSnippets: Array.isArray(b?.evidenceSnippets)
      ? b.evidenceSnippets
      : [],
    paragraphRole: String(b?.paragraphRole ?? ""),
    suggestionId: String(b?.suggestionId ?? ""),
  };
}

function groupTchartBySourceAndAppeal(rows) {
  const g = {
    speech: { ethos: [], pathos: [], logos: [] },
    letter: { ethos: [], pathos: [], logos: [] },
  };
  for (const e of rows || []) {
    const src =
      String(e?.type ?? "").toLowerCase() === "letter" ? "letter" : "speech";
    const cat = String(e?.category ?? "").toLowerCase();
    if (!g[src][cat]) continue;
    g[src][cat].push(e);
  }
  return g;
}

function findFirstAppealPair(grouped) {
  for (const appeal of APPEALS) {
    const s = grouped.speech[appeal];
    const l = grouped.letter[appeal];
    if (s?.length && l?.length) {
      return { appeal, speechRow: s[0], letterRow: l[0] };
    }
  }
  return null;
}

function rowHasDisplayableContent(row) {
  if (!row) return false;
  const q = (row.quote || "").trim();
  const parsed = parseModule2Observation(row.observation);
  const obs = (row.observation || "").trim();
  return Boolean(
    q || parsed.main || parsed.audience || parsed.purpose || obs
  );
}

function CompactAnalysisCard({ title, row }) {
  if (!rowHasDisplayableContent(row)) {
    return (
      <div className="rounded-lg border border-dashed border-theme-blue/30 bg-theme-light/90 p-3 text-left text-xs text-theme-dark/75">
        No saved Module 2 note here yet. You can still think about the pattern, or go
        back to Module 2 later to add a quote and observation.
      </div>
    );
  }
  const parsed = parseModule2Observation(row?.observation);
  const quote = (row?.quote || "").trim();
  return (
    <div className="rounded-lg border border-theme-blue/25 bg-theme-blue/5 p-3 text-left text-xs space-y-2 text-theme-dark/90">
      <p className="font-semibold text-theme-blue">{title}</p>
      {quote ? (
        <p>
          <span className="font-semibold text-theme-dark">Quote: </span>
          <span className="italic">&ldquo;{quote}&rdquo;</span>
        </p>
      ) : null}
      {parsed.main ? (
        <p>
          <span className="font-semibold text-theme-dark">Your explanation: </span>
          {parsed.main}
        </p>
      ) : row?.observation?.trim() && !quote ? (
        <p>
          <span className="font-semibold text-theme-dark">Your note: </span>
          {row.observation.trim()}
        </p>
      ) : null}
    </div>
  );
}

function bucketIndexForStep(step) {
  if (step >= STEP_B1_SCAFFOLD && step <= STEP_B1_REASONING) return 0;
  if (step >= STEP_B2_SCAFFOLD && step <= STEP_B2_REASONING) return 1;
  if (step >= STEP_B3_SCAFFOLD && step <= STEP_B3_REASONING) return 2;
  return -1;
}

function enrichBucketsForSave(bucketsSlice, keyToRow) {
  return bucketsSlice.map((b) => ({
    claim: b.claim,
    reasoning: b.reasoning,
    paragraphRole: b.paragraphRole || "",
    suggestionId: b.suggestionId || "",
    evidenceKeys: [...(b.evidenceKeys || [])],
    evidenceSnippets: (b.evidenceKeys || []).map((k) => {
      const row = keyToRow[k];
      if (!row) return { quote: "", observation: "" };
      return {
        quote: row.quote || "",
        observation: row.observation || "",
      };
    }),
  }));
}

function parseInitialFromServer(row) {
  const defaultPattern = "";

  if (!row) {
    return {
      flowStep: STEP_WELCOME,
      wantThirdBucket: null,
      buckets: [emptyBucket(), emptyBucket()],
      reflection: "",
      patternChoice: defaultPattern,
    };
  }

  const rawList = Array.isArray(row.buckets) ? row.buckets.map(mapRawBucket) : [];
  while (rawList.length < 2) rawList.push(emptyBucket());

  const flow = row.flow_state || {};
  let wantThird = flow.wantThirdBucket;
  if (wantThird == null && rawList.length > 2) wantThird = true;
  if (wantThird === true && rawList.length < 3) rawList.push(emptyBucket());
  if (wantThird === false) rawList.length = Math.min(rawList.length, 2);

  let flowStep =
    typeof flow.step === "number" ? flow.step : STEP_WELCOME;
  flowStep = Math.max(STEP_WELCOME, Math.min(flowStep, LAST_STEP));

  if (wantThird === false && flowStep >= STEP_B3_SCAFFOLD && flowStep <= STEP_B3_REASONING) {
    flowStep = STEP_THIRD_DECISION;
  }

  // Migrate saved progress from the pre–flow-v2 step map (14 steps, indices 0–13).
  if (flow.v !== FLOW_VERSION) {
    const v1ToV2 = {
      0: STEP_WELCOME,
      1: STEP_BIG_PICTURE,
      2: STEP_EXPLAIN_BUCKETS,
      3: STEP_B1_SCAFFOLD,
      4: STEP_B1_EVIDENCE,
      5: STEP_B1_REASONING,
      6: STEP_B2_SCAFFOLD,
      7: STEP_B2_EVIDENCE,
      8: STEP_B2_REASONING,
      9: STEP_THIRD_DECISION,
      10: STEP_B3_SCAFFOLD,
      11: STEP_B3_EVIDENCE,
      12: STEP_B3_REASONING,
      13: STEP_REFLECTION,
    };
    const mapped = v1ToV2[flowStep];
    if (typeof mapped === "number") {
      flowStep = mapped;
    } else if (flowStep > STEP_EXPLAIN_BUCKETS) {
      flowStep = STEP_PATTERN;
    }
    flowStep = Math.max(STEP_WELCOME, Math.min(flowStep, LAST_STEP));
  }

  const patternChoice =
    typeof flow.patternChoice === "string" ? flow.patternChoice : defaultPattern;

  return {
    flowStep,
    wantThirdBucket: wantThird ?? null,
    buckets: rawList,
    reflection: String(row.reflection ?? ""),
    patternChoice,
  };
}

export default function ModuleFour({
  initialModule3 = null,
  initialTchartEntries = [],
  initialStudentBuckets = null,
  speechOriginalUrl = "",
  letterOriginalUrl = "",
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const hasLoggedStartRef = useRef(false);
  const saveTimerRef = useRef(null);

  const parsed = useMemo(
    () => parseInitialFromServer(initialStudentBuckets),
    [initialStudentBuckets]
  );

  const [flowStep, setFlowStep] = useState(parsed.flowStep);
  const [wantThirdBucket, setWantThirdBucket] = useState(parsed.wantThirdBucket);
  const [buckets, setBuckets] = useState(parsed.buckets);
  const [reflection, setReflection] = useState(parsed.reflection);
  const [patternChoice, setPatternChoice] = useState(parsed.patternChoice);

  const tchartByKey = useMemo(() => {
    const m = {};
    for (const row of initialTchartEntries || []) {
      m[tchartEntryKey(row)] = row;
    }
    return m;
  }, [initialTchartEntries]);

  const groupedQuotes = useMemo(
    () => groupTchartBySourceAndAppeal(initialTchartEntries),
    [initialTchartEntries]
  );

  const patternPair = useMemo(
    () => findFirstAppealPair(groupedQuotes),
    [groupedQuotes]
  );

  const thesis = initialModule3?.thesis?.trim() || "";
  const structureChoice = initialModule3?.structure_choice || "";
  const structureLabel =
    STRUCTURE_LABELS[structureChoice] || structureChoice || "";
  const responses = initialModule3?.responses;

  const allBucketSuggestions = useMemo(
    () => buildBucketSuggestions(structureChoice, responses),
    [structureChoice, responses]
  );

  const scaffoldBucketIndex =
    flowStep >= STEP_B1_SCAFFOLD && flowStep <= STEP_B3_SCAFFOLD
      ? bucketIndexForStep(flowStep)
      : -1;

  const scaffoldRole = useMemo(
    () => getScaffoldParagraphRole(structureChoice, scaffoldBucketIndex),
    [structureChoice, scaffoldBucketIndex]
  );

  const scaffoldSuggestions = useMemo(
    () => filterSuggestionsByScaffoldRole(allBucketSuggestions, scaffoldRole),
    [allBucketSuggestions, scaffoldRole]
  );

  const speechAudience = (responses?.[0] || "").trim() || "—";
  const speechPurpose = (responses?.[1] || "").trim() || "—";
  const letterAudience = (responses?.[2] || "").trim() || "—";
  const letterPurpose = (responses?.[3] || "").trim() || "—";

  const persistSlice = useCallback(() => {
    if (wantThirdBucket === true) return buckets.slice(0, 3);
    return buckets.slice(0, 2);
  }, [buckets, wantThirdBucket]);

  const saveToApi = useCallback(async () => {
    const slice = persistSlice();
    const payload = {
      buckets: enrichBucketsForSave(slice, tchartByKey),
      reflection,
      flow_state: {
        v: FLOW_VERSION,
        step: flowStep,
        wantThirdBucket,
        patternChoice,
      },
    };

    try {
      const res = await fetch("/api/module4/buckets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        console.warn("Module 4 save failed:", json);
      }
    } catch (e) {
      console.warn("Module 4 save error:", e);
    }
  }, [
    flowStep,
    wantThirdBucket,
    patternChoice,
    persistSlice,
    reflection,
    tchartByKey,
  ]);

  useEffect(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveToApi();
    }, 700);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [saveToApi, buckets, reflection, flowStep, wantThirdBucket, patternChoice]);

  useEffect(() => {
    const email = session?.user?.email;
    if (!email || hasLoggedStartRef.current) return;
    hasLoggedStartRef.current = true;
    logActivity(email, "module_started", { module: 4, screen: "module4_buckets" });
  }, [session?.user?.email]);

  const flushSave = useCallback(async () => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    await saveToApi();
  }, [saveToApi]);

  const toggleEvidenceKey = (bucketIndex, key) => {
    setBuckets((prev) => {
      const next = prev.map((b) => ({ ...b, evidenceKeys: [...b.evidenceKeys] }));
      const b = next[bucketIndex];
      if (!b) return prev;
      const set = new Set(b.evidenceKeys);
      if (set.has(key)) set.delete(key);
      else set.add(key);
      b.evidenceKeys = Array.from(set);
      return next;
    });
  };

  const updateBucketField = (bucketIndex, field, value) => {
    setBuckets((prev) => {
      const next = [...prev];
      if (!next[bucketIndex]) return prev;
      next[bucketIndex] = { ...next[bucketIndex], [field]: value };
      return next;
    });
  };

  const applyReasoningStarter = (bucketIndex, prefix) => {
    setBuckets((prev) => {
      const next = [...prev];
      const b = next[bucketIndex];
      if (!b) return prev;
      const cur = b.reasoning || "";
      const nextText = cur.trim() ? `${prefix}${cur}` : `${prefix}`;
      next[bucketIndex] = { ...b, reasoning: nextText };
      return next;
    });
  };

  const canGoNext = () => {
    switch (flowStep) {
      case STEP_WELCOME:
      case STEP_BIG_PICTURE:
      case STEP_EXPLAIN_BUCKETS:
        return true;
      case STEP_PATTERN:
        if (!patternPair) return true;
        return patternChoice.length > 0;
      case STEP_B1_SCAFFOLD:
      case STEP_B2_SCAFFOLD:
      case STEP_B3_SCAFFOLD: {
        const i = bucketIndexForStep(flowStep);
        return (buckets[i]?.claim || "").trim().length > 0;
      }
      case STEP_B1_ROLE:
      case STEP_B2_ROLE:
      case STEP_B3_ROLE: {
        const i = bucketIndexForStep(flowStep);
        return (buckets[i]?.paragraphRole || "").trim().length > 0;
      }
      case STEP_B1_EVIDENCE:
      case STEP_B2_EVIDENCE:
      case STEP_B3_EVIDENCE: {
        const i = bucketIndexForStep(flowStep);
        return (buckets[i]?.evidenceKeys || []).length > 0;
      }
      case STEP_B1_REASONING:
      case STEP_B2_REASONING:
      case STEP_B3_REASONING: {
        const i = bucketIndexForStep(flowStep);
        return (buckets[i]?.reasoning || "").trim().length > 0;
      }
      case STEP_THIRD_DECISION:
        return false;
      case STEP_REFLECTION:
        return (reflection || "").trim().length >= 12;
      default:
        return false;
    }
  };

  const goNext = async () => {
    if (!canGoNext()) return;
    await flushSave();
    if (flowStep === STEP_B2_REASONING) {
      setFlowStep(STEP_THIRD_DECISION);
      return;
    }
    if (flowStep === STEP_B3_REASONING) {
      setFlowStep(STEP_REFLECTION);
      return;
    }
    setFlowStep((s) => s + 1);
  };

  const goBack = async () => {
    await flushSave();
    if (flowStep === STEP_WELCOME) return;
    if (flowStep === STEP_REFLECTION) {
      if (wantThirdBucket === true) setFlowStep(STEP_B3_REASONING);
      else setFlowStep(STEP_THIRD_DECISION);
      return;
    }
    if (flowStep === STEP_THIRD_DECISION) {
      setFlowStep(STEP_B2_REASONING);
      return;
    }
    if (flowStep === STEP_B3_SCAFFOLD) {
      setFlowStep(STEP_THIRD_DECISION);
      return;
    }
    setFlowStep((s) => s - 1);
  };

  const chooseThirdBucket = async (yes) => {
    await flushSave();
    if (yes) {
      setWantThirdBucket(true);
      setBuckets((prev) => {
        if (prev.length >= 3) return prev;
        return [...prev, emptyBucket()];
      });
      setFlowStep(STEP_B3_SCAFFOLD);
    } else {
      setWantThirdBucket(false);
      setBuckets((prev) => prev.slice(0, 2));
      setFlowStep(STEP_REFLECTION);
    }
  };

  const completeModule = async () => {
    if (!canGoNext()) return;
    const email = session?.user?.email;
    if (!email) return;
    await flushSave();
    const slice =
      wantThirdBucket === true ? buckets.slice(0, 3) : buckets.slice(0, 2);
    await logActivity(email, "module_completed", {
      module: 4,
      bucketCount: slice.length,
      reflectionLength: reflection.trim().length,
    });
    router.push("/modules/4/success");
  };

  const renderQuoteGroups = (bucketIndex) => {
    const sourceLabels = { speech: "Speech", letter: "Letter" };

    return (
      <div className="space-y-6">
        {["speech", "letter"].map((src) => (
          <div key={src} className="space-y-3">
            <h4 className="text-sm font-semibold text-theme-blue">
              {sourceLabels[src]}
            </h4>
            {APPEALS.map((appeal) => {
              const list = groupedQuotes[src][appeal] || [];
              return (
                <div
                  key={`${src}-${appeal}`}
                  className="rounded-lg border border-theme-blue/20 bg-theme-blue/5 p-3 space-y-2 text-left"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-theme-dark/80">
                    {appeal}
                  </p>
                  {list.length === 0 ? (
                    <p className="text-xs text-theme-dark/65">
                      No saved quote for this slot in Module 2 yet.
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {list.map((row) => {
                        const key = tchartEntryKey(row);
                        const checked = (buckets[bucketIndex]?.evidenceKeys || []).includes(
                          key
                        );
                        const q = (row.quote || "").trim();
                        const o = (row.observation || "").trim();
                        const preview =
                          q.slice(0, 160) + (q.length > 160 ? "…" : "");
                        return (
                          <li key={key}>
                            <label
                              className={`${CHOICE_ROW_CLASS} gap-2 py-2 items-start`}
                            >
                              <input
                                type="checkbox"
                                className="mt-1 shrink-0"
                                checked={checked}
                                onChange={() => toggleEvidenceKey(bucketIndex, key)}
                              />
                              <span className="text-xs text-theme-dark/90 leading-relaxed">
                                <span className="font-medium text-theme-dark block">
                                  {preview || "(No quote text)"}
                                </span>
                                {o ? (
                                  <span className="text-theme-dark/75 block mt-1">
                                    Your note: {o.slice(0, 200)}
                                    {o.length > 200 ? "…" : ""}
                                  </span>
                                ) : null}
                              </span>
                            </label>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  const panelClass =
    "rounded-xl border border-theme-blue/30 bg-white p-4 shadow-sm space-y-4 text-left";

  const roleOpts = paragraphRoleOptions(structureChoice);

  let main = null;

  if (flowStep === STEP_WELCOME) {
    main = (
      <div className={panelClass}>
        <h2 className="text-2xl font-extrabold text-theme-blue">
          Welcome to Module 4
        </h2>
        <p className="text-sm font-semibold text-theme-dark">
          What you will do: move from analysis to body-paragraph plans
        </p>
        <StepGuidanceBox label="Why this matters">
          <p>
            You already did close reading in Module 2 and built a thesis in Module 3.
            This module shows how to turn that work into clear paragraph ideas—one small
            step at a time.
          </p>
          <p className="mt-2">
            A teacher would call this moving from <strong>evidence and notes</strong> to{" "}
            <strong>paragraph plans</strong> that support your argument.
          </p>
        </StepGuidanceBox>
        <StepMeaningBox label="How this helps your essay">
          <p>
            Each step builds a bridge toward full body paragraphs you will outline and
            draft later. You are not writing the whole essay here—just making the next
            layer clear.
          </p>
        </StepMeaningBox>
        <StepActionHeading>
          Your turn: press Continue when you are ready to review your big picture.
        </StepActionHeading>
      </div>
    );
  } else if (flowStep === STEP_BIG_PICTURE) {
    main = (
      <div className={panelClass}>
        <h2 className="text-xl font-extrabold text-theme-blue">
          Review your big picture from Module 3
        </h2>
        <p className="text-sm font-semibold text-theme-dark">
          What you will do: read your saved choices—nothing to type on this screen
        </p>
        <StepGuidanceBox label="Why this matters">
          <p>
            Before you plan paragraphs, reconnect to the audience, purpose, and thesis
            you already chose. That keeps every paragraph idea tied to your argument.
          </p>
        </StepGuidanceBox>

        <StepMeaningBox label="What this means">
          <p className="font-medium text-theme-dark">{THESIS_BRIDGE_COPY}</p>
        </StepMeaningBox>

        <StepGuidanceBox label="Think about this">
          <p className="text-base font-semibold text-theme-dark">{GUIDING_QUESTION}</p>
          <p className="mt-2 text-sm">
            Ask yourself this whenever you pick an idea, a quote, or a sentence—you are
            checking that the paragraph still serves your thesis.
          </p>
        </StepGuidanceBox>

        <StepReferenceNote title="From Module 3 — for reference">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg border border-theme-blue/25 bg-white p-3">
            <p className="font-semibold text-theme-dark mb-2">
              Speech — <em>I Have a Dream</em>
            </p>
            <p>
              <span className="font-semibold">Audience: </span>
              {speechAudience}
            </p>
            <p className="mt-1">
              <span className="font-semibold">Purpose: </span>
              {speechPurpose}
            </p>
          </div>
          <div className="rounded-lg border border-theme-orange/30 bg-white p-3">
            <p className="font-semibold text-theme-dark mb-2">
              Letter — <em>Letter from Birmingham Jail</em>
            </p>
            <p>
              <span className="font-semibold">Audience: </span>
              {letterAudience}
            </p>
            <p className="mt-1">
              <span className="font-semibold">Purpose: </span>
              {letterPurpose}
            </p>
          </div>
        </div>
        </StepReferenceNote>

        {structureLabel ? (
          <StepReferenceNote title="Organization choice (from Module 3)">
            <p className="text-theme-dark/90">{structureLabel}</p>
          </StepReferenceNote>
        ) : (
          <StepGuidanceBox label="Tip">
            <p>
              If you have not chosen an organization pattern in Module 3 yet, you can
              still continue—we will offer flexible paragraph ideas.
            </p>
          </StepGuidanceBox>
        )}

        {thesis ? (
          <StepReferenceNote title="Working thesis (from Module 3)">
            <p className="text-theme-dark/90 whitespace-pre-wrap">{thesis}</p>
          </StepReferenceNote>
        ) : (
          <StepGuidanceBox label="Tip">
            <p>
              No thesis text on file yet. Consider finishing Module 3 first so this
              module can stay tightly focused on proving one argument.
            </p>
          </StepGuidanceBox>
        )}
        <StepGuidanceBox label="Tip">
          <p>
            You may group more than one idea into a paragraph, or you may build one
            clear idea per paragraph. We will guide you step by step.
          </p>
        </StepGuidanceBox>
        <StepActionHeading>
          Your turn: press Continue when you have read your big picture.
        </StepActionHeading>
      </div>
    );
  } else if (flowStep === STEP_EXPLAIN_BUCKETS) {
    main = (
      <div className={panelClass}>
        <h2 className="text-xl font-extrabold text-theme-blue">
          Learn what a “bucket” is
        </h2>
        <p className="text-sm font-semibold text-theme-dark">
          What you will do: read the explanation—no typing yet
        </p>
        <StepGuidanceBox label="Why this matters">
          <p>
            A <strong>bucket</strong> is a paragraph plan. Later, each bucket becomes a
            full body paragraph in your essay. Inside one bucket you will keep: the{" "}
            <strong>main idea</strong> of that paragraph, the{" "}
            <strong>quotes</strong> that belong there, and{" "}
            <strong>sentences that explain</strong> why those quotes matter.
          </p>
          <p className="mt-2">
            You will complete <strong>two</strong> buckets for sure. If your thesis
            needs another layer, you may add a third.
          </p>
        </StepGuidanceBox>
        <StepMeaningBox label="What this means">
          <p>{MEANING_BODY_PARAGRAPH}</p>
        </StepMeaningBox>
        <StepActionHeading>
          Your turn: press Continue when you are ready to practice spotting a pattern.
        </StepActionHeading>
      </div>
    );
  } else if (flowStep === STEP_PATTERN) {
    main = (
      <div className={panelClass}>
        <h2 className="text-xl font-extrabold text-theme-blue">
          Spot a pattern across two texts
        </h2>
        <p className="text-sm font-semibold text-theme-dark">
          What you will do: compare two excerpts, then choose one response
        </p>
        <StepGuidanceBox label="Why this matters">
          <p>
            A <strong>pattern</strong> is something you notice that{" "}
            <em>shows up in more than one place</em>. Here you compare the{" "}
            <strong>same appeal</strong> (for example, ethos) in the speech and in the
            letter, then name the idea King is developing in both moments.
          </p>
        </StepGuidanceBox>

        {patternPair ? (
          <>
            <StepReferenceNote title="Compare — your Module 2 notes">
              <p className="text-sm font-semibold text-theme-dark mb-2">
                {patternPair.appeal} in the speech and {patternPair.appeal} in the
                letter
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <CompactAnalysisCard
                  title={`Speech · ${patternPair.appeal}`}
                  row={patternPair.speechRow}
                />
                <CompactAnalysisCard
                  title={`Letter · ${patternPair.appeal}`}
                  row={patternPair.letterRow}
                />
              </div>
            </StepReferenceNote>
            <StepActionHeading>
              Your turn: choose the option that best fits both excerpts.
            </StepActionHeading>
            <p className="text-sm font-medium text-theme-dark">
              What idea is King developing in BOTH of these moments?
            </p>
            <div className="space-y-2">
              {PATTERN_OPTIONS.map((opt) => (
                <label key={opt.id} className={CHOICE_ROW_CLASS}>
                  <input
                    type="radio"
                    name="patternChoice"
                    className="mt-1 shrink-0"
                    checked={patternChoice === opt.id}
                    onChange={() => setPatternChoice(opt.id)}
                  />
                  <span className="text-sm text-theme-dark/90">{opt.label}</span>
                </label>
              ))}
            </div>
            {patternChoice ? (
              <StepMeaningBox label="What this means">
                <p>{patternStepFeedbackForChoice(patternChoice)}</p>
              </StepMeaningBox>
            ) : null}
            <StepGuidanceBox label="Tip">
              <p>
                There is not always one “right” answer. The goal is to practice naming
                what repeats—so your later paragraphs are built on real connections, not
                random details.
              </p>
            </StepGuidanceBox>
          </>
        ) : (
          <>
            <StepGuidanceBox label="Tip">
              <p>
                We could not find a matching pair of speech and letter notes for the
                same appeal yet. Add or balance your Module 2 charts if you can, then
                come back—or continue for now; you will still get scaffolded paragraph
                ideas ahead.
              </p>
            </StepGuidanceBox>
            <StepActionHeading>
              Your turn: press Continue when you are ready for paragraph ideas.
            </StepActionHeading>
          </>
        )}
      </div>
    );
  } else if (
    flowStep === STEP_B1_SCAFFOLD ||
    flowStep === STEP_B2_SCAFFOLD ||
    flowStep === STEP_B3_SCAFFOLD
  ) {
    const i = bucketIndexForStep(flowStep);
    const n = i + 1;
    const b = buckets[i] || emptyBucket();
    const isFirstParagraphScaffold = flowStep === STEP_B1_SCAFFOLD;
    const role = getScaffoldParagraphRole(structureChoice, i);
    const copy = scaffoldStepTeacherCopy(
      role,
      n,
      isFirstParagraphScaffold && role === "general"
    );

    main = (
      <div className={panelClass}>
        {isFirstParagraphScaffold ? (
          <>
            <StepReferenceNote title="Your essay plan so far">
              <dl className="space-y-3 text-sm text-theme-dark/90">
                <div>
                  <dt className="font-semibold text-theme-dark">Thesis</dt>
                  <dd className="mt-0.5 whitespace-pre-wrap">
                    {thesis || "Not set yet"}
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-theme-dark">Structure choice</dt>
                  <dd className="mt-0.5">{structurePlanLabel(structureChoice)}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-theme-dark">Pattern choice</dt>
                  <dd className="mt-0.5">{patternPlanLabel(patternChoice)}</dd>
                </div>
              </dl>
            </StepReferenceNote>
            <p className="text-sm font-medium text-theme-dark leading-relaxed">
              Which part of your thesis are you starting to prove in this paragraph?
            </p>
          </>
        ) : null}

        <h2 className="text-xl font-extrabold text-theme-blue">{copy.title}</h2>
        <p className="text-sm font-semibold text-theme-dark">
          What you will do: {copy.whatYouWillDo}
        </p>
        <StepGuidanceBox label="Why this matters">
          {isFirstParagraphScaffold ? (
            <>
              <p>
                Each body paragraph should prove one part of your thesis. This paragraph
                is your chance to develop one clear idea that supports your overall
                argument.
              </p>
              {copy.focusLine ? (
                <p className="mt-2">{copy.focusLine}</p>
              ) : null}
            </>
          ) : (
            <>
              <p>{GUIDANCE_THESIS_FOR_PARAGRAPH_IDEA}</p>
              <p className="mt-2 font-medium text-theme-dark">{GUIDING_QUESTION}</p>
              {copy.focusLine ? <p className="mt-2">{copy.focusLine}</p> : null}
              <p className="mt-2">
                Start from a suggestion tied to your thesis and organization, or write
                your own. Whichever you pick, revise the wording so it sounds like{" "}
                <em>your</em> thinking.
              </p>
            </>
          )}
        </StepGuidanceBox>
        <StepGuidanceBox label="Think about this">
          <p>{scaffoldThinkAboutLine(role, isFirstParagraphScaffold)}</p>
        </StepGuidanceBox>
        {role !== "general" ? (
          <StepGuidanceBox label="Tip">
            <p>
              The suggestions below are narrowed to match your organization plan for
              this paragraph. You can still choose “write my own” if none of them fit.
            </p>
          </StepGuidanceBox>
        ) : null}
        <StepActionHeading>
          Your turn: select one suggestion (or “write my own”), then type or edit your
          paragraph idea below.
        </StepActionHeading>
        <div className="space-y-2">
          {scaffoldSuggestions.map((s) => (
            <label key={s.id} className={CHOICE_ROW_CLASS}>
              <input
                type="radio"
                name={`suggestion-${i}`}
                className="mt-1 shrink-0"
                checked={b.suggestionId === s.id}
                onChange={() => {
                  updateBucketField(i, "suggestionId", s.id);
                  updateBucketField(i, "claim", s.label);
                }}
              />
              <span className="text-sm text-theme-dark/90 leading-relaxed">
                {s.label}
              </span>
            </label>
          ))}
          <label
            className={`${CHOICE_ROW_CLASS} border-theme-gold/50 bg-theme-gold/5`}
          >
            <input
              type="radio"
              name={`suggestion-${i}`}
              className="mt-1 shrink-0"
              checked={b.suggestionId === CUSTOM_SUGGESTION_ID}
              onChange={() => {
                updateBucketField(i, "suggestionId", CUSTOM_SUGGESTION_ID);
              }}
            />
            <span className="text-sm font-semibold text-theme-dark">
              I’ll write my own paragraph idea
            </span>
          </label>
        </div>
        <div>
          <label className="block text-sm font-bold text-theme-dark mb-1">
            Your paragraph idea — type here
          </label>
          <textarea
            value={b.claim}
            onChange={(e) => updateBucketField(i, "claim", e.target.value)}
            className={`${FIELD_INPUT_CLASS} min-h-[100px]`}
            placeholder="Use a suggestion above, or type your own idea in your own words…"
          />
        </div>
        {(b.claim || "").trim() ? (
          <StepMeaningBox label="What this means">
            <p>{MEANING_BODY_PARAGRAPH}</p>
          </StepMeaningBox>
        ) : null}
      </div>
    );
  } else if (
    flowStep === STEP_B1_ROLE ||
    flowStep === STEP_B2_ROLE ||
    flowStep === STEP_B3_ROLE
  ) {
    const i = bucketIndexForStep(flowStep);
    const n = i + 1;
    const b = buckets[i] || emptyBucket();
    main = (
      <div className={panelClass}>
        <h2 className="text-xl font-extrabold text-theme-blue">
          Paragraph {n}: decide what this paragraph does
        </h2>
        <p className="text-sm font-semibold text-theme-dark">
          What you will do: pick the option that describes this paragraph’s job
        </p>
        <StepGuidanceBox label="Why this matters">
          <p>
            Essays are not a list of quotes—they are a <strong>sequence of moves</strong>.
            Choosing the job of this paragraph helps you line it up with the
            organization you picked in Module 3.
          </p>
        </StepGuidanceBox>
        <StepReferenceNote title="Paragraph idea you chose (read-only)">
          {(b.claim || "").trim() || "(Add an idea on the previous step.)"}
        </StepReferenceNote>
        <StepActionHeading>
          Your turn: select one role for this paragraph.
        </StepActionHeading>
        <div className="space-y-2">
          {roleOpts.map((opt) => (
            <label key={opt.id} className={CHOICE_ROW_CLASS}>
              <input
                type="radio"
                name={`role-${i}`}
                className="mt-1 shrink-0"
                checked={b.paragraphRole === opt.id}
                onChange={() => updateBucketField(i, "paragraphRole", opt.id)}
              />
              <span className="text-sm text-theme-dark/90">{opt.label}</span>
            </label>
          ))}
        </div>
        <StepMeaningBox label="How this helps your essay">
          <p>{MEANING_BODY_PARAGRAPH}</p>
        </StepMeaningBox>
      </div>
    );
  } else if (
    flowStep === STEP_B1_EVIDENCE ||
    flowStep === STEP_B2_EVIDENCE ||
    flowStep === STEP_B3_EVIDENCE
  ) {
    const i = bucketIndexForStep(flowStep);
    const n = i + 1;
    main = (
      <div className={panelClass}>
        <h2 className="text-xl font-extrabold text-theme-blue">
          Paragraph {n}: choose evidence
        </h2>
        <p className="text-sm font-semibold text-theme-dark">
          What you will do: check only the quotes that fit this paragraph idea
        </p>
        <StepGuidanceBox label="Why this matters">
          <p>
            You are not collecting random quotes—you are choosing lines that{" "}
            <strong>belong to this paragraph’s job</strong>.
          </p>
        </StepGuidanceBox>
        <StepGuidanceBox label="Think about this">
          <p className="font-semibold text-theme-dark mb-1">
            Does this quote fit your bucket?
          </p>
          <p>
            For each quote you consider, ask whether it really supports{" "}
            <em>this</em> paragraph idea—not just whether it is a “good” quote in
            general. If it does not fit, leave it unchecked.
          </p>
        </StepGuidanceBox>
        <StepReferenceNote title="Paragraph idea you are supporting (read-only)">
          {(buckets[i]?.claim || "").trim() || "—"}
        </StepReferenceNote>
        <StepActionHeading>
          Your turn: use the checkboxes below to select evidence.
        </StepActionHeading>
        {renderQuoteGroups(i)}
        <StepMeaningBox label="What this means">
          <p>{MEANING_BODY_PARAGRAPH}</p>
        </StepMeaningBox>
      </div>
    );
  } else if (
    flowStep === STEP_B1_REASONING ||
    flowStep === STEP_B2_REASONING ||
    flowStep === STEP_B3_REASONING
  ) {
    const i = bucketIndexForStep(flowStep);
    const n = i + 1;
    const b = buckets[i] || emptyBucket();
    main = (
      <div className={panelClass}>
        <h2 className="text-xl font-extrabold text-theme-blue">
          Paragraph {n}: build your explanation
        </h2>
        <p className="text-sm font-semibold text-theme-dark">
          What you will do: review your plan below, use optional starters, then type your
          reasoning
        </p>
        <StepGuidanceBox label="Why this matters">
          <p>
            Reasoning is where analysis becomes writing. The starters are optional
            training wheels: tap one to drop in an opening phrase, then finish the
            thought in your own words. You can mix more than one idea in the box.
          </p>
        </StepGuidanceBox>

        <ParagraphPlanPanel
          paragraphNumber={n}
          bucket={b}
          tchartByKey={tchartByKey}
        />

        <StepActionHeading>
          Your turn: optional — tap a starter, then write in the box below.
        </StepActionHeading>
        <div className="flex flex-wrap gap-2">
          {REASONING_STARTERS.map((st) => (
            <button
              key={st.id}
              type="button"
              className="text-left text-xs font-medium px-3 py-2 rounded-md border-2 border-theme-blue/40 bg-white text-theme-dark hover:bg-theme-blue/10 transition shadow-sm"
              onClick={() => applyReasoningStarter(i, st.prefix)}
            >
              {st.label}
            </button>
          ))}
        </div>
        <StepGuidanceBox label="Tip">
          <p>
            For “King uses ___ to ___, which helps ___,” write the three parts right
            after the starter text in the box.
          </p>
        </StepGuidanceBox>

        <div>
          <label className="block text-sm font-bold text-theme-dark mb-1" htmlFor={`reasoning-${i}`}>
            Now explain it in your own words
          </label>
          <p className="text-sm text-theme-dark/80 mb-2 leading-relaxed">
            Use your idea and evidence above to explain how this paragraph supports your
            thesis.
          </p>
          <textarea
            id={`reasoning-${i}`}
            value={b.reasoning}
            onChange={(e) => updateBucketField(i, "reasoning", e.target.value)}
            className={`${FIELD_INPUT_CLASS} min-h-[140px]`}
            placeholder="Example: This shows that King is framing nonviolence as moral strength, not weakness, which helps skeptical readers take his strategy seriously."
          />
        </div>

        <StepMeaningBox label="What this means">
          <p>{REASONING_PLAN_MEANING}</p>
        </StepMeaningBox>
      </div>
    );
  } else if (flowStep === STEP_THIRD_DECISION) {
    main = (
      <div className={panelClass}>
        <h2 className="text-xl font-extrabold text-theme-blue">
          Decide on a third body paragraph
        </h2>
        <p className="text-sm font-semibold text-theme-dark">
          What you will do: choose Yes or No — no typing
        </p>
        <StepGuidanceBox label="Why this matters">
          <p>
            Some thesis plans need three body moves; others are stronger with two tight
            paragraphs. Pick what matches the organization you chose in Module 3.
          </p>
        </StepGuidanceBox>
        <StepActionHeading>Your turn: choose one button.</StepActionHeading>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => chooseThirdBucket(true)}
            className="px-4 py-2 rounded-lg bg-theme-green text-white font-medium hover:opacity-90"
          >
            Yes — add paragraph 3
          </button>
          <button
            type="button"
            onClick={() => chooseThirdBucket(false)}
            className="px-4 py-2 rounded-lg border border-theme-dark/20 bg-white text-theme-dark font-medium hover:bg-theme-light"
          >
            No — finish with two
          </button>
        </div>
      </div>
    );
  } else if (flowStep === STEP_REFLECTION) {
    main = (
      <div className={panelClass}>
        <h2 className="text-xl font-extrabold text-theme-blue">Reflect on your plan</h2>
        <p className="text-sm font-semibold text-theme-dark">
          What you will do: type a short reflection in the box
        </p>
        <StepGuidanceBox label="Why this matters">
          <p>
            Look back at the paragraph moves you planned. How do they work together to
            prove your thesis? What might you reorder or deepen when you outline in
            Module 5?
          </p>
        </StepGuidanceBox>
        <StepActionHeading>Your turn: write your reflection below.</StepActionHeading>
        <div>
          <label className="block text-sm font-bold text-theme-dark mb-1">
            Your reflection — type here
          </label>
          <textarea
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            className={`${FIELD_INPUT_CLASS} min-h-[140px]`}
            placeholder="A few clear sentences is enough."
          />
        </div>
        <StepGuidanceBox label="Tip">
          <p>At least one or two sentences (about 12 characters) to finish the module.</p>
        </StepGuidanceBox>
      </div>
    );
  }

  const showBack = flowStep > STEP_WELCOME;
  const atSoftIntro = flowStep <= STEP_PATTERN;
  const atDecision = flowStep === STEP_THIRD_DECISION;
  const atReflection = flowStep === STEP_REFLECTION;
  const showPrimaryAdvance =
    !atDecision && !atReflection && flowStep <= STEP_B3_REASONING;

  const showSources =
    flowStep >= STEP_WELCOME && flowStep <= STEP_REFLECTION;

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 pb-10">
      <div className="text-left text-xs text-theme-dark/60">
        Module 4 · step {flowStep + 1} of {LAST_STEP + 1}
      </div>

      {showSources ? (
        <ModuleSourceAccess
          speechOriginalUrl={speechOriginalUrl}
          letterOriginalUrl={letterOriginalUrl}
        />
      ) : null}

      {main}

      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          {showBack ? (
            <button
              type="button"
              onClick={() => goBack()}
              className="px-4 py-2 rounded-lg bg-gray-200 text-theme-dark hover:bg-gray-300"
            >
              Back
            </button>
          ) : null}
        </div>
        <div className="flex gap-2">
          {showPrimaryAdvance ? (
            <button
              type="button"
              onClick={() => goNext()}
              disabled={!canGoNext()}
              className="px-4 py-2 rounded-lg bg-theme-blue text-white font-medium disabled:opacity-50"
            >
              {atSoftIntro ? "Continue" : "Next"}
            </button>
          ) : null}
          {atReflection ? (
            <button
              type="button"
              onClick={() => completeModule()}
              disabled={!canGoNext()}
              className="px-4 py-2 rounded-lg bg-theme-blue text-white font-medium disabled:opacity-50"
            >
              Finish → Module 5 path
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
