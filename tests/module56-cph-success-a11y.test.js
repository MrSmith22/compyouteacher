/**
 * CP-H — Module 5/6 success surfaces, a11y labels, layout contracts.
 */

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const m5 = require("../lib/module5/module5SuccessHelpers.js");
const m6 = require("../lib/module6/module6SuccessHelpers.js");

const POINT_A = "Speech builds public hope through pathos.";
const POINT_B = "Letter builds clerical pressure through ethos.";

function finalizedOutline() {
  return {
    thesis: "King adapts appeals for each audience.",
    body: [
      {
        point: POINT_A,
        job: "Analyze the speech",
        jobId: "analyze_speech",
        evidence: [{ quote: "dream" }],
        reasoning: "This shows pathos for a public audience.",
      },
      {
        point: POINT_B,
        job: "Analyze the letter",
        evidence: [{ quote: "wait" }, { quote: "never" }],
        reasoning: "This shows ethos for clergymen.",
      },
    ],
    conclusion: {
      summary: "Both works pursue justice.",
      finalThought: "Audience shapes the appeal.",
    },
  };
}

describe("CP-H Module 5 success summary", () => {
  it("H1. Finalized outline builds read-only artifact map", () => {
    const summary = m5.buildModule5SuccessSummary({
      outlineRow: { outline: finalizedOutline(), finalized: true },
    });
    assert.equal(summary.incomplete, false);
    assert.equal(summary.writesArtifacts, false);
    assert.equal(summary.bodyCards.length, 2);
    assert.equal(summary.bodyCards[0].job, "Analyze the speech");
    assert.equal(summary.expectedDraftSections, 4);
    assert.ok(summary.thesis.available);
  });

  it("H2. Unfinalized or missing outline is incomplete without seeding write", () => {
    const missing = m5.buildModule5SuccessSummary({ outlineRow: null });
    assert.equal(missing.incomplete, true);
    assert.equal(missing.writesArtifacts, false);

    const open = m5.buildModule5SuccessSummary({
      outlineRow: { outline: finalizedOutline(), finalized: false },
    });
    assert.equal(open.incomplete, true);
  });

  it("H3. Failed outline read does not invent writable outline state", () => {
    const failed = m5.buildModule5SuccessSummary({ readFailed: true });
    assert.equal(failed.readFailed, true);
    assert.equal(failed.incomplete, true);
    assert.equal(failed.writesArtifacts, false);
    assert.equal(failed.bodyCards, undefined);
  });

  it("H4. Success stage advance/back ordering", () => {
    assert.equal(
      m5.resolveModule5SuccessAdvance(m5.MODULE5_SUCCESS_STAGES.CELEBRATE).stage,
      m5.MODULE5_SUCCESS_STAGES.EXPLORE
    );
    assert.equal(
      m5.resolveModule5SuccessAdvance(m5.MODULE5_SUCCESS_STAGES.HANDOFF).exit,
      true
    );
    assert.equal(
      m5.resolveModule5SuccessBack(m5.MODULE5_SUCCESS_STAGES.EXPLORE).stage,
      m5.MODULE5_SUCCESS_STAGES.CELEBRATE
    );
  });
});

describe("CP-H Module 6 success summary", () => {
  it("H5. Locked draft builds section map without mutating prose", () => {
    const sections = [
      "Introduction prose with enough length here.",
      "Body one prose with enough length here.",
      "Body two prose with enough length here.",
      "Conclusion prose with enough length here.",
    ];
    const summary = m6.buildModule6SuccessSummary({
      draftRow: {
        sections,
        locked: true,
        full_text: sections.join("\n\n"),
      },
      outline: finalizedOutline(),
    });
    assert.equal(summary.incomplete, false);
    assert.equal(summary.writesArtifacts, false);
    assert.equal(summary.sectionCards.length, 4);
    assert.equal(summary.sectionCards[0].label, "Introduction");
    assert.equal(summary.sectionCards[1].label, "Body Paragraph 1");
    assert.deepEqual(sections, [
      "Introduction prose with enough length here.",
      "Body one prose with enough length here.",
      "Body two prose with enough length here.",
      "Conclusion prose with enough length here.",
    ]);
  });

  it("H6. Unlocked or empty draft is incomplete", () => {
    const unlocked = m6.buildModule6SuccessSummary({
      draftRow: { sections: ["a"], locked: false },
    });
    assert.equal(unlocked.incomplete, true);

    const empty = m6.buildModule6SuccessSummary({
      draftRow: { sections: [], locked: true },
    });
    assert.equal(empty.incomplete, true);
  });

  it("H7. Failed draft read never seeds writable sections", () => {
    const failed = m6.buildModule6SuccessSummary({ readFailed: true });
    assert.equal(failed.readFailed, true);
    assert.equal(failed.sectionCards, undefined);
    assert.equal(failed.writesArtifacts, false);
  });

  it("H8. Legacy locked draft without outline still summarizes sections", () => {
    const summary = m6.buildModule6SuccessSummary({
      draftRow: {
        sections: ["Intro text here ok.", "Body text here ok.", "End text here ok."],
        locked: true,
      },
      outline: null,
    });
    assert.equal(summary.incomplete, false);
    assert.equal(summary.sectionCards.length, 3);
  });
});

describe("CP-H production wiring, a11y, layout", () => {
  it("H9. Success pages use CP-H clients and no draft/outline POST on success files", () => {
    const m5page = fs.readFileSync(
      path.join(__dirname, "../app/modules/5/success/page.js"),
      "utf8"
    );
    const m6page = fs.readFileSync(
      path.join(__dirname, "../app/modules/6/success/page.js"),
      "utf8"
    );
    const m5client = fs.readFileSync(
      path.join(__dirname, "../components/module5/ModuleFiveSuccessClient.jsx"),
      "utf8"
    );
    const m6client = fs.readFileSync(
      path.join(__dirname, "../components/module6/ModuleSixSuccessClient.jsx"),
      "utf8"
    );
    const shell = fs.readFileSync(
      path.join(__dirname, "../components/success/SuccessExperienceShell.jsx"),
      "utf8"
    );
    assert.ok(m5page.includes("ModuleFiveSuccessClient"));
    assert.ok(m6page.includes("ModuleSixSuccessClient"));
    assert.ok(m5client.includes("getOutlineRow"));
    assert.ok(m6client.includes("getModule6DraftRow"));
    assert.equal(m5client.includes("method: \"POST\""), false);
    assert.equal(m6client.includes("method: \"POST\""), false);
    assert.equal(m5client.includes("/api/outlines"), false);
    assert.ok(m5client.includes("advanceCurrentModuleOnSuccess"));
    assert.ok(m5client.includes("SuccessExperienceShell"));
    assert.ok(m6client.includes("SuccessExperienceShell"));
    assert.ok(shell.includes("HIERARCHY_FOCUS_RING_CLASS"));
    assert.ok(m6client.includes("overflow-x-hidden") || m6client.includes("incomplete"));
  });

  it("H10. Layout contracts cover 320–1440", () => {
    assert.deepEqual(m5.MODULE5_SUCCESS_LAYOUT_CONTRACT.viewports, [
      320, 390, 768, 1024, 1440,
    ]);
    assert.deepEqual(m6.MODULE6_SUCCESS_LAYOUT_CONTRACT.viewports, [
      320, 390, 768, 1024, 1440,
    ]);
    assert.equal(m5.MODULE5_SUCCESS_LAYOUT_CONTRACT.mobile.minActionTargetPx, 44);
    assert.equal(m6.MODULE6_SUCCESS_LAYOUT_CONTRACT.mobile.noHorizontalOverflow, true);
  });

  it("H11. Module 6 gate message remains accessible after CP-H polish", () => {
    const src = fs.readFileSync(
      path.join(__dirname, "../components/ModuleSix.js"),
      "utf8"
    );
    assert.ok(src.includes('aria-live="polite"'));
    assert.ok(src.includes("sectionGateMessage"));
  });

  it("H12. Module 5 reorder controls retain accessible names", () => {
    const src = fs.readFileSync(
      path.join(__dirname, "../components/ModuleFive.js"),
      "utf8"
    );
    assert.ok(src.includes("aria-label={`Move paragraph"));
  });

  it("H13. Success controls expose visible keyboard focus indicators", () => {
    const shell = fs.readFileSync(
      path.join(__dirname, "../components/success/SuccessExperienceShell.jsx"),
      "utf8"
    );
    const m5client = fs.readFileSync(
      path.join(__dirname, "../components/module5/ModuleFiveSuccessClient.jsx"),
      "utf8"
    );
    const m6client = fs.readFileSync(
      path.join(__dirname, "../components/module6/ModuleSixSuccessClient.jsx"),
      "utf8"
    );
    assert.ok(shell.includes("HIERARCHY_FOCUS_RING_CLASS"));
    assert.ok(m5client.includes("SuccessExperienceShell"));
    assert.ok(m6client.includes("SuccessExperienceShell"));
  });
});
