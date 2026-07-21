/**
 * WP-084 — Whole-essay review engine (pure).
 * Composes section health + conservative essay-level checks.
 * Never rewrites student prose. Findings are advisory unless blocking evidence
 * (missing required section) or teacher required word-count mode says so.
 *
 * Confidence limits:
 * - thesis/body drift uses token overlap, not semantic grading;
 * - evidence→explanation reuses quotation heuristics from body health;
 * - intro↔conclusion detects verbatim copy and weak/contradictory cues, not style quality;
 * - word-count below target only routes to a section when a clear underdevelopment signal exists.
 */

import { diagnoseBodyParagraphHealth } from "./bodyParagraphHealth.js";
import { diagnoseIntroductionHealth } from "./introductionHealth.js";
import { diagnoseConclusionHealth } from "./conclusionHealth.js";
import {
  countEssaySectionWords,
  countEssayWords,
  joinEssaySectionsForCount,
} from "../essay/essayWordCount.js";
import {
  evaluateWordCountStatus,
  formatWordCountStudentMessage,
  normalizeWordCountSettings,
} from "../assignments/wordCountSettings.js";
import { getBodyParagraphLabel } from "../essaySectionLabels.js";

function safeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeProse(text) {
  return safeText(text)
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function similarityRatio(a, b) {
  const left = normalizeProse(a);
  const right = normalizeProse(b);
  if (!left || !right) return 0;
  if (left === right) return 1;
  const shorter = left.length <= right.length ? left : right;
  const longer = left.length <= right.length ? right : left;
  if (longer.includes(shorter) && shorter.length / longer.length >= 0.85) {
    return shorter.length / longer.length;
  }
  return 0;
}

function thesisTokens(thesis) {
  return normalizeProse(thesis)
    .split(" ")
    .filter((t) => t.length > 4);
}

/**
 * @typedef {{
 *   id: string,
 *   checkId: "thesis_body"|"evidence_explanation"|"intro_conclusion"|"missing_duplicate"|"word_count",
 *   severity: "info"|"warn"|"error",
 *   blocking: boolean,
 *   title: string,
 *   whatToCheck: string,
 *   howToRecognize: string,
 *   sectionType: "intro"|"body"|"conclusion"|null,
 *   draftIndex: number | null,
 *   bodyIndex: number | null,
 *   sourceParagraphIndex: number | null,
 *   sectionLabel: string | null,
 *   revisionTargetId: string | null,
 *   confidence: "high"|"medium"|"low",
 *   confidenceNote: string,
 *   wordMetrics?: object | null,
 * }} WholeEssayFinding
 */

/**
 * Build review input from outline + sections + thesis + word settings.
 * @param {object} input
 */
export function buildWholeEssayReview(input = {}) {
  const thesis = safeText(input.thesis);
  const outline = input.outline && typeof input.outline === "object" ? input.outline : {};
  const bodyCards = Array.isArray(outline.body) ? outline.body : [];
  const sections = Array.isArray(input.sections) ? input.sections.map((s) => String(s || "")) : [];
  const wordSettings = normalizeWordCountSettings(input.wordCountSettings || {});

  const expectedSectionCount = bodyCards.length + 2; // intro + bodies + conclusion
  while (sections.length < expectedSectionCount) sections.push("");

  const introProse = sections[0] || "";
  const conclusionProse = sections[sections.length - 1] || "";
  const bodyProseList = sections.slice(1, 1 + bodyCards.length);

  const { sectionCounts, total } = countEssaySectionWords(sections);
  const joined = joinEssaySectionsForCount(sections);
  const joinedCount = countEssayWords(joined);
  // Prefer sum of sections for display consistency when join drops empties.
  const essayWordCount = total;

  const wordEvaluation = evaluateWordCountStatus(essayWordCount, wordSettings);
  const wordMessage = formatWordCountStudentMessage(wordEvaluation);

  /** @type {WholeEssayFinding[]} */
  const findings = [];

  // --- 1. Thesis → body points ---
  bodyCards.forEach((card, bodyIndex) => {
    const draftIndex = bodyIndex + 1;
    const prose = bodyProseList[bodyIndex] || "";
    const purpose = safeText(card.point || card.bucket);
    const sourceParagraphIndex =
      typeof card.sourceParagraphIndex === "number"
        ? card.sourceParagraphIndex
        : typeof card.paragraphIndex === "number"
          ? card.paragraphIndex
          : bodyIndex;
    const label = getBodyParagraphLabel(bodyIndex);

    if (!safeText(prose) || safeText(prose).length < 40) {
      findings.push({
        id: `thesis_body_underdeveloped_${sourceParagraphIndex}`,
        checkId: "thesis_body",
        severity: "warn",
        blocking: false,
        title: `${label} needs more development`,
        whatToCheck:
          "Does this paragraph prove one part of your thesis with a clear point?",
        howToRecognize:
          "The paragraph is too short to show how it supports the thesis.",
        sectionType: "body",
        draftIndex,
        bodyIndex,
        sourceParagraphIndex,
        sectionLabel: label,
        revisionTargetId: "underdevelopment",
        confidence: "high",
        confidenceNote:
          "Length is only a clue. You decide what idea still needs explanation.",
        wordMetrics: null,
      });
      return;
    }

    if (thesis && purpose) {
      const tokens = thesisTokens(thesis);
      const purposeNorm = normalizeProse(purpose);
      const proseNorm = normalizeProse(prose);
      const purposeOverlap = tokens.filter((t) => purposeNorm.includes(t)).length;
      const proseOverlap = tokens.filter((t) => proseNorm.includes(t)).length;
      if (tokens.length >= 3 && purposeOverlap === 0 && proseOverlap === 0) {
        findings.push({
          id: `thesis_body_drift_${sourceParagraphIndex}`,
          checkId: "thesis_body",
          severity: "warn",
          blocking: false,
          title: `${label} may not connect to the thesis`,
          whatToCheck:
            "Can a reader see how this paragraph’s point supports your thesis?",
          howToRecognize:
            "The planned point and paragraph prose share almost no key ideas with the thesis.",
          sectionType: "body",
          draftIndex,
          bodyIndex,
          sourceParagraphIndex,
          sectionLabel: label,
          revisionTargetId: "thesis_connection",
          confidence: "medium",
          confidenceNote:
            "This is a wording overlap check, not a grade. You may already connect the ideas in fresh language.",
          wordMetrics: null,
        });
      }
    }
  });

  // --- 2. Evidence → explanation ---
  bodyCards.forEach((card, bodyIndex) => {
    const draftIndex = bodyIndex + 1;
    const prose = bodyProseList[bodyIndex] || "";
    const sourceParagraphIndex =
      typeof card.sourceParagraphIndex === "number"
        ? card.sourceParagraphIndex
        : bodyIndex;
    const label = getBodyParagraphLabel(bodyIndex);
    const otherBodies = bodyProseList.filter((_, i) => i !== bodyIndex);
    const health = diagnoseBodyParagraphHealth({
      purpose: card.point || card.bucket || "",
      reasoning: card.reasoning || "",
      evidence: Array.isArray(card.evidence) ? card.evidence : [],
      assembledProse: prose,
      thesis,
      otherBodyProse: otherBodies,
      needsTransition: bodyIndex < bodyCards.length - 1,
    });
    const missingExpl = health.find((s) => s.id === "missing_explanation_after_quote");
    if (missingExpl) {
      findings.push({
        id: `evidence_explanation_${sourceParagraphIndex}`,
        checkId: "evidence_explanation",
        severity: "warn",
        blocking: false,
        title: `Explain after evidence in ${label}`,
        whatToCheck:
          "After a quotation or paraphrase, do you explain how it supports the paragraph point?",
        howToRecognize:
          "A quotation appears with little or no explanation afterward.",
        sectionType: "body",
        draftIndex,
        bodyIndex,
        sourceParagraphIndex,
        sectionLabel: label,
        revisionTargetId: "explanation",
        confidence: missingExpl.confidence || "medium",
        confidenceNote:
          "Quotation marks are a clue, not proof. You choose whether explanation is enough.",
        wordMetrics: null,
      });
    }
  });

  // --- 3. Intro ↔ conclusion ---
  const introHealth = diagnoseIntroductionHealth({
    assembledProse: introProse,
    thesis,
  });
  const conclusionHealth = diagnoseConclusionHealth({
    assembledProse: conclusionProse,
    thesis,
    bodyPurposes: bodyCards.map((c) => c.point || c.bucket || "").filter(Boolean),
  });

  if (!safeText(introProse)) {
    findings.push({
      id: "missing_intro",
      checkId: "missing_duplicate",
      severity: "error",
      blocking: true,
      title: "Introduction is missing",
      whatToCheck: "Does the essay open with an introduction?",
      howToRecognize: "The introduction section has no prose.",
      sectionType: "intro",
      draftIndex: 0,
      bodyIndex: null,
      sourceParagraphIndex: null,
      sectionLabel: "Introduction",
      revisionTargetId: "underdevelopment",
      confidence: "high",
      confidenceNote: "A required section cannot be empty.",
      wordMetrics: null,
    });
  }
  if (!safeText(conclusionProse)) {
    findings.push({
      id: "missing_conclusion",
      checkId: "missing_duplicate",
      severity: "error",
      blocking: true,
      title: "Conclusion is missing",
      whatToCheck: "Does the essay end with a conclusion?",
      howToRecognize: "The conclusion section has no prose.",
      sectionType: "conclusion",
      draftIndex: sections.length - 1,
      bodyIndex: null,
      sourceParagraphIndex: null,
      sectionLabel: "Conclusion",
      revisionTargetId: "underdevelopment",
      confidence: "high",
      confidenceNote: "A required section cannot be empty.",
      wordMetrics: null,
    });
  }

  const verbatim = conclusionHealth.find((s) => s.id === "verbatim_thesis");
  const thesisDrift = conclusionHealth.find((s) => s.id === "thesis_drift");
  if (verbatim) {
    findings.push({
      id: "intro_conclusion_verbatim_thesis",
      checkId: "intro_conclusion",
      severity: "info",
      blocking: false,
      title: "Conclusion copies the thesis wording",
      whatToCheck:
        "Do introduction and conclusion express the same argument in fresh language?",
      howToRecognize:
        "The conclusion repeats the thesis almost word for word instead of synthesizing.",
      sectionType: "conclusion",
      draftIndex: sections.length - 1,
      bodyIndex: null,
      sourceParagraphIndex: null,
      sectionLabel: "Conclusion",
      revisionTargetId: "synthesize",
      confidence: "high",
      confidenceNote:
        "Copying the thesis is not always wrong, but fresh language usually helps the reader.",
      wordMetrics: null,
    });
  } else if (thesisDrift) {
    findings.push({
      id: "intro_conclusion_thesis_drift",
      checkId: "intro_conclusion",
      severity: "warn",
      blocking: false,
      title: "Conclusion may not match the thesis",
      whatToCheck:
        "Do introduction and conclusion express the same central argument?",
      howToRecognize:
        "The conclusion’s claim seems to drift from or contradict the thesis.",
      sectionType: "conclusion",
      draftIndex: sections.length - 1,
      bodyIndex: null,
      sourceParagraphIndex: null,
      sectionLabel: "Conclusion",
      revisionTargetId: "fresh_thesis",
      confidence: "medium",
      confidenceNote:
        "This is a conservative wording check. You decide if the argument still matches.",
      wordMetrics: null,
    });
  } else if (
    safeText(introProse) &&
    safeText(conclusionProse) &&
    similarityRatio(introProse, conclusionProse) >= 0.9
  ) {
    findings.push({
      id: "intro_conclusion_near_duplicate",
      checkId: "intro_conclusion",
      severity: "warn",
      blocking: false,
      title: "Introduction and conclusion are nearly identical",
      whatToCheck:
        "Do opening and closing use fresh language for the same argument?",
      howToRecognize: "The two sections say almost the same sentences.",
      sectionType: "conclusion",
      draftIndex: sections.length - 1,
      bodyIndex: null,
      sourceParagraphIndex: null,
      sectionLabel: "Conclusion",
      revisionTargetId: "synthesize",
      confidence: "high",
      confidenceNote: "Near-exact match is detectable; meaning judgment stays with you.",
      wordMetrics: null,
    });
  }

  // --- 4. Missing / duplicate bodies ---
  bodyCards.forEach((card, bodyIndex) => {
    const prose = bodyProseList[bodyIndex] || "";
    const sourceParagraphIndex =
      typeof card.sourceParagraphIndex === "number"
        ? card.sourceParagraphIndex
        : bodyIndex;
    if (!safeText(prose)) {
      findings.push({
        id: `missing_body_${sourceParagraphIndex}`,
        checkId: "missing_duplicate",
        severity: "error",
        blocking: true,
        title: `${getBodyParagraphLabel(bodyIndex)} is missing`,
        whatToCheck: "Does every required body paragraph have prose?",
        howToRecognize: "This body section is empty.",
        sectionType: "body",
        draftIndex: bodyIndex + 1,
        bodyIndex,
        sourceParagraphIndex,
        sectionLabel: getBodyParagraphLabel(bodyIndex),
        revisionTargetId: "underdevelopment",
        confidence: "high",
        confidenceNote: "A required section cannot be empty.",
        wordMetrics: null,
      });
    }
  });

  for (let i = 0; i < bodyProseList.length; i += 1) {
    for (let j = i + 1; j < bodyProseList.length; j += 1) {
      const a = bodyProseList[i];
      const b = bodyProseList[j];
      if (!safeText(a) || !safeText(b)) continue;
      if (similarityRatio(a, b) >= 0.9) {
        const sourceI =
          typeof bodyCards[i]?.sourceParagraphIndex === "number"
            ? bodyCards[i].sourceParagraphIndex
            : i;
        findings.push({
          id: `duplicate_body_${i}_${j}`,
          checkId: "missing_duplicate",
          severity: "error",
          blocking: false,
          title: `${getBodyParagraphLabel(i)} and ${getBodyParagraphLabel(j)} are nearly identical`,
          whatToCheck: "Does each body paragraph prove a distinct idea?",
          howToRecognize: "Two body paragraphs say almost the same thing.",
          sectionType: "body",
          draftIndex: i + 1,
          bodyIndex: i,
          sourceParagraphIndex: sourceI,
          sectionLabel: getBodyParagraphLabel(i),
          revisionTargetId: "duplication",
          confidence: "high",
          confidenceNote:
            "Both paragraphs are preserved. Revise so each keeps a distinct job.",
          wordMetrics: null,
        });
      }
    }
  }

  // --- 5. Word count ---
  if (wordEvaluation.mode !== "off") {
    const wordFinding = buildWordCountFinding({
      wordEvaluation,
      wordMessage,
      bodyCards,
      bodyProseList,
      sections,
      thesis,
    });
    if (wordFinding) findings.push(wordFinding);
  }

  const checks = buildCheckSummaries(findings, wordEvaluation);
  const primary = pickPrimaryFinding(findings);

  return {
    thesis,
    essayWordCount,
    sectionCounts,
    joinedWordCount: joinedCount,
    wordEvaluation,
    wordMessage,
    findings,
    checks,
    primaryFinding: primary,
    clearCount: checks.filter((c) => c.status === "pass").length,
    checkCount: checks.length,
    blocksCompletion:
      findings.some((f) => f.blocking) || wordEvaluation.blocksCompletion,
    introHealth,
    conclusionHealth,
  };
}

function buildWordCountFinding({
  wordEvaluation,
  wordMessage,
  bodyCards,
  bodyProseList,
  sections,
  thesis,
}) {
  if (wordEvaluation.status === "within" || wordEvaluation.status === "off") {
    return null;
  }

  let sectionType = null;
  let draftIndex = null;
  let bodyIndex = null;
  let sourceParagraphIndex = null;
  let sectionLabel = null;
  let revisionTargetId = null;
  let confidence = /** @type {"high"|"medium"|"low"} */ ("low");
  let title =
    wordEvaluation.status === "below"
      ? "Essay is below the teacher’s word expectation"
      : "Essay is above the teacher’s word expectation";
  let whatToCheck = wordMessage;
  let howToRecognize =
    wordEvaluation.status === "below"
      ? "The total is under the teacher’s target. Look for an idea that still needs explanation."
      : "The total is over the teacher’s range. Look for repetition or off-topic material.";

  if (wordEvaluation.status === "below") {
    // Prefer a body with missing explanation or clear underdevelopment.
    for (let i = 0; i < bodyCards.length; i += 1) {
      const card = bodyCards[i];
      const prose = bodyProseList[i] || "";
      const health = diagnoseBodyParagraphHealth({
        purpose: card.point || card.bucket || "",
        reasoning: card.reasoning || "",
        evidence: Array.isArray(card.evidence) ? card.evidence : [],
        assembledProse: prose,
        thesis,
        otherBodyProse: bodyProseList.filter((_, j) => j !== i),
      });
      const hit =
        health.find((s) => s.id === "missing_explanation_after_quote") ||
        health.find((s) => s.id === "fragmentary_reasoning") ||
        (safeText(prose).length < 80
          ? { id: "underdevelopment", confidence: "medium" }
          : null);
      if (hit) {
        sectionType = "body";
        draftIndex = i + 1;
        bodyIndex = i;
        sourceParagraphIndex =
          typeof card.sourceParagraphIndex === "number"
            ? card.sourceParagraphIndex
            : i;
        sectionLabel = getBodyParagraphLabel(i);
        revisionTargetId =
          hit.id === "missing_explanation_after_quote"
            ? "explanation"
            : "underdevelopment";
        confidence = hit.confidence || "medium";
        title = `Develop your explanation in ${sectionLabel}`;
        whatToCheck =
          "Explain an idea more fully in this paragraph—do not add filler sentences.";
        howToRecognize =
          "This paragraph still has a clear development opportunity (missing explanation or thin reasoning).";
        break;
      }
    }
    if (!sectionLabel) {
      // No reliable section target
      title = "Below the teacher’s word expectation";
      whatToCheck =
        "Review your teacher’s requirement and choose where an idea needs fuller explanation.";
      howToRecognize =
        "The essay is short of the target, but no single section shows a clear missing explanation.";
      confidence = "low";
      revisionTargetId = null;
    }
  } else if (wordEvaluation.status === "above") {
    // Prefer duplicate body if present
    for (let i = 0; i < bodyProseList.length; i += 1) {
      for (let j = i + 1; j < bodyProseList.length; j += 1) {
        if (similarityRatio(bodyProseList[i], bodyProseList[j]) >= 0.9) {
          sectionType = "body";
          draftIndex = i + 1;
          bodyIndex = i;
          sourceParagraphIndex =
            typeof bodyCards[i]?.sourceParagraphIndex === "number"
              ? bodyCards[i].sourceParagraphIndex
              : i;
          sectionLabel = getBodyParagraphLabel(i);
          revisionTargetId = "duplication";
          confidence = "high";
          title = `Cut repeated material in ${sectionLabel}`;
          whatToCheck =
            "Remove or combine repetition so each paragraph keeps a distinct job.";
          howToRecognize = "Two body paragraphs are nearly identical.";
          break;
        }
      }
      if (sectionLabel) break;
    }
    if (!sectionLabel) {
      title = "Above the teacher’s word expectation";
      whatToCheck =
        "Look for repeated background or off-topic material you can cut.";
      howToRecognize =
        "The essay is over the range, but no automatic repetition target was found.";
      confidence = "low";
    }
  }

  return {
    id: `word_count_${wordEvaluation.status}`,
    checkId: "word_count",
    severity: wordEvaluation.blocksCompletion ? "error" : "warn",
    blocking: Boolean(wordEvaluation.blocksCompletion),
    title,
    whatToCheck,
    howToRecognize,
    sectionType,
    draftIndex,
    bodyIndex,
    sourceParagraphIndex,
    sectionLabel,
    revisionTargetId,
    confidence,
    confidenceNote:
      confidence === "low"
        ? "Word count is not writing quality. The product will not invent a diagnosis."
        : "Word count points to a real development opportunity already visible in the draft.",
    wordMetrics: {
      current: wordEvaluation.current,
      minimum: wordEvaluation.minimum,
      maximum: wordEvaluation.maximum,
      mode: wordEvaluation.mode,
      status: wordEvaluation.status,
      expectationLabel: wordEvaluation.expectationLabel,
      message: wordMessage,
    },
  };
}

function buildCheckSummaries(findings, wordEvaluation) {
  const order = [
    "thesis_body",
    "evidence_explanation",
    "intro_conclusion",
    "missing_duplicate",
    "word_count",
  ];
  const labels = {
    thesis_body: "Thesis → body points",
    evidence_explanation: "Evidence → explanation",
    intro_conclusion: "Introduction ↔ conclusion",
    missing_duplicate: "Missing or duplicate sections",
    word_count: "Teacher word-count expectation",
  };
  return order.map((checkId) => {
    if (checkId === "word_count" && wordEvaluation.mode === "off") {
      return {
        checkId,
        label: labels[checkId],
        status: "skipped",
        findingIds: [],
      };
    }
    const related = findings.filter((f) => f.checkId === checkId);
    return {
      checkId,
      label: labels[checkId],
      status: related.length ? "needs_attention" : "pass",
      findingIds: related.map((f) => f.id),
    };
  });
}

/**
 * Highest-priority finding for the primary repair action.
 * @param {WholeEssayFinding[]} findings
 */
export function pickPrimaryFinding(findings = []) {
  const list = Array.isArray(findings) ? [...findings] : [];
  const rank = { error: 0, warn: 1, info: 2 };
  const conf = { high: 0, medium: 1, low: 2 };
  list.sort((a, b) => {
    if (Boolean(b.blocking) !== Boolean(a.blocking)) {
      return a.blocking ? -1 : 1;
    }
    const s = (rank[a.severity] ?? 9) - (rank[b.severity] ?? 9);
    if (s !== 0) return s;
    return (conf[a.confidence] ?? 9) - (conf[b.confidence] ?? 9);
  });
  return list[0] || null;
}

/**
 * Module 6 handoff: only high-confidence structural issues.
 * @param {object} input
 */
export function buildModule6HandoffReview(input = {}) {
  const full = buildWholeEssayReview(input);
  const structural = full.findings.filter(
    (f) =>
      f.checkId === "missing_duplicate" &&
      (f.blocking || f.id.startsWith("duplicate_body_"))
  );
  return {
    essayWordCount: full.essayWordCount,
    sectionCounts: full.sectionCounts,
    wordEvaluation: {
      ...full.wordEvaluation,
      // Module 6 never blocks on teacher word count — descriptive only.
      blocksCompletion: false,
    },
    wordMessage:
      full.wordEvaluation.mode === "off"
        ? null
        : `About ${full.essayWordCount} words (descriptive). Module 7 will check your teacher’s expectation.`,
    findings: structural,
    primaryFinding: pickPrimaryFinding(structural),
  };
}
