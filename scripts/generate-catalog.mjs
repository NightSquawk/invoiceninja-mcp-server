#!/usr/bin/env node
/**
 * generate-catalog.mjs — parses the Invoice Ninja OpenAPI spec into one JSON
 * file per endpoint under src/catalog/endpoints/, mirroring how the AppFolio MCP
 * server keeps one spec file per report.
 *
 * Source of truth: spec/api-docs.yaml (the self-contained OpenAPI 3.0.1 doc from
 * invoiceninja/invoiceninja @ v5-stable, openapi/api-docs.yaml).
 *
 * This is the INITIAL generator — it (over)writes every endpoint file from the
 * spec. The `whenToUse` field is left blank for the enrichment pass to fill.
 * After enrichment, run assemble-catalog.mjs to (re)build index.json.
 *
 *   node scripts/generate-catalog.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { parse } from "yaml";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const specPath = join(root, "spec", "api-docs.yaml");
const outDir = join(root, "src", "catalog", "endpoints");

const HTTP_METHODS = ["get", "post", "put", "patch", "delete"];
// Header params the client always supplies or that are auth-plumbing — not surfaced as call args.
const SUPPRESSED_HEADERS = new Set(["X-API-TOKEN", "X-Requested-With"]);

// Normalize the spec's inconsistent operation tags into clean snake_case categories
// (case-collisions, typos, and singular/plural splits found by the catalog audit).
const CATEGORY_NORMALIZE = {
  Credits: "credits",
  Webhooks: "webhooks",
  payment_termss: "payment_terms",
  expense: "expenses",
  recurring_expense: "recurring_expenses",
  import: "imports",
  "Purchase Orders": "purchase_orders",
  "Recurring Invoices": "recurring_invoices",
};

// Catalog-level path corrections over upstream OpenAPI defects. Invoice Ninja's real
// Laravel apiResource routes are plural for ALL verbs, but the spec lists purchase-order
// PUT/DELETE under the singular segment, which 404s. (Audit finding, HIGH.)
const PATH_OVERRIDE = {
  update_purchase_order: "/api/v1/purchase_orders/{id}",
  delete_purchase_order: "/api/v1/purchase_orders/{id}",
};

// Categories that are functionally READ-ONLY even though their endpoints use POST
// (data-export reports, analytics charts, render-only previews, search). Forcing these
// to mutating:false keeps describe_endpoint honest and lets call_endpoint run them
// without the write-authorization dance. (Audit/advisor finding.)
// NOTE: every endpoint in these categories is a read today; revisit if writes are added.
const READ_ONLY_CATEGORIES = new Set(["reports", "charts", "preview", "search", "templates"]);

/**
 * Some GET endpoints change server state and must be guarded like writes:
 *  - `/{resource}/{id}/{action}` action routes (email, mark_paid, archive, delete, clone, …)
 *  - bank-integration account removal / refresh
 * (Audit finding, HIGH — method alone under-counts mutations.)
 */
function isStateChangingGet(path) {
  return /\{action\}/.test(path) || /\/(remove_account|refresh_accounts)\b/.test(path);
}

/** Clean leaked PHPDoc " *" comment-continuation markers and tidy whitespace. */
function cleanText(s) {
  return String(s ?? "")
    .replace(/\r/g, "")
    .replace(/\n[ \t]*\*[ \t]?/g, "\n") // strip leaked docblock asterisks
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const doc = parse(readFileSync(specPath, "utf8"));

/** Resolve a single internal $ref (e.g. "#/components/parameters/include"). */
function resolveRef(ref) {
  if (typeof ref !== "string" || !ref.startsWith("#/")) return undefined;
  const parts = ref.slice(2).split("/");
  let node = doc;
  for (const p of parts) {
    if (node == null) return undefined;
    node = node[p.replace(/~1/g, "/").replace(/~0/g, "~")];
  }
  return node;
}

/** Resolve an object that may itself be a $ref, one level. */
function deref(obj) {
  if (obj && typeof obj === "object" && obj.$ref) return resolveRef(obj.$ref) ?? obj;
  return obj;
}

function normalizeCategory(tag) {
  return CATEGORY_NORMALIZE[tag] ?? tag;
}

function snake(s) {
  return String(s)
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/[^A-Za-z0-9]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .toLowerCase();
}

/** Flatten a parameter (inline or $ref) into our compact shape. */
function normalizeParam(param) {
  const p = deref(param);
  if (!p || !p.name) return null;
  const schema = deref(p.schema) || {};
  const out = {
    name: p.name,
    in: p.in,
    type: schema.type || "string",
    required: Boolean(p.required),
    description: cleanText(p.description),
  };
  if (schema.format) out.format = schema.format;
  if (Array.isArray(schema.enum)) out.enum = schema.enum;
  if (schema.default !== undefined) out.default = schema.default;
  if (p.example !== undefined) out.example = p.example;
  else if (schema.example !== undefined) out.example = schema.example;
  return out;
}

/** Best-effort: list top-level fields of a request-body schema. */
function describeBody(requestBody) {
  const rb = deref(requestBody);
  if (!rb) return null;
  const content = rb.content || {};
  const media =
    content["application/json"] ||
    content["application/x-www-form-urlencoded"] ||
    content[Object.keys(content)[0]];
  if (!media) return { contentType: Object.keys(content)[0] || "application/json", fields: [] };

  let schema = deref(media.schema) || {};
  // Unwrap simple allOf composition.
  if (Array.isArray(schema.allOf)) {
    const merged = { properties: {}, required: [] };
    for (const part of schema.allOf) {
      const ps = deref(part) || {};
      Object.assign(merged.properties, ps.properties || {});
      if (Array.isArray(ps.required)) merged.required.push(...ps.required);
    }
    schema = merged;
  }
  const schemaRef = media.schema && media.schema.$ref ? media.schema.$ref.split("/").pop() : undefined;
  const props = schema.properties || {};
  const required = new Set(schema.required || []);
  const fields = Object.entries(props).map(([name, raw]) => {
    const s = deref(raw) || {};
    const f = { name, type: s.type || (s.$ref ? "object" : "string"), required: required.has(name) };
    if (s.description) f.description = cleanText(s.description).slice(0, 240);
    if (Array.isArray(s.enum)) f.enum = s.enum;
    return f;
  });
  const out = { contentType: Object.keys(content)[0] || "application/json", fields };
  if (schemaRef) out.schemaRef = schemaRef;
  return out;
}

/** Pull the 200/2xx response schema ref name, for context. */
function responseSchemaName(responses) {
  if (!responses) return undefined;
  const ok = responses["200"] || responses["201"] || responses["2XX"] || responses.default;
  const r = deref(ok);
  const media = r && r.content && (r.content["application/json"] || r.content[Object.keys(r.content)[0]]);
  if (!media || !media.schema) return undefined;
  const sch = media.schema;
  if (sch.$ref) return sch.$ref.split("/").pop();
  const data = sch.properties && sch.properties.data;
  if (data && data.items && data.items.$ref) return data.items.$ref.split("/").pop() + "[]";
  if (data && data.$ref) return data.$ref.split("/").pop();
  return undefined;
}

// --- build catalog ---
if (existsSync(outDir)) rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

const slugs = new Set();
let count = 0;
const collisions = [];

for (const [path, pathItem] of Object.entries(doc.paths || {})) {
  for (const method of HTTP_METHODS) {
    const op = pathItem[method];
    if (!op) continue;

    let slug = op.operationId ? snake(op.operationId) : snake(`${method}_${path}`);
    if (slugs.has(slug)) {
      const base = slug;
      let i = 2;
      while (slugs.has(`${base}_${i}`)) i++;
      slug = `${base}_${i}`;
      collisions.push(`${op.operationId || path} -> ${slug}`);
    }
    slugs.add(slug);

    const params = (op.parameters || []).map(normalizeParam).filter(Boolean);
    const pathParameters = params.filter((p) => p.in === "path").map(stripIn);
    const queryParameters = params.filter((p) => p.in === "query").map(stripIn);
    const headerParameters = params
      .filter((p) => p.in === "header" && !SUPPRESSED_HEADERS.has(p.name))
      .map(stripIn);

    const method_upper = method.toUpperCase();
    const effectivePath = PATH_OVERRIDE[slug] ?? path;
    const spec = {
      slug,
      operationId: op.operationId || null,
      method: method_upper,
      path: effectivePath,
      name: (op.summary || op.operationId || `${method_upper} ${path}`).trim(),
      category: normalizeCategory(Array.isArray(op.tags) && op.tags.length ? op.tags[0] : "Other"),
      mutating:
        (method_upper !== "GET" || isStateChangingGet(effectivePath)) &&
        !READ_ONLY_CATEGORIES.has(normalizeCategory(Array.isArray(op.tags) && op.tags.length ? op.tags[0] : "Other")),
      description: cleanText(op.description || op.summary),
      whenToUse: "",
      pathParameters,
      queryParameters,
      headerParameters,
      requestBody: ["post", "put", "patch"].includes(method) ? describeBody(op.requestBody) : null,
      responseSchema: responseSchemaName(op.responses),
    };

    writeFileSync(join(outDir, `${slug}.json`), JSON.stringify(spec, null, 2) + "\n");
    count++;
  }
}

function stripIn(p) {
  const { in: _in, ...rest } = p;
  return rest;
}

console.log(`Parsed ${count} endpoints -> ${outDir}`);
console.log(`Unique slugs: ${slugs.size}`);
if (collisions.length) {
  console.log(`Slug collisions auto-suffixed (${collisions.length}):`);
  for (const c of collisions) console.log(`  - ${c}`);
}
