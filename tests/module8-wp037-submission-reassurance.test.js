/**
 * WP-037 — Module 8 persistent “nothing submitted yet” reassurance.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const readSrc = (rel) => readFileSync(join(root, rel), "utf8");

describe("WP-037 Module 8 submission reassurance", () => {
  it("shows the three reassurance concepts in the shared framing panel", () => {
    const m8 = readSrc("components/ModuleEight.js");
    assert.ok(m8.includes('data-testid="module8-submission-reassurance"'));
    assert.ok(m8.includes("Your writing has been saved."));
    assert.ok(m8.includes("Nothing has been submitted yet."));
    assert.ok(m8.includes("You can return and update your Google Doc."));
    assert.ok(m8.includes("Module 9"));
    assert.ok(m8.includes("Module 8 prepares"));
  });

  it("places reassurance outside step-specific conditional rendering", () => {
    const m8 = readSrc("components/ModuleEight.js");
    const framingIdx = m8.indexOf('data-testid="module8-submission-doc-framing"');
    const reassureIdx = m8.indexOf('data-testid="module8-submission-reassurance"');
    const createCondIdx = m8.indexOf(
      "currentStep.type === MODULE8_STEP_TYPES.CREATE_DOC ?"
    );
    // Prefer the working-set ternary (second CREATE_DOC conditional after step label).
    const workingCreateIdx = m8.indexOf(
      "{currentStep.type === MODULE8_STEP_TYPES.CREATE_DOC ? (",
      framingIdx
    );
    const formatCondIdx = m8.indexOf(
      "currentStep.type === MODULE8_STEP_TYPES.FORMAT ?"
    );
    const readyCondIdx = m8.indexOf(
      "currentStep.type === MODULE8_STEP_TYPES.READY ?"
    );

    assert.ok(framingIdx > 0);
    assert.ok(reassureIdx > framingIdx);
    assert.ok(
      workingCreateIdx > reassureIdx,
      "reassurance must appear before Create/Update working-set branch"
    );
    assert.ok(formatCondIdx > workingCreateIdx);
    assert.ok(readyCondIdx > formatCondIdx);
    // Step label ternary may sit between framing and working set; reassurance still shared.
    assert.ok(createCondIdx > 0);
  });

  it("does not imply the Google Doc itself has already been submitted", () => {
    const m8 = readSrc("components/ModuleEight.js");
    const block = m8.slice(
      m8.indexOf('data-testid="module8-submission-reassurance"'),
      m8.indexOf('data-testid="module8-submission-reassurance"') + 520
    );
    assert.ok(block.includes("Nothing has been submitted yet"));
    assert.ok(/Module 9.*PDF|final PDF/i.test(block));
    assert.ok(!/Google Doc has been submitted/i.test(block));
    assert.ok(!/already submitted your Google Doc/i.test(block));
  });

  it("preserves WP-036 escape hatches and verified-update invalidation", () => {
    const m8 = readSrc("components/ModuleEight.js");
    assert.ok(m8.includes('data-testid="module8-format-update-doc-escape"'));
    assert.ok(m8.includes('data-testid="module8-ready-update-doc-escape"'));
    assert.ok(m8.includes("openUpdateGoogleDocWorkingSet"));
    assert.ok(
      m8.includes("setChecklistState(Array(CHECKLIST_ITEMS.length).fill(false))")
    );
    assert.ok(
      m8.includes("Array(MODULE8_READY_CONFIDENCE_ITEMS.length).fill(false)")
    );
    assert.ok(m8.includes("if (result.contentVerified)"));
  });
});
