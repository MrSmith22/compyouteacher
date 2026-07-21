/**
 * WP-081 — Health diagnostics fixtures (non-mutating).
 */
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
  diagnoseBodyParagraphHealth,
  pickHighestLeverageHealthSignal,
} = require("../lib/artifacts/bodyParagraphHealth.js");

describe("WP-081 body paragraph health", () => {
  it("flags missing evidence", () => {
    const signals = diagnoseBodyParagraphHealth({
      purpose: "A clear paragraph purpose about ethos.",
      reasoning: "This reasoning is long enough to pass the fragment check.",
      evidence: [],
      assembledProse: "Some draft prose about ethos and audience trust.",
    });
    assert.ok(signals.some((s) => s.id === "missing_evidence"));
  });

  it("flags wrong-source evidence when expectedSourceIds are set", () => {
    const signals = diagnoseBodyParagraphHealth({
      purpose: "Purpose about letter ethos work for clergy readers.",
      reasoning: "Reasoning about peer address and credibility for the letter.",
      evidence: [{ quote: "I have a dream", sourceId: "speech" }],
      expectedSourceIds: ["letter"],
      assembledProse: "Draft using a speech quote in a letter-focused paragraph.",
    });
    assert.ok(signals.some((s) => s.id === "wrong_source_evidence"));
  });

  it("flags fragmentary reasoning", () => {
    const signals = diagnoseBodyParagraphHealth({
      purpose: "Purpose text for the paragraph about trust.",
      reasoning: "Too short",
      evidence: [{ quote: "x", sourceId: "letter" }],
      assembledProse: "Draft prose that is present.",
    });
    assert.ok(signals.some((s) => s.id === "fragmentary_reasoning"));
  });

  it("flags duplicate Body Paragraph prose", () => {
    const prose =
      "King builds trust carefully for each audience so justice can be heard clearly today.";
    const signals = diagnoseBodyParagraphHealth({
      purpose: "Purpose about trust building across audiences in both texts.",
      reasoning:
        "Reasoning that explains how credibility supports justice claims.",
      evidence: [{ quote: "My Dear Fellow Clergymen:", sourceId: "letter" }],
      assembledProse: prose,
      otherBodyProse: prose,
    });
    assert.ok(signals.some((s) => s.id === "duplicate_body_prose"));
    const top = pickHighestLeverageHealthSignal(signals);
    assert.equal(top.id, "duplicate_body_prose");
  });

  it("flags stale upstream without erasing prose inputs", () => {
    const prose = "Student-owned prose must remain untouched by diagnostics.";
    const signals = diagnoseBodyParagraphHealth({
      purpose: "Purpose about audience-specific credibility choices.",
      reasoning:
        "Reasoning that connects evidence to the paragraph purpose clearly.",
      evidence: [{ quote: "quote", sourceId: "letter" }],
      assembledProse: prose,
      upstreamStale: true,
    });
    assert.ok(signals.some((s) => s.id === "stale_upstream"));
    assert.equal(
      prose,
      "Student-owned prose must remain untouched by diagnostics."
    );
  });

  it("flags missing explanation after a quotation", () => {
    const signals = diagnoseBodyParagraphHealth({
      purpose: "Purpose about emotional appeals in the public speech.",
      reasoning: "Reasoning about audience effect that is long enough overall.",
      evidence: [{ quote: "I have a dream", sourceId: "speech" }],
      assembledProse: 'King says "I have a dream."',
    });
    assert.ok(signals.some((s) => s.id === "missing_explanation_after_quote"));
  });

  it("coherent plan+draft yields no high-severity errors", () => {
    const signals = diagnoseBodyParagraphHealth({
      purpose: "King builds credibility carefully for clergymen in the letter.",
      reasoning:
        "The respectful greeting frames King as a peer, which helps skeptical readers hear the justice argument.",
      evidence: [
        {
          quote: "My Dear Fellow Clergymen:",
          observation: "Peer address",
          sourceId: "letter",
        },
      ],
      expectedSourceIds: ["letter"],
      assembledProse:
        'King builds credibility carefully for clergymen in the letter. He writes "My Dear Fellow Clergymen:" to greet them as peers. That respectful opening helps skeptical readers hear his justice argument and supports the thesis about audience-specific ethos.',
      thesis:
        "Although both texts argue for justice, King uses emotional appeals more openly in the speech and builds careful credibility in the letter.",
    });
    assert.equal(
      signals.some((s) => s.severity === "error"),
      false
    );
  });
});
