const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const {
  CONNECT_NOTE_MINIMUM,
  isValidExplainedConnection,
} = require("../lib/module3/connectEvidenceHelpers.js");
const {
  normalizeEvidenceMap,
  resolveNextEvidenceMap,
  evidenceMapHasContent,
  buildIdeaEvidenceState,
} = require("../lib/module3/ideaEvidenceMapHelpers.js");
const {
  deriveValidModule3ConnectionsByRowKey,
  enrichEvidencePoolWithModule3Connections,
  resolveModule4EvidencePoolRows,
  continuityEvidenceRowKey,
} = require("../lib/module4/module4EvidenceContinuity.js");

// Seed note strings mirrored from seedContent (avoid requiring .ts in node:test).
const SEED_CONNECT_NOTES = {
  "tchart:speech:ethos":
    "This speech opening links King to Lincoln and shared American ideals so the public trusts his call for justice.",
  "tchart:letter:ethos":
    "Addressing the clergymen as peers shows King earning trust with a careful, respectful religious voice.",
  "tchart:speech:pathos":
    "The dream for children makes fairness feel urgent and hopeful for a public audience.",
  "tchart:letter:pathos":
    "Saying Wait has almost always meant Never shows how delay itself becomes part of the injustice for his readers.",
};

const speechNote = SEED_CONNECT_NOTES["tchart:speech:ethos"];
const letterNote = SEED_CONNECT_NOTES["tchart:letter:pathos"];

function validMap() {
  return {
    "tchart:speech:ethos": {
      selected: true,
      relation: "supports",
      note: speechNote,
    },
    "tchart:letter:pathos": {
      selected: true,
      relation: "complicates",
      note: letterNote,
    },
    "tchart:letter:ethos": {
      selected: true,
      relation: "supports",
      note: SEED_CONNECT_NOTES["tchart:letter:ethos"],
    },
    "tchart:speech:pathos": {
      selected: true,
      relation: "complicates",
      note: SEED_CONNECT_NOTES["tchart:speech:pathos"],
    },
  };
}

describe("module3 idea CONNECT persistence", () => {
  it("1. CONNECT save with valid notes survives a fresh-read style rebuild", () => {
    const saved = buildIdeaEvidenceState(
      {
        statement: "King adapts rhetorical appeals for each audience.",
        whyMatters: "Audience and purpose shape the choices.",
        clusterId: "seed-cluster-1",
        patternId: "seed-pattern-1",
        evidenceMap: validMap(),
      },
      null
    );

    const fresh = normalizeEvidenceMap(saved.evidenceMap);
    assert.equal(fresh["tchart:speech:ethos"].note, speechNote);
    assert.equal(fresh["tchart:letter:pathos"].note, letterNote);
    assert.ok(isValidExplainedConnection(fresh["tchart:speech:ethos"]));
    assert.ok(isValidExplainedConnection(fresh["tchart:letter:pathos"]));
    assert.ok(speechNote.trim().length >= CONNECT_NOTE_MINIMUM);
  });

  it("2. getIdeaArtifact-shaped row keeps exact notes after normalize", () => {
    const idea = buildIdeaEvidenceState(
      {
        statement: "Idea",
        whyMatters: "Why",
        clusterId: "seed-cluster-1",
        evidenceMap: validMap(),
      },
      null
    );

    const artifactShape = {
      id: "idea:dev-student@localhost",
      evidenceMap: idea.evidenceMap ?? {},
      clusterId: idea.clusterId ?? null,
    };

    assert.equal(
      artifactShape.evidenceMap["tchart:speech:ethos"].note,
      speechNote
    );
    assert.equal(artifactShape.clusterId, "seed-cluster-1");
  });

  it("3. Module 4 receives the same map and attaches notes through aliases", () => {
    const evidenceMap = validMap();
    const clusterEvidenceIds = Object.keys(evidenceMap);
    const email = "dev-student@localhost";

    const pool = resolveModule4EvidencePoolRows({
      artifactRows: clusterEvidenceIds.map((id) => {
        const [, type, category] = id.split(":");
        return {
          id: `evidence:tchart:${email}:${type}:${category}`,
          evidenceKey: `evidence:tchart:${email}:${type}:${category}`,
          type,
          category,
          quote: `${type} ${category}`,
          observation: "Module 2 note",
        };
      }),
      clusterEvidenceIds,
      legacyRows: [],
    });

    assert.equal(pool.length, 4);

    const enriched = enrichEvidencePoolWithModule3Connections(
      pool,
      deriveValidModule3ConnectionsByRowKey({
        evidenceMap,
        clusterEvidenceIds,
        evidencePool: pool,
      })
    );

    const speech = enriched.find(
      (r) => r.type === "speech" && r.category === "ethos"
    );
    const letter = enriched.find(
      (r) => r.type === "letter" && r.category === "pathos"
    );

    assert.equal(speech.module3Connection.note, speechNote);
    assert.equal(speech.module3Connection.relationLabel, "Supports the idea");
    assert.equal(letter.module3Connection.note, letterNote);
    assert.equal(
      letter.module3Connection.relationLabel,
      "Complicates the idea"
    );
    assert.ok(continuityEvidenceRowKey(speech).includes("speech:ethos"));
  });

  it("4. idea updates that omit evidenceMap preserve notes (CLAIM/THESIS do not touch idea map)", () => {
    const withNotes = buildIdeaEvidenceState(
      {
        statement: "Idea",
        whyMatters: "Why",
        clusterId: "seed-cluster-1",
        evidenceMap: validMap(),
      },
      null
    );

    const afterTextOnlyUpdate = buildIdeaEvidenceState(
      {
        statement: "Updated idea statement only",
        clusterId: "seed-cluster-1",
      },
      withNotes
    );

    assert.equal(
      afterTextOnlyUpdate.evidenceMap["tchart:speech:ethos"].note,
      speechNote
    );
    assert.equal(
      afterTextOnlyUpdate.evidenceMap["tchart:letter:pathos"].note,
      letterNote
    );
  });

  it("5. empty evidenceMap payloads do not erase saved CONNECT notes", () => {
    const withNotes = buildIdeaEvidenceState(
      {
        statement: "Idea",
        whyMatters: "Why",
        evidenceMap: validMap(),
      },
      null
    );

    const wipedAttempt = buildIdeaEvidenceState(
      {
        statement: "Idea",
        whyMatters: "Why",
        evidenceMap: {},
      },
      withNotes
    );

    assert.ok(evidenceMapHasContent(wipedAttempt.evidenceMap));
    assert.equal(
      wipedAttempt.evidenceMap["tchart:speech:ethos"].note,
      speechNote
    );
    assert.deepEqual(
      resolveNextEvidenceMap(validMap(), {}),
      normalizeEvidenceMap(validMap())
    );
  });

  it("6. cluster association remains on the idea row", () => {
    const idea = buildIdeaEvidenceState(
      {
        statement: "Idea",
        whyMatters: "Why",
        clusterId: "seed-cluster-1",
        patternId: "seed-pattern-1",
        evidenceMap: validMap(),
      },
      null
    );
    assert.equal(idea.clusterId, "seed-cluster-1");
    assert.equal(idea.patternId, "seed-pattern-1");
  });

  it("7. Module 4 attaches Speech ethos and Letter pathos through tchart aliases", () => {
    const email = "dev-student@localhost";
    const evidenceMap = {
      "tchart:speech:ethos": validMap()["tchart:speech:ethos"],
      "tchart:letter:pathos": validMap()["tchart:letter:pathos"],
    };
    const clusterEvidenceIds = [
      "tchart:speech:ethos",
      "tchart:letter:ethos",
      "tchart:speech:pathos",
      "tchart:letter:pathos",
    ];

    const pool = resolveModule4EvidencePoolRows({
      artifactRows: clusterEvidenceIds.map((id) => {
        const [, type, category] = id.split(":");
        return {
          evidenceKey: `evidence:tchart:${email}:${type}:${category}`,
          type,
          category,
          quote: id,
          observation: "obs",
        };
      }),
      clusterEvidenceIds,
      legacyRows: [],
    });

    const enriched = enrichEvidencePoolWithModule3Connections(
      pool,
      deriveValidModule3ConnectionsByRowKey({
        evidenceMap,
        clusterEvidenceIds,
        evidencePool: pool,
      })
    );

    const speech = enriched.find(
      (r) => r.type === "speech" && r.category === "ethos"
    );
    const letter = enriched.find(
      (r) => r.type === "letter" && r.category === "pathos"
    );
    const other = enriched.find(
      (r) => r.type === "speech" && r.category === "pathos"
    );

    assert.ok(speech.module3Connection);
    assert.ok(letter.module3Connection);
    assert.equal(other.module3Connection, null);
  });

  it("8. invalid or short notes remain excluded from Module 4 presentation", () => {
    const evidenceMap = {
      "tchart:speech:ethos": {
        selected: true,
        relation: "supports",
        note: "too short",
      },
      "tchart:letter:pathos": {
        selected: true,
        relation: "supports",
        note: letterNote,
      },
    };
    const clusterEvidenceIds = [
      "tchart:speech:ethos",
      "tchart:letter:pathos",
    ];
    const email = "dev-student@localhost";
    const pool = resolveModule4EvidencePoolRows({
      artifactRows: clusterEvidenceIds.map((id) => {
        const [, type, category] = id.split(":");
        return {
          evidenceKey: `evidence:tchart:${email}:${type}:${category}`,
          type,
          category,
          quote: id,
          observation: "obs",
        };
      }),
      clusterEvidenceIds,
      legacyRows: [],
    });
    const enriched = enrichEvidencePoolWithModule3Connections(
      pool,
      deriveValidModule3ConnectionsByRowKey({
        evidenceMap,
        clusterEvidenceIds,
        evidencePool: pool,
      })
    );

    assert.equal(
      enriched.find((r) => r.category === "ethos").module3Connection,
      null
    );
    assert.equal(
      enriched.find((r) => r.category === "pathos").module3Connection.note,
      letterNote
    );
  });

  it("seed CONNECT notes meet the shared minimum and cover both key quotes", () => {
    for (const note of Object.values(SEED_CONNECT_NOTES)) {
      assert.ok(note.trim().length >= CONNECT_NOTE_MINIMUM);
    }
    assert.match(speechNote, /Lincoln|American|trust/i);
    assert.match(letterNote, /Wait|Never|delay|injustice/i);
  });
});
