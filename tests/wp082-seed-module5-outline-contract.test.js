/**
 * WP-082 corrective — seed Module 5 outline contract (stored shape Module 5 consumes).
 */
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
  buildWp082Module5Outline,
  assertWp082Module5OutlineContract,
} = require("../lib/dev/seeds/buildWp082Module5Outline.js");
const { MODULE5_STAGE } = require("../lib/module5/module5OutlineStageHelpers.js");

const SEED_BUCKETS = [
  {
    claim: "King builds credibility for each audience in different ways",
    reasoning:
      "King earns trust with Lincoln echoes in the speech and respectful address in the letter.",
    evidenceKeys: ["tchart:speech:ethos", "tchart:letter:ethos"],
    evidenceSnippets: [
      {
        quote: "Five score years ago",
        observation: "Links himself to Lincoln for a public crowd.",
      },
      {
        quote: "My Dear Fellow Clergymen",
        observation: "Speaks as a peer to critical ministers.",
      },
    ],
    paragraphRole: "ethos",
    suggestionId: "seed-b1",
  },
  {
    claim: "King uses emotional appeals to move listeners toward justice",
    reasoning:
      "Emotional images of children and the pain of waiting push each audience to care.",
    evidenceKeys: ["tchart:speech:pathos", "tchart:letter:pathos"],
    evidenceSnippets: [
      {
        quote: "four little children",
        observation: "Creates hope and responsibility for the crowd.",
      },
      {
        quote: "Wait has almost always meant Never",
        observation: "Turns delay into something painful.",
      },
    ],
    paragraphRole: "pathos",
    suggestionId: "seed-b2",
  },
];

describe("WP-082 seed Module 5 outline contract", () => {
  it("builds a CP-F outline Module 5 can hydrate (≥2 body cards + finalize stage)", () => {
    const outline = buildWp082Module5Outline({
      buckets: SEED_BUCKETS,
      wantThirdBucket: false,
      tchartRows: [],
      thesis:
        "King adapts ethos and pathos so each audience can accept his call for justice.",
    });
    const contract = assertWp082Module5OutlineContract(outline);
    assert.equal(contract.ok, true, contract.error);
    assert.equal(outline.body.length, 2);
    assert.equal(outline.body[0].sourceParagraphIndex, 0);
    assert.equal(outline.body[1].sourceParagraphIndex, 1);
    assert.ok(outline.body[0].moveOrder.includes("point"));
    assert.equal(outline.module5Ui.stage, MODULE5_STAGE.FINALIZE);
    assert.match(outline.thesis, /King adapts/);
    assert.ok(outline.conclusion.summary);
    assert.ok(outline.conclusion.finalThought);
  });

  it("fails the contract when legacy SEED_OUTLINE-shaped body is used", () => {
    const legacy = {
      thesis: "A thesis that is long enough for the contract check.",
      body: [
        { bucket: "Legacy card one", points: ["a"] },
        { bucket: "Legacy card two", points: ["b"] },
      ],
      conclusion: {
        summary: "Summary text for conclusion plan.",
        finalThought: "Final thought text for conclusion plan.",
      },
      module5Ui: { stage: MODULE5_STAGE.FINALIZE },
    };
    const contract = assertWp082Module5OutlineContract(legacy);
    assert.equal(contract.ok, false);
    assert.match(contract.error, /sourceParagraphIndex|job|moveOrder/);
  });

  it("seed module wires the contract builder (not a source-text-only claim)", () => {
    const fs = require("fs");
    const path = require("path");
    const seedSrc = fs.readFileSync(
      path.join(__dirname, "../lib/dev/seeds/seedIntroConclusionVerticalSlice.ts"),
      "utf8"
    );
    assert.match(seedSrc, /buildWp082Module5Outline/);
    assert.match(seedSrc, /assertWp082Module5OutlineContract/);
    assert.match(seedSrc, /finalized:\s*true/);
  });
});
