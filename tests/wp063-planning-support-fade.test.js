/**
 * WP-063 — Planning supports fade from outline → drafting → revision.
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  WP063_FADE_MATRIX,
  WP063_FADE_MODULES,
  WP063_REPRESENTATION,
  assembledProseExcludesPlanningMetadata,
  getWp063ModulesCovered,
  getWp063NonCompliantRows,
  getWp063WritingSurfaces,
  planningLabelsForbiddenOnWritingSurface,
  wp063HostileOutlineFixture,
} from "../lib/ui/planningSupportFadeContract.js";
import {
  SECTION_TYPES,
  buildDraftSectionSteps,
  getModule6StepPresentation,
  getWritingSectionLabel,
} from "../components/module6/module6StepPresentation.js";
import {
  MODULE7_STEP_TYPES,
  getModule7StepPresentation,
} from "../components/module7/module7StepPresentation.js";
import {
  alignSectionsToOutline,
  getEssayProseBlocks,
  joinSections,
  splitDraftIntoSections,
} from "../components/module7/module7DraftSections.js";
import { deriveModule6FullText } from "../lib/module6/draftPersistenceHelpers.js";
import { selectTaskRelevantArtifacts } from "../lib/module6/taskRelevantArtifacts.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const readSrc = (rel) => readFileSync(join(root, rel), "utf8");

const HOSTILE = wp063HostileOutlineFixture();
const HOSTILE_LABELS = [
  "II. PLANNING LABEL",
  "III. Another outline heading",
  "analyze_speech",
  "analyze_letter",
];

describe("WP-063 planning-support fade (Modules 5–7)", () => {
  it("1. fade schedule explicitly covers Modules 5, 6, and 7", () => {
    assert.deepEqual(WP063_FADE_MODULES, [5, 6, 7]);
    assert.deepEqual(getWp063ModulesCovered().filter((m) => m <= 7), [5, 6, 7]);
    assert.equal(getWp063NonCompliantRows().length, 0);
    for (const row of WP063_FADE_MATRIX) {
      assert.ok(row.id);
      assert.ok(Object.values(WP063_REPRESENTATION).includes(row.representation));
      assert.equal(typeof row.planningLabelsAllowed, "boolean");
      assert.equal(typeof row.studentProseShown, "boolean");
      assert.ok(String(row.textSource || "").trim());
      assert.equal(row.compliant, true);
    }
  });

  it("2. Module 5 retains planning representation", () => {
    const m5 = WP063_FADE_MATRIX.filter((r) => r.module === 5);
    assert.ok(m5.length >= 2);
    for (const row of m5) {
      assert.equal(row.representation, WP063_REPRESENTATION.PLANNING);
      assert.equal(row.planningLabelsAllowed, true);
    }
    const five = readSrc("components/ModuleFive.js");
    assert.match(five, /Paragraph plan/i);
    assert.match(five, /paragraph plans/i);
  });

  it("3. Module 6 active writing labels use getWritingSectionLabel only", () => {
    const steps = buildDraftSectionSteps(HOSTILE);
    const body = steps.find((s) => s.type === SECTION_TYPES.BODY);
    assert.equal(getWritingSectionLabel(body), "Body Paragraph 1");
    assert.doesNotMatch(getWritingSectionLabel(body), /II\.|PLANNING|Roman/i);
    assert.equal(body.title, "II. PLANNING LABEL"); // mapping meta retained
    assert.equal(typeof body.roman, "number");

    const presentation = getModule6StepPresentation(body, HOSTILE);
    assert.equal(presentation.workingSetLabel, "Body Paragraph 1");
    assert.doesNotMatch(presentation.workingSetLabel, /II\.|PLANNING LABEL/);

    const six = readSrc("components/ModuleSix.js");
    assert.match(six, /getWritingSectionLabel/);
    assert.doesNotMatch(
      six.slice(six.indexOf("module6-review-section-list"), six.indexOf("module6-review-section-list") + 800),
      /step\.job/
    );
  });

  it("4. Module 6 full_text is derived only from ordered section prose", () => {
    const sections = [
      "Intro with I. in the first sentence.",
      "Body mentions Introduction as a topic.",
      "More body.",
      "Conclusion.",
    ];
    const full = deriveModule6FullText(sections);
    assert.equal(full, sections.join("\n\n"));
    assert.equal(
      assembledProseExcludesPlanningMetadata(full, HOSTILE_LABELS),
      true
    );
  });

  it("5. Module 6 whole-draft review does not wrap prose in outline headings", () => {
    const reviewRow = WP063_FADE_MATRIX.find((r) => r.id === "m6-whole-draft-review");
    assert.equal(reviewRow.planningLabelsAllowed, false);
    const six = readSrc("components/ModuleSix.js");
    const reviewChunk = six.slice(
      six.indexOf("module6-review-section-list"),
      six.indexOf("Total words")
    );
    assert.match(reviewChunk, /getWritingSectionLabel\(step\)/);
    assert.doesNotMatch(reviewChunk, /step\.job/);
    assert.doesNotMatch(reviewChunk, /romanNumeral|step\.title|step\.roman/);
  });

  it("6. Module 7 Read Aloud uses EssayProseView / getEssayProseBlocks", () => {
    const seven = readSrc("components/ModuleSeven.js");
    assert.match(seven, /EssayProseView/);
    assert.match(seven, /read-aloud|READ_ALOUD|isReadAloudStep/);
    const view = readSrc("components/module7/EssayProseView.jsx");
    assert.match(view, /getEssayProseBlocks/);
    const read = getModule7StepPresentation(
      { type: MODULE7_STEP_TYPES.READ_ALOUD },
      HOSTILE
    );
    assert.match(read.workingSetLabel, /current essay/i);
  });

  it("7. Module 7 section revision uses writing labels", () => {
    const step = {
      type: SECTION_TYPES.BODY,
      bodyIndex: 0,
      draftIndex: 1,
    };
    assert.equal(getWritingSectionLabel(step), "Body Paragraph 1");
    const body = getModule7StepPresentation(step, HOSTILE);
    assert.equal(body.workingSetLabel, "Body Paragraph 1");
    assert.doesNotMatch(body.workingSetLabel, /II\.|PLANNING LABEL/);
    assert.match(body.nextStepText, /Body Paragraph 2|conclusion/i);
    assert.doesNotMatch(body.nextStepText, /II\.|PLANNING LABEL/);

    const intro = getModule7StepPresentation({ type: SECTION_TYPES.INTRO }, HOSTILE);
    assert.equal(intro.workingSetLabel, "Introduction");
    assert.match(intro.nextStepText, /Body Paragraph 1/);

    const seven = readSrc("components/ModuleSeven.js");
    assert.match(seven, /getWritingSectionLabel/);
  });

  it("8. Module 7 final review renders prose-only blocks", () => {
    const steps = buildDraftSectionSteps(HOSTILE);
    const sections = [
      "Intro prose.",
      "Body one prose.",
      "Body two prose.",
      "Conclusion prose.",
    ];
    const blocks = getEssayProseBlocks(steps, sections);
    assert.equal(blocks.length, 4);
    for (const block of blocks) {
      assert.equal(
        assembledProseExcludesPlanningMetadata(block.text, HOSTILE_LABELS),
        true
      );
      assert.equal("title" in block, false);
      assert.equal("roman" in block, false);
    }
    const final = getModule7StepPresentation(
      { type: MODULE7_STEP_TYPES.FINAL_REVIEW },
      HOSTILE
    );
    assert.match(final.workingSetLabel, /review/i);
    const seven = readSrc("components/ModuleSeven.js");
    assert.match(seven, /isFinalReviewStep[\s\S]{0,1200}EssayProseView/);
  });

  it("9. Module 7 persistence joins section prose without planning metadata", () => {
    const sections = ["A", "B", "C", "D"];
    const joined = joinSections(sections);
    assert.equal(joined, "A\n\nB\n\nC\n\nD");
    assert.equal(
      assembledProseExcludesPlanningMetadata(joined, HOSTILE_LABELS),
      true
    );
    const seven = readSrc("components/ModuleSeven.js");
    assert.match(seven, /joinSections\(sections\)/);
  });

  it("10. Module 8 finished-essay preview remains prose-only", () => {
    const eight = readSrc("components/ModuleEight.js");
    assert.match(eight, /EssayProseView/);
    const row = WP063_FADE_MATRIX.find((r) => r.id === "m8-finished-essay");
    assert.equal(row.planningLabelsAllowed, false);
    assert.equal(row.compliant, true);
  });

  it("11. Planning labels remain available in Module 5 and reference/shelf contexts", () => {
    const refSurfaces = WP063_FADE_MATRIX.filter(
      (r) =>
        r.representation === WP063_REPRESENTATION.REFERENCE_SUPPORT ||
        r.representation === WP063_REPRESENTATION.PLANNING
    );
    assert.ok(refSurfaces.some((r) => r.planningLabelsAllowed));
    assert.ok(existsSync(join(root, "components/module6/ModuleSixReferenceShelf.jsx")));
    const shelf = readSrc("components/module6/ModuleSixReferenceShelf.jsx");
    assert.match(shelf, /romanNumeral|roman/i);
  });

  it("12. Task-relevant evidence and reasoning support are not removed", () => {
    const desk = selectTaskRelevantArtifacts({
      stepType: SECTION_TYPES.BODY,
      bodyIndex: 0,
      thesis: "Thesis claim about rhetoric.",
      outline: HOSTILE,
      paragraphPlans: [
        {
          paragraphIndex: 0,
          claim: "Claim one",
          evidence: [{ quote: "Evidence quote", source: "speech" }],
          reasoning: "Reasoning bridge.",
        },
      ],
      assignmentQuestion: "How does King persuade?",
    });
    assert.ok(Array.isArray(desk.items));
    const kinds = desk.items.map((item) => item.kind).join(",");
    assert.match(kinds, /thesis/);
    assert.match(kinds, /claim|evidence|reasoning|point/i);
  });

  it("13. Internal mapping metadata remains available without entering prose", () => {
    const steps = buildDraftSectionSteps(HOSTILE);
    const body = steps[1];
    assert.equal(body.title, "II. PLANNING LABEL");
    assert.equal(typeof body.roman, "number");
    assert.ok(body.job === "analyze_speech" || body.job == null || typeof body.job === "string");
    const sections = ["Intro", "Body", "Body2", "End"];
    const full = deriveModule6FullText(sections);
    const blocks = getEssayProseBlocks(steps, sections);
    const assembled = [full, ...blocks.map((b) => b.text)].join("\n");
    assert.equal(
      assembledProseExcludesPlanningMetadata(assembled, [
        "II. PLANNING LABEL",
        "III. Another outline heading",
      ]),
      true
    );
  });

  it("14. Hostile outline titles do not enter assembled prose", () => {
    const steps = buildDraftSectionSteps(HOSTILE);
    const sections = [
      "Student intro.",
      "Student body one.",
      "Student body two.",
      "Student conclusion.",
    ];
    const full6 = deriveModule6FullText(sections);
    const full7 = joinSections(sections);
    const blocks = getEssayProseBlocks(steps, sections);
    for (const text of [full6, full7, ...blocks.map((b) => b.text)]) {
      assert.equal(
        assembledProseExcludesPlanningMetadata(text, HOSTILE_LABELS),
        true,
        text
      );
    }
    assert.equal(getWritingSectionLabel(steps[1]), "Body Paragraph 1");
    assert.equal(
      getModule6StepPresentation(steps[1], HOSTILE).workingSetLabel,
      "Body Paragraph 1"
    );
    assert.equal(
      getModule7StepPresentation(steps[1], HOSTILE).workingSetLabel,
      "Body Paragraph 1"
    );
  });

  it("15. Student-authored label-like phrases are preserved exactly (no sanitization)", () => {
    const student = [
      "I. never meant a Roman numeral here.",
      "Introduction is a word I chose on purpose.",
      "II. PLANNING LABEL appears because the student typed it.",
      "Conclusion follows naturally.",
    ];
    assert.equal(deriveModule6FullText(student), student.join("\n\n"));
    assert.equal(joinSections(student), student.join("\n\n"));
    const steps = buildDraftSectionSteps(HOSTILE);
    const blocks = getEssayProseBlocks(steps, student);
    assert.equal(blocks[2].text, student[2]);
    // Guarding against destructive strip regexes in assembly helpers.
    const helpers = [
      readSrc("lib/module6/draftPersistenceHelpers.js"),
      readSrc("components/module7/module7DraftSections.js"),
      readSrc("components/module7/EssayProseView.jsx"),
    ].join("\n");
    assert.doesNotMatch(helpers, /replace\(.*(Roman|outline heading|PLANNING)/i);
  });

  it("16. Empty/missing sections remain aligned correctly", () => {
    const count = 4;
    const aligned = alignSectionsToOutline(["Only intro"], count);
    assert.equal(aligned.length, 4);
    assert.equal(aligned[0], "Only intro");
    assert.equal(aligned[1], "");
    const split = splitDraftIntoSections("A\n\nB", count);
    assert.equal(split.length, 4);
    const blocks = getEssayProseBlocks(buildDraftSectionSteps(HOSTILE), [
      "Intro only",
      "",
      "",
      "",
    ]);
    assert.equal(blocks.length, 1);
    assert.equal(blocks[0].text, "Intro only");
  });

  it("17. Writing surfaces forbid planning labels; prior WP wiring intact", () => {
    for (const row of getWp063WritingSurfaces()) {
      assert.equal(planningLabelsForbiddenOnWritingSurface(row), true, row.id);
    }
    assert.ok(existsSync(join(root, "tests/wp049-task-relevant-artifact-pull-forward.test.js")));
    assert.ok(existsSync(join(root, "tests/wp057-never-start-from-scratch.test.js")));
    assert.ok(existsSync(join(root, "tests/wp059-working-notebook-sidebar.test.js")));
    assert.match(readSrc("components/ModuleSix.js"), /selectTaskRelevantArtifacts/);
    assert.match(readSrc("components/ModuleSeven.js"), /selectTaskRelevantArtifacts/);
    assert.match(readSrc("components/module6/module6StepPresentation.js"), /getWritingSectionLabel/);
  });

  it("18. No Module 3 product files are in the WP-063 ownership set", () => {
    const contract = readSrc("lib/ui/planningSupportFadeContract.js");
    assert.doesNotMatch(contract, /ModuleThree|module3\//);
    assert.ok(existsSync(join(root, "lib/ui/planningSupportFadeContract.js")));
    assert.ok(existsSync(join(root, "tests/wp063-planning-support-fade.test.js")));
  });
});
