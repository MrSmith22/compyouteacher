/**
 * WP-041 — Module 9 “do not rewrite” coaching before formatting actions.
 * Evidence: existing Step 2 copy; no duplicate instructional prose.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  MODULE9_APA_ENTRY,
  MODULE9_APA_CONCEPTS,
} from "../lib/module9/module9ApaLearning.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const readSrc = (rel) => readFileSync(join(root, rel), "utf8");

describe("WP-041 Module 9 do-not-rewrite coaching", () => {
  it("shows prominent do-not-rewrite coaching on the submission-document step", () => {
    const m9 = readSrc("components/ModuleNine.js");
    assert.ok(m9.includes('data-testid="module9-do-not-rewrite-coaching"'));
    assert.ok(
      m9.includes(
        "You are changing how it looks—not rewriting\n                  your essay."
      ) || m9.includes("You are changing how it looks—not rewriting")
    );
    assert.ok(m9.includes("format in APA style"));
    assert.ok(/not rewriting/i.test(m9));
  });

  it("places coaching before Open Google Doc and before Format checklist", () => {
    const m9 = readSrc("components/ModuleNine.js");
    const coachIdx = m9.indexOf('data-testid="module9-do-not-rewrite-coaching"');
    const openIdx = m9.indexOf('data-testid="module9-open-submission-doc"');
    const checklistIdx = m9.indexOf("Format checklist confirmation");

    assert.ok(coachIdx > 0);
    assert.ok(openIdx > coachIdx, "Open Google Doc must follow coaching");
    assert.ok(
      checklistIdx > openIdx,
      "Format checklist step must follow Open Doc / coaching block"
    );
  });

  it("keeps coaching on both guided and unguided Module 9 paths", () => {
    const m9 = readSrc("components/ModuleNine.js");
    // Same Step 2 section serves both: (!guidedMode || viewedStep === 2)
    const step2Gate = m9.indexOf(
      "(!guidedMode || viewedStep === 2) && submitted && !alreadySubmitted"
    );
    const coachIdx = m9.indexOf('data-testid="module9-do-not-rewrite-coaching"');
    const step2End = m9.indexOf(
      "(!guidedMode || viewedStep === 3) &&",
      step2Gate
    );
    assert.ok(step2Gate > 0);
    assert.ok(coachIdx > step2Gate && coachIdx < step2End);
    assert.ok(m9.includes("guidedMode"));
    assert.ok(m9.includes("setGuidedMode"));
  });

  it("reinforces formatting-vs-rewriting in APA learning content without duplicate Module 9 prose", () => {
    assert.match(MODULE9_APA_ENTRY.framing, /not rewriting your essay/i);
    const formatConcept = MODULE9_APA_CONCEPTS.find(
      (c) => c.id === "formatting-vs-rewriting"
    );
    assert.ok(formatConcept);
    assert.match(formatConcept.assignmentRule, /Do not rewrite essay content/i);
    assert.match(formatConcept.whatToDo, /Leave your ideas/i);

    // WP-041: only one do-not-rewrite coaching testid in ModuleNine (no duplicate cards)
    const m9 = readSrc("components/ModuleNine.js");
    const matches = m9.match(/module9-do-not-rewrite-coaching/g) || [];
    assert.equal(matches.length, 1);
  });
});
