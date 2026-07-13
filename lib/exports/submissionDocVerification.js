/**
 * WP-029 — Google Doc text extraction, normalization, and essay comparison.
 *
 * Comparison rule (documented):
 * 1. Extract plain text from Docs body (paragraphs + common nested structures).
 * 2. Normalize line endings, NBSP, zero-width chars, Unicode NFC, and visual
 *    whitespace runs.
 * 3. Split the authoritative essay into meaningful paragraphs.
 * 4. Require every essay paragraph to appear intact and in order in the Doc.
 * 5. Allow additional APA material (title page, headings, references) around
 *    or between those paragraphs.
 * 6. Word/punctuation/capitalization changes are mismatches, not formatting.
 *
 * Never log or return full essay/document bodies from callers.
 */

export const SUBMISSION_DOC_VERIFICATION_STATUS = Object.freeze({
  CHECKING: "checking",
  VERIFIED: "verified",
  MISMATCH: "mismatch",
  MISSING_DOCUMENT: "missing_document",
  MISSING_ESSAY: "missing_essay",
  DOCUMENT_UNAVAILABLE: "document_unavailable",
  VERIFICATION_ERROR: "verification_error",
});

const ZERO_WIDTH = /[\u200B-\u200D\uFEFF]/g;

/**
 * Normalize text for comparison (not for display).
 * @param {unknown} raw
 */
export function normalizeSubmissionDocText(raw) {
  if (typeof raw !== "string") return "";
  return raw
    .normalize("NFC")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\u00a0/g, " ")
    .replace(ZERO_WIDTH, "")
    .replace(/[ \t\f\v]+/g, " ")
    .replace(/ *\n */g, "\n")
    .trim();
}

/**
 * Collapse a paragraph to a single-line normalized string for substring search.
 * @param {string} paragraph
 */
export function normalizeParagraphForMatch(paragraph) {
  return normalizeSubmissionDocText(String(paragraph || ""))
    .replace(/\n+/g, " ")
    .replace(/ {2,}/g, " ")
    .trim();
}

/**
 * Split authoritative essay into meaningful paragraphs.
 * Prefer blank-line breaks; if none, use single newlines for non-empty lines
 * when multiple substantial lines exist.
 * @param {unknown} essayText
 * @returns {string[]}
 */
export function splitEssayIntoParagraphs(essayText) {
  const raw = typeof essayText === "string" ? essayText : "";
  const withLf = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const blankSplit = withLf
    .split(/\n\s*\n/)
    .map((p) => normalizeParagraphForMatch(p))
    .filter(Boolean);

  if (blankSplit.length > 1) return blankSplit;

  const lineSplit = withLf
    .split("\n")
    .map((p) => normalizeParagraphForMatch(p))
    .filter(Boolean);

  if (lineSplit.length > 1) return lineSplit;
  if (blankSplit.length === 1) return blankSplit;
  return lineSplit;
}

/**
 * Extract plain text from a Google Docs documents.get resource.
 * Handles paragraphs and common nested table / TOC content.
 * @param {unknown} document
 * @returns {string}
 */
export function extractGoogleDocPlainText(document) {
  if (!document || typeof document !== "object") return "";
  const body = /** @type {{ body?: { content?: unknown[] } }} */ (document)
    .body;
  if (!body || !Array.isArray(body.content)) return "";

  const chunks = [];

  function walk(elements) {
    if (!Array.isArray(elements)) return;
    for (const el of elements) {
      if (!el || typeof el !== "object") continue;

      if (el.paragraph && Array.isArray(el.paragraph.elements)) {
        let para = "";
        for (const pe of el.paragraph.elements) {
          if (pe?.textRun?.content) para += pe.textRun.content;
        }
        chunks.push(para);
      }

      if (el.table?.tableRows && Array.isArray(el.table.tableRows)) {
        for (const row of el.table.tableRows) {
          for (const cell of row.tableCells || []) {
            walk(cell.content);
          }
        }
      }

      if (el.tableOfContents?.content) {
        walk(el.tableOfContents.content);
      }
    }
  }

  walk(body.content);
  return chunks.join("");
}

/**
 * Count words in normalized text.
 * @param {string} text
 */
export function countWords(text) {
  const normalized = normalizeParagraphForMatch(text);
  if (!normalized) return 0;
  return normalized.split(" ").filter(Boolean).length;
}

/**
 * Compare authoritative essay paragraphs against Google Doc plain text.
 * @param {{ essayText: string, documentText: string }} params
 */
export function compareEssayToGoogleDocText({ essayText, documentText }) {
  const checkedAt = new Date().toISOString();
  const paragraphs = splitEssayIntoParagraphs(essayText);
  const expectedParagraphCount = paragraphs.length;
  const expectedWordCount = countWords(essayText);
  const documentWordCount = countWords(documentText);

  if (!essayText?.trim()) {
    return {
      status: SUBMISSION_DOC_VERIFICATION_STATUS.MISSING_ESSAY,
      verified: false,
      expectedParagraphCount: 0,
      matchedParagraphCount: 0,
      firstMissingParagraphIndex: null,
      expectedWordCount: 0,
      documentWordCount,
      checkedAt,
    };
  }

  if (expectedParagraphCount === 0) {
    return {
      status: SUBMISSION_DOC_VERIFICATION_STATUS.MISSING_ESSAY,
      verified: false,
      expectedParagraphCount: 0,
      matchedParagraphCount: 0,
      firstMissingParagraphIndex: null,
      expectedWordCount,
      documentWordCount,
      checkedAt,
    };
  }

  const docNormalized = normalizeParagraphForMatch(documentText);
  if (!docNormalized) {
    return {
      status: SUBMISSION_DOC_VERIFICATION_STATUS.MISMATCH,
      verified: false,
      expectedParagraphCount,
      matchedParagraphCount: 0,
      firstMissingParagraphIndex: 0,
      expectedWordCount,
      documentWordCount: 0,
      checkedAt,
    };
  }

  let cursor = 0;
  let matched = 0;
  let firstMissing = null;

  for (let i = 0; i < paragraphs.length; i += 1) {
    const paragraph = paragraphs[i];
    const idx = docNormalized.indexOf(paragraph, cursor);
    if (idx === -1) {
      firstMissing = i;
      break;
    }
    matched += 1;
    cursor = idx + paragraph.length;
  }

  const verified = matched === expectedParagraphCount && firstMissing === null;

  return {
    status: verified
      ? SUBMISSION_DOC_VERIFICATION_STATUS.VERIFIED
      : SUBMISSION_DOC_VERIFICATION_STATUS.MISMATCH,
    verified,
    expectedParagraphCount,
    matchedParagraphCount: matched,
    firstMissingParagraphIndex: firstMissing,
    expectedWordCount,
    documentWordCount,
    checkedAt,
  };
}

/**
 * Build a safe API/client verification payload (no essay/doc bodies).
 * @param {object} comparison
 * @param {{ documentId?: string | null, url?: string | null }} meta
 */
export function toSafeVerificationResult(comparison, meta = {}) {
  return {
    status: comparison.status,
    verified: !!comparison.verified,
    documentId: meta.documentId || null,
    url: meta.url || null,
    expectedParagraphCount: comparison.expectedParagraphCount ?? null,
    matchedParagraphCount: comparison.matchedParagraphCount ?? null,
    firstMissingParagraphIndex:
      comparison.firstMissingParagraphIndex ?? null,
    expectedWordCount: comparison.expectedWordCount ?? null,
    documentWordCount: comparison.documentWordCount ?? null,
    checkedAt: comparison.checkedAt || new Date().toISOString(),
  };
}

/**
 * Student-facing copy for verification states.
 */
export function getSubmissionDocVerificationMessage(status) {
  switch (status) {
    case SUBMISSION_DOC_VERIFICATION_STATUS.CHECKING:
      return "Checking that your latest essay is in this Google Doc…";
    case SUBMISSION_DOC_VERIFICATION_STATUS.VERIFIED:
      return "Verified: this Google Doc contains your latest essay.";
    case SUBMISSION_DOC_VERIFICATION_STATUS.MISMATCH:
      return "We found that your Google Doc does not match your latest essay.";
    case SUBMISSION_DOC_VERIFICATION_STATUS.MISSING_DOCUMENT:
      return "We could not find your submission Google Doc yet. Create it to continue.";
    case SUBMISSION_DOC_VERIFICATION_STATUS.MISSING_ESSAY:
      return "We could not find your finished essay yet. Go back to Module 7, finish revising, then try again.";
    case SUBMISSION_DOC_VERIFICATION_STATUS.DOCUMENT_UNAVAILABLE:
      return "Your Google Doc could not be opened right now. Tell your teacher if Retry does not help.";
    case SUBMISSION_DOC_VERIFICATION_STATUS.VERIFICATION_ERROR:
      return "We could not check your Google Doc right now. Tap Retry check, or tell your teacher if it keeps happening.";
    default:
      return "";
  }
}

export const SUBMISSION_DOC_VERIFICATION_EXPLAIN =
  "We checked the writing in your Google Doc against the essay you finished in Comp-YouTeacher.";

export const SUBMISSION_DOC_MISMATCH_RECOVERY =
  "This will place your latest essay into the same Google Doc. Review your APA formatting afterward.";
