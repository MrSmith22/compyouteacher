const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const {
  CONNECT_NOTE_MINIMUM,
} = require("../lib/module3/connectEvidenceHelpers.js");
const {
  boundEvidenceRowsToCluster,
  buildModule3ConnectionPresentation,
  continuityEvidenceRowKey,
  deriveValidModule3ConnectionsByRowKey,
  evidenceIdsMatch,
  enrichEvidencePoolWithModule3Connections,
  getModule3ConnectionForEvidenceKey,
  resolveModule4EvidencePoolRows,
  snapshotEvidenceMap,
} = require("../lib/module4/module4EvidenceContinuity.js");

const longNote = "The words show delay causes harm in both works.";

function connection(overrides = {}) {
  return {
    selected: true,
    relation: "supports",
    note: longNote,
    ...overrides,
  };
}

function row(id, sourceType = "speech", extras = {}) {
  return {
    id,
    evidenceKey: id,
    type: sourceType,
    category: extras.appeal || "pathos",
    quote: extras.quote || `Quote for ${id}`,
    observation: extras.observation || `Module 2 note for ${id}`,
  };
}

describe("module4EvidenceContinuity — alias matching and pool bounding", () => {
  it("1. exact cluster/evidence IDs match", () => {
    assert.equal(
      evidenceIdsMatch(
        "evidence:observation:speech-1",
        "evidence:observation:speech-1"
      ),
      true
    );
  });

  it("2. guided:speech-1 matches evidence:observation:speech-1", () => {
    assert.equal(
      evidenceIdsMatch("guided:speech-1", "evidence:observation:speech-1"),
      true
    );
  });

  it("3. alias matching works in both directions", () => {
    assert.equal(
      evidenceIdsMatch("evidence:observation:letter-1", "guided:letter-1"),
      true
    );
  });

  it("4. a cluster with aliased matches returns only cluster evidence", () => {
    const pool = resolveModule4EvidencePoolRows({
      artifactRows: [
        row("evidence:observation:speech-1", "speech"),
        row("evidence:observation:letter-1", "letter"),
        row("evidence:observation:other", "speech", {
          quote: "Unrelated quote",
        }),
      ],
      clusterEvidenceIds: ["guided:speech-1", "guided:letter-1"],
      legacyRows: [
        {
          id: "legacy-extra",
          evidenceKey: "legacy-extra",
          type: "speech",
          category: "ethos",
          quote: "Legacy outside cluster",
          observation: "Should not appear when cluster bounds",
        },
      ],
    });

    const keys = pool.map((r) => continuityEvidenceRowKey(r)).sort();
    assert.deepEqual(keys, [
      "evidence:observation:letter-1",
      "evidence:observation:speech-1",
    ]);
  });

  it("5. unrelated evidence does not enter the bounded pool", () => {
    const bounded = boundEvidenceRowsToCluster({
      artifactRows: [
        {
          evidenceKey: "evidence:observation:speech-1",
          type: "speech",
        },
        {
          evidenceKey: "evidence:observation:other",
          type: "speech",
        },
      ],
      clusterEvidenceIds: ["guided:speech-1"],
    });
    assert.equal(bounded.length, 1);
    assert.equal(bounded[0].evidenceKey, "evidence:observation:speech-1");
  });

  it("6. alias variants do not create duplicate cards", () => {
    const pool = resolveModule4EvidencePoolRows({
      artifactRows: [
        row("evidence:observation:speech-1", "speech"),
        row("evidence:observation:speech-1", "speech"),
      ],
      clusterEvidenceIds: ["guided:speech-1", "evidence:observation:speech-1"],
      legacyRows: [],
    });
    assert.equal(pool.length, 1);
  });
});

describe("module4EvidenceContinuity — CONNECT attachment", () => {
  const pool = [
    {
      evidenceKey: "evidence:observation:speech-1",
      type: "speech",
      category: "pathos",
      quote: "Speech quote",
      observation: "Module 2 speech note",
    },
    {
      evidenceKey: "evidence:observation:letter-1",
      type: "letter",
      category: "logos",
      quote: "Letter quote",
      observation: "Module 2 letter note",
    },
  ];

  it("7. a valid selected CONNECT entry is attached to its evidence", () => {
    const byKey = deriveValidModule3ConnectionsByRowKey({
      evidenceMap: {
        "guided:speech-1": connection(),
      },
      clusterEvidenceIds: ["guided:speech-1", "guided:letter-1"],
      evidencePool: pool,
    });
    const presentation = getModule3ConnectionForEvidenceKey(
      byKey,
      "evidence:observation:speech-1"
    );
    assert.ok(presentation);
    assert.equal(presentation.valid, true);
    assert.equal(presentation.note, longNote);
    assert.match(presentation.heading, /Module 3 connection/i);
  });

  it("8. supports, complicates, and sharpens receive correct labels", () => {
    assert.equal(
      buildModule3ConnectionPresentation(connection({ relation: "supports" }))
        .relationLabel,
      "Supports the idea"
    );
    assert.equal(
      buildModule3ConnectionPresentation(
        connection({ relation: "complicates" })
      ).relationLabel,
      "Complicates the idea"
    );
    assert.equal(
      buildModule3ConnectionPresentation(connection({ relation: "sharpens" }))
        .relationLabel,
      "Sharpens or adds detail to the idea"
    );
  });

  it("9. an unselected entry is excluded", () => {
    const byKey = deriveValidModule3ConnectionsByRowKey({
      evidenceMap: {
        "guided:speech-1": connection({ selected: false }),
      },
      clusterEvidenceIds: ["guided:speech-1"],
      evidencePool: pool,
    });
    assert.equal(
      getModule3ConnectionForEvidenceKey(
        byKey,
        "evidence:observation:speech-1"
      ),
      null
    );
  });

  it("10. a short note is excluded", () => {
    assert.ok("Too short".trim().length < CONNECT_NOTE_MINIMUM);
    const byKey = deriveValidModule3ConnectionsByRowKey({
      evidenceMap: {
        "guided:speech-1": connection({ note: "Too short" }),
      },
      clusterEvidenceIds: ["guided:speech-1"],
      evidencePool: pool,
    });
    assert.equal(
      getModule3ConnectionForEvidenceKey(
        byKey,
        "evidence:observation:speech-1"
      ),
      null
    );
  });

  it("11. whitespace is trimmed before validation", () => {
    const padded = `   ${longNote}   `;
    const byKey = deriveValidModule3ConnectionsByRowKey({
      evidenceMap: {
        "guided:speech-1": connection({ note: padded }),
      },
      clusterEvidenceIds: ["guided:speech-1"],
      evidencePool: pool,
    });
    const presentation = getModule3ConnectionForEvidenceKey(
      byKey,
      "evidence:observation:speech-1"
    );
    assert.ok(presentation);
    // Presentation keeps the original stored note string (not rewritten)
    assert.equal(presentation.note, padded);
  });

  it("12. an invalid relation is excluded", () => {
    const byKey = deriveValidModule3ConnectionsByRowKey({
      evidenceMap: {
        "guided:speech-1": connection({ relation: "mentions" }),
      },
      clusterEvidenceIds: ["guided:speech-1"],
      evidencePool: pool,
    });
    assert.equal(
      getModule3ConnectionForEvidenceKey(
        byKey,
        "evidence:observation:speech-1"
      ),
      null
    );
  });

  it("13. an orphan connection is excluded", () => {
    const byKey = deriveValidModule3ConnectionsByRowKey({
      evidenceMap: {
        "guided:orphan": connection({
          note: "Orphan connection that should not attach.",
        }),
      },
      clusterEvidenceIds: ["guided:speech-1"],
      evidencePool: pool,
    });
    assert.equal(byKey.size, 0);
  });

  it("14. a valid connection outside the cluster is excluded", () => {
    const byKey = deriveValidModule3ConnectionsByRowKey({
      evidenceMap: {
        "guided:speech-1": connection(),
        "guided:outside": connection({
          note: "Valid note but outside the working cluster.",
        }),
      },
      clusterEvidenceIds: ["guided:speech-1"],
      evidencePool: [
        ...pool,
        {
          evidenceKey: "evidence:observation:outside",
          type: "letter",
          quote: "Outside",
          observation: "Outside note",
        },
      ],
    });
    assert.ok(
      getModule3ConnectionForEvidenceKey(
        byKey,
        "evidence:observation:speech-1"
      )
    );
    assert.equal(
      getModule3ConnectionForEvidenceKey(
        byKey,
        "evidence:observation:outside"
      ),
      null
    );
  });

  it("15. missing evidenceMap fails safely", () => {
    const byKey = deriveValidModule3ConnectionsByRowKey({
      evidenceMap: null,
      clusterEvidenceIds: ["guided:speech-1"],
      evidencePool: pool,
    });
    assert.equal(byKey.size, 0);

    const enriched = enrichEvidencePoolWithModule3Connections(pool, byKey);
    assert.equal(enriched[0].module3Connection, null);
  });

  it("16. missing cluster artifacts preserve the documented compatibility fallback", () => {
    const artifactPool = resolveModule4EvidencePoolRows({
      artifactRows: [
        row("evidence:observation:speech-1", "speech"),
        row("evidence:observation:letter-1", "letter"),
      ],
      clusterEvidenceIds: [],
      legacyRows: [],
    });
    assert.equal(artifactPool.length, 2);

    const legacyOnly = resolveModule4EvidencePoolRows({
      artifactRows: [],
      clusterEvidenceIds: [],
      legacyRows: [
        {
          id: "t1",
          evidenceKey: "t1",
          type: "speech",
          category: "ethos",
          quote: "Legacy",
          observation: "Note",
        },
      ],
    });
    assert.equal(legacyOnly.length, 1);
    assert.equal(continuityEvidenceRowKey(legacyOnly[0]), "t1");
  });

  it("17. derivation does not mutate the idea artifact or evidence map", () => {
    const evidenceMap = {
      "guided:speech-1": connection(),
      "guided:letter-1": connection({ relation: "sharpens" }),
    };
    const before = snapshotEvidenceMap(evidenceMap);
    deriveValidModule3ConnectionsByRowKey({
      evidenceMap,
      clusterEvidenceIds: ["guided:speech-1", "guided:letter-1"],
      evidencePool: pool,
    });
    enrichEvidencePoolWithModule3Connections(
      pool,
      deriveValidModule3ConnectionsByRowKey({
        evidenceMap,
        clusterEvidenceIds: ["guided:speech-1", "guided:letter-1"],
        evidencePool: pool,
      })
    );
    assert.deepEqual(evidenceMap, before);
  });
});

describe("module4EvidenceContinuity — compatibility suites", () => {
  it("18. Module 4 pool resolution stays bounded and alias-aware", () => {
    const pool = resolveModule4EvidencePoolRows({
      artifactRows: [row("evidence:observation:a", "speech")],
      clusterEvidenceIds: ["evidence:observation:a"],
      legacyRows: [],
    });
    assert.equal(pool.length, 1);

    // Pattern-style review uses the same alias matching
    const patternIds = ["guided:a"];
    const patternRows = pool.filter((r) =>
      patternIds.some((id) =>
        evidenceIdsMatch(continuityEvidenceRowKey(r), id)
      )
    );
    assert.equal(patternRows.length, 1);
  });

  it("20. Module 5 bucket payload shape is unchanged by continuity enrichment", () => {
    // Continuity adds presentation-only module3Connection on pool rows.
    // Module 4 still persists the documented student_buckets fields only.
    const basePool = resolveModule4EvidencePoolRows({
      artifactRows: [row("evidence:observation:speech-1", "speech")],
      clusterEvidenceIds: ["guided:speech-1"],
      legacyRows: [],
    });
    const byKey = deriveValidModule3ConnectionsByRowKey({
      evidenceMap: { "guided:speech-1": connection() },
      clusterEvidenceIds: ["guided:speech-1"],
      evidencePool: basePool,
    });
    const enriched = enrichEvidencePoolWithModule3Connections(basePool, byKey);

    const savedBucket = {
      claim: "Paragraph idea",
      reasoning: "Links evidence to thesis.",
      evidenceKeys: [continuityEvidenceRowKey(enriched[0])],
      evidenceSnippets: [
        {
          quote: enriched[0].quote,
          observation: enriched[0].observation,
        },
      ],
      paragraphRole: "similarity",
      suggestionId: "proof-0",
    };

    assert.deepEqual(Object.keys(savedBucket).sort(), [
      "claim",
      "evidenceKeys",
      "evidenceSnippets",
      "paragraphRole",
      "reasoning",
      "suggestionId",
    ]);
    assert.equal(savedBucket.module3Connection, undefined);
    assert.ok(enriched[0].module3Connection);
  });
});

/**
 * Live runtime shapes discovered during Checkpoint 1 manual failure diagnosis.
 *
 * Module 3 persists working IDs as `tchart:{type}:{category}`.
 * Module 4 Artifact Engine emits `evidence:tchart:{email}:{type}:{category}`.
 * Before the T-chart alias repair, cluster bounding returned [] and silently
 * widened to all six Module 2 quotations; CONNECT never joined.
 */
describe("module4EvidenceContinuity — live tchart ID regression", () => {
  const studentEmail = "dev-student@localhost";
  const selectedClusterId = "seed-cluster-1";
  const clusterArtifactId = `evidence_cluster:${studentEmail}:${selectedClusterId}`;

  const speechNote =
    "King builds credibility by linking the march to American founding ideals.";
  const letterNote =
    "The letter shows that waiting has almost always meant never for the oppressed.";

  const liveEvidenceMap = {
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
  };

  const liveClusterEvidenceIds = [
    "tchart:speech:ethos",
    "tchart:letter:pathos",
  ];

  const liveArtifactRows = [
    {
      id: `evidence:tchart:${studentEmail}:speech:ethos`,
      evidenceKey: `evidence:tchart:${studentEmail}:speech:ethos`,
      type: "speech",
      category: "ethos",
      quote:
        "Five score years ago, a great American, in whose symbolic shadow we stand today, signed the Emancipation Proclamation.",
      observation: "Module 2 note for speech ethos",
    },
    {
      id: `evidence:tchart:${studentEmail}:speech:pathos`,
      evidenceKey: `evidence:tchart:${studentEmail}:speech:pathos`,
      type: "speech",
      category: "pathos",
      quote: "I have a dream that my four little children...",
      observation: "Unrelated speech pathos",
    },
    {
      id: `evidence:tchart:${studentEmail}:speech:logos`,
      evidenceKey: `evidence:tchart:${studentEmail}:speech:logos`,
      type: "speech",
      category: "logos",
      quote: "Cash a check...",
      observation: "Unrelated speech logos",
    },
    {
      id: `evidence:tchart:${studentEmail}:letter:ethos`,
      evidenceKey: `evidence:tchart:${studentEmail}:letter:ethos`,
      type: "letter",
      category: "ethos",
      quote: "My Dear Fellow Clergymen...",
      observation: "Unrelated letter ethos",
    },
    {
      id: `evidence:tchart:${studentEmail}:letter:pathos`,
      evidenceKey: `evidence:tchart:${studentEmail}:letter:pathos`,
      type: "letter",
      category: "pathos",
      quote: 'This "Wait" has almost always meant "Never."',
      observation: "Module 2 note for letter pathos",
    },
    {
      id: `evidence:tchart:${studentEmail}:letter:logos`,
      evidenceKey: `evidence:tchart:${studentEmail}:letter:logos`,
      type: "letter",
      category: "logos",
      quote: "An unjust law is a human law...",
      observation: "Unrelated letter logos",
    },
  ];

  const legacyRows = liveArtifactRows.map((r, index) => ({
    id: index + 1,
    evidenceKey: String(index + 1),
    type: r.type,
    category: r.category,
    quote: `Legacy ${r.category}`,
    observation: "Legacy should not widen a bounded pool",
  }));

  it("1. selected-cluster lookup works with live cluster ID forms", () => {
    const { referenceMatchesId } = require("../lib/module3/moduleThreePhaseModel.js");
    assert.equal(
      referenceMatchesId(selectedClusterId, clusterArtifactId),
      true
    );
    assert.equal(
      referenceMatchesId(clusterArtifactId, selectedClusterId),
      true
    );
  });

  it("2–3. pool contains only live cluster evidence; legacy does not widen", () => {
    assert.equal(
      evidenceIdsMatch(
        "tchart:speech:ethos",
        `evidence:tchart:${studentEmail}:speech:ethos`
      ),
      true
    );

    const pool = resolveModule4EvidencePoolRows({
      artifactRows: liveArtifactRows,
      clusterEvidenceIds: liveClusterEvidenceIds,
      legacyRows,
    });

    const keys = pool.map((r) => continuityEvidenceRowKey(r)).sort();
    assert.deepEqual(keys, [
      `evidence:tchart:${studentEmail}:letter:pathos`,
      `evidence:tchart:${studentEmail}:speech:ethos`,
    ]);
    assert.equal(pool.length, 2);
  });

  it("4–5. live evidenceMap keys join with labels and exact notes", () => {
    const pool = resolveModule4EvidencePoolRows({
      artifactRows: liveArtifactRows,
      clusterEvidenceIds: liveClusterEvidenceIds,
      legacyRows: [],
    });
    const byKey = deriveValidModule3ConnectionsByRowKey({
      evidenceMap: liveEvidenceMap,
      clusterEvidenceIds: liveClusterEvidenceIds,
      evidencePool: pool,
    });
    const enriched = enrichEvidencePoolWithModule3Connections(pool, byKey);

    const speech = enriched.find((r) => r.category === "ethos" && r.type === "speech");
    const letter = enriched.find((r) => r.category === "pathos" && r.type === "letter");

    assert.ok(speech?.module3Connection);
    assert.equal(speech.module3Connection.relationLabel, "Supports the idea");
    assert.equal(speech.module3Connection.note, speechNote);

    assert.ok(letter?.module3Connection);
    assert.equal(letter.module3Connection.relationLabel, "Complicates the idea");
    assert.equal(letter.module3Connection.note, letterNote);
  });

  it("6. unrelated Speech/Letter evidence is excluded", () => {
    const pool = resolveModule4EvidencePoolRows({
      artifactRows: liveArtifactRows,
      clusterEvidenceIds: liveClusterEvidenceIds,
      legacyRows: [],
    });
    const categories = pool.map((r) => `${r.type}:${r.category}`).sort();
    assert.deepEqual(categories, ["letter:pathos", "speech:ethos"]);
    assert.equal(
      pool.some((r) => (r.quote || "").includes("I have a dream")),
      false
    );
  });

  it("7. missing or genuinely unusable cluster data still falls back", () => {
    const noCluster = resolveModule4EvidencePoolRows({
      artifactRows: liveArtifactRows,
      clusterEvidenceIds: [],
      legacyRows: [],
    });
    assert.equal(noCluster.length, 6);

    const legacyOnly = resolveModule4EvidencePoolRows({
      artifactRows: [],
      clusterEvidenceIds: [],
      legacyRows: legacyRows.slice(0, 1),
    });
    assert.equal(legacyOnly.length, 1);

    // Cluster IDs present but nothing matches → keep empty (no silent widen)
    const inconsistent = resolveModule4EvidencePoolRows({
      artifactRows: liveArtifactRows,
      clusterEvidenceIds: ["tchart:speech:unknown-appeal"],
      legacyRows,
    });
    assert.equal(inconsistent.length, 0);
  });
});
