const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const welcome = require("../lib/module1/assignmentWelcomeHelpers.js");
const step2 = require("../lib/module1/step2MicrostageHelpers.js");
const vocab = require("../lib/module1/vocabularyTermHelpers.js");
const promptHelpers = require("../lib/module1/promptBreakdownHelpers.js");

describe("CP-A instructional presentation: welcome + prompt framing", () => {
  it("welcome still has one dominant action and no response controls", () => {
    const model = welcome.getAssignmentWelcomePresentation({});
    assert.equal(model.showPromptControls, false);
    assert.equal(model.showQuiz, false);
    assert.equal(model.layout.onePrimaryAction, true);
    assert.equal(model.primaryActionLabel, "Start with the assignment");
    assert.equal(model.writingPathVisual, true);
  });

  it("welcome contains a compact six-step writing path", () => {
    const model = welcome.getAssignmentWelcomePresentation({});
    assert.equal(model.processPreview.length, 6);
    assert.equal(model.pathCurrentIndex, 0);
    assert.match(model.destinationLabel, /essay/i);
  });

  it("welcome copy does not repeat one-decision-at-a-time excessively", () => {
    const model = welcome.getAssignmentWelcomePresentation({});
    const count = welcome.countOneDecisionAtATimePhrases(model);
    assert.ok(count <= 1, `expected ≤1 repetition, got ${count}`);
    assert.match(model.welcomingLine, /path forward/i);
  });

  it("prompt card uses prominent teacher-assignment framing", () => {
    assert.match(
      welcome.PROMPT_ASSIGNMENT_CARD_COPY.label,
      /teacher.?s assignment/i
    );
    assert.match(
      welcome.PROMPT_ASSIGNMENT_CARD_COPY.introduction,
      /goal your teacher/i
    );
    const page = fs.readFileSync(
      path.join(__dirname, "../app/modules/1/prompt/page.js"),
      "utf8"
    );
    assert.match(page, /teacher-assignment-card/);
    assert.match(page, /PROMPT_ASSIGNMENT_CARD_COPY/);
    assert.match(page, /exact-assignment-prompt/);
  });

  it("exact assignment prompt remains read-only and unchanged", () => {
    const page = fs.readFileSync(
      path.join(__dirname, "../app/modules/1/prompt/page.js"),
      "utf8"
    );
    assert.match(page, /mlkAssignmentDefinition/);
    assert.match(page, /<blockquote[\s\S]*\{prompt\}/);
    const cardSlice = page.slice(page.indexOf("teacher-assignment-card"));
    assert.doesNotMatch(cardSlice.slice(0, 800), /<textarea/);
  });

  it("prompt still shows only one question at a time", () => {
    assert.equal(promptHelpers.PROMPT_STEP_KEYS.length, 5);
    assert.equal(promptHelpers.PROMPT_LAYOUT_CONTRACT.oneDominantQuestion, true);
  });
});

describe("CP-A instructional presentation: vocabulary concepts", () => {
  it("rhetoric is explicitly the umbrella over ethos, pathos, and logos", () => {
    const rhetoric = vocab.getVocabularyTerm(0);
    assert.equal(rhetoric.id, "rhetoric");
    assert.equal(rhetoric.visual.kind, "umbrella");
    assert.match(rhetoric.plainLanguage, /umbrella|larger category/i);
    assert.ok(
      rhetoric.visual.children.some((c) => /ethos/i.test(c)) &&
        rhetoric.visual.children.some((c) => /pathos/i.test(c)) &&
        rhetoric.visual.children.some((c) => /logos/i.test(c))
    );
  });

  it("ethos includes trust/credibility and audience persuasion", () => {
    const ethos = vocab.VOCABULARY_TERMS.find((t) => t.id === "ethos");
    assert.match(ethos.definition, /trustworthy|credibility|trust/i);
    assert.match(ethos.definition, /persuade/i);
    assert.match(ethos.plainLanguage, /trust/i);
  });

  it("pathos includes emotion and audience response", () => {
    const pathos = vocab.VOCABULARY_TERMS.find((t) => t.id === "pathos");
    assert.match(pathos.definition, /emotion/i);
    assert.match(pathos.definition, /respond/i);
  });

  it("logos includes reasons/evidence and a supported conclusion", () => {
    const logos = vocab.VOCABULARY_TERMS.find((t) => t.id === "logos");
    assert.match(logos.definition, /reasons|evidence/i);
    assert.match(logos.visual.caption, /conclusion/i);
    assert.ok(logos.visual.steps.some((s) => /evidence|reason/i.test(s)));
  });

  it("audience is distinct from purpose", () => {
    const check = vocab.audienceDistinctFromPurpose();
    assert.equal(check.ok, true);
  });

  it("purpose includes understand, feel, believe, or do", () => {
    const purpose = vocab.VOCABULARY_TERMS.find((t) => t.id === "purpose");
    assert.match(purpose.definition, /understand, feel, believe, or do/i);
  });

  it("every vocabulary term has definition, plain language, visual, King example, essay action", () => {
    assert.equal(vocab.VOCAB_TERM_COUNT, 6);
    for (const term of vocab.VOCABULARY_TERMS) {
      assert.equal(
        vocab.vocabularyTermHasRequiredFields(term),
        true,
        `incomplete term: ${term.id}`
      );
      assert.match(term.example, /King/i);
    }
  });

  it("uses IN THIS ESSAY YOU WILL without awkward Later you will / You will pairing", () => {
    assert.equal(vocab.ESSAY_USE_LABEL, "In this essay, you will");
    for (const term of vocab.VOCABULARY_TERMS) {
      const line = vocab.formatEssayUseLine(term);
      assert.equal(line.label, vocab.ESSAY_USE_LABEL);
      assert.doesNotMatch(line.action, /^You will\b/i);
      assert.doesNotMatch(
        `${line.label}: ${line.action}`,
        /Later you will use it to:\s*You will/i
      );
    }
    const moduleOne = fs.readFileSync(
      path.join(__dirname, "../components/ModuleOne.js"),
      "utf8"
    );
    assert.doesNotMatch(moduleOne, /Later you will use it to:/);
    assert.match(moduleOne, /formatEssayUseLine/);
  });

  it("visual models include captions and are not color-only", () => {
    assert.equal(step2.STEP2_LAYOUT_CONTRACT.visualNotColorOnly, true);
    for (const term of vocab.VOCABULARY_TERMS) {
      assert.ok(String(term.visual.caption).length > 20);
    }
    const visualSrc = fs.readFileSync(
      path.join(
        __dirname,
        "../components/module1/ModuleOneVocabularyVisual.jsx"
      ),
      "utf8"
    );
    assert.match(visualSrc, /figcaption/);
    assert.match(visualSrc, /aria-hidden/);
  });

  it("mobile layout contract includes 320 and 390", () => {
    assert.deepEqual(step2.STEP2_LAYOUT_CONTRACT.viewports.slice(0, 2), [
      320, 390,
    ]);
    assert.equal(step2.STEP2_LAYOUT_CONTRACT.noHorizontalOverflow, true);
  });

  it("Back/Next and quiz gating after vocabulary remain unchanged", () => {
    assert.equal(step2.advanceTermIndex(0, "next"), 1);
    assert.equal(step2.advanceTermIndex(1, "back"), 0);
    const mid = step2.getStep2PresentationModel({
      stage: step2.STEP2_STAGES.LEARN,
      termIndex: 2,
    });
    assert.equal(mid.showQuiz, false);
    const last = step2.advanceStep2FromLearn(5);
    assert.equal(last.stage, step2.STEP2_STAGES.QUIZ);
  });

  it("quiz does not appear before the last vocabulary term", () => {
    for (let i = 0; i < 5; i += 1) {
      const model = step2.getStep2PresentationModel({
        stage: step2.STEP2_STAGES.LEARN,
        termIndex: i,
      });
      assert.equal(model.showQuiz, false);
      assert.equal(step2.canFinishVocabulary(i), false);
    }
    assert.equal(step2.canFinishVocabulary(5), true);
  });
});

describe("CP-A instructional presentation: writing path stages vs decisions", () => {
  const pathSrc = fs.readFileSync(
    path.join(__dirname, "../components/module1/ModuleOneWritingPath.jsx"),
    "utf8"
  );
  const welcomeSrc = fs.readFileSync(
    path.join(__dirname, "../lib/module1/assignmentWelcomeHelpers.js"),
    "utf8"
  );
  const promptSrc = fs.readFileSync(
    path.join(__dirname, "../app/modules/1/prompt/page.js"),
    "utf8"
  );
  const moduleOneSrc = fs.readFileSync(
    path.join(__dirname, "../components/ModuleOne.js"),
    "utf8"
  );

  it('student copy says "Six stages. One small decision at a time."', () => {
    assert.match(
      pathSrc,
      /Six stages\. One small decision at a time\. You begin by understanding the assignment—not by writing the whole essay\./
    );
  });

  it('active Module 1 copy does not describe the process as only "six small decisions"', () => {
    for (const [label, src] of [
      ["ModuleOneWritingPath", pathSrc],
      ["assignmentWelcomeHelpers", welcomeSrc],
      ["prompt page", promptSrc],
      ["ModuleOne", moduleOneSrc],
    ]) {
      assert.doesNotMatch(
        src,
        /six small decisions/i,
        `${label} still says "six small decisions"`
      );
    }
  });

  it("path retains six ordered stages", () => {
    const model = welcome.getAssignmentWelcomePresentation({});
    assert.equal(model.processPreview.length, 6);
    assert.match(pathSrc, /<ol[\s\S]*data-testid="welcome-process-preview"/);
    assert.match(pathSrc, /stageCount:\s*6/);
    assert.equal(model.pathCurrentIndex, 0);
    assert.match(model.processPreview[0], /Understand the assignment/i);
    assert.match(model.destinationLabel, /Finished essay/i);
  });

  it("production classes keep a vertical connected path at 320, 390, and 768", () => {
    // Default flex-col; horizontal only activates at lg.
    assert.match(
      pathSrc,
      /className="mt-4 flex flex-col lg:flex-row lg:flex-nowrap"/
    );
    // Vertical connectors remain visible below lg (not sm:hidden).
    assert.match(
      pathSrc,
      /data-path-connector="vertical"[\s\S]*?lg:hidden|lg:hidden[\s\S]*?data-path-connector="vertical"/
    );
    assert.match(
      pathSrc,
      /absolute left-\[17px\] top-9[\s\S]*?w-px bg-border-soft lg:hidden/
    );
    assert.doesNotMatch(pathSrc, /w-px bg-border-soft sm:hidden/);
    assert.match(pathSrc, /viewports:\s*\[320,\s*390,\s*768,\s*1440\]/);
    assert.match(pathSrc, /verticalConnectedBelowLg:\s*true/);
  });

  it("production classes use a horizontal connected path only at lg", () => {
    assert.match(pathSrc, /horizontalConnectedAtLgOnly:\s*true/);
    assert.match(pathSrc, /noWrappedMultiRowPath:\s*true/);
    assert.match(
      pathSrc,
      /hidden h-px w-\[calc\(100%-2\.25rem\)\] bg-border-soft lg:block/
    );
    // Horizontal must not appear from sm (old wrapped layout).
    assert.doesNotMatch(
      pathSrc,
      /h-px w-\[calc\(100%-2\.25rem\)\] bg-border-soft sm:block/
    );
  });

  it("every adjacent stage pair has a connector in the active layout", () => {
    // Five non-terminal stages each render both connector kinds; layout CSS picks one.
    const verticalConnectors = (
      pathSrc.match(/data-path-connector="vertical"/g) || []
    ).length;
    const horizontalConnectors = (
      pathSrc.match(/data-path-connector="horizontal"/g) || []
    ).length;
    // Template renders one of each per non-last stage inside the map — count via !isLast blocks.
    assert.match(pathSrc, /\{!isLast \? \([\s\S]*?data-path-connector="vertical"/);
    assert.match(
      pathSrc,
      /\{!isLast \? \([\s\S]*?data-path-connector="horizontal"/
    );
    assert.equal(verticalConnectors, 1, "vertical testid marker once in template");
    assert.equal(
      horizontalConnectors,
      1,
      "horizontal testid marker once in template"
    );
    // Adjacent coverage: connector markup is gated on !isLast for all six stages → 5 links.
    assert.match(pathSrc, /stageCount:\s*6/);
    assert.ok(
      pathSrc.includes("!isLast") &&
        pathSrc.includes('data-path-connector="vertical"') &&
        pathSrc.includes('data-path-connector="horizontal"')
    );
  });

  it("no obsolete wrapped-row-end or three-column sm/md path remains", () => {
    assert.doesNotMatch(pathSrc, /isWrappedRowEnd/);
    assert.doesNotMatch(pathSrc, /sm:w-1\/3/);
    assert.doesNotMatch(pathSrc, /sm:flex-wrap/);
    assert.doesNotMatch(pathSrc, /sm:flex-row/);
    assert.doesNotMatch(pathSrc, /sm:hidden lg:block/);
    assert.doesNotMatch(pathSrc, /desktopConnectedHorizontalOrWrapped/);
    assert.doesNotMatch(pathSrc, /path-connector-mobile/);
    assert.doesNotMatch(pathSrc, /path-connector-desktop/);
  });

  it("preserves start/destination labels, ordered list, and overflow guard", () => {
    assert.match(pathSrc, /Start here/);
    assert.match(pathSrc, /Essay/);
    assert.match(pathSrc, /Finished essay/);
    assert.match(pathSrc, /overflow-x-hidden/);
    assert.match(pathSrc, /orderedListSemantics:\s*true/);
    assert.match(pathSrc, /<ol[\s\S]*<\/ol>/);
  });

  it("each vocabulary figcaption contains the essential accessible relationship", () => {
    for (const term of vocab.VOCABULARY_TERMS) {
      assert.equal(
        vocab.vocabularyCaptionCommunicatesRelationship(term),
        true,
        `caption relationship missing for ${term.id}: ${term.visual.caption}`
      );
    }
  });

  it("quiz files remain unchanged by this presentation repair", () => {
    const quizHelpers = fs.readFileSync(
      path.join(__dirname, "../lib/module1/quizHelpers.js"),
      "utf8"
    );
    assert.match(quizHelpers, /QUIZ_CONTENT_VERSION/);
    assert.doesNotMatch(quizHelpers, /Six stages\. One small decision/);
    assert.doesNotMatch(quizHelpers, /WRITING_PATH_FOOTER/);
  });
});

describe("CP-A instructional presentation: JSX parses", () => {
  it("changed Module 1 presentation components parse as JSX", () => {
    const parser = require("next/dist/compiled/babel/parser");
    for (const rel of [
      "../components/module1/ModuleOneVocabularyVisual.jsx",
      "../components/module1/ModuleOneWritingPath.jsx",
      "../components/ModuleOne.js",
      "../app/modules/1/prompt/page.js",
    ]) {
      const src = fs.readFileSync(path.join(__dirname, rel), "utf8");
      parser.parse(src, { sourceType: "module", plugins: ["jsx"] });
    }
  });
});
