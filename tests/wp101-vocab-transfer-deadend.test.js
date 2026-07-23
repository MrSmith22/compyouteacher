/**
 * WP-101 corrective — assignment_transfer confirm must not dead-end when readiness incomplete.
 */

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  createEmptyTermTransferState,
  evaluateTermTransferReadiness,
  normalizeTermTransferState,
} from "../lib/module1/vocabularyTransferState.js";

test("WP-101 rhetoric transfer confirm readiness requires purpose + king", () => {
  const incomplete = normalizeTermTransferState("rhetoric", {
    ...createEmptyTermTransferState("rhetoric"),
    noticeChoiceId: "version_b_deadline",
    definitionSeen: true,
    boundaryChoiceId: "umbrella_correct",
    audienceEffectChoiceId: "more_ready_to_act",
    // purposeChoiceId intentionally missing
    kingChoiceId: "metaphor_strategy",
    assignmentTransferSeen: true,
    completed: true,
  });
  const readiness = evaluateTermTransferReadiness("rhetoric", incomplete);
  assert.equal(readiness.ready, false);
  assert.ok(readiness.missing.includes("purpose"));
});

test("WP-101 VocabularyTransferLessonFlow bounces incomplete confirm to gap", () => {
  const src = fs.readFileSync(
    path.join(
      process.cwd(),
      "components/module1/VocabularyTransferLessonFlow.jsx"
    ),
    "utf8"
  );
  assert.ok(src.includes("evaluateTermTransferReadiness(termId, preview)"));
  assert.ok(src.includes('missing === "purpose"'));
  assert.ok(src.includes("advanceTo: stepForMissing"));
});
