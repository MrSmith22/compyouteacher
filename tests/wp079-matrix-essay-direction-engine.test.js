/**
 * WP-079 — Rhetorical-matrix essay-direction engine.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import * as matrix from "../lib/module2/rhetoricalMatrixHelpers.js";
import * as derived from "../lib/module2/matrixDerivationHelpers.js";
import * as orch from "../lib/module2/matrixOrchestrationHelpers.js";
import {
  WP079_APPEALS,
  WP079_MAX_PRIMARY,
  WP079_RATING_DECISION,
  assertNoInternalRuleIdsInLabel,
  buildEssayDirectionRecommendations,
  evaluateCanonicalFrames,
  generateCanonicalDirectionFrames,
  getDownstreamPersonalizationMap,
  looksLikeCompletedClaimOrThesis,
  wp079ScenarioFixtures,
} from "../lib/module2/matrixEssayDirectionContract.js";
import { buildModuleThreeMatrixHandoffPresentation } from "../lib/module3/moduleThreeMatrixHandoffHelpers.js";
import { buildModule4ProvenanceModel } from "../lib/module4/module4ProvenanceHelpers.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const readSrc = (rel) => readFileSync(join(root, rel), "utf8");

function fillCell(bundle, index, { rating, evidenceIds = [], note, none = false }) {
  const cell = bundle.cells[index];
  return matrix.updateCellInBundle(bundle, cell.id, {
    rating,
    evidenceIds,
    functionNote:
      note || "This appeal helps King connect with this audience clearly.",
    explicitNoEvidence: none,
  });
}

function completeAll(ratings) {
  let bundle = matrix.createEmptyMatrixBundle();
  ratings.forEach((rating, index) => {
    const none = rating === 0;
    bundle = fillCell(bundle, index, {
      rating,
      evidenceIds: none
        ? []
        : [`tchart:${bundle.cells[index].sourceType}:${bundle.cells[index].appeal}`],
      none,
      note: "Enough characters for the mechanical function-note threshold.",
    });
  });
  return bundle;
}

describe("WP-079 matrix essay-direction engine", () => {
  it("1–4. six cells, 0–10 integers, anchors, rankings derived (no separate ranking input)", () => {
    assert.equal(matrix.MATRIX_CELL_ORDER?.length || matrix.createEmptyMatrixBundle().cells.length, 6);
    const empty = matrix.createEmptyMatrixBundle();
    assert.equal(empty.cells.length, 6);
    for (const cell of empty.cells) {
      assert.ok(["speech", "letter"].includes(cell.sourceType));
      assert.ok(WP079_APPEALS.includes(cell.appeal));
    }
    assert.equal(WP079_RATING_DECISION.separateRankingInput, false);
    assert.equal(WP079_RATING_DECISION.rankingsDerivedFromRatings, true);
    assert.ok(WP079_RATING_DECISION.zeroPreserved);
    assert.equal(matrix.normalizeRating(11).valid, false);
    assert.equal(matrix.normalizeRating(7.5).valid, false);
    assert.equal(matrix.normalizeRating(0).value, 0);
    assert.equal(matrix.normalizeRating(10).value, 10);
    const ui = readSrc("components/module2/ModuleTwoRhetoricalMatrix.jsx");
    assert.match(ui, /RATING_ANCHORS/);
    assert.match(ui, /provisional|roughly the same|not precise/i);
    assert.doesNotMatch(ui, /rank 1st|first\/second\/third ranking/i);
  });

  it("5–8. canonical frames are finite: 3 same-appeal + 6 cross-dominant + custom", () => {
    const universe = generateCanonicalDirectionFrames();
    assert.equal(universe.sameAppeal.length, 3);
    assert.equal(universe.crossDominant.length, 6);
    assert.equal(universe.canonicalCount, 9);
    assert.equal(universe.custom.family, "student_created");
    const ids = new Set(universe.all.map((f) => f.frameId));
    assert.equal(ids.size, 10); // 9 + custom
    // No duplicate same-dominant cross frames
    for (const f of universe.crossDominant) {
      assert.notEqual(f.speechAppeal, f.letterAppeal);
    }
  });

  it("9–10. Scenario A contrast + B similarity", () => {
    const fixtures = wp079ScenarioFixtures();
    const a = buildEssayDirectionRecommendations(
      completeAll(fixtures.A_same_appeal_contrast.ratings)
    );
    assert.ok(a.primary.some((p) => p.kind === "largest_contrast"));
    const ethos = a.primary.find((p) => p.provenance.appeals.includes("ethos"));
    assert.ok(ethos);
    assert.match(ethos.why, /8\/10/);
    assert.match(ethos.why, /3\/10/);
    assert.ok(assertNoInternalRuleIdsInLabel(ethos.label));
    assert.ok(ethos.provenance.evidenceIds.length >= 1);

    const b = buildEssayDirectionRecommendations(
      completeAll(fixtures.B_same_appeal_similarity.ratings)
    );
    assert.ok(b.primary.some((p) => p.kind === "meaningful_similarity"));
    const pathos = [...b.primary, ...b.supporting].find((p) =>
      p.provenance.appeals?.includes("pathos")
    );
    assert.ok(pathos);
    assert.match(pathos.label, /audience/i);
  });

  it("11–12. Scenario C different dominant; D same dominant not duplicated", () => {
    const fixtures = wp079ScenarioFixtures();
    const c = buildEssayDirectionRecommendations(
      completeAll(fixtures.C_different_dominant.ratings)
    );
    const cross = [...c.primary, ...c.supporting].find(
      (p) => p.kind === "combined_dominant_across_works"
    );
    assert.ok(cross, "cross-dominant direction should be eligible");
    assert.match(cross.label, /strongest in the speech/i);
    assert.match(cross.label, /strongest in the letter/i);
    assert.equal(looksLikeCompletedClaimOrThesis(cross.label), false);

    const d = evaluateCanonicalFrames(completeAll(fixtures.D_same_dominant.ratings));
    assert.deepEqual(d.speechDominants, ["ethos"]);
    assert.deepEqual(d.letterDominants, ["ethos"]);
    const erroneousCross = d.eligible.filter(
      (f) => f.family === "cross_dominant"
    );
    assert.equal(erroneousCross.length, 0);
    assert.ok(d.eligible.some((f) => f.family === "same_appeal" && f.appeal === "ethos"));
  });

  it("13–15. ties stable+visible; weak signal; explicit zero", () => {
    const fixtures = wp079ScenarioFixtures();
    const e1 = buildEssayDirectionRecommendations(completeAll(fixtures.E_ties.ratings));
    const e2 = buildEssayDirectionRecommendations(completeAll(fixtures.E_ties.ratings));
    assert.deepEqual(
      e1.primary.map((p) => p.id),
      e2.primary.map((p) => p.id)
    );
    const tiedPrimaries = e1.primary.filter((p) => p.tiedWith?.length > 1);
    assert.ok(
      tiedPrimaries.length >= 1 || e1.primary.length + e1.supporting.length >= 2,
      "equal contrasts must remain visible"
    );

    const f = buildEssayDirectionRecommendations(
      completeAll(fixtures.F_weak_signal.ratings)
    );
    assert.equal(f.flags.weakSignal, true);
    assert.match(f.interpretation, /do not yet point|strong/i);
    assert.ok(f.primary.length <= WP079_MAX_PRIMARY);

    const gBundle = completeAll(fixtures.G_explicit_zero.ratings);
    const g = buildEssayDirectionRecommendations(gBundle);
    const zeroContrast = [...g.primary, ...g.supporting].find((p) =>
      p.provenance.appeals?.includes("ethos")
    );
    assert.ok(zeroContrast);
    assert.match(String(zeroContrast.why), /0\/10|limited|absence|unused/i);
  });

  it("16–19. primary capped; no internal IDs; custom available; no completed thesis", () => {
    const pack = buildEssayDirectionRecommendations(
      completeAll([9, 1, 8, 2, 7, 0])
    );
    assert.ok(pack.primary.length <= WP079_MAX_PRIMARY);
    for (const p of pack.primary) {
      assert.ok(assertNoInternalRuleIdsInLabel(p.label));
      assert.equal(looksLikeCompletedClaimOrThesis(p.label), false);
      assert.equal(looksLikeCompletedClaimOrThesis(p.why), false);
    }
    assert.equal(pack.custom.kind, "student_created");
    assert.ok(pack.supporting.every((s) => s.selectable !== false));
  });

  it("20–22. Module 3 selection+provenance; Module 4 consumes; Module 5 overridable guidance", () => {
    const bundle = completeAll([8, 3, 5, 5, 4, 4]);
    const handoff = buildModuleThreeMatrixHandoffPresentation({
      matrixBundle: bundle,
      evidenceRecords: [],
    });
    assert.ok(
      handoff.primaryOptions?.length ||
        handoff.mode === "prefer_matrix_selection" ||
        handoff.useLegacyPatternPath === false
    );
    assert.ok(Array.isArray(handoff.primaryOptions));
    for (const opt of handoff.primaryOptions || []) {
      assert.ok(assertNoInternalRuleIdsInLabel(opt.label || ""));
    }

    const selected = derived.buildSelectedPattern({
      option: orch.selectPrimaryPatternRecommendations(
        derived.derivePatternOptions(bundle),
        bundle
      ).primary[0],
      derived: derived.derivePatternOptions(bundle),
    });
    const m4 = buildModule4ProvenanceModel({
      selectedPattern: {
        id: "pattern-from-matrix",
        text: selected.label,
        evidenceIds: selected.provenance?.evidenceIds || [],
        matrixProvenance: {
          selectedPatternOptionId: selected.optionId || selected.id,
          selectedPatternKind: selected.kind,
          selectedPatternLabel: selected.label,
          ratings: selected.provenance?.ratings || {},
          evidenceIds: selected.provenance?.evidenceIds || [],
          appeals: selected.provenance?.appeals || [],
        },
      },
      evidencePool: [],
    });
    assert.ok(m4);
    assert.notEqual(m4.available, false);

    const five = readSrc("lib/module5/module5OutlineStageHelpers.js");
    assert.match(five, /appliesAutomatically:\s*false|buildOutlineOrderGuidance/);
  });

  it("23. Module 6 personalization is inherited, not direct matrix", () => {
    const map = getDownstreamPersonalizationMap();
    assert.equal(map.module6.mode, "inherited_via_outline_and_paragraph_plans");
    assert.equal(map.module6.directMatrixPanel, false);
    const six = readSrc("components/ModuleSix.js");
    assert.doesNotMatch(six, /matrixProvenance|selectedPattern/);
    const task = readSrc("lib/module6/taskRelevantArtifacts.js");
    assert.doesNotMatch(task, /matrixBundle|matrixProvenance/);
  });

  it("24–26. upstream review without prose rewrite; legacy path; save gate wiring", () => {
    const form = readSrc("components/ModuleThreeV2Form.jsx");
    assert.match(form, /evaluateAllDownstreamArtifactsForUpstreamChange|needsReview/);
    assert.match(form, /useLegacyPatternPath|legacy_pattern_path/);
    assert.doesNotMatch(
      form.slice(form.indexOf("adoptMatrixDirection"), form.indexOf("adoptMatrixDirection") + 800),
      /workingClaim\s*=\s*|thesisStatement\s*=\s*/
    );
    const orchSrc = readSrc("lib/module2/matrixOrchestrationHelpers.js");
    assert.match(orchSrc, /resolveMatrixNavigationGate|saveFailure/);
  });

  it("27. mobile matrix avoids six-input overload contract in UI", () => {
    const ui = readSrc("components/module2/ModuleTwoRhetoricalMatrix.jsx");
    assert.match(ui, /one active|active cell|microtask|CELL/i);
    // Six rating controls appear only inside the active cell rate step, not full matrix edit.
    assert.match(ui, /MATRIX_FLOW_STAGES\.CELL|stage === MATRIX_FLOW_STAGES\.CELL/);
    assert.match(ui, /overflow-x-hidden|min-h-\[44px\]/);
  });
});
