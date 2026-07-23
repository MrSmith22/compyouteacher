/**
 * WP-101 — Pure contradiction / regression fixture builders (§9.4).
 * Synthetic only; never write to production APIs. Student prose is short
 * markers for health/repair checks — not real curriculum text.
 */

import { createHash } from "node:crypto";

/**
 * @param {string} text
 */
function hashText(text) {
  return createHash("sha256").update(String(text || "")).digest("hex").slice(0, 16);
}

/**
 * @typedef {{
 *   id: string,
 *   title: string,
 *   section94Index: number,
 *   artifacts: Record<string, unknown>,
 *   expectedSignals: string[],
 *   mustNotRewriteProse: boolean,
 *   mustNotCertifyComplete: boolean,
 * }} BetaContradictionFixture
 */

/** @type {readonly BetaContradictionFixture[]} */
export const BETA_CONTRADICTION_FIXTURES = Object.freeze([
  Object.freeze({
    id: "c01_clean_strong",
    title: "Clean strong student path",
    section94Index: 1,
    artifacts: Object.freeze({
      sourcesPresent: true,
      thesis: "MARKER_THESIS_STRONG",
      bodyCount: 3,
      planDraftAgree: true,
      wordCount: 900,
      googleDoc: "current",
      pdf: "valid_tiny",
    }),
    expectedSignals: Object.freeze([]),
    mustNotRewriteProse: true,
    mustNotCertifyComplete: false,
  }),
  Object.freeze({
    id: "c02_minimal_valid",
    title: "Minimal but valid path",
    section94Index: 2,
    artifacts: Object.freeze({
      sourcesPresent: true,
      thesis: "MARKER_THESIS_MIN",
      bodyCount: 3,
      planDraftAgree: true,
      wordCount: 450,
      googleDoc: "current",
      pdf: "valid_tiny",
    }),
    expectedSignals: Object.freeze([]),
    mustNotRewriteProse: true,
    mustNotCertifyComplete: false,
  }),
  Object.freeze({
    id: "c03_one_source_missing",
    title: "One source missing",
    section94Index: 3,
    artifacts: Object.freeze({
      sourcesPresent: false,
      missingSource: "letter",
      thesis: "MARKER_THESIS",
    }),
    expectedSignals: Object.freeze(["source_missing"]),
    mustNotRewriteProse: true,
    mustNotCertifyComplete: true,
  }),
  Object.freeze({
    id: "c04_wrong_work_evidence",
    title: "Evidence assigned to the wrong work",
    section94Index: 4,
    artifacts: Object.freeze({
      evidenceWorkId: "speech",
      expectedWorkId: "letter",
      quoteMarker: "MARKER_QUOTE_MISPLACED",
    }),
    expectedSignals: Object.freeze(["wrong_work_evidence"]),
    mustNotRewriteProse: true,
    mustNotCertifyComplete: true,
  }),
  Object.freeze({
    id: "c05_thesis_changed_after_plans",
    title: "Thesis changed after plans exist",
    section94Index: 5,
    artifacts: Object.freeze({
      thesisPrior: "MARKER_THESIS_OLD",
      thesisCurrent: "MARKER_THESIS_NEW",
      plansExist: true,
    }),
    expectedSignals: Object.freeze(["upstream_thesis_changed"]),
    mustNotRewriteProse: true,
    mustNotCertifyComplete: true,
  }),
  Object.freeze({
    id: "c06_duplicate_bodies",
    title: "Duplicate body paragraphs",
    section94Index: 6,
    artifacts: Object.freeze({
      bodyTexts: Object.freeze([
        "MARKER_BODY_DUP",
        "MARKER_BODY_DUP",
        "MARKER_BODY_OTHER",
      ]),
    }),
    expectedSignals: Object.freeze(["duplicate_body_paragraphs"]),
    mustNotRewriteProse: true,
    mustNotCertifyComplete: true,
  }),
  Object.freeze({
    id: "c07_fragment_reasoning",
    title: "Fragment saved in reasoning",
    section94Index: 7,
    artifacts: Object.freeze({
      reasoning: "because",
    }),
    expectedSignals: Object.freeze(["fragmentary_reasoning"]),
    mustNotRewriteProse: true,
    mustNotCertifyComplete: true,
  }),
  Object.freeze({
    id: "c08_plan_draft_disagree",
    title: "Plan and draft disagree",
    section94Index: 8,
    artifacts: Object.freeze({
      planClaim: "MARKER_PLAN_CLAIM",
      draftClaim: "MARKER_DRAFT_CLAIM_DIFFERENT",
    }),
    expectedSignals: Object.freeze(["plan_draft_mismatch"]),
    mustNotRewriteProse: true,
    mustNotCertifyComplete: true,
  }),
  Object.freeze({
    id: "c09_quote_without_explanation",
    title: "Quotation without explanation",
    section94Index: 9,
    artifacts: Object.freeze({
      quote: "MARKER_QUOTE",
      explanation: "",
    }),
    expectedSignals: Object.freeze(["quotation_without_explanation"]),
    mustNotRewriteProse: true,
    mustNotCertifyComplete: true,
  }),
  Object.freeze({
    id: "c10_conclusion_new_claim",
    title: "Conclusion introduces a new claim",
    section94Index: 10,
    artifacts: Object.freeze({
      thesis: "MARKER_THESIS",
      conclusionClaim: "MARKER_UNRELATED_CLAIM",
    }),
    expectedSignals: Object.freeze(["conclusion_new_claim"]),
    mustNotRewriteProse: true,
    mustNotCertifyComplete: true,
  }),
  Object.freeze({
    id: "c11_transition_missing_context",
    title: "Transition with missing/wrong adjacent context",
    section94Index: 11,
    artifacts: Object.freeze({
      transition: "However,",
      priorParagraphPresent: false,
    }),
    expectedSignals: Object.freeze(["transition_missing_context"]),
    mustNotRewriteProse: true,
    mustNotCertifyComplete: true,
  }),
  Object.freeze({
    id: "c12_below_advisory_target",
    title: "Draft substantially below advisory target",
    section94Index: 12,
    artifacts: Object.freeze({
      wordCount: 200,
      wordCountMode: "advisory",
      targetMin: 600,
    }),
    expectedSignals: Object.freeze(["below_advisory_word_target"]),
    mustNotRewriteProse: true,
    mustNotCertifyComplete: false,
  }),
  Object.freeze({
    id: "c13_below_required_minimum",
    title: "Draft below required minimum",
    section94Index: 13,
    artifacts: Object.freeze({
      wordCount: 150,
      wordCountMode: "required",
      targetMin: 500,
    }),
    expectedSignals: Object.freeze(["below_required_word_minimum"]),
    mustNotRewriteProse: true,
    mustNotCertifyComplete: true,
  }),
  Object.freeze({
    id: "c14_above_configured_range",
    title: "Essay above configured range",
    section94Index: 14,
    artifacts: Object.freeze({
      wordCount: 2000,
      wordCountMode: "range",
      targetMax: 1200,
    }),
    expectedSignals: Object.freeze(["above_word_range"]),
    mustNotRewriteProse: true,
    mustNotCertifyComplete: true,
  }),
  Object.freeze({
    id: "c15_teacher_word_count_after_draft",
    title: "Teacher changes word-count settings after drafting",
    section94Index: 15,
    artifacts: Object.freeze({
      draftWordCount: 700,
      priorMode: "off",
      newMode: "required",
      targetMin: 900,
    }),
    expectedSignals: Object.freeze(["word_count_settings_changed"]),
    mustNotRewriteProse: true,
    mustNotCertifyComplete: true,
  }),
  Object.freeze({
    id: "c16_teacher_formatting_after_guided",
    title: "Teacher changes formatting expectations after guided progress",
    section94Index: 16,
    artifacts: Object.freeze({
      guidedProgress: true,
      priorFormatting: "apa7",
      newFormatting: "apa7_strict_margins",
    }),
    expectedSignals: Object.freeze(["formatting_settings_changed"]),
    mustNotRewriteProse: true,
    mustNotCertifyComplete: true,
  }),
  Object.freeze({
    id: "c17_stale_mismatched_doc",
    title: "Stale/mismatched Google Doc",
    section94Index: 17,
    artifacts: Object.freeze({
      googleDoc: "stale",
      essayHash: "abc",
      docHash: "def",
    }),
    expectedSignals: Object.freeze(["stale_google_doc"]),
    mustNotRewriteProse: true,
    mustNotCertifyComplete: true,
  }),
  Object.freeze({
    id: "c18_doc_unavailable",
    title: "Google Doc unavailable or permission lost",
    section94Index: 18,
    artifacts: Object.freeze({
      googleDoc: "unavailable",
    }),
    expectedSignals: Object.freeze(["google_doc_unavailable"]),
    mustNotRewriteProse: true,
    mustNotCertifyComplete: true,
  }),
  Object.freeze({
    id: "c19_legacy_rebuilt_mixed",
    title: "Legacy and rebuilt artifacts mixed",
    section94Index: 19,
    artifacts: Object.freeze({
      legacyOutlinePresent: true,
      rebuiltOutlinePresent: true,
      versionsConflict: true,
    }),
    expectedSignals: Object.freeze(["legacy_rebuilt_mix"]),
    mustNotRewriteProse: true,
    mustNotCertifyComplete: true,
  }),
  Object.freeze({
    id: "c20_malformed_future_version",
    title: "Malformed/future-version state",
    section94Index: 20,
    artifacts: Object.freeze({
      schemaVersion: 999,
      malformed: true,
    }),
    expectedSignals: Object.freeze(["malformed_or_future_version"]),
    mustNotRewriteProse: true,
    mustNotCertifyComplete: true,
  }),
]);

/**
 * Evaluate pure honesty rules for a fixture (does not claim product wiring).
 * @param {BetaContradictionFixture} fixture
 * @param {{ signals?: string[], certifiedComplete?: boolean, rewrittenProse?: boolean }} observation
 */
export function evaluateContradictionHonesty(fixture, observation) {
  /** @type {string[]} */
  const failures = [];
  if (fixture.mustNotRewriteProse && observation.rewrittenProse) {
    failures.push("student prose was silently rewritten");
  }
  if (fixture.mustNotCertifyComplete && observation.certifiedComplete) {
    failures.push("completion falsely certified");
  }
  const expected = new Set(fixture.expectedSignals);
  const seen = new Set(observation.signals || []);
  for (const sig of expected) {
    if (!seen.has(sig)) {
      failures.push(`missing expected signal: ${sig}`);
    }
  }
  return {
    ok: failures.length === 0,
    failures,
    fixtureId: fixture.id,
    artifactHash: hashText(JSON.stringify(fixture.artifacts)),
  };
}

/**
 * @param {string} id
 */
export function getContradictionFixture(id) {
  return BETA_CONTRADICTION_FIXTURES.find((f) => f.id === id) || null;
}

export function listContradictionFixtureIds() {
  return BETA_CONTRADICTION_FIXTURES.map((f) => f.id);
}
