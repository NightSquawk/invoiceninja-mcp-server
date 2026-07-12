#!/usr/bin/env node
/**
 * assemble-catalog.mjs — builds src/catalog/index.json from the per-endpoint
 * spec files in src/catalog/endpoints/. Mirrors the AppFolio assembler: the
 * per-endpoint files are the source of truth, the index is the lightweight
 * discovery layer the `list_endpoints` tool reads.
 *
 * Re-runnable: run after generate-catalog.mjs and again after the enrichment
 * pass fills in `whenToUse`.
 *
 *   node scripts/assemble-catalog.mjs
 */
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const endpointsDir = join(root, "src", "catalog", "endpoints");
const indexPath = join(root, "src", "catalog", "index.json");

const REQUIRED_KEYS = ["slug", "method", "path", "name", "category", "mutating"];

/** One-line discovery summary: prefer the enriched whenToUse, else clean the spec description. */
function shortSummary(spec) {
  if (spec.whenToUse && spec.whenToUse.trim()) return spec.whenToUse.trim();
  let d = (spec.description || spec.name || "").replace(/\r/g, "");
  // Drop a leading markdown "## METHOD /path" heading line.
  d = d.replace(/^#+\s.*\n+/, "");
  // First sentence / line, collapsed.
  const firstLine = d.split("\n").map((s) => s.trim()).filter(Boolean)[0] || spec.name;
  return firstLine.replace(/\s+/g, " ").slice(0, 200);
}

const files = readdirSync(endpointsDir).filter((f) => f.endsWith(".json"));
const endpoints = [];
const problems = [];
const slugSeen = new Set();

for (const f of files) {
  const slug = f.replace(/\.json$/, "");
  let spec;
  try {
    spec = JSON.parse(readFileSync(join(endpointsDir, f), "utf8"));
  } catch (e) {
    problems.push(`PARSE ERROR ${f}: ${e.message}`);
    continue;
  }
  for (const k of REQUIRED_KEYS) if (!(k in spec)) problems.push(`${slug}: missing key "${k}"`);
  if (spec.slug !== slug) problems.push(`${slug}: slug field is "${spec.slug}"`);
  if (slugSeen.has(spec.slug)) problems.push(`${slug}: duplicate slug`);
  slugSeen.add(spec.slug);

  const paramCount =
    (spec.pathParameters?.length || 0) +
    (spec.queryParameters?.length || 0) +
    (spec.requestBody?.fields?.length || 0);

  endpoints.push({
    slug: spec.slug,
    name: spec.name,
    method: spec.method,
    path: spec.path,
    category: spec.category,
    mutating: Boolean(spec.mutating),
    paramCount,
    hasBody: Boolean(spec.requestBody && spec.requestBody.fields?.length),
    summary: shortSummary(spec),
  });
}

endpoints.sort(
  (a, b) => a.category.localeCompare(b.category) || a.path.localeCompare(b.path) || a.method.localeCompare(b.method)
);

const catCounts = {};
for (const e of endpoints) catCounts[e.category] = (catCounts[e.category] || 0) + 1;
const categories = Object.entries(catCounts)
  .map(([name, count]) => ({ name, count }))
  .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

const index = {
  generatedFrom: "openapi/api-docs.yaml (invoiceninja v5-stable)",
  endpointCount: endpoints.length,
  readCount: endpoints.filter((e) => !e.mutating).length,
  mutatingCount: endpoints.filter((e) => e.mutating).length,
  enrichedCount: files.filter((f) => {
    try {
      return Boolean(JSON.parse(readFileSync(join(endpointsDir, f), "utf8")).whenToUse?.trim());
    } catch {
      return false;
    }
  }).length,
  categories,
  endpoints,
};

console.log(`Endpoints:   ${endpoints.length}`);
console.log(`Read/Mutate: ${index.readCount}/${index.mutatingCount}`);
console.log(`Enriched:    ${index.enrichedCount}/${endpoints.length}`);
console.log(`Categories:  ${categories.length}`);
console.log(`Problems (${problems.length}):`);
for (const p of problems) console.log(`  - ${p}`);

if (problems.length === 0) {
  writeFileSync(indexPath, JSON.stringify(index, null, 2) + "\n");
  console.log(`\nWrote ${indexPath}`);
} else {
  console.log(`\nindex.json NOT written — resolve the issues above first.`);
  process.exitCode = 1;
}
