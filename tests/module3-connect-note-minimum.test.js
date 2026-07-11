const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const {
  CONNECT_MINIMUM,
  CONNECT_NOTE_COMPLETE_MESSAGE,
  CONNECT_NOTE_EMPTY_MESSAGE,
  CONNECT_NOTE_MINIMUM,
  CONNECT_NOTE_SHORT_MESSAGE,
  countValidExplainedConnections,
  getConnectContinueHint,
  getConnectEvidencePhase,
  getConnectionNoteFeedback,
  getConnectionNoteLength,
  getSourceContributionQuestions,
  isConnectionNoteReady,
  isValidExplainedConnection,
  mapRelationChoiceToConnectionPatch,
  otherSourceQuotationPhrase,
} = require("../lib/module3/connectEvidenceHelpers.js");

function quote(id, extras = {}) {
  return {
    id,
    quote: `Quote ${id}`,
    sourceLabel: extras.sourceType === "letter" ? "Letter" : "Speech",
    sourceType: extras.sourceType || "speech",
    ...extras,
  };
}

const validNote = "This quotation shows delay becomes unjust.";
assert.equal(validNote.length >= CONNECT_NOTE_MINIMUM, true);

describe("CONNECT note minimum — validity", () => {
  it("1. empty note is invalid", () => {
    assert.equal(isConnectionNoteReady(""), false);
    assert.equal(
      isValidExplainedConnection({
        selected: true,
        relation: "supports",
        note: "",
      }),
      false
    );
  });

  it("2. whitespace-only note is invalid", () => {
    assert.equal(isConnectionNoteReady("   \n\t  "), false);
    assert.equal(
      isValidExplainedConnection({
        selected: true,
        relation: "supports",
        note: "   \n\t  ",
      }),
      false
    );
  });

  it("3. a one-character note is invalid", () => {
    assert.equal(isConnectionNoteReady("s"), false);
    assert.equal(isConnectionNoteReady("d"), false);
    assert.equal(
      isValidExplainedConnection({
        selected: true,
        relation: "supports",
        note: "s",
      }),
      false
    );
  });

  it("4. a 14-character trimmed note is invalid", () => {
    const fourteen = "12345678901234";
    assert.equal(fourteen.length, 14);
    assert.equal(isConnectionNoteReady(fourteen), false);
    assert.equal(
      isValidExplainedConnection({
        selected: true,
        relation: "supports",
        note: fourteen,
      }),
      false
    );
  });

  it("5. a 15-character trimmed note is valid", () => {
    const fifteen = "123456789012345";
    assert.equal(fifteen.length, 15);
    assert.equal(isConnectionNoteReady(fifteen), true);
    assert.equal(
      isValidExplainedConnection({
        selected: true,
        relation: "supports",
        note: fifteen,
      }),
      true
    );
  });

  it("6. leading/trailing whitespace does not inflate the count", () => {
    const padded = "  12345678901234  ";
    assert.equal(getConnectionNoteLength(padded), 14);
    assert.equal(isConnectionNoteReady(padded), false);

    const paddedReady = "  123456789012345  ";
    assert.equal(getConnectionNoteLength(paddedReady), 15);
    assert.equal(isConnectionNoteReady(paddedReady), true);
  });
});

describe("CONNECT note minimum — progression gate", () => {
  it("7. two short notes do not unlock Keep Going", () => {
    const workingEvidence = [
      quote("a", { sourceType: "speech" }),
      quote("b", { sourceType: "letter" }),
    ];
    const connections = {
      a: { selected: true, relation: "supports", note: "s" },
      b: { selected: true, relation: "complicates", note: "d" },
    };

    assert.equal(
      countValidExplainedConnections(
        connections,
        workingEvidence.map((item) => item.id)
      ),
      0
    );
    const phase = getConnectEvidencePhase({
      workingEvidence,
      evidenceConnections: connections,
      minimum: CONNECT_MINIMUM,
    });
    assert.equal(phase.canContinue, false);
    assert.equal(phase.showReview, false);
    assert.equal(phase.revealQuote2, false);
  });

  it("8. one valid and one short note does not unlock Keep Going", () => {
    const workingEvidence = [
      quote("a", { sourceType: "speech" }),
      quote("b", { sourceType: "letter" }),
    ];
    const connections = {
      a: { selected: true, relation: "supports", note: validNote },
      b: { selected: true, relation: "complicates", note: "short" },
    };

    assert.equal(
      countValidExplainedConnections(
        connections,
        workingEvidence.map((item) => item.id)
      ),
      1
    );
    const phase = getConnectEvidencePhase({
      workingEvidence,
      evidenceConnections: connections,
      minimum: CONNECT_MINIMUM,
    });
    assert.equal(phase.canContinue, false);
    assert.equal(phase.showReview, false);
    assert.equal(phase.revealQuote2, true);
    assert.equal(phase.activeIndex, 1);
  });

  it("9. two valid notes unlock Keep Going", () => {
    const workingEvidence = [
      quote("a", { sourceType: "speech" }),
      quote("b", { sourceType: "letter" }),
    ];
    const connections = {
      a: { selected: true, relation: "supports", note: validNote },
      b: {
        selected: true,
        relation: "complicates",
        note: "Letter detail makes the idea more precise.",
      },
    };

    const phase = getConnectEvidencePhase({
      workingEvidence,
      evidenceConnections: connections,
      minimum: CONNECT_MINIMUM,
    });
    assert.equal(phase.canContinue, true);
    assert.equal(phase.showReview, true);
  });
});

describe("CONNECT note minimum — saved short notes and compatibility", () => {
  it("10. previously saved short notes are preserved but marked incomplete", () => {
    const saved = {
      selected: true,
      relation: "supports",
      note: "s",
    };
    assert.equal(saved.note, "s");
    assert.equal(isValidExplainedConnection(saved), false);

    const feedback = getConnectionNoteFeedback({ note: saved.note });
    assert.equal(feedback.ready, false);
    assert.equal(feedback.message, CONNECT_NOTE_SHORT_MESSAGE);
    assert.equal(feedback.characterHint, "1 of 15 characters needed");
  });

  it("11. editing one connection preserves the other", () => {
    const evidenceConnections = {
      a: { selected: true, relation: "supports", note: validNote },
      b: {
        selected: true,
        relation: "complicates",
        note: "Letter detail makes the idea more precise.",
      },
    };
    const next = {
      ...evidenceConnections,
      a: { ...evidenceConnections.a, note: "s" },
    };
    assert.equal(next.a.note, "s");
    assert.equal(
      next.b.note,
      "Letter detail makes the idea more precise."
    );
    assert.equal(isValidExplainedConnection(next.a), false);
    assert.equal(isValidExplainedConnection(next.b), true);
  });

  it("12. persistence shape remains { selected, relation, note }", () => {
    const patch = mapRelationChoiceToConnectionPatch("supports", {
      note: "s",
    });
    assert.deepEqual(Object.keys(patch).sort(), ["note", "relation", "selected"]);
    assert.equal(patch.note, "s");
  });
});

describe("CONNECT note minimum — copy corrections", () => {
  it("13. the duplicated 'the the' copy is gone", () => {
    const unknown = getSourceContributionQuestions({
      sourceType: "speech",
      otherSourceType: "",
    });
    const joined = unknown.join(" ");
    assert.doesNotMatch(joined, /the the /i);
    assert.match(joined, /other work’s quotation/);

    assert.equal(
      otherSourceQuotationPhrase(""),
      "the other work’s quotation"
    );
  });

  it("14. Speech and Letter coaching names the other source accurately", () => {
    const speech = getSourceContributionQuestions({
      sourceType: "speech",
      otherSourceType: "letter",
    });
    assert.match(
      speech[2],
      /Does it contribute something similar to the Letter quotation, something different, or both\?/
    );

    const letter = getSourceContributionQuestions({
      sourceType: "letter",
      otherSourceType: "speech",
    });
    assert.match(
      letter[2],
      /Does it contribute something similar to the Speech quotation, something different, or both\?/
    );
  });
});

describe("CONNECT note minimum — student-facing feedback", () => {
  it("shows empty, short, and complete messages beside the note", () => {
    assert.equal(
      getConnectionNoteFeedback({ note: "" }).message,
      CONNECT_NOTE_EMPTY_MESSAGE
    );
    assert.equal(
      getConnectionNoteFeedback({ note: "almost enough" }).message,
      CONNECT_NOTE_SHORT_MESSAGE
    );
    assert.equal(
      getConnectionNoteFeedback({ note: validNote }).message,
      CONNECT_NOTE_COMPLETE_MESSAGE
    );

    assert.equal(
      getConnectContinueHint({
        workingEvidence: [quote("a"), quote("b")],
        evidenceConnections: {
          a: { selected: true, relation: "supports", note: "s" },
        },
        activeEvidenceId: "a",
        activeUiChoice: "supports",
      }),
      CONNECT_NOTE_SHORT_MESSAGE
    );
  });
});
