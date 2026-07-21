/**
 * WP-082 — Student-facing copy bans + character/word count must not auto-advance.
 */
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const {
  INTRO_REVISION_TARGET_META,
} = require("../lib/module7/introductionDiagnostics.js");
const {
  CONCLUSION_REVISION_TARGET_META,
} = require("../lib/module7/conclusionDiagnostics.js");
const {
  INTRODUCTION_MOVE_META,
} = require("../lib/module6/introductionMoves.js");
const {
  CONCLUSION_MOVE_META,
} = require("../lib/module6/conclusionMoves.js");

const BANNED_STUDENT_PHRASES = [
  "evidence provenance",
  "highest-leverage target",
  "student-owned",
  "Diagnostics flag likely relationships",
  "alignment score",
  "heuristic",
];

const ROOT = path.join(__dirname, "..");

describe("WP-082 student copy and auto-advance guards", () => {
  it("keeps banned internal phrases out of intro/conclusion student-facing strings", () => {
    const corpora = [];
    for (const meta of [
      INTRO_REVISION_TARGET_META,
      CONCLUSION_REVISION_TARGET_META,
      INTRODUCTION_MOVE_META,
      CONCLUSION_MOVE_META,
    ]) {
      for (const entry of Object.values(meta)) {
        if (entry.title) corpora.push(entry.title);
        if (entry.teach) corpora.push(entry.teach);
        if (entry.model) corpora.push(entry.model);
      }
    }

    const uiFiles = [
      "components/module6/SectionMoveWorkspace.jsx",
      "components/module7/SectionRevisionPanel.jsx",
    ];
    for (const rel of uiFiles) {
      corpora.push(fs.readFileSync(path.join(ROOT, rel), "utf8"));
    }

    for (const text of corpora) {
      for (const phrase of BANNED_STUDENT_PHRASES) {
        assert.equal(
          text.toLowerCase().includes(phrase.toLowerCase()),
          false,
          `must not contain “${phrase}” in: ${text.slice(0, 60)}…`
        );
      }
    }
  });

  it("SectionMoveWorkspace does not auto-advance on character or word count", () => {
    const src = fs.readFileSync(
      path.join(ROOT, "components/module6/SectionMoveWorkspace.jsx"),
      "utf8"
    );
    assert.equal(
      /auto.?advance|onChange.*length\s*[><=]|wordCount.*setActive/i.test(src),
      false
    );
    assert.match(src, /Continue to Step/);
    assert.doesNotMatch(src, /useEffect\([\s\S]*setActive/);
  });
});
