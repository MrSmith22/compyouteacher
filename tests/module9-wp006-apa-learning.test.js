/**
 * WP-006 / WP-038 / WP-039 / WP-040 — Module 9 APA teach-before-ask.
 */

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const apa = require("../lib/module9/module9ApaLearning.js");

function readSrc(rel) {
  return fs.readFileSync(path.join(__dirname, rel), "utf8");
}

describe("WP-006 Module 9 APA learning", () => {
  it("1. Every practice question maps to a taught concept", () => {
    for (const concept of apa.MODULE9_APA_CONCEPTS) {
      assert.equal(apa.conceptHasTeachingBeforePractice(concept), true);
      assert.ok(concept.practicePrompt);
      assert.ok(concept.options.some((o) => o.correct));
      assert.equal(concept.options.filter((o) => o.correct).length, 1);
    }
  });

  it("2. No question can render before its teaching content", () => {
    const lesson = readSrc("../components/module9/ModuleNineApaLesson.jsx");
    const conceptBlockStart = lesson.indexOf('data-testid="module9-apa-concept"');
    const slice = lesson.slice(conceptBlockStart);
    const teachingAt = slice.indexOf('data-testid="module9-apa-teaching"');
    const visualAt = slice.indexOf("<ModuleNineApaVisual");
    const tryAt = slice.indexOf('data-testid="module9-apa-try-it"');
    assert.ok(conceptBlockStart > 0);
    assert.ok(teachingAt > 0);
    assert.ok(visualAt > teachingAt);
    assert.ok(tryAt > visualAt);
  });

  it("3. Only one practice question is active at a time", () => {
    assert.ok(apa.MODULE9_APA_CONCEPTS.length >= 5);
    let state = apa.buildEmptyApaLessonState();
    assert.equal(state.conceptIndex, 0);
    const first = apa.getModule9ApaConceptAt(0);
    state = apa.recordApaAttempt(state, first.id, first.options.find((o) => o.correct).id);
    state = apa.advanceApaConcept(state);
    assert.equal(state.conceptIndex, 1);
    const lesson = readSrc("../components/module9/ModuleNineApaLesson.jsx");
    assert.ok(lesson.includes("conceptIndex"));
    assert.equal((lesson.match(/practicePrompt/g) || []).length >= 1, true);
  });

  it("4. Every concept has a visual example/model", () => {
    const visual = readSrc("../components/module9/ModuleNineApaVisual.jsx");
    for (const concept of apa.MODULE9_APA_CONCEPTS) {
      assert.ok(concept.visualId);
      assert.ok(concept.visualCaption);
      assert.ok(concept.visualAlt);
      assert.ok(visual.includes(`"${concept.visualId}"`) || visual.includes(concept.visualId));
    }
  });

  it("5–6. Correct and incorrect options have teaching feedback", () => {
    for (const concept of apa.MODULE9_APA_CONCEPTS) {
      assert.equal(apa.everyOptionHasTeachingFeedback(concept), true);
      for (const option of concept.options) {
        assert.match(option.feedback, /APA|assignment|format|page|citation|References|abstract|essay|reader|teacher/i);
        assert.equal(/^correct[.!]?$/i.test(option.feedback.trim()), false);
        assert.equal(/^incorrect[.!]?$/i.test(option.feedback.trim()), false);
      }
    }
  });

  it("7. Feedback permits learning and continuation without perfection", () => {
    const concept = apa.MODULE9_APA_CONCEPTS[0];
    const wrong = concept.options.find((o) => !o.correct);
    let state = apa.buildEmptyApaLessonState();
    state = apa.recordApaAttempt(state, concept.id, wrong.id);
    assert.equal(apa.canContinueApaConcept(state, concept.id), true);
    assert.equal(state.responses[concept.id].firstAttemptCorrect, false);
    const summary = apa.summarizeApaLesson(state);
    assert.equal(summary.score, 0);
  });

  it("8. Back/Continue preserve in-session responses", () => {
    const c0 = apa.MODULE9_APA_CONCEPTS[0];
    const c1 = apa.MODULE9_APA_CONCEPTS[1];
    let state = apa.buildEmptyApaLessonState();
    state = apa.recordApaAttempt(
      state,
      c0.id,
      c0.options.find((o) => o.correct).id
    );
    state = apa.advanceApaConcept(state);
    state = apa.recordApaAttempt(
      state,
      c1.id,
      c1.options.find((o) => !o.correct).id
    );
    state = apa.retreatApaConcept(state);
    assert.equal(state.conceptIndex, 0);
    assert.equal(state.responses[c0.id].feedbackSeen, true);
    assert.equal(state.responses[c1.id].feedbackSeen, true);
    assert.equal(state.responses[c1.id].firstAttemptCorrect, false);
  });

  it("9–10. Quick Guide uses same content model and is wired before/after practice", () => {
    const sections = apa.getModule9ApaQuickGuideSections();
    assert.equal(sections.length, apa.MODULE9_APA_CONCEPTS.length);
    assert.deepEqual(
      sections.map((s) => s.id),
      apa.MODULE9_APA_CONCEPTS.map((c) => c.id)
    );
    const guide = readSrc("../components/module9/ModuleNineApaQuickGuide.jsx");
    const lesson = readSrc("../components/module9/ModuleNineApaLesson.jsx");
    const modNine = readSrc("../components/ModuleNine.js");
    assert.ok(guide.includes("getModule9ApaQuickGuideSections"));
    assert.ok(guide.includes("MODULE9_APA_SECONDARY_RESOURCES"));
    assert.ok(lesson.includes("ModuleNineApaQuickGuide"));
    assert.ok(modNine.includes("ModuleNineApaQuickGuide"));
    assert.ok(modNine.includes("ModuleNineApaLesson"));
  });

  it("11–12. Legacy inaccurate APA claims absent; assignment-specific labeled", () => {
    const uiCorpus = [
      readSrc("../components/ModuleNine.js"),
      readSrc("../components/module9/ModuleNineApaLesson.jsx"),
      readSrc("../components/module9/ModuleNineApaQuickGuide.jsx"),
    ]
      .join("\n")
      .toLowerCase();
    for (const claim of apa.MODULE9_APA_FORBIDDEN_CLAIMS) {
      assert.equal(uiCorpus.includes(claim.toLowerCase()), false, claim);
    }
    assert.equal(uiCorpus.includes("submit quiz"), false);

    for (const concept of apa.MODULE9_APA_CONCEPTS) {
      for (const legacy of apa.MODULE9_APA_LEGACY_WRONG_CORRECT) {
        const hit = concept.options.find((o) => o.label === legacy);
        if (hit) assert.equal(hit.correct, false);
      }
      assert.equal(
        concept.options.some(
          (o) => o.correct && o.label === "Title and page number, right aligned"
        ),
        false
      );
    }

    const pageSetup = apa.getModule9ApaConcept("page-setup");
    assert.match(pageSetup.assignmentRule, /for this assignment/i);
    assert.match(pageSetup.assignmentRule, /times new roman/i);
    assert.match(pageSetup.assignmentRule, /also allows other fonts/i);
    const pageNumbers = apa.getModule9ApaConcept("page-numbers");
    assert.equal(
      pageNumbers.options.find((o) => o.correct)?.id,
      "page-only"
    );
    const abs = apa.getModule9ApaConcept("abstract-exceptions");
    assert.match(abs.assignmentRule, /do not add an abstract unless/i);
  });

  it("13–14. Completion preserves module9_quiz contract and teacher fields", () => {
    const modNine = readSrc("../components/ModuleNine.js");
    assert.ok(modNine.includes('from("module9_quiz")'));
    assert.ok(modNine.includes("score: summary.score"));
    assert.ok(modNine.includes("total: summary.total"));
    assert.ok(modNine.includes("submitted_at:"));
    assert.ok(modNine.includes('quiz_submitted'));
    assert.ok(modNine.includes("score_definition: \"first_attempt\""));

    const teacherDash = readSrc("../lib/supabase/helpers/teacherDashboard.ts");
    assert.ok(teacherDash.includes("module9_quiz"));
    const overview = readSrc("../app/api/teacher/overview/route.js");
    assert.ok(overview.includes("quiz_score") || overview.includes("score"));
  });

  it("15. Export/checklist/PDF gates remain after APA completion", () => {
    const modNine = readSrc("../components/ModuleNine.js");
    assert.ok(modNine.includes("handleExportToGoogleDocs"));
    assert.ok(modNine.includes("/api/export-to-docs"));
    assert.ok(modNine.includes("getModule9FormattingChecklistItems") || modNine.includes("CHECKLIST_ITEMS"));
    assert.ok(modNine.includes("/api/final-pdf"));
    assert.ok(modNine.includes("canUpload ="));
    assert.ok(modNine.includes("submitted && exportUrl && checklistComplete"));
    assert.ok(modNine.includes('router.push("/modules/9/success")'));
    assert.ok(modNine.includes("alreadySubmitted"));
  });

  it("16. No quiz completion inferred from instructional copy alone", () => {
    const summary = apa.summarizeApaLesson(apa.buildEmptyApaLessonState());
    assert.equal(summary.allFeedbackSeen, false);
    assert.equal(summary.score, 0);
    const modNine = readSrc("../components/ModuleNine.js");
    assert.ok(modNine.includes("persistApaPractice"));
    assert.ok(modNine.includes("onComplete={persistApaPractice}"));
  });

  it("17. Focus/live-region/accessibility wiring exists", () => {
    const lesson = readSrc("../components/module9/ModuleNineApaLesson.jsx");
    assert.ok(lesson.includes('aria-live="polite"'));
    assert.ok(lesson.includes("<fieldset"));
    assert.ok(lesson.includes("<legend"));
    assert.ok(lesson.includes('role="radiogroup"'));
    assert.ok(lesson.includes("headingRef"));
    assert.ok(lesson.includes("prefers-reduced-motion"));
    const disclosure = readSrc("../components/module9/ModuleNineDisclosure.jsx");
    assert.ok(disclosure.includes("aria-expanded"));
    assert.ok(disclosure.includes("min-h-[44px]"));
    assert.ok(disclosure.includes("focus-visible:ring-2"));
  });

  it("18. Responsive layout contract covers 320–1440", () => {
    assert.deepEqual(apa.MODULE9_LAYOUT_CONTRACT.viewports, [
      320, 390, 768, 1024, 1440,
    ]);
    assert.equal(apa.MODULE9_LAYOUT_CONTRACT.mobile.minActionTargetPx, 44);
    assert.equal(apa.MODULE9_LAYOUT_CONTRACT.contentMax, "lg");
    const modNine = readSrc("../components/ModuleNine.js");
    assert.ok(modNine.includes("contentMax={MODULE9_LAYOUT_CONTRACT.contentMax}"));
    assert.ok(modNine.includes("overflow-x-hidden"));
  });

  it("19. Submitted-student path still short-circuits the lesson", () => {
    const modNine = readSrc("../components/ModuleNine.js");
    assert.ok(modNine.includes("alreadySubmitted && ("));
    assert.ok(modNine.includes("Submitted: Final PDF received"));
    assert.ok(modNine.includes("!alreadySubmitted && !submitted"));
  });

  it("20. No migration or student-prose mutation in APA learning helpers", () => {
    const helpers = readSrc("../lib/module9/module9ApaLearning.js");
    assert.equal(helpers.includes("full_text"), false);
    assert.equal(helpers.includes("final_text"), false);
    assert.equal(helpers.includes("CREATE TABLE"), false);
    assert.equal(helpers.includes("alter table"), false);
    const migrations = fs.readdirSync(
      path.join(__dirname, "../supabase/migrations")
    );
    assert.equal(
      migrations.some((name) => /module9.*quiz|apa.*learn/i.test(name)),
      false
    );
  });

  it("Extra. First-attempt score stays stable after retry", () => {
    const concept = apa.MODULE9_APA_CONCEPTS[2];
    const wrong = concept.options.find((o) => !o.correct);
    const right = concept.options.find((o) => o.correct);
    let state = apa.buildEmptyApaLessonState();
    state = apa.recordApaAttempt(state, concept.id, wrong.id);
    state = apa.recordApaAttempt(state, concept.id, right.id);
    assert.equal(state.responses[concept.id].firstAttemptCorrect, false);
    assert.equal(state.responses[concept.id].selectedOptionId, right.id);
    assert.equal(apa.summarizeApaLesson(state).score, 0);
  });
});
