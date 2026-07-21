/**
 * WP-084 — Shared essay word count + teacher settings + whole-essay review.
 */
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
  countEssayWords,
  countEssaySectionWords,
  joinEssaySectionsForCount,
  normalizeEssayProseForWordCount,
} = require("../lib/essay/essayWordCount.js");
const {
  validateWordCountSettings,
  normalizeWordCountSettings,
  evaluateWordCountStatus,
  formatWordCountStudentMessage,
  DEFAULT_WORD_COUNT_SETTINGS,
} = require("../lib/assignments/wordCountSettings.js");
const {
  buildWholeEssayReview,
  buildModule6HandoffReview,
  pickPrimaryFinding,
} = require("../lib/artifacts/wholeEssayReview.js");
const { wordCount } = require("../lib/module6/draftPersistenceHelpers.js");
const {
  isWholeEssayReviewEnabled,
} = require("../lib/dev/isBodyParagraphVerticalSliceEnabled.js");
const {
  setModule7ResumeInDraftMeta,
  readModule7WholeEssayRepair,
} = require("../lib/module7/module7Resume.js");

const THESIS =
  "Although King seeks justice in both texts, he builds credibility, emotion, and logic differently for each audience.";

function makeOutline(bodyCount = 2) {
  const bodies = [];
  for (let i = 0; i < bodyCount; i += 1) {
    bodies.push({
      sourceParagraphIndex: i,
      point:
        i === 0
          ? "King builds credibility differently for each audience"
          : i === 1
            ? "King uses emotion to make delay feel costly"
            : "King uses logic to prove action is necessary",
      reasoning:
        "Enough reasoning characters to explain how evidence supports the point clearly.",
      evidence: [
        {
          quote: i === 0 ? "My Dear Fellow Clergymen" : "four little children",
          observation: "Context for the quotation.",
          sourceId: "letter",
        },
      ],
    });
  }
  return { thesis: THESIS, body: bodies };
}

function coherentSections(bodyCount = 2) {
  const intro =
    "Civil rights leaders spoke to different audiences. " + THESIS;
  const bodies = [];
  for (let i = 0; i < bodyCount; i += 1) {
    bodies.push(
      `Body paragraph ${i + 1} develops the thesis with a clear point about audience-shaped appeals. ` +
        `King uses specific evidence and then explains how it supports credibility, emotion, or logic for that audience. ` +
        `This section returns to the claim that tools change while the justice goal stays shared.`
    );
  }
  const conclusion =
    "Across both texts, King adjusts rhetorical tools so each audience can hear the call for justice. " +
    "The comparison shows persuasion depends on knowing who must be convinced.";
  return [intro, ...bodies, conclusion];
}

describe("WP-084 essay word count", () => {
  it("counts prose with shared algorithm; section sums match essay total", () => {
    const sections = coherentSections(2);
    const { sectionCounts, total } = countEssaySectionWords(sections);
    const joined = joinEssaySectionsForCount(sections);
    assert.equal(total, sectionCounts.reduce((a, b) => a + b, 0));
    assert.equal(countEssayWords(joined), total);
    assert.equal(wordCount(joined), total);
    assert.equal(countEssayWords("  well-known  term—here  "), 3);
    assert.equal(normalizeEssayProseForWordCount("a\n\nb").includes("a b"), true);
  });

  it("does not treat empty sections as words", () => {
    assert.equal(countEssayWords(""), 0);
    assert.equal(countEssayWords("   \n\n  "), 0);
    const { total } = countEssaySectionWords(["", "one two", ""]);
    assert.equal(total, 2);
  });
});

describe("WP-084 word-count settings", () => {
  it("defaults existing assignments to off", () => {
    assert.equal(DEFAULT_WORD_COUNT_SETTINGS.mode, "off");
    assert.equal(normalizeWordCountSettings({}).mode, "off");
    assert.equal(evaluateWordCountStatus(50, { mode: "off" }).blocksCompletion, false);
  });

  it("validates modes and rejects invalid ranges without inventing student failure", () => {
    assert.equal(validateWordCountSettings({ mode: "nope" }).ok, false);
    assert.equal(
      validateWordCountSettings({ mode: "required_minimum" }).ok,
      false
    );
    assert.equal(
      validateWordCountSettings({
        mode: "required_range",
        minimum: 400,
        maximum: 300,
      }).ok,
      false
    );
    const ok = validateWordCountSettings({
      mode: "advisory_minimum",
      minimum: 300,
    });
    assert.equal(ok.ok, true);
    assert.equal(ok.settings.minimum, 300);
    assert.equal(ok.settings.maximum, null);
  });

  it("advisory never blocks; required can block below minimum", () => {
    const advisory = evaluateWordCountStatus(120, {
      mode: "advisory_minimum",
      minimum: 300,
    });
    assert.equal(advisory.blocksCompletion, false);
    assert.equal(advisory.status, "below");
    const required = evaluateWordCountStatus(120, {
      mode: "required_minimum",
      minimum: 300,
    });
    assert.equal(required.blocksCompletion, true);
    assert.match(formatWordCountStudentMessage(required), /Develop an idea/);
    assert.doesNotMatch(formatWordCountStudentMessage(required), /Add \d+ words/);
  });
});

describe("WP-084 whole-essay review engine", () => {
  it("passes a coherent essay within a 300-word advisory minimum when long enough", () => {
    const sections = coherentSections(3);
    // Pad to exceed 300 words
    sections[1] = sections[1] + " " + Array(80).fill("development").join(" ");
    sections[2] = sections[2] + " " + Array(80).fill("explanation").join(" ");
    const review = buildWholeEssayReview({
      thesis: THESIS,
      outline: makeOutline(3),
      sections,
      wordCountSettings: { mode: "advisory_minimum", minimum: 300 },
    });
    assert.ok(review.essayWordCount >= 300);
    assert.equal(review.wordEvaluation.status, "within");
    assert.equal(review.blocksCompletion, false);
  });

  it("routes below-minimum coaching to missing explanation, not filler count", () => {
    const outline = makeOutline(2);
    const sections = [
      "Short intro with thesis. " + THESIS,
      'King writes "My Dear Fellow Clergymen" and stops.',
      "Second body develops emotion with enough explanation for the audience and returns to the thesis claim carefully.",
      "Conclusion returns to the thesis in fresh language about audience-shaped persuasion.",
    ];
    const review = buildWholeEssayReview({
      thesis: THESIS,
      outline,
      sections,
      wordCountSettings: { mode: "advisory_minimum", minimum: 300 },
    });
    assert.equal(review.wordEvaluation.status, "below");
    const wordFinding = review.findings.find((f) => f.checkId === "word_count");
    assert.ok(wordFinding);
    assert.equal(wordFinding.revisionTargetId, "explanation");
    assert.equal(wordFinding.sectionLabel, "Body Paragraph 1");
    assert.doesNotMatch(wordFinding.whatToCheck, /Add \d+ words/i);
  });

  it("flags missing section as blocking and duplicate bodies without erasing prose", () => {
    const outline = makeOutline(2);
    const dup =
      "This body paragraph repeats the same sentences almost word for word across siblings carefully.";
    const sections = [
      "Intro with enough prose for a reader before the thesis. " + THESIS,
      dup,
      dup,
      "",
    ];
    const review = buildWholeEssayReview({
      thesis: THESIS,
      outline,
      sections,
      wordCountSettings: { mode: "off" },
    });
    assert.ok(review.findings.some((f) => f.id === "missing_conclusion"));
    assert.ok(review.findings.some((f) => f.id.startsWith("duplicate_body_")));
    assert.equal(sections[1], dup);
    assert.equal(sections[2], dup);
    assert.equal(pickPrimaryFinding(review.findings).blocking, true);
  });

  it("Module 6 handoff only surfaces structural findings", () => {
    const outline = makeOutline(2);
    const sections = coherentSections(2);
    sections[1] = "";
    const handoff = buildModule6HandoffReview({
      thesis: THESIS,
      outline,
      sections,
      wordCountSettings: { mode: "required_minimum", minimum: 300 },
    });
    assert.equal(handoff.wordEvaluation.blocksCompletion, false);
    assert.ok(handoff.findings.some((f) => f.id.startsWith("missing_body")));
    assert.equal(
      handoff.findings.every((f) => f.checkId === "missing_duplicate"),
      true
    );
  });

  it("persists whole-essay repair return destination in resume", () => {
    const meta = setModule7ResumeInDraftMeta(
      {},
      {
        currentStepIndex: 2,
        draftIndex: 1,
        sectionType: "body",
        returnTo: "final-review",
        wholeEssayFindingId: "evidence_explanation_0",
        wholeEssayCheckId: "evidence_explanation",
        revisionTargetId: "explanation",
      }
    );
    const repair = readModule7WholeEssayRepair(meta);
    assert.equal(repair.returnTo, "final-review");
    assert.equal(repair.wholeEssayFindingId, "evidence_explanation_0");
    assert.equal(repair.revisionTargetId, "explanation");
  });

  it("Module 8 word-count handoff prefers Module 7 final over stale Module 8 text", () => {
    const {
      resolveAuthoritativeEssayTextForCount,
    } = require("../lib/essay/essayWordCount.js");
    const m7Final =
      "King’s letter and speech both pursue justice with adapted tools for each audience.";
    const resolved = resolveAuthoritativeEssayTextForCount({
      module7: { final_text: m7Final, full_text: "older full" },
      module6: { full_text: "stale module 6" },
    });
    assert.equal(resolved.source, "module7_final_text");
    assert.equal(resolved.text, m7Final);
    assert.equal(countEssayWords(resolved.text), countEssayWords(m7Final));
  });

  it("keeps the whole-essay gate development-only", () => {
    assert.equal(typeof isWholeEssayReviewEnabled(), "boolean");
    assert.equal(
      isWholeEssayReviewEnabled(),
      process.env.NODE_ENV === "development"
    );
  });
});
