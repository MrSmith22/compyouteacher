/**
 * WP-086 focused tests — evidence/provenance contract, health, readiness, gate, M4 handoff.
 */

import test from "node:test";
import assert from "node:assert/strict";
import {
  WP086_REPRESENTATIVE_OPTION_ID,
  WP086_WALKTHROUGH_RATINGS,
  HEALTH_CODES,
  HEALTH_SEVERITY,
  EVIDENCE_ARGUMENT_STEPS,
  buildSourceRecordSignature,
  findQuoteInSource,
  toEvidenceArgumentRecord,
  buildEvidenceArgumentRecords,
  diagnoseEvidenceHealth,
  diagnoseMatrixCellTraceability,
  pairRepresentativeDirectionEvidence,
  evaluateBothWorkReadiness,
  createEmptyEvidenceArgumentSliceState,
  adaptLegacyModule3Prose,
  assembleModule4HandoffFromSlice,
  buildArgumentMapPresentation,
  partitionDeskAndShelf,
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
import { createEmptyCell } from "../lib/module2/rhetoricalMatrixHelpers.js";
import { resolveProofPlanSlots } from "../lib/module4/module4PointJobHelpers.js";
import { SUCCESS_PROOF_PLAN_LABELS } from "../lib/module3/moduleThreeSuccessHelpers.js";

const SPEECH = `
I have a dream that my four little children will one day live in a nation where they will not be judged by the color of their skin but by the content of their character.
`.trim();

const LETTER = `
An unjust law is a human law that is not rooted in eternal law and natural law. Any law that uplifts human personality is just.
`.trim();

const SPEECH_QUOTE =
  "I have a dream that my four little children will one day live in a nation where they will not be judged by the color of their skin but by the content of their character.";

const LETTER_QUOTE =
  "An unjust law is a human law that is not rooted in eternal law and natural law.";

function strongSpeechRecord() {
  return {
    id: "tchart:speech:pathos",
    sourceType: "speech",
    appeal: "pathos",
    quotation: SPEECH_QUOTE,
    studentObservation: "King uses children to make fairness feel urgent.",
    audienceNote: "A public crowd feels hope and urgency.",
    purposeNote: "The feeling supports a call for justice now.",
    writeCompatible: true,
    legacy: false,
    aliases: ["tchart:speech:pathos"],
  };
}

function strongLetterRecord() {
  return {
    id: "tchart:letter:logos",
    sourceType: "letter",
    appeal: "logos",
    quotation: LETTER_QUOTE,
    studentObservation: "King defines just and unjust laws carefully.",
    audienceNote: "Clergymen are asked to follow careful reasoning.",
    purposeNote: "The logic defends nonviolent action.",
    writeCompatible: true,
    legacy: false,
    aliases: ["tchart:letter:logos"],
  };
}

test("WP-086 walkthrough ratings and representative option id are stable", () => {
  assert.equal(WP086_REPRESENTATIVE_OPTION_ID, "cross_dominant:pathos:logos");
  assert.deepEqual([...WP086_WALKTHROUGH_RATINGS], [6, 8, 10, 4, 4, 9]);
  assert.ok(EVIDENCE_ARGUMENT_STEPS.length >= 8);
});

test("WP-086 source signature changes when working text changes", () => {
  const a = buildSourceRecordSignature({ text: SPEECH });
  const b = buildSourceRecordSignature({ text: SPEECH + " x" });
  assert.ok(a);
  assert.notEqual(a, b);
});

test("WP-086 findQuoteInSource never invents context for missing quotes", () => {
  const ok = findQuoteInSource(SPEECH_QUOTE, SPEECH);
  assert.equal(ok.found, true);
  assert.ok(ok.contextSnippet.includes("four little children"));
  const miss = findQuoteInSource("not in the speech at all", SPEECH);
  assert.equal(miss.found, false);
  assert.equal(miss.contextSnippet, "");
});

test("WP-086 normalizes evidence with provenance fields", () => {
  const records = buildEvidenceArgumentRecords({
    tchartRows: [
      {
        type: "speech",
        category: "pathos",
        quote: SPEECH_QUOTE,
        observation: `Main note\n---AUDIENCE---\nCrowd feels hope\n---PURPOSE---\nUrges justice`,
      },
    ],
    speechText: SPEECH,
    letterText: LETTER,
    selectedDirectionId: WP086_REPRESENTATIVE_OPTION_ID,
  });
  assert.equal(records.length, 1);
  assert.equal(records[0].sourceKind, "speech");
  assert.equal(records[0].rhetoricalChoice, "pathos");
  assert.equal(records[0].quoteFoundInSource, true);
  assert.equal(records[0].audienceEffect, "Crowd feels hope");
  assert.equal(records[0].purposeContribution, "Urges justice");
  assert.equal(records[0].selectedDirectionId, WP086_REPRESENTATIVE_OPTION_ID);
});

test("WP-086 health: wrong source, missing quote, missing effect/purpose", () => {
  const wrong = toEvidenceArgumentRecord(
    {
      ...strongSpeechRecord(),
      quotation: LETTER_QUOTE,
    },
    { speechText: SPEECH, letterText: LETTER }
  );
  const wrongFindings = diagnoseEvidenceHealth(wrong, {
    speechText: SPEECH,
    letterText: LETTER,
    expectedSourceKind: "speech",
  });
  assert.ok(
    wrongFindings.some((f) => f.code === HEALTH_CODES.QUOTE_NOT_IN_SOURCE)
  );

  const bare = toEvidenceArgumentRecord(
    {
      id: "tchart:speech:pathos",
      sourceType: "speech",
      appeal: "pathos",
      quotation: "",
      studentObservation: "note only",
      audienceNote: "",
      purposeNote: "",
      writeCompatible: true,
    },
    { speechText: SPEECH, letterText: LETTER }
  );
  const bareFindings = diagnoseEvidenceHealth(bare, {
    speechText: SPEECH,
    letterText: LETTER,
  });
  assert.ok(
    bareFindings.some((f) => f.code === HEALTH_CODES.MISSING_QUOTE_AND_LOCATOR)
  );
  assert.ok(bareFindings.some((f) => f.code === HEALTH_CODES.MISSING_EFFECT));
  assert.ok(bareFindings.some((f) => f.code === HEALTH_CODES.MISSING_PURPOSE));
});

test("WP-086 matrix blank vs explicit zero", () => {
  const blank = createEmptyCell("speech", "pathos");
  const blankFindings = diagnoseMatrixCellTraceability(blank, []);
  assert.ok(
    blankFindings.some((f) => f.code === HEALTH_CODES.BLANK_VS_EXPLICIT_ZERO)
  );

  const zeroNoFlag = { ...createEmptyCell("speech", "pathos"), rating: 0 };
  assert.ok(
    diagnoseMatrixCellTraceability(zeroNoFlag, []).some(
      (f) => f.code === HEALTH_CODES.BLANK_VS_EXPLICIT_ZERO
    )
  );

  const zeroOk = {
    ...createEmptyCell("speech", "pathos"),
    rating: 0,
    explicitNoEvidence: true,
    functionNote: "I judged this appeal is not meaningfully used here.",
  };
  assert.equal(diagnoseMatrixCellTraceability(zeroOk, []).length, 0);

  const nonzeroDetached = {
    ...createEmptyCell("speech", "pathos"),
    rating: 10,
    evidenceIds: ["tchart:speech:pathos"],
  };
  assert.ok(
    diagnoseMatrixCellTraceability(nonzeroDetached, []).some(
      (f) => f.code === HEALTH_CODES.DETACHED_ID
    )
  );
});

test("WP-086 pairs speech pathos and letter logos for representative direction", () => {
  const speech = toEvidenceArgumentRecord(strongSpeechRecord(), {
    speechText: SPEECH,
    letterText: LETTER,
  });
  const letter = toEvidenceArgumentRecord(strongLetterRecord(), {
    speechText: SPEECH,
    letterText: LETTER,
  });
  const paired = pairRepresentativeDirectionEvidence({
    evidenceRecords: [speech, letter],
    selectedOptionId: WP086_REPRESENTATIVE_OPTION_ID,
    matrixBundle: {
      cells: [
        {
          sourceType: "speech",
          appeal: "pathos",
          evidenceIds: ["tchart:speech:pathos"],
        },
        {
          sourceType: "letter",
          appeal: "logos",
          evidenceIds: ["tchart:letter:logos"],
        },
      ],
    },
  });
  assert.equal(paired.ok, true);
  assert.equal(paired.speech.id, "tchart:speech:pathos");
  assert.equal(paired.letter.id, "tchart:letter:logos");
});

test("WP-086 both-work readiness refuses one-work and length-only thesis", () => {
  const speech = toEvidenceArgumentRecord(strongSpeechRecord(), {
    speechText: SPEECH,
    letterText: LETTER,
  });
  const letter = toEvidenceArgumentRecord(strongLetterRecord(), {
    speechText: SPEECH,
    letterText: LETTER,
  });

  const weak = evaluateBothWorkReadiness({
    speechSourceText: SPEECH,
    letterSourceText: LETTER,
    speechEvidence: speech,
    letterEvidence: null,
    selectedOptionId: WP086_REPRESENTATIVE_OPTION_ID,
    patternText: "Different leading appeals",
    thesisText: "King uses emotion.",
    proofDirections: ["a", "b"],
  });
  assert.equal(weak.ready, false);

  const ready = evaluateBothWorkReadiness({
    speechSourceText: SPEECH,
    letterSourceText: LETTER,
    speechEvidence: speech,
    letterEvidence: letter,
    selectedOptionId: WP086_REPRESENTATIVE_OPTION_ID,
    patternText:
      "The speech leads with feeling while the letter leads with careful reasoning.",
    thesisText:
      "Although both the speech and the letter argue for justice, King uses emotional appeals more openly in the speech and careful logic in the letter so each audience will listen.",
    proofDirections: [
      "Show how speech pathos moves the public.",
      "Show how letter logos answers the clergymen.",
      "Explain why the difference fits each audience.",
    ],
  });
  assert.equal(ready.ready, true);
});

test("WP-086 legacy claim/thesis adaptation preserves prose without overwrite", () => {
  const { slice, confidence } = adaptLegacyModule3Prose({
    claimText: "Old working claim about both works.",
    thesisText:
      "Although both the speech and the letter argue for justice, the leading appeals differ.",
    proofPlan: ["Speech proof", "Letter proof", "Comparison"],
    patternText: "Different leading appeals",
  });
  assert.equal(confidence.thesis, "preserved_with_claim_review");
  assert.match(slice.thesisText, /speech/);
  assert.equal(slice.legacyClaimForReview, "Old working claim about both works.");
  assert.equal(slice.proofDirections[0].text, "Speech proof");

  const protectedSlice = adaptLegacyModule3Prose({
    thesisText: "Should not replace",
    existingSlice: {
      ...createEmptyEvidenceArgumentSliceState(),
      thesisText: "Student already staged this thesis for both speech and letter.",
    },
  });
  assert.match(protectedSlice.slice.thesisText, /already staged/);
});

test("WP-086 Module 4 handoff keeps proofPlan strings and suggestion ids", () => {
  const handoff = assembleModule4HandoffFromSlice({
    ...createEmptyEvidenceArgumentSliceState(),
    thesisText:
      "Although both the speech and the letter argue for justice, leading appeals differ by audience.",
    proofDirections: [
      { role: "speech", text: "Speech pathos proof", evidenceId: "tchart:speech:pathos" },
      { role: "letter", text: "Letter logos proof", evidenceId: "tchart:letter:logos" },
      { role: "comparison", text: "Why the difference matters", evidenceId: null },
    ],
  });
  assert.match(handoff.thesis, /speech/);
  assert.equal(handoff.proofPlan[0], "Speech pathos proof");
  assert.equal(handoff.structuredProofLinks[0].evidenceId, "tchart:speech:pathos");

  const thesisResolved = handoff.thesis;
  assert.equal(thesisResolved, handoff.thesis);

  const slots = resolveProofPlanSlots(handoff.proofPlan);
  assert.equal(slots[0].suggestionId, "proof-0");
  assert.equal(slots[0].roleLabel, SUCCESS_PROOF_PLAN_LABELS[0]);
  assert.equal(slots[1].suggestionId, "proof-1");
  assert.equal(slots[2].suggestionId, "proof-2");
});

test("WP-086 desk/shelf partition and forbidden student copy terms", () => {
  const strong = toEvidenceArgumentRecord(strongSpeechRecord(), {
    speechText: SPEECH,
    letterText: LETTER,
  });
  const fragment = toEvidenceArgumentRecord(
    {
      id: "guided:abc",
      sourceType: "speech",
      appeal: "pathos",
      quotation: "",
      studentObservation: "",
      audienceNote: "",
      purposeNote: "",
      legacy: true,
      writeCompatible: false,
    },
    { speechText: SPEECH, letterText: LETTER }
  );
  const { desk, shelf } = partitionDeskAndShelf([strong, fragment], {
    speechText: SPEECH,
    letterText: LETTER,
  });
  assert.equal(desk.length, 1);
  assert.equal(shelf.length, 1);
  assert.deepEqual(studentCopyContainsForbiddenTerms("Check the provenance signature"), [
    "provenance",
    "signature",
  ]);
  assert.deepEqual(
    studentCopyContainsForbiddenTerms("What may this do for the audience?"),
    []
  );
});

test("WP-086 rollout gate (WP-088) opens representative and other canonical ids when mode is rebuilt", () => {
  const prevOverride = process.env.EVIDENCE_ARGUMENT_MODE_OVERRIDE;
  delete process.env.EVIDENCE_ARGUMENT_MODE_OVERRIDE;
  clearEvidenceArgumentModeCache();
  setEvidenceArgumentModeCache("rebuilt");
  assert.equal(isEvidenceToArgumentSliceDevEnabled(), true);
  assert.equal(
    isEvidenceToArgumentSliceEnabled({
      optionId: WP086_REPRESENTATIVE_OPTION_ID,
    }),
    true
  );
  // WP-087: same_appeal is no longer blocked by the representative-only gate.
  assert.equal(
    isEvidenceToArgumentSliceEnabled({ optionId: "same_appeal:ethos" }),
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

test("WP-086 argument map and no character-threshold auto-advance contract", () => {
  const map = buildArgumentMapPresentation({
    selectedDirectionLabel: "Speech pathos with letter logos",
    speechEvidence: toEvidenceArgumentRecord(strongSpeechRecord(), {
      speechText: SPEECH,
      letterText: LETTER,
    }),
    letterEvidence: toEvidenceArgumentRecord(strongLetterRecord(), {
      speechText: SPEECH,
      letterText: LETTER,
    }),
    thesisText: "Both speech and letter prove justice with different leading appeals.",
    proofDirections: ["Speech", "Letter", "Compare"],
  });
  assert.ok(map.speechProof.quote.includes("dream"));
  assert.ok(map.letterProof.quote.includes("unjust law"));
  // Staged steps advance only via explicit Continue — no min-length auto step change API exists.
  assert.equal(
    typeof createEmptyEvidenceArgumentSliceState().currentStep,
    "string"
  );
  assert.doesNotMatch(
    JSON.stringify(EVIDENCE_ARGUMENT_STEPS),
    /autoAdvance|characterThreshold|minChars.*advance/i
  );
});
