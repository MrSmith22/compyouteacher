/**
 * WP-049 — select the smallest task-relevant artifact set for Modules 6–7.
 * Pure: no mutation, no API access, no rewriting of student text.
 */

const EMPTY = Object.freeze({ items: [] });

function trimText(value) {
  return String(value || "").trim();
}

function copyLines(values) {
  return values.map((line) => String(line)).filter((line) => trimText(line));
}

/**
 * Match a Module 4 paragraph plan to an outline body slot.
 * Prefer the card's durable sourceParagraphIndex when provided (WP-083).
 * Fall back to essay-order bodyIndex only when plans lack explicit links.
 * Never invent links across mismatched indices.
 *
 * @param {unknown[]} paragraphPlans
 * @param {number} bodyIndex — essay-order body index
 * @param {{ sourceParagraphIndex?: number | null }} [opts]
 */
export function matchParagraphPlan(paragraphPlans, bodyIndex, opts = {}) {
  if (!Array.isArray(paragraphPlans) || typeof bodyIndex !== "number" || bodyIndex < 0) {
    return null;
  }

  const hasExplicitLinks = paragraphPlans.some((plan) => {
    const src = plan?.sourceParagraphIndex ?? plan?.paragraphIndex;
    return typeof src === "number";
  });

  if (hasExplicitLinks) {
    const durableKey =
      typeof opts.sourceParagraphIndex === "number"
        ? opts.sourceParagraphIndex
        : bodyIndex;
    return (
      paragraphPlans.find((plan) => {
        const src = plan?.sourceParagraphIndex ?? plan?.paragraphIndex;
        return src === durableKey;
      }) || null
    );
  }

  return paragraphPlans[bodyIndex] || null;
}

function makeItem({ id, kind, label, artifactType, lines }) {
  const clean = copyLines(lines);
  if (!clean.length) return null;
  return { id, kind, label, artifactType, lines: clean };
}

function thesisItem(thesis) {
  const text = trimText(thesis);
  if (!text) return null;
  return makeItem({
    id: "thesis",
    kind: "thesis",
    label: "Your thesis",
    artifactType: "thesis",
    lines: [text],
  });
}

function selectBodyItems({ thesis, outline, paragraphPlans, bodyIndex }) {
  const items = [];
  const t = thesisItem(thesis);
  if (t) items.push(t);

  const body = Array.isArray(outline?.body) ? outline.body : [];
  const card =
    typeof bodyIndex === "number" && bodyIndex >= 0 ? body[bodyIndex] || null : null;
  const sourceParagraphIndex =
    typeof card?.sourceParagraphIndex === "number"
      ? card.sourceParagraphIndex
      : typeof card?.paragraphIndex === "number"
        ? card.paragraphIndex
        : null;
  const plan = matchParagraphPlan(paragraphPlans, bodyIndex, {
    sourceParagraphIndex,
  });

  const point =
    trimText(card?.point) ||
    trimText(card?.bucket) ||
    trimText(plan?.claim) ||
    "";
  const claimItem = makeItem({
    id: "active-claim",
    kind: "claim",
    label: "This paragraph’s point",
    artifactType: "claim",
    lines: point ? [point] : [],
  });
  if (claimItem) items.push(claimItem);

  const outlinePoints = Array.isArray(card?.points)
    ? card.points.map((p) => trimText(p)).filter(Boolean)
    : [];
  const pointsItem = makeItem({
    id: "outline-points",
    kind: "points",
    label: "Outline points for this paragraph",
    artifactType: "outline",
    lines: outlinePoints,
  });
  if (pointsItem) items.push(pointsItem);

  const outlineEvidence = Array.isArray(card?.evidence) ? card.evidence : [];
  const evidenceLines = [];
  if (outlineEvidence.length > 0) {
    for (const ev of outlineEvidence) {
      const quote = trimText(ev?.quote);
      const observation = trimText(ev?.observation);
      if (quote) evidenceLines.push(`“${quote}”`);
      if (observation) evidenceLines.push(observation);
    }
  } else if (plan && Array.isArray(plan.evidenceSnippets)) {
    for (const snippet of plan.evidenceSnippets) {
      const quote = trimText(snippet?.quote);
      const observation = trimText(snippet?.observation);
      if (quote) evidenceLines.push(`“${quote}”`);
      if (observation) evidenceLines.push(observation);
    }
  }
  const evidenceItem = makeItem({
    id: "active-evidence",
    kind: "evidence",
    label: "Evidence for this paragraph",
    artifactType: "evidence",
    lines: evidenceLines,
  });
  if (evidenceItem) items.push(evidenceItem);

  const reasoning =
    trimText(card?.reasoning) || trimText(plan?.reasoning) || "";
  const reasoningItem = makeItem({
    id: "active-reasoning",
    kind: "reasoning",
    label: "Your reasoning notes",
    artifactType: "outline",
    lines: reasoning ? [reasoning] : [],
  });
  if (reasoningItem) items.push(reasoningItem);

  return { items };
}

function selectConclusionItems({ thesis, outline }) {
  const items = [];
  const t = thesisItem(thesis);
  if (t) items.push(t);

  const summary = trimText(outline?.conclusion?.summary);
  const finalThought = trimText(outline?.conclusion?.finalThought);
  const lines = [];
  if (summary) lines.push(summary);
  if (finalThought) lines.push(finalThought);
  const conclusionItem = makeItem({
    id: "conclusion-plan",
    kind: "conclusion",
    label: "Conclusion plan",
    artifactType: "outline",
    lines,
  });
  if (conclusionItem) items.push(conclusionItem);

  return { items };
}

function selectIntroItems({ thesis, assignmentQuestion }) {
  const items = [];
  const t = thesisItem(thesis);
  if (t) {
    items.push({
      ...t,
      label: "Where you’re leading your reader",
    });
  }
  const q = trimText(assignmentQuestion);
  if (q) {
    const assignmentItem = makeItem({
      id: "assignment-question",
      kind: "assignment",
      label: "Assignment question",
      artifactType: "source",
      lines: [q],
    });
    if (assignmentItem) items.push(assignmentItem);
  }
  return { items };
}

function selectCompactThesis({ thesis }) {
  const t = thesisItem(thesis);
  return t ? { items: [t] } : EMPTY;
}

/**
 * @param {object} args
 * @param {string} args.stepType intro|body|conclusion|review|read-aloud|final-review
 * @param {number} [args.bodyIndex]
 * @param {string} [args.thesis]
 * @param {object|null} [args.outline]
 * @param {Array} [args.paragraphPlans]
 * @param {string} [args.assignmentQuestion]
 * @returns {{ items: Array<{id:string,kind:string,label:string,artifactType:string,lines:string[]}> }}
 */
export function selectTaskRelevantArtifacts({
  stepType,
  bodyIndex = -1,
  thesis = "",
  outline = null,
  paragraphPlans = [],
  assignmentQuestion = "",
} = {}) {
  switch (stepType) {
    case "intro":
      return selectIntroItems({ thesis, assignmentQuestion });
    case "body":
      return selectBodyItems({ thesis, outline, paragraphPlans, bodyIndex });
    case "conclusion":
      return selectConclusionItems({ thesis, outline });
    case "review":
    case "final-review":
      return selectCompactThesis({ thesis });
    case "read-aloud":
      return EMPTY;
    default:
      return EMPTY;
  }
}
