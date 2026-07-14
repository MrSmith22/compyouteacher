/**
 * WP-060 — Instructional rhythm (whitespace + semantic chunking).
 * Presentation-only static Tailwind tokens so classes stay discoverable.
 * Distinct from WP-054 (how many layers show): this controls reading rhythm.
 */

/** Major page sections: ~24px mobile / ~32px larger */
export const RHYTHM_PAGE_CLASS = "space-y-6 md:space-y-8";

/** Children stack inside drafting frames after task header */
export const RHYTHM_MAJOR_SECTION_CLASS = "space-y-6 md:space-y-7";

/** Related siblings inside one role (download → checklist → upload) */
export const RHYTHM_WITHIN_SURFACE_CLASS = "space-y-4 md:space-y-5";

/** Soft instructional/support card padding (usable at 390px) */
export const RHYTHM_INSTRUCTION_CARD_CLASS =
  "rounded-lg border border-border-soft/70 bg-surface-soft/40 px-4 py-3 text-left md:px-5 md:py-4";

/** Work-surface card padding (file choose / checklist host) */
export const RHYTHM_WORK_CARD_CLASS =
  "rounded-lg border border-border-soft/70 bg-white px-4 py-3 text-left md:px-5 md:py-4";

/** Action zone separation from preceding content */
export const RHYTHM_ACTION_ZONE_CLASS =
  "mt-4 space-y-3 border-t border-border-soft/60 pt-4";

/** Readable instructional prose measure + line height */
export const RHYTHM_PROSE_CLASS =
  "max-w-3xl text-sm leading-relaxed text-text-primary";

/** Avoid crushing the work column with deep nested horizontal padding */
export const RHYTHM_MOBILE_SAFE_CLASS = "min-w-0 max-w-full overflow-x-hidden";

/**
 * Current Modules 6–9 denseness audit after WP-048–059 (+ WP-060 remedies).
 * nestedCardDepth = meaningful visible surfaces (page → work → inner row).
 * Collapse-disclosed contents are not counted as initially visible blocks.
 */
export const WP060_RHYTHM_AUDIT_MATRIX = Object.freeze([
  {
    id: "m9-upload",
    module: 9,
    state: "PDF download / check / upload",
    visibleTopLevelBlocks: 11,
    activeWorkType: "download + file select + final checklist",
    currentVerticalRhythm: "RHYTHM_PAGE_CLASS",
    longTextRisk: "low (long steps disclosed)",
    cardChunking: "download + upload coaching + selected + final checklist",
    nestedCardDepth: 2,
    compliant: true,
    densityRank: 1,
    remedy: "applied page rhythm + download instructional card",
    changed: true,
  },
  {
    id: "m7-read-aloud-post",
    module: 7,
    state: "Read aloud after recording (essay + recorder + observation)",
    visibleTopLevelBlocks: 8,
    activeWorkType: "listen + observe",
    currentVerticalRhythm: "RHYTHM_PAGE_CLASS",
    longTextRisk: "moderate (task card short paras)",
    cardChunking: "essay / recording / observation chunks",
    nestedCardDepth: 2,
    compliant: true,
    densityRank: 2,
    remedy: "applied page rhythm + semantic rhythm chunks",
    changed: true,
  },
  {
    id: "m9-apa-lesson",
    module: 9,
    state: "APA learning active concept",
    visibleTopLevelBlocks: 6,
    activeWorkType: "micro teaching + try it",
    currentVerticalRhythm: "RHYTHM_PAGE_CLASS",
    longTextRisk: "moderate short paras",
    cardChunking: "teach / visual / practice / feedback / actions",
    nestedCardDepth: 2,
    compliant: true,
    densityRank: 3,
    remedy: "applied page rhythm + chunk markers (no new outer cards)",
    changed: true,
  },
  {
    id: "m8-format",
    module: 8,
    state: "APA Format checklist",
    visibleTopLevelBlocks: 7,
    activeWorkType: "formatting checklist",
    currentVerticalRhythm: "RHYTHM_WITHIN_SURFACE_CLASS",
    longTextRisk: "low",
    cardChunking: "explanation / checklist / action zone",
    nestedCardDepth: 2,
    compliant: true,
    densityRank: 4,
    remedy: "action zone separation; within-surface spacing",
    changed: true,
  },
  {
    id: "m8-create",
    module: 8,
    state: "Create/Update Google Doc",
    visibleTopLevelBlocks: 7,
    activeWorkType: "verification/recovery",
    currentVerticalRhythm: "prepare RHYTHM_WITHIN_SURFACE_CLASS",
    longTextRisk: "low (extra framing disclosed)",
    cardChunking: "framing separate from WorkingSet recovery",
    nestedCardDepth: 2,
    compliant: true,
    densityRank: 5,
    remedy: "bumped prepare cluster spacing",
    changed: true,
  },
  {
    id: "m6-review",
    module: 6,
    state: "Whole-draft review",
    visibleTopLevelBlocks: 7,
    activeWorkType: "section readiness map",
    currentVerticalRhythm: "frame + review list RHYTHM_WITHIN_SURFACE_CLASS",
    longTextRisk: "low (max-h preview)",
    cardChunking: "per-section rows (not card soup)",
    nestedCardDepth: 2,
    compliant: true,
    densityRank: 6,
    remedy: "review list within-surface spacing",
    changed: true,
  },
  {
    id: "m6-drafting",
    module: 6,
    state: "Introduction / body / conclusion drafting",
    visibleTopLevelBlocks: 7,
    activeWorkType: "textarea prose",
    currentVerticalRhythm: "ModuleSixStepFrame RHYTHM_PAGE_CLASS",
    longTextRisk: "low",
    cardChunking: "JobRightNow + desk + WorkingSet",
    nestedCardDepth: 2,
    compliant: true,
    densityRank: 7,
    remedy: "already compliant — frame tokens standardized only",
    changed: false,
  },
  {
    id: "m7-read-aloud-pre",
    module: 7,
    state: "Read aloud before observation",
    visibleTopLevelBlocks: 7,
    activeWorkType: "essay + recorder",
    currentVerticalRhythm: "RHYTHM_PAGE_CLASS",
    longTextRisk: "moderate",
    cardChunking: "task / essay / recording",
    nestedCardDepth: 2,
    compliant: true,
    densityRank: 8,
    remedy: "same page rhythm as post-playback stack",
    changed: true,
  },
  {
    id: "m7-revision",
    module: 7,
    state: "Introduction / body / conclusion revision",
    visibleTopLevelBlocks: 7,
    activeWorkType: "revision textarea",
    currentVerticalRhythm: "frame compliant",
    longTextRisk: "low",
    cardChunking: "strategy + artifacts + textarea + actions",
    nestedCardDepth: 2,
    compliant: true,
    densityRank: 9,
    remedy: "chunk markers only; spacing already compliant",
    changed: false,
  },
  {
    id: "m9-format",
    module: 9,
    state: "APA formatting checklist",
    visibleTopLevelBlocks: 6,
    activeWorkType: "checklist",
    currentVerticalRhythm: "space-y-4 step surface",
    longTextRisk: "low",
    cardChunking: "checklist is active work; guide disclosed",
    nestedCardDepth: 2,
    compliant: true,
    densityRank: 10,
    remedy: "already compliant",
    changed: false,
  },
  {
    id: "m8-ready",
    module: 8,
    state: "Ready confidence check",
    visibleTopLevelBlocks: 5,
    activeWorkType: "confidence checklist",
    currentVerticalRhythm: "within-surface + action zones",
    longTextRisk: "low",
    cardChunking: "status / confidence / escape / finish",
    nestedCardDepth: 2,
    compliant: true,
    densityRank: null,
    remedy: "status/escape/finish rhythm chunks",
    changed: true,
  },
  {
    id: "m7-final-review",
    module: 7,
    state: "Final essay review",
    visibleTopLevelBlocks: 5,
    activeWorkType: "full essay reading",
    currentVerticalRhythm: "frame compliant",
    longTextRisk: "essay is intentional work",
    cardChunking: "strategy + WorkingSet",
    nestedCardDepth: 2,
    compliant: true,
    densityRank: null,
    remedy: "already compliant",
    changed: false,
  },
  {
    id: "m9-doc",
    module: 9,
    state: "Google Doc open/verify",
    visibleTopLevelBlocks: 5,
    activeWorkType: "recovery/verification",
    currentVerticalRhythm: "step surface; recovery vs reference chunks",
    longTextRisk: "low",
    cardChunking: "doc-recovery distinct from doc-reference",
    nestedCardDepth: 2,
    compliant: true,
    densityRank: null,
    remedy: "already compliant — recovery/reference markers only",
    changed: false,
  },
]);

export function getWp060RankedTopTen() {
  return WP060_RHYTHM_AUDIT_MATRIX.filter(
    (row) => typeof row.densityRank === "number"
  ).sort((a, b) => a.densityRank - b.densityRank);
}

export function getWp060AdditionalAuditedStates() {
  return WP060_RHYTHM_AUDIT_MATRIX.filter((row) => row.densityRank == null);
}

export function getWp060RemediatedOrCompliantTopTen() {
  return getWp060RankedTopTen().every(
    (row) => row.compliant === true || Boolean(row.remedy)
  );
}

export function getWp060ChangedStateIds() {
  return WP060_RHYTHM_AUDIT_MATRIX.filter((row) => row.changed).map((row) => row.id);
}

export function getWp060AlreadyCompliantStateIds() {
  return WP060_RHYTHM_AUDIT_MATRIX.filter(
    (row) => row.compliant && !row.changed
  ).map((row) => row.id);
}

export function rhythmTokenIncludesMobileAndDesktop(token) {
  const text = String(token || "");
  return /\bspace-y-\d+\b/.test(text) && /\bmd:space-y-\d+\b/.test(text);
}

export function rhythmCardPaddingUsableAt390(token) {
  const text = String(token || "");
  return (
    /\bpx-4\b/.test(text) &&
    /\bpy-3\b/.test(text) &&
    !/\bpx-10\b/.test(text) &&
    !/\bpx-12\b/.test(text)
  );
}

export function rhythmProseHasReadableMeasure(token) {
  const text = String(token || "");
  return /\bmax-w-3xl\b/.test(text) && /\bleading-relaxed\b/.test(text);
}

export function rhythmNestedCardDepthOk(row) {
  return Number(row?.nestedCardDepth) <= 2;
}
