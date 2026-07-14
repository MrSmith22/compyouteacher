/**
 * WP-045 — Module 9 wrong-PDF reassurance (truthful correction path).
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const readSrc = (rel) => readFileSync(join(root, rel), "utf8");

describe("WP-045 Module 9 wrong-PDF reassurance", () => {
  it("places reassurance next to the file input and upload button", () => {
    const m9 = readSrc("components/ModuleNine.js");
    assert.ok(m9.includes('data-testid="module9-wrong-pdf-reassurance"'));

    const coachIdx = m9.indexOf('data-testid="module9-pdf-upload-coaching"');
    const reassureIdx = m9.indexOf('data-testid="module9-wrong-pdf-reassurance"');
    const inputIdx = m9.indexOf('data-testid="module9-pdf-file-input"');
    const buttonIdx = m9.indexOf('data-testid="module9-upload-final-pdf"');

    assert.ok(coachIdx > 0);
    assert.ok(reassureIdx > coachIdx);
    assert.ok(inputIdx > reassureIdx);
    assert.ok(buttonIdx > inputIdx);

    // Reassurance sits between the pre-upload tips and file control (no later steps).
    const betweenReassureAndInput = m9.slice(reassureIdx, inputIdx);
    assert.ok(!/Continue to upload|checklist/i.test(betweenReassureAndInput));
    assert.ok(betweenReassureAndInput.includes("Chose the wrong PDF"));
  });

  it("explains pre-upload reselect and post-upload teacher contact", () => {
    const m9 = readSrc("components/ModuleNine.js");
    const start = m9.indexOf('data-testid="module9-wrong-pdf-reassurance"');
    const end = m9.indexOf('data-testid="module9-pdf-file-input"');
    const block = m9.slice(start, end);

    assert.ok(/file control again/i.test(block));
    assert.ok(/select the correct|choose the correct|correct one/i.test(block));
    assert.ok(/before you upload/i.test(block));
    assert.ok(/contact your teacher/i.test(block));
    assert.ok(/resubmit/i.test(block));
  });

  it("does not claim unsupported post-submission replacement", () => {
    const m9 = readSrc("components/ModuleNine.js");
    const start = m9.indexOf('data-testid="module9-wrong-pdf-reassurance"');
    const end = m9.indexOf('data-testid="module9-pdf-file-input"');
    const block = m9.slice(start, end);

    assert.equal(
      /simply upload the correct one/i.test(block),
      false,
      "must not claim unsupported re-upload after submission"
    );
    assert.equal(
      /upload the correct one again/i.test(block),
      false
    );
    assert.equal(/replace(?:ment)? (?:is|are) available/i.test(block), false);
    assert.equal(/automatic(?:ally)? (?:re-?upload|replace)/i.test(block), false);
  });

  it("keeps upload handlers, accept types, gating, and button behavior unchanged", () => {
    const m9 = readSrc("components/ModuleNine.js");
    assert.ok(m9.includes("const handleFileSelect"));
    assert.ok(m9.includes("const handleUploadPDF"));
    assert.ok(m9.includes('accept=".pdf,application/pdf"'));
    assert.ok(m9.includes("onChange={handleFileSelect}"));
    assert.ok(m9.includes("onClick={handleUploadPDF}"));
    assert.ok(m9.includes("disabled={!canUpload}"));
    assert.ok(m9.includes('data-testid="module9-upload-final-pdf"'));
    assert.ok(m9.includes('data-testid="module9-pdf-selected"'));

    const api = readSrc("app/api/final-pdf/route.js");
    assert.ok(api.includes("replaceExisting: false"));
    assert.ok(api.includes("Final PDF already submitted"));
  });
});
