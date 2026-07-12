const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const welcome = require("../lib/module1/assignmentWelcomeHelpers.js");
const prompt = require("../lib/module1/promptBreakdownHelpers.js");
const restart = require("../lib/module1/restartHelpers.js");
const browser = require("../lib/module1/module1BrowserCache.js");
const quiz = require("../lib/module1/quizHelpers.js");

describe("CP-A assignment welcome stage", () => {
  const emptyAnswers = prompt.hydratePromptAnswers({});

  it("brand-new student sees the welcome stage", () => {
    const decision = welcome.resolveAssignmentWelcomeDisplay({
      welcomeRecord: welcome.hydrateWelcomeRecord(null),
      promptAnswers: emptyAnswers,
    });
    assert.equal(decision.showWelcome, true);
    assert.equal(decision.reason, "brand_new_show_welcome");
  });

  it("welcome completion advances to Prompt Question 1 without changing answers", () => {
    const before = prompt.hydratePromptAnswers({});
    const record = welcome.buildWelcomeCompletionRecord();
    assert.equal(record.completed, true);
    assert.equal(record.version, welcome.ASSIGNMENT_WELCOME_VERSION);

    const applied = welcome.applyWelcomeCompletion({
      answers: before,
      welcomeCompleted: true,
    });
    assert.deepEqual(applied.answers, before);
    assert.equal(applied.answersUnchanged, true);

    const after = welcome.resolveAssignmentWelcomeDisplay({
      welcomeRecord: welcome.hydrateWelcomeRecord(record),
      promptAnswers: applied.answers,
    });
    assert.equal(after.showWelcome, false);
    assert.equal(prompt.getResumeStepIndex(applied.answers), 0);
  });

  it("reload after welcome completion resumes Prompt Question 1", () => {
    const decision = welcome.resolveAssignmentWelcomeDisplay({
      welcomeRecord: welcome.hydrateWelcomeRecord(
        welcome.buildWelcomeCompletionRecord()
      ),
      promptAnswers: emptyAnswers,
    });
    assert.equal(decision.showWelcome, false);
    assert.equal(decision.reason, "welcome_completed_show_question_1");
    assert.equal(prompt.getResumeStepIndex(emptyAnswers), 0);
  });

  it("partial prompt work bypasses welcome even if welcome key is absent", () => {
    const partial = prompt.hydratePromptAnswers({
      task_verb: "Compare and contrast",
    });
    const decision = welcome.resolveAssignmentWelcomeDisplay({
      welcomeRecord: welcome.hydrateWelcomeRecord(null),
      promptAnswers: partial,
    });
    assert.equal(decision.showWelcome, false);
    assert.equal(decision.reason, "partial_prompt_bypasses_welcome");
    assert.equal(prompt.getResumeStepIndex(partial), 1);
  });

  it("completed prompt preserves existing resume behavior", () => {
    const complete = {
      task_verb: "Compare and contrast",
      task_type: "A compare and contrast essay",
      analysis_focus: "How Dr. King uses rhetorical appeals in two texts",
      required_angle: "Specific evidence from both works",
      student_paraphrase:
        "Compare and contrast how King uses rhetorical appeals in the speech and letter.",
    };
    const decision = welcome.resolveAssignmentWelcomeDisplay({
      welcomeRecord: welcome.hydrateWelcomeRecord(null),
      promptAnswers: complete,
      promptComplete: prompt.isPromptBreakdownComplete(complete),
    });
    assert.equal(decision.showWelcome, false);
    assert.equal(decision.reason, "completed_prompt_preserves_resume");
  });

  it("malformed welcome data falls back safely", () => {
    const malformed = welcome.hydrateWelcomeRecord("{not-json");
    assert.equal(malformed.malformed, true);
    assert.equal(malformed.completed, false);

    const noPrompt = welcome.resolveAssignmentWelcomeDisplay({
      welcomeRecord: malformed,
      promptAnswers: emptyAnswers,
    });
    assert.equal(noPrompt.showWelcome, true);

    const withPrompt = welcome.resolveAssignmentWelcomeDisplay({
      welcomeRecord: malformed,
      promptAnswers: prompt.hydratePromptAnswers({
        task_verb: "Compare and contrast",
      }),
    });
    assert.equal(withPrompt.showWelcome, false);
  });

  it("reopening welcome preserves exact active question and answers", () => {
    const answers = prompt.hydratePromptAnswers({
      task_verb: "Compare and contrast",
      task_type: "A compare and contrast essay",
    });
    const activeIndex = 2;
    const presentation = welcome.getAssignmentWelcomePresentation({
      mode: "reference",
      returnStepIndex: activeIndex,
    });
    assert.equal(presentation.mode, "reference");
    assert.equal(presentation.primaryActionLabel, "Return to my question");
    assert.equal(presentation.returnStepIndex, activeIndex);
    assert.equal(answers.task_verb, "Compare and contrast");
    assert.equal(answers.task_type, "A compare and contrast essay");
  });

  it("welcome presentation has one dominant task and no prompt controls", () => {
    const model = welcome.getAssignmentWelcomePresentation({
      mode: "first_visit",
    });
    assert.equal(model.showPromptControls, false);
    assert.equal(model.showFullAssignmentPrompt, false);
    assert.equal(model.showQuiz, false);
    assert.equal(model.showOptionalVideo, false);
    assert.equal(model.showCompletionPercent, false);
    assert.equal(model.processPreview.length, 6);
    assert.equal(model.layout.processPreviewSteps, 6);
    assert.equal(model.layout.oneDominantQuestion, true);
    assert.equal(model.layout.oneSemanticH1, true);
    assert.deepEqual(model.layout.viewports, [320, 390, 768, 1440]);
  });

  it("welcome key matches makeStudentKey(email, [module1, welcome])", () => {
    assert.equal(
      welcome.getModule1WelcomeCacheKey("a@b.com"),
      "wp:a@b.com:module1:welcome"
    );
    assert.equal(
      browser.getModule1WelcomeCacheKey("a@b.com"),
      "wp:a@b.com:module1:welcome"
    );
  });
});

describe("CP-A Module 1 flow cache (welcome + step2)", () => {
  const email = "student@example.com";

  function seedMixedStore() {
    return new Map([
      [
        browser.getModule1WelcomeCacheKey(email),
        JSON.stringify(welcome.buildWelcomeCompletionRecord()),
      ],
      [
        browser.getModule1Step2CacheKey(email),
        JSON.stringify({ stage: "quiz" }),
      ],
      [`wp:${email}:module2:source-cache`, "m2"],
      [`wp:${email}:module4:plan-draft`, "m4"],
      [`wp:${email}:module5:outline-draft`, "m5"],
    ]);
  }

  it("Restart Module 1 clears welcome + Step 2 keys only", () => {
    assert.equal(
      restart.resolveBrowserCacheClearMode(
        restart.RESTART_ACTIONS.RESTART_MODULE_1
      ),
      "module1_flow_only"
    );
    const store = seedMixedStore();
    const result = browser.clearModule1FlowCacheFromStore(store, email);
    assert.ok(result.removedKeys.includes(`wp:${email}:module1:welcome`));
    assert.ok(result.removedKeys.includes(`wp:${email}:module1:step2`));
    assert.equal(store.get(`wp:${email}:module2:source-cache`), "m2");
    assert.equal(store.get(`wp:${email}:module4:plan-draft`), "m4");
    assert.equal(store.get(`wp:${email}:module5:outline-draft`), "m5");
  });

  it("Reset Current Module-on-M1 uses the same scoped flow cleanup", () => {
    assert.equal(
      restart.resolveBrowserCacheClearMode("reset_current_module_m1"),
      "module1_flow_only"
    );
  });

  it("full assignment restart clears all user-scoped keys", () => {
    const store = seedMixedStore();
    const removed = browser.clearAllUserScopedCacheFromStore(store, email);
    assert.ok(removed.includes(`wp:${email}:module1:welcome`));
    assert.ok(removed.includes(`wp:${email}:module1:step2`));
    assert.ok(removed.includes(`wp:${email}:module5:outline-draft`));
    assert.equal(store.size, 0);
  });

  it("jump and ordinary revisit clear nothing", () => {
    assert.equal(
      restart.resolveBrowserCacheClearMode(
        restart.RESTART_ACTIONS.JUMP_TO_MODULE
      ),
      "none"
    );
    assert.equal(
      restart.resolveBrowserCacheClearMode("ordinary_revisit"),
      "none"
    );
  });

  it("quiz completion clears only the Step 2 draft", () => {
    const store = seedMixedStore();
    const result = browser.clearModule1Step2DraftFromStore(store, email);
    assert.equal(result.removed, true);
    assert.equal(store.has(browser.getModule1Step2CacheKey(email)), false);
    assert.equal(store.has(browser.getModule1WelcomeCacheKey(email)), true);
    assert.equal(store.get(`wp:${email}:module2:source-cache`), "m2");
  });

  it("DeveloperTestingPanel uses clearModule1FlowCache for Module 1 restart", () => {
    const panelSrc = fs.readFileSync(
      path.join(__dirname, "../components/dev/DeveloperTestingPanel.jsx"),
      "utf8"
    );
    assert.match(panelSrc, /clearModule1FlowCache/);
    assert.match(panelSrc, /module1_flow_only/);
    const restartFn = panelSrc.slice(
      panelSrc.indexOf("async function restartModule1WithWarning"),
      panelSrc.indexOf("async function restartEntireAssignmentWithWarning")
    );
    assert.equal(restartFn.includes("clearStudentCache"), false);
  });
});

describe("CP-A Module 1 copy: video is optional", () => {
  it("active Module 1 student copy does not require the optional video", () => {
    assert.match(
      welcome.MODULE1_AFTER_PROMPT_COPY.sidebarNext,
      /vocabulary one term at a time/i
    );
    assert.doesNotMatch(
      welcome.MODULE1_AFTER_PROMPT_COPY.sidebarNext,
      /video/i
    );
    assert.doesNotMatch(
      welcome.MODULE1_AFTER_PROMPT_COPY.guideNext,
      /watch a short video/i
    );

    const promptPage = fs.readFileSync(
      path.join(__dirname, "../app/modules/1/prompt/page.js"),
      "utf8"
    );
    assert.doesNotMatch(promptPage, /Next: video and vocabulary quiz/);
    assert.doesNotMatch(promptPage, /watch a short video/);
    assert.doesNotMatch(promptPage, /Continue to the Video and Quiz/);
    assert.match(promptPage, /MODULE1_AFTER_PROMPT_COPY/);
    assert.match(
      welcome.MODULE1_AFTER_PROMPT_COPY.sidebarNext,
      /learn key vocabulary one term at a time/
    );

    // Legacy quiz markers remain only for detection helpers
    assert.ok(quiz.MODULE1_QUIZ_V1_LEGACY_MARKERS.length > 0);
  });
});

describe("CP-A prompt page JSX integrity", () => {
  const promptPagePath = path.join(
    __dirname,
    "../app/modules/1/prompt/page.js"
  );

  function assertPromptPageJsxHealthy(source) {
    const errors = [];
    const parser = require("next/dist/compiled/babel/parser");
    try {
      parser.parse(source, { sourceType: "module", plugins: ["jsx"] });
    } catch (e) {
      errors.push(`babel-parse: ${e.message}`);
    }

    // Detect the exact orphan-tag regression: </p> immediately after
    // the Where-you-are label close, before the Step 1 paragraph.
    if (/Where you are\s*\n\s*<\/p>\s*\n\s*<\/p>/.test(source)) {
      errors.push(
        "orphan </p> after Where you are label (normal or welcome sidebar)"
      );
    }
    if (/<\/p>\s*\n\s*<\/p>/.test(source)) {
      const idx = source.search(/<\/p>\s*\n\s*<\/p>/);
      const line = source.slice(0, idx).split("\n").length;
      errors.push(`consecutive orphan </p> tags near line ${line}`);
    }

    const welcomeFn = source.slice(
      source.indexOf("function AssignmentWelcomeView"),
      source.indexOf("export default function ModuleOnePromptPage")
    );
    const welcomeH1 = (welcomeFn.match(/<h1[\s>]/g) || []).length;
    if (welcomeH1 !== 1) {
      errors.push(`AssignmentWelcomeView expected 1 h1, found ${welcomeH1}`);
    }

    const promptReturn = source.slice(source.indexOf("const mc = PROMPT_MC"));
    const promptH1 = (promptReturn.match(/<h1[\s>]/g) || []).length;
    if (promptH1 !== 1) {
      errors.push(`normal prompt stage expected 1 h1, found ${promptH1}`);
    }

    // Normal prompt sidebar: Where you are → Step 1 (no orphan between)
    const normalSidebar = promptReturn.match(
      /Where you are\s*\n\s*<\/p>\s*\n\s*<p className="text-sm leading-relaxed text-text-primary">\s*\n\s*Step 1 of 2/
    );
    if (!normalSidebar) {
      errors.push(
        "normal prompt sidebar Where-you-are → Step 1 structure missing or broken"
      );
    }

    return errors;
  }

  it("parses with Babel and rejects orphan </p> after Where you are", () => {
    const source = fs.readFileSync(promptPagePath, "utf8");
    const errors = assertPromptPageJsxHealthy(source);
    assert.deepEqual(errors, []);
  });

  it("detects the exact orphan-tag regression when injected", () => {
    const source = fs.readFileSync(promptPagePath, "utf8");
    const broken = source.replace(
      /Where you are\s*\n\s*<\/p>\s*\n\s*<p className="text-sm leading-relaxed text-text-primary">\s*\n\s*Step 1 of 2/,
      `Where you are
              </p>
              </p>
              <p className="text-sm leading-relaxed text-text-primary">
                Step 1 of 2`
    );
    assert.notEqual(broken, source);
    const errors = assertPromptPageJsxHealthy(broken);
    assert.ok(
      errors.some((e) => /orphan/.test(e)),
      `expected orphan detection, got: ${JSON.stringify(errors)}`
    );
  });
});
