/**
 * WP-059 — Working notebook sidebar (Modules 6–7 pilot).
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { selectTaskRelevantArtifacts } from "../lib/module6/taskRelevantArtifacts.js";
import {
  WP059_SIDEBAR_SURFACE_AUDIT,
  buildWorkingNotebookCurrentPage,
  notebookIndexExposesStudentLines,
} from "../lib/ui/workingNotebook.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const readSrc = (rel) => readFileSync(join(root, rel), "utf8");

const outline = {
  body: [
    {
      point: "Point A",
      points: ["Outline A1"],
      evidence: [{ quote: "Quote A", observation: "Why A" }],
      reasoning: "Reasoning A",
    },
    {
      point: "Point B",
      points: ["Outline B1"],
      evidence: [{ quote: "Quote B", observation: "Why B" }],
      reasoning: "Reasoning B",
    },
  ],
  conclusion: { summary: "Restate thesis", finalThought: "Call to action" },
};

const thesis = "Thesis about King and justice.";
const assignmentQuestion = "How does King persuade different audiences?";

describe("WP-059 working-notebook model", () => {
  it("1–2. model exists and derives labels from selectTaskRelevantArtifacts", () => {
    assert.ok(WP059_SIDEBAR_SURFACE_AUDIT.length >= 6);
    const introItems = selectTaskRelevantArtifacts({
      stepType: "intro",
      thesis,
      assignmentQuestion,
    }).items;
    const page = buildWorkingNotebookCurrentPage({
      module: 6,
      stepType: "intro",
      sectionLabel: "Introduction",
      items: introItems,
    });
    assert.deepEqual(
      page.currentArtifactLabels,
      introItems.map((i) => i.label)
    );
    assert.deepEqual(
      page.currentArtifactKinds,
      introItems.map((i) => i.kind)
    );
    assert.equal(notebookIndexExposesStudentLines(page, introItems), false);
  });

  it("3. Module 6 Introduction notebook identifies thesis destination and question", () => {
    const items = selectTaskRelevantArtifacts({
      stepType: "intro",
      thesis,
      assignmentQuestion,
    }).items;
    const page = buildWorkingNotebookCurrentPage({
      module: 6,
      stepType: "intro",
      sectionLabel: "Introduction",
      items,
    });
    assert.equal(page.currentPageLabel, "Introduction");
    assert.ok(page.currentArtifactLabels.includes("Where you’re leading your reader"));
    assert.ok(page.currentArtifactLabels.includes("Assignment question"));
    assert.match(page.locationHint, /desk beside the writing box/i);
  });

  it("4–5. Module 6 Body N only that paragraph’s claim/points/evidence/reasoning", () => {
    const body0 = selectTaskRelevantArtifacts({
      stepType: "body",
      bodyIndex: 0,
      thesis,
      outline,
    }).items;
    const page0 = buildWorkingNotebookCurrentPage({
      module: 6,
      stepType: "body",
      sectionLabel: "Body Paragraph 1",
      items: body0,
    });
    assert.equal(page0.currentPageLabel, "Body Paragraph 1");
    assert.ok(page0.currentArtifactLabels.includes("This paragraph’s point"));
    assert.ok(page0.currentArtifactLabels.includes("Outline points for this paragraph"));
    assert.ok(page0.currentArtifactLabels.includes("Evidence for this paragraph"));
    assert.ok(page0.currentArtifactLabels.includes("Your reasoning notes"));

    const joined = body0.map((i) => i.lines.join(" ")).join(" ");
    assert.match(joined, /Point A|Quote A|Reasoning A/);
    assert.doesNotMatch(joined, /Point B|Quote B|Reasoning B/);

    const body1 = selectTaskRelevantArtifacts({
      stepType: "body",
      bodyIndex: 1,
      thesis,
      outline,
    }).items;
    const joined1 = body1.map((i) => i.lines.join(" ")).join(" ");
    assert.match(joined1, /Point B/);
    assert.doesNotMatch(joined1, /Quote A/);
  });

  it("6–7. Conclusion and Review notebook pages", () => {
    const conclusionItems = selectTaskRelevantArtifacts({
      stepType: "conclusion",
      thesis,
      outline,
    }).items;
    const conclusionPage = buildWorkingNotebookCurrentPage({
      module: 6,
      stepType: "conclusion",
      sectionLabel: "Conclusion",
      items: conclusionItems,
    });
    assert.ok(conclusionPage.currentArtifactLabels.includes("Your thesis"));
    assert.ok(conclusionPage.currentArtifactLabels.includes("Conclusion plan"));

    const reviewItems = selectTaskRelevantArtifacts({
      stepType: "review",
      thesis,
    }).items;
    const reviewPage = buildWorkingNotebookCurrentPage({
      module: 6,
      stepType: "review",
      sectionLabel: "Whole-draft review",
      items: reviewItems,
    });
    assert.equal(reviewPage.currentPageLabel, "Whole-draft review");
    assert.ok(reviewPage.currentArtifactLabels.includes("Your thesis"));
    assert.match(reviewPage.locationHint, /full draft is open in the review work area/i);
  });

  it("8–10. Module 7 read-aloud, section revision, final review", () => {
    const readItems = selectTaskRelevantArtifacts({ stepType: "read-aloud" }).items;
    assert.equal(readItems.length, 0);
    const readPage = buildWorkingNotebookCurrentPage({
      module: 7,
      stepType: "read-aloud",
      sectionLabel: "Full draft · read aloud",
      items: readItems,
    });
    assert.match(readPage.currentPageLabel, /Full draft · read aloud/);
    assert.match(readPage.locationHint, /full Module 6 draft is open/i);
    assert.match(readPage.emptyStateMessage, /Listen for one place to strengthen/i);
    assert.equal(readPage.showArtifactLabels, false);

    const sectionItems = selectTaskRelevantArtifacts({
      stepType: "body",
      bodyIndex: 0,
      thesis,
      outline,
    }).items;
    const sectionPage = buildWorkingNotebookCurrentPage({
      module: 7,
      stepType: "body",
      sectionLabel: "Body Paragraph 1 · revising now",
      items: sectionItems,
    });
    assert.match(sectionPage.currentPageLabel, /Body Paragraph 1 · revising now/);
    assert.ok(sectionPage.currentArtifactKinds.includes("claim"));
    assert.ok(sectionPage.currentArtifactKinds.includes("evidence"));

    const finalItems = selectTaskRelevantArtifacts({
      stepType: "final-review",
      thesis,
    }).items;
    const finalPage = buildWorkingNotebookCurrentPage({
      module: 7,
      stepType: "final-review",
      sectionLabel: "Full essay review",
      items: finalItems,
    });
    assert.ok(finalPage.currentArtifactLabels.includes("Your thesis"));
    assert.match(finalPage.locationHint, /full revised essay is open/i);
  });

  it("11–13. step changes update labels; desk and sidebar share items; no line duplication", () => {
    const intro = selectTaskRelevantArtifacts({
      stepType: "intro",
      thesis,
      assignmentQuestion,
    }).items;
    const body = selectTaskRelevantArtifacts({
      stepType: "body",
      bodyIndex: 0,
      thesis,
      outline,
    }).items;
    const introPage = buildWorkingNotebookCurrentPage({
      module: 6,
      stepType: "intro",
      sectionLabel: "Introduction",
      items: intro,
    });
    const bodyPage = buildWorkingNotebookCurrentPage({
      module: 6,
      stepType: "body",
      sectionLabel: "Body Paragraph 1",
      items: body,
    });
    assert.notDeepEqual(
      introPage.currentArtifactLabels,
      bodyPage.currentArtifactLabels
    );
    assert.deepEqual(
      bodyPage.currentArtifactLabels,
      body.map((i) => i.label)
    );
    assert.equal(notebookIndexExposesStudentLines(bodyPage, body), false);
  });

  it("18. missing artifact data produces contextual copy", () => {
    const page = buildWorkingNotebookCurrentPage({
      module: 6,
      stepType: "intro",
      sectionLabel: "Introduction",
      items: [],
    });
    assert.match(page.emptyStateMessage, /thesis will appear here/i);
    const body = buildWorkingNotebookCurrentPage({
      module: 6,
      stepType: "body",
      sectionLabel: "Body Paragraph 1",
      items: [],
    });
    assert.match(body.emptyStateMessage, /No saved evidence is linked/i);
  });
});

describe("WP-059 shelf integration and archive", () => {
  it("14–17, 19–20. current page outside closed archives; landmark; focus targets", () => {
    const m6Shelf = readSrc("components/module6/ModuleSixReferenceShelf.jsx");
    const m7Shelf = readSrc("components/module7/ModuleSevenReferenceShelf.jsx");

    for (const src of [m6Shelf, m7Shelf]) {
      assert.match(src, /WorkingNotebookCurrentPage/);
      assert.match(src, /buildWorkingNotebookCurrentPage/);
      assert.match(src, /deskItems/);
      assert.match(src, /aria-label="Working notebook"/);
      assert.match(src, /data-testid="working-notebook"/);
      assert.match(src, /min-h-\[44px\]/);
      assert.match(src, /focus-visible:ring-2/);
    }

    const m6Current = m6Shelf.indexOf("<WorkingNotebookCurrentPage");
    const m6Archive = m6Shelf.indexOf('data-testid="module6-more-saved-work"');
    assert.ok(m6Current > 0 && m6Archive > m6Current);

    const m7Current = m7Shelf.indexOf("<WorkingNotebookCurrentPage");
    const m7Archive = m7Shelf.indexOf('data-testid="module7-more-saved-work"');
    assert.ok(m7Current > 0 && m7Archive > m7Current);

    assert.equal(
      /data-testid="module6-more-saved-work"[^>]*\sopen=/.test(m6Shelf),
      false
    );
    assert.equal(
      /data-testid="module7-more-saved-work"[^>]*\sopen=/.test(m7Shelf),
      false
    );

    // Full archive sections remain inside details
    const m6ArchiveBlock = m6Shelf.slice(m6Archive);
    assert.match(m6ArchiveBlock, /Your thesis/);
    assert.match(m6ArchiveBlock, /Outline/);
    assert.match(m6ArchiveBlock, /Paragraph plans|Evidence|Proof plan/);

    // Opening archive does not invoke save/progress handlers
    assert.doesNotMatch(m6Shelf, /onToggle|onClick=\{.*persist|goNext|upsert/);
    assert.doesNotMatch(m7Shelf, /onToggle|onClick=\{.*persist|goNext|upsert/);
  });

  it("12+shared wiring: Modules 6–7 pass selectTaskRelevantArtifacts items into shelf", () => {
    const m6 = readSrc("components/ModuleSix.js");
    const m7 = readSrc("components/ModuleSeven.js");
    // Vertical-slice steps may empty the shelf desk while moves own the desk (WP-081+);
    // non-slice steps still pass deskArtifacts.items through.
    assert.match(m6, /deskItems=\{/);
    assert.match(m6, /deskArtifacts\.items/);
    assert.match(m7, /deskItems=\{/);
    assert.match(m7, /deskArtifacts\.items/);
    assert.match(m6, /Notebook page open on your desk/);
    assert.match(m7, /Notebook page open on your desk/);
    assert.match(m6, /selectTaskRelevantArtifacts/);
    assert.match(m7, /selectTaskRelevantArtifacts/);
  });

  it("21–22. WP-049 selector unchanged; More saved work still default-closed", () => {
    const selector = readSrc("lib/module6/taskRelevantArtifacts.js");
    assert.match(selector, /matchParagraphPlan/);
    assert.match(selector, /case "read-aloud"/);
    assert.match(selector, /WP-049/);
    const cue = readSrc("components/shared/WorkingNotebookCurrentPage.jsx");
    assert.doesNotMatch(cue, /<details/);
    assert.match(cue, /data-testid="working-notebook-current-page"/);
  });

  it("24. no Module 3 file in WP-059 implementation", () => {
    const paths = [
      "lib/ui/workingNotebook.js",
      "components/shared/WorkingNotebookCurrentPage.jsx",
      "components/module6/ModuleSixReferenceShelf.jsx",
      "components/module7/ModuleSevenReferenceShelf.jsx",
      "components/ModuleSix.js",
      "components/ModuleSeven.js",
      "tests/wp059-working-notebook-sidebar.test.js",
    ];
    for (const p of paths) {
      assert.doesNotMatch(p, /module3\/|ModuleThree/);
    }
  });
});
