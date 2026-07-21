/**
 * Module 4 → Module 5 outline mapper (CP-F).
 * Additive paragraph-plan artifacts; preserves Module 6 bucket/points shape.
 */

import {
  decodeCustomParagraphJob,
  isCustomParagraphJob,
  labelForParagraphJob,
} from "./module4PointJobHelpers.js";
import {
  isParagraphMechanicallyPlanned,
  REASONING_MIN_CHARS,
  POINT_MIN_CHARS,
  CUSTOM_JOB_MIN_CHARS,
} from "./module4ValidityHelpers.js";
import { buildBodyParagraphMoveOrder } from "../artifacts/bodyParagraphSliceContract.js";

/** Stable key for matching Module 2 rows (id when present, else category|type). */
export function tchartEntryKey(row) {
  if (row?.id != null && String(row.id).length > 0) return String(row.id);
  return `${row?.category ?? ""}|${row?.type ?? ""}`;
}

function safeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Student-facing job label. Custom jobs never expose the `custom:` prefix.
 */
export function jobLabelForOutline(paragraphRole) {
  const role = safeText(paragraphRole);
  if (!role) return "";
  if (isCustomParagraphJob(role)) {
    return decodeCustomParagraphJob(role) || "";
  }
  return labelForParagraphJob(role) || role;
}

export function resolveEvidenceSnippetsForBucket(bucket, tchartRows = []) {
  const keyToRow = {};
  for (const row of tchartRows || []) {
    keyToRow[tchartEntryKey(row)] = row;
  }

  let snippets = Array.isArray(bucket?.evidenceSnippets)
    ? bucket.evidenceSnippets
    : [];

  if (!snippets.length && Array.isArray(bucket?.evidenceKeys)) {
    snippets = bucket.evidenceKeys
      .map((k) => {
        const row = keyToRow[String(k)];
        if (!row) return null;
        return {
          quote: row.quote ?? "",
          observation: row.observation ?? "",
          evidenceKey: String(k),
        };
      })
      .filter(Boolean);
  }

  return (snippets || [])
    .map((s, index) => {
      const quote = safeText(s?.quote);
      const observation = safeText(s?.observation);
      const evidenceKey =
        safeText(s?.evidenceKey) ||
        (Array.isArray(bucket?.evidenceKeys)
          ? safeText(bucket.evidenceKeys[index])
          : "");
      if (!quote && !observation) return null;
      return { quote, observation, ...(evidenceKey ? { evidenceKey } : {}) };
    })
    .filter(Boolean);
}

function evidenceSlotsFromSnippets(evidence) {
  return evidence.map((item) => ({
    countsTowardEvidenceGate: true,
    savedKey: item.evidenceKey || "",
    quote: item.quote,
    observation: item.observation,
    row: {
      evidenceKey: item.evidenceKey || "",
      quote: item.quote,
      observation: item.observation,
    },
  }));
}

/**
 * Compact source signature for upstream-change detection (not a full artifact dump).
 * Deterministically includes evidence keys even when snippets cannot be resolved.
 * Pass tchartRows when available so quote/observation content is included.
 */
export function buildModule4ParagraphSourceSignature(
  bucket,
  sourceParagraphIndex = 0,
  tchartRows = []
) {
  const evidence = resolveEvidenceSnippetsForBucket(bucket, tchartRows);
  const evidenceKeys = Array.isArray(bucket?.evidenceKeys)
    ? bucket.evidenceKeys
        .map((k) => String(k || "").trim())
        .filter(Boolean)
    : [];
  // Stable key list (preserve first-seen order, dedupe exact strings).
  const seenKeys = new Set();
  const stableKeys = [];
  for (const key of evidenceKeys) {
    if (seenKeys.has(key)) continue;
    seenKeys.add(key);
    stableKeys.push(key);
  }
  // Also include keys discovered only via resolved snippets.
  for (const item of evidence) {
    const key = safeText(item?.evidenceKey);
    if (key && !seenKeys.has(key)) {
      seenKeys.add(key);
      stableKeys.push(key);
    }
  }

  const contentLines = evidence.map(
    (e) => `${safeText(e.evidenceKey)}|${safeText(e.quote)}|${safeText(e.observation)}`
  );

  const parts = [
    String(sourceParagraphIndex),
    safeText(bucket?.claim),
    safeText(bucket?.paragraphRole),
    safeText(bucket?.reasoning),
    safeText(bucket?.suggestionId),
    `keys:${stableKeys.join(",")}`,
    `content:${contentLines.join(";;")}`,
  ];
  return parts.join("::");
}

/**
 * How many Module 4 body paragraphs Module 5 should import.
 * - true → 3
 * - false → 2
 * - null/undefined → legacy: up to 2, or 3 when a third bucket looks planned
 */
export function resolveRequiredOutlineParagraphCount({
  buckets = [],
  wantThirdBucket = null,
} = {}) {
  const list = Array.isArray(buckets) ? buckets : [];
  if (wantThirdBucket === true) return 3;
  if (wantThirdBucket === false) return 2;
  if (list.length >= 3) {
    const third = list[2];
    const hasContent =
      safeText(third?.claim).length >= POINT_MIN_CHARS &&
      safeText(third?.reasoning).length >= REASONING_MIN_CHARS &&
      ((Array.isArray(third?.evidenceKeys) && third.evidenceKeys.length > 0) ||
        (Array.isArray(third?.evidenceSnippets) &&
          third.evidenceSnippets.some(
            (s) => safeText(s?.quote) || safeText(s?.observation)
          )));
    if (hasContent) return 3;
  }
  return Math.min(list.length, 2);
}

/**
 * Map one Module 4 bucket into an additive outline body card.
 */
export function mapBucketToOutlineBodyItem(
  bucket,
  {
    sourceParagraphIndex = 0,
    order = 0,
    tchartRows = [],
    bodyCount = 2,
  } = {}
) {
  const point = safeText(bucket?.claim) || "Body paragraph";
  const jobId = safeText(bucket?.paragraphRole);
  const job = jobLabelForOutline(jobId);
  const reasoning = safeText(bucket?.reasoning);
  const suggestionId = safeText(bucket?.suggestionId);
  const evidence = resolveEvidenceSnippetsForBucket(bucket, tchartRows);

  const points = evidence
    .map((s) => {
      const obs = s.observation;
      const quote = s.quote;
      const line = `${obs}${quote ? ` — "${quote}"` : ""}`.trim();
      return line;
    })
    .filter(Boolean);

  if (reasoning) points.push(reasoning);

  const includeTransition = order < bodyCount - 1;

  return {
    bucket: point,
    points: points.length ? points : [""],
    paragraphIndex: sourceParagraphIndex,
    sourceParagraphIndex,
    point,
    job,
    jobId: jobId || undefined,
    evidence,
    reasoning,
    suggestionId: suggestionId || undefined,
    order,
    moveOrder: buildBodyParagraphMoveOrder({
      includeTransition,
      evidenceCount: Math.max(1, evidence.length || 1),
    }),
    sourceSignature: buildModule4ParagraphSourceSignature(
      bucket,
      sourceParagraphIndex,
      tchartRows
    ),
  };
}

/**
 * Build Module 5 outline.body from Module 4 buckets, respecting wantThirdBucket
 * and mechanical planned-state (incomplete buckets never become phantom cards).
 */
export function buildOutlineBodyFromModule4Plans({
  buckets = [],
  wantThirdBucket = null,
  tchartRows = [],
  getEvidenceSlots = null,
} = {}) {
  const list = Array.isArray(buckets) ? buckets : [];
  const requiredCount = resolveRequiredOutlineParagraphCount({
    buckets: list,
    wantThirdBucket,
  });

  const out = [];
  for (let index = 0; index < requiredCount; index += 1) {
    const bucket = list[index];
    if (!bucket) continue;

    const evidence = resolveEvidenceSnippetsForBucket(bucket, tchartRows);
    const slots =
      typeof getEvidenceSlots === "function"
        ? getEvidenceSlots(bucket, index) || []
        : evidenceSlotsFromSnippets(evidence);

    if (!isParagraphMechanicallyPlanned(bucket, slots)) {
      continue;
    }

    if (wantThirdBucket === false && index >= 2) continue;

    out.push(
      mapBucketToOutlineBodyItem(bucket, {
        sourceParagraphIndex: index,
        order: out.length,
        tchartRows,
        bodyCount: requiredCount,
      })
    );
  }

  return out;
}

/**
 * Legacy-compatible builder. Prefer buildOutlineBodyFromModule4Plans for CP-F.
 */
export function outlineBodyFromStudentBuckets(
  bucketsPayload,
  tchartRows,
  options = {}
) {
  const list = Array.isArray(bucketsPayload) ? bucketsPayload : [];

  if (
    options.respectMechanicalGates !== false &&
    options.wantThirdBucket !== undefined
  ) {
    return buildOutlineBodyFromModule4Plans({
      buckets: list,
      wantThirdBucket: options.wantThirdBucket,
      tchartRows,
    });
  }

  return list.map((b, index) =>
    mapBucketToOutlineBodyItem(b, {
      sourceParagraphIndex: index,
      order: index,
      tchartRows,
    })
  );
}

export { POINT_MIN_CHARS, REASONING_MIN_CHARS, CUSTOM_JOB_MIN_CHARS };
