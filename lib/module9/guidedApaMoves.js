/**
 * WP-092 — Guided formatting moves + Google Docs desktop action paths.
 * Paths verified against current Google Docs desktop UI patterns (File / Format / Insert menus).
 * Mobile Docs paths differ; students are told to use desktop/laptop for this protocol.
 */

import {
  GUIDED_APA_MOVE_IDS,
  getMlkGuidedApaRequirementsContract,
  labelForGuidedApaRuleKind,
} from "./guidedApaRequirementsContract.js";

/**
 * @typedef {{
 *   id: string,
 *   title: string,
 *   modelLocusId: string,
 *   requirementIds: string[],
 *   ruleKind: string,
 *   see: string,
 *   understand: string,
 *   doSteps: string[],
 *   check: string,
 *   fix: string,
 *   environmentNote?: string,
 * }} GuidedApaMove
 */

const ENVIRONMENT_NOTE =
  "Use Google Docs on a computer for these menu paths. Mobile menus differ.";

/**
 * @returns {GuidedApaMove[]}
 */
export function listGuidedApaMoves() {
  const c = getMlkGuidedApaRequirementsContract();
  return [
    {
      id: "page_setup",
      title: "Set font, spacing, and margins",
      modelLocusId: "locus-page-setup",
      requirementIds: [c.font.id, c.lineSpacing.id, c.margins.id],
      ruleKind: c.font.kind,
      see: "In the model, the whole paper uses one clear font, double spacing, and even page edges.",
      understand: `${labelForGuidedApaRuleKind(c.font.kind)}: ${c.font.summary} ${c.lineSpacing.summary} ${c.margins.summary}`,
      doSteps: [
        "Select all text (Ctrl+A / ⌘A).",
        "On the toolbar, set Font to Times New Roman and size to 12.",
        "Choose Format → Line & paragraph spacing → Double.",
        "Choose File → Page setup → set Margins to 1 on all sides → OK.",
      ],
      check: "Scroll the title page and a body page. Spacing between lines should look open (double). Margins should look even. Font should look like Times New Roman 12.",
      fix: "Reselect all → reset font/size → Format → Line & paragraph spacing → Double → File → Page setup → 1-inch margins.",
      environmentNote: ENVIRONMENT_NOTE,
    },
    {
      id: "title_page",
      title: "Build the student title page",
      modelLocusId: "locus-title-page",
      requirementIds: [c.titlePage.id, c.abstract.id],
      ruleKind: c.titlePage.kind,
      see: "The model’s first page shows only title-page fields—no essay paragraphs yet.",
      understand: `${labelForGuidedApaRuleKind(c.titlePage.kind)}: ${c.titlePage.summary} ${c.abstract.summary}`,
      doSteps: [
        "On page 1, center the lines (toolbar Align → Center).",
        "Type the paper title in bold Title Case, then a blank double-spaced line.",
        "Add your name, school, course, teacher, and due date—each on its own centered line.",
        "Do not add an abstract page for this assignment.",
      ],
      check: "Page 1 should show title + identity lines only. No abstract heading. Body text starts on the next page.",
      fix: "Cut body paragraphs from page 1 and paste them after a page break. Recenter and reorder title-page lines.",
      environmentNote: ENVIRONMENT_NOTE,
    },
    {
      id: "page_numbers",
      title: "Add page numbers",
      modelLocusId: "locus-page-numbers",
      requirementIds: [c.pageNumbers.id],
      ruleKind: c.pageNumbers.kind,
      see: "The model shows a page number in the top-right corner on every page.",
      understand: `${labelForGuidedApaRuleKind(c.pageNumbers.kind)}: ${c.pageNumbers.summary}`,
      doSteps: [
        "Choose Insert → Page numbers.",
        "Choose the option with the number at the top of the page, right-aligned (often the top-right thumbnail).",
        "Confirm page 1 appears on the title page.",
        "Do not add a running head unless your teacher asks for one.",
      ],
      check: "Open Print preview or scroll headers: every page has a top-right page number; no extra header title text.",
      fix: "Double-click the header → delete extra text → Insert → Page numbers again → top right.",
      environmentNote: ENVIRONMENT_NOTE,
    },
    {
      id: "body_layout",
      title: "Body title and paragraph indent",
      modelLocusId: "locus-body-layout",
      requirementIds: [c.bodyLayout.id],
      ruleKind: c.bodyLayout.kind,
      see: "After the title page, the model repeats the paper title, then indented paragraphs.",
      understand: `${labelForGuidedApaRuleKind(c.bodyLayout.kind)}: ${c.bodyLayout.summary}`,
      doSteps: [
        "Place the cursor at the start of the essay body (after the title page).",
        "Insert a page break if needed (Insert → Break → Page break).",
        "Type the paper title again, centered and bold, then start the first paragraph on the next line.",
        "Select body paragraphs → Format → Align & indent → Indentation options → Special → First line → Apply.",
      ],
      check: "First body page starts with the paper title. Each paragraph’s first line is indented; left margin of body text is otherwise flush.",
      fix: "Reapply Special indent: First line. Remove extra blank lines between paragraphs.",
      environmentNote: ENVIRONMENT_NOTE,
    },
    {
      id: "in_text_citations",
      title: "Cite the two King sources clearly",
      modelLocusId: "locus-citations",
      requirementIds: [c.inTextCitations.id],
      ruleKind: c.inTextCitations.kind,
      see: "The model uses lettered years so the speech and letter are not confused.",
      understand: `${labelForGuidedApaRuleKind(c.inTextCitations.kind)}: ${c.inTextCitations.summary} ${c.inTextCitations.quotationLocatorNote}`,
      doSteps: [
        "In each place you refer to a source, use author–date form.",
        `Use (King, ${c.inTextCitations.speechYearKey}) for the speech and (King, ${c.inTextCitations.letterYearKey}) for the letter—matching your reference list.`,
        "For quotations without page numbers, add a locator your teacher accepts (section or paragraph), not a made-up page.",
      ],
      check: "Search the Doc for “1963”. Every citation should show a lettered year that matches the matching References entry.",
      fix: "Update citations and references together so speech = 1963a and letter = 1963b (or the lettering order you chose consistently).",
      environmentNote: ENVIRONMENT_NOTE,
    },
    {
      id: "references_page",
      title: "Build the References page",
      modelLocusId: "locus-references",
      requirementIds: [c.referencesPage.id],
      ruleKind: c.referencesPage.kind,
      see: "The model ends with a new page titled References, alphabetized, double-spaced, hanging indent.",
      understand: `${labelForGuidedApaRuleKind(c.referencesPage.kind)}: ${c.referencesPage.summary}`,
      doSteps: [
        "Place the cursor at the end of the essay → Insert → Break → Page break.",
        "Type References centered and bold on the first line of the new page.",
        "Add one entry for each King source using the lettered years that match your citations.",
        "Select the entries → Format → Align & indent → Indentation options → Special → Hanging → Apply.",
      ],
      check: "References starts on its own page. Entries are A–Z by author. Second lines hang. Years match in-text lettering.",
      fix: "Reorder entries alphabetically. Reapply hanging indent. Align years with citations.",
      environmentNote: ENVIRONMENT_NOTE,
    },
    {
      id: "paper_order",
      title: "Confirm paper order and exceptions",
      modelLocusId: "locus-paper-order",
      requirementIds: [c.abstract.id, "paper_order"],
      ruleKind: c.abstract.kind,
      see: "The model order is title page → body → references. No abstract.",
      understand: `For this assignment the paper order is ${c.paperOrder.join(" → ")}. ${c.abstract.summary}`,
      doSteps: [
        "Scroll from the first page to the last.",
        "Confirm title page, then body, then References.",
        "Confirm there is no abstract section.",
      ],
      check: "Page order matches title → body → references with no abstract page.",
      fix: "Move or delete out-of-order sections. Remove any abstract heading/page.",
      environmentNote: ENVIRONMENT_NOTE,
    },
    {
      id: "doc_inspection",
      title: "Final Google Doc inspection",
      modelLocusId: "locus-whole-paper",
      requirementIds: GUIDED_APA_MOVE_IDS.filter((id) => id !== "doc_inspection"),
      ruleKind: "for_this_assignment",
      see: "Use the whole model as a map while you inspect your real Doc.",
      understand:
        "This is the only definitive formatting review of your Google Doc. The app verified your newest essay text earlier; it cannot see styling—you check the real document.",
      doSteps: [
        "Open your Google Doc.",
        "Check the beginning (title page + page number).",
        "Check a middle body page (title/indent/citations).",
        "Check the ending (References + hanging indent).",
      ],
      check: "Beginning, body, citations, and references each look like the requirement for this assignment.",
      fix: "Use Help me fix it on any failed item to jump back to that move’s Do/Check/Fix steps.",
      environmentNote: ENVIRONMENT_NOTE,
    },
  ];
}

/**
 * @param {string} moveId
 */
export function getGuidedApaMove(moveId) {
  return listGuidedApaMoves().find((m) => m.id === moveId) || null;
}

export function getGuidedApaMoveIds() {
  return [...GUIDED_APA_MOVE_IDS];
}

/**
 * PDF inspection items derived from the contract.
 * Keep five student-facing checks aligned with the accepted WP-080 upload checklist
 * so validation/upload/receipt behavior stays shared with the legacy path.
 */
export function listGuidedApaPdfInspectionItems() {
  return [
    {
      id: "pdf_opens",
      label: "The PDF opens correctly.",
      distinction:
        "You checked your Google Doc earlier. Now check that the downloaded PDF still looks correct.",
    },
    {
      id: "pdf_title_page",
      label: "The title page appears.",
      distinction:
        "You checked your Google Doc earlier. Now check that the downloaded PDF still looks correct.",
    },
    {
      id: "pdf_references_page",
      label: "The references page appears.",
      distinction:
        "You checked your Google Doc earlier. Now check that the downloaded PDF still looks correct.",
    },
    {
      id: "pdf_spacing",
      label: "The paper is double-spaced.",
      distinction:
        "You checked your Google Doc earlier. Now check that the downloaded PDF still looks correct.",
    },
    {
      id: "pdf_newest_version",
      label: "This is the newest version of the essay.",
      distinction:
        "You checked your Google Doc earlier. Now check that the downloaded PDF still looks correct.",
    },
  ];
}

export const GUIDED_APA_PDF_DOWNLOAD_STEPS = Object.freeze([
  "Open your Google Doc.",
  "Click File.",
  "Point to Download.",
  "Click PDF Document (.pdf).",
  "Wait for the download to finish.",
  "Open the file from Downloads.",
  "Return to Comp-YouTeacher and select that PDF.",
  "Inspect it, then upload it.",
]);
