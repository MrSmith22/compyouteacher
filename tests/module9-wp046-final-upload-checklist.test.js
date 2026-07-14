/**
 * WP-046 — Module 9 Step 4 final upload checklist for the selected PDF.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const readSrc = (rel) => readFileSync(join(root, rel), "utf8");

const REQUIRED_ITEMS = [
  "The PDF opens correctly.",
  "The title page appears.",
  "The references page appears.",
  "The paper is double-spaced.",
  "This is the newest version of the essay.",
];

describe("WP-046 Module 9 final upload checklist", () => {
  it("shows exactly the five required confirmations, separate from Step 3", () => {
    const m9 = readSrc("components/ModuleNine.js");
    assert.ok(m9.includes('data-testid="module9-final-upload-checklist"'));
    assert.ok(m9.includes("FINAL_UPLOAD_CHECKLIST_ITEMS"));
    assert.ok(m9.includes("finalUploadChecklistState"));
    assert.ok(m9.includes("EMPTY_FINAL_UPLOAD_CHECKLIST"));

    const finalBlock = m9.slice(
      m9.indexOf("FINAL_UPLOAD_CHECKLIST_ITEMS"),
      m9.indexOf("EMPTY_FINAL_UPLOAD_CHECKLIST")
    );
    for (const item of REQUIRED_ITEMS) {
      assert.ok(finalBlock.includes(item), `missing: ${item}`);
    }
    assert.equal(
      (finalBlock.match(/"/g) || []).length >= 10,
      true
    );
    assert.equal(REQUIRED_ITEMS.length, 5);

    // Step 3 remains the persisted six-item APA checklist.
    // Step 3 remains the persisted six-item APA checklist.
    assert.ok(m9.includes("const CHECKLIST_ITEMS = getModule9FormattingChecklistItems()"));
    assert.ok(m9.includes("checklistState"));
    assert.ok(m9.includes("upsertModule9Checklist"));
    assert.ok(m9.includes("Format your paper with the APA guide"));
    assert.ok(
      m9.includes(
        "not the Step 3 APA formatting checklist"
      )
    );

    const step3Start = m9.indexOf("Format your paper with the APA guide");
    const step4Start = m9.indexOf("Download, check, and submit your PDF");
    const finalChecklistUi = m9.indexOf('data-testid="module9-final-upload-checklist"');
    assert.ok(step3Start > 0 && step4Start > step3Start);
    assert.ok(finalChecklistUi > step4Start);
  });

  it("orders file input → selected filename → final checklist → Upload Final PDF", () => {
    const m9 = readSrc("components/ModuleNine.js");
    const inputIdx = m9.indexOf('data-testid="module9-pdf-file-input"');
    const selectedIdx = m9.indexOf('data-testid="module9-pdf-selected"');
    const checklistIdx = m9.indexOf('data-testid="module9-final-upload-checklist"');
    const buttonIdx = m9.indexOf('data-testid="module9-upload-final-pdf"');
    const reassureIdx = m9.indexOf('data-testid="module9-wrong-pdf-reassurance"');

    assert.ok(reassureIdx > 0);
    assert.ok(inputIdx > reassureIdx);
    assert.ok(selectedIdx > inputIdx);
    assert.ok(checklistIdx > selectedIdx);
    assert.ok(buttonIdx > checklistIdx);
    assert.ok(m9.includes("Selected: {pdfFile.name}"));
  });

  it("disables checklist controls until a valid PDF is selected and resets on file change", () => {
    const m9 = readSrc("components/ModuleNine.js");
    const checklistUi = m9.slice(
      m9.indexOf('data-testid="module9-final-upload-checklist"'),
      m9.indexOf('data-testid="module9-upload-final-pdf"')
    );
    assert.ok(checklistUi.includes("disabled={!pdfFile}"));
    assert.ok(checklistUi.includes("FINAL_UPLOAD_CHECKLIST_ITEMS.map"));

    const selectFn = m9.slice(
      m9.indexOf("const handleFileSelect"),
      m9.indexOf("const canUpload")
    );
    const resets = selectFn.match(
      /setFinalUploadChecklistState\(EMPTY_FINAL_UPLOAD_CHECKLIST\(\)\)/g
    );
    assert.ok(resets && resets.length >= 4, "reset on clear, reject type, reject size, and valid select");
    assert.ok(selectFn.includes('setPdfFile(null)'));
    assert.ok(selectFn.includes("setPdfFile(file)"));
    assert.ok(selectFn.includes("MAX_PDF_SIZE_BYTES"));
    assert.ok(selectFn.includes('endsWith(".pdf")'));
  });

  it("requires final checklist completion in canUpload and handleUploadPDF", () => {
    const m9 = readSrc("components/ModuleNine.js");
    const canUpload = m9.slice(
      m9.indexOf("const canUpload ="),
      m9.indexOf("const handleUploadPDF")
    );
    assert.ok(canUpload.includes("submitted"));
    assert.ok(canUpload.includes("docReady"));
    assert.ok(canUpload.includes("checklistComplete"));
    assert.ok(canUpload.includes("!!pdfFile"));
    assert.ok(canUpload.includes("finalUploadChecklistComplete"));
    assert.ok(canUpload.includes("!uploading"));

    const uploadFn = m9.slice(
      m9.indexOf("const handleUploadPDF"),
      m9.indexOf("if (!session) return")
    );
    assert.ok(uploadFn.includes("if (!finalUploadChecklistComplete)"));
    assert.ok(
      uploadFn.includes(
        "Confirm each item on the final upload checklist for this PDF before uploading."
      )
    );
  });

  it("preserves selected file and confirmations on upload failure and keeps Step 3 intact", () => {
    const m9 = readSrc("components/ModuleNine.js");
    const uploadFn = m9.slice(
      m9.indexOf("const handleUploadPDF"),
      m9.indexOf("if (!session) return")
    );
    assert.equal(
      /setFinalUploadChecklistState\(EMPTY_FINAL_UPLOAD_CHECKLIST\(\)\)/.test(uploadFn),
      false,
      "upload handler must not clear final checklist on failure"
    );
    assert.equal(
      /setPdfFile\(null\)/.test(uploadFn),
      false,
      "upload handler must not clear selected PDF on failure"
    );
    assert.ok(uploadFn.includes("Upload failed. Please try again."));
    assert.ok(uploadFn.includes("setUploading(false)"));

    // Step 3 persistence still uses six-item checklist only.
    assert.ok(m9.includes("Array(6).fill(false)"));
    assert.ok(m9.includes("data.items.length === 6"));
    assert.ok(m9.includes("getModule9FormattingChecklistItems"));
    assert.ok(m9.includes('data-testid="module9-wrong-pdf-reassurance"'));
    assert.ok(m9.includes('accept=".pdf,application/pdf"'));
    assert.ok(m9.includes("onChange={handleFileSelect}"));
    assert.ok(m9.includes("onClick={handleUploadPDF}"));
    assert.ok(m9.includes("disabled={!canUpload}"));

    const api = readSrc("app/api/final-pdf/route.js");
    assert.ok(api.includes("replaceExisting: false"));
  });
});
