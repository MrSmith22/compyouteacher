/**
 * Canonical Module 1 completion readiness (server-side).
 * Reuses prompt/quiz validity helpers — does not invent parallel thresholds.
 */

import { isAssignmentStatusActive } from "../assignments/assignmentActivityStatus.js";
import {
  buildPromptPersistencePayload,
  isPromptBreakdownComplete,
} from "./promptBreakdownHelpers.js";
import {
  QUIZ_CONTENT_VERSION,
  QUIZ_ITEM_COUNT,
  allQuizItemsAnswered,
  hydrateLegacyQuizResult,
  normalizeQuizAnswers,
} from "./quizHelpers.js";

export const MODULE1_COMPLETION_REASONS = Object.freeze({
  READY: "ready",
  PROMPT_INCOMPLETE: "prompt_incomplete",
  QUIZ_MISSING: "quiz_missing",
  QUIZ_INCOMPLETE: "quiz_incomplete",
  QUIZ_VERSION_OUTDATED: "quiz_version_outdated",
  ASSIGNMENT_MISSING: "assignment_missing",
  ASSIGNMENT_INACTIVE: "assignment_inactive",
  READ_FAILURE: "read_failure",
});

/**
 * Pick the current canonical quiz result for readiness / grading display.
 * Policy: latest attempt by submitted_at (fallback created_at), never deletes history.
 */
export function selectCurrentQuizResult(rows = []) {
  const list = Array.isArray(rows) ? rows.filter(Boolean) : [];
  if (!list.length) return null;
  return [...list].sort((a, b) => {
    const ta = Date.parse(a.submitted_at || a.created_at || 0) || 0;
    const tb = Date.parse(b.submitted_at || b.created_at || 0) || 0;
    return tb - ta;
  })[0];
}

/**
 * Unversioned legacy quiz rows (created before quiz_version existed):
 * - remain fully readable for history/grading displays
 * - grandfather as completion-ready when answers + score/total are complete
 * Explicit quiz_version=1 (v1 video quiz) is outdated for NEW Module 1 completion.
 */
export const LEGACY_UNVERSIONED_QUIZ_COMPLETION_POLICY =
  "grandfather_complete_unversioned";

/**
 * Whether a persisted quiz row is complete for Module 1 assessment.
 */
export function isCompleteQuizResultRow(row, {
  requiredVersion = QUIZ_CONTENT_VERSION,
  requireCurrentVersion = true,
} = {}) {
  if (!row || typeof row !== "object") {
    return { ok: false, reason: MODULE1_COMPLETION_REASONS.QUIZ_MISSING };
  }
  const hydrated = hydrateLegacyQuizResult(row);
  const answers = normalizeQuizAnswers(hydrated.answers, QUIZ_ITEM_COUNT);
  if (!allQuizItemsAnswered(answers)) {
    return { ok: false, reason: MODULE1_COMPLETION_REASONS.QUIZ_INCOMPLETE };
  }
  if (
    typeof hydrated.score !== "number" ||
    typeof hydrated.total !== "number" ||
    hydrated.total < QUIZ_ITEM_COUNT
  ) {
    return { ok: false, reason: MODULE1_COMPLETION_REASONS.QUIZ_INCOMPLETE };
  }

  const version =
    typeof row.quiz_version === "number"
      ? row.quiz_version
      : typeof row.quizVersion === "number"
        ? row.quizVersion
        : null;

  if (requireCurrentVersion) {
    if (version == null) {
      if (
        LEGACY_UNVERSIONED_QUIZ_COMPLETION_POLICY ===
        "grandfather_complete_unversioned"
      ) {
        return {
          ok: true,
          reason: MODULE1_COMPLETION_REASONS.READY,
          quizVersion: null,
          grandfathered: true,
          score: hydrated.score,
          total: hydrated.total,
          answers,
        };
      }
      return {
        ok: false,
        reason: MODULE1_COMPLETION_REASONS.QUIZ_VERSION_OUTDATED,
        quizVersion: null,
      };
    }
    if (version !== requiredVersion) {
      return {
        ok: false,
        reason: MODULE1_COMPLETION_REASONS.QUIZ_VERSION_OUTDATED,
        quizVersion: version,
      };
    }
  }

  return {
    ok: true,
    reason: MODULE1_COMPLETION_REASONS.READY,
    quizVersion: version,
    score: hydrated.score,
    total: hydrated.total,
    answers,
  };
}

/**
 * Evaluate whether Module 1 may advance (1 → at least 2).
 *
 * @param {{
 *   assignment?: object | null,
 *   promptBreakdown?: object | null,
 *   quizResults?: object[] | null,
 *   assignmentReadError?: unknown,
 *   promptReadError?: unknown,
 *   quizReadError?: unknown,
 * }} input
 */
export function evaluateModule1CompletionReadiness(input = {}) {
  if (input.assignmentReadError || input.promptReadError || input.quizReadError) {
    return {
      ready: false,
      reason: MODULE1_COMPLETION_REASONS.READ_FAILURE,
      details: {
        assignmentReadError: Boolean(input.assignmentReadError),
        promptReadError: Boolean(input.promptReadError),
        quizReadError: Boolean(input.quizReadError),
      },
    };
  }

  const assignment = input.assignment ?? null;
  if (!assignment) {
    return {
      ready: false,
      reason: MODULE1_COMPLETION_REASONS.ASSIGNMENT_MISSING,
    };
  }

  if (!isAssignmentStatusActive(assignment.status)) {
    return {
      ready: false,
      reason: MODULE1_COMPLETION_REASONS.ASSIGNMENT_INACTIVE,
      currentModule: assignment.current_module ?? null,
    };
  }

  const prompt = input.promptBreakdown ?? null;
  if (!prompt) {
    return {
      ready: false,
      reason: MODULE1_COMPLETION_REASONS.PROMPT_INCOMPLETE,
    };
  }

  const promptAnswers = buildPromptPersistencePayload(prompt);
  if (!isPromptBreakdownComplete(promptAnswers)) {
    return {
      ready: false,
      reason: MODULE1_COMPLETION_REASONS.PROMPT_INCOMPLETE,
    };
  }

  const currentQuiz = selectCurrentQuizResult(input.quizResults || []);
  if (!currentQuiz) {
    return {
      ready: false,
      reason: MODULE1_COMPLETION_REASONS.QUIZ_MISSING,
    };
  }

  const quizCheck = isCompleteQuizResultRow(currentQuiz, {
    requiredVersion: QUIZ_CONTENT_VERSION,
    requireCurrentVersion: true,
  });
  if (!quizCheck.ok) {
    return {
      ready: false,
      reason: quizCheck.reason,
      quizVersion: quizCheck.quizVersion ?? null,
    };
  }

  return {
    ready: true,
    reason: MODULE1_COMPLETION_REASONS.READY,
    currentModule: assignment.current_module ?? null,
    quiz: {
      score: quizCheck.score,
      total: quizCheck.total,
      quizVersion: quizCheck.quizVersion,
      answers: quizCheck.answers,
    },
  };
}
