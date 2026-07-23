/**
 * WP-101 — Module gates must use session APIs, not anon Supabase client reads.
 */

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

test("WP-101 Module 2 layout reads progress via authenticated API", () => {
  const layout = fs.readFileSync(
    path.join(process.cwd(), "app/modules/2/layout.js"),
    "utf8"
  );
  assert.ok(layout.includes('/api/assignments/progress'));
  assert.ok(!layout.includes("getStudentAssignment"));
});

test("WP-101 assignments progress route exists and is session-gated", () => {
  const route = fs.readFileSync(
    path.join(process.cwd(), "app/api/assignments/progress/route.js"),
    "utf8"
  );
  assert.ok(route.includes("getServerSession"));
  assert.ok(route.includes("getSupabaseAdmin"));
  assert.ok(route.includes("currentModule"));
  assert.ok(route.includes("export async function POST"));
  assert.ok(route.includes("completedModuleNumber"));
});

test("WP-101 browser progress advance uses session API not anon client", () => {
  const src = fs.readFileSync(
    path.join(process.cwd(), "lib/supabase/helpers/studentAssignments.ts"),
    "utf8"
  );
  assert.ok(src.includes("advanceSessionModuleOnSuccess"));
  assert.ok(src.includes('typeof window !== "undefined"'));
});

test("WP-101 module gate uses session progress in browser", () => {
  const src = fs.readFileSync(
    path.join(process.cwd(), "lib/supabase/helpers/moduleGate.ts"),
    "utf8"
  );
  assert.ok(src.includes("requireSessionModuleAccess"));
  assert.ok(src.includes('typeof window !== "undefined"'));
});

test("WP-101 Module 2 matrix loads T-chart via session API not anon client", () => {
  const src = fs.readFileSync(
    path.join(process.cwd(), "components/module2/ModuleTwoRhetoricalMatrix.jsx"),
    "utf8"
  );
  assert.ok(src.includes('/api/tchart/entries'));
  assert.ok(!src.includes("getTChartEntries"));
});

test("WP-101 Module 3 form loads T-chart via session API not anon client", () => {
  const src = fs.readFileSync(
    path.join(process.cwd(), "components/ModuleThreeV2Form.jsx"),
    "utf8"
  );
  assert.ok(src.includes('/api/tchart/entries'));
  assert.ok(!src.includes("getTChartEntries"));
});

test("WP-101 evidence-argument flow loads T-chart via session API", () => {
  const src = fs.readFileSync(
    path.join(
      process.cwd(),
      "components/module3/EvidenceArgumentSliceFlow.jsx"
    ),
    "utf8"
  );
  assert.ok(src.includes('/api/tchart/entries'));
  assert.ok(!src.includes("getTChartEntries"));
});
