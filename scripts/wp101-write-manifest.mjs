#!/usr/bin/env node
/**
 * WP-101 — Write versioned beta matrix manifest JSON.
 */
import fs from "node:fs";
import path from "node:path";
import { buildBetaManifest } from "../lib/beta/buildManifest.js";
import { validateBetaManifest } from "../lib/beta/schema.js";

const outDir = path.join(
  process.cwd(),
  "docs/project-standards/beta-matrix/v1"
);
fs.mkdirSync(outDir, { recursive: true });

const manifest = buildBetaManifest();
manifest.generatedAt = new Date().toISOString();
const errors = validateBetaManifest(manifest);
if (errors.length) {
  console.error("Manifest validation failed:\n", errors.join("\n"));
  process.exit(1);
}

const outPath = path.join(outDir, "manifest.json");
fs.writeFileSync(outPath, JSON.stringify(manifest, null, 2) + "\n");
console.log(
  `Wrote ${manifest.scenarios.length} scenarios → ${outPath}`
);
