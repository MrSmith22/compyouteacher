/**
 * WP-043 — Module 9 APA + PDF download visual models.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { MODULE9_APA_CONCEPTS } from "../lib/module9/module9ApaLearning.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const readSrc = (rel) => readFileSync(join(root, rel), "utf8");

describe("WP-043 Module 9 APA and PDF visual models", () => {
  it("keeps a visual model for every APA learning concept", () => {
    const visual = readSrc("components/module9/ModuleNineApaVisual.jsx");
    assert.ok(visual.includes('data-testid="module9-apa-visual"'));
    for (const concept of MODULE9_APA_CONCEPTS) {
      assert.ok(concept.visualId);
      assert.ok(concept.visualCaption);
      assert.ok(concept.visualAlt);
      assert.ok(
        visual.includes(`"${concept.visualId}"`) ||
          visual.includes(concept.visualId)
      );
    }
  });

  it("adds a PDF download visual with File, Download, and PDF Document (.pdf)", () => {
    const pdfVisual = readSrc(
      "components/module9/ModuleNinePdfDownloadVisual.jsx"
    );
    assert.ok(pdfVisual.includes('data-testid="module9-pdf-download-visual"'));
    assert.ok(pdfVisual.includes("File"));
    assert.ok(pdfVisual.includes("Download"));
    assert.ok(pdfVisual.includes("PDF Document (.pdf)"));
    assert.ok(pdfVisual.includes("<figure"));
    assert.ok(pdfVisual.includes("<figcaption"));
    assert.ok(/aria-label=.*File.*Download.*PDF/i.test(pdfVisual));
  });

  it("places the PDF visual before the upload input in Module 9 Step 4", () => {
    const m9 = readSrc("components/ModuleNine.js");
    assert.ok(m9.includes("ModuleNinePdfDownloadVisual"));
    const visualIdx = m9.indexOf("<ModuleNinePdfDownloadVisual");
    const uploadInputIdx = m9.indexOf('type="file"');
    const uploadBtnIdx = m9.indexOf("Upload Final PDF");
    const stepsIntroIdx = m9.indexOf(
      "Follow these steps to turn your Google Doc into a PDF"
    );
    assert.ok(visualIdx > stepsIntroIdx);
    assert.ok(uploadInputIdx > visualIdx);
    assert.ok(uploadBtnIdx > uploadInputIdx);
  });

  it("uses no remote image dependency for APA or PDF visuals", () => {
    const apa = readSrc("components/module9/ModuleNineApaVisual.jsx");
    const pdf = readSrc("components/module9/ModuleNinePdfDownloadVisual.jsx");
    assert.equal(/<img\b/i.test(apa), false);
    assert.equal(/<img\b/i.test(pdf), false);
    assert.equal(/https?:\/\//i.test(pdf), false);
    assert.ok(pdf.includes("overflow-x-hidden"));
    assert.ok(pdf.includes("max-w-[340px]"));
  });
});
