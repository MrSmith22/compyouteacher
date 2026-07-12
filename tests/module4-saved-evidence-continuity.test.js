const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const {
  evidenceIdsMatch,
  resolveSavedEvidenceSlot,
  resolveSavedEvidenceSlots,
  bucketHasQualifyingEvidence,
  continuityEvidenceRowKey,
} = require("../lib/module4/module4EvidenceContinuity.js");
const { tchartCanonicalId } = require("../lib/shared/evidenceIdAliases.js");

const email = "dev-student@localhost";

function clusterRow(type, category, extras = {}) {
  return {
    id: `evidence:tchart:${email}:${type}:${category}`,
    evidenceKey: `evidence:tchart:${email}:${type}:${category}`,
    type,
    category,
    quote: extras.quote || `${type} ${category} quote`,
    observation: extras.observation || `${type} ${category} note`,
    module3Connection: extras.module3Connection || null,
  };
}

describe("module4 saved evidence-key continuity", () => {
  const clusterPool = [
    clusterRow("speech", "ethos", {
      quote: "Five score years ago...",
      module3Connection: {
        valid: true,
        relation: "supports",
        relationLabel: "Supports the idea",
        note: "Speech CONNECT note that is long enough.",
        heading: "Your Module 3 connection",
      },
    }),
    clusterRow("letter", "pathos", {
      quote: 'This "Wait" has almost always meant "Never."',
      module3Connection: {
        valid: true,
        relation: "complicates",
        relationLabel: "Complicates the idea",
        note: "Letter CONNECT note that is long enough.",
        heading: "Your Module 3 connection",
      },
    }),
  ];

  const lookupRows = [
    ...clusterPool,
    clusterRow("speech", "logos", { quote: "Cash a check..." }),
    clusterRow("letter", "logos", { quote: "Injustice anywhere..." }),
  ];

  it("1. exact saved key resolves", () => {
    const slot = resolveSavedEvidenceSlot({
      savedKey: clusterPool[0].evidenceKey,
      clusterPool,
      lookupRows,
    });
    assert.equal(slot.status, "current");
    assert.equal(slot.quote, "Five score years ago...");
    assert.ok(slot.module3Connection);
  });

  it("2. tchart:* resolves to evidence:tchart:{email}:*", () => {
    assert.equal(
      evidenceIdsMatch(
        "tchart:speech:ethos",
        `evidence:tchart:${email}:speech:ethos`
      ),
      true
    );
    const slot = resolveSavedEvidenceSlot({
      savedKey: "tchart:letter:pathos",
      clusterPool,
      lookupRows,
    });
    assert.equal(slot.status, "current");
    assert.match(slot.quote, /Wait/);
  });

  it("3. older artifact aliases / legacy category|type resolve", () => {
    assert.equal(tchartCanonicalId("logos|speech"), "tchart:speech:logos");
    assert.equal(
      evidenceIdsMatch("ethos|speech", `evidence:tchart:${email}:speech:ethos`),
      true
    );
    const slot = resolveSavedEvidenceSlot({
      savedKey: "ethos|speech",
      clusterPool,
      lookupRows,
    });
    assert.equal(slot.status, "current");
  });

  it("4. unambiguous source+appeal fallback resolves", () => {
    const slot = resolveSavedEvidenceSlot({
      savedKey: "pathos|letter",
      clusterPool,
      lookupRows,
    });
    assert.equal(slot.status, "current");
    assert.equal(slot.row.category, "pathos");
  });

  it("5. saved snippet displays when no current artifact row resolves", () => {
    const slot = resolveSavedEvidenceSlot({
      savedKey: "orphan-key-123",
      snippet: {
        quote: "Preserved quote text",
        observation: "Preserved Module 2 note",
      },
      clusterPool,
      lookupRows: clusterPool,
    });
    assert.equal(slot.status, "preserved");
    assert.equal(slot.quote, "Preserved quote text");
    assert.match(slot.compatibilityLabel, /Saved earlier/i);
    assert.equal(slot.countsTowardEvidenceGate, true);
  });

  it("6. preserved outside-cluster evidence is distinguished from current cluster evidence", () => {
    const slot = resolveSavedEvidenceSlot({
      savedKey: "logos|speech",
      snippet: {
        quote: "Cash a check...",
        observation: "Logos note",
      },
      clusterPool,
      lookupRows,
    });
    assert.equal(slot.status, "preserved");
    assert.match(slot.compatibilityLabel, /outside your current working evidence/i);
    assert.equal(slot.module3Connection, null);
  });

  it("7. genuinely missing key with no snippet shows one warning", () => {
    const slots = resolveSavedEvidenceSlots({
      evidenceKeys: ["gone-a", "gone-a"],
      evidenceSnippets: [],
      clusterPool,
      lookupRows: clusterPool,
    });
    assert.equal(slots[0].status, "missing");
    assert.equal(slots[0].suppressDisplay, false);
    assert.equal(slots[1].status, "missing");
    assert.equal(slots[1].suppressDisplay, true);
    assert.equal(
      slots.filter((s) => s.status === "missing" && !s.suppressDisplay).length,
      1
    );
  });

  it("8. duplicate unresolved keys do not create repeated identical warnings", () => {
    const slots = resolveSavedEvidenceSlots({
      evidenceKeys: ["gone-x", "gone-y", "gone-x"],
      evidenceSnippets: [],
      clusterPool,
      lookupRows: clusterPool,
    });
    const visibleMissing = slots.filter(
      (s) => s.status === "missing" && !s.suppressDisplay
    );
    assert.equal(visibleMissing.length, 2);
    assert.equal(
      slots.filter((s) => s.savedKey === "gone-x" && s.suppressDisplay).length,
      1
    );
  });

  it("9. unresolved evidence does not satisfy the continue gate", () => {
    const slots = resolveSavedEvidenceSlots({
      evidenceKeys: ["missing-1", "missing-1"],
      evidenceSnippets: [],
      clusterPool,
      lookupRows: clusterPool,
    });
    assert.equal(bucketHasQualifyingEvidence(slots), false);
  });

  it("10. current valid evidence still shows Module 2 and Module 3 context", () => {
    const slot = resolveSavedEvidenceSlot({
      savedKey: "tchart:letter:pathos",
      clusterPool,
      lookupRows,
    });
    assert.equal(slot.status, "current");
    assert.ok(slot.observation);
    assert.equal(
      slot.module3Connection.relationLabel,
      "Complicates the idea"
    );
    assert.match(slot.module3Connection.note, /Letter CONNECT/);
  });

  it("11. Module 4 seed keys stay cluster-aligned (no logos pipe keys)", () => {
    // Mirrors seedModule4 contract after the repair
    const seedKeys = [
      "tchart:speech:ethos",
      "tchart:letter:ethos",
      "tchart:speech:pathos",
      "tchart:letter:pathos",
    ];
    for (const key of seedKeys) {
      const slot = resolveSavedEvidenceSlot({
        savedKey: key,
        clusterPool: [
          clusterRow("speech", "ethos"),
          clusterRow("letter", "ethos"),
          clusterRow("speech", "pathos"),
          clusterRow("letter", "pathos"),
        ],
        lookupRows: lookupRows,
      });
      assert.equal(slot.status, "current", key);
    }
    assert.equal(
      seedKeys.some((k) => k.includes("logos") || k.includes("|")),
      false
    );
  });

  it("12. Module 5 payload shape remains claim/points from snippets", () => {
    // Continuity resolution must not invent new bucket fields
    const savedBucket = {
      claim: "Paragraph idea",
      reasoning: "Links evidence to thesis.",
      evidenceKeys: ["tchart:speech:ethos"],
      evidenceSnippets: [
        { quote: "Five score", observation: "Note" },
      ],
      paragraphRole: "ethos",
      suggestionId: "seed-b1",
    };
    assert.deepEqual(Object.keys(savedBucket).sort(), [
      "claim",
      "evidenceKeys",
      "evidenceSnippets",
      "paragraphRole",
      "reasoning",
      "suggestionId",
    ]);
  });
});
