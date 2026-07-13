#!/usr/bin/env node
// Generates the README "API coverage" section from the catalog index.
// Usage: node scripts/generate-api-coverage.mjs > coverage.md
// Never hand-edit the API coverage section: regenerate it with this script
// whenever the catalog changes.
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const index = JSON.parse(readFileSync(join(root, "src", "catalog", "index.json"), "utf8"));

const lines = [];
lines.push(`${index.endpointCount} operations covered: ${index.readCount} read-only, ${index.mutatingCount} mutating.`);
lines.push("");

// Summary table of counts by category.
lines.push("| Category | Operations |");
lines.push("|---|---|");
for (const cat of index.categories) {
  lines.push(`| ${cat.name} | ${cat.count} |`);
}
lines.push("");

// One collapsible block per category with every endpoint.
for (const cat of index.categories) {
  const endpoints = index.endpoints.filter((e) => e.category === cat.name);
  lines.push("<details>");
  lines.push(`<summary><strong>${cat.name}</strong> (${endpoints.length} operations)</summary>`);
  lines.push("");
  lines.push("| Method | Path | Operation ID |");
  lines.push("|---|---|---|");
  for (const e of endpoints) {
    lines.push(`| ${e.method} | \`${e.path}\` | \`${e.slug}\` |`);
  }
  lines.push("");
  lines.push("</details>");
  lines.push("");
}

process.stdout.write(lines.join("\n"));
