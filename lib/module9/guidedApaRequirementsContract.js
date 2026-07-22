/**
 * WP-092 — Assignment-owned formatting requirements contract (MLK).
 * All guided moves, model annotations, Doc inspection, and PDF checks derive from these ids.
 *
 * Rule kinds (visible to students):
 * - apa_guidance — APA 7 convention
 * - teacher_requires — teacher-selected option for this course
 * - for_this_assignment — assignment-specific fields / exceptions
 *
 * Accuracy sources (July 2026):
 * - APA Style student title page / fonts / page numbers (apastyle.apa.org)
 * - Purdue OWL general APA format (secondary external)
 * - Assignment source years from lib/assignments (both King works 1963)
 *
 * Confidence limits:
 * - Exact reference container/volume metadata must come from the versions students used;
 *   this contract supplies citation-title + year + lettering policy, not fabricated DOIs.
 * - App cannot programmatically verify Google Docs styling; confirmations are self-inspection.
 */

export const GUIDED_APA_PROTOCOL_VERSION = 1;

export const GUIDED_APA_RULE_KINDS = Object.freeze({
  APA_GUIDANCE: "apa_guidance",
  TEACHER_REQUIRES: "teacher_requires",
  FOR_THIS_ASSIGNMENT: "for_this_assignment",
});

export const GUIDED_APA_RULE_KIND_LABELS = Object.freeze({
  apa_guidance: "APA guidance",
  teacher_requires: "Your teacher requires",
  for_this_assignment: "For this assignment",
});

/** Stable semantic move ids in teaching order. */
export const GUIDED_APA_MOVE_IDS = Object.freeze([
  "page_setup",
  "title_page",
  "page_numbers",
  "body_layout",
  "in_text_citations",
  "references_page",
  "paper_order",
  "doc_inspection",
]);

/**
 * @typedef {{
 *   id: string,
 *   kind: string,
 *   label: string,
 *   summary: string,
 *   detail?: string,
 * }} GuidedApaRequirement
 */

/**
 * MLK rhetorical-analysis formatting requirements.
 * Future teacher settings should replace hard-coded teacher_requires values.
 */
export function getMlkGuidedApaRequirementsContract() {
  return {
    protocolVersion: GUIDED_APA_PROTOCOL_VERSION,
    assignmentId: "mlk-rhetorical-analysis",
    paperOrder: [
      "title_page",
      "body",
      "references_page",
    ],
    abstractRequired: false,
    font: {
      id: "font_tnr_12",
      kind: GUIDED_APA_RULE_KINDS.TEACHER_REQUIRES,
      label: "Times New Roman, 12-point",
      summary:
        "Use Times New Roman 12-point throughout. APA 7 allows other fonts; your teacher requires this one.",
      apaNote:
        "APA 7 also permits Calibri 11, Arial 11, Georgia 11, Lucida Sans Unicode 10, and Computer Modern 10.",
    },
    lineSpacing: {
      id: "double_spacing",
      kind: GUIDED_APA_RULE_KINDS.APA_GUIDANCE,
      label: "Double space everywhere",
      summary: "Double-space the whole paper, including the title page and references.",
    },
    margins: {
      id: "one_inch_margins",
      kind: GUIDED_APA_RULE_KINDS.APA_GUIDANCE,
      label: "One-inch margins",
      summary: "Use 1-inch margins on all sides.",
    },
    titlePage: {
      id: "student_title_page",
      kind: GUIDED_APA_RULE_KINDS.FOR_THIS_ASSIGNMENT,
      label: "Student title page fields",
      summary:
        "Include title, your name, school, course, teacher, and due date, centered on the title page.",
      fields: [
        "title",
        "author_name",
        "school",
        "course",
        "teacher",
        "due_date",
      ],
    },
    pageNumbers: {
      id: "page_number_top_right",
      kind: GUIDED_APA_RULE_KINDS.APA_GUIDANCE,
      label: "Page number only (student paper)",
      summary:
        "Put an automatic page number in the top-right header on every page. Student papers do not need a running head unless your teacher asks for one.",
    },
    bodyLayout: {
      id: "body_title_and_indent",
      kind: GUIDED_APA_RULE_KINDS.APA_GUIDANCE,
      label: "Body title and first-line indent",
      summary:
        "Repeat the paper title centered and bold at the top of the first body page. Indent the first line of each paragraph.",
    },
    abstract: {
      id: "abstract_not_required",
      kind: GUIDED_APA_RULE_KINDS.FOR_THIS_ASSIGNMENT,
      label: "No abstract",
      summary: "Do not include an abstract for this assignment unless your teacher later requires one.",
      required: false,
    },
    inTextCitations: {
      id: "king_1963_lettered",
      kind: GUIDED_APA_RULE_KINDS.FOR_THIS_ASSIGNMENT,
      label: "Author–date citations for two 1963 King works",
      summary:
        "Both assigned works were published in 1963. Distinguish them with lettered years in citations and references (for example, King, 1963a and King, 1963b) matching your reference list order.",
      sameAuthorSameYear: true,
      speechYearKey: "1963a",
      letterYearKey: "1963b",
      quotationLocatorNote:
        "When a page number is unavailable for a speech or letter reprint, use a section heading or paragraph locator your teacher accepts—do not invent page numbers.",
    },
    referencesPage: {
      id: "references_required",
      kind: GUIDED_APA_RULE_KINDS.FOR_THIS_ASSIGNMENT,
      label: "References page required",
      summary:
        "Start References on a new page. Alphabetize by author last name. Double-space. Use a hanging indent. Include both King sources with matching lettered years.",
      hangingIndent: true,
      alphabetical: true,
    },
    sources: {
      speech: {
        id: "king_speech_1963",
        citationTitle: "I have a dream",
        originalWorkPublishedYear: "1963",
        yearKey: "1963a",
      },
      letter: {
        id: "king_letter_1963",
        citationTitle: "Letter from Birmingham jail",
        originalWorkPublishedYear: "1963",
        yearKey: "1963b",
      },
    },
    pdfInspectionIds: [
      "pdf_opens",
      "pdf_entire_essay",
      "pdf_title_page",
      "pdf_references_page",
      "pdf_page_numbers",
      "pdf_not_cut_off",
      "pdf_newest_version",
    ],
    externalReferences: [
      {
        id: "apa_student_sample",
        label: "APA Style annotated student sample",
        url: "https://apastyle.apa.org/style-grammar-guidelines/paper-format/sample-papers",
        purpose: "Optional whole-paper visual of student APA format",
      },
      {
        id: "owl_general_format",
        label: "Purdue OWL — APA general format",
        url: "https://owl.purdue.edu/owl/research_and_citation/apa_style/apa_formatting_and_style_guide/general_format.html",
        purpose: "Optional secondary reference for page setup and title page",
      },
    ],
    accuracyNotes: [
      "TNR 12 is teacher_requires, not the sole APA-permitted font.",
      "Student papers use page-number-only headers unless teacher requires a running head.",
      "Abstract is not required for this assignment.",
      "Two King works from 1963 require lettered year keys to avoid ambiguous (King, 1963).",
    ],
  };
}

/**
 * Build a stable signature for invalidation when requirements change.
 * @param {ReturnType<typeof getMlkGuidedApaRequirementsContract>} [contract]
 */
export function buildGuidedApaProtocolSignature(contract = getMlkGuidedApaRequirementsContract()) {
  return [
    `v${contract.protocolVersion}`,
    contract.assignmentId,
    contract.font.id,
    contract.abstract.required ? "abstract" : "no-abstract",
    contract.inTextCitations.speechYearKey,
    contract.inTextCitations.letterYearKey,
  ].join("|");
}

/**
 * @param {string} kind
 */
export function labelForGuidedApaRuleKind(kind) {
  return GUIDED_APA_RULE_KIND_LABELS[kind] || "Requirement";
}
