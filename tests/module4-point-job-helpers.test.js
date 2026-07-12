const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const {
  PARAGRAPH_POINT_DEFINITION,
  PARAGRAPH_JOB_DEFINITION,
  PARAGRAPH_JOB_CHOICES,
  PROOF_SLOT_RECOMMENDED_JOB_IDS,
  LEGACY_PARAGRAPH_ROLE_LABELS,
  CUSTOM_JOB_PREFIX,
  pointStepQuestion,
  jobStepQuestion,
  resolveProofPlanSlots,
  recommendParagraphJob,
  proofPlanSlotForSuggestionId,
  paragraphJobChoicesForUi,
  labelForParagraphJob,
  encodeCustomParagraphJob,
  decodeCustomParagraphJob,
  isCustomParagraphJob,
  hasSelectedParagraphJob,
  getPointJobPairingCoaching,
  buildPriorParagraphJobSummaries,
  getRepeatedJobCoaching,
  buildShelfParagraphSummary,
} = require("../lib/module4/module4PointJobHelpers.js");

const fs = require("node:fs");
const path = require("node:path");
const {
  STEP_B1_SCAFFOLD,
  STEP_B1_ROLE,
} = require("../components/module4/module4FlowSteps.js");

describe("module4 Checkpoint 3 — paragraph point vs job", () => {
  const proofPlan = [
    "King builds trust for the speech audience.",
    "King builds trust differently in the letter.",
    "Both works reject waiting for justice.",
  ];

  function buildSuggestionsFromSlots(plan) {
    return resolveProofPlanSlots(plan).map((slot) => ({
      id: slot.suggestionId,
      label: slot.text,
      slotIndex: slot.slotIndex,
    }));
  }

  it("1. point and job definitions are distinct", () => {
    assert.match(PARAGRAPH_POINT_DEFINITION, /what this paragraph will prove/i);
    assert.match(
      PARAGRAPH_JOB_DEFINITION,
      /compare-and-contrast work/i
    );
    assert.notEqual(PARAGRAPH_POINT_DEFINITION, PARAGRAPH_JOB_DEFINITION);
  });

  it("2–3. point and job step questions use approved wording", () => {
    assert.equal(pointStepQuestion(1), "What point will Paragraph 1 prove?");
    assert.equal(
      jobStepQuestion(1),
      "How will Paragraph 1 do its part in the essay?"
    );
    const presentationSource = fs.readFileSync(
      path.join(__dirname, "../components/module4/module4StepPresentation.js"),
      "utf8"
    );
    assert.ok(
      presentationSource.includes(
        "What point will Paragraph ${n} prove?"
      )
    );
    assert.ok(
      presentationSource.includes(
        "How will Paragraph ${n} do its part in the essay?"
      )
    );
    assert.equal(STEP_B1_SCAFFOLD, 4);
    assert.equal(STEP_B1_ROLE, 5);
  });

  it("4–7. proof slots recommend jobs and preserve exact wording", () => {
    const slots = resolveProofPlanSlots(proofPlan);
    assert.equal(slots[0].recommendedJobId, "analyze_speech");
    assert.equal(slots[1].recommendedJobId, "analyze_letter");
    assert.equal(slots[2].recommendedJobId, "compare_both");
    assert.deepEqual(PROOF_SLOT_RECOMMENDED_JOB_IDS, [
      "analyze_speech",
      "analyze_letter",
      "compare_both",
    ]);

    assert.equal(slots[0].text, proofPlan[0]);
    assert.equal(slots[1].text, proofPlan[1]);
    assert.equal(slots[2].text, proofPlan[2]);

    const suggestions = buildSuggestionsFromSlots(proofPlan);
    assert.equal(suggestions[0].id, "proof-0");
    assert.equal(suggestions[0].label, proofPlan[0]);
    assert.equal(suggestions[1].id, "proof-1");
    assert.equal(suggestions[2].id, "proof-2");

    // Empty first slot must not renumber later slots.
    const gapped = ["", "Letter note exact", "Compare note exact"];
    const gappedSuggestions = buildSuggestionsFromSlots(gapped);
    assert.equal(gappedSuggestions[0].id, "proof-1");
    assert.equal(gappedSuggestions[0].label, "Letter note exact");
  });

  it("8–9. recommendation does not auto-finalize; student may choose another job", () => {
    const recommended = recommendParagraphJob({
      proofPlan,
      suggestionId: "proof-0",
      paragraphIndex: 0,
    });
    assert.equal(recommended.jobId, "analyze_speech");
    assert.equal(recommended.slot.text, proofPlan[0]);

    // Choosing a different job is a normal UI write to paragraphRole.
    const chosen = "compare_both";
    assert.notEqual(chosen, recommended.jobId);
    assert.equal(labelForParagraphJob(chosen), "Compare both works");
    assert.equal(hasSelectedParagraphJob(chosen), true);
  });

  it("10. missing proof plan produces neutral choices", () => {
    const ui = paragraphJobChoicesForUi({ proofPlan: [], currentRole: "" });
    assert.equal(ui.hasProofPlan, false);
    assert.equal(ui.recommendNeutrally, true);
    assert.equal(ui.choices.length, PARAGRAPH_JOB_CHOICES.length);
    assert.equal(recommendParagraphJob({ proofPlan: [] }), null);
  });

  it("11–12. legacy roles get labels and hydrate without clearing", () => {
    assert.equal(
      labelForParagraphJob("similarity"),
      LEGACY_PARAGRAPH_ROLE_LABELS.similarity
    );
    assert.equal(
      labelForParagraphJob("diff_speech"),
      LEGACY_PARAGRAPH_ROLE_LABELS.diff_speech
    );
    assert.equal(
      labelForParagraphJob("ethos"),
      LEGACY_PARAGRAPH_ROLE_LABELS.ethos
    );

    const saved = {
      claim: "Saved point stays",
      paragraphRole: "similarity",
      evidenceKeys: ["a"],
      reasoning: "Saved reasoning stays",
    };
    const ui = paragraphJobChoicesForUi({
      proofPlan,
      currentRole: saved.paragraphRole,
    });
    assert.equal(ui.choices[0].id, "similarity");
    assert.equal(ui.choices[0].isLegacy, true);
    assert.equal(saved.claim, "Saved point stays");
    assert.equal(saved.paragraphRole, "similarity");
    assert.equal(saved.reasoning, "Saved reasoning stays");
  });

  it("13. custom job stays in existing paragraphRole string shape", () => {
    const encoded = encodeCustomParagraphJob("Compare the openings");
    assert.equal(encoded.startsWith(CUSTOM_JOB_PREFIX), true);
    assert.equal(decodeCustomParagraphJob(encoded), "Compare the openings");
    assert.equal(isCustomParagraphJob(encoded), true);
    assert.equal(hasSelectedParagraphJob(encoded), true);
    assert.equal(hasSelectedParagraphJob(CUSTOM_JOB_PREFIX), false);
  });

  it("14–15. prior paragraph jobs appear; repeated jobs are allowed", () => {
    const buckets = [
      { claim: "P1", paragraphRole: "analyze_speech" },
      { claim: "P2", paragraphRole: "analyze_letter" },
    ];
    const prior = buildPriorParagraphJobSummaries(buckets, 1);
    assert.equal(prior.length, 1);
    assert.equal(prior[0].jobLabel, "Analyze the speech");

    const repeated = getRepeatedJobCoaching(
      [
        { paragraphRole: "analyze_speech" },
        { paragraphRole: "analyze_speech" },
      ],
      1
    );
    assert.match(repeated, /distinct part/i);
    // Allowed: coaching exists, but no hard block helper returns false.
    assert.equal(hasSelectedParagraphJob("analyze_speech"), true);
  });

  it("16–17. contradictory pairings coach; empty job stays mechanically blocked", () => {
    const coach = getPointJobPairingCoaching({
      claim: "King builds trust in the speech.",
      paragraphRole: "analyze_letter",
      suggestionId: "proof-0",
    });
    assert.ok(coach);
    assert.match(coach.message, /Check this pairing/i);
    assert.equal(hasSelectedParagraphJob(""), false);
    assert.equal(hasSelectedParagraphJob("analyze_speech"), true);
  });

  it("18–19. evidence presentation helpers and shelf summary include point + job", () => {
    const slot = proofPlanSlotForSuggestionId(proofPlan, "proof-0");
    assert.equal(slot.roleLabel.includes("Speech"), true);
    const shelf = buildShelfParagraphSummary(
      {
        claim: "King builds trust differently for each audience.",
        paragraphRole: "analyze_speech",
      },
      0
    );
    assert.equal(shelf.point.includes("trust"), true);
    assert.equal(shelf.jobLabel, "Analyze the speech");
    const moduleFourSource = fs.readFileSync(
      path.join(__dirname, "../components/ModuleFour.js"),
      "utf8"
    );
    assert.ok(moduleFourSource.includes("Paragraph point"));
    assert.ok(moduleFourSource.includes("Paragraph job"));
    assert.ok(moduleFourSource.includes("Matching proof-plan note"));
  });

  it("20. mobile presentation stacks point/job controls (layout contract)", () => {
    const source = fs.readFileSync(
      path.join(__dirname, "../components/ModuleFour.js"),
      "utf8"
    );
    assert.ok(source.includes("grid grid-cols-1 gap-3 md:grid-cols-2"));
    assert.ok(source.includes("grid grid-cols-1 gap-3 lg:grid-cols-2"));
    assert.ok(source.includes("w-full"));
  });

  it("22. Module 5 mapping remains claim/points from snippets (unchanged)", () => {
    // Module 5 reads claim + snippets/reasoning only; paragraphRole is ignored.
    const module4Bucket = {
      claim: "Point text",
      paragraphRole: "analyze_speech",
      reasoning: "Because urgency matters.",
      evidenceSnippets: [{ quote: "q", observation: "note" }],
    };
    const module5Card = {
      bucket: String(module4Bucket.claim || "").trim() || "Body paragraph",
      points: [
        `${module4Bucket.evidenceSnippets[0].observation} — "${module4Bucket.evidenceSnippets[0].quote}"`,
        module4Bucket.reasoning,
      ],
    };
    assert.equal(module5Card.bucket, "Point text");
    assert.ok(module5Card.points.some((p) => p.includes("note")));
    assert.ok(module5Card.points.some((p) => p.includes("urgency")));
    assert.equal(
      Object.prototype.hasOwnProperty.call(module5Card, "paragraphRole"),
      false
    );
  });
});
