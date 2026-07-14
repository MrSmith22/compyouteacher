/**
 * WP-049 — Task-relevant artifact pull-forward (Modules 6–7 first pass).
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  matchParagraphPlan,
  selectTaskRelevantArtifacts,
} from "../lib/module6/taskRelevantArtifacts.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const readSrc = (rel) => readFileSync(join(root, rel), "utf8");

const SYNTHETIC_THESIS = "Synthetic thesis for desk selection only.";
const OTHER_QUOTE = "Quote that belongs only to paragraph one.";
const ACTIVE_QUOTE = "Quote for the active paragraph only.";

function syntheticOutline() {
  return {
    thesis: SYNTHETIC_THESIS,
    body: [
      {
        point: "Paragraph zero point",
        points: ["P0 outline note"],
        evidence: [{ quote: OTHER_QUOTE, observation: "P0 note" }],
        reasoning: "P0 reasoning",
      },
      {
        point: "Paragraph one point",
        bucket: "Credibility",
        points: ["P1 outline note"],
        evidence: [{ quote: ACTIVE_QUOTE, observation: "P1 note" }],
        reasoning: "P1 reasoning",
      },
    ],
    conclusion: {
      summary: "Return to the main claim in fresh words.",
      finalThought: "Leave one earned closing thought.",
    },
  };
}

function syntheticPlans() {
  return [
    {
      claim: "Plan claim 0",
      evidenceSnippets: [{ quote: "Plan quote 0" }],
      reasoning: "Plan reasoning 0",
    },
    {
      claim: "Plan claim 1",
      evidenceSnippets: [{ quote: "Plan quote 1" }],
      reasoning: "Plan reasoning 1",
    },
  ];
}

function allLines(result) {
  return (result.items || []).flatMap((item) => item.lines);
}

describe("WP-049 task-relevant artifact pull-forward (Modules 6–7)", () => {
  it("introduction receives only introduction-relevant context", () => {
    const outline = syntheticOutline();
    const result = selectTaskRelevantArtifacts({
      stepType: "intro",
      thesis: outline.thesis,
      outline,
      paragraphPlans: syntheticPlans(),
      assignmentQuestion: "Synthetic assignment question?",
    });
    const kinds = result.items.map((item) => item.kind);
    assert.deepEqual(kinds, ["thesis", "assignment"]);
    assert.equal(allLines(result).includes(ACTIVE_QUOTE), false);
    assert.equal(allLines(result).includes(OTHER_QUOTE), false);
    assert.equal(allLines(result).includes("P1 reasoning"), false);
  });

  it("body step receives thesis and only matching paragraph plan/evidence/reasoning", () => {
    const outline = syntheticOutline();
    const result = selectTaskRelevantArtifacts({
      stepType: "body",
      bodyIndex: 1,
      thesis: outline.thesis,
      outline,
      paragraphPlans: syntheticPlans(),
    });
    const kinds = result.items.map((item) => item.kind);
    assert.ok(kinds.includes("thesis"));
    assert.ok(kinds.includes("claim"));
    assert.ok(kinds.includes("evidence"));
    assert.ok(kinds.includes("reasoning"));
    const lines = allLines(result);
    assert.ok(lines.some((line) => line.includes(ACTIVE_QUOTE)));
    assert.ok(lines.includes("P1 reasoning"));
    assert.ok(lines.includes("Paragraph one point"));
    assert.equal(lines.some((line) => line.includes(OTHER_QUOTE)), false);
    assert.equal(lines.includes("P0 reasoning"), false);
    assert.equal(lines.includes("Plan quote 0"), false);
  });

  it("evidence from another paragraph is never surfaced", () => {
    const outline = syntheticOutline();
    const atZero = selectTaskRelevantArtifacts({
      stepType: "body",
      bodyIndex: 0,
      thesis: outline.thesis,
      outline,
      paragraphPlans: syntheticPlans(),
    });
    const atOne = selectTaskRelevantArtifacts({
      stepType: "body",
      bodyIndex: 1,
      thesis: outline.thesis,
      outline,
      paragraphPlans: syntheticPlans(),
    });
    assert.equal(allLines(atZero).some((line) => line.includes(ACTIVE_QUOTE)), false);
    assert.equal(allLines(atOne).some((line) => line.includes(OTHER_QUOTE)), false);
  });

  it("conclusion receives thesis plus conclusion notes", () => {
    const outline = syntheticOutline();
    const result = selectTaskRelevantArtifacts({
      stepType: "conclusion",
      thesis: outline.thesis,
      outline,
      paragraphPlans: syntheticPlans(),
    });
    const kinds = result.items.map((item) => item.kind);
    assert.deepEqual(kinds, ["thesis", "conclusion"]);
    const lines = allLines(result);
    assert.ok(lines.includes("Return to the main claim in fresh words."));
    assert.ok(lines.includes("Leave one earned closing thought."));
    assert.equal(lines.some((line) => line.includes(ACTIVE_QUOTE)), false);
  });

  it("review and read-aloud states do not receive an unnecessary artifact wall", () => {
    const outline = syntheticOutline();
    const review = selectTaskRelevantArtifacts({
      stepType: "review",
      thesis: outline.thesis,
      outline,
      paragraphPlans: syntheticPlans(),
    });
    assert.deepEqual(
      review.items.map((item) => item.kind),
      ["thesis"]
    );
    assert.equal(review.items.length, 1);

    const readAloud = selectTaskRelevantArtifacts({
      stepType: "read-aloud",
      thesis: outline.thesis,
      outline,
      paragraphPlans: syntheticPlans(),
    });
    assert.equal(readAloud.items.length, 0);

    const finalReview = selectTaskRelevantArtifacts({
      stepType: "final-review",
      thesis: outline.thesis,
      outline,
    });
    assert.deepEqual(
      finalReview.items.map((item) => item.kind),
      ["thesis"]
    );
  });

  it("missing artifacts are omitted safely", () => {
    const result = selectTaskRelevantArtifacts({
      stepType: "body",
      bodyIndex: 0,
      thesis: "",
      outline: { body: [{}] },
      paragraphPlans: [],
    });
    assert.equal(result.items.length, 0);

    const intro = selectTaskRelevantArtifacts({
      stepType: "intro",
      thesis: "",
      assignmentQuestion: "",
    });
    assert.equal(intro.items.length, 0);
  });

  it("does not mutate source objects", () => {
    const outline = syntheticOutline();
    const plans = syntheticPlans();
    const outlineJson = JSON.stringify(outline);
    const plansJson = JSON.stringify(plans);
    selectTaskRelevantArtifacts({
      stepType: "body",
      bodyIndex: 1,
      thesis: outline.thesis,
      outline,
      paragraphPlans: plans,
    });
    assert.equal(JSON.stringify(outline), outlineJson);
    assert.equal(JSON.stringify(plans), plansJson);
  });

  it("matches paragraph plans by explicit index when present without inventing links", () => {
    const plans = [
      { claim: "Wrong ordinal", sourceParagraphIndex: 9, evidenceSnippets: [] },
      { claim: "Linked to body 0", sourceParagraphIndex: 0, evidenceSnippets: [] },
    ];
    assert.equal(matchParagraphPlan(plans, 0)?.claim, "Linked to body 0");
    assert.equal(matchParagraphPlan(plans, 1), null);
  });

  it("pull-forward block appears before Module 6 drafting and Module 7 revision textareas", () => {
    const m6 = readSrc("components/ModuleSix.js");
    const m7 = readSrc("components/ModuleSeven.js");
    assert.ok(m6.includes("TaskRelevantArtifacts"));
    assert.ok(m7.includes("TaskRelevantArtifacts"));
    assert.ok(m6.includes("selectTaskRelevantArtifacts"));
    assert.ok(m7.includes("selectTaskRelevantArtifacts"));

    const m6Desk = m6.indexOf("<TaskRelevantArtifacts");
    const m6Textarea = m6.indexOf("<textarea");
    assert.ok(m6Desk >= 0 && m6Textarea > m6Desk);

    const m7Desk = m7.indexOf("<TaskRelevantArtifacts");
    const m7Textarea = m7.indexOf("<textarea");
    assert.ok(m7Desk >= 0 && m7Textarea > m7Desk);

    assert.ok(readSrc("components/shared/TaskRelevantArtifacts.jsx").includes(
      'data-testid="task-relevant-artifacts"'
    ));
  });

  it("full shelves are collapsed by default but remain accessible", () => {
    const m6Shelf = readSrc("components/module6/ModuleSixReferenceShelf.jsx");
    const m7Shelf = readSrc("components/module7/ModuleSevenReferenceShelf.jsx");
    assert.ok(m6Shelf.includes('data-testid="module6-more-saved-work"'));
    assert.ok(m7Shelf.includes('data-testid="module7-more-saved-work"'));
    assert.ok(m6Shelf.includes("More saved work"));
    assert.ok(m7Shelf.includes("More saved work"));
    assert.equal(/data-testid="module6-more-saved-work"[^>]*\sopen=/.test(m6Shelf), false);
    assert.equal(/data-testid="module7-more-saved-work"[^>]*\sopen=/.test(m7Shelf), false);
    assert.ok(m6Shelf.includes("<summary"));
    assert.ok(m7Shelf.includes("<summary"));
    assert.ok(m6Shelf.includes("Your thesis (already written)"));
    assert.ok(m7Shelf.includes("Draft map"));
  });

  it("WP-048 screen-contract cues remain visible", () => {
    const frame = readSrc("components/module6/ModuleSixStepFrame.jsx");
    const m6 = readSrc("components/ModuleSix.js");
    const m7 = readSrc("components/ModuleSeven.js");
    assert.ok(frame.includes('data-testid="screen-contract-task"'));
    assert.ok(frame.includes("ScreenContractCues"));
    assert.ok(m6.includes("ModuleSixStepFrame"));
    assert.ok(m7.includes("ModuleSixStepFrame"));
    assert.ok(m6.includes("jobRightNow={presentation.jobRightNow}"));
  });

  it("preserves Module 6 autosave/readiness/finalization and Module 7 revision/read-aloud/finalization gates", () => {
    const m6 = readSrc("components/ModuleSix.js");
    const m7 = readSrc("components/ModuleSeven.js");
    assert.ok(m6.includes("atomicWriteModule6Draft") || m6.includes("finalize"));
    assert.ok(m6.includes("evaluateSectionReadiness") || m6.includes("sectionGate"));
    assert.ok(m7.includes("evaluateReadAloudAdvanceGate"));
    assert.ok(m7.includes("locked") || m7.includes("finalize"));
    assert.ok(m7.includes("MODULE7_STEP_TYPES") || m7.includes("read-aloud"));
  });
});
