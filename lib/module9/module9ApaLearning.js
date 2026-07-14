/**
 * WP-006 / WP-038 — Assignment-specific APA learning content (pure).
 * Distinguishes APA rules, APA options, and this assignment’s requirements.
 */

export const MODULE9_LAYOUT_CONTRACT = Object.freeze({
  viewports: [320, 390, 768, 1024, 1440],
  mobile: {
    minActionTargetPx: 44,
    noHorizontalOverflow: true,
  },
  contentMax: "lg",
});

export const MODULE9_APA_JOURNEY = Object.freeze([
  "Learn the APA moves you’ll use",
  "Open the paper you prepared",
  "Format your paper with the APA guide",
  "Download, check, and submit your PDF",
]);

export const MODULE9_APA_ENTRY = Object.freeze({
  title: "Your essay is written. Now prepare it for your reader and teacher.",
  lead:
    "First, you’ll learn the APA choices this assignment requires. You’ll see one example, try one small question, and receive help before moving on. Then you’ll apply those choices to your Google Doc.",
  framing:
    "APA formatting changes how the paper looks on the page—not your ideas. You are not rewriting your essay.",
});

export const MODULE9_APA_HANDOFF = Object.freeze({
  title: "You’re ready to format your Google Doc",
  body:
    "You have practiced the APA choices this assignment uses. Keep the Quick Guide open while you prepare your Google Doc.",
});

/** Optional secondary resources — never the primary instruction. */
export const MODULE9_APA_SECONDARY_RESOURCES = Object.freeze([
  {
    id: "apa-sample",
    label: "APA Style sample student paper (optional)",
    href: "https://apastyle.apa.org/style-grammar-guidelines/paper-format/student-annotated",
  },
  {
    id: "owl",
    label: "Purdue OWL APA guide (optional)",
    href: "https://owl.purdue.edu/owl/research_and_citation/apa_style/apa_formatting_and_style_guide/general_format.html",
  },
]);

/**
 * @typedef {object} Module9ApaOption
 * @property {string} id
 * @property {string} label
 * @property {boolean} correct
 * @property {string} feedback — teaching explanation when this option is chosen
 */

/**
 * @typedef {object} Module9ApaConcept
 * @property {string} id
 * @property {string} title
 * @property {string} whatToDo
 * @property {string} whyItMatters
 * @property {string} assignmentRule
 * @property {"apa-rule"|"apa-option"|"assignment-requirement"} ruleKind
 * @property {string} visualId
 * @property {string} visualCaption
 * @property {string} visualAlt
 * @property {string} practicePrompt
 * @property {Module9ApaOption[]} options
 * @property {string} checklistWording
 * @property {string} guideSummary
 */

/** @type {readonly Module9ApaConcept[]} */
export const MODULE9_APA_CONCEPTS = Object.freeze([
  Object.freeze({
    id: "formatting-vs-rewriting",
    title: "Formatting versus rewriting",
    whatToDo:
      "Change how the paper looks—font, spacing, margins, title page, citations, and references. Leave your ideas and sentences alone unless a teacher asks you to revise.",
    whyItMatters:
      "Your Module 6–8 work already finished the essay. Formatting helps a reader and teacher navigate that finished writing.",
    assignmentRule:
      "For this assignment, APA work is presentation only. Do not rewrite essay content while you format.",
    ruleKind: "assignment-requirement",
    visualId: "formatting-vs-rewriting",
    visualCaption:
      "Same essay ideas; only the page setup and citation style change.",
    visualAlt:
      "Two paper sketches: one labeled Ideas stay the same, the other labeled Appearance changes for APA.",
    practicePrompt:
      "While you format this paper in APA style, what should you do with the essay you already wrote?",
    options: Object.freeze([
      Object.freeze({
        id: "rewrite",
        label: "Rewrite paragraphs so the paper sounds more formal.",
        correct: false,
        feedback:
          "Not quite. Formatting does not ask you to invent new ideas or rewrite for “more formal” sounding prose. Keep the essay you already finished and change how it is presented.",
      }),
      Object.freeze({
        id: "presentation",
        label: "Keep your ideas and change how the paper looks on the page.",
        correct: true,
        feedback:
          "Yes. APA formatting is about presentation—title page, font, spacing, page numbers, citations, and references—so a reader can follow your finished essay.",
      }),
      Object.freeze({
        id: "delete",
        label: "Delete body paragraphs and start a new draft.",
        correct: false,
        feedback:
          "That would be rewriting, not formatting. Your essay content is already complete; Module 9 prepares that paper for submission.",
      }),
    ]),
    checklistWording:
      "I am formatting presentation only—not rewriting my essay ideas.",
    guideSummary:
      "APA here changes appearance, not the argument you already wrote.",
  }),

  Object.freeze({
    id: "page-setup",
    title: "Page setup: font, spacing, and margins",
    whatToDo:
      "Set the whole document to the required font, double spacing, and one-inch margins before you fine-tune the title page.",
    whyItMatters:
      "Consistent page setup makes the paper readable and leaves room for teacher comments.",
    assignmentRule:
      "For this assignment, use Times New Roman, 12 point; double-space the whole paper (including references); and set one-inch margins on all sides. APA 7 also allows other fonts (for example Arial 11 or Calibri 11), but your teacher requires Times New Roman 12 here.",
    ruleKind: "assignment-requirement",
    visualId: "page-setup",
    visualCaption:
      "Assignment setup: Times New Roman 12, double spacing, 1-inch margins.",
    visualAlt:
      "Miniature paper showing one-inch margins, double-spaced body lines, and a font label Times New Roman 12.",
    practicePrompt:
      "Which page setup matches this assignment’s APA requirements?",
    options: Object.freeze([
      Object.freeze({
        id: "tnr12",
        label: "Times New Roman 12, double spaced, one-inch margins",
        correct: true,
        feedback:
          "Correct for this assignment. Your teacher requires Times New Roman 12 with double spacing and one-inch margins. Other fonts can be allowed by APA 7 in general, but not for this paper.",
      }),
      Object.freeze({
        id: "calibri8",
        label: "Calibri 8, single spaced, half-inch margins",
        correct: false,
        feedback:
          "That setup is too small and too tight. For this assignment use Times New Roman 12, double spacing, and one-inch margins so the paper is readable.",
      }),
      Object.freeze({
        id: "arial14",
        label: "Arial 14, 1.5 spacing, two-inch margins",
        correct: false,
        feedback:
          "APA-looking choices still have to match this assignment. Use Times New Roman 12, double spacing, and one-inch margins.",
      }),
    ]),
    checklistWording:
      "Font: Times New Roman, size 12. Spacing: double spaced everywhere, including references. Margins: one inch on all sides.",
    guideSummary:
      "Assignment page setup: Times New Roman 12, double space, 1\" margins.",
  }),

  Object.freeze({
    id: "title-page",
    title: "Title page",
    whatToDo:
      "Put the title page first. Center the paper title, your name, school, course, teacher/instructor, and due date in the order your template shows.",
    whyItMatters:
      "The title page tells the teacher whose paper this is and what course it belongs to before the essay begins.",
    assignmentRule:
      "For this student paper, the title page is page 1 and includes title, student name, school/institution, course, teacher/instructor, and due date.",
    ruleKind: "assignment-requirement",
    visualId: "title-page",
    visualCaption:
      "Student title page elements centered on page 1 (title through due date).",
    visualAlt:
      "Miniature title page listing paper title, student name, school, course, teacher, and due date.",
    practicePrompt: "Which set of information belongs on this assignment’s APA title page?",
    options: Object.freeze([
      Object.freeze({
        id: "full",
        label: "Title, your name, school, course, teacher, and due date",
        correct: true,
        feedback:
          "Yes. A student title page identifies the paper and the student clearly before the essay starts.",
      }),
      Object.freeze({
        id: "title-only",
        label: "Only the title and your name",
        correct: false,
        feedback:
          "Those two pieces are not enough for this assignment. Also include school, course, teacher, and due date.",
      }),
      Object.freeze({
        id: "toc",
        label: "Title, table of contents, and date",
        correct: false,
        feedback:
          "Student APA papers for this assignment do not use a table of contents on the title page. Include title, name, school, course, teacher, and due date.",
      }),
    ]),
    checklistWording:
      "Title page: includes title, your name, school, course, teacher, and date in the correct spots.",
    guideSummary:
      "Title page first: title, name, school, course, teacher, due date.",
  }),

  Object.freeze({
    id: "page-numbers",
    title: "Page numbers",
    whatToDo:
      "Put a page number in the top-right header on every page, starting with the title page as page 1.",
    whyItMatters:
      "Page numbers help your teacher find places to comment and keep printed pages in order.",
    assignmentRule:
      "For this student paper, use a page number in the top-right corner of every page. Do not add a running head title in the header (that pattern is for many professional papers, not this student assignment).",
    ruleKind: "assignment-requirement",
    visualId: "page-numbers",
    visualCaption: "Student paper header: page number only, top right.",
    visualAlt:
      "Miniature paper with the number 1 in the top-right corner and no running title in the header.",
    practicePrompt:
      "For this student APA paper, what belongs in the page header?",
    options: Object.freeze([
      Object.freeze({
        id: "page-only",
        label: "The page number in the top-right corner",
        correct: true,
        feedback:
          "Correct. Student papers for this assignment use a page number in the top right. A shortened title running head is not required here.",
      }),
      Object.freeze({
        id: "title-only",
        label: "The paper title only, with no page number",
        correct: false,
        feedback:
          "A title alone in the header is not what this assignment needs. Place the page number in the top-right corner on every page.",
      }),
      Object.freeze({
        id: "title-and-page",
        label: "Title and page number, both right-aligned",
        correct: false,
        feedback:
          "That mixes patterns. Professional papers may use a running head, but this student assignment asks for the page number only (top right).",
      }),
    ]),
    checklistWording:
      "Page numbers: page number in the top right corner of every page.",
    guideSummary: "Header: page number only, top right, on every page.",
  }),

  Object.freeze({
    id: "in-text-citations",
    title: "In-text citations",
    whatToDo:
      "When you use a source idea or quotation, credit it with an author–date citation in parentheses.",
    whyItMatters:
      "Citations show readers which ideas come from your sources and which are your own analysis.",
    assignmentRule:
      "Use the author–date pattern, such as (King, 1963). Keep the comma between author and year.",
    ruleKind: "apa-rule",
    visualId: "in-text-citations",
    visualCaption: "Author–date in-text citation: (King, 1963).",
    visualAlt:
      "Sentence ending with a parenthetical citation reading King comma 1963 inside parentheses.",
    practicePrompt: "Which choice is a correct APA author–date in-text citation?",
    options: Object.freeze([
      Object.freeze({
        id: "parens",
        label: "(Smith, 2020)",
        correct: true,
        feedback:
          "Yes. APA in-text citations typically use parentheses with the author and year separated by a comma.",
      }),
      Object.freeze({
        id: "brackets",
        label: "[Smith 2020]",
        correct: false,
        feedback:
          "Square brackets and a missing comma are not the standard APA author–date form. Use parentheses like (Smith, 2020).",
      }),
      Object.freeze({
        id: "colon",
        label: "Smith, 2020:",
        correct: false,
        feedback:
          "That punctuation pattern is not APA’s usual parenthetical citation. Use (Smith, 2020) after the borrowed idea or quotation.",
      }),
    ]),
    checklistWording:
      "In-text citations use author–date form, such as (King, 1963).",
    guideSummary: "In text: author–date, for example (King, 1963).",
  }),

  Object.freeze({
    id: "references-page",
    title: "References page",
    whatToDo:
      "Start References on a new page after the essay. List sources alphabetically by author last name, double-spaced, with a hanging indent.",
    whyItMatters:
      "The references list lets a reader find every source you cited and matches your in-text credits.",
    assignmentRule:
      "For this assignment: new page titled References; alphabetical order; double spacing; hanging indent (first line flush left, following lines indented).",
    ruleKind: "apa-rule",
    visualId: "references-page",
    visualCaption:
      "References on a new page, A–Z order, double-spaced, hanging indent.",
    visualAlt:
      "Miniature references page with hanging-indent entries in alphabetical order.",
    practicePrompt: "How should the References page be set up for this paper?",
    options: Object.freeze([
      Object.freeze({
        id: "apa-refs",
        label: "New page, alphabetical order, double spaced, hanging indent",
        correct: true,
        feedback:
          "Yes. Readers expect References on its own page, A–Z by author, double-spaced, with hanging indents.",
      }),
      Object.freeze({
        id: "numbered",
        label: "Same page as the conclusion, numbered list, single spaced",
        correct: false,
        feedback:
          "References need a new page, alphabetical order (not numbered), and double spacing with a hanging indent.",
      }),
      Object.freeze({
        id: "chrono",
        label: "New page in chronological order by publication year",
        correct: false,
        feedback:
          "Order References alphabetically by author last name, not by year. Keep double spacing and a hanging indent.",
      }),
    ]),
    checklistWording:
      "References page: starts on a new page, entries in alphabetical order by author last name, double spaced, hanging indent.",
    guideSummary:
      "References: new page, A–Z, double spaced, hanging indent.",
  }),

  Object.freeze({
    id: "abstract-exceptions",
    title: "Abstracts and assignment exceptions",
    whatToDo:
      "Follow your teacher’s directions about an abstract. Many student papers do not include one.",
    whyItMatters:
      "An abstract is a short summary used when a teacher or journal asks for it—not an automatic part of every student essay.",
    assignmentRule:
      "For this assignment, do not add an abstract unless your teacher specifically requires one. Typical order without an abstract: Title Page → Essay body → References.",
    ruleKind: "assignment-requirement",
    visualId: "abstract-exceptions",
    visualCaption:
      "This assignment: Title Page → Body → References (no abstract unless required).",
    visualAlt:
      "Flow diagram showing Title Page, then Body, then References, with Abstract marked only if required.",
    practicePrompt:
      "Do student APA papers for this course always need an abstract?",
    options: Object.freeze([
      Object.freeze({
        id: "always",
        label: "Yes, every student APA paper must include an abstract.",
        correct: false,
        feedback:
          "Not for this assignment. An abstract is required only when the teacher or assignment asks for one.",
      }),
      Object.freeze({
        id: "if-required",
        label: "No—only if the teacher or assignment requires it.",
        correct: true,
        feedback:
          "Correct. Follow the assignment. Here, prepare Title Page → Body → References unless your teacher asks for an abstract.",
      }),
      Object.freeze({
        id: "length",
        label: "Yes, whenever the paper is longer than two pages.",
        correct: false,
        feedback:
          "Length alone does not create an abstract requirement. Use an abstract only when the teacher or assignment asks for one.",
      }),
    ]),
    checklistWording:
      "Abstract: included only if the teacher requires it (this assignment usually skips it).",
    guideSummary:
      "No abstract unless your teacher requires one; then Title Page → Body → References.",
  }),
]);

export const MODULE9_APA_QUIZ_TOTAL = MODULE9_APA_CONCEPTS.length;

export function getModule9ApaConcept(id) {
  return MODULE9_APA_CONCEPTS.find((c) => c.id === id) || null;
}

export function getModule9ApaConceptAt(index) {
  return MODULE9_APA_CONCEPTS[index] || null;
}

export function getCorrectOption(concept) {
  return concept?.options?.find((o) => o.correct) || null;
}

export function evaluateApaResponse(concept, optionId) {
  if (!concept || !optionId) {
    return {
      answered: false,
      correct: false,
      option: null,
      feedback: "",
    };
  }
  const option = concept.options.find((o) => o.id === optionId) || null;
  if (!option) {
    return {
      answered: false,
      correct: false,
      option: null,
      feedback: "",
    };
  }
  return {
    answered: true,
    correct: Boolean(option.correct),
    option,
    feedback: option.feedback,
  };
}

/**
 * Score definition: count of concepts whose first recorded attempt was correct.
 * Later retries may change the selected option for learning, but firstAttemptCorrect is frozen.
 */
export function buildEmptyApaLessonState(concepts = MODULE9_APA_CONCEPTS) {
  return {
    conceptIndex: 0,
    responses: Object.fromEntries(
      concepts.map((c) => [
        c.id,
        {
          selectedOptionId: "",
          firstAttemptOptionId: "",
          firstAttemptCorrect: null,
          feedbackSeen: false,
        },
      ])
    ),
    completed: false,
  };
}

export function recordApaAttempt(state, conceptId, optionId, concepts = MODULE9_APA_CONCEPTS) {
  const concept = concepts.find((c) => c.id === conceptId);
  const evaluation = evaluateApaResponse(concept, optionId);
  if (!evaluation.answered) return state;

  const prev = state.responses[conceptId] || {
    selectedOptionId: "",
    firstAttemptOptionId: "",
    firstAttemptCorrect: null,
    feedbackSeen: false,
  };
  const isFirst = !prev.firstAttemptOptionId;
  return {
    ...state,
    responses: {
      ...state.responses,
      [conceptId]: {
        selectedOptionId: optionId,
        firstAttemptOptionId: isFirst ? optionId : prev.firstAttemptOptionId,
        firstAttemptCorrect: isFirst
          ? evaluation.correct
          : prev.firstAttemptCorrect,
        feedbackSeen: true,
      },
    },
  };
}

export function canContinueApaConcept(state, conceptId) {
  return Boolean(state?.responses?.[conceptId]?.feedbackSeen);
}

export function advanceApaConcept(state, concepts = MODULE9_APA_CONCEPTS) {
  const nextIndex = Math.min(state.conceptIndex + 1, concepts.length - 1);
  const completed = state.conceptIndex >= concepts.length - 1;
  if (completed) {
    return { ...state, completed: true };
  }
  return { ...state, conceptIndex: nextIndex };
}

export function retreatApaConcept(state) {
  return {
    ...state,
    conceptIndex: Math.max(0, state.conceptIndex - 1),
    completed: false,
  };
}

export function summarizeApaLesson(state, concepts = MODULE9_APA_CONCEPTS) {
  let score = 0;
  const details = concepts.map((concept, index) => {
    const response = state.responses[concept.id] || {};
    const correct = response.firstAttemptCorrect === true;
    if (correct) score += 1;
    return {
      index,
      conceptId: concept.id,
      correct,
      selectedOptionId: response.selectedOptionId || "",
      firstAttemptOptionId: response.firstAttemptOptionId || "",
    };
  });
  return {
    score,
    total: concepts.length,
    details,
    allFeedbackSeen: concepts.every(
      (c) => state.responses[c.id]?.feedbackSeen === true
    ),
  };
}

/** Checklist strings for Module 9 confirmation UI (assignment-facing). */
export function getModule9FormattingChecklistItems() {
  return [
    "Font: Times New Roman, size 12.",
    "Spacing: double spaced everywhere, including references.",
    "Margins: one inch on all sides.",
    "Title page: includes title, your name, school, course, teacher, and date in the correct spots.",
    "Page numbers: page number in the top right corner of every page.",
    "References page: starts on a new page, entries in alphabetical order by author last name, double spaced.",
  ];
}

export function getModule9ApaQuickGuideSections(concepts = MODULE9_APA_CONCEPTS) {
  return concepts.map((c) => ({
    id: c.id,
    title: c.title,
    summary: c.guideSummary,
    whatToDo: c.whatToDo,
    whyItMatters: c.whyItMatters,
    assignmentRule: c.assignmentRule,
    checklistWording: c.checklistWording,
    visualId: c.visualId,
    visualCaption: c.visualCaption,
    visualAlt: c.visualAlt,
  }));
}

/** Forbidden legacy patterns that must not reappear as authoritative teaching. */
export const MODULE9_APA_FORBIDDEN_CLAIMS = Object.freeze([
  "What is the correct font for APA Style papers?",
  "Title Page → Abstract → Body → References",
  "Submit Quiz",
  "fix your mistakes",
]);

/** Legacy wrong “correct” answer that must not be marked correct anymore. */
export const MODULE9_APA_LEGACY_WRONG_CORRECT = Object.freeze([
  "Title and page number, right aligned",
]);

export function conceptHasTeachingBeforePractice(concept) {
  return Boolean(
    concept?.title &&
      concept?.whatToDo &&
      concept?.whyItMatters &&
      concept?.assignmentRule &&
      concept?.visualId &&
      concept?.visualCaption &&
      concept?.visualAlt &&
      concept?.practicePrompt &&
      Array.isArray(concept?.options) &&
      concept.options.length >= 2
  );
}

export function everyOptionHasTeachingFeedback(concept) {
  return (concept?.options || []).every(
    (o) => typeof o.feedback === "string" && o.feedback.trim().length > 20
  );
}
