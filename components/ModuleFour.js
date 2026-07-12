"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { logActivity } from "@/lib/logActivity";
import {
  deriveValidModule3ConnectionsByRowKey,
  enrichEvidencePoolWithModule3Connections,
  getModule3ConnectionForEvidenceKey,
  evidenceIdsMatch,
  resolveSavedEvidenceSlots,
} from "@/lib/module4/module4EvidenceContinuity";
import {
  buildModule4EvidencePool,
  evidenceArtifactToRow,
  evidenceRowKey,
  patternReviewEvidenceRows,
  resolveBucketSuggestions,
  resolveInstructionalThesis,
  resolvePatternPlanLabel,
  resolveProofPlan,
  resolveSelectedPattern,
} from "@/lib/module4/module4InstructionalLogic";
import { findSuccessClusterArtifact } from "@/lib/module3/moduleThreeSuccessHelpers";
import {
  PARAGRAPH_JOB_DEFINITION,
  PARAGRAPH_POINT_DEFINITION,
  buildPriorParagraphJobSummaries,
  decodeCustomParagraphJob,
  encodeCustomParagraphJob,
  getPointJobPairingCoaching,
  getRepeatedJobCoaching,
  isCustomParagraphJob,
  labelForParagraphJob,
  paragraphJobChoicesForUi,
  pointStepQuestion,
  jobStepQuestion,
  proofPlanSlotForSuggestionId,
  recommendParagraphJob,
  resolveProofPlanSlots,
} from "@/lib/module4/module4PointJobHelpers";
import {
  canAdvanceModule4Step,
  evaluateModule4Advance,
  isParagraphMechanicallyPlanned,
  plannedParagraphIndices,
  validateParagraphEvidence,
  validateParagraphJob,
  validateParagraphPoint,
  validateParagraphReasoning,
} from "@/lib/module4/module4ValidityHelpers";
import {
  buildModule4ParagraphPlanArtifact,
  reasoningReadyNextActionLabel,
} from "@/lib/module4/module4ParagraphPlanArtifactHelpers";
import {
  getEvidenceReuseCue,
  getJobEvidenceSourceAlignmentCue,
  CP6_LAYOUT_CONTRACT,
} from "@/lib/module4/module4EvidenceCoachingHelpers";
import { normalizeEvidenceSnippets } from "@/lib/module4/module4SnippetNormalize";
import { parseModule2Observation } from "@/lib/parseModule2Observation";
import { upsertParagraphPlanArtifact } from "@/lib/artifacts/writeArtifacts";
import ModuleThreeStepFrame from "@/components/module3/ModuleThreeStepFrame";
import { WorkingSetSection } from "@/components/module3/ModuleThreeDeskFrame";
import ModuleFourReferenceShelf from "@/components/module4/ModuleFourReferenceShelf";
import ModuleFourParagraphPlanArtifact from "@/components/module4/ModuleFourParagraphPlanArtifact";
import ModuleFourFinalReviewStep from "@/components/module4/ModuleFourFinalReviewStep";
import {
  bucketIndexForFlowStep,
  getModule4StepPresentation,
} from "@/components/module4/module4StepPresentation";
import {
  FLOW_VERSION,
  LAST_STEP,
  STEP_B1_EVIDENCE,
  STEP_B1_REASONING,
  STEP_B1_ROLE,
  STEP_B1_SCAFFOLD,
  STEP_B2_EVIDENCE,
  STEP_B2_REASONING,
  STEP_B2_ROLE,
  STEP_B2_SCAFFOLD,
  STEP_B3_EVIDENCE,
  STEP_B3_REASONING,
  STEP_B3_ROLE,
  STEP_B3_SCAFFOLD,
  STEP_BIG_PICTURE,
  STEP_EXPLAIN_BUCKETS,
  STEP_HANDOFF,
  STEP_PATTERN,
  STEP_REFLECTION,
  STEP_THIRD_DECISION,
  STEP_WELCOME,
} from "@/components/module4/module4FlowSteps";
import ModuleFourHandoffStep from "@/components/module4/ModuleFourHandoffStep";
import {
  buildModule4HandoffPresentation,
  getModule4PresentationChrome,
  hasValidSavedModule3Pattern,
  migrateOpeningFlowStep,
  resolveModule4BackTarget,
} from "@/lib/module4/module4HandoffHelpers";
import { mlkRhetoricalAnalysisAssignment } from "@/lib/assignments/mlkRhetoricalAnalysis";

const EMPTY_UPSTREAM_ARTIFACTS = {
  thesisArtifact: null,
  claimArtifact: null,
  ideaArtifact: null,
  patternArtifacts: [],
  evidenceClusterArtifacts: [],
  evidenceArtifacts: [],
  sourceContextArtifacts: [],
  paragraphPlanArtifacts: [],
  selectedClusterId: null,
  selectedPatternId: null,
};

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
  "Everything you do in this module should help you prove your thesis. Each paragraph plan you build will become a body paragraph in your essay.";

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

function FieldValidityStatus({ result }) {
  if (!result) return null;
  const tone =
    result.state === "ready"
      ? "border-theme-green/35 bg-theme-green/5 text-theme-green"
      : result.state === "incomplete" || result.state === "unresolved"
        ? "border-theme-orange/35 bg-theme-orange/5 text-theme-orange"
        : "border-border-soft bg-surface-soft/60 text-text-muted";
  return (
    <div
      className={`mt-2 rounded-lg border px-3 py-2 text-xs leading-relaxed break-words ${tone}`}
      role="status"
    >
      <p className="font-semibold">{result.message}</p>
      {result.countHelper ? (
        <p className="mt-1 text-[11px] opacity-90">{result.countHelper}</p>
      ) : null}
    </div>
  );
}

const MODULE4_STEP_CONSTANTS = {
  STEP_HANDOFF,
  STEP_WELCOME,
  STEP_BIG_PICTURE,
  STEP_EXPLAIN_BUCKETS,
  STEP_PATTERN,
  STEP_B1_SCAFFOLD,
  STEP_B1_ROLE,
  STEP_B1_EVIDENCE,
  STEP_B1_REASONING,
  STEP_B2_SCAFFOLD,
  STEP_B2_ROLE,
  STEP_B2_EVIDENCE,
  STEP_B2_REASONING,
  STEP_THIRD_DECISION,
  STEP_B3_SCAFFOLD,
  STEP_B3_ROLE,
  STEP_B3_EVIDENCE,
  STEP_B3_REASONING,
  STEP_REFLECTION,
};

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
    "That’s completely fine—you don’t have to lock in a label yet. What I want you to remember is that when you do notice an idea that echoes across both texts, you are often right at the start of what can become a strong body paragraph. You’ll keep practicing that as you build your paragraph plans.",
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
function ParagraphPlanPanel({
  paragraphNumber,
  bucket,
  evidenceSlots = [],
}) {
  const keys = Array.isArray(bucket?.evidenceKeys) ? bucket.evidenceKeys : [];
  const claim = (bucket?.claim || "").trim();
  const visibleSlots = (Array.isArray(evidenceSlots) ? evidenceSlots : []).filter(
    (slot) => !slot?.suppressDisplay
  );

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
          {claim || "Add your paragraph idea on the previous step."}
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
          {visibleSlots.map((slot, index) => {
            if (slot.status === "missing") {
              return (
                <div
                  key={`missing-${slot.savedKey}-${index}`}
                  className="rounded-lg border border-theme-orange/35 bg-theme-orange/5 p-3 text-sm text-theme-dark/80"
                >
                  This evidence slot is no longer linked to your saved evidence notes.
                </div>
              );
            }

            const row = slot.row;
            const parsed = parseModule2Observation(row?.observation);
            const quote = (slot.quote || "").trim();
            const module2Note =
              (parsed.main || "").trim() ||
              (slot.observation || "").trim();
            const appeal = String(row?.category || "").toLowerCase();
            const module3Connection = slot.module3Connection;

            return (
              <div
                key={`${slot.savedKey}-${index}`}
                className="rounded-lg border border-theme-blue/25 bg-theme-light/90 p-3 space-y-2 text-sm text-left"
              >
                {slot.compatibilityLabel ? (
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-theme-dark/55">
                    {slot.compatibilityLabel}
                  </p>
                ) : null}
                <div className="flex flex-wrap gap-2 text-xs font-semibold text-theme-dark">
                  {row?.type ? (
                    <span className="rounded border border-theme-dark/15 bg-white/90 px-2 py-1">
                      Source: {sourceTypeLabel(row.type)}
                    </span>
                  ) : null}
                  {appeal ? (
                    <span className="rounded border border-theme-dark/15 bg-white/90 px-2 py-1 capitalize">
                      Appeal: {appeal}
                    </span>
                  ) : null}
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
                {module2Note ? (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-theme-dark/55 mb-0.5">
                      Your Module 2 note
                    </p>
                    <p className="text-theme-dark/90 leading-relaxed">{module2Note}</p>
                  </div>
                ) : null}
                {module3Connection ? (
                  <div className="rounded-md border border-theme-orange/25 bg-theme-orange/5 p-2.5">
                    <p className="text-xs font-bold uppercase tracking-wide text-theme-orange mb-1.5">
                      {module3Connection.heading}
                    </p>
                    <p className="text-xs font-semibold text-theme-dark">
                      {module3Connection.relationLabel}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-theme-dark/90 whitespace-pre-wrap">
                      {module3Connection.note}
                    </p>
                  </div>
                ) : null}
                {parsed.audience || parsed.purpose ? (
                  <div className="rounded-md border border-theme-blue/20 bg-theme-blue/5 p-2.5 mt-1">
                    <p className="text-xs font-bold uppercase tracking-wide text-theme-blue mb-1.5">
                      Rhetorical situation (Module 2)
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
                  </div>
                ) : null}
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
  return bucketIndexForFlowStep(step);
}

function enrichBucketsForSave(bucketsSlice, resolveSlots) {
  return bucketsSlice.map((b) => {
    const keys = Array.isArray(b?.evidenceKeys) ? [...b.evidenceKeys] : [];
    const priorSnippets = normalizeEvidenceSnippets(b?.evidenceSnippets);
    const slots =
      typeof resolveSlots === "function"
        ? resolveSlots(b)
        : [];
    return {
      claim: b.claim,
      reasoning: b.reasoning,
      paragraphRole: b.paragraphRole || "",
      suggestionId: b.suggestionId || "",
      evidenceKeys: keys,
      evidenceSnippets: keys.map((k, index) => {
        const slot = slots[index];
        if (slot && (slot.quote || slot.observation)) {
          return {
            quote: slot.quote || "",
            observation: slot.observation || "",
          };
        }
        const prior = priorSnippets[index];
        if (prior && (prior.quote || prior.observation)) {
          return {
            quote: prior.quote || "",
            observation: prior.observation || "",
          };
        }
        return { quote: "", observation: "" };
      }),
    };
  });
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
  // FLOW_VERSION 3 keeps paragraph step numbers; opening steps migrate in the component
  // via migrateOpeningFlowStep once pattern availability is known.
  if (flow.v !== FLOW_VERSION && flow.v !== 2 && flow.v !== 3) {
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
  initialUpstreamArtifacts = EMPTY_UPSTREAM_ARTIFACTS,
  speechOriginalUrl = "",
  letterOriginalUrl = "",
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const hasLoggedStartRef = useRef(false);
  const saveTimerRef = useRef(null);

  const parsed = useMemo(() => {
    const base = parseInitialFromServer(initialStudentBuckets);
    const selected = resolveSelectedPattern(
      initialUpstreamArtifacts?.patternArtifacts
    );
    return {
      ...base,
      flowStep: migrateOpeningFlowStep({
        flowStep: base.flowStep,
        hasValidSavedPattern: hasValidSavedModule3Pattern(selected),
      }),
    };
  }, [initialStudentBuckets, initialUpstreamArtifacts]);

  const [flowStep, setFlowStep] = useState(parsed.flowStep);
  const [wantThirdBucket, setWantThirdBucket] = useState(parsed.wantThirdBucket);
  const [buckets, setBuckets] = useState(parsed.buckets);
  const [reflection, setReflection] = useState(parsed.reflection);
  const [patternChoice, setPatternChoice] = useState(parsed.patternChoice);

  const thesisArtifact = initialUpstreamArtifacts?.thesisArtifact ?? null;
  const claimArtifact = initialUpstreamArtifacts?.claimArtifact ?? null;
  const ideaArtifact = initialUpstreamArtifacts?.ideaArtifact ?? null;

  const thesis = useMemo(
    () => resolveInstructionalThesis({ thesisArtifact, initialModule3 }),
    [thesisArtifact, initialModule3]
  );

  const proofPlan = useMemo(
    () => resolveProofPlan(thesisArtifact),
    [thesisArtifact]
  );

  const selectedPattern = useMemo(
    () => resolveSelectedPattern(initialUpstreamArtifacts?.patternArtifacts),
    [initialUpstreamArtifacts]
  );

  const hasSavedPattern = hasValidSavedModule3Pattern(selectedPattern);

  // Checkpoint 2: collapse old opening screens onto handoff / pattern fallback.
  useEffect(() => {
    setFlowStep((current) => {
      const next = migrateOpeningFlowStep({
        flowStep: current,
        hasValidSavedPattern: hasSavedPattern,
      });
      return next === current ? current : next;
    });
  }, [hasSavedPattern]);

  const evidencePool = useMemo(() => {
    const basePool = buildModule4EvidencePool({
      evidenceArtifacts: initialUpstreamArtifacts?.evidenceArtifacts,
      evidenceClusterArtifacts: initialUpstreamArtifacts?.evidenceClusterArtifacts,
      selectedClusterId: initialUpstreamArtifacts?.selectedClusterId,
      legacyTchartEntries: initialTchartEntries,
    });

    const cluster = findSuccessClusterArtifact(
      initialUpstreamArtifacts?.evidenceClusterArtifacts,
      initialUpstreamArtifacts?.selectedClusterId
    );
    const clusterEvidenceIds = Array.isArray(cluster?.evidenceIds)
      ? cluster.evidenceIds
      : [];

    const connectionsByRowKey = deriveValidModule3ConnectionsByRowKey({
      evidenceMap: ideaArtifact?.evidenceMap,
      clusterEvidenceIds,
      evidencePool: basePool,
    });

    return enrichEvidencePoolWithModule3Connections(
      basePool,
      connectionsByRowKey
    );
  }, [initialUpstreamArtifacts, initialTchartEntries, ideaArtifact]);

  const handoffPresentation = useMemo(
    () =>
      buildModule4HandoffPresentation({
        thesis,
        proofPlan,
        selectedPattern,
        evidencePool,
      }),
    [thesis, proofPlan, selectedPattern, evidencePool]
  );

  const module3ConnectionsByKey = useMemo(() => {
    const cluster = findSuccessClusterArtifact(
      initialUpstreamArtifacts?.evidenceClusterArtifacts,
      initialUpstreamArtifacts?.selectedClusterId
    );
    return deriveValidModule3ConnectionsByRowKey({
      evidenceMap: ideaArtifact?.evidenceMap,
      clusterEvidenceIds: Array.isArray(cluster?.evidenceIds)
        ? cluster.evidenceIds
        : [],
      evidencePool,
    });
  }, [initialUpstreamArtifacts, ideaArtifact, evidencePool]);

  /** Full artifact + legacy corpus for resolving saved paragraph keys (shelf stays bounded). */
  const evidenceLookupRows = useMemo(() => {
    const artifactRows = (
      Array.isArray(initialUpstreamArtifacts?.evidenceArtifacts)
        ? initialUpstreamArtifacts.evidenceArtifacts
        : []
    )
      .map(evidenceArtifactToRow)
      .filter(Boolean);
    const legacyRows = (Array.isArray(initialTchartEntries)
      ? initialTchartEntries
      : []
    ).map((row) => ({
      ...row,
      evidenceKey: evidenceRowKey(row),
    }));
    const seen = new Set();
    const out = [];
    for (const row of [...artifactRows, ...legacyRows]) {
      const key = evidenceRowKey(row);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push(row);
    }
    return out;
  }, [initialUpstreamArtifacts, initialTchartEntries]);

  const resolveBucketEvidenceSlots = useCallback(
    (bucket) =>
      resolveSavedEvidenceSlots({
        evidenceKeys: bucket?.evidenceKeys,
        evidenceSnippets: bucket?.evidenceSnippets,
        clusterPool: evidencePool,
        lookupRows: evidenceLookupRows,
        connectionsByRowKey: module3ConnectionsByKey,
      }),
    [evidencePool, evidenceLookupRows, module3ConnectionsByKey]
  );

  const patternReviewRows = useMemo(
    () => patternReviewEvidenceRows(selectedPattern, evidencePool),
    [selectedPattern, evidencePool]
  );

  const structureChoice = initialModule3?.structure_choice || "";
  const structureLabel =
    STRUCTURE_LABELS[structureChoice] || structureChoice || "";
  const responses = initialModule3?.responses;

  const legacyBucketSuggestions = useMemo(
    () => buildBucketSuggestions(structureChoice, responses),
    [structureChoice, responses]
  );

  const allBucketSuggestions = useMemo(
    () =>
      resolveBucketSuggestions({
        proofPlan: Array.isArray(thesisArtifact?.proofPlan)
          ? thesisArtifact.proofPlan
          : proofPlan,
        legacySuggestions: legacyBucketSuggestions,
      }),
    [thesisArtifact, proofPlan, legacyBucketSuggestions]
  );

  const groupedQuotes = useMemo(
    () => groupTchartBySourceAndAppeal(evidencePool),
    [evidencePool]
  );

  const patternPair = useMemo(
    () => findFirstAppealPair(groupedQuotes),
    [groupedQuotes]
  );

  const patternPlanDisplay = useMemo(
    () => resolvePatternPlanLabel({ selectedPattern, patternChoice }),
    [selectedPattern, patternChoice]
  );

  const claimReference =
    typeof claimArtifact?.workingClaim === "string"
      ? claimArtifact.workingClaim.trim()
      : "";
  const ideaReference =
    typeof ideaArtifact?.statement === "string" ? ideaArtifact.statement.trim() : "";

  const assignmentQuestion = mlkRhetoricalAnalysisAssignment.essentialQuestion;

  const selectedCluster = useMemo(() => {
    const clusterId = initialUpstreamArtifacts?.selectedClusterId;
    if (!clusterId) return null;
    const clusters = initialUpstreamArtifacts?.evidenceClusterArtifacts || [];
    return (
      clusters.find((cluster) => cluster.id.endsWith(`:${clusterId}`)) ||
      clusters.find((cluster) => cluster.id === clusterId) ||
      null
    );
  }, [initialUpstreamArtifacts]);

  const patternShelfText = useMemo(() => {
    const fromArtifact =
      typeof selectedPattern?.text === "string" ? selectedPattern.text.trim() : "";
    if (fromArtifact) return fromArtifact;
    if (patternPlanDisplay && patternPlanDisplay !== "Not set yet") {
      return patternPlanDisplay;
    }
    return "";
  }, [selectedPattern, patternPlanDisplay]);

  const activeBucketIndex = bucketIndexForFlowStep(flowStep);
  const finishedBucketIndices = useMemo(
    () =>
      plannedParagraphIndices({
        buckets,
        wantThirdBucket,
        getEvidenceSlots: (bucket) => resolveBucketEvidenceSlots(bucket),
      }),
    [buckets, wantThirdBucket, resolveBucketEvidenceSlots]
  );

  const shelfEvidenceCountsByIndex = useMemo(() => {
    const counts = {};
    for (let i = 0; i < buckets.length; i += 1) {
      const artifact = buildModule4ParagraphPlanArtifact({
        paragraphIndex: i,
        bucket: buckets[i],
        evidenceSlots: resolveBucketEvidenceSlots(buckets[i]),
        thesis,
        proofPlan,
      });
      counts[i] = artifact.evidence.count;
    }
    return counts;
  }, [buckets, resolveBucketEvidenceSlots, thesis, proofPlan]);

  const goToParagraphPartEdit = useCallback((part, step) => {
    if (typeof step !== "number") return;
    setFlowStep(step);
  }, []);

  const stepPresentation = useMemo(() => {
    if (
      flowStep === STEP_HANDOFF ||
      flowStep === STEP_BIG_PICTURE ||
      flowStep === STEP_EXPLAIN_BUCKETS
    ) {
      return {
        question: handoffPresentation.question,
        whyMatters: [
          "Module 4 turns your Module 3 argument into paragraph plans—one paragraph at a time.",
          "You are organizing thinking you already started, not rewriting your thesis or drafting the essay yet.",
        ],
        successLooksLike: [
          "You can see your thesis, proof plan, and pattern together.",
          "You understand the five jobs inside a paragraph plan before you start Paragraph 1.",
        ],
        workingSetLabel: "Module 3 → Module 4 handoff",
        workingSetDescription:
          "On your desk: your argument coming with you, plus how paragraph plans work.",
        coachingMessage:
          "Skim the chain, study the five-part model, then start Paragraph 1 when you are ready.",
        nextStepText: "Next you will write the main idea for Paragraph 1.",
      };
    }

    const base = getModule4StepPresentation(flowStep);
    if (flowStep === STEP_PATTERN && !hasSavedPattern) {
      return {
        ...base,
        question: "What pattern connects your evidence?",
        whyMatters: [
          "A pattern helps you group evidence before you plan paragraphs.",
          "Module 4 needs one clear pattern from your Module 3 work—or a focused choice here—so paragraph plans stay connected.",
        ],
        workingSetLabel: "Pattern recovery",
        workingSetDescription:
          "On your desk: choose or identify a pattern so Paragraph 1 has a foundation.",
        coachingMessage:
          "Look for something that shows up in more than one place across your evidence.",
        nextStepText: "Next you will plan your first body paragraph idea.",
      };
    }
    return base;
  }, [flowStep, hasSavedPattern, handoffPresentation.question]);

  const referenceShelf = (
    <ModuleFourReferenceShelf
      assignmentQuestion={assignmentQuestion}
      thesis={thesis}
      proofPlan={proofPlan}
      patternText={patternShelfText}
      clusterName={selectedCluster?.clusterName || ""}
      clusterReflection={selectedCluster?.reflection || ""}
      claimText={claimReference}
      ideaText={ideaReference}
      buckets={buckets}
      activeBucketIndex={activeBucketIndex}
      completedBucketIndices={finishedBucketIndices}
      evidenceCountsByIndex={shelfEvidenceCountsByIndex}
    />
  );

  const scaffoldBucketIndex =
    flowStep >= STEP_B1_SCAFFOLD && flowStep <= STEP_B3_SCAFFOLD
      ? bucketIndexForStep(flowStep)
      : -1;

  const scaffoldRole = useMemo(() => {
    if (proofPlan.length > 0) return "general";
    return getScaffoldParagraphRole(structureChoice, scaffoldBucketIndex);
  }, [proofPlan, structureChoice, scaffoldBucketIndex]);

  const scaffoldSuggestions = useMemo(
    () => filterSuggestionsByScaffoldRole(allBucketSuggestions, scaffoldRole),
    [allBucketSuggestions, scaffoldRole]
  );

  const speechAudience = (responses?.[0] || "").trim();
  const speechPurpose = (responses?.[1] || "").trim();
  const letterAudience = (responses?.[2] || "").trim();
  const letterPurpose = (responses?.[3] || "").trim();
  const hasLegacyAudiencePurpose =
    Boolean(speechAudience || speechPurpose || letterAudience || letterPurpose);

  const persistSlice = useCallback(() => {
    if (wantThirdBucket === true) return buckets.slice(0, 3);
    return buckets.slice(0, 2);
  }, [buckets, wantThirdBucket]);

  const saveToApi = useCallback(async () => {
    const email = session?.user?.email;
    if (!email) return;

    const slice = persistSlice();
    const result = await upsertParagraphPlanArtifact({
      userEmail: email,
      buckets: enrichBucketsForSave(slice, resolveBucketEvidenceSlots),
      reflection,
      flow_state: {
        v: FLOW_VERSION,
        step: flowStep,
        wantThirdBucket,
        patternChoice,
      },
    });

    if (!result.ok) {
      console.warn("Module 4 save failed:", result.error);
    }
  }, [
    session?.user?.email,
    flowStep,
    wantThirdBucket,
    patternChoice,
    persistSlice,
    reflection,
    resolveBucketEvidenceSlots,
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
      const next = prev.map((b) => ({
        ...b,
        evidenceKeys: [...(b.evidenceKeys || [])],
        evidenceSnippets: normalizeEvidenceSnippets(b.evidenceSnippets),
      }));
      const b = next[bucketIndex];
      if (!b) return prev;

      const existing = b.evidenceKeys;
      const matchedIndexes = existing
        .map((saved, index) => (evidenceIdsMatch(saved, key) ? index : -1))
        .filter((index) => index >= 0);

      if (matchedIndexes.length > 0) {
        b.evidenceKeys = existing.filter(
          (_saved, index) => !matchedIndexes.includes(index)
        );
        b.evidenceSnippets = (b.evidenceSnippets || []).filter(
          (_snippet, index) => !matchedIndexes.includes(index)
        );
      } else {
        b.evidenceKeys = [...existing, key];
      }
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

  const evaluateAdvance = () =>
    evaluateModule4Advance({
      flowStep,
      buckets,
      reflection,
      wantThirdBucket,
      patternChoice,
      hasSavedPattern,
      hasPatternPair: Boolean(patternPair),
      getEvidenceSlots: (bucket) => resolveBucketEvidenceSlots(bucket),
      stepConstants: MODULE4_STEP_CONSTANTS,
    });

  const canGoNext = () => evaluateAdvance().ok;

  const goNext = async () => {
    const advance = evaluateAdvance();
    if (!advance.ok) return;
    await flushSave();
    if (
      flowStep === STEP_HANDOFF ||
      flowStep === STEP_WELCOME ||
      flowStep === STEP_BIG_PICTURE ||
      flowStep === STEP_EXPLAIN_BUCKETS
    ) {
      setFlowStep(STEP_B1_SCAFFOLD);
      return;
    }
    if (flowStep === STEP_PATTERN) {
      setFlowStep(STEP_B1_SCAFFOLD);
      return;
    }
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
    const target = resolveModule4BackTarget({
      flowStep,
      hasValidSavedPattern: hasSavedPattern,
      wantThirdBucket,
    });
    if (target == null) return;
    setFlowStep(target);
  };

  const startParagraph1 = async () => {
    const advance = evaluateAdvance();
    if (!advance.ok) return;
    await flushSave();
    setFlowStep(STEP_B1_SCAFFOLD);
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
      // Preserve any Paragraph 3 draft; declined thirds are not required work.
      setFlowStep(STEP_REFLECTION);
    }
  };

  const completeModule = async () => {
    const advance = evaluateAdvance();
    if (!advance.ok) return;
    if (
      !canAdvanceModule4Step({
        flowStep: STEP_REFLECTION,
        buckets,
        reflection,
        wantThirdBucket,
        getEvidenceSlots: (bucket) => resolveBucketEvidenceSlots(bucket),
        stepConstants: MODULE4_STEP_CONSTANTS,
      })
    ) {
      return;
    }
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
                        const key = evidenceRowKey(row);
                        const checked = (buckets[bucketIndex]?.evidenceKeys || []).some(
                          (saved) => evidenceIdsMatch(saved, key)
                        );
                        const reuseCue = getEvidenceReuseCue({
                          evidenceKey: key,
                          currentParagraphIndex: bucketIndex,
                          selectedHere: checked,
                          buckets,
                          getEvidenceSlots: (bucket) =>
                            resolveBucketEvidenceSlots(bucket),
                        });
                        const q = (row.quote || "").trim();
                        const o = (row.observation || "").trim();
                        const preview =
                          q.slice(0, 160) + (q.length > 160 ? "…" : "");
                        const appealLabel = String(row.category || "").toLowerCase();
                        const module3Connection =
                          row.module3Connection ||
                          getModule3ConnectionForEvidenceKey(
                            module3ConnectionsByKey,
                            key
                          );
                        const checkboxId = `m4-evidence-${bucketIndex}-${key}`;
                        const accessibleName = [
                          sourceLabels[src],
                          appealLabel,
                          preview || "quotation",
                          reuseCue.show ? reuseCue.label : "",
                        ]
                          .filter(Boolean)
                          .join(" · ");
                        return (
                          <li key={key}>
                            <label
                              htmlFor={checkboxId}
                              className={`${CHOICE_ROW_CLASS} gap-2 py-2 items-start`}
                            >
                              <input
                                id={checkboxId}
                                type="checkbox"
                                className="mt-1 shrink-0 h-4 w-4"
                                checked={checked}
                                onChange={() => toggleEvidenceKey(bucketIndex, key)}
                                aria-label={accessibleName}
                              />
                              <span className="min-w-0 flex-1 space-y-1.5 text-xs text-theme-dark/90 leading-relaxed">
                                <span className="flex flex-wrap gap-1.5">
                                  <span className="rounded border border-theme-dark/15 bg-white/90 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                                    {sourceLabels[src]}
                                  </span>
                                  {appealLabel ? (
                                    <span className="rounded border border-theme-dark/15 bg-white/90 px-1.5 py-0.5 text-[10px] font-semibold capitalize">
                                      {appealLabel}
                                    </span>
                                  ) : null}
                                  {reuseCue.show ? (
                                    <span
                                      className="rounded border border-theme-dark/20 bg-white/95 px-1.5 py-0.5 text-[10px] font-semibold text-theme-dark/70"
                                      role="status"
                                    >
                                      {reuseCue.label}
                                    </span>
                                  ) : null}
                                </span>
                                <span className="font-medium text-theme-dark block break-words">
                                  {preview || "(No quote text)"}
                                </span>
                                {o ? (
                                  <span className="text-theme-dark/75 block break-words">
                                    Your Module 2 note: {o.slice(0, 200)}
                                    {o.length > 200 ? "…" : ""}
                                  </span>
                                ) : null}
                                {module3Connection ? (
                                  <span className="mt-1 block rounded-md border border-theme-orange/25 bg-theme-orange/5 px-2 py-1.5 text-theme-dark/90">
                                    <span className="block text-[10px] font-bold uppercase tracking-wide text-theme-orange">
                                      {module3Connection.heading}
                                    </span>
                                    <span className="mt-0.5 block font-semibold">
                                      {module3Connection.relationLabel}
                                    </span>
                                    <span className="mt-0.5 block whitespace-pre-wrap break-words">
                                      {module3Connection.note}
                                    </span>
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

  const panelClass = "space-y-4 text-left";

  // Checkpoint 3: organizational jobs come from paragraphJobChoicesForUi per bucket.

  let main = null;

  if (
    flowStep === STEP_HANDOFF ||
    flowStep === STEP_WELCOME ||
    flowStep === STEP_BIG_PICTURE ||
    flowStep === STEP_EXPLAIN_BUCKETS
  ) {
    main = (
      <ModuleFourHandoffStep
        presentation={handoffPresentation}
        onStartParagraph1={startParagraph1}
      />
    );
  } else if (flowStep === STEP_PATTERN) {
    main = (
      <div className={panelClass}>
        <h2 className="text-xl font-extrabold text-theme-blue">
          Recover a pattern for Module 4
        </h2>
        <p className="text-sm font-semibold text-theme-dark">
          What you will do: identify one pattern that connects your evidence before
          Paragraph 1
        </p>
        <StepGuidanceBox label="Why this matters">
          <p>
            Module 4 builds paragraph plans from a clear pattern. No saved Module 3
            pattern was found, so this short recovery step gives Paragraph 1 a
            foundation. Students who already saved a pattern skip this screen.
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
          </>
        ) : (
          <>
            <StepGuidanceBox label="Tip">
              <p>
                We could not find a matching pair of speech and letter notes for the
                same appeal yet. You can still continue—Paragraph 1 will use the
                evidence on your shelf.
              </p>
            </StepGuidanceBox>
            <StepActionHeading>
              Your turn: press Start Paragraph 1 when you are ready.
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
    const proofSlots = resolveProofPlanSlots(
      Array.isArray(thesisArtifact?.proofPlan)
        ? thesisArtifact.proofPlan
        : proofPlan
    );
    const selectedSlot = proofPlanSlotForSuggestionId(
      Array.isArray(thesisArtifact?.proofPlan)
        ? thesisArtifact.proofPlan
        : proofPlan,
      b.suggestionId
    );
    const recommendedSlot =
      selectedSlot ||
      proofSlots.find((slot) => slot.slotIndex === i) ||
      null;
    const priorSummaries = buildPriorParagraphJobSummaries(buckets, i);

    main = (
      <div className={panelClass}>
        <div className="rounded-xl border-2 border-theme-orange/40 bg-theme-orange/10 px-4 py-4 ring-1 ring-theme-orange/15">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-theme-orange">
            Your job right now
          </p>
          <h2 className="mt-2 text-xl font-extrabold text-theme-blue">
            {pointStepQuestion(n)}
          </h2>
          <p className="mt-2 text-sm text-theme-dark/90">
            {PARAGRAPH_POINT_DEFINITION}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="rounded-lg border border-theme-orange/25 bg-theme-orange/5 px-3 py-3">
            <p className="text-[11px] font-bold uppercase tracking-wide text-theme-orange">
              Point
            </p>
            <p className="mt-1 text-sm text-theme-dark">
              What this paragraph proves
            </p>
          </div>
          <div className="rounded-lg border border-border-soft bg-surface-soft/60 px-3 py-3">
            <p className="text-[11px] font-bold uppercase tracking-wide text-text-muted">
              Job
            </p>
            <p className="mt-1 text-sm text-theme-dark/85">
              How it fits the essay’s organization
            </p>
            <p className="mt-2 text-xs font-semibold text-theme-blue">
              You will choose the job next.
            </p>
          </div>
        </div>

        <StepReferenceNote title="Your thesis (read-only)">
          {thesis || "Your thesis from Module 3 will appear here."}
        </StepReferenceNote>

        {recommendedSlot ? (
          <div className="rounded-lg border border-theme-blue/25 bg-theme-blue/5 px-3 py-3 space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wide text-theme-blue">
              Proof-plan slot recommended for Paragraph {n}
            </p>
            <p className="text-xs font-semibold text-theme-orange">
              {recommendedSlot.roleLabel}
            </p>
            <p className="text-sm whitespace-pre-wrap break-words text-theme-dark">
              {recommendedSlot.text}
            </p>
          </div>
        ) : (
          <StepGuidanceBox label="Tip">
            <p>
              No saved proof-plan note is linked to this paragraph yet. Use your
              thesis and pattern as reference, or write your own paragraph point.
            </p>
          </StepGuidanceBox>
        )}

        {priorSummaries.length > 0 ? (
          <div className="rounded-lg border border-border-soft bg-white/80 px-3 py-3 space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wide text-text-muted">
              Earlier paragraphs
            </p>
            {priorSummaries.map((item) => (
              <p key={item.paragraphNumber} className="text-xs text-theme-dark/85">
                Paragraph {item.paragraphNumber}
                {item.jobLabel ? ` — ${item.jobLabel}` : ""}
                {item.point ? `: ${item.point}` : ""}
              </p>
            ))}
          </div>
        ) : null}

        <StepActionHeading>
          Your turn: choose a saved proof-plan note or write a different point.
        </StepActionHeading>
        <div className="space-y-2">
          {scaffoldSuggestions.map((s) => (
            <label
              key={s.id}
              className={[
                CHOICE_ROW_CLASS,
                selectedSlot?.suggestionId === s.id || b.suggestionId === s.id
                  ? "border-theme-blue/40 bg-theme-blue/5"
                  : "",
              ].join(" ")}
            >
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
              <span className="min-w-0 text-sm text-theme-dark/90 leading-relaxed">
                {s.roleLabel ? (
                  <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-theme-orange">
                    {s.roleLabel}
                  </span>
                ) : null}
                <span className="whitespace-pre-wrap break-words">{s.label}</span>
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
              I’ll write a different paragraph point
            </span>
          </label>
        </div>
        <div>
          <label className="block text-sm font-bold text-theme-dark mb-1">
            Your paragraph point — edit until it sounds like you
          </label>
          <textarea
            value={b.claim}
            onChange={(e) => updateBucketField(i, "claim", e.target.value)}
            className={`${FIELD_INPUT_CLASS} min-h-[100px]`}
            placeholder="Use a proof-plan note above, or type your own point…"
          />
          <FieldValidityStatus result={validateParagraphPoint(b.claim)} />
        </div>
        {(b.claim || "").trim() ? (
          <StepMeaningBox label="What this means">
            <p>
              This is the point Paragraph {n} will prove. Next you will choose
              its organizational job.
            </p>
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
    const rawProofPlan = Array.isArray(thesisArtifact?.proofPlan)
      ? thesisArtifact.proofPlan
      : proofPlan;
    const recommendation = recommendParagraphJob({
      proofPlan: rawProofPlan,
      suggestionId: b.suggestionId,
      paragraphIndex: i,
    });
    const jobUi = paragraphJobChoicesForUi({
      proofPlan: rawProofPlan,
      currentRole: b.paragraphRole,
    });
    const selectedSlot = proofPlanSlotForSuggestionId(
      rawProofPlan,
      b.suggestionId
    );
    const pairingCoach = getPointJobPairingCoaching({
      claim: b.claim,
      paragraphRole: b.paragraphRole,
      suggestionId: b.suggestionId,
      recommendedJobId: recommendation?.jobId || "",
    });
    const priorJobs = buildPriorParagraphJobSummaries(buckets, i);
    const repeatedCoach = getRepeatedJobCoaching(
      buckets.map((bucket, idx) =>
        idx === i ? b : bucket
      ),
      i
    );
    const customText = decodeCustomParagraphJob(b.paragraphRole);
    const choosingCustom = isCustomParagraphJob(b.paragraphRole);

    main = (
      <div className={panelClass}>
        <div className="rounded-xl border-2 border-theme-orange/40 bg-theme-orange/10 px-4 py-4 ring-1 ring-theme-orange/15">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-theme-orange">
            Your job right now
          </p>
          <h2 className="mt-2 text-xl font-extrabold text-theme-blue">
            {jobStepQuestion(n)}
          </h2>
          <p className="mt-2 text-sm text-theme-dark/90">
            {PARAGRAPH_JOB_DEFINITION}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <div className="rounded-lg border border-theme-blue/25 bg-theme-blue/5 px-3 py-3">
            <p className="text-[11px] font-bold uppercase tracking-wide text-theme-blue">
              Your paragraph point
            </p>
            <p className="mt-1 text-sm whitespace-pre-wrap break-words text-theme-dark">
              {(b.claim || "").trim() || "(Add a point on the previous step.)"}
            </p>
          </div>
          <div className="rounded-lg border border-border-soft bg-white/90 px-3 py-3">
            <p className="text-[11px] font-bold uppercase tracking-wide text-text-muted">
              Recommended from your proof plan
            </p>
            {recommendation ? (
              <>
                <p className="mt-1 text-xs font-semibold text-theme-orange break-words">
                  {recommendation.slot?.roleLabel || "Proof-plan note"}
                </p>
                <p className="mt-1 text-sm font-semibold text-theme-green break-words">
                  {recommendation.jobLabel}
                </p>
                {recommendation.slot?.text ? (
                  <p className="mt-1 text-xs text-theme-dark/80 whitespace-pre-wrap break-words">
                    {recommendation.slot.text}
                  </p>
                ) : null}
                <p className="mt-2 text-[11px] font-semibold text-theme-blue">
                  Recommended from your plan — choose or confirm it below.
                </p>
              </>
            ) : (
              <p className="mt-1 text-sm text-theme-dark/80">
                No proof-plan recommendation is available. Choose the
                organizational job that fits your paragraph point.
              </p>
            )}
          </div>
        </div>

        {priorJobs.length > 0 ? (
          <div className="rounded-lg border border-border-soft bg-surface-soft/50 px-3 py-3 space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wide text-text-muted">
              Essay organization so far
            </p>
            {priorJobs.map((item) => (
              <p key={item.paragraphNumber} className="text-sm text-theme-dark">
                Paragraph {item.paragraphNumber} — {item.jobLabel}
              </p>
            ))}
            <p className="text-sm font-semibold text-theme-blue">
              Paragraph {n} — choosing now
            </p>
            {repeatedCoach ? (
              <p className="pt-1 text-xs text-theme-orange">{repeatedCoach}</p>
            ) : null}
          </div>
        ) : null}

        <StepActionHeading>
          Your turn: choose how Paragraph {n} does its part in the essay.
        </StepActionHeading>
        <div className="space-y-2">
          {jobUi.choices.map((opt) => {
            const isRecommended =
              recommendation &&
              !opt.isLegacy &&
              opt.id === recommendation.jobId;
            const checked =
              opt.id === "custom"
                ? choosingCustom
                : b.paragraphRole === opt.id;
            return (
              <label
                key={opt.id}
                className={[
                  CHOICE_ROW_CLASS,
                  "w-full",
                  isRecommended ? "border-theme-green/40 bg-theme-green/5" : "",
                  checked ? "ring-1 ring-theme-blue/25" : "",
                ].join(" ")}
              >
                <input
                  type="radio"
                  name={`role-${i}`}
                  className="mt-1 shrink-0"
                  checked={checked}
                  onChange={() => {
                    if (opt.id === "custom") {
                      updateBucketField(
                        i,
                        "paragraphRole",
                        encodeCustomParagraphJob(customText || "")
                      );
                      return;
                    }
                    updateBucketField(i, "paragraphRole", opt.id);
                  }}
                />
                <span className="min-w-0 text-sm text-theme-dark/90">
                  <span className="break-words">{opt.label}</span>
                  {isRecommended ? (
                    <span className="mt-1 block text-[11px] font-bold uppercase tracking-wide text-theme-green">
                      Recommended from your plan
                    </span>
                  ) : null}
                  {opt.isLegacy ? (
                    <span className="mt-1 block text-[11px] font-semibold text-text-muted">
                      Saved earlier — keep it, or choose a clearer job below
                    </span>
                  ) : null}
                </span>
              </label>
            );
          })}
        </div>

        {choosingCustom ? (
          <div>
            <label className="block text-sm font-bold text-theme-dark mb-1">
              Describe the organizational job
            </label>
            <input
              type="text"
              value={customText}
              onChange={(e) =>
                updateBucketField(
                  i,
                  "paragraphRole",
                  encodeCustomParagraphJob(e.target.value)
                )
              }
              className={FIELD_INPUT_CLASS}
              placeholder="Example: Compare the openings of both works"
            />
            <p className="mt-1 text-[11px] text-text-muted">
              Saved as <code>custom:…</code> in the existing paragraph job field.
            </p>
          </div>
        ) : null}

        {pairingCoach ? (
          <div className="rounded-lg border border-theme-orange/30 bg-theme-orange/5 px-3 py-3 space-y-2">
            <p className="text-sm font-semibold text-theme-orange">
              Check this pairing
            </p>
            <p className="text-sm text-theme-dark">{pairingCoach.message}</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <p className="text-xs">
                <span className="font-bold">Point: </span>
                {(b.claim || "").trim() || "—"}
              </p>
              <p className="text-xs">
                <span className="font-bold">Job: </span>
                {labelForParagraphJob(b.paragraphRole) || "—"}
              </p>
            </div>
            <p className="text-xs text-text-muted">
              You can go Back to revise the point, or choose a different job here.
            </p>
          </div>
        ) : null}

        <FieldValidityStatus result={validateParagraphJob(b.paragraphRole)} />

        {selectedSlot ? (
          <p className="text-xs text-text-muted">
            Linked proof-plan note: {selectedSlot.roleLabel}
          </p>
        ) : null}
      </div>
    );
  } else if (
    flowStep === STEP_B1_EVIDENCE ||
    flowStep === STEP_B2_EVIDENCE ||
    flowStep === STEP_B3_EVIDENCE
  ) {
    const i = bucketIndexForStep(flowStep);
    const n = i + 1;
    const b = buckets[i] || emptyBucket();
    const rawProofPlan = Array.isArray(thesisArtifact?.proofPlan)
      ? thesisArtifact.proofPlan
      : proofPlan;
    const selectedSlot = proofPlanSlotForSuggestionId(
      rawProofPlan,
      b.suggestionId
    );
    const evidenceSlotsForStep = resolveBucketEvidenceSlots(b);
    const alignmentCue = getJobEvidenceSourceAlignmentCue({
      paragraphRole: b.paragraphRole,
      evidenceSlots: evidenceSlotsForStep,
    });
    main = (
      <div
        className={`${panelClass} max-w-full overflow-x-hidden`}
        data-layout-mobile={
          CP6_LAYOUT_CONTRACT.mobile.singleColumn ? "stack" : "multi"
        }
      >
        <h2 className="text-xl font-extrabold text-theme-blue">
          Paragraph {n}: choose evidence
        </h2>
        <p className="text-sm font-semibold text-theme-dark">
          What you will do: check only the quotes that fit this paragraph point
          and job
        </p>
        <StepGuidanceBox label="Why this matters">
          <p>
            You are choosing lines that belong with{" "}
            <strong>this paragraph’s point and job</strong>—not collecting random
            quotes.
          </p>
        </StepGuidanceBox>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="rounded-lg border border-theme-blue/25 bg-theme-blue/5 px-3 py-3">
            <p className="text-[11px] font-bold uppercase tracking-wide text-theme-blue">
              Paragraph point
            </p>
            <p className="mt-1 text-sm whitespace-pre-wrap break-words">
              {(b.claim || "").trim() || "Add your paragraph point on an earlier step."}
            </p>
          </div>
          <div className="rounded-lg border border-theme-orange/25 bg-theme-orange/5 px-3 py-3">
            <p className="text-[11px] font-bold uppercase tracking-wide text-theme-orange">
              Paragraph job
            </p>
            <p className="mt-1 text-sm break-words">
              {labelForParagraphJob(b.paragraphRole) ||
                "Choose the organizational job on the previous step."}
            </p>
          </div>
        </div>

        {selectedSlot ? (
          <div className="rounded-lg border border-border-soft bg-white/90 px-3 py-3">
            <p className="text-[11px] font-bold uppercase tracking-wide text-text-muted">
              Matching proof-plan note
            </p>
            <p className="mt-1 text-xs font-semibold text-theme-orange">
              {selectedSlot.roleLabel}
            </p>
            <p className="mt-1 text-sm whitespace-pre-wrap break-words text-theme-dark">
              {selectedSlot.text}
            </p>
          </div>
        ) : null}

        <StepGuidanceBox label="Think about this">
          <p className="font-semibold text-theme-dark mb-1">
            Does this quote fit this paragraph plan?
          </p>
          <p>
            For each quote, ask whether it supports <em>this</em> paragraph point
            and job. Module 2 notes and Module 3 connections stay with each
            quotation below.
          </p>
        </StepGuidanceBox>
        <StepActionHeading>
          Your turn: use the checkboxes below to select evidence.
        </StepActionHeading>
        {(() => {
          const outsideSaved = resolveBucketEvidenceSlots(buckets[i]).filter(
            (slot) => {
              if (slot.status !== "preserved" || slot.suppressDisplay) return false;
              return !evidencePool.some((row) =>
                evidenceIdsMatch(evidenceRowKey(row), slot.savedKey)
              );
            }
          );
          if (outsideSaved.length === 0) return null;
          return (
            <div className="mb-4 rounded-lg border border-theme-dark/20 bg-theme-light/90 p-3 space-y-2 text-left">
              <p className="text-xs font-bold uppercase tracking-wide text-theme-dark/60">
                Saved earlier (not in current working evidence)
              </p>
              <p className="text-xs text-theme-dark/75">
                These quotes stayed in this paragraph plan from earlier work. Remove
                them here, or replace them with quotations from the shelf below.
              </p>
              <ul className="space-y-2">
                {outsideSaved.map((slot) => (
                  <li
                    key={slot.savedKey}
                    className="flex items-start justify-between gap-3 rounded-md border border-theme-dark/15 bg-white/90 px-3 py-2 text-xs"
                  >
                    <span className="min-w-0 space-y-1">
                      <span className="block font-semibold text-theme-dark">
                        {slot.compatibilityLabel}
                      </span>
                      {slot.quote ? (
                        <span className="block italic text-theme-dark/85">
                          &ldquo;{slot.quote}&rdquo;
                        </span>
                      ) : null}
                    </span>
                    <button
                      type="button"
                      className="shrink-0 rounded border border-theme-orange/40 px-2 py-1 font-semibold text-theme-dark hover:bg-theme-orange/10"
                      onClick={() => toggleEvidenceKey(i, slot.savedKey)}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          );
        })()}
        {renderQuoteGroups(i)}
        <FieldValidityStatus
          result={validateParagraphEvidence(evidenceSlotsForStep)}
        />
        {alignmentCue ? (
          <div
            className="rounded-lg border border-theme-orange/30 bg-theme-orange/[0.06] px-3 py-3 text-left"
            role="status"
            aria-label={alignmentCue.title}
          >
            <p className="text-xs font-bold uppercase tracking-wide text-theme-orange">
              {alignmentCue.title}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-theme-dark break-words">
              {alignmentCue.message}
            </p>
            <p className="mt-2 text-[11px] text-theme-dark/65">
              This is a coaching note only. You can keep going with your current
              selections.
            </p>
          </div>
        ) : null}
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
    const evidenceSlots = resolveBucketEvidenceSlots(b);
    const planArtifact = buildModule4ParagraphPlanArtifact({
      paragraphIndex: i,
      bucket: b,
      evidenceSlots,
      thesis,
      proofPlan,
    });
    const planReady = isParagraphMechanicallyPlanned(b, evidenceSlots);
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

        {planReady ? (
          <ModuleFourParagraphPlanArtifact
            artifact={planArtifact}
            showReadyBanner
            showEditActions
            onEditPart={goToParagraphPartEdit}
          />
        ) : (
          <ParagraphPlanPanel
            paragraphNumber={n}
            bucket={b}
            evidenceSlots={evidenceSlots}
          />
        )}

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
          <FieldValidityStatus result={validateParagraphReasoning(b.reasoning)} />
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
      <ModuleFourFinalReviewStep
        buckets={buckets}
        wantThirdBucket={wantThirdBucket}
        getEvidenceSlots={(bucket) => resolveBucketEvidenceSlots(bucket)}
        thesis={thesis}
        proofPlan={proofPlan}
        reflection={reflection}
        onReflectionChange={setReflection}
        onEditPart={goToParagraphPartEdit}
        onFinish={() => completeModule()}
        canFinish={canGoNext()}
      />
    );
  }

  const advanceStatus = evaluateAdvance();
  const showBack =
    flowStep > STEP_HANDOFF &&
    !(flowStep === STEP_PATTERN && !hasSavedPattern);
  const atHandoff =
    flowStep === STEP_HANDOFF ||
    flowStep === STEP_BIG_PICTURE ||
    flowStep === STEP_EXPLAIN_BUCKETS;
  const atDecision = flowStep === STEP_THIRD_DECISION;
  const atReflection = flowStep === STEP_REFLECTION;
  const chrome = getModule4PresentationChrome(flowStep);
  const showPrimaryAdvance =
    !atDecision &&
    !atReflection &&
    !atHandoff &&
    flowStep <= STEP_B3_REASONING;

  const atReasoningStep =
    flowStep === STEP_B1_REASONING ||
    flowStep === STEP_B2_REASONING ||
    flowStep === STEP_B3_REASONING;
  const reasoningBucketIndex = atReasoningStep
    ? bucketIndexForStep(flowStep)
    : -1;
  const reasoningPlanReady =
    atReasoningStep &&
    isParagraphMechanicallyPlanned(
      buckets[reasoningBucketIndex] || emptyBucket(),
      resolveBucketEvidenceSlots(buckets[reasoningBucketIndex] || emptyBucket())
    );
  const primaryAdvanceLabel =
    flowStep === STEP_PATTERN
      ? "Start Paragraph 1"
      : reasoningPlanReady
        ? reasoningReadyNextActionLabel({
            paragraphIndex: reasoningBucketIndex,
            wantThirdBucket,
          })
        : "Keep going";

  return (
    <div className="w-full pb-10">
      {chrome.useGuidedHandoffShell ? (
        main
      ) : (
      <ModuleThreeStepFrame
        minimalChrome={chrome.useMinimalStepChrome}
        question={chrome.showPageQuestion ? stepPresentation.question : ""}
        whyMatters={chrome.showWhyMatters ? stepPresentation.whyMatters : []}
        successLooksLike={
          chrome.showReflectionDisclosure
            ? stepPresentation.successLooksLike
            : []
        }
        coachingMessage={
          chrome.showTeacherGuide ? stepPresentation.coachingMessage : ""
        }
        nextStepText={
          chrome.showTeacherGuide ? stepPresentation.nextStepText : ""
        }
        sidebar={chrome.showFullReferenceShelf ? referenceShelf : null}
      >
        {chrome.showStepMetadata ? (
          <div className="space-y-4 rounded-lg bg-surface-soft/50 px-4 py-3 text-left">
            <p className="text-xs leading-relaxed text-text-muted">
              Module 4 · step {flowStep + 1} of {LAST_STEP + 1}. Same
              workspace—one paragraph at a time.
            </p>
          </div>
        ) : null}

        {chrome.showSources ? (
          <ModuleSourceAccess
            speechOriginalUrl={speechOriginalUrl}
            letterOriginalUrl={letterOriginalUrl}
          />
        ) : null}

        {chrome.showWorkingSetLabel ? (
          <WorkingSetSection
            label={stepPresentation.workingSetLabel}
            description={stepPresentation.workingSetDescription}
          >
            {main}
          </WorkingSetSection>
        ) : (
          main
        )}

        {chrome.showNavFooter ? (
          <div className="space-y-3 border-t border-border-soft/60 pt-4">
            {!advanceStatus.ok && advanceStatus.message ? (
              <p
                className="text-xs leading-relaxed text-theme-orange break-words"
                role="status"
              >
                {advanceStatus.message}
              </p>
            ) : null}
            <div className="flex flex-wrap justify-between items-center gap-3">
            <div>
              {showBack ? (
                <button
                  type="button"
                  onClick={() => goBack()}
                  className="px-4 py-2 rounded-lg bg-surface-soft text-text-primary hover:bg-border-soft/60"
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
                  className="w-full sm:w-auto px-4 py-3 min-h-[44px] rounded-lg bg-theme-blue text-white font-medium disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-theme-blue/30"
                >
                  {primaryAdvanceLabel}
                </button>
              ) : null}
              {atReflection ? (
                <button
                  type="button"
                  onClick={() => completeModule()}
                  disabled={!canGoNext()}
                  className="w-full sm:w-auto px-4 py-3 min-h-[44px] rounded-lg bg-theme-blue text-white font-medium disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-theme-blue/30"
                >
                  Finish your paragraph plans and continue
                </button>
              ) : null}
            </div>
            </div>
          </div>
        ) : null}
      </ModuleThreeStepFrame>
      )}
    </div>
  );
}
