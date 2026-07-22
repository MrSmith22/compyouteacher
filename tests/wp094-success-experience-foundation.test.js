/**
 * WP-094 — Success-experience contract and development gate tests.
 */

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const {
  SUCCESS_EXPERIENCE_VARIANTS,
  normalizeSuccessEvidence,
  resolveSuccessExperience,
  resolveCompletedDashboardPresentation,
  buildModule1SuccessExperience,
  buildModule6SuccessExperience,
  buildModule8SuccessExperience,
  buildModule9ReceiptExperience,
} = require("../lib/ui/successExperienceContract.js");
const {
  getJourneyStageForModule,
  buildJourneyProgress,
  WRITING_JOURNEY_STAGES,
} = require("../lib/ui/writingJourneyStages.js");

describe("WP-094 success experience contract", () => {
  it("normalizes all four variants", () => {
    assert.deepEqual(SUCCESS_EXPERIENCE_VARIANTS, [
      "learning_milestone",
      "artifact_completed",
      "phase_transition",
      "final_receipt",
    ]);
    for (const variant of SUCCESS_EXPERIENCE_VARIANTS) {
      const moduleNumber =
        variant === "learning_milestone"
          ? 1
          : variant === "artifact_completed"
            ? 6
            : variant === "phase_transition"
              ? 8
              : 9;
      const result = resolveSuccessExperience({
        variant,
        moduleNumber,
        title: "Title",
        explanation: "Explain",
        primaryAction: { label: "Go", href: "/x" },
        receipt:
          variant === "final_receipt"
            ? { hasDurableReceipt: true, fileName: "a.pdf" }
            : undefined,
      });
      assert.equal(result.ok, true);
      assert.equal(result.experience.variant, variant);
    }
  });

  it("maps modules to journey stages and shares Plan for 4–5", () => {
    assert.equal(getJourneyStageForModule(1).id, "understand");
    assert.equal(getJourneyStageForModule(4).id, "plan");
    assert.equal(getJourneyStageForModule(5).id, "plan");
    assert.equal(getJourneyStageForModule(8).id, "prepare");
    assert.equal(getJourneyStageForModule(9).id, "submit");
    assert.equal(WRITING_JOURNEY_STAGES.length, 8);
    const progress = buildJourneyProgress({ currentModule: 6 });
    assert.equal(progress.find((s) => s.id === "draft").state, "current");
    assert.equal(progress.find((s) => s.id === "plan").state, "completed");
    assert.equal(progress.find((s) => s.id === "revise").state, "future");
  });

  it("omits empty evidence and caps at three items", () => {
    assert.deepEqual(
      normalizeSuccessEvidence([
        { label: "  " },
        { id: "a", label: "One" },
        { id: "b", label: "Two", detail: "d" },
        { id: "c", label: "Three" },
        { id: "d", label: "Four" },
      ]),
      [
        { id: "a", label: "One", detail: null },
        { id: "b", label: "Two", detail: "d" },
        { id: "c", label: "Three", detail: null },
      ]
    );
  });

  it("requires exactly one primary action per representative builder", () => {
    const builders = [
      buildModule1SuccessExperience({}),
      buildModule6SuccessExperience({ sectionCount: 4, wordTotal: 400 }),
      buildModule8SuccessExperience({ verifiedLabel: "Verified Doc ready" }),
      buildModule9ReceiptExperience({
        hasDurableReceipt: true,
        fileName: "essay.pdf",
      }),
    ];
    for (const result of builders) {
      assert.equal(result.ok, true);
      assert.ok(result.experience.primaryAction?.label);
      assert.equal(result.experience.primaryAction.kind, "primary");
    }
  });

  it("final receipt cannot claim submission without durable receipt", () => {
    const missing = buildModule9ReceiptExperience({ hasDurableReceipt: false });
    assert.equal(missing.ok, true);
    assert.equal(missing.experience.claimsSubmission, false);
    assert.equal(missing.experience.status, "receipt_missing");
    assert.equal(missing.experience.primaryAction.kind, "recovery");

    const present = buildModule9ReceiptExperience({
      hasDurableReceipt: true,
      fileName: "final.pdf",
      submittedAtLabel: "Jul 22, 2026",
      receiptId: "abc",
    });
    assert.equal(present.experience.claimsSubmission, true);
    assert.equal(present.experience.receipt.hasDurableReceipt, true);
    assert.equal(present.experience.receipt.fileName, "final.pdf");
  });
});

describe("WP-094 completed dashboard projection", () => {
  it("shows one status, timestamp, PDF, receipt, trail, and recovery", () => {
    const ok = resolveCompletedDashboardPresentation({
      hasDurableReceipt: true,
      submittedAtLabel: "Jul 22, 2026, 1:00 PM",
      pdfHref: "https://example.test/final.pdf",
      fileName: "final.pdf",
    });
    assert.equal(ok.statusLabel, "Submitted");
    assert.equal(ok.statusOnce, true);
    assert.equal(ok.submittedAtLabel, "Jul 22, 2026, 1:00 PM");
    assert.equal(ok.primaryArtifactLabel, "Open final PDF");
    assert.equal(ok.primaryArtifactHref, "https://example.test/final.pdf");
    assert.match(ok.receiptLabel, /receipt/i);
    assert.equal(ok.journey.every((s) => s.state === "completed"), true);
    assert.match(ok.resubmissionPolicy, /Contact your teacher/i);

    const recovery = resolveCompletedDashboardPresentation({
      hasDurableReceipt: false,
      assignmentCompleteWithoutReceipt: true,
    });
    assert.match(recovery.statusLabel, /missing/i);
    assert.ok(recovery.recoveryMessage);
  });
});

describe("WP-094 production presentation boundaries (promoted by WP-095)", () => {
  it("presentation gate file is retired", () => {
    assert.equal(
      fs.existsSync(
        path.join(__dirname, "../lib/dev/isSuccessExperienceFoundationEnabled.js")
      ),
      false
    );
  });

  it("does not invent seed/fixture copy in production source gates", () => {
    const src = fs.readFileSync(
      path.join(__dirname, "../lib/ui/successExperienceContract.js"),
      "utf8"
    );
    assert.doesNotMatch(src, /seedGuidedApaProtocol|DeveloperTestingPanel/);
    assert.doesNotMatch(src, /WP-094-FIXTURE|synthetic-evidence-seed/i);
  });

  it("representative pages always mount the shared success presentation", () => {
    for (const rel of [
      "app/modules/1/success/page.js",
      "components/module6/ModuleSixSuccessClient.jsx",
      "app/modules/8/success/page.js",
      "app/modules/9/success/page.js",
      "app/dashboard/page.js",
    ]) {
      const src = fs.readFileSync(path.join(__dirname, "..", rel), "utf8");
      assert.doesNotMatch(src, /isSuccessExperienceFoundationEnabled/);
      assert.match(src, /SuccessExperienceShell|CompletedDashboardFoundation/);
    }
  });

  it("Module 9 foundation keeps receipt test ids", () => {
    const src = fs.readFileSync(
      path.join(__dirname, "../app/modules/9/success/page.js"),
      "utf8"
    );
    assert.match(src, /module9-receipt-details/);
    assert.match(src, /module9-receipt-filename/);
    assert.match(src, /module9-receipt-heading/);
    assert.match(src, /module9-receipt-missing/);
  });
});
