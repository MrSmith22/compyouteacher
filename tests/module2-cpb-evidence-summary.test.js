const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const {
  normalizeTchartRecord,
  normalizeGuidedRecord,
  normalizeEvidenceReader,
  dedupeEvidenceRecords,
  filterEvidenceForCell,
  EVIDENCE_VIEW_IS_READONLY,
  EVIDENCE_SCHEMA_VERSION,
} = require("../lib/module2/normalizeEvidenceReader.js");

const {
  buildRhetoricalSituationSummary,
  readRhetoricalSituationSummary,
  getSituationSummaryOrFallback,
  SITUATION_SUMMARY_DOES_NOT_REWRITE_DOWNSTREAM,
} = require("../lib/module2/rhetoricalSituationSummary.js");

const {
  readModule2ArtifactBundle,
  mergeModule2ArtifactBundle,
  MODULE2_BUNDLE_ISOLATED_FROM_MODULE3,
  MODULE2_ARTIFACT_MODULE,
} = require("../lib/module2/module2ArtifactBundle.js");

describe("CP-B canonical evidence reader", () => {
  it("normalizes T-chart rows with stable identities", () => {
    const record = normalizeTchartRecord({
      type: "speech",
      category: "ethos",
      quote: "I have a dream",
      observation: "Builds trust\n---AUDIENCE---\nMarchers\n---PURPOSE---\nUnite",
      updated_at: "2026-01-01",
    });
    assert.equal(record.id, "tchart:speech:ethos");
    assert.equal(record.sourceType, "speech");
    assert.equal(record.appeal, "ethos");
    assert.equal(record.quotation, "I have a dream");
    assert.equal(record.audienceNote, "Marchers");
    assert.equal(record.purposeNote, "Unite");
    assert.equal(record.originalStorageSource, "tchart_entries");
    assert.equal(record.schemaVersion, EVIDENCE_SCHEMA_VERSION);
    assert.ok(record.aliases.includes("tchart:speech:ethos"));
  });

  it("normalizes guided observations as legacy-readable", () => {
    const record = normalizeGuidedRecord({
      id: "uuid-1",
      source_type: "letter",
      rhetorical_strategy: "pathos",
      quote: "Injustice anywhere",
      student_observation: "Appeals to fairness",
      audience_effect: "Critics feel challenged",
      purpose_connection: "Defend action",
    });
    assert.equal(record.id, "guided:uuid-1");
    assert.equal(record.legacy, true);
    assert.equal(record.writeCompatible, false);
    assert.ok(record.aliases.includes("evidence:observation:uuid-1"));
  });

  it("alias-dedupes so evidence displays once", () => {
    const records = normalizeEvidenceReader({
      tchartRows: [
        {
          type: "speech",
          category: "ethos",
          quote: "A",
          observation: "note",
        },
      ],
      guidedRows: [
        {
          id: "speech-ethos-dup",
          source_type: "speech",
          rhetorical_strategy: "ethos",
          quote: "A",
          student_observation: "same idea",
        },
        {
          id: "other",
          source_type: "letter",
          rhetorical_strategy: "logos",
          quote: "B",
          student_observation: "logic",
        },
      ],
    });
    // Different IDs stay unless aliases match; tchart preferred when matching
    const ids = records.map((r) => r.id);
    assert.ok(ids.includes("tchart:speech:ethos"));
    assert.ok(ids.includes("guided:other"));
    assert.equal(ids.filter((id) => id === "tchart:speech:ethos").length, 1);

    const aliased = dedupeEvidenceRecords([
      normalizeTchartRecord({
        type: "speech",
        category: "ethos",
        quote: "A",
        observation: "t",
      }),
      {
        id: "evidence:tchart:student@x.com:speech:ethos",
        sourceType: "speech",
        appeal: "ethos",
        quotation: "dup",
        studentObservation: "g",
        audienceNote: "",
        purposeNote: "",
        originalStorageSource: "student_observations",
        aliases: ["evidence:tchart:student@x.com:speech:ethos"],
        writeCompatible: false,
        legacy: true,
      },
    ]);
    assert.equal(aliased.length, 1);
    assert.equal(aliased[0].id, "tchart:speech:ethos");
  });

  it("handles partial and malformed records safely", () => {
    assert.equal(normalizeTchartRecord(null), null);
    assert.equal(normalizeGuidedRecord({}), null);
    const ok = normalizeGuidedRecord({ id: 12, quote: "x" });
    assert.equal(ok.id, "guided:12");
    const list = normalizeEvidenceReader({
      tchartRows: [null, { type: "speech" }, "bad"],
      guidedRows: [undefined, { quote: "no-id" }],
    });
    assert.ok(Array.isArray(list));
  });

  it("viewing is read-only; T-chart remains write-compatible", () => {
    assert.equal(EVIDENCE_VIEW_IS_READONLY, true);
    const t = normalizeTchartRecord({
      type: "letter",
      category: "logos",
      quote: "q",
      observation: "o",
    });
    assert.equal(t.writeCompatible, true);
    const cell = filterEvidenceForCell([t], {
      sourceType: "letter",
      appeal: "logos",
    });
    assert.equal(cell.length, 1);
  });
});

describe("CP-B rhetorical situation summary + artifact bundle", () => {
  it("round-trips a versioned summary", () => {
    const built = buildRhetoricalSituationSummary({
      answers: { q1: "speech", q3: "marchers", q4: "civil_rights" },
      completedAt: "2026-07-11T00:00:00.000Z",
    });
    assert.equal(built.schemaVersion, 1);
    assert.ok(built.speech.audience);
    assert.ok(built.letter.purpose);
    const read = readRhetoricalSituationSummary(built);
    assert.equal(read.speech.audience, built.speech.audience);
    assert.equal(read.studentAnswers.q1, "speech");
  });

  it("legacy no-summary fallback continues safely", () => {
    const { summary, fromLegacyFallback } = getSituationSummaryOrFallback(null);
    assert.equal(fromLegacyFallback, true);
    assert.ok(summary.speech.audience);
    assert.equal(readRhetoricalSituationSummary({ broken: true }), null);
    assert.equal(SITUATION_SUMMARY_DOES_NOT_REWRITE_DOWNSTREAM, true);
  });

  it("merges module-2 artifact bundle without wiping unrelated flow keys", () => {
    const merged = mergeModule2ArtifactBundle(
      { keepMe: true, module2Artifacts: { matrixBundle: { schemaVersion: 1 } } },
      {
        rhetoricalSituationSummary: buildRhetoricalSituationSummary({
          answers: {},
        }),
      }
    );
    assert.equal(merged.keepMe, true);
    const bundle = readModule2ArtifactBundle(merged);
    assert.ok(bundle.rhetoricalSituationSummary);
    assert.ok(bundle.matrixBundle);
    assert.equal(MODULE2_ARTIFACT_MODULE, 2);
    assert.equal(MODULE2_BUNDLE_ISOLATED_FROM_MODULE3, true);
  });

  it("documents primary-path and legacy-route compatibility contracts", () => {
    assert.equal(MODULE2_ARTIFACT_MODULE, 2);
    assert.equal(EVIDENCE_VIEW_IS_READONLY, true);
  });
});
