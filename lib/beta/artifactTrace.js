/**
 * WP-101 — Pure artifact lineage trace (hashes + safe excerpts only).
 */

import { createHash } from "node:crypto";
import { safeExcerpt, redactEvidenceValue } from "./redaction.js";

/**
 * @param {string} text
 */
export function shortHash(text) {
  return createHash("sha256").update(String(text || "")).digest("hex").slice(0, 16);
}

/**
 * @typedef {{
 *   layer: string,
 *   label: string,
 *   identity: string|null,
 *   excerpt: ReturnType<typeof safeExcerpt>,
 *   linked: boolean,
 *   confidence: "proven"|"inferred"|"unavailable",
 *   note?: string,
 * }} TraceNode
 */

/**
 * Build a machine-readable end-to-end paragraph trace.
 * Missing links are honest `unavailable` — never invent provenance.
 *
 * @param {{
 *   pdfParagraph?: string,
 *   receiptId?: string|null,
 *   docSignature?: string|null,
 *   module7Revised?: string|null,
 *   module6Assembled?: string|null,
 *   module5OutlineNode?: string|null,
 *   module4Plan?: string|null,
 *   module3Thesis?: string|null,
 *   module2Direction?: string|null,
 *   sourcePassageId?: string|null,
 *   planLabelsInProse?: boolean,
 * }} input
 */
export function buildArtifactTraceReport(input) {
  /** @type {TraceNode[]} */
  const nodes = [];

  function push(layer, label, text, identity, confidence, note) {
    const has = text != null && String(text).trim().length > 0;
    nodes.push({
      layer,
      label,
      identity: identity || (has ? shortHash(String(text)) : null),
      excerpt: safeExcerpt(has ? String(text) : ""),
      linked: has && confidence !== "unavailable",
      confidence: has ? confidence : "unavailable",
      note,
    });
  }

  push("pdf", "submitted PDF paragraph", input.pdfParagraph, null, "proven");
  push(
    "receipt",
    "durable final receipt",
    input.receiptId ? `receipt:${input.receiptId}` : "",
    input.receiptId || null,
    input.receiptId ? "proven" : "unavailable"
  );
  push(
    "doc",
    "Google Doc signature",
    input.docSignature || "",
    input.docSignature || null,
    input.docSignature ? "proven" : "unavailable"
  );
  push("m7", "Module 7 revised paragraph", input.module7Revised, null, "proven");
  push("m6", "Module 6 assembled prose", input.module6Assembled, null, "proven");
  push("m5", "Module 5 outline node", input.module5OutlineNode, null, "inferred");
  push("m4", "Module 4 paragraph plan", input.module4Plan, null, "inferred");
  push("m3", "Module 3 thesis proof direction", input.module3Thesis, null, "inferred");
  push("m2", "Module 2 comparison direction", input.module2Direction, null, "inferred");
  push(
    "source",
    "source passage provenance",
    input.sourcePassageId ? `source:${input.sourcePassageId}` : "",
    input.sourcePassageId || null,
    input.sourcePassageId ? "proven" : "unavailable"
  );

  const planLabelsInProse = !!input.planLabelsInProse;
  const unbroken = nodes.every(
    (n) => n.confidence !== "unavailable" || n.layer === "doc"
  );
  // Doc may be optional in some fixtures; require pdf→m7→m6→source chain for "strong" pass.
  const coreOk =
    nodes.find((n) => n.layer === "pdf")?.linked &&
    nodes.find((n) => n.layer === "receipt")?.linked &&
    nodes.find((n) => n.layer === "m7")?.linked &&
    nodes.find((n) => n.layer === "m6")?.linked &&
    nodes.find((n) => n.layer === "m5")?.linked &&
    nodes.find((n) => n.layer === "m4")?.linked &&
    nodes.find((n) => n.layer === "m3")?.linked &&
    nodes.find((n) => n.layer === "m2")?.linked &&
    nodes.find((n) => n.layer === "source")?.linked &&
    !planLabelsInProse;

  return redactEvidenceValue({
    version: "1.0.0",
    coreOk: !!coreOk,
    planLabelsInProse,
    unbrokenPartial: unbroken,
    nodes,
  });
}
