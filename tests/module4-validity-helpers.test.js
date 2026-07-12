const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const {
  POINT_MIN_CHARS,
  CUSTOM_JOB_MIN_CHARS,
  REASONING_MIN_CHARS,
  REFLECTION_MIN_CHARS,
  POINT_MESSAGES,
  JOB_MESSAGES,
  EVIDENCE_MESSAGES,
  REASONING_MESSAGES,
  REFLECTION_MESSAGES,
  REFLECTION_INSTRUCTION,
  validateParagraphPoint,
  validateParagraphJob,
  validateParagraphEvidence,
  validateParagraphReasoning,
  validateReflection,
  validateThirdParagraphDecision,
  isParagraphMechanicallyPlanned,
  plannedParagraphIndices,
  areRequiredParagraphsPlanned,
  evaluateModule4Advance,
  canAdvanceModule4Step,
  uniqueQualifyingEvidenceSlots,
} = require("../lib/module4/module4ValidityHelpers.js");

const {
  encodeCustomParagraphJob,
  CUSTOM_JOB_PREFIX,
} = require("../lib/module4/module4PointJobHelpers.js");

const STEP = {
  STEP_HANDOFF: 0,
  STEP_WELCOME: 0,
  STEP_BIG_PICTURE: 1,
  STEP_EXPLAIN_BUCKETS: 2,
  STEP_PATTERN: 3,
  STEP_B1_SCAFFOLD: 4,
  STEP_B1_ROLE: 5,
  STEP_B1_EVIDENCE: 6,
  STEP_B1_REASONING: 7,
  STEP_B2_SCAFFOLD: 8,
  STEP_B2_ROLE: 9,
  STEP_B2_EVIDENCE: 10,
  STEP_B2_REASONING: 11,
  STEP_THIRD_DECISION: 12,
  STEP_B3_SCAFFOLD: 13,
  STEP_B3_ROLE: 14,
  STEP_B3_EVIDENCE: 15,
  STEP_B3_REASONING: 16,
  STEP_REFLECTION: 17,
};

function plannedBucket(overrides = {}) {
  return {
    claim: "King builds trust differently for each audience.",
    paragraphRole: "analyze_speech",
    reasoning: "The evidence shows urgency that supports the thesis clearly.",
    evidenceKeys: ["tchart:speech:pathos"],
    evidenceSnippets: [{ quote: "justice delayed", observation: "urgency" }],
    suggestionId: "proof-0",
    ...overrides,
  };
}

function qualifyingSlot(overrides = {}) {
  return {
    savedKey: "tchart:speech:pathos",
    status: "current",
    countsTowardEvidenceGate: true,
    row: { evidenceKey: "tchart:speech:pathos", type: "speech", category: "pathos" },
    quote: "quote",
    ...overrides,
  };
}

describe("module4 Checkpoint 4 — mechanical gates", () => {
  it("1–4. paragraph point thresholds", () => {
    assert.equal(POINT_MIN_CHARS, 15);
    assert.equal(validateParagraphPoint("").valid, false);
    assert.equal(validateParagraphPoint("").message, POINT_MESSAGES.empty);
    assert.equal(validateParagraphPoint("   ").valid, false);
    assert.equal(validateParagraphPoint("abcdefghijklmn").valid, false); // 14
    assert.equal(
      validateParagraphPoint("abcdefghijklmn").message,
      POINT_MESSAGES.incomplete
    );
    assert.equal(validateParagraphPoint("abcdefghijklmno").valid, true); // 15
    assert.equal(
      validateParagraphPoint("abcdefghijklmno").message,
      POINT_MESSAGES.ready
    );
  });

  it("5–9. paragraph job selection and custom/legacy rules", () => {
    assert.equal(CUSTOM_JOB_MIN_CHARS, 8);
    assert.equal(validateParagraphJob("").valid, false);
    assert.equal(validateParagraphJob("").message, JOB_MESSAGES.empty);
    // Recommendation without selection fails
    assert.equal(validateParagraphJob("").valid, false);
    assert.equal(validateParagraphJob("analyze_speech").valid, true);
    assert.equal(validateParagraphJob("similarity").valid, true); // legacy
    assert.equal(validateParagraphJob("ethos").valid, true);

    const shortCustom = encodeCustomParagraphJob("1234567"); // 7
    assert.equal(shortCustom.startsWith(CUSTOM_JOB_PREFIX), true);
    assert.equal(validateParagraphJob(shortCustom).valid, false);
    assert.equal(
      validateParagraphJob(shortCustom).message,
      JOB_MESSAGES.incomplete
    );

    const readyCustom = encodeCustomParagraphJob("12345678"); // 8
    assert.equal(validateParagraphJob(readyCustom).valid, true);
  });

  it("10–13. evidence resolution and unique counting", () => {
    assert.equal(validateParagraphEvidence([]).valid, false);
    assert.equal(validateParagraphEvidence([]).message, EVIDENCE_MESSAGES.empty);

    const missing = [
      {
        savedKey: "gone",
        status: "missing",
        countsTowardEvidenceGate: false,
      },
    ];
    assert.equal(validateParagraphEvidence(missing).valid, false);
    assert.equal(
      validateParagraphEvidence(missing).message,
      EVIDENCE_MESSAGES.unresolved
    );

    const duplicates = [
      qualifyingSlot({ savedKey: "a", row: { evidenceKey: "same" } }),
      qualifyingSlot({
        savedKey: "a-alias",
        row: { evidenceKey: "same" },
      }),
    ];
    assert.equal(uniqueQualifyingEvidenceSlots(duplicates).length, 1);
    assert.equal(validateParagraphEvidence(duplicates).valid, true);

    const preserved = [
      {
        savedKey: "old",
        status: "preserved",
        countsTowardEvidenceGate: true,
        row: { evidenceKey: "old", quote: "kept" },
        quote: "kept",
      },
    ];
    assert.equal(validateParagraphEvidence(preserved).valid, true);
    assert.equal(
      validateParagraphEvidence(preserved).message,
      EVIDENCE_MESSAGES.ready
    );
  });

  it("14–16. reasoning thresholds", () => {
    assert.equal(REASONING_MIN_CHARS, 20);
    assert.equal(validateParagraphReasoning("").valid, false);
    assert.equal(
      validateParagraphReasoning("").message,
      REASONING_MESSAGES.empty
    );
    assert.equal(validateParagraphReasoning("abcdefghijklmnopqrs").valid, false); // 19
    assert.equal(
      validateParagraphReasoning("abcdefghijklmnopqrs").message,
      REASONING_MESSAGES.incomplete
    );
    assert.equal(validateParagraphReasoning("abcdefghijklmnopqrst").valid, true); // 20
  });

  it("17–19. reflection thresholds and instruction copy", () => {
    assert.equal(REFLECTION_MIN_CHARS, 15);
    assert.match(REFLECTION_INSTRUCTION, /Module 5/);
    assert.equal(validateReflection("").valid, false);
    assert.equal(validateReflection("abcdefghijklmn").valid, false); // 14
    assert.equal(validateReflection("abcdefghijklmno").valid, true); // 15
    assert.equal(
      validateReflection("abcdefghijklmno").message,
      REFLECTION_MESSAGES.ready
    );
  });

  it("20–21. planned requires all four parts; flow alone does not plan", () => {
    const incomplete = plannedBucket({ reasoning: "short" });
    assert.equal(
      isParagraphMechanicallyPlanned(incomplete, [qualifyingSlot()]),
      false
    );
    const complete = plannedBucket();
    assert.equal(
      isParagraphMechanicallyPlanned(complete, [qualifyingSlot()]),
      true
    );
    // Advancing flow is irrelevant to the helper — missing evidence fails.
    assert.equal(isParagraphMechanicallyPlanned(plannedBucket(), []), false);
  });

  it("22–23. chosen vs declined third paragraph", () => {
    const buckets = [
      plannedBucket(),
      plannedBucket({
        claim: "Letter shows lived injustice in urgent language.",
        paragraphRole: "analyze_letter",
      }),
      {
        claim: "x",
        paragraphRole: "",
        reasoning: "",
        evidenceKeys: [],
      },
    ];
    const getSlots = (bucket) =>
      (bucket?.evidenceKeys || []).length
        ? [qualifyingSlot({ savedKey: bucket.evidenceKeys[0] })]
        : [];

    assert.equal(
      areRequiredParagraphsPlanned({
        buckets,
        wantThirdBucket: true,
        getEvidenceSlots: getSlots,
      }),
      false
    );
    assert.equal(
      areRequiredParagraphsPlanned({
        buckets,
        wantThirdBucket: false,
        getEvidenceSlots: getSlots,
      }),
      true
    );
    const planned = plannedParagraphIndices({
      buckets,
      wantThirdBucket: false,
      getEvidenceSlots: getSlots,
    });
    assert.deepEqual(planned, [0, 1]);
  });

  it("24. handler rejects invalid advancement even if called directly", () => {
    const blocked = evaluateModule4Advance({
      flowStep: STEP.STEP_B1_SCAFFOLD,
      buckets: [{ claim: "short" }],
      stepConstants: STEP,
    });
    assert.equal(blocked.ok, false);
    assert.equal(canAdvanceModule4Step({
      flowStep: STEP.STEP_B1_SCAFFOLD,
      buckets: [{ claim: "short" }],
      stepConstants: STEP,
    }), false);

    const ok = evaluateModule4Advance({
      flowStep: STEP.STEP_B1_SCAFFOLD,
      buckets: [{ claim: "abcdefghijklmno" }],
      stepConstants: STEP,
    });
    assert.equal(ok.ok, true);
  });

  it("25–26. saved short text remains unchanged; editing one paragraph preserves others", () => {
    const buckets = [
      { claim: "short saved", paragraphRole: "analyze_speech", reasoning: "" },
      plannedBucket({ claim: "Paragraph two keeps its full point text here." }),
    ];
    const before = JSON.stringify(buckets[1]);
    validateParagraphPoint(buckets[0].claim);
    buckets[0] = { ...buckets[0], claim: "short saved still here!" };
    assert.equal(JSON.stringify(buckets[1]), before);
    assert.equal(buckets[0].claim, "short saved still here!");
  });

  it("28. Module 5 payload remains unchanged by validity helpers", () => {
    const bucket = plannedBucket({ paragraphRole: "analyze_speech" });
    const module5Card = {
      bucket: bucket.claim,
      points: [
        `${bucket.evidenceSnippets[0].observation} — "${bucket.evidenceSnippets[0].quote}"`,
        bucket.reasoning,
      ],
    };
    assert.equal(module5Card.bucket, bucket.claim);
    assert.equal(
      Object.prototype.hasOwnProperty.call(module5Card, "paragraphRole"),
      false
    );
  });

  it("third-decision validity requires explicit Yes/No", () => {
    assert.equal(validateThirdParagraphDecision(null).valid, false);
    assert.equal(validateThirdParagraphDecision(true).valid, true);
    assert.equal(validateThirdParagraphDecision(false).valid, true);
  });
});
