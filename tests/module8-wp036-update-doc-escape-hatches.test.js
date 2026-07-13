/**
 * WP-036 — Module 8 Update Google Doc escape hatches on Format and Ready.
 *
 * Evidence (checklist invalidation): verified Update replaces Doc body via
 * deleteContentRange + insertText in buildReplaceGoogleDocBodyRequests /
 * replaceDocumentBody. Manual APA formatting in the Doc is therefore stale
 * after a successful verified late Update; Format + Ready confirmations reset
 * only then—not on navigate, cancel, timeout, mismatch, or failed verification.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  MODULE8_READY_CONFIDENCE_ITEMS,
  MODULE8_STEP_TYPES,
  MODULE8_WORKSPACE_STEPS,
} from "../components/module8/module8StepPresentation.js";
import { buildReplaceGoogleDocBodyRequests } from "../lib/exports/submissionGoogleDocHelpers.js";
import {
  buildSubmissionDocSuccessConfirmation,
} from "../lib/exports/submissionDocSuccessConfirmation.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const readSrc = (rel) => readFileSync(join(root, rel), "utf8");

describe("WP-036 Module 8 Update Google Doc escape hatches", () => {
  it("shows Update Google Doc escape hatch on Format", () => {
    const m8 = readSrc("components/ModuleEight.js");
    assert.ok(m8.includes('data-testid="module8-format-update-doc-escape"'));
    assert.ok(m8.includes('data-testid="module8-format-escape-hatches"'));
    assert.ok(m8.includes("openUpdateGoogleDocWorkingSet"));

    const formatIdx = m8.indexOf('data-testid="module8-format-working-set"');
    const escapeIdx = m8.indexOf('data-testid="module8-format-update-doc-escape"');
    const keepGoingIdx = m8.indexOf('data-testid="module8-keep-going"');
    assert.ok(formatIdx > 0 && escapeIdx > formatIdx);
    assert.ok(keepGoingIdx > escapeIdx, "Keep going remains after Format escape");
  });

  it("shows Update Google Doc escape hatch on Ready", () => {
    const m8 = readSrc("components/ModuleEight.js");
    assert.ok(m8.includes('data-testid="module8-ready-update-doc-escape"'));
    assert.ok(m8.includes('data-testid="module8-ready-escape-hatches"'));
    assert.ok(m8.includes('data-testid="module8-ready-open-doc"'));

    const readyIdx = m8.indexOf('data-testid="module8-ready-working-set"');
    const escapeIdx = m8.indexOf('data-testid="module8-ready-update-doc-escape"');
    const finishIdx = m8.indexOf('data-testid="module8-finish-prepare"');
    assert.ok(readyIdx > 0 && escapeIdx > readyIdx);
    assert.ok(finishIdx > escapeIdx, "Finish remains the Ready primary");
  });

  it("returns to the existing Create/Update working set without a second export path", () => {
    const m8 = readSrc("components/ModuleEight.js");
    assert.ok(
      m8.includes("const openUpdateGoogleDocWorkingSet = () => {\n    setCurrentStepIndex(0);\n  }") ||
        (m8.includes("openUpdateGoogleDocWorkingSet") &&
          m8.includes("setCurrentStepIndex(0)"))
    );

    const escapeHandler = m8.slice(
      m8.indexOf("openUpdateGoogleDocWorkingSet"),
      m8.indexOf("openUpdateGoogleDocWorkingSet") + 280
    );
    assert.ok(escapeHandler.includes("setCurrentStepIndex(0)"));
    assert.ok(
      !escapeHandler.includes("handleCreateOrUpdateSubmissionDoc"),
      "escape hatch must not call Update"
    );
    assert.ok(
      !escapeHandler.includes("createOrUpdateSubmissionGoogleDoc"),
      "escape hatch must not call export client"
    );

    // Still a single Update implementation on CREATE_DOC
    const updateCalls = m8.match(/handleCreateOrUpdateSubmissionDoc\(\{/g) || [];
    assert.ok(updateCalls.length >= 2);
    assert.ok(
      m8.includes("MODULE8_STEP_TYPES.CREATE_DOC") &&
        m8.includes("SubmissionDocRecoveryPanel")
    );
    assert.equal(
      MODULE8_WORKSPACE_STEPS[0].type,
      MODULE8_STEP_TYPES.CREATE_DOC
    );
  });

  it("navigation alone does not clear APA or Ready checklists", () => {
    const m8 = readSrc("components/ModuleEight.js");
    const escapeFnStart = m8.indexOf("openUpdateGoogleDocWorkingSet");
    const escapeFn = m8.slice(escapeFnStart, escapeFnStart + 220);
    assert.ok(!escapeFn.includes("setChecklistState"));
    assert.ok(!escapeFn.includes("setConfidenceState"));

    const goBackSlice = m8.slice(m8.indexOf("const goBack"), m8.indexOf("const goBack") + 120);
    assert.ok(!goBackSlice.includes("setChecklistState"));
    assert.ok(!goBackSlice.includes("setConfidenceState"));
  });

  it("failed or unverified Update preserves checklist reset gate (reset only on contentVerified)", () => {
    const m8 = readSrc("components/ModuleEight.js");
    // Reset lives only inside contentVerified success branch
    const verifiedBlock = m8.slice(
      m8.indexOf("if (result.contentVerified)"),
      m8.indexOf("} else {\n        setDocVerifiedThisSession(false);")
    );
    assert.ok(verifiedBlock.includes("setChecklistState"));
    assert.ok(verifiedBlock.includes("setConfidenceState"));
    assert.ok(verifiedBlock.includes("CHECKLIST_ITEMS.length"));
    assert.ok(verifiedBlock.includes("MODULE8_READY_CONFIDENCE_ITEMS.length"));

    // Failure path clears verification but must not reset checklists there
    const failBlock = m8.slice(
      m8.indexOf("if (!result.ok)"),
      m8.indexOf("setSubmissionDocUrl(result.url)")
    );
    assert.ok(failBlock.includes("setDocVerifiedThisSession(false)"));
    assert.ok(!failBlock.includes("setChecklistState"));
    assert.ok(!failBlock.includes("setConfidenceState"));
  });

  it("successful verified late Update invalidates stale confirmations and keeps WP-032 confirmation path", () => {
    const m8 = readSrc("components/ModuleEight.js");
    assert.ok(
      m8.includes("replaceDocumentBody") ||
        m8.includes("Manual APA formatting applied in the")
    );
    assert.ok(m8.includes("setChecklistState(Array(CHECKLIST_ITEMS.length).fill(false))"));
    assert.ok(
      m8.includes(
        "Array(MODULE8_READY_CONFIDENCE_ITEMS.length).fill(false)"
      )
    );
    assert.equal(MODULE8_READY_CONFIDENCE_ITEMS.length, 5);

    // WP-032 confirmation still shown on verified success
    assert.ok(m8.includes("result.contentVerified && result.confirmation"));
    assert.ok(m8.includes("confirmation: result.confirmation"));

    const confirmation = buildSubmissionDocSuccessConfirmation({
      operation: "updated",
      verification: { verified: true, expectedWordCount: 412 },
      completedAt: "2026-07-13T12:00:00.000Z",
    });
    assert.ok(confirmation);
    assert.equal(confirmation.wordCount, 412);
    assert.equal(confirmation.completedAt, "2026-07-13T12:00:00.000Z");
    assert.ok(confirmation.statement.includes("updated successfully"));
  });

  it("documents that Update replaces Doc body (formatting trust is stale after rewrite)", () => {
    const helpers = readSrc("lib/exports/submissionGoogleDocHelpers.js");
    assert.ok(helpers.includes("deleteContentRange"));
    assert.ok(helpers.includes("insertText"));

    const requests = buildReplaceGoogleDocBodyRequests({
      endIndex: 40,
      text: "rewritten essay body",
    });
    assert.equal(requests.length, 2);
    assert.ok(requests[0].deleteContentRange);
    assert.ok(requests[1].insertText);
    assert.equal(requests[1].insertText.text, "rewritten essay body");

    const runner = readSrc("lib/exports/runExportEssayToGoogleDocs.js");
    assert.ok(runner.includes("replaceDocumentBody"));
  });

  it("does not introduce a duplicate primary Update action on Format or Ready", () => {
    const m8 = readSrc("components/ModuleEight.js");

    // Escape buttons use secondary border styling, not theme-blue fill
    const formatEscape = m8.slice(
      m8.indexOf('data-testid="module8-format-update-doc-escape"') - 350,
      m8.indexOf('data-testid="module8-format-update-doc-escape"') + 40
    );
    assert.ok(formatEscape.includes("border border-border-soft"));
    assert.ok(!formatEscape.includes("bg-theme-blue"));

    const readyEscape = m8.slice(
      m8.indexOf('data-testid="module8-ready-update-doc-escape"') - 350,
      m8.indexOf('data-testid="module8-ready-update-doc-escape"') + 40
    );
    assert.ok(readyEscape.includes("border border-border-soft"));
    assert.ok(!readyEscape.includes("bg-theme-blue"));

    // Sole primary progression controls remain footer Keep going / Finish
    assert.ok(m8.includes('data-testid="module8-keep-going"'));
    assert.ok(m8.includes('data-testid="module8-finish-prepare"'));
    assert.ok(m8.includes("min-h-[44px]"));
    assert.ok(m8.includes("focus-visible:ring-2"));
  });
});
