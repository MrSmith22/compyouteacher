/**
 * WP-020 — Module 7 teaches revision before asking students to revise.
 * Listen → Notice → Name → Change → Compare.
 */

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const strategy = require("../lib/module7/module7RevisionStrategy.js");
const observation = require("../lib/module7/module7ReadAloudObservation.js");
const presentation = require("../components/module7/module7StepPresentation.js");
const draftSections = require("../components/module7/module7DraftSections.js");

const OUTLINE = {
  thesis: "King adapts appeals for each audience.",
  body: [
    { bucket: "Credibility for each audience" },
    { bucket: "Emotional appeals toward justice" },
    { bucket: "Logical arguments for action" },
  ],
  conclusion: { summary: "Both pursue justice.", finalThought: "Audience shapes appeal." },
};

function readSrc(rel) {
  return fs.readFileSync(path.join(__dirname, rel), "utf8");
}

describe("WP-020 Module 7 revision teaching", () => {
  it("W1. Entry teaches complete draft, revision meaning, and vs proofreading", () => {
    const entry = strategy.getModule7EntryTeaching();
    assert.equal(entry.mutatesProse, false);
    assert.equal(entry.satisfiesGate, false);
    assert.equal(entry.strengthFrame, strategy.MODULE7_REVISION_STRENGTH_FRAME);
    assert.match(entry.teach, /complete/i);
    assert.match(entry.teach, /reader/i);
    assert.match(entry.teach, /one section/i);
    assert.ok(entry.revisionVsProofreading);
    assert.match(entry.revisionVsProofreading.revisionMeans, /clearly/i);
    assert.match(entry.revisionVsProofreading.proofreadingMeans, /spelling|punctuation|surface/i);
    assert.match(entry.revisionVsProofreading.distinction, /proofreading/i);
    assert.deepEqual(entry.sequence, [
      "teach",
      "notice",
      "improve-one-thing",
      "continue",
    ]);
  });

  it("W2. Each Module 7 screen exposes an appropriate strategy", () => {
    const screens = [
      { step: { type: "read-aloud" }, id: "read-aloud", needle: /stumble|repetition|transition|explanation/i },
      { step: { type: "intro" }, id: "introduction", needle: /context|thesis/i },
      { step: { type: "body", bodyIndex: 0 }, id: "body", focus: "evidence_explanation" },
      { step: { type: "body", bodyIndex: 1 }, id: "body", focus: "thesis_connection" },
      { step: { type: "body", bodyIndex: 2 }, id: "body", focus: "transition" },
      { step: { type: "conclusion" }, id: "conclusion", needle: /together|final thought/i },
      { step: { type: "final-review" }, id: "final-review", needle: /communicates more clearly|complete starting point|made stronger/i },
    ];

    for (const screen of screens) {
      const s = strategy.getModule7RevisionStrategy(screen.step);
      assert.equal(s.id, screen.id);
      assert.equal(s.mutatesProse, false);
      assert.ok(s.teach);
      assert.ok(s.noticePrompt);
      assert.ok(s.improvePrompt);
      if (screen.needle) {
        assert.match(`${s.teach} ${s.noticePrompt} ${s.improvePrompt}`, screen.needle);
      }
      if (screen.focus) {
        assert.equal(s.focusId, screen.focus);
      }
    }
  });

  it("W3. Strength-framed wording avoids deficit language", () => {
    const all = [
      strategy.getModule7EntryTeaching(),
      strategy.getReadAloudRevisionStrategy(),
      strategy.getIntroductionRevisionStrategy(),
      strategy.getBodyRevisionStrategy(0),
      strategy.getBodyRevisionStrategy(1),
      strategy.getBodyRevisionStrategy(2),
      strategy.getConclusionRevisionStrategy(),
      strategy.getFinalReviewRevisionStrategy(),
    ];
    for (const s of all) {
      const text = strategy.collectStrategyTexts(s).join("\n");
      assert.equal(strategy.usesStrengthFramedLanguage(text), true);
      assert.equal(/wrong|bad draft|fix your mistakes|fix mistakes/i.test(text), false);
      assert.match(text, /stronger|complete|clear/i);
    }
  });

  it("W4. Instructional helpers never mutate or auto-fill student prose", () => {
    const sections = ["Intro prose.", "Body one.", "Body two.", "Body three.", "Conclusion."];
    const s = strategy.getBodyRevisionStrategy(0);
    const next = strategy.applyStrategyWithoutMutatingProse(s, sections);
    assert.deepEqual(next, sections);
    assert.notEqual(next, sections);
    assert.equal(s.mutatesProse, false);
    assert.equal(s.satisfiesGate, false);

    const afterObs = observation.applyObservationWithoutMutatingProse(
      { categoryId: "stumble", note: "intro" },
      sections
    );
    assert.deepEqual(afterObs, sections);
    assert.equal(
      observation.observationTouchesProseFields({
        categoryId: "stumble",
        note: "intro",
      }),
      false
    );
    assert.equal(
      observation.observationTouchesProseFields({
        full_text: "x",
        categoryId: "stumble",
      }),
      true
    );
  });

  it("W5. Presentation wires strategy onto every Module 7 step type", () => {
    const read = presentation.getModule7StepPresentation(
      { type: presentation.MODULE7_STEP_TYPES.READ_ALOUD },
      OUTLINE
    );
    const intro = presentation.getModule7StepPresentation({ type: "intro" }, OUTLINE);
    const body = presentation.getModule7StepPresentation(
      { type: "body", bodyIndex: 1 },
      OUTLINE
    );
    const conclusion = presentation.getModule7StepPresentation(
      { type: "conclusion" },
      OUTLINE
    );
    const finalReview = presentation.getModule7StepPresentation(
      { type: presentation.MODULE7_STEP_TYPES.FINAL_REVIEW },
      OUTLINE
    );

    for (const item of [read, intro, body, conclusion, finalReview]) {
      assert.ok(item.strategy);
      assert.equal(item.strategy.mutatesProse, false);
      assert.equal(item.strengthFrame, strategy.MODULE7_REVISION_STRENGTH_FRAME);
      assert.ok(item.jobRightNow?.steps?.length >= 3);
    }
    assert.equal(body.strategy.focusId, "thesis_connection");
    assert.equal(finalReview.strategy.id, "final-review");
  });

  it("W6. Visible revision cycle includes Listen → Notice → Name → Change → Compare", () => {
    assert.deepEqual(observation.MODULE7_REVISION_CYCLE, [
      "Listen",
      "Notice",
      "Name",
      "Change",
      "Compare",
    ]);
    assert.match(
      observation.MODULE7_REVISION_CYCLE_LABEL,
      /Listen → Notice → Name → Change → Compare/
    );
    const task = readSrc("../components/module7/ModuleSevenReadAloudTaskCard.jsx");
    assert.ok(task.includes("MODULE7_REVISION_CYCLE_LABEL"));
    assert.ok(task.includes("Listen like a reader"));
    assert.match(
      task.replace(/\s+/g, " "),
      /find places where your ideas may not reach the reader clearly/i
    );
    assert.ok(task.includes("decide what to revise"));
    assert.ok(task.includes("module7-revision-cycle"));
  });

  it("W7. DOM/source order remains task → essay → recorder → observation → optional teaching", () => {
    const modSeven = readSrc("../components/ModuleSeven.js");
    const primaryStart = modSeven.indexOf('data-testid="module7-read-aloud-primary"');
    assert.ok(primaryStart > 0);
    const slice = modSeven.slice(primaryStart, primaryStart + 4500);
    const taskAt = slice.indexOf("ModuleSevenReadAloudTaskCard");
    const essayAt = slice.indexOf('data-testid="module7-current-essay"');
    const recorderAt = slice.indexOf("checklist={presentation.strategy");
    const observationAt = slice.indexOf("ModuleSevenReadAloudObservation");
    const secondaryAt = slice.indexOf("ModuleSevenReadAloudSecondaryTeaching");
    assert.ok(taskAt > 0);
    assert.ok(essayAt > taskAt);
    assert.ok(recorderAt > essayAt);
    assert.ok(observationAt > recorderAt);
    assert.ok(secondaryAt > observationAt);
    assert.ok(slice.includes("{audioURL ? ("));
    assert.equal(slice.indexOf("showEntryTeaching={true}"), -1);
    assert.ok(modSeven.includes('data-wp020-read-aloud={isReadAloudStep ? "task-first"'));
  });

  it("W8. Observation category renders only with playback; gate needs recording + category", () => {
    const needRecording = observation.evaluateReadAloudAdvanceGate({
      audioURL: null,
      observation: observation.emptyReadAloudObservation(),
    });
    assert.equal(needRecording.ok, false);
    assert.equal(needRecording.reason, "need_recording");
    assert.equal(
      needRecording.message,
      observation.MODULE7_READ_ALOUD_GATE.NEED_RECORDING
    );

    const needObs = observation.evaluateReadAloudAdvanceGate({
      audioURL: "blob:audio",
      observation: { categoryId: "", note: "I wrote a note" },
    });
    assert.equal(needObs.ok, false);
    assert.equal(needObs.reason, "need_observation");
    assert.equal(
      needObs.message,
      observation.MODULE7_READ_ALOUD_GATE.NEED_OBSERVATION
    );

    const readyWithoutNote = observation.evaluateReadAloudAdvanceGate({
      audioURL: "blob:audio",
      observation: { categoryId: "abrupt", note: "" },
    });
    assert.equal(readyWithoutNote.ok, true);
    assert.equal(readyWithoutNote.reason, "ready");

    const readyWithNote = observation.evaluateReadAloudAdvanceGate({
      audioURL: "blob:audio",
      observation: { categoryId: "explanation", note: "Body 2 jumps" },
    });
    assert.equal(readyWithNote.ok, true);

    const modSeven = readSrc("../components/ModuleSeven.js");
    assert.ok(modSeven.includes("evaluateReadAloudAdvanceGate"));
    assert.ok(modSeven.includes("{audioURL ? ("));
    assert.ok(modSeven.includes("ModuleSevenReadAloudObservation"));
    assert.ok(modSeven.includes("isReadAloudStep && !canKeepGoing"));
    assert.ok(modSeven.includes('data-testid="module7-read-aloud-gate"'));
    assert.ok(modSeven.includes("NEED_RECORDING") === false);
    assert.ok(modSeven.includes("readAloudGate.message"));
  });

  it("W9. Observation never enters full_text/final_text/section prose; reset on new recording", () => {
    const modSeven = readSrc("../components/ModuleSeven.js");
    const saveSliceStart = modSeven.indexOf("const saveDraft = async");
    const saveSlice = modSeven.slice(saveSliceStart, saveSliceStart + 2800);
    assert.ok(saveSlice.includes("full_text: text"));
    assert.ok(saveSlice.includes("final_text: finalized ? text : null"));
    assert.equal(saveSlice.includes("readAloudObservation"), false);
    assert.equal(saveSlice.includes("categoryId"), false);

    assert.ok(modSeven.includes("setReadAloudObservation(emptyReadAloudObservation())"));
    const startAt = modSeven.indexOf("const startRecording");
    const startSlice = modSeven.slice(startAt, startAt + 2500);
    assert.ok(startSlice.includes("setReadAloudObservation(emptyReadAloudObservation())"));
    const stopAt = modSeven.indexOf("const localUrl = URL.createObjectURL");
    const stopSlice = modSeven.slice(stopAt, stopAt + 400);
    assert.ok(stopSlice.includes("setReadAloudObservation(emptyReadAloudObservation())"));
  });

  it("W10. Read Aloud hides Save revision; recording persistence wiring intact", () => {
    const modSeven = readSrc("../components/ModuleSeven.js");
    assert.ok(modSeven.includes("{!isReadAloudStep ? ("));
    assert.ok(modSeven.includes("Save revision"));
    assert.ok(modSeven.includes("/api/readaloud"));
    assert.ok(modSeven.includes("recording_saved"));
    assert.ok(modSeven.includes("upsertModule7DraftArtifact"));
    assert.ok(modSeven.includes("saveDraft({ finalized: true })"));
    assert.ok(modSeven.includes("startRecording"));
    assert.ok(modSeven.includes("stopRecording"));

    const readAloud = readSrc("../components/module7/ModuleSevenReadAloud.jsx");
    assert.ok(readAloud.includes("download-latest-audio-ui"));
    assert.ok(readAloud.includes("Start read-aloud"));
    assert.ok(readAloud.includes("<audio controls"));
  });

  it("W11. Section strategy identifies Change; final review identifies Compare", () => {
    assert.equal(observation.MODULE7_CHANGE_STAGE_LABEL, "NOW: CHANGE");
    assert.equal(observation.MODULE7_COMPARE_STAGE_LABEL, "NOW: COMPARE");
    const card = readSrc("../components/module7/ModuleSevenStrategyCard.jsx");
    assert.ok(card.includes("MODULE7_CHANGE_STAGE_LABEL"));
    assert.ok(card.includes("MODULE7_COMPARE_STAGE_LABEL"));
    assert.ok(card.includes('data-wp020-revision-stage={revisionStage}'));
    assert.ok(card.includes("module7-revision-stage-label"));

    const modSeven = readSrc("../components/ModuleSeven.js");
    assert.ok(
      modSeven.includes('revisionStage={isFinalReviewStep ? "compare" : "change"}')
    );
  });

  it("W12. Accessible radio-group and live-region wiring exist", () => {
    const obsUi = readSrc("../components/module7/ModuleSevenReadAloudObservation.jsx");
    assert.ok(obsUi.includes("<fieldset"));
    assert.ok(obsUi.includes("<legend"));
    assert.ok(obsUi.includes('role="radiogroup"'));
    assert.ok(obsUi.includes('type="radio"'));
    assert.ok(obsUi.includes("Selected"));
    assert.ok(obsUi.includes('htmlFor="module7-observation-note"'));
    assert.ok(obsUi.includes("MODULE7_OBSERVATION_NOTE_MAX"));
    assert.ok(obsUi.includes("min-h-[44px]"));

    const modSeven = readSrc("../components/ModuleSeven.js");
    assert.ok(modSeven.includes('aria-live="polite"'));
    assert.ok(modSeven.includes('data-testid="module7-read-aloud-gate"'));
    assert.ok(modSeven.includes("overflow-x-hidden"));
    assert.ok(modSeven.includes("min-h-[44px]"));
  });

  it("W13. Disclosures retain affordances; no empty disclosures; optional teaching below", () => {
    const disclosure = readSrc("../components/shared/InstructionalDisclosure.jsx");
    assert.ok(disclosure.includes("aria-expanded"));
    assert.ok(disclosure.includes("min-h-[44px]"));
    assert.ok(disclosure.includes("focus-visible:ring-2") || disclosure.includes("HIERARCHY_FOCUS_RING_CLASS"));
    assert.ok(disclosure.includes('open ? "Hide" : "Show"'));
    assert.ok(disclosure.includes('open ? "−" : "+"'));
    assert.ok(disclosure.includes("if (!hasContent) return null"));

    const alias = readSrc("../components/module7/ModuleSevenDisclosure.jsx");
    assert.ok(alias.includes("InstructionalDisclosure"));

    const secondary = readSrc(
      "../components/module7/ModuleSevenReadAloudSecondaryTeaching.jsx"
    );
    assert.ok(secondary.includes("What revision means here"));
    assert.ok(secondary.includes("Revision is not proofreading"));
    assert.ok(secondary.includes("Listening tips and example"));
    assert.ok(secondary.includes("Optional — after you record"));
    assert.ok(secondary.includes("ModuleSevenDisclosure"));
  });

  it("W14. Observation categories match pedagogical contract", () => {
    const labels = observation.MODULE7_OBSERVATION_CATEGORIES.map((c) => c.label);
    assert.ok(labels.includes("I stumbled or lost my place."));
    assert.ok(labels.includes("An idea repeated without adding meaning."));
    assert.ok(labels.includes("The writing jumped abruptly."));
    assert.ok(labels.includes("A reader may need more explanation."));
    assert.ok(labels.includes("Something else stood out."));
    assert.equal(observation.MODULE7_OBSERVATION_NOTE_MAX, 240);
    assert.equal(observation.normalizeObservationNote("x".repeat(300)).length, 240);
  });

  it("W15. Layout contract and prose assembly remain intact for Module 8", () => {
    const sections = ["A", "B", "C", "D", "E"];
    assert.equal(draftSections.joinSections(sections), "A\n\nB\n\nC\n\nD\n\nE");
    assert.deepEqual(draftSections.alignSectionsToOutline(["A", "B"], 5), [
      "A",
      "B",
      "",
      "",
      "",
    ]);
    assert.equal(strategy.MODULE7_LAYOUT_CONTRACT.viewports.includes(320), true);
    assert.equal(strategy.MODULE7_LAYOUT_CONTRACT.mobile.minActionTargetPx, 44);
  });
});
