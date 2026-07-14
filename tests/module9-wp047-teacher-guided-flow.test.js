/**
 * WP-047 — Module 9 teacher-guided sequential journey (not LMS quiz framing).
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { MODULE9_APA_JOURNEY } from "../lib/module9/module9ApaLearning.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const readSrc = (rel) => readFileSync(join(root, rel), "utf8");

describe("WP-047 Module 9 teacher-guided flow", () => {
  it("presents one sequential journey in teacher-guided order", () => {
    const m9 = readSrc("components/ModuleNine.js");
    assert.ok(m9.includes('data-testid="module9-journey-progress"'));
    assert.deepEqual([...MODULE9_APA_JOURNEY], [
      "Learn the APA moves you’ll use",
      "Open the paper you prepared",
      "Format your paper with the APA guide",
      "Download, check, and submit your PDF",
    ]);

    const openIdx = m9.indexOf("Open the paper you prepared");
    const formatIdx = m9.indexOf("Format your paper with the APA guide");
    const submitIdx = m9.indexOf("Download, check, and submit your PDF");
    assert.ok(openIdx > 0);
    assert.ok(formatIdx > openIdx);
    assert.ok(submitIdx > formatIdx);

    assert.ok(m9.includes("viewedStep === 1 && !alreadySubmitted && !submitted"));
    assert.ok(m9.includes("viewedStep === 2 && submitted && !alreadySubmitted"));
    assert.ok(m9.includes("viewedStep === 3 &&"));
    assert.ok(m9.includes("viewedStep === 4 &&"));
    assert.ok(m9.includes("MODULE9_APA_JOURNEY.map"));
  });

  it("removes Guided mode / all-steps branch and student quiz framing", () => {
    const m9 = readSrc("components/ModuleNine.js");
    const lesson = readSrc("components/module9/ModuleNineApaLesson.jsx");

    assert.equal(m9.includes("guidedMode"), false);
    assert.equal(m9.includes("setGuidedMode"), false);
    assert.equal(/Guided mode/i.test(m9), false);
    assert.equal(/\(!guidedMode \|\|/.test(m9), false);

    assert.equal(/first-try matches/i.test(m9), false);
    assert.equal(/pass\/fail/i.test(m9 + lesson), false);
    assert.equal(/Practice summary:/i.test(lesson), false);
    assert.equal(/first tries matched/i.test(lesson), false);
    assert.equal(/Format checklist confirmation/i.test(m9), false);
    assert.equal(/Step \d of 4:/i.test(m9), false);
    assert.equal(/APA practice complete/i.test(m9), false);
    assert.equal(/submit quiz/i.test(m9 + lesson), false);
  });

  it("keeps internal score persistence and teacher analytics contracts", () => {
    const m9 = readSrc("components/ModuleNine.js");
    assert.ok(m9.includes('from("module9_quiz")'));
    assert.ok(m9.includes("score: summary.score"));
    assert.ok(m9.includes("total: summary.total"));
    assert.ok(m9.includes("submitted_at:"));
    assert.ok(m9.includes('quiz_submitted'));
    assert.ok(m9.includes('score_definition: "first_attempt"'));
    assert.ok(m9.includes("setScore(summary.score)"));
    assert.ok(m9.includes("hasResumedJourneyRef"));

    const teacherDash = readSrc("lib/supabase/helpers/teacherDashboard.ts");
    assert.ok(teacherDash.includes("module9_quiz"));
  });

  it("reuses verified Google Docs and keeps state-driven recovery", () => {
    const m9 = readSrc("components/ModuleNine.js");
    assert.ok(m9.includes("hydrateSubmissionGoogleDoc"));
    assert.ok(m9.includes("createOrUpdateSubmissionGoogleDoc"));
    assert.ok(m9.includes("SubmissionDocRecoveryPanel"));
    assert.ok(m9.includes("forceCreate: true"));
    assert.ok(m9.includes("forceCreate: false"));
    assert.ok(m9.includes("onUpdate="));
    assert.ok(m9.includes("onCreate="));
    assert.ok(m9.includes("onCreateNew="));
    assert.ok(m9.includes("onRetry="));
    assert.ok(
      m9.includes(
        "You do not need\n              to create a new export when that document is already ready."
      ) || /do not need[\s\S]{0,40}new export/i.test(m9)
    );
    assert.equal(m9.includes("Export Final Draft to Google Docs"), false);
    assert.equal(m9.includes('fetch("/api/export-to-docs"'), false);
  });

  it("keeps WP-038–046 instructional sequence and gates", () => {
    const m9 = readSrc("components/ModuleNine.js");
    assert.ok(m9.includes("ModuleNineApaLesson"));
    assert.ok(m9.includes("ModuleNineApaQuickGuide"));
    assert.ok(m9.includes("ModuleNinePdfDownloadVisual"));
    assert.ok(m9.includes('data-testid="module9-pdf-upload-coaching"'));
    assert.ok(m9.includes('data-testid="module9-wrong-pdf-reassurance"'));
    assert.ok(m9.includes('data-testid="module9-final-upload-checklist"'));
    assert.ok(m9.includes('data-testid="module9-do-not-rewrite-coaching"'));

    const coachIdx = m9.indexOf('data-testid="module9-pdf-upload-coaching"');
    const reassureIdx = m9.indexOf('data-testid="module9-wrong-pdf-reassurance"');
    const inputIdx = m9.indexOf('data-testid="module9-pdf-file-input"');
    const selectedIdx = m9.indexOf('data-testid="module9-pdf-selected"');
    const checklistIdx = m9.indexOf('data-testid="module9-final-upload-checklist"');
    const buttonIdx = m9.indexOf('data-testid="module9-upload-final-pdf"');
    assert.ok(coachIdx < reassureIdx && reassureIdx < inputIdx);
    assert.ok(inputIdx < selectedIdx && selectedIdx < checklistIdx);
    assert.ok(checklistIdx < buttonIdx);

    assert.ok(m9.includes("canUpload ="));
    assert.ok(m9.includes("finalUploadChecklistComplete"));
    assert.ok(m9.includes("docReady"));
    assert.ok(m9.includes("checklistComplete"));
    assert.ok(m9.includes('router.push("/modules/9/success")'));
    assert.ok(m9.includes("requireModuleAccess"));
  });

  it("keeps celebratory teacherly success-page language", () => {
    const success = readSrc("app/modules/9/success/page.js");
    assert.ok(/submitted successfully/i.test(success));
    assert.ok(/Great work/i.test(success));
    assert.ok(/Writing Processor complete/i.test(success));
    assert.ok(/Be proud of the work you/i.test(success));
    assert.ok(/Contact your teacher before you try to change or resubmit/i.test(success));
  });
});
