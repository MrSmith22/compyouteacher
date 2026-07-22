/**
 * WP-087 — Generalize evidence-to-argument across all WP-079 directions.
 */

import test from "node:test";
import assert from "node:assert/strict";
import {
  generateCanonicalDirectionFrames,
  WP079_RELATIONSHIP,
} from "../lib/module2/matrixEssayDirectionContract.js";
import {
  buildEvidenceArgumentDirectionDescriptor,
  isCanonicalWp079OptionId,
  isFullyMappedCustom,
  parseWp079OptionId,
  getCanonicalWp079OptionIds,
  relationshipCoachingPrompt,
} from "../lib/module2/evidenceArgumentDirectionDescriptor.js";
import {
  WP086_REPRESENTATIVE_OPTION_ID,
  EVIDENCE_ARGUMENT_SCHEMA_VERSION,
  EVIDENCE_ARGUMENT_SCHEMA_VERSION_V1,
  resolveEvidencePairForDirection,
  pairRepresentativeDirectionEvidence,
  evaluateBothWorkReadiness,
  normalizeEvidenceArgumentSliceState,
  createEmptyEvidenceArgumentSliceState,
  toEvidenceArgumentRecord,
  studentCopyContainsForbiddenTerms,
} from "../lib/artifacts/evidenceArgumentContract.js";
import {
  isEvidenceToArgumentSliceDevEnabled,
  isEvidenceToArgumentSliceEnabled,
} from "../lib/dev/isEvidenceToArgumentSliceEnabled.js";
import {
  setEvidenceArgumentModeCache,
  clearEvidenceArgumentModeCache,
} from "../lib/assignments/evidenceArgumentModeCache.js";

const SPEECH = `
I have a dream that my four little children will one day live in a nation where they will not be judged by the color of their skin but by the content of their character.
We hold these truths to be self-evident, that all men are created equal.
Five score years ago, a great American signed the Emancipation Proclamation.
`.trim();

const LETTER = `
An unjust law is a human law that is not rooted in eternal law and natural law.
Injustice anywhere is a threat to justice everywhere.
This "Wait" has almost always meant "Never."
My Dear Fellow Clergymen:
`.trim();

function record({ id, sourceType, appeal, quotation }) {
  return toEvidenceArgumentRecord(
    {
      id,
      sourceType,
      appeal,
      quotation,
      studentObservation: "Observation",
      audienceNote: "Audience effect noted.",
      purposeNote: "Purpose contribution noted.",
      writeCompatible: true,
      legacy: false,
      aliases: [id],
    },
    { speechText: SPEECH, letterText: LETTER }
  );
}

const ALL_RECORDS = [
  record({
    id: "tchart:speech:pathos",
    sourceType: "speech",
    appeal: "pathos",
    quotation:
      "I have a dream that my four little children will one day live in a nation where they will not be judged by the color of their skin but by the content of their character.",
  }),
  record({
    id: "tchart:letter:logos",
    sourceType: "letter",
    appeal: "logos",
    quotation: "Injustice anywhere is a threat to justice everywhere.",
  }),
  record({
    id: "tchart:speech:logos",
    sourceType: "speech",
    appeal: "logos",
    quotation:
      "We hold these truths to be self-evident, that all men are created equal.",
  }),
  record({
    id: "tchart:letter:pathos",
    sourceType: "letter",
    appeal: "pathos",
    quotation: 'This "Wait" has almost always meant "Never."',
  }),
  record({
    id: "tchart:speech:ethos",
    sourceType: "speech",
    appeal: "ethos",
    quotation:
      "Five score years ago, a great American signed the Emancipation Proclamation.",
  }),
  record({
    id: "tchart:letter:ethos",
    sourceType: "letter",
    appeal: "ethos",
    quotation: "My Dear Fellow Clergymen:",
  }),
  record({
    id: "guided:speech:pathos:alt",
    sourceType: "speech",
    appeal: "pathos",
    quotation:
      "I have a dream that my four little children will one day live in a nation where they will not be judged by the color of their skin but by the content of their character.",
  }),
];

function matrixWithRatings(ratingsByCell = {}) {
  const cells = [];
  for (const sourceType of ["speech", "letter"]) {
    for (const appeal of ["ethos", "pathos", "logos"]) {
      const key = `${sourceType}:${appeal}`;
      cells.push({
        sourceType,
        appeal,
        rating: ratingsByCell[key]?.rating ?? 5,
        evidenceIds: ratingsByCell[key]?.evidenceIds || [`tchart:${sourceType}:${appeal}`],
        explicitNoEvidence: false,
      });
    }
  }
  return { cells };
}

test("WP-087 canonical option ids match generateCanonicalDirectionFrames", () => {
  const frames = generateCanonicalDirectionFrames();
  assert.equal(frames.canonicalCount, 9);
  const ids = getCanonicalWp079OptionIds();
  assert.equal(ids.size, 10); // 9 + student_created
  for (const frame of frames.all) {
    assert.equal(isCanonicalWp079OptionId(frame.frameId), true);
  }
  assert.equal(isCanonicalWp079OptionId("not_a_frame"), false);
});

test("WP-087 descriptor table covers same-appeal, cross, and custom", () => {
  const contrast = buildEvidenceArgumentDirectionDescriptor({
    optionId: "same_appeal:pathos",
    matrixBundle: matrixWithRatings({
      "speech:pathos": { rating: 10, evidenceIds: ["tchart:speech:pathos"] },
      "letter:pathos": { rating: 4, evidenceIds: ["tchart:letter:pathos"] },
    }),
  });
  assert.equal(contrast.ok, true);
  assert.equal(contrast.family, "same_appeal");
  assert.equal(contrast.speechAppeal, "pathos");
  assert.equal(contrast.letterAppeal, "pathos");
  assert.equal(contrast.relationship, WP079_RELATIONSHIP.STRONG_CONTRAST);
  assert.equal(contrast.mappingComplete, true);

  const reverse = buildEvidenceArgumentDirectionDescriptor({
    optionId: "cross_dominant:logos:pathos",
  });
  assert.equal(reverse.family, "cross_dominant");
  assert.equal(reverse.speechAppeal, "logos");
  assert.equal(reverse.letterAppeal, "pathos");
  assert.equal(reverse.relationship, "cross_dominant");

  const incomplete = buildEvidenceArgumentDirectionDescriptor({
    optionId: "student_created",
    customMapping: { speechAppeal: "ethos" },
  });
  assert.equal(incomplete.mappingComplete, false);
  assert.equal(incomplete.speechAppeal, "ethos");
  assert.equal(incomplete.letterAppeal, null);

  const mapped = buildEvidenceArgumentDirectionDescriptor({
    optionId: "student_created",
    customMapping: {
      speechAppeal: "ethos",
      letterAppeal: "logos",
      relationship: "cross_dominant",
      speechEvidenceId: "tchart:speech:ethos",
      letterEvidenceId: "tchart:letter:logos",
    },
  });
  assert.equal(mapped.mappingComplete, true);
  assert.equal(isFullyMappedCustom(mapped.customMapping), true);
});

test("WP-087 resolveEvidencePairForDirection is table-driven across families", () => {
  const cases = [
    {
      optionId: "same_appeal:pathos",
      speechId: "tchart:speech:pathos",
      letterId: "tchart:letter:pathos",
    },
    {
      optionId: "cross_dominant:pathos:logos",
      speechId: "tchart:speech:pathos",
      letterId: "tchart:letter:logos",
    },
    {
      optionId: "cross_dominant:logos:pathos",
      speechId: "tchart:speech:logos",
      letterId: "tchart:letter:pathos",
    },
  ];

  for (const c of cases) {
    const descriptor = buildEvidenceArgumentDirectionDescriptor({
      optionId: c.optionId,
      matrixBundle: matrixWithRatings(),
    });
    const paired = resolveEvidencePairForDirection({
      descriptor,
      matrixBundle: matrixWithRatings(),
      evidenceRecords: ALL_RECORDS,
    });
    assert.equal(paired.ok, true, c.optionId);
    assert.equal(paired.speech.id, c.speechId, c.optionId);
    assert.equal(paired.letter.id, c.letterId, c.optionId);
  }
});

test("WP-087 multi-candidate does not silently pick a winner", () => {
  const descriptor = buildEvidenceArgumentDirectionDescriptor({
    optionId: WP086_REPRESENTATIVE_OPTION_ID,
  });
  const paired = resolveEvidencePairForDirection({
    descriptor,
    matrixBundle: {
      cells: [
        { sourceType: "speech", appeal: "pathos", evidenceIds: [] },
        {
          sourceType: "letter",
          appeal: "logos",
          evidenceIds: ["tchart:letter:logos"],
        },
      ],
    },
    evidenceRecords: ALL_RECORDS,
  });
  assert.equal(paired.ok, false);
  assert.equal(paired.requiresStudentPick, true);
  assert.ok((paired.speechCandidates || []).length >= 2);
});

test("WP-087 custom mapping never invents appeals", () => {
  const descriptor = buildEvidenceArgumentDirectionDescriptor({
    optionId: "student_created",
  });
  assert.equal(descriptor.speechAppeal, null);
  assert.equal(descriptor.letterAppeal, null);
  const paired = resolveEvidencePairForDirection({
    descriptor,
    evidenceRecords: ALL_RECORDS,
  });
  assert.equal(paired.ok, false);
  assert.equal(paired.reason, "custom_mapping_incomplete");
});

test("WP-087 normalize upgrades v1 pathos/logos state to v2", () => {
  const v1 = {
    schemaVersion: EVIDENCE_ARGUMENT_SCHEMA_VERSION_V1,
    currentStep: "ea_pattern",
    speechEvidenceId: "tchart:speech:pathos",
    letterEvidenceId: "tchart:letter:logos",
    patternText: "Feeling vs reasoning",
    significanceText: "Audiences differ",
    largerPointText: "Thesis about speech and letter",
    thesisText: "Thesis about speech and letter",
    proofDirections: [
      { role: "speech", text: "A", evidenceId: null },
      { role: "letter", text: "B", evidenceId: null },
      { role: "comparison", text: "", evidenceId: null },
    ],
    upstreamSignature: "sig-old",
    reviewedUpstreamSignature: "sig-old",
    argumentMapConfirmed: false,
  };
  const next = normalizeEvidenceArgumentSliceState(v1, {
    optionId: WP086_REPRESENTATIVE_OPTION_ID,
    evidenceRecords: ALL_RECORDS,
    matrixBundle: matrixWithRatings(),
  });
  assert.equal(next.schemaVersion, EVIDENCE_ARGUMENT_SCHEMA_VERSION);
  assert.equal(next.directionDescriptor?.optionId, WP086_REPRESENTATIVE_OPTION_ID);
  assert.equal(next.patternText, "Feeling vs reasoning");
  assert.equal(next.currentStep, "ea_pattern");
});

test("WP-087 optionId change keeps prior prose for review", () => {
  const prior = {
    ...createEmptyEvidenceArgumentSliceState(),
    schemaVersion: 2,
    directionDescriptor: {
      optionId: WP086_REPRESENTATIVE_OPTION_ID,
      family: "cross_dominant",
    },
    patternText: "Old pattern prose",
    thesisText: "Old thesis about speech and letter",
    speechEvidenceId: "tchart:speech:pathos",
    letterEvidenceId: "tchart:letter:logos",
  };
  const next = normalizeEvidenceArgumentSliceState(prior, {
    optionId: "cross_dominant:logos:pathos",
    evidenceRecords: ALL_RECORDS,
    matrixBundle: matrixWithRatings(),
  });
  assert.equal(next.needsDirectionReview, true);
  assert.equal(next.priorProseForReview?.patternText, "Old pattern prose");
  assert.equal(next.directionDescriptor?.optionId, "cross_dominant:logos:pathos");
});

test("WP-087 readiness uses mappingComplete not representative id alone", () => {
  const speech = ALL_RECORDS.find((r) => r.id === "tchart:speech:ethos");
  const letter = ALL_RECORDS.find((r) => r.id === "tchart:letter:ethos");
  const descriptor = buildEvidenceArgumentDirectionDescriptor({
    optionId: "same_appeal:ethos",
    matrixBundle: matrixWithRatings({
      "speech:ethos": { rating: 8, evidenceIds: ["tchart:speech:ethos"] },
      "letter:ethos": { rating: 8, evidenceIds: ["tchart:letter:ethos"] },
    }),
  });
  const ready = evaluateBothWorkReadiness({
    speechSourceText: SPEECH,
    letterSourceText: LETTER,
    speechEvidence: speech,
    letterEvidence: letter,
    selectedOptionId: "same_appeal:ethos",
    directionDescriptor: descriptor,
    patternText: "Both works rely on credibility.",
    thesisText:
      "Although both the speech and the letter build trust, each audience hears ethos differently.",
    proofDirections: ["Speech ethos", "Letter ethos", "Compare"],
  });
  assert.equal(ready.ready, true);

  const incomplete = evaluateBothWorkReadiness({
    speechSourceText: SPEECH,
    letterSourceText: LETTER,
    speechEvidence: speech,
    letterEvidence: letter,
    selectedOptionId: "student_created",
    directionDescriptor: buildEvidenceArgumentDirectionDescriptor({
      optionId: "student_created",
    }),
    patternText: "Something",
    thesisText: "Thesis mentioning speech and letter",
    proofDirections: ["a", "b"],
  });
  assert.equal(incomplete.ready, false);
  assert.ok(
    incomplete.blockers.some((b) => /mapping|direction/i.test(b))
  );
});

test("WP-087 rollout gate (WP-088) opens all canonical frames and mapped custom when rebuilt", () => {
  const prevOverride = process.env.EVIDENCE_ARGUMENT_MODE_OVERRIDE;
  delete process.env.EVIDENCE_ARGUMENT_MODE_OVERRIDE;
  clearEvidenceArgumentModeCache();
  setEvidenceArgumentModeCache("rebuilt");
  assert.equal(isEvidenceToArgumentSliceDevEnabled(), true);

  for (const frame of generateCanonicalDirectionFrames().sameAppeal) {
    assert.equal(
      isEvidenceToArgumentSliceEnabled({ optionId: frame.frameId }),
      true,
      frame.frameId
    );
  }
  for (const frame of generateCanonicalDirectionFrames().crossDominant) {
    assert.equal(
      isEvidenceToArgumentSliceEnabled({ optionId: frame.frameId }),
      true,
      frame.frameId
    );
  }
  assert.equal(
    isEvidenceToArgumentSliceEnabled({ optionId: "student_created" }),
    false
  );
  assert.equal(
    isEvidenceToArgumentSliceEnabled({
      optionId: "student_created",
      customMapping: {
        speechAppeal: "pathos",
        letterAppeal: "logos",
        relationship: "cross_dominant",
        speechEvidenceId: "a",
        letterEvidenceId: "b",
      },
    }),
    true
  );

  setEvidenceArgumentModeCache("legacy");
  assert.equal(
    isEvidenceToArgumentSliceEnabled({
      optionId: WP086_REPRESENTATIVE_OPTION_ID,
    }),
    false
  );
  clearEvidenceArgumentModeCache();
  if (prevOverride == null) delete process.env.EVIDENCE_ARGUMENT_MODE_OVERRIDE;
  else process.env.EVIDENCE_ARGUMENT_MODE_OVERRIDE = prevOverride;
});

test("WP-087 relationship coaching and forbidden student copy", () => {
  const prompt = relationshipCoachingPrompt(WP079_RELATIONSHIP.STRONG_CONTRAST);
  assert.match(prompt, /differently/i);
  assert.deepEqual(
    studentCopyContainsForbiddenTerms(prompt),
    []
  );
  assert.equal(parseWp079OptionId("cross_dominant:pathos:pathos").ok, false);
});

test("WP-087 representative alias still pairs pathos/logos", () => {
  const paired = pairRepresentativeDirectionEvidence({
    evidenceRecords: ALL_RECORDS,
    selectedOptionId: WP086_REPRESENTATIVE_OPTION_ID,
    matrixBundle: matrixWithRatings(),
  });
  assert.equal(paired.ok, true);
  assert.equal(paired.speech.id, "tchart:speech:pathos");
  assert.equal(paired.letter.id, "tchart:letter:logos");
});
