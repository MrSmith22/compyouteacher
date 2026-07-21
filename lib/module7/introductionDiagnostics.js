/**
 * WP-082 — Diagnostic revision targeting for Introduction slice.
 * Never mutates student prose. Does not apply body evidence/transition rules.
 */

import {
  diagnoseIntroductionHealth,
  pickHighestLeverageIntroductionSignal,
} from "../artifacts/introductionHealth.js";
import {
  ensureRevisionBaseline,
  applyRevisionCompareState,
} from "./bodyParagraphDiagnostics.js";

export const INTRO_REVISION_TARGET_IDS = Object.freeze({
  GIVE_CONTEXT: "give_context",
  BRIDGE_TO_ARGUMENT: "bridge_to_argument",
  THESIS_DESTINATION: "thesis_destination",
  REMOVE_REPETITION: "remove_repetition",
  DEVELOP: "develop",
});

const SIGNAL_TO_TARGET = Object.freeze({
  missing_context: INTRO_REVISION_TARGET_IDS.GIVE_CONTEXT,
  evidence_before_context: INTRO_REVISION_TARGET_IDS.GIVE_CONTEXT,
  missing_thesis: INTRO_REVISION_TARGET_IDS.THESIS_DESTINATION,
  thesis_meaning_changed: INTRO_REVISION_TARGET_IDS.THESIS_DESTINATION,
  stale_upstream: INTRO_REVISION_TARGET_IDS.THESIS_DESTINATION,
  repeated_thesis_as_background: INTRO_REVISION_TARGET_IDS.REMOVE_REPETITION,
  underdevelopment: INTRO_REVISION_TARGET_IDS.DEVELOP,
});

export const INTRO_REVISION_TARGET_META = Object.freeze({
  [INTRO_REVISION_TARGET_IDS.GIVE_CONTEXT]: {
    id: INTRO_REVISION_TARGET_IDS.GIVE_CONTEXT,
    title: "Give your reader the needed context",
    teach:
      "Open with the essential situation so the reader is ready for your argument.",
  },
  [INTRO_REVISION_TARGET_IDS.BRIDGE_TO_ARGUMENT]: {
    id: INTRO_REVISION_TARGET_IDS.BRIDGE_TO_ARGUMENT,
    title: "Build a clearer bridge to your argument",
    teach:
      "Narrow from background toward the comparison or claim your essay will make.",
  },
  [INTRO_REVISION_TARGET_IDS.THESIS_DESTINATION]: {
    id: INTRO_REVISION_TARGET_IDS.THESIS_DESTINATION,
    title: "Make the thesis the destination of the introduction",
    teach:
      "Lead the reader to your saved thesis. Keep its meaning; refine phrasing if needed.",
  },
  [INTRO_REVISION_TARGET_IDS.REMOVE_REPETITION]: {
    id: INTRO_REVISION_TARGET_IDS.REMOVE_REPETITION,
    title: "Remove repeated ideas",
    teach:
      "Background and thesis should not say the same thing twice. Keep one clear path.",
  },
  [INTRO_REVISION_TARGET_IDS.DEVELOP]: {
    id: INTRO_REVISION_TARGET_IDS.DEVELOP,
    title: "Develop the opening",
    teach:
      "Add the missing move—context, background, bridge, or thesis—without starting over.",
  },
});

function safeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * @param {object} input
 */
export function diagnoseIntroductionRevision(input = {}) {
  const health = diagnoseIntroductionHealth(input);
  const top = pickHighestLeverageIntroductionSignal(health);

  let targetId =
    (top && SIGNAL_TO_TARGET[top.id]) || INTRO_REVISION_TARGET_IDS.DEVELOP;

  if (!safeText(input.assembledProse) || safeText(input.assembledProse).length < 40) {
    targetId = INTRO_REVISION_TARGET_IDS.DEVELOP;
  }

  // Bridge is a useful alternate when thesis is present but path feels abrupt.
  if (
    targetId === INTRO_REVISION_TARGET_IDS.THESIS_DESTINATION &&
    safeText(input.assembledProse).length > 80 &&
    top?.id === "missing_thesis"
  ) {
    // keep thesis destination
  }

  const recommendedTarget =
    INTRO_REVISION_TARGET_META[targetId] ||
    INTRO_REVISION_TARGET_META[INTRO_REVISION_TARGET_IDS.DEVELOP];

  const alternateIds = Object.values(INTRO_REVISION_TARGET_IDS).filter(
    (id) => id !== targetId
  );
  const alternateTargets = alternateIds.map((id) => INTRO_REVISION_TARGET_META[id]);

  return {
    health,
    recommendedTarget,
    alternateTargets,
    inspectLocus: top?.locus || recommendedTarget.id,
    confidenceNote:
      "This suggestion may not fit perfectly. You choose what to revise.",
  };
}

export function getIntroductionRevisionFromDraftMeta(draftMeta) {
  const map = draftMeta?.verticalSlice?.revisionBySectionType;
  if (!map || typeof map !== "object") return null;
  return map.intro ?? null;
}

export function setIntroductionRevisionInDraftMeta(draftMeta, revisionState) {
  const prev = draftMeta && typeof draftMeta === "object" ? { ...draftMeta } : {};
  const verticalSlice = {
    ...(prev.verticalSlice && typeof prev.verticalSlice === "object"
      ? prev.verticalSlice
      : {}),
  };
  const revisionBySectionType = {
    ...(verticalSlice.revisionBySectionType &&
    typeof verticalSlice.revisionBySectionType === "object"
      ? verticalSlice.revisionBySectionType
      : {}),
  };
  revisionBySectionType.intro = revisionState;
  verticalSlice.revisionBySectionType = revisionBySectionType;
  return { ...prev, verticalSlice };
}

export { ensureRevisionBaseline, applyRevisionCompareState };
