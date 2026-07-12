# @nightsquawktech/invoiceninja-mcp-server

MCP server for **Invoice Ninja v5** (self-hosted). Exposes **all 379 API endpoints**
through **3 consolidated tools** backed by a generated endpoint catalog, rather than
one tool per endpoint.

## Why a catalog, not 379 tools

Invoice Ninja's REST API has ~379 operations across ~31 resources (full CRUD + bulk +
actions + 27 reports). One MCP tool per endpoint would be unusable: huge context cost
and poor tool selection. Instead, every endpoint is described by a JSON spec file under
`src/catalog/endpoints/`, and three generic tools read that catalog:

| Tool | Purpose |
|------|---------|
| `list_endpoints(category?, mutating?, search?)` | Discover endpoints (slug, method, path, category, mutating flag, one-line summary). |
| `describe_endpoint(endpoint_name)` | Full spec for one endpoint: method, path, path/query params, request-body fields (types, required, enums, descriptions), and `whenToUse`. |
| `call_endpoint(endpoint_name, path_params?, query?, body?, ...)` | Validate against the catalog, then execute. **Mutating** endpoints (POST/PUT/DELETE) require `authorization_confirmed: true` + `authorization_note` and are backed up to a temp file before the call. |

Expected flow: **discover → describe → call**.

## The endpoint catalog

- `src/catalog/endpoints/<slug>.json`: one spec per endpoint, generated from the OpenAPI
  spec (`openapi/api-docs.yaml` @ invoiceninja v5-stable). Carries method, path, name,
  category, `mutating`, description, `whenToUse`, path/query/header parameters, and
  request-body fields.
- `src/catalog/index.json`: aggregate discovery index (slug, method, path, category,
  mutating, summary) plus counts.

Regenerate after a spec bump:

```bash
curl -sL https://raw.githubusercontent.com/invoiceninja/invoiceninja/v5-stable/openapi/api-docs.yaml -o spec/api-docs.yaml
npm run generate     # parse spec -> src/catalog/endpoints/*.json
npm run catalog      # rebuild src/catalog/index.json
npm run build
```

The `whenToUse` field (when-to-reach-for-this guidance) is filled by an enrichment pass
(`scripts/apply-enrichment.mjs`) and surfaced by `describe_endpoint` / `list_endpoints`.

## Setup

```bash
npm install
npm run build
```

## Environment (self-hosted)

| Variable | Required | Description |
|----------|----------|-------------|
| `INVOICENINJA_BASE_URL` | Yes | Instance URL, no trailing slash, no `/api/v1` (e.g. `https://your-instance.example.com`) |
| `INVOICENINJA_API_TOKEN` | Yes | API token (Settings → Account Management → Integrations → API Tokens). Sent as `X-Api-Token`. |
| `INVOICENINJA_TIMEOUT_MS` | No | Request timeout, default 30000 |

## MCP client configuration

```json
{
  "mcpServers": {
    "invoiceninja": {
      "command": "npx",
      "args": ["-y", "@nightsquawktech/invoiceninja-mcp-server"],
      "env": {
        "INVOICENINJA_BASE_URL": "https://your-instance.example.com",
        "INVOICENINJA_API_TOKEN": "<token>"
      }
    }
  }
}
```

## Write safety

`call_endpoint` runs read-only GET endpoints freely. Any mutating endpoint requires
`authorization_confirmed: true` and a non-empty `authorization_note`; without both,
the call is refused before any HTTP request is made. Before a mutating call executes,
the client writes a JSON backup (request payload, authorization note, and best-effort
prior record for PUT/DELETE by id) under the system temp dir. The catalog flags every
endpoint's `mutating` status, and as defense-in-depth any `{action}` route (email,
mark_paid, archive, delete, clone, and similar) is treated as mutating even though
some are GETs, so state-changing action endpoints can never run unguarded.

## Smoke test (read-only)

`scripts/smoke-test.mjs` sweeps every **non-mutating** endpoint against a live instance:
186 of 379, including the 36 POST-but-read-only reports/charts/preview/templates/search
(sent with an empty body so no side effect fires). It calls collection/report endpoints
first, harvests sample ids, then exercises by-id endpoints, reporting PASS/FAIL/SKIP each.
The 193 mutating endpoints (incl. the 6 state-changing `action_*` GETs) are excluded and
the header says so, so a green run is never mistaken for full-API coverage.

```bash
INVOICENINJA_BASE_URL=... INVOICENINJA_API_TOKEN=... npm run build && npm run smoke
```

## Layout

```
src/
  index.ts                          stdio MCP entry point
  server/invoiceninja-mcp-server.ts singleton McpServer
  catalog/
    endpoint-spec.ts                catalog types + loader (traversal-guarded)
    index.json                      generated discovery index
    endpoints/<slug>.json           379 generated endpoint specs
  clients/invoiceninja-client.ts    generic HTTP caller (X-Api-Token, backups)
  tools/
    list-endpoints.ts  describe-endpoint.ts  call-endpoint.ts
  helpers/  types/
scripts/
  generate-catalog.mjs  parse OpenAPI spec -> endpoint files
  assemble-catalog.mjs  endpoint files -> index.json
  apply-enrichment.mjs  write whenToUse from the enrichment pass
  smoke-test.mjs        read-only live sweep
```

See **[SCOPING.md](./SCOPING.md)** for the API inventory and design rationale.

## License

Licensed under the [GNU AGPL v3.0](./LICENSE). Free for personal and open-source use.

Organizations that cannot comply with the AGPL can purchase a commercial license. See [COMMERCIAL.md](./COMMERCIAL.md) or contact hello@nightsquawk.tech.
