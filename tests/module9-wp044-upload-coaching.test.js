/**
 * WP-044 — Module 9 Step 4 upload coaching (Choose File → … → Confirmation).
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const readSrc = (rel) => readFileSync(join(root, rel), "utf8");

describe("WP-044 Module 9 upload step-by-step coaching", () => {
  it("shows five numbered upload stages in Master Spec order", () => {
    const m9 = readSrc("components/ModuleNine.js");
    assert.ok(m9.includes('data-testid="module9-pdf-upload-coaching"'));
    assert.ok(m9.includes("Upload your PDF"));

    const block = m9.slice(
      m9.indexOf('data-testid="module9-pdf-upload-coaching"'),
      m9.indexOf('data-testid="module9-pdf-file-input"')
    );
    assert.ok(/list-decimal/.test(block));

    const chooseIdx = block.indexOf("Choose the file control");
    const locateIdx = block.indexOf("Locate the PDF");
    const openIdx = block.indexOf("Select the newest PDF, then choose Open");
    const uploadIdx = block.indexOf("Upload Final PDF");
    const confirmIdx = block.indexOf("successful upload confirmation");

    assert.ok(chooseIdx > 0);
    assert.ok(locateIdx > chooseIdx);
    assert.ok(openIdx > locateIdx);
    assert.ok(uploadIdx > openIdx);
    assert.ok(confirmIdx > uploadIdx);
  });

  it("places upload coaching after download instructions and before the file input", () => {
    const m9 = readSrc("components/ModuleNine.js");
    const downloadIdx = m9.indexOf('data-testid="module9-pdf-download-instructions"');
    const visualIdx = m9.indexOf("<ModuleNinePdfDownloadVisual");
    const coachIdx = m9.indexOf('data-testid="module9-pdf-upload-coaching"');
    const inputIdx = m9.indexOf('data-testid="module9-pdf-file-input"');
    const buttonIdx = m9.indexOf('data-testid="module9-upload-final-pdf"');

    assert.ok(downloadIdx > 0);
    assert.ok(visualIdx > downloadIdx);
    assert.ok(coachIdx > visualIdx);
    assert.ok(inputIdx > coachIdx);
    assert.ok(buttonIdx > inputIdx);

    assert.ok(m9.includes("Download your Google Doc as a PDF"));
    assert.ok(m9.includes("Upload your PDF"));
  });

  it("keeps selected-file feedback and does not change upload handlers", () => {
    const m9 = readSrc("components/ModuleNine.js");
    assert.ok(m9.includes('data-testid="module9-pdf-selected"'));
    assert.ok(m9.includes("Selected: {pdfFile.name}"));
    assert.ok(m9.includes("const handleFileSelect"));
    assert.ok(m9.includes("const handleUploadPDF"));
    assert.ok(m9.includes('accept=".pdf,application/pdf"'));
    assert.ok(m9.includes("onChange={handleFileSelect}"));
    assert.ok(m9.includes("onClick={handleUploadPDF}"));
    assert.ok(m9.includes("disabled={!canUpload}"));

    // WP-045 / WP-046 out of scope
    assert.equal(
      /accidentally upload the wrong PDF/i.test(m9),
      false
    );
  });
});
