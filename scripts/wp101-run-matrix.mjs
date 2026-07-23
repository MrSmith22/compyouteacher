#!/usr/bin/env node
/**
 * WP-101 — Run pure/api beta matrix layers and write results.
 * Exit 1 if required scenarios fail, are blocked, missing, or cleanup unconfirmed.
 */
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { buildBetaManifest } from "../lib/beta/buildManifest.js";
import {
  validateBetaManifest,
  validateBetaResults,
  evaluateSweepGate,
  BETA_MATRIX_SCHEMA_VERSION,
} from "../lib/beta/schema.js";
import { runPureMatrix } from "../lib/beta/runMatrix.js";
import { redactEvidenceValue } from "../lib/beta/redaction.js";

const root = process.cwd();
const commit =
  process.env.WP101_COMMIT ||
  execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();

const manifestPath = path.join(
  root,
  "docs/project-standards/beta-matrix/v1/manifest.json"
);
if (!fs.existsSync(manifestPath)) {
  console.error("Missing manifest — run scripts/wp101-write-manifest.mjs first");
  process.exit(1);
}

let manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const rebuilt = buildBetaManifest();
// Prefer freshly built scenario set if counts drifted
if (rebuilt.scenarios.length !== manifest.scenarios.length) {
  rebuilt.generatedAt = new Date().toISOString();
  fs.writeFileSync(manifestPath, JSON.stringify(rebuilt, null, 2) + "\n");
  manifest = rebuilt;
  console.log(`Refreshed manifest (${manifest.scenarios.length} scenarios)`);
}

const mErr = validateBetaManifest(manifest);
if (mErr.length) {
  console.error(mErr.join("\n"));
  process.exit(1);
}

const pureDoc = await runPureMatrix({
  manifest,
  buildCommit: commit,
  layers: ["pure", "api"],
});

// Merge external layer placeholders from prior results if present
const resultsDir = path.join(
  root,
  "docs/project-standards/walkthroughs/beta-matrix-results"
);
fs.mkdirSync(resultsDir, { recursive: true });
const mergePath = path.join(resultsDir, `${commit}.external.json`);
/** @type {Map<string, any>} */
const byId = new Map(pureDoc.results.map((r) => [r.scenarioId, r]));

if (fs.existsSync(mergePath)) {
  const ext = JSON.parse(fs.readFileSync(mergePath, "utf8"));
  for (const row of ext.results || []) {
    byId.set(row.scenarioId, row);
  }
  console.log(`Merged external results from ${mergePath}`);
}

// Ensure every required scenario has a row (blocked if still missing external)
for (const sc of manifest.scenarios) {
  if (!byId.has(sc.id)) {
    byId.set(sc.id, {
      scenarioId: sc.id,
      result: sc.required ? "blocked" : "not_applicable",
      evidence: [{ kind: "missing", detail: "no runner output" }],
      severityIfFailed: sc.severityIfFailed,
      timestamp: new Date().toISOString(),
      buildCommit: commit,
      cleanupConfirmed: true,
      detail: "awaiting external layer",
    });
  }
}

const resultsDoc = {
  schemaVersion: BETA_MATRIX_SCHEMA_VERSION,
  buildCommit: commit,
  runId: pureDoc.runId,
  generatedAt: new Date().toISOString(),
  results: [...byId.values()].map((r) => redactEvidenceValue(r)),
  ledger: pureDoc.ledger,
};

const requiredIds = manifest.scenarios.filter((s) => s.required).map((s) => s.id);
const rErr = validateBetaResults(resultsDoc, {
  requiredIds,
  buildCommit: commit,
});
if (rErr.length) {
  console.error("Results validation:\n", rErr.join("\n"));
}

const gate = evaluateSweepGate(manifest, resultsDoc, {
  buildCommit: commit,
  treatBlockedAsFail: true,
});

const outPath = path.join(resultsDir, `${commit}.json`);
fs.writeFileSync(outPath, JSON.stringify(resultsDoc, null, 2) + "\n");

const counts = { pass: 0, fail: 0, blocked: 0, not_applicable: 0 };
for (const r of resultsDoc.results) {
  counts[r.result] = (counts[r.result] || 0) + 1;
}
console.log(JSON.stringify({ commit, counts, outPath, gate }, null, 2));

if (rErr.length || !gate.ok) {
  process.exit(1);
}
