import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { createCatalogStore } from "@nightsquawktech/mcp-core/catalog";

/**
 * Types + loader for the Invoice Ninja endpoint catalog.
 *
 * The catalog is the single source of truth for every API endpoint and its
 * parameters, generated from the official OpenAPI spec (openapi/api-docs.yaml @
 * invoiceninja v5-stable): one JSON file per endpoint under ./endpoints/, plus an
 * aggregate ./index.json.
 *
 * The consolidated MCP tools (list_endpoints / describe_endpoint / call_endpoint)
 * read from here for discovery and request validation, so we do NOT define ~379
 * individual tools.
 */

export interface EndpointParameter {
  name: string;
  type: string;
  required: boolean;
  description?: string;
  format?: string;
  enum?: unknown[];
  default?: unknown;
  example?: unknown;
}

export interface BodyField {
  name: string;
  type: string;
  required: boolean;
  description?: string;
  enum?: unknown[];
}

export interface RequestBodySpec {
  contentType: string;
  schemaRef?: string;
  fields: BodyField[];
}

export interface EndpointSpec {
  slug: string;
  operationId: string | null;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** Path template, e.g. "/api/v1/invoices/{id}". */
  path: string;
  name: string;
  category: string;
  /** True for any non-GET operation (changes server state). */
  mutating: boolean;
  description: string;
  /** Curated "what it does + when to reach for it" (enrichment pass). */
  whenToUse: string;
  pathParameters: EndpointParameter[];
  queryParameters: EndpointParameter[];
  headerParameters: EndpointParameter[];
  requestBody: RequestBodySpec | null;
  responseSchema?: string;
}

export interface EndpointIndexEntry {
  slug: string;
  name: string;
  method: string;
  path: string;
  category: string;
  mutating: boolean;
  paramCount: number;
  hasBody: boolean;
  summary: string;
}

export interface EndpointIndex {
  generatedFrom: string;
  endpointCount: number;
  readCount: number;
  mutatingCount: number;
  enrichedCount: number;
  categories: Array<{ name: string; count: number }>;
  endpoints: EndpointIndexEntry[];
}

// Path resolution stays HERE, in the server, so it points at this server's
// bundled catalog (dist/catalog) and not at the mcp-core package. The core
// loader receives the resolved directory and never derives it from its own
// module location.
const catalogDir = dirname(fileURLToPath(import.meta.url)); // dist/catalog
const store = createCatalogStore<EndpointIndex>(catalogDir);

/** The aggregate catalog index (slug, name, method, path, category per endpoint). */
export function loadIndex(): EndpointIndex {
  return store.index();
}

/** Full spec for a single endpoint, or null if the slug is unknown. */
export function loadEndpointSpec(slug: string): EndpointSpec | null {
  // Entries live under endpoints/; the core store guards against path traversal.
  return store.entry<EndpointSpec>(slug);
}

/** True if the slug names a real endpoint. */
export function isKnownEndpoint(slug: string): boolean {
  return loadIndex().endpoints.some((e) => e.slug === slug);
}

/** Distinct category names present in the catalog. */
export function listCategories(): string[] {
  return loadIndex().categories.map((c) => c.name);
}

/** Fuzzy slug suggestions for an unknown name. */
export function suggestSlugs(query: string, limit = 6): string[] {
  if (!query) return [];
  const q = query.toLowerCase();
  return loadIndex()
    .endpoints.map((e) => e.slug)
    .filter((s) => s.includes(q) || q.includes(s))
    .slice(0, limit);
}
