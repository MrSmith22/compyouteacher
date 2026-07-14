/**
 * WP-053 — Module 8–9 action affordance contract.
 * Workflow operations → buttons; optional retrieval → secondary buttons;
 * APA/OWL/templates → semantic reference links.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  getSubmissionDocRecoveryPlan,
  SUBMISSION_DOC_RECOVERY_ACTIONS,
} from "../lib/exports/submissionDocRecovery.js";
import { SUBMISSION_DOC_VERIFICATION_STATUS } from "../lib/exports/submissionDocVerification.js";
import {
  HIERARCHY_ACTION_FINAL_CLASS,
  HIERARCHY_ACTION_PRIMARY_CLASS,
  HIERARCHY_ACTION_SECONDARY_CLASS,
  HIERARCHY_FOCUS_RING_CLASS,
  HIERARCHY_REFERENCE_LINK_CLASS,
} from "../lib/ui/hierarchyContract.js";
import { openExternalResource } from "../lib/ui/openExternalResource.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const readSrc = (rel) => readFileSync(join(root, rel), "utf8");

const AUDITED = [
  "components/ModuleEight.js",
  "components/ModuleNine.js",
  "components/exports/SubmissionDocRecoveryPanel.jsx",
  "components/module8/ModuleEightReferenceShelf.jsx",
  "components/module9/ModuleNineApaQuickGuide.jsx",
  "components/module9/ModuleNineApaLesson.jsx",
  "app/modules/8/success/page.js",
  "app/modules/9/success/page.js",
];

function filledAnchorPattern() {
  return /<a\b[^>]*className=\{?[`'"][^`'"]*(?:bg-theme-blue|bg-theme-green|bg-theme-orange)[^`'"]*[`'"]/;
}

describe("WP-053 Module 8–9 action affordance contract", () => {
  it("exposes shared hierarchy action and reference tokens", () => {
    assert.ok(HIERARCHY_ACTION_PRIMARY_CLASS.includes("min-h-[44px]"));
    assert.ok(HIERARCHY_ACTION_SECONDARY_CLASS.includes("min-h-[44px]"));
    assert.ok(HIERARCHY_ACTION_FINAL_CLASS.includes("min-h-[44px]"));
    assert.ok(HIERARCHY_FOCUS_RING_CLASS.includes("focus-visible:ring-2"));
    assert.ok(HIERARCHY_REFERENCE_LINK_CLASS.includes("underline"));
    assert.ok(HIERARCHY_REFERENCE_LINK_CLASS.includes("min-h-[44px]"));
  });

  it("openExternalResource opens safely without mutating submission state", () => {
    assert.deepEqual(openExternalResource(""), {
      opened: false,
      reason: "missing",
    });
    assert.deepEqual(openExternalResource(null), {
      opened: false,
      reason: "missing",
    });

    const calls = [];
    const originalOpen = globalThis.window?.open;
    globalThis.window = {
      open: (...args) => {
        calls.push(args);
        return { ok: true };
      },
    };
    try {
      const result = openExternalResource("https://example.com/doc");
      assert.equal(result.opened, true);
      assert.equal(result.reason, "ok");
      assert.deepEqual(calls[0], [
        "https://example.com/doc",
        "_blank",
        "noopener,noreferrer",
      ]);
    } finally {
      if (originalOpen) {
        globalThis.window.open = originalOpen;
      } else {
        delete globalThis.window;
      }
    }
  });

  it("Module 9 already-submitted and success file actions are secondary buttons", () => {
    const m9 = readSrc("components/ModuleNine.js");
    const success = readSrc("app/modules/9/success/page.js");

    assert.ok(m9.includes('data-testid="module9-open-final-pdf"'));
    assert.ok(m9.includes('data-testid="module9-open-submitted-doc"'));
    assert.ok(m9.includes("Use the buttons below"));
    assert.match(
      m9,
      /<button[\s\S]*?data-testid="module9-open-final-pdf"[\s\S]*?Open final PDF/
    );
    assert.match(
      m9,
      /<button[\s\S]*?data-testid="module9-open-submitted-doc"[\s\S]*?Open Google Doc/
    );
    assert.equal(/Open final PDF[\s\S]{0,80}<\/a>/.test(m9), false);
    assert.ok(m9.includes("HIERARCHY_ACTION_SECONDARY_CLASS"));
    assert.ok(m9.includes("openExternalResource"));
    assert.equal(m9.includes("handleUploadPDF"), true);

    assert.ok(success.includes('data-testid="module9-success-open-pdf"'));
    assert.ok(success.includes('data-testid="module9-success-open-doc"'));
    assert.match(
      success,
      /<button[\s\S]*?data-testid="module9-success-open-pdf"[\s\S]*?Open your submitted PDF/
    );
    assert.match(
      success,
      /<button[\s\S]*?data-testid="module9-success-open-doc"[\s\S]*?Open your Google Doc/
    );
    assert.equal(/Open your submitted PDF[\s\S]{0,80}<\/a>/.test(success), false);
    assert.ok(success.includes("HIERARCHY_ACTION_SECONDARY_CLASS"));
    assert.ok(success.includes("openExternalResource"));
    assert.equal(success.includes("handleUploadPDF"), false);
    assert.equal(success.includes("/api/final-pdf"), false);
  });

  it("Module 8 workflow actions remain buttons; APA resources remain links", () => {
    const m8 = readSrc("components/ModuleEight.js");
    const shelf = readSrc("components/module8/ModuleEightReferenceShelf.jsx");
    const panel = readSrc("components/exports/SubmissionDocRecoveryPanel.jsx");
    const success = readSrc("app/modules/8/success/page.js");

    assert.ok(m8.includes('data-testid="module8-format-open-doc"'));
    assert.ok(m8.includes("type=\"button\""));
    assert.ok(m8.includes("HIERARCHY_ACTION_PRIMARY_CLASS"));
    assert.ok(success.includes("module8-success-continue"));
    assert.ok(success.includes("type=\"button\""));
    assert.ok(panel.includes('type="button"'));

    assert.ok(shelf.includes('data-testid="module8-apa-template-link"'));
    assert.ok(shelf.includes('data-testid="module8-apa-sample-link"'));
    assert.ok(shelf.includes('data-testid="module8-apa-owl-link"'));
    assert.ok(shelf.includes("HIERARCHY_REFERENCE_LINK_CLASS"));
    assert.match(shelf, /<a[\s\S]*?module8-apa-template-link/);
    assert.match(shelf, /<a[\s\S]*?module8-apa-owl-link/);
  });

  it("Module 9 APA template and Quick Guide resources stay semantic anchors", () => {
    const m9 = readSrc("components/ModuleNine.js");
    const guide = readSrc("components/module9/ModuleNineApaQuickGuide.jsx");
    assert.ok(m9.includes("Copy APA Google Docs Template"));
    assert.match(m9, /<a[\s\S]*?Copy APA Google Docs Template/);
    assert.ok(m9.includes("HIERARCHY_REFERENCE_LINK_CLASS"));
    assert.ok(guide.includes("HIERARCHY_REFERENCE_LINK_CLASS"));
    assert.ok(guide.includes("MODULE9_APA_SECONDARY_RESOURCES"));
    assert.match(guide, /<a[\s\S]*?resource\.href/);
  });

  it("audited surfaces have no filled button-styled anchors", () => {
    const pattern = filledAnchorPattern();
    for (const rel of AUDITED) {
      const src = readSrc(rel);
      assert.equal(
        pattern.test(src),
        false,
        `${rel} still has a filled button-styled <a>`
      );
    }
  });

  it("non-submit action buttons use type=button and focus/min-target classes", () => {
    for (const rel of [
      "components/ModuleNine.js",
      "app/modules/9/success/page.js",
      "app/modules/8/success/page.js",
      "components/ModuleEight.js",
    ]) {
      const src = readSrc(rel);
      assert.ok(src.includes('type="button"'));
      assert.ok(
        src.includes("HIERARCHY_FOCUS_RING_CLASS") ||
          src.includes("focus-visible:ring") ||
          src.includes("FOCUS_RING")
      );
      assert.ok(src.includes("min-h-[44px]") || src.includes("HIERARCHY_ACTION_"));
    }
  });

  it("preserves WP-030 recovery mapping and WP-031 single-primary behavior", () => {
    const tempFail = getSubmissionDocRecoveryPlan({
      verificationStatus:
        SUBMISSION_DOC_VERIFICATION_STATUS.VERIFICATION_ERROR,
      hasUrl: true,
      contentVerified: false,
      requireSessionWrite: true,
    });
    assert.equal(
      tempFail.primaryAction,
      SUBMISSION_DOC_RECOVERY_ACTIONS.RETRY_CHECK
    );
    assert.ok(
      tempFail.secondaryActions.includes(SUBMISSION_DOC_RECOVERY_ACTIONS.OPEN)
    );

    const m8 = readSrc("components/ModuleEight.js");
    assert.ok(m8.includes("HIERARCHY_ACTION_PRIMARY_CLASS"));
    assert.ok(m8.includes("showFooterKeepGoing") || m8.includes("Keep going"));
    assert.ok(m8.includes("SubmissionDocRecoveryPanel"));

    const success8 = readSrc("app/modules/8/success/page.js");
    assert.ok(success8.includes('data-testid="module8-success-continue"'));
    assert.equal(
      (success8.match(/data-testid="module8-success-continue"/g) || []).length,
      1
    );
    const success9 = readSrc("app/modules/9/success/page.js");
    assert.ok(success9.includes("HIERARCHY_ACTION_PRIMARY_CLASS"));
    assert.ok(success9.includes("HIERARCHY_ACTION_SECONDARY_CLASS"));
    assert.ok(success9.includes('data-testid="module9-success-open-pdf"'));
  });

  it("design-system documents the action taxonomy", () => {
    const ds = readSrc("docs/design-system-v1.md");
    assert.ok(/HIERARCHY_ACTION_PRIMARY_CLASS/.test(ds));
    assert.ok(/HIERARCHY_ACTION_SECONDARY_CLASS/.test(ds));
    assert.ok(/HIERARCHY_ACTION_FINAL_CLASS/.test(ds));
    assert.ok(/HIERARCHY_REFERENCE_LINK_CLASS/.test(ds));
    assert.ok(/one visually dominant/i.test(ds));
    assert.ok(/44px/.test(ds));
  });
});
