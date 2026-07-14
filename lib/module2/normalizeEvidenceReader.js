/**
 * Canonical Module 2 evidence reader (CP-B).
 * Read-only union of tchart_entries + student_observations with alias dedupe.
 * Never writes. T-chart remains the primary compatible write path.
 */

import { parseModule2Observation } from "../parseModule2Observation.js";
import {
  evidenceIdAliases,
  evidenceIdsMatch,
  tchartCanonicalFromRow,
  tchartCanonicalId,
} from "../shared/evidenceIdAliases.js";

export const EVIDENCE_SCHEMA_VERSION = 1;

function safeText(value) {
  if (typeof value === "string") return value.trim();
  if (value == null) return "";
  return String(value).trim();
}

function normalizeSourceType(value) {
  const v = safeText(value).toLowerCase();
  if (v === "letter" || v === "lfbj") return "letter";
  if (v === "speech" || v === "mlk") return "speech";
  return v || "speech";
}

function normalizeAppeal(value) {
  const v = safeText(value).toLowerCase();
  if (["ethos", "pathos", "logos"].includes(v)) return v;
  return v || "";
}

/**
 * @param {unknown} row
 * @returns {object | null}
 */
export function normalizeTchartRecord(row) {
  if (!row || typeof row !== "object") return null;
  try {
    const sourceType = normalizeSourceType(row.type || row.sourceType);
    const appeal = normalizeAppeal(row.category || row.rhetoricalStrategy);
    const canonicalId =
      tchartCanonicalFromRow({ type: sourceType, category: appeal || "note" }) ||
      tchartCanonicalId(row.id) ||
      `tchart:${sourceType}:${appeal || "note"}`;
    const parsed = parseModule2Observation(row.observation);
    const aliases = [...evidenceIdAliases(canonicalId)];

    return {
      id: canonicalId,
      schemaVersion: EVIDENCE_SCHEMA_VERSION,
      sourceType,
      appeal: appeal || null,
      quotation: safeText(row.quote),
      studentObservation: safeText(parsed.main || row.observation),
      audienceNote: safeText(parsed.audience),
      purposeNote: safeText(parsed.purpose),
      originalStorageSource: "tchart_entries",
      aliases,
      updatedAt: row.updated_at || row.created_at || null,
      legacy: false,
      writeCompatible: true,
    };
  } catch {
    return null;
  }
}

/**
 * @param {unknown} row
 * @returns {object | null}
 */
export function normalizeGuidedRecord(row) {
  if (!row || typeof row !== "object") return null;
  try {
    const rawId = row.id != null ? String(row.id) : "";
    if (!rawId) return null;
    const sourceType = normalizeSourceType(
      row.source_type || row.sourceType || row.source_id
    );
    const appeal = normalizeAppeal(row.rhetorical_strategy);
    const id = `guided:${rawId}`;
    const aliases = [...evidenceIdAliases(id)];

    return {
      id,
      schemaVersion: EVIDENCE_SCHEMA_VERSION,
      sourceType,
      appeal: appeal || null,
      quotation: safeText(row.quote),
      studentObservation: safeText(row.student_observation),
      audienceNote: safeText(row.audience_effect),
      purposeNote: safeText(row.purpose_connection),
      originalStorageSource: "student_observations",
      aliases,
      updatedAt: row.updated_at || row.created_at || null,
      legacy: true,
      writeCompatible: false,
      essentialQuestionConnection: safeText(row.essential_question_connection),
    };
  } catch {
    return null;
  }
}

/**
 * Prefer T-chart over guided when both represent the same evidence.
 * @param {object} a
 * @param {object} b
 */
function preferRecord(a, b) {
  if (a.writeCompatible && !b.writeCompatible) return a;
  if (b.writeCompatible && !a.writeCompatible) return b;
  const aTime = Date.parse(a.updatedAt || "") || 0;
  const bTime = Date.parse(b.updatedAt || "") || 0;
  return bTime > aTime ? b : a;
}

/**
 * Alias-aware dedupe so the same evidence never appears twice.
 * @param {object[]} records
 */
export function dedupeEvidenceRecords(records) {
  const list = Array.isArray(records) ? records.filter(Boolean) : [];
  const kept = [];

  for (const record of list) {
    const existingIndex = kept.findIndex((item) =>
      evidenceIdsMatch(item.id, record.id)
    );
    if (existingIndex === -1) {
      kept.push(record);
      continue;
    }
    kept[existingIndex] = preferRecord(kept[existingIndex], record);
  }

  return kept;
}

/**
 * Read-only normalized evidence union.
 * @param {{ tchartRows?: unknown[], guidedRows?: unknown[] }} input
 */
export function normalizeEvidenceReader(input = {}) {
  const tchartRows = Array.isArray(input.tchartRows) ? input.tchartRows : [];
  const guidedRows = Array.isArray(input.guidedRows) ? input.guidedRows : [];

  const fromTchart = tchartRows.map(normalizeTchartRecord).filter(Boolean);
  const fromGuided = guidedRows.map(normalizeGuidedRecord).filter(Boolean);

  return dedupeEvidenceRecords([...fromTchart, ...fromGuided]);
}

/**
 * Filter by source + appeal for matrix cells. Safe with missing fields.
 */
export function filterEvidenceForCell(records, { sourceType, appeal } = {}) {
  const wantedSource = normalizeSourceType(sourceType);
  const wantedAppeal = normalizeAppeal(appeal);
  return (Array.isArray(records) ? records : []).filter((row) => {
    if (!row) return false;
    if (wantedSource && row.sourceType !== wantedSource) return false;
    if (wantedAppeal && row.appeal && row.appeal !== wantedAppeal) return false;
    if (wantedAppeal && !row.appeal) return false;
    return true;
  });
}

/**
 * Presentation shape compatible with Module 3 existing evidence cards.
 * @param {object} record
 * @param {{ sourceTitleForType?: (t: string) => string, sourceLabelForType?: (t: string) => string }} [opts]
 */
export function toModule3EvidenceItem(record, opts = {}) {
  if (!record) return null;
  const labelFn =
    typeof opts.sourceLabelForType === "function"
      ? opts.sourceLabelForType
      : (t) =>
          t === "letter" ? "Letter" : t === "speech" ? "Speech" : "Source";
  const titleFn =
    typeof opts.sourceTitleForType === "function"
      ? opts.sourceTitleForType
      : () => "";
  return {
    id: record.id,
    sourceType: record.sourceType,
    sourceLabel: labelFn(record.sourceType),
    sourceTitle: titleFn(record.sourceType),
    originLabel:
      record.originalStorageSource === "tchart_entries"
        ? "Module 2 T-chart"
        : "Guided observation",
    quote: record.quotation || "",
    observation: record.studentObservation || "",
    audienceEffect: record.audienceNote || "",
    purposeConnection: record.purposeNote || "",
    essentialQuestionConnection: record.essentialQuestionConnection || "",
    tags: [
      record.appeal || "",
      record.originalStorageSource === "tchart_entries" ? "t-chart" : "guided",
    ].filter(Boolean),
    updatedAt: record.updatedAt || "",
    schemaVersion: record.schemaVersion,
    aliases: record.aliases || [],
  };
}

export function normalizeEvidenceForModule3(input = {}, opts = {}) {
  return normalizeEvidenceReader(input)
    .map((record) => toModule3EvidenceItem(record, opts))
    .filter(Boolean);
}

/** Viewing must never write — documented contract for tests. */
export const EVIDENCE_VIEW_IS_READONLY = true;
