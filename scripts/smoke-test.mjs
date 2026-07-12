#!/usr/bin/env node
/**
 * smoke-test.mjs — READ-ONLY sweep of every GET endpoint in the catalog against a
 * live Invoice Ninja instance. Never calls a mutating (POST/PUT/DELETE) endpoint.
 *
 * Strategy:
 *   1. Call every list endpoint (GET with no path params) with per_page=1.
 *      Harvest a sample hashed id per category from the responses.
 *   2. Call every show/detail endpoint (GET with {id}) reusing a harvested id.
 *      Skip when no id is available for that category.
 *   3. Report PASS / FAIL / SKIP per endpoint with the HTTP status.
 *
 * Requires the build (dist/) and env: INVOICENINJA_BASE_URL, INVOICENINJA_API_TOKEN.
 *
 *   npm run build && npm run smoke
 */
import { loadIndex, loadEndpointSpec } from "../dist/catalog/endpoint-spec.js";
import { invoiceNinjaClient } from "../dist/clients/invoiceninja-client.js";

if (!process.env.INVOICENINJA_BASE_URL || !process.env.INVOICENINJA_API_TOKEN) {
  console.error("Set INVOICENINJA_BASE_URL and INVOICENINJA_API_TOKEN before running the smoke test.");
  process.exit(1);
}

const PAUSE_MS = Number.parseInt(process.env.SMOKE_PAUSE_MS || "150", 10);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const idx = loadIndex();
// Read-only sweep: every NON-mutating endpoint, regardless of HTTP method. This includes the
// 36 POST-but-read-only endpoints (reports, charts, preview, templates, search) and excludes
// all 229 mutating ones (incl. the 6 state-changing action_* GETs). POST reads are sent with an
// empty body {} so we never trip a side effect (e.g. a report's send_email); a missing required
// filter therefore surfaces as a recorded 422, not a crash.
const reads = idx.endpoints.filter((e) => !e.mutating).map((e) => loadEndpointSpec(e.slug));
const mutatingExcluded = idx.endpoints.filter((e) => e.mutating).length;
const listEps = reads.filter((s) => !/\{/.test(s.path));
const idEps = reads.filter((s) => /\{id\}/.test(s.path));
const otherParamEps = reads.filter((s) => /\{/.test(s.path) && !/\{id\}/.test(s.path));

const sampleIdByCategory = new Map();
const results = [];

function harvestId(category, data) {
  if (sampleIdByCategory.has(category)) return;
  const arr = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : null;
  const first = arr && arr[0];
  if (first && typeof first === "object" && typeof first.id === "string") {
    sampleIdByCategory.set(category, first.id);
  }
}

async function run(spec, pathParams) {
  // POST-but-read-only endpoints get an empty body (never a side-effecting flag); GETs get none.
  const body = spec.method === "GET" ? undefined : {};
  const res = await invoiceNinjaClient.call(spec, { pathParams, query: { per_page: 1 }, body });
  const status = res.isError ? (res.error?.match(/HTTP (\d+)/)?.[1] ?? "ERR") : "200";
  results.push({ slug: spec.slug, method: spec.method, path: spec.path, ok: !res.isError, status, error: res.error });
  if (!res.isError) harvestId(spec.category, res.result);
  await sleep(PAUSE_MS);
}

console.log(
  `Read-only smoke test: ${reads.length} non-mutating endpoints ` +
    `(${listEps.length} collection/report, ${idEps.length} by-id, ${otherParamEps.length} other-param). ` +
    `Excluding ${mutatingExcluded} mutating endpoints — NOT covered by this sweep.\n`
);

console.log("== Phase 1: list endpoints ==");
for (const spec of listEps) {
  await run(spec, {});
  const r = results[results.length - 1];
  console.log(`  [${r.ok ? "PASS" : "FAIL"}] ${r.status}  ${spec.slug}  (${spec.path})`);
}

console.log("\n== Phase 2: by-id endpoints (reusing harvested ids) ==");
for (const spec of idEps) {
  const id = sampleIdByCategory.get(spec.category);
  if (!id) {
    results.push({ slug: spec.slug, method: spec.method, path: spec.path, ok: null, status: "SKIP", error: "no sample id" });
    console.log(`  [SKIP] no id for category "${spec.category}"  ${spec.slug}`);
    continue;
  }
  await run(spec, { id });
  const r = results[results.length - 1];
  console.log(`  [${r.ok ? "PASS" : "FAIL"}] ${r.status}  ${spec.slug}  (id=${id})`);
}

if (otherParamEps.length) {
  console.log("\n== Phase 3: other-path-param endpoints (skipped — need specific ids) ==");
  for (const spec of otherParamEps) {
    results.push({ slug: spec.slug, method: spec.method, path: spec.path, ok: null, status: "SKIP", error: "non-id path param" });
    console.log(`  [SKIP] ${spec.slug}  (${spec.path})`);
  }
}

const pass = results.filter((r) => r.ok === true).length;
const fail = results.filter((r) => r.ok === false).length;
const skip = results.filter((r) => r.ok === null).length;
console.log(`\n== Summary ==\nPASS ${pass}  FAIL ${fail}  SKIP ${skip}  (of ${results.length})`);
if (fail) {
  console.log("\nFailures:");
  for (const r of results.filter((r) => r.ok === false)) {
    console.log(`  ${r.status}  ${r.slug}  ${(r.error || "").slice(0, 160)}`);
  }
}
process.exitCode = fail > 0 ? 1 : 0;
