import { mkdtempSync, writeFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { formatError } from "@nightsquawktech/mcp-core/catalog";
import { ToolResponse } from "../types/tool-response.js";
import type { EndpointSpec } from "../catalog/endpoint-spec.js";

const DEFAULT_TIMEOUT_MS = 30_000;

export interface CallOptions {
  pathParams?: Record<string, string | number>;
  query?: Record<string, unknown>;
  body?: Record<string, unknown>;
  /** Set for mutating calls — a JSON backup is written before execution. */
  authorizationNote?: string;
  /** Local file paths to upload for multipart endpoints (sent under `fileField`). */
  files?: string[];
  /** Multipart form field name for uploaded files (default "documents[]"). */
  fileField?: string;
}

/**
 * Thin Invoice Ninja v5 REST client. One generic `call()` drives every endpoint
 * in the catalog (the catalog spec supplies method + path + which params exist),
 * so the MCP layer never hard-codes routes.
 *
 * v5 specifics vs. the AppFolio client this is modeled on:
 *   - Auth is the `X-Api-Token` header, not HTTP Basic.
 *   - Full CRUD (GET/POST/PUT/DELETE), not just report POSTs.
 *   - Record IDs are hashed strings; list pagination lives in `meta.pagination`.
 */
export class InvoiceNinjaClient {
  private baseUrl: string | null = null;
  private apiToken: string | null = null;
  private timeoutMs = DEFAULT_TIMEOUT_MS;
  private initialized = false;

  /** Lazily read env on first call so import-time issues don't crash startup. */
  private ensureInitialized(): void {
    if (this.initialized) return;
    const baseUrl = process.env.INVOICENINJA_BASE_URL;
    const apiToken = process.env.INVOICENINJA_API_TOKEN;
    const timeoutRaw = process.env.INVOICENINJA_TIMEOUT_MS;

    const missing: string[] = [];
    if (!baseUrl) missing.push("INVOICENINJA_BASE_URL");
    if (!apiToken) missing.push("INVOICENINJA_API_TOKEN");
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
    }

    this.baseUrl = baseUrl!.replace(/\/+$/, "");
    this.apiToken = apiToken!;
    if (timeoutRaw) {
      const t = Number.parseInt(timeoutRaw, 10);
      if (Number.isFinite(t) && t >= 1_000) this.timeoutMs = t;
    }
    this.initialized = true;
  }

  /** Substitute {placeholders} in the path template from pathParams. */
  private buildPath(spec: EndpointSpec, pathParams: Record<string, string | number>): string {
    return spec.path.replace(/\{([^}]+)\}/g, (_m, key) => {
      const v = pathParams[key];
      if (v === undefined || v === null || v === "") {
        throw new Error(`Missing path parameter "${key}" for ${spec.slug}`);
      }
      return encodeURIComponent(String(v));
    });
  }

  private buildQuery(query: Record<string, unknown>): string {
    const usp = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined || v === null || v === "") continue;
      if (Array.isArray(v)) {
        for (const item of v) usp.append(`${k}[]`, String(item));
      } else {
        usp.append(k, String(v));
      }
    }
    const s = usp.toString();
    return s ? `?${s}` : "";
  }

  /** Write a pre-mutation backup of the request (+ optional prior record). */
  private writeBackup(spec: EndpointSpec, opts: CallOptions, prior: unknown): string {
    const dir = mkdtempSync(join(tmpdir(), "invoiceninja-mcp-"));
    const file = join(dir, `${spec.slug}.json`);
    writeFileSync(
      file,
      JSON.stringify(
        {
          slug: spec.slug,
          method: spec.method,
          path: spec.path,
          pathParams: opts.pathParams ?? {},
          query: opts.query ?? {},
          body: opts.body ?? {},
          authorizationNote: opts.authorizationNote ?? null,
          priorRecord: prior ?? null,
        },
        null,
        2
      )
    );
    return file;
  }

  private async fetchJson(
    url: string,
    init: RequestInit
  ): Promise<{ ok: boolean; status: number; data: unknown; text: string }> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const res = await fetch(url, { ...init, signal: controller.signal });
      const text = await res.text();
      let data: unknown = null;
      if (text) {
        try {
          data = JSON.parse(text);
        } catch {
          data = text;
        }
      }
      return { ok: res.ok, status: res.status, data, text };
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * Standard headers. For multipart uploads, omit Content-Type so fetch sets the
   * multipart/form-data boundary (with its random delimiter) itself.
   */
  private headers(multipart = false): Record<string, string> {
    const h: Record<string, string> = {
      "X-Api-Token": this.apiToken!,
      "X-Requested-With": "XMLHttpRequest",
      Accept: "application/json",
    };
    if (!multipart) h["Content-Type"] = "application/json";
    return h;
  }

  /**
   * Execute one catalog endpoint. The caller has already validated params against
   * the spec; this performs path substitution, the HTTP call, and (for mutating
   * endpoints) a pre-call backup.
   */
  async call(spec: EndpointSpec, opts: CallOptions = {}): Promise<ToolResponse<unknown>> {
    try {
      this.ensureInitialized();

      const path = this.buildPath(spec, opts.pathParams ?? {});
      const query = this.buildQuery(opts.query ?? {});
      const url = `${this.baseUrl}${path}${query}`;

      let backupPath: string | undefined;
      if (spec.mutating) {
        // Best-effort: capture the current record before PUT/DELETE so the change is reversible.
        // Derive the show URL from the endpoint's own path (replace {id}) — NOT from category,
        // which can differ from the real resource segment on singular/plural mismatches.
        let prior: unknown = null;
        if ((spec.method === "PUT" || spec.method === "DELETE") && /\{id\}/.test(spec.path) && opts.pathParams?.id) {
          try {
            const showPath = spec.path.replace("{id}", encodeURIComponent(String(opts.pathParams.id)));
            const priorRes = await this.fetchJson(`${this.baseUrl}${showPath}`, {
              method: "GET",
              headers: this.headers(),
            });
            if (priorRes.ok) prior = priorRes.data;
          } catch {
            /* prior-record capture is best-effort */
          }
        }
        backupPath = this.writeBackup(spec, opts, prior);
      }

      const isMultipart = spec.requestBody?.contentType === "multipart/form-data";
      const init: RequestInit = { method: spec.method, headers: this.headers(isMultipart) };
      if (isMultipart) {
        // Invoice Ninja registers the upload routes as PUT but expects clients to POST with a
        // `_method=PUT` form field (Laravel method spoofing) — a JSON body 404s with
        // "Method not supported for this route". Build multipart/form-data instead.
        const form = new FormData();
        const body = (opts.body ?? {}) as Record<string, unknown>;
        const wantsSpoof = (spec.requestBody?.fields ?? []).some((f) => f.name === "_method");
        if (body._method !== undefined && body._method !== null) {
          form.append("_method", String(body._method));
        } else if (wantsSpoof) {
          form.append("_method", "PUT");
        }
        // Pass through any extra scalar body fields (e.g. an import's `import_type`).
        for (const [k, v] of Object.entries(body)) {
          if (k === "_method" || v === undefined || v === null || typeof v === "object") continue;
          form.append(k, String(v));
        }
        const fileField = opts.fileField ?? "documents[]";
        for (const p of opts.files ?? []) {
          const buf = await readFile(p);
          // The filename (3rd arg) is mandatory — without it the part has no filename and
          // Laravel won't register it as an uploaded file even though routing succeeds.
          form.append(fileField, new Blob([buf]), basename(p));
        }
        init.body = form as unknown as BodyInit;
      } else if (spec.method !== "GET" && spec.method !== "DELETE" && opts.body) {
        init.body = JSON.stringify(opts.body);
      }

      const res = await this.fetchJson(url, init);
      if (!res.ok) {
        return {
          result: null,
          isError: true,
          error: `HTTP ${res.status}: ${typeof res.data === "string" ? res.data : JSON.stringify(res.data)}`,
          backupPath,
        };
      }

      return { result: res.data, isError: false, error: null, backupPath };
    } catch (error) {
      return { result: null, isError: true, error: formatError(error) };
    }
  }
}

export const invoiceNinjaClient = new InvoiceNinjaClient();
