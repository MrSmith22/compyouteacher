/**
 * WP-101 — Harness self-tests for beta matrix.
 */

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  BETA_MATRIX_SCHEMA_VERSION,
  validateBetaManifest,
  validateBetaResults,
  evaluateSweepGate,
  buildBetaManifest,
  redactSensitiveText,
  safeExcerpt,
  BetaCleanupLedger,
  isRejectedBetaFixtureSource,
  createBetaRunId,
  betaStudentEmail,
  isOwnedBetaEmail,
  BETA_CONTRADICTION_FIXTURES,
  evaluateContradictionHonesty,
  buildArtifactTraceReport,
  listContradictionFixtureIds,
} from "../lib/beta/index.js";
import { listCoverageFamilyIds } from "../lib/ui/taskWorkspaceCoverageRegistry.js";

const root = process.cwd();

test("WP-101 schema version constant", () => {
  assert.equal(BETA_MATRIX_SCHEMA_VERSION, "1.0.0");
});

test("WP-101 buildManifest validates and has unique ids", () => {
  const manifest = buildBetaManifest();
  const errors = validateBetaManifest(manifest);
  assert.deepEqual(errors, []);
  const ids = manifest.scenarios.map((s) => s.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(ids.length >= 100, `expected many scenarios, got ${ids.length}`);
});

test("WP-101 required Phase 7 / §9.4 / WP-097 coverage present", () => {
  const ids = new Set(buildBetaManifest().scenarios.map((s) => s.id));
  assert.ok(ids.has("FRESH.e2e_real_ui"));
  assert.ok(ids.has("TRACE.final_body_paragraph"));
  assert.ok(ids.has("CLONE.audit"));
  assert.ok(ids.has("PROD.clean_build"));
  for (const fid of listContradictionFixtureIds()) {
    assert.ok(ids.has(`CONTRA.${fid}`), fid);
  }
  assert.equal(BETA_CONTRADICTION_FIXTURES.length, 20);
  for (const fam of listCoverageFamilyIds()) {
    assert.ok(ids.has(`COV.${fam}`), fam);
  }
  assert.equal(listCoverageFamilyIds().length, 42);
});

test("WP-101 gate fails on missing required and unconfirmed cleanup", () => {
  const manifest = {
    scenarios: [
      { id: "a", required: true },
      { id: "b", required: true },
    ],
  };
  const missing = evaluateSweepGate(manifest, { results: [], buildCommit: "c" });
  assert.equal(missing.ok, false);
  const unclean = evaluateSweepGate(manifest, {
    buildCommit: "c",
    results: [
      {
        scenarioId: "a",
        result: "pass",
        cleanupConfirmed: false,
        evidence: [],
      },
      {
        scenarioId: "b",
        result: "pass",
        cleanupConfirmed: true,
        evidence: [],
      },
    ],
  });
  assert.equal(unclean.ok, false);
});

test("WP-101 gate fails on blocked required when treatBlockedAsFail", () => {
  const gate = evaluateSweepGate(
    { scenarios: [{ id: "a", required: true }] },
    {
      results: [
        {
          scenarioId: "a",
          result: "blocked",
          cleanupConfirmed: true,
          evidence: [],
        },
      ],
    },
    { treatBlockedAsFail: true }
  );
  assert.equal(gate.ok, false);
});

test("WP-101 stale evidence detection", () => {
  const errors = validateBetaResults(
    {
      schemaVersion: BETA_MATRIX_SCHEMA_VERSION,
      buildCommit: "old",
      results: [
        {
          scenarioId: "a",
          result: "pass",
          evidence: [],
          cleanupConfirmed: true,
          timestamp: new Date().toISOString(),
        },
      ],
    },
    { buildCommit: "new", requiredIds: ["a"] }
  );
  assert.ok(errors.some((e) => /stale/i.test(e)));
});

test("WP-101 screenshot-only cannot pass when persistence required", () => {
  const errors = validateBetaResults({
    schemaVersion: BETA_MATRIX_SCHEMA_VERSION,
    buildCommit: "c",
    results: [
      {
        scenarioId: "a",
        result: "pass",
        cleanupConfirmed: true,
        timestamp: new Date().toISOString(),
        evidence: [
          { kind: "screenshot", persistenceRequired: true, detail: "x.png" },
        ],
      },
    ],
  });
  assert.ok(errors.some((e) => /screenshot-only/i.test(e)));
});

test("WP-101 redaction strips tokens and Doc URLs", () => {
  const out = redactSensitiveText(
    "Bearer abc.def and https://docs.google.com/document/d/SECRETDOC/edit"
  );
  assert.ok(!out.includes("SECRETDOC"));
  assert.ok(!out.includes("abc.def"));
  assert.ok(out.includes("[REDACTED]"));
  const excerpt = safeExcerpt("Long student prose about King and ethos.");
  assert.ok(excerpt.hashHint);
  assert.ok(excerpt.length > 0);
});

test("WP-101 cleanup ledger restores in reverse", async () => {
  const ledger = new BetaCleanupLedger();
  const order = [];
  ledger.register({
    id: "1",
    scenarioId: "s",
    kind: "a",
    description: "a",
    restore: () => order.push(1),
  });
  ledger.register({
    id: "2",
    scenarioId: "s",
    kind: "b",
    description: "b",
    restore: () => order.push(2),
  });
  const res = await ledger.restoreAll();
  assert.equal(res.ok, true);
  assert.deepEqual(order, [2, 1]);
  assert.equal(ledger.allConfirmedForScenario("s"), true);
});

test("WP-101 beta identities ownership", () => {
  const runId = createBetaRunId("testrun01");
  const email = betaStudentEmail(runId);
  assert.ok(email.includes("beta-student-"));
  assert.ok(isOwnedBetaEmail(email, runId));
  assert.equal(isOwnedBetaEmail("dev-student@localhost", runId), false);
  assert.equal(isRejectedBetaFixtureSource("fixtures"), true);
  assert.equal(isRejectedBetaFixtureSource("beta_contradiction_fixtures"), true);
});

test("WP-101 contradiction honesty rejects silent rewrite and false certify", () => {
  const frag = BETA_CONTRADICTION_FIXTURES.find(
    (f) => f.id === "c07_fragment_reasoning"
  );
  const bad = evaluateContradictionHonesty(frag, {
    signals: [],
    certifiedComplete: true,
    rewrittenProse: true,
  });
  assert.equal(bad.ok, false);
  const good = evaluateContradictionHonesty(frag, {
    signals: ["fragmentary_reasoning"],
    certifiedComplete: false,
    rewrittenProse: false,
  });
  assert.equal(good.ok, true);
});

test("WP-101 artifact trace coreOk requires lineage without plan labels", () => {
  const ok = buildArtifactTraceReport({
    pdfParagraph: "Body paragraph marker text.",
    receiptId: "r1",
    docSignature: "d1",
    module7Revised: "Body paragraph marker text.",
    module6Assembled: "Body paragraph marker text.",
    module5OutlineNode: "outline",
    module4Plan: "plan",
    module3Thesis: "thesis",
    module2Direction: "direction",
    sourcePassageId: "letter:1",
    planLabelsInProse: false,
  });
  assert.equal(ok.coreOk, true);
  const bad = buildArtifactTraceReport({
    pdfParagraph: "II. King uses emotional appeals",
    receiptId: "r1",
    module7Revised: "II. King uses emotional appeals",
    module6Assembled: "x",
    module5OutlineNode: "x",
    module4Plan: "x",
    module3Thesis: "x",
    module2Direction: "x",
    sourcePassageId: "letter:1",
    planLabelsInProse: true,
  });
  assert.equal(bad.coreOk, false);
});

test("WP-101 lib/beta and matrix paths exist", () => {
  assert.ok(fs.existsSync(path.join(root, "lib/beta/schema.js")));
  assert.ok(fs.existsSync(path.join(root, "lib/beta/buildManifest.js")));
  assert.ok(fs.existsSync(path.join(root, "scripts/wp101-write-manifest.mjs")));
  assert.ok(fs.existsSync(path.join(root, "scripts/wp101-run-matrix.mjs")));
});
