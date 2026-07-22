/**
 * WP-092 — Semantic guided-APA protocol state (move-id keyed).
 * Legacy module9_checklist / module9_quiz are historical self-report, not proof.
 */

import {
  GUIDED_APA_PROTOCOL_VERSION,
  buildGuidedApaProtocolSignature,
} from "./guidedApaRequirementsContract.js";
import { getGuidedApaMoveIds } from "./guidedApaMoves.js";

export const GUIDED_APA_STATE_SCHEMA_VERSION = 1;

export const GUIDED_APA_MOVE_STATUSES = Object.freeze([
  "not_started",
  "in_progress",
  "looks_correct",
  "needs_help",
  "fixed",
  "not_applicable",
]);

const COMPLETE_STATUSES = new Set(["looks_correct", "fixed", "not_applicable"]);

/**
 * @param {string} moveId
 */
export function createEmptyMoveState(moveId) {
  return {
    moveId: String(moveId || ""),
    status: "not_started",
    lastCheckedAt: null,
    helpCode: null,
    confirmedAgainstDocSignature: null,
  };
}

export function createEmptyGuidedApaProtocolState() {
  const moves = {};
  for (const id of getGuidedApaMoveIds()) {
    moves[id] = createEmptyMoveState(id);
  }
  return {
    schemaVersion: GUIDED_APA_STATE_SCHEMA_VERSION,
    protocolVersion: GUIDED_APA_PROTOCOL_VERSION,
    protocolSignature: buildGuidedApaProtocolSignature(),
    activeMoveId: "page_setup",
    /** @type {string[]} */
    completedMoveOrder: [],
    moves,
    docInspection: {
      status: "not_started",
      itemStatuses: {},
      lastCheckedAt: null,
    },
    pdfInspection: {
      status: "not_started",
      itemStatuses: {},
      lastCheckedAt: null,
    },
    authoritativeDocId: null,
    verificationSignature: null,
    verificationCheckedAt: null,
    returnMoveId: null,
    invalidationReason: null,
    legacy: {
      module8ChecklistHistorical: null,
      module9ChecklistHistorical: null,
      module9QuizHistorical: null,
    },
    /** @type {string|null} */
    updatedAt: null,
  };
}

/**
 * @param {unknown} raw
 */
export function normalizeGuidedApaProtocolState(raw) {
  const empty = createEmptyGuidedApaProtocolState();
  if (!raw || typeof raw !== "object") return empty;
  const src = /** @type {Record<string, any>} */ (raw);
  const moves = { ...empty.moves };
  const rawMoves =
    src.moves && typeof src.moves === "object" ? src.moves : {};
  for (const id of getGuidedApaMoveIds()) {
    const m = rawMoves[id];
    moves[id] = {
      ...createEmptyMoveState(id),
      ...(m && typeof m === "object" ? m : {}),
      moveId: id,
      status: GUIDED_APA_MOVE_STATUSES.includes(m?.status)
        ? m.status
        : "not_started",
    };
  }
  const completedMoveOrder = Array.isArray(src.completedMoveOrder)
    ? src.completedMoveOrder.filter((id) => getGuidedApaMoveIds().includes(id))
    : [];
  const activeMoveId = getGuidedApaMoveIds().includes(src.activeMoveId)
    ? src.activeMoveId
    : firstIncompleteMoveId(moves) || "page_setup";

  return {
    ...empty,
    ...src,
    schemaVersion: GUIDED_APA_STATE_SCHEMA_VERSION,
    protocolVersion: Number(src.protocolVersion) || GUIDED_APA_PROTOCOL_VERSION,
    protocolSignature:
      typeof src.protocolSignature === "string" && src.protocolSignature
        ? src.protocolSignature
        : buildGuidedApaProtocolSignature(),
    activeMoveId,
    completedMoveOrder,
    moves,
    docInspection: {
      ...empty.docInspection,
      ...(src.docInspection && typeof src.docInspection === "object"
        ? src.docInspection
        : {}),
    },
    pdfInspection: {
      ...empty.pdfInspection,
      ...(src.pdfInspection && typeof src.pdfInspection === "object"
        ? src.pdfInspection
        : {}),
    },
    legacy: {
      ...empty.legacy,
      ...(src.legacy && typeof src.legacy === "object" ? src.legacy : {}),
    },
  };
}

function firstIncompleteMoveId(moves) {
  for (const id of getGuidedApaMoveIds()) {
    if (!COMPLETE_STATUSES.has(moves[id]?.status)) return id;
  }
  return null;
}

/**
 * @param {object} state
 */
export function isMoveComplete(state, moveId) {
  const s = normalizeGuidedApaProtocolState(state);
  return COMPLETE_STATUSES.has(s.moves[moveId]?.status);
}

/**
 * @param {object} state
 */
export function areFormattingMovesComplete(state) {
  const s = normalizeGuidedApaProtocolState(state);
  return getGuidedApaMoveIds()
    .filter((id) => id !== "doc_inspection")
    .every((id) => COMPLETE_STATUSES.has(s.moves[id]?.status));
}

/**
 * @param {object} state
 */
export function isDocInspectionComplete(state) {
  const s = normalizeGuidedApaProtocolState(state);
  return (
    COMPLETE_STATUSES.has(s.moves.doc_inspection?.status) ||
    s.docInspection?.status === "looks_correct"
  );
}

/**
 * @param {object} state
 * @param {string} moveId
 * @param {string} status
 * @param {{ helpCode?: string|null, docSignature?: string|null }} [opts]
 */
export function setGuidedApaMoveStatus(state, moveId, status, opts = {}) {
  const s = normalizeGuidedApaProtocolState(state);
  if (!getGuidedApaMoveIds().includes(moveId)) return s;
  if (!GUIDED_APA_MOVE_STATUSES.includes(status)) return s;
  const now = new Date().toISOString();
  s.moves[moveId] = {
    ...s.moves[moveId],
    status,
    lastCheckedAt: now,
    helpCode: opts.helpCode ?? s.moves[moveId].helpCode,
    confirmedAgainstDocSignature:
      opts.docSignature ?? s.verificationSignature ?? s.moves[moveId].confirmedAgainstDocSignature,
  };
  if (COMPLETE_STATUSES.has(status)) {
    if (!s.completedMoveOrder.includes(moveId)) {
      s.completedMoveOrder = [...s.completedMoveOrder, moveId];
    }
    const next = firstIncompleteMoveId(s.moves);
    s.activeMoveId = next || moveId;
  } else if (status === "needs_help") {
    s.returnMoveId = moveId;
    s.activeMoveId = moveId;
  } else {
    s.activeMoveId = moveId;
  }
  s.updatedAt = now;
  return s;
}

/**
 * Invalidate confirmations when Doc or protocol signature changes.
 * Does not delete historical legacy notes.
 * @param {object} state
 * @param {{
 *   protocolSignature?: string,
 *   verificationSignature?: string|null,
 *   authoritativeDocId?: string|null,
 *   reason?: string,
 * }} change
 */
export function invalidateGuidedApaAgainstDocument(state, change = {}) {
  const s = normalizeGuidedApaProtocolState(state);
  const now = new Date().toISOString();
  const reason = change.reason || "document_or_protocol_changed";
  s.invalidationReason = reason;
  if (change.protocolSignature) s.protocolSignature = change.protocolSignature;
  if (change.verificationSignature != null) {
    s.verificationSignature = change.verificationSignature;
  }
  if (change.authoritativeDocId != null) {
    s.authoritativeDocId = change.authoritativeDocId;
  }
  s.verificationCheckedAt = now;

  for (const id of getGuidedApaMoveIds()) {
    const m = s.moves[id];
    if (!COMPLETE_STATUSES.has(m.status)) continue;
    if (
      m.confirmedAgainstDocSignature &&
      s.verificationSignature &&
      m.confirmedAgainstDocSignature === s.verificationSignature
    ) {
      continue;
    }
    s.moves[id] = {
      ...m,
      status: "in_progress",
      lastCheckedAt: now,
    };
    s.completedMoveOrder = s.completedMoveOrder.filter((x) => x !== id);
  }
  s.docInspection = {
    ...s.docInspection,
    status: "not_started",
    lastCheckedAt: now,
  };
  s.activeMoveId = firstIncompleteMoveId(s.moves) || "page_setup";
  s.updatedAt = now;
  return s;
}

/**
 * Adapt legacy checklist booleans into historical notes only — never as proof.
 * @param {object} state
 * @param {{
 *   module8Items?: boolean[]|null,
 *   module9Items?: boolean[]|null,
 *   module9Quiz?: object|null,
 * }} legacy
 */
export function attachLegacyGuidedApaHistory(state, legacy = {}) {
  const s = normalizeGuidedApaProtocolState(state);
  s.legacy = {
    module8ChecklistHistorical: Array.isArray(legacy.module8Items)
      ? { items: legacy.module8Items, adaptedAt: new Date().toISOString(), proof: false }
      : s.legacy.module8ChecklistHistorical,
    module9ChecklistHistorical: Array.isArray(legacy.module9Items)
      ? { items: legacy.module9Items, adaptedAt: new Date().toISOString(), proof: false }
      : s.legacy.module9ChecklistHistorical,
    module9QuizHistorical: legacy.module9Quiz
      ? { ...legacy.module9Quiz, proof: false, notAGate: true }
      : s.legacy.module9QuizHistorical,
  };
  return s;
}

/**
 * @param {object} state
 */
export function getFirstIncompleteGuidedApaMoveId(state) {
  const s = normalizeGuidedApaProtocolState(state);
  return firstIncompleteMoveId(s.moves);
}

/**
 * True when `incoming` should not overwrite `existing` (stale client autosave).
 * Missing incoming timestamps are treated as older than any persisted row.
 * @param {string|null|undefined} incomingUpdatedAt
 * @param {string|null|undefined} existingUpdatedAt
 */
export function isGuidedApaWriteStale(incomingUpdatedAt, existingUpdatedAt) {
  const existingMs = Date.parse(String(existingUpdatedAt || ""));
  if (!Number.isFinite(existingMs)) return false;
  const incomingMs = Date.parse(String(incomingUpdatedAt || ""));
  if (!Number.isFinite(incomingMs)) return true;
  return incomingMs < existingMs;
}

/**
 * Resolve the active protocol surface from durable state + Doc readiness.
 * @param {{
 *   alreadySubmitted?: boolean,
 *   docReady?: boolean,
 *   state?: object,
 * }} input
 */
export function resolveGuidedApaPhase(input = {}) {
  if (input.alreadySubmitted) return "pdf";
  if (!input.docReady) return "handoff";
  const state = normalizeGuidedApaProtocolState(input.state);
  if (!areFormattingMovesComplete(state)) return "move";
  if (!isDocInspectionComplete(state)) return "doc_inspection";
  return "pdf";
}
