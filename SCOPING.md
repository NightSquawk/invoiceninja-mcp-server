# Invoice Ninja MCP — API Scoping & Design

**Status:** ✅ BUILT — catalog + 3-tool server implemented, audited, and verified. See **[README.md](./README.md)** for the as-built architecture.
**Date:** 2026-06-07
**Target:** Invoice Ninja **v5** (self-hosted), REST API at `{base_url}/api/v1`.

> **Design note (final):** Per user direction we adopted the **AppFolio catalog pattern** —
> all **379 endpoints** generated as one JSON spec file each (`src/catalog/endpoints/`) and
> exposed through **3 generic tools** (`list_endpoints` / `describe_endpoint` / `call_endpoint`),
> rather than the smaller explicit-write-tool surface sketched in §4 below. Write safety is
> preserved inside `call_endpoint`: mutating endpoints (229 of 379, incl. the 6 state-changing
> `action_*` GETs) require `authorization_confirmed` + note and are backed up before execution.
> Each endpoint carries a curated `whenToUse` line (enrichment pass). The §1–§5 inventory below
> remains accurate; §4's tool list is superseded by the catalog approach.
>
> **Audit (multi-agent) findings resolved:** (1) 6 `action_*` GETs re-flagged `mutating:true`;
> (2) purchase-order PUT/DELETE path corrected from upstream's buggy singular `/purchase_order/{id}`
> to `/purchase_orders/{id}`; (3) pre-mutation backup show-URL derived from the endpoint path
> (not category) to fix singular/plural mismatches; plus category normalization (68→62) and
> stripping of leaked PHPDoc artifacts from 7 descriptions.

---

## 1. The problem this scoping solves

Invoice Ninja's v5 API is **large and extremely regular**. A naive "one MCP tool per endpoint"
build would produce ~300 tools — unusable. The goal of this doc is to size the API precisely and
pick a tool surface that stays small **without** throwing away our house-style write safety.

## 2. API size (canonical source: `routes/api.php` @ v5-stable)

| Bucket | Count | Notes |
|--------|-------|-------|
| CRUD resource groups (`Route::resource`) | **31** | Each = index, show, store, update, destroy (~5) + a `bulk` endpoint |
| → expands to | **~186 routes** | 31 × (5 CRUD + bulk) |
| Report endpoints (`POST /reports/{name}`) | **~29** | clients, invoices, payments, profitloss, ar_detail, tax_summary, … |
| Auth (login, refresh, logout, signup, oauth, passkeys) | ~8 | Not needed — we authenticate with a static API token |
| Company / company_users / account / settings | ~16 | Mostly admin; out of scope |
| Entity action routes (`GET /{resource}/{id}/{action}`) | several | download, send, mark-paid, clone, etc. on invoices/quotes/credits/POs |
| Emails, export/import, refunds, ping/health | ~12 | A few we want (refund, ping); most out of scope |
| **Grand total distinct routes** | **~300** | — |

**The 31 CRUD resources:** bank_integrations, bank_transactions, bank_transaction_rules, clients,
company_gateways, credits, designs, documents, expenses, expense_categories, group_settings,
invoices, locations, payments, payment_terms, products, projects, purchase_orders, quotes,
recurring_expenses, recurring_invoices, recurring_quotes, task_schedulers, tasks, task_statuses,
tags, tax_rates, tokens, vendors, webhooks, subscriptions.

Every resource is the **same shape** (CRUD + `bulk` + `?include=` + `?per_page=` pagination).
That regularity is what lets a handful of generic tools cover all reads.

## 3. Design decision — hybrid, split by operation risk

We are **not** picking "AppFolio catalog style *vs.* our usual explicit-tool style." The right answer
borrows from both, split by risk:

| Operation class | Pattern | Why |
|-----------------|---------|-----|
| **Reads** (list/show, all 31 resources) | Generic catalog dispatch (AppFolio-style: `list` / `get` over a resource catalog) | Reads are safe and uniform; collapses ~62 index/show routes into 2 tools. |
| **Reports** (~29) | Catalog dispatch (`list_reports` / `run_report`) | This *is* the AppFolio use case again — near-verbatim reuse of that pattern. |
| **Writes** (create/update on business entities) | **Explicit, guarded tools — kimai house style** | A generic "call any endpoint" mutator throws away auth-confirm + backup safety. Writes stay named and guarded. |
| **Deletes** | **Not exposed** | kimai house rule — destructive ops are done in the Invoice Ninja UI. Generic `bulk` is limited to archive/restore. |

The biggest lever on tool count is **scope, not dispatch tricks**: NST does not need MCP write access
to 31 resources. Confirmed write surface is the **business billing core** only — everything else is
read-only.

### Confirmed scope (from user, 2026-06-07)
- **Deployment:** Self-hosted (`INVOICENINJA_BASE_URL` env-driven, no hardcoded host).
- **Write areas:** Invoices · Payments · Clients & contacts · Quotes, credits & products.
- Read-only for all other resources (expenses, vendors, projects, tasks, bank txns, etc.).

## 4. Proposed tool surface (~14 tools for ~300 endpoints)

**Discovery / reads (generic — 3)**
1. `invoiceninja_list_resources` — catalog of readable resources (slug, includes, common filters).
2. `invoiceninja_list` — list any resource. Params: `resource`, `filter`, `status`, `include`, `sort`, `page`, `per_page`. Validates `resource` against the catalog before any call.
3. `invoiceninja_get` — fetch one record by `resource` + `id` (+ `include`).

**Reports (catalog — 2)**
4. `invoiceninja_list_reports` — list the ~29 reports + their parameters.
5. `invoiceninja_run_report` — run a report by name with date range / filters.

**Writes — guarded, kimai-style (create/update only; ~8)**
Each requires `authorization_confirmed: true` + `authorization_note`, and writes a JSON temp backup
(prior record on update) before mutating.
6. `invoiceninja_create_invoice` / 7. `invoiceninja_update_invoice`
8. `invoiceninja_record_payment` / 9. `invoiceninja_refund_payment`
10. `invoiceninja_upsert_client` (create, or update when `id` present) — covers client + nested contacts
11. `invoiceninja_upsert_quote`
12. `invoiceninja_upsert_credit`
13. `invoiceninja_upsert_product`

**Guarded actions (1)**
14. `invoiceninja_entity_action` — invoke a safe whitelisted action (`send`, `mark_sent`, `mark_paid`, `email`, `archive`, `restore`, `clone`) on invoices/quotes/credits via the action/`bulk` route. **`delete`/`purge` are not in the whitelist.**

> If we prefer strict kimai parity (separate `create_*` and `update_*` instead of `upsert_*`), the
> write count grows to ~12. Upsert keeps it tighter; this is the one open style call for the build.

## 5. Key API facts for the build

- **Auth header:** `X-Api-Token: <token>` (v5). v4's `X-Ninja-Token` is deprecated — do **not** use it. Some sensitive endpoints also accept `X-API-PASSWORD`; not needed for our scope. Send `X-Requested-With: XMLHttpRequest`.
- **Base path:** `{base_url}/api/v1/...`.
- **Pagination:** `?per_page=N` (default 20) + `?page=N`. Response carries `meta.pagination`.
- **Includes:** `?include=contacts,invoices` to embed relations (avoids N+1 reads).
- **Bulk:** `POST /api/v1/{resource}/bulk` with body `{ "action": "archive|restore|...", "ids": ["<hash>", ...] }`. IDs are **hashed strings**, not integers.
- **Catalog source:** the OpenAPI spec is large (blew the 10 MB fetch cap). Download it to disk and **generate** `src/catalog/*` from it with a script mirroring AppFolio's `scripts/assemble-catalog.mjs` — do **not** hand-write 31 resource specs.

## 6. House-style alignment (vs. `Other/kimai-mcp-server`)

Same skeleton: `src/{constants,types,index}.ts`, `src/services/{config,errors,invoiceninja-client}.ts`,
`src/tools/{index,...}.ts`. Same guards on writes (auth-confirm, note, temp backup, no delete).
Differs from kimai only in: `X-Api-Token` auth (not Bearer), hashed string IDs, `meta.pagination`
(not headers), and the generic read/report dispatch borrowed from AppFolio.

## 7. Build phases (next)

1. Download OpenAPI spec → `spec/`; write `scripts/assemble-catalog.mjs` → `src/catalog/`.
2. Implement `services/invoiceninja-client.ts` (axios, `X-Api-Token`, pagination, retry).
3. Implement generic read tools (1–3) + report tools (4–5) against the catalog.
4. Implement the 8 guarded write tools + action tool with kimai-style backups.
5. README, `.env.example`, `npm run build`, smoke test against the self-hosted instance.

## Sources
- [routes/api.php @ v5-stable](https://raw.githubusercontent.com/invoiceninja/invoiceninja/v5-stable/routes/api.php) — canonical endpoint list
- [Invoice Ninja API Reference](https://api-docs.invoicing.co/) — OpenAPI spec (catalog source)
- [Developer Guide / README](https://github.com/invoiceninja/invoiceninja/blob/v5-stable/README.md)
- Local template: `Other/kimai-mcp-server` (write-guard pattern) · `NightSquawk/appfolio-mcp-server` (catalog dispatch)
