/**
 * WP-101 — Build the versioned beta acceptance manifest.
 */

import { BETA_MATRIX_SCHEMA_VERSION } from "./schema.js";
import { listContradictionFixtureIds } from "./contradictionFixtures.js";
import { listCoverageFamilyIds } from "../ui/taskWorkspaceCoverageRegistry.js";

/**
 * @param {Partial<{
 *   id: string,
 *   title: string,
 *   epic: string,
 *   riskArea: string,
 *   fixtureId: string,
 *   layer: string,
 *   modules: (number|string)[],
 *   stateFamilies: string[],
 *   preconditions: string,
 *   actions: string,
 *   expected: Record<string, string>,
 *   cleanup: string,
 *   required: boolean,
 *   linkedIssues: string[],
 *   severityIfFailed: string,
 *   runner: string,
 * }>} partial
 */
function sc(partial) {
  return {
    id: partial.id,
    title: partial.title,
    epic: partial.epic || "ops",
    riskArea: partial.riskArea || "general",
    fixtureId: partial.fixtureId || "none",
    layer: partial.layer || "pure",
    modules: partial.modules || [],
    stateFamilies: partial.stateFamilies || [],
    preconditions: partial.preconditions || "none",
    actions: partial.actions || "assert",
    expected: partial.expected || {
      ui: "n/a",
      artifact: "n/a",
      persistence: "n/a",
      downstream: "n/a",
      accessibility: "n/a",
      privacy: "n/a",
    },
    cleanup: partial.cleanup || "none",
    required: partial.required !== false,
    linkedIssues: partial.linkedIssues || ["WP-101"],
    severityIfFailed: partial.severityIfFailed || "Critical",
    runner: partial.runner || "pure",
  };
}

export function buildBetaManifest() {
  /** @type {ReturnType<typeof sc>[]} */
  const scenarios = [];

  // —— Harness self-tests ——
  scenarios.push(
    sc({
      id: "HARNESS.schema",
      title: "Manifest schema/version validation",
      epic: "ops",
      riskArea: "harness",
      runner: "harness",
      severityIfFailed: "Blocker",
    }),
    sc({
      id: "HARNESS.unique_ids",
      title: "No duplicate or missing scenario ids",
      epic: "ops",
      riskArea: "harness",
      runner: "harness",
      severityIfFailed: "Blocker",
    }),
    sc({
      id: "HARNESS.required_coverage",
      title: "Required Phase 7 / §9.4 / WP-097 coverage present",
      epic: "ops",
      riskArea: "harness",
      runner: "harness",
      severityIfFailed: "Blocker",
    }),
    sc({
      id: "HARNESS.skip_blocked_rules",
      title: "Skip/blocked rules and failure exit code",
      epic: "ops",
      riskArea: "harness",
      runner: "harness",
      severityIfFailed: "Blocker",
    }),
    sc({
      id: "HARNESS.fixture_idempotency",
      title: "Fixture idempotency and cleanup ledger",
      epic: "ops",
      riskArea: "harness",
      runner: "harness",
      severityIfFailed: "High",
    }),
    sc({
      id: "HARNESS.redaction",
      title: "Sensitive-output redaction",
      epic: "ops",
      riskArea: "privacy",
      runner: "harness",
      severityIfFailed: "Blocker",
      expected: { privacy: "tokens and Doc URLs redacted" },
    }),
    sc({
      id: "HARNESS.stale_evidence",
      title: "Stale-evidence / build-commit detection",
      epic: "ops",
      riskArea: "harness",
      runner: "harness",
      severityIfFailed: "Blocker",
    }),
    sc({
      id: "HARNESS.report_totals",
      title: "Report totals equal matrix results",
      epic: "ops",
      riskArea: "harness",
      runner: "harness",
      severityIfFailed: "High",
    }),
    sc({
      id: "HARNESS.prod_fixture_denial",
      title: "Production fixture source denial contract",
      epic: "ops",
      riskArea: "privacy",
      runner: "pure",
      severityIfFailed: "Blocker",
    })
  );

  // —— §9.4 contradiction fixtures ——
  for (const fid of listContradictionFixtureIds()) {
    scenarios.push(
      sc({
        id: `CONTRA.${fid}`,
        title: `Contradiction fixture ${fid}`,
        epic: "A",
        riskArea: "artifact_honesty",
        fixtureId: fid,
        layer: "pure",
        modules: [2, 3, 4, 5, 6, 7, 8, 9],
        runner: "contradiction",
        severityIfFailed: "Critical",
        linkedIssues: ["WP-101", "WP-081"],
        expected: {
          ui: "health/mismatch only when supported",
          artifact: "prose not rewritten",
          persistence: "local repair destination preserved",
          downstream: "no false completion",
          accessibility: "n/a",
          privacy: "markers only",
        },
        cleanup: "pure_noop",
      })
    );
  }

  // —— WP-097 coverage families ——
  for (const familyId of listCoverageFamilyIds()) {
    scenarios.push(
      sc({
        id: `COV.${familyId}`,
        title: `WP-097 coverage family ${familyId}`,
        epic: "H",
        riskArea: "workspace_hierarchy",
        fixtureId: `coverage:${familyId}`,
        layer: "pure",
        stateFamilies: [familyId],
        modules: [Number(familyId.split(".")[0].replace("M", "")) || 0],
        runner: "coverage",
        linkedIssues: ["WP-101", "WP-097"],
        severityIfFailed: "High",
        expected: {
          ui: "family registered with desk/shelf owners",
          artifact: "n/a",
          persistence: "n/a",
          downstream: "n/a",
          accessibility: "n/a",
          privacy: "n/a",
        },
        cleanup: "none",
      })
    );
  }

  // —— Fresh / returning ——
  scenarios.push(
    sc({
      id: "FRESH.e2e_real_ui",
      title: "Fresh student sign-in through durable receipt (no shortcuts)",
      epic: "G",
      riskArea: "end_to_end",
      fixtureId: "isolated_beta_student",
      layer: "dev_browser",
      modules: [1, 2, 3, 4, 5, 6, 7, 8, 9],
      runner: "browser_fresh",
      severityIfFailed: "Blocker",
      linkedIssues: ["WP-101", "WP-080", "WP-093"],
      preconditions: "isolated beta-student email; empty assignment",
      actions: "real UI through Modules 1–9, Doc, PDF, receipt",
      expected: {
        ui: "one dominant task per screen",
        artifact: "traceable chain",
        persistence: "authoritative save before nav",
        downstream: "durable receipt",
        accessibility: "keyboard operable",
        privacy: "no secrets in logs",
      },
      cleanup: "restart_owned_beta_email",
    }),
    sc({
      id: "TRACE.final_body_paragraph",
      title: "End-to-end final body paragraph artifact trace",
      epic: "A",
      riskArea: "provenance",
      fixtureId: "strong_trace_fixture",
      layer: "pure",
      modules: [2, 3, 4, 5, 6, 7, 8, 9],
      runner: "trace",
      severityIfFailed: "Critical",
      linkedIssues: ["WP-101"],
      cleanup: "none",
    })
  );

  const returningBoundaries = [
    "m1_before_quiz",
    "m1_after_quiz",
    "m2_partial_evidence",
    "m2_selected_direction",
    "m3_ea_family",
    "m4_body_plan",
    "m4_review",
    "m5_outline",
    "m6_intro",
    "m6_body",
    "m6_conclusion",
    "m6_review",
    "m7_read_aloud",
    "m7_section",
    "m7_whole_essay",
    "m8_doc_ready",
    "m9_guided_move",
    "m9_pdf_upload",
    "m9_receipt",
    "success_dashboard",
    "teacher_progress",
  ];
  for (const b of returningBoundaries) {
    scenarios.push(
      sc({
        id: `RETURN.${b}`,
        title: `Returning student boundary ${b}`,
        epic: "H",
        riskArea: "resume",
        fixtureId: `seed:${b}`,
        layer: "pure",
        modules: [],
        runner: "returning_contract",
        severityIfFailed: "Critical",
        linkedIssues: ["WP-101"],
        preconditions: "idempotent seed or pure contract map",
        actions: "assert resume contract mapped to seed/target",
        expected: {
          ui: "resume same state",
          artifact: "unchanged downstream",
          persistence: "no replay/skip",
          downstream: "preserved",
          accessibility: "focus restored",
          privacy: "n/a",
        },
        cleanup: "owned_email_only",
      })
    );
  }

  // —— PDF / submission ——
  const pdfCases = [
    ["tiny_valid", "Tiny valid PDF displays bytes/KB"],
    ["zero_byte", "Zero-byte file rejected"],
    ["extension_non_pdf", ".pdf extension with non-PDF payload rejected"],
    ["unexpected_mime", "Valid PDF unexpected MIME under validated contract"],
    ["malformed", "Malformed/truncated PDF rejected"],
    ["reselect", "Wrong file reselected before upload"],
    ["five_checks", "Five PDF inspection checks gate upload"],
    ["network_retain", "Network failure retains selection where browser allows"],
    ["server_400", "Server 400 recovery"],
    ["server_409", "Duplicate upload 409 without replacing receipt"],
    ["server_500", "Server 500 recovery"],
    ["durable_before_nav", "Durable upload before success navigation"],
    ["receipt_fields", "Persistent receipt fields"],
    ["missing_receipt_recovery", "Missing receipt recovery"],
    ["refresh_reopen", "Refresh/direct receipt reopen"],
    ["already_submitted", "Already-submitted bypasses preparation"],
    ["grade_no_mutate_receipt", "Teacher grading does not alter receipt"],
  ];
  for (const [id, title] of pdfCases) {
    scenarios.push(
      sc({
        id: `PDF.${id}`,
        title,
        epic: "G",
        riskArea: "submission_trust",
        fixtureId: `pdf:${id}`,
        layer: id === "network_retain" ? "dev_browser" : "pure",
        modules: [9],
        runner: id === "network_retain" ? "browser_pdf" : "pdf_contract",
        severityIfFailed:
          id === "durable_before_nav" || id === "receipt_fields"
            ? "Blocker"
            : "Critical",
        linkedIssues: ["WP-101", "WP-080"],
        cleanup: "none",
      })
    );
  }

  // —— Google Doc recovery ——
  const docCases = [
    ["signed_out", "Signed out / expired auth"],
    ["popup_blocked", "Popup blocked"],
    ["permission_denied", "User denies permission"],
    ["create_ok", "Creation succeeds"],
    ["verify_ok", "Verification succeeds"],
    ["reuse_current", "Existing current Doc reused"],
    ["stale_update", "Stale Doc updated"],
    ["mismatch_recovery", "Mismatched Doc recovery"],
    ["deleted", "Doc deleted/unavailable"],
    ["permission_lost", "Permission lost"],
    ["timeout_5xx", "Network/API timeout/5xx"],
    ["dup_create_prevent", "Duplicate create prevention"],
    ["guided_invalidate", "Replaced Doc invalidates guided checks"],
    ["direct_resume", "Direct resume after recovery"],
    ["teacher_doc_not_submit", "Teacher sees Doc availability but not submission"],
  ];
  for (const [id, title] of docCases) {
    scenarios.push(
      sc({
        id: `DOC.${id}`,
        title,
        epic: "F",
        riskArea: "google_doc",
        fixtureId: `doc:${id}`,
        layer: "pure",
        modules: [8, 9],
        runner: "doc_contract",
        severityIfFailed: "Critical",
        linkedIssues: ["WP-101", "WP-093", "WP-002"],
        cleanup: "scoped_test_doc_only",
        expected: {
          ui: "recovery path visible",
          artifact: "current signature",
          persistence: "no duplicate create",
          downstream: "guided invalidation when replaced",
          accessibility: "n/a",
          privacy: "no OAuth/Doc URL in reports",
        },
      })
    );
  }

  // —— Teacher configuration ——
  const teacherCases = [
    ["word_count_modes", "Word count off/advisory/required/range"],
    ["invalid_range", "Invalid range rejection preserves prior"],
    ["rollouts_independent", "Spine/EA/vocab/submission rollouts independent"],
    ["settings_refresh", "Settings refresh across sessions"],
    ["no_file_fallback", "Missing schema recoverable without prod file fallback"],
    ["scoped_guidance", "Changing settings updates only intended guidance"],
    ["rollback_preserves_artifacts", "Rollback restores modes without deleting artifacts"],
    ["progress_projection", "Progress/Submissions/detail projection accurate"],
    ["notes_grade_rollback", "Notes/grading failure rollback"],
    ["anon_student_denial", "Anonymous/student teacher-route denial"],
  ];
  for (const [id, title] of teacherCases) {
    scenarios.push(
      sc({
        id: `TEACH.${id}`,
        title,
        epic: "E",
        riskArea: "teacher_config",
        fixtureId: `teacher:${id}`,
        layer: id === "anon_student_denial" ? "api" : "pure",
        modules: ["teacher"],
        runner: "teacher_contract",
        severityIfFailed: "Critical",
        linkedIssues: ["WP-101", "WP-084", "WP-100"],
        cleanup: "restore_settings_ledger",
      })
    );
  }

  // —— Security / privacy / prod ——
  scenarios.push(
    sc({
      id: "SEC.auth_boundaries",
      title: "Anonymous/student/teacher authorization boundaries",
      epic: "ops",
      riskArea: "security",
      layer: "api",
      runner: "security",
      severityIfFailed: "Blocker",
      linkedIssues: ["WP-101", "WP-100"],
    }),
    sc({
      id: "SEC.cross_student_denial",
      title: "Cross-student and cross-role access denial",
      epic: "ops",
      riskArea: "security",
      layer: "api",
      runner: "security",
      severityIfFailed: "Blocker",
    }),
    sc({
      id: "SEC.membership",
      title: "Assignment membership checks on detail",
      epic: "ops",
      riskArea: "security",
      layer: "pure",
      runner: "security",
      severityIfFailed: "Critical",
      linkedIssues: ["WP-101", "WP-100"],
    }),
    sc({
      id: "SEC.roster_least_data",
      title: "Roster/detail least-data; no prose/URLs/notes in list",
      epic: "ops",
      riskArea: "privacy",
      layer: "pure",
      runner: "security",
      severityIfFailed: "Blocker",
    }),
    sc({
      id: "SEC.dev_absent_prod",
      title: "Dev panel/seeds/fixtures denied in production",
      epic: "ops",
      riskArea: "privacy",
      layer: "prod_browser",
      runner: "prod",
      severityIfFailed: "Blocker",
    }),
    sc({
      id: "SEC.no_client_rollout_truth",
      title: "No client-controlled rollout/config truth",
      epic: "ops",
      riskArea: "security",
      layer: "pure",
      runner: "security",
      severityIfFailed: "Critical",
    }),
    sc({
      id: "CLONE.audit",
      title: "Assignment cloning readiness audit (no invent)",
      epic: "E",
      riskArea: "multi_assignment",
      layer: "pure",
      runner: "clone_audit",
      required: true,
      severityIfFailed: "Medium",
      linkedIssues: ["WP-101", "WP-102"],
      expected: {
        ui: "n/a",
        artifact: "n/a",
        persistence: "n/a",
        downstream: "n/a",
        accessibility: "n/a",
        privacy: "n/a",
      },
      cleanup: "none",
    }),
    sc({
      id: "PROD.clean_build",
      title: "Clean production build without overrides",
      epic: "ops",
      riskArea: "production",
      layer: "prod_browser",
      runner: "prod",
      severityIfFailed: "Blocker",
    }),
    sc({
      id: "PROD.rollouts_db",
      title: "Four instructional rollouts database-backed",
      epic: "E",
      riskArea: "production",
      layer: "pure",
      runner: "prod_contract",
      severityIfFailed: "Critical",
    }),
    sc({
      id: "PROD.chunk_scan",
      title: "No fixture/dev strings in production chunks",
      epic: "ops",
      riskArea: "privacy",
      layer: "prod_browser",
      runner: "prod",
      severityIfFailed: "Blocker",
    }),
    sc({
      id: "A11Y.layout_families",
      title: "Responsive/keyboard/a11y technical checks for layout families",
      epic: "H",
      riskArea: "accessibility",
      layer: "dev_browser",
      runner: "browser_a11y",
      severityIfFailed: "High",
      linkedIssues: ["WP-101", "WP-097"],
      expected: {
        ui: "390/1440/200% zoom",
        artifact: "n/a",
        persistence: "n/a",
        downstream: "n/a",
        accessibility:
          "keyboard, focus, landmarks; AT usability human-only",
        privacy: "n/a",
      },
    })
  );

  // Existing suite wiring (evidence from prior WP tests)
  const suiteEvidence = [
    ["SUITE.wp080_pdf", "WP-080 submission trust suite", "pdf_suite", "G", "WP-080"],
    ["SUITE.wp081_health", "WP-081 body health / fragment signals", "health_suite", "A", "WP-081"],
    ["SUITE.wp084_word", "WP-084 word-count settings suite", "word_suite", "E", "WP-084"],
    ["SUITE.wp093_protocol", "WP-093 guided APA production suite", "apa_suite", "F", "WP-093"],
    ["SUITE.wp097_workspace", "WP-097 workspace hierarchy suite", "workspace_suite", "H", "WP-097"],
    ["SUITE.wp100_teacher", "WP-100 teacher progress production suite", "teacher_suite", "E", "WP-100"],
  ];
  for (const [id, title, fixture, epic, issue] of suiteEvidence) {
    scenarios.push(
      sc({
        id,
        title,
        epic,
        riskArea: "regression_suite",
        fixtureId: fixture,
        layer: "pure",
        runner: "suite_evidence",
        severityIfFailed: "Critical",
        linkedIssues: ["WP-101", issue],
        cleanup: "none",
      })
    );
  }

  return {
    schemaVersion: BETA_MATRIX_SCHEMA_VERSION,
    title: "Phase 7 MLK beta-readiness matrix",
    assignmentId: "mlk-rhetorical-analysis",
    generatedBy: "lib/beta/buildManifest.js",
    scenarios,
  };
}

export function requiredScenarioIds(manifest = buildBetaManifest()) {
  return manifest.scenarios.filter((s) => s.required).map((s) => s.id);
}
