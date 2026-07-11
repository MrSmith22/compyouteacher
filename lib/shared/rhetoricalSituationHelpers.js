/**
 * Pure model helpers for RhetoricalSituationGuide.
 * Kept free of React so fallbacks are unit-testable.
 *
 * Fallback contract: when structured rhetoricalSituation data is absent,
 * fall back to the legacy single `audience` / `purpose` strings; when those
 * are also absent, report nothing renderable instead of showing "undefined".
 */

function safeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function safeList(value) {
  return Array.isArray(value)
    ? value.filter((item) => typeof item === "string" && item.trim())
    : [];
}

export function getRhetoricalSituationModel(sourceDefinition = {}) {
  const source = sourceDefinition && typeof sourceDefinition === "object" ? sourceDefinition : {};
  const situation =
    source.rhetoricalSituation && typeof source.rhetoricalSituation === "object"
      ? source.rhetoricalSituation
      : {};

  const legacyAudience = safeText(source.audience);
  const legacyPurpose = safeText(source.purpose);

  const model = {
    sourceType: safeText(source.sourceType),
    label: safeText(source.label),
    title: safeText(source.title),
    form: safeText(situation.form),
    date: safeText(situation.date),
    occasion: safeText(situation.occasion),
    immediateAudience: safeText(situation.immediateAudience) || legacyAudience,
    broaderAudience: safeText(situation.broaderAudience),
    audienceSituation: safeText(situation.audienceSituation),
    purposes: safeList(situation.purposes),
    historicalContext: safeText(situation.historicalContext),
    whyFormMatters: safeText(situation.whyFormMatters),
    authoritativeSources: Array.isArray(situation.authoritativeSources)
      ? situation.authoritativeSources.filter(
          (item) => safeText(item?.name) && safeText(item?.url)
        )
      : [],
    hasStructuredContext: Boolean(
      safeText(situation.immediateAudience) || safeList(situation.purposes).length
    ),
  };

  if (model.purposes.length === 0 && legacyPurpose) {
    model.purposes = [legacyPurpose];
  }

  model.hasRenderableContext = Boolean(
    model.immediateAudience ||
      model.purposes.length ||
      model.historicalContext ||
      model.form
  );

  return model;
}

/** Brief per-source reminder: form, audiences, and up to two purposes. */
export function getCompactSituationSummary(sourceDefinition = {}) {
  const model = getRhetoricalSituationModel(sourceDefinition);

  const audienceLine = [model.immediateAudience, model.broaderAudience]
    .filter(Boolean)
    .join(" Also reaching: ");

  return {
    sourceType: model.sourceType,
    label: model.label,
    title: model.title,
    form: model.form,
    audienceLine,
    purposeLines: model.purposes.slice(0, 2),
    hasRenderableContext: model.hasRenderableContext,
  };
}

export function getSituationComparisonModel(comparison = {}) {
  const value = comparison && typeof comparison === "object" ? comparison : {};
  const shared = safeList(value.shared);
  const different = safeList(value.different);

  return {
    shared,
    different,
    caveat: safeText(value.caveat),
    hasRenderableComparison: shared.length > 0 || different.length > 0,
  };
}

/**
 * Compact Form / Audience / Purpose footer for a quotation card.
 * Prefers the assignment's compactCue; otherwise derives from structured
 * fields / legacy audience + purpose. Never invents content when nothing exists.
 */
export function getQuotationSituationFooter(sourceDefinition = {}) {
  const model = getRhetoricalSituationModel(sourceDefinition);
  const situation =
    sourceDefinition?.rhetoricalSituation &&
    typeof sourceDefinition.rhetoricalSituation === "object"
      ? sourceDefinition.rhetoricalSituation
      : {};
  const cue =
    situation.compactCue && typeof situation.compactCue === "object"
      ? situation.compactCue
      : {};

  const form = safeText(cue.form) || safeText(model.form);
  const audience =
    safeText(cue.audience) ||
    [model.immediateAudience, model.broaderAudience].filter(Boolean).join(" · ");
  const purpose =
    safeText(cue.purpose) ||
    (model.purposes.length > 0 ? model.purposes.slice(0, 2).join(" ") : "");

  if (!form && !audience && !purpose) {
    return null;
  }

  return {
    sourceType: model.sourceType,
    label: model.label,
    title: model.title,
    form,
    audience,
    purpose,
  };
}
