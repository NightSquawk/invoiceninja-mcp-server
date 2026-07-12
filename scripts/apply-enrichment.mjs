#!/usr/bin/env node
/**
 * apply-enrichment.mjs — writes the `whenToUse` values produced by the enrichment
 * workflow into the per-endpoint catalog files, then you re-run assemble-catalog.
 *
 * Usage:
 *   node scripts/apply-enrichment.mjs <enrichment.json>
 * where enrichment.json is an array (or {enrichment:[...]}) of {slug, whenToUse}.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const endpointsDir = join(root, "src", "catalog", "endpoints");

const inputPath = process.argv[2];
if (!inputPath || !existsSync(inputPath)) {
  console.error("Pass a path to the enrichment JSON ([{slug, whenToUse}] or {enrichment:[...]}).");
  process.exit(1);
}

let parsed = JSON.parse(readFileSync(inputPath, "utf8"));
const items = Array.isArray(parsed) ? parsed : parsed.enrichment || parsed.items || [];

let applied = 0;
const missing = [];
const skipped = [];

for (const { slug, whenToUse } of items) {
  if (!slug || !whenToUse || !whenToUse.trim()) {
    skipped.push(slug || "(no slug)");
    continue;
  }
  const file = join(endpointsDir, `${slug}.json`);
  if (!existsSync(file)) {
    missing.push(slug);
    continue;
  }
  const spec = JSON.parse(readFileSync(file, "utf8"));
  let text = whenToUse.trim();
  // Reconcile the "(mutating)" suffix with the authoritative flag: the enrichment pass
  // labeled POST reports as mutating, but reports/charts/preview/search are read-only.
  if (!spec.mutating) text = text.replace(/\s*\(mutating\)\.?\s*$/i, "").trim();
  spec.whenToUse = text;
  writeFileSync(file, JSON.stringify(spec, null, 2) + "\n");
  applied++;
}

console.log(`Applied whenToUse to ${applied} endpoints.`);
if (skipped.length) console.log(`Skipped (blank): ${skipped.length}`);
if (missing.length) console.log(`Unknown slugs (${missing.length}): ${missing.join(", ")}`);
console.log(`\nNext: node scripts/assemble-catalog.mjs && npm run build`);
