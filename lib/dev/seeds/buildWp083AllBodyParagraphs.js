/**
 * Pure fixtures for WP-083 — all required body paragraphs.
 * Same shapes production Module 5–7 screens consume.
 */

import { buildBodyParagraphMoveOrder } from "../../artifacts/bodyParagraphSliceContract.js";
import { MODULE5_STAGE } from "../../module5/module5OutlineStageHelpers.js";
import { assembleBodyParagraphProse } from "../../module6/bodyParagraphMoves.js";

export const WP083_THESIS =
  "Although King seeks justice in both texts, he builds credibility, emotion, and logic differently for each audience.";

/**
 * Three distinct body cards: BP1 single evidence, BP2 multi-evidence, BP3 final (no transition).
 */
export function buildWp083ThreeBodyOutlineCards() {
  const cards = [
    {
      sourceParagraphIndex: 0,
      paragraphIndex: 0,
      order: 0,
      bucket: "King builds credibility differently for each audience",
      point: "King builds credibility differently for each audience",
      job: "Prove how King earns trust in each text",
      jobId: "ethos",
      reasoning:
        "Respectful openings and shared history make each audience willing to listen before the demand for justice.",
      evidence: [
        {
          quote: "My Dear Fellow Clergymen",
          observation: "Letter opening treats critics as peers.",
          sourceId: "letter",
          source: "Letter from Birmingham Jail",
        },
      ],
    },
    {
      sourceParagraphIndex: 1,
      paragraphIndex: 1,
      order: 1,
      bucket: "King uses emotion to make delay feel costly",
      point: "King uses emotion to make delay feel costly",
      job: "Show how pathos pushes urgency",
      jobId: "pathos",
      reasoning:
        "Each emotional moment makes waiting feel dangerous rather than patient, which supports the thesis about audience-shaped appeals.",
      evidence: [
        {
          quote: "four little children",
          observation: "Speech dream scene creates hope and responsibility.",
          sourceId: "speech",
          source: "I Have a Dream",
        },
        {
          quote: "Wait has almost always meant Never",
          observation: "Letter turns delay into pain.",
          sourceId: "letter",
          source: "Letter from Birmingham Jail",
        },
      ],
    },
    {
      sourceParagraphIndex: 2,
      paragraphIndex: 2,
      order: 2,
      bucket: "King uses logic to prove action is necessary",
      point: "King uses logic to prove action is necessary",
      job: "Show how logos justifies protest",
      jobId: "logos",
      reasoning:
        "Citing shared ideals and interconnected justice gives a reason protest is duty, not recklessness.",
      evidence: [
        {
          quote: "injustice anywhere is a threat to justice everywhere",
          observation: "Logical link beyond one city.",
          sourceId: "letter",
          source: "Letter from Birmingham Jail",
        },
      ],
    },
  ];

  return cards.map((card, essayOrderIndex) => ({
    ...card,
    moveOrder: buildBodyParagraphMoveOrder({
      includeTransition: essayOrderIndex < cards.length - 1,
      evidenceCount: card.evidence.length,
    }),
  }));
}

/**
 * Two-body assignment outline (wantThirdBucket false path).
 */
export function buildWp083TwoBodyOutlineCards() {
  const three = buildWp083ThreeBodyOutlineCards().slice(0, 2);
  return three.map((card, essayOrderIndex) => ({
    ...card,
    order: essayOrderIndex,
    moveOrder: buildBodyParagraphMoveOrder({
      includeTransition: essayOrderIndex < three.length - 1,
      evidenceCount: Array.isArray(card.evidence) ? card.evidence.length : 1,
    }),
  }));
}

export function buildWp083Module5Outline({ bodyCount = 3 } = {}) {
  const body =
    bodyCount === 2
      ? buildWp083TwoBodyOutlineCards()
      : buildWp083ThreeBodyOutlineCards();
  return {
    thesis: WP083_THESIS,
    body,
    conclusion: {
      summary:
        "King adapts ethos, pathos, and logos so each audience can accept his call for justice.",
      finalThought:
        "Effective persuasion depends on knowing who must be convinced.",
    },
    module5Ui: {
      stage: MODULE5_STAGE.FINALIZE,
      bodyReviewIndex: Math.max(body.length - 1, 0),
      conclusionMicro: 2,
      reviewedBodyIndices: body.map((_, i) => i),
    },
  };
}

/** Synthetic move states keyed by sourceParagraphIndex (not essay order). */
export function buildWp083MovesBySourceIndex() {
  const bp0 = {
    point:
      "King earns trust differently in each text so each audience will listen.",
    evidence_context:
      "In the letter, King opens by addressing the clergymen as colleagues.",
    evidence:
      'He writes, "My Dear Fellow Clergymen," treating critics as peers.',
    explanation:
      "That respectful opening builds ethos before he argues for justice.",
    thesis_connection:
      "This supports the claim that credibility work differs by audience.",
    transition:
      "Next, the essay turns to how emotion makes delay feel urgent.",
  };
  const bp1 = {
    point: "King uses emotion to make the cost of waiting vivid.",
    evidence_context_0: "In the speech, he describes a dream for his children.",
    evidence_0:
      'He asks that his "four little children" be judged by character.',
    explanation_0:
      "That image creates hope and responsibility for a public crowd.",
    evidence_context_1: "In the letter, he confronts the demand to wait.",
    evidence_1: 'He explains that "Wait" has almost always meant "Never."',
    explanation_1:
      "Turning delay into pain pushes clergy to treat timing as moral.",
    thesis_connection:
      "Together these moments show pathos shaped to each audience.",
    transition: "Finally, logic shows why protest is necessary.",
  };
  const bp2 = {
    point: "King uses logic to prove action is necessary, not reckless.",
    evidence_context:
      "He links local injustice to a broader principle of justice.",
    evidence:
      'He argues that "injustice anywhere is a threat to justice everywhere."',
    explanation:
      "That reasoning gives a duty to act beyond one city or one audience.",
    thesis_connection:
      "Logos completes the pattern: tools change, the justice goal stays.",
  };
  return {
    "0": {
      activeMoveId: "transition",
      advancedMode: false,
      advancedProse: "",
      moves: bp0,
      moveOrder: buildBodyParagraphMoveOrder({
        includeTransition: true,
        evidenceCount: 1,
      }),
    },
    "1": {
      activeMoveId: "transition",
      advancedMode: false,
      advancedProse: "",
      moves: bp1,
      moveOrder: buildBodyParagraphMoveOrder({
        includeTransition: true,
        evidenceCount: 2,
      }),
    },
    "2": {
      activeMoveId: "thesis_connection",
      advancedMode: false,
      advancedProse: "",
      moves: bp2,
      moveOrder: buildBodyParagraphMoveOrder({
        includeTransition: false,
        evidenceCount: 1,
      }),
    },
  };
}

export function buildWp083SectionsFromMoves(movesBySourceIndex, bodyCount = 3) {
  const intro =
    "Martin Luther King Jr. wrote and spoke to different audiences during the civil rights movement. " +
    WP083_THESIS;
  const bodies = [];
  for (let i = 0; i < bodyCount; i += 1) {
    const state = movesBySourceIndex[String(i)];
    bodies.push(
      assembleBodyParagraphProse(state.moves, state.moveOrder || [])
    );
  }
  const conclusion =
    "In both texts, King adapts rhetorical tools so each audience can hear the call for justice.";
  return [intro, ...bodies, conclusion];
}
