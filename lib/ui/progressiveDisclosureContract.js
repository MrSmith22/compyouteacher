/**
 * WP-054 — Progressive disclosure contract (Modules 6–9 pilot).
 * Presentation-only classification. Does not change gates, saves, or APIs.
 */

/** Content that must stay visible without extra clicks. */
export const WP054_ALWAYS_VISIBLE = Object.freeze([
  "task",
  "orientation_cues",
  "current_work",
  "success_criteria",
  "active_errors_gates",
  "primary_action",
  "task_relevant_desk",
  "safety_critical_submission_wording",
  "selected_filename",
  "google_doc_verification_status",
  "selected_answer_teaching_feedback",
]);

/** Supplemental layers that should stay closed by default. */
export const WP054_DISCLOSE_ON_DEMAND = Object.freeze([
  "examples",
  "extended_explanations",
  "full_reference_shelves",
  "inactive_troubleshooting",
  "alternative_healthy_recovery",
  "optional_reflection",
  "background_framing_detail",
]);

/**
 * A state is materially dense when more than four substantial support layers
 * compete before the active work control.
 */
export const WP054_DENSE_LAYER_THRESHOLD = 4;

/**
 * Modules 6–9 state-by-state density audit matrix.
 * `preWorkLayers` lists substantial instructional/support layers that appear
 * before the active textarea/checklist/recording/file control.
 */
export const WP054_DENSITY_MATRIX = Object.freeze([
  Object.freeze({
    id: "m6-intro",
    module: 6,
    state: "introduction drafting",
    preWorkLayers: [
      "task_cues",
      "job_right_now",
      "task_relevant_desk",
      "supporting_details_disclosure",
    ],
    dense: false,
    plan: "already_compliant",
    remedy: "Reuse InstructionalDisclosure for why/example details; keep writing surface visible.",
  }),
  Object.freeze({
    id: "m6-body",
    module: 6,
    state: "body drafting",
    preWorkLayers: [
      "task_cues",
      "job_right_now",
      "task_relevant_desk",
      "supporting_details_disclosure",
    ],
    dense: false,
    plan: "already_compliant",
    remedy: "Same drafting frame as intro; shelf remains collapsed.",
  }),
  Object.freeze({
    id: "m6-conclusion",
    module: 6,
    state: "conclusion drafting",
    preWorkLayers: [
      "task_cues",
      "job_right_now",
      "task_relevant_desk",
      "supporting_details_disclosure",
    ],
    dense: false,
    plan: "already_compliant",
    remedy: "Same drafting frame; Need Help stays collapsed.",
  }),
  Object.freeze({
    id: "m6-review",
    module: 6,
    state: "whole-draft review",
    preWorkLayers: [
      "task_cues",
      "job_right_now",
      "section_map",
      "success_criteria",
    ],
    dense: false,
    plan: "already_compliant",
    remedy: "Review criteria remain visible; full shelf stays disclosed.",
  }),
  Object.freeze({
    id: "m7-read-aloud",
    module: 7,
    state: "read-aloud",
    preWorkLayers: [
      "task_cues",
      "task_card",
      "essay_preview",
      "recording_controls",
    ],
    dense: false,
    plan: "already_compliant",
    remedy: "Secondary teaching already disclosed; recording + observation stay visible.",
  }),
  Object.freeze({
    id: "m7-intro-revision",
    module: 7,
    state: "introduction revision",
    preWorkLayers: [
      "task_cues",
      "chrome_notes",
      "strategy_card_extended",
      "strategy_checklist",
      "task_relevant_desk",
    ],
    dense: true,
    plan: "remediate",
    remedy:
      "Keep strategy teach + notice/improve prompts; disclose Keep-in-mind tips and examples.",
  }),
  Object.freeze({
    id: "m7-body-revision",
    module: 7,
    state: "body revision",
    preWorkLayers: [
      "task_cues",
      "chrome_notes",
      "strategy_card_extended",
      "strategy_checklist",
      "task_relevant_desk",
    ],
    dense: true,
    plan: "remediate",
    remedy:
      "Same revision pattern: strategy core visible; supplemental tips disclosed.",
  }),
  Object.freeze({
    id: "m7-conclusion-revision",
    module: 7,
    state: "conclusion revision",
    preWorkLayers: [
      "task_cues",
      "chrome_notes",
      "strategy_card_extended",
      "strategy_checklist",
      "task_relevant_desk",
    ],
    dense: true,
    plan: "remediate",
    remedy: "Same revision pattern as intro/body.",
  }),
  Object.freeze({
    id: "m7-final-review",
    module: 7,
    state: "final review",
    preWorkLayers: [
      "task_cues",
      "chrome_notes",
      "strategy_card_extended",
      "confirm_checklist",
      "task_relevant_desk",
    ],
    dense: true,
    plan: "remediate",
    remedy: "Disclose optional confirm tips; keep compare framing and essay work visible.",
  }),
  Object.freeze({
    id: "m8-create",
    module: 8,
    state: "Create/Update Google Doc",
    preWorkLayers: [
      "task_cues",
      "submission_framing_extended",
      "preparation_progress",
      "finished_essay_preview_disclosure",
      "recovery_panel_working_set",
    ],
    dense: true,
    plan: "remediate",
    remedy:
      "Keep finished/nothing-submitted reassurance; disclose extended framing and progress strip.",
  }),
  Object.freeze({
    id: "m8-format",
    module: 8,
    state: "APA Format",
    preWorkLayers: [
      "task_cues",
      "submission_framing_extended",
      "preparation_progress",
      "what_apa_does",
      "what_you_change",
    ],
    dense: true,
    plan: "remediate",
    remedy:
      "Disclose What APA formatting does + extended framing; keep checklist, Open Doc, and gates visible.",
  }),
  Object.freeze({
    id: "m8-ready",
    module: 8,
    state: "Ready confidence check",
    preWorkLayers: [
      "task_cues",
      "submission_framing_extended",
      "preparation_progress",
      "status_list",
      "optional_reflection",
    ],
    dense: true,
    plan: "remediate",
    remedy:
      "Keep confidence checklist + status visible; disclose optional reflection and extended framing.",
  }),
  Object.freeze({
    id: "m9-apa",
    module: 9,
    state: "APA learning/practice",
    preWorkLayers: ["task_cues", "one_prompt_try"],
    dense: false,
    plan: "already_compliant",
    remedy: "Quick guide already disclosed; teaching feedback stays visible after answer.",
  }),
  Object.freeze({
    id: "m9-doc",
    module: 9,
    state: "Google Doc preparation/recovery",
    preWorkLayers: [
      "task_cues",
      "do_not_rewrite",
      "doc_status_controls",
    ],
    dense: false,
    plan: "already_compliant",
    remedy: "Recovery stays reachable; secondary recovery remains plan-driven disclosure.",
  }),
  Object.freeze({
    id: "m9-format",
    module: 9,
    state: "APA formatting checklist",
    preWorkLayers: [
      "task_cues",
      "format_intro",
      "apa_quick_guide_disclosure",
      "checklist",
    ],
    dense: false,
    plan: "already_compliant",
    remedy: "Checklist is the work; quick guide stays on demand.",
  }),
  Object.freeze({
    id: "m9-upload",
    module: 9,
    state: "PDF download/check/upload",
    preWorkLayers: [
      "task_cues",
      "apa_quick_guide_disclosure",
      "download_instructions",
      "pdf_visual",
      "upload_coaching",
    ],
    dense: true,
    plan: "remediate",
    remedy:
      "Keep download instructions/visual, file input, selected filename, final checklist, Upload; disclose quick guide (already) and inactive coaching extras only when needed.",
  }),
]);

export function getWp054DenseStates() {
  return WP054_DENSITY_MATRIX.filter((row) => row.dense);
}

export function getWp054RemediatedStates() {
  return WP054_DENSITY_MATRIX.filter((row) => row.plan === "remediate");
}

export function countPreWorkLayers(row) {
  return Array.isArray(row?.preWorkLayers) ? row.preWorkLayers.length : 0;
}

export function isMateriallyDense(row) {
  return countPreWorkLayers(row) > WP054_DENSE_LAYER_THRESHOLD;
}
