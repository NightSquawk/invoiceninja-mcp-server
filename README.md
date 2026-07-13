# Invoice Ninja MCP Server

[![npm version](https://img.shields.io/npm/v/@nightsquawktech/invoiceninja-mcp-server)](https://www.npmjs.com/package/@nightsquawktech/invoiceninja-mcp-server)
[![npm downloads](https://img.shields.io/npm/dm/@nightsquawktech/invoiceninja-mcp-server)](https://www.npmjs.com/package/@nightsquawktech/invoiceninja-mcp-server)
[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/NightSquawk/invoiceninja-mcp-server/badge)](https://scorecard.dev/viewer/?uri=github.com/NightSquawk/invoiceninja-mcp-server)
[![License: AGPL-3.0](https://img.shields.io/badge/license-AGPL--3.0-blue)](https://github.com/NightSquawk/invoiceninja-mcp-server/blob/v1.0.0/LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](https://nodejs.org)

An MCP (Model Context Protocol) server for **Invoice Ninja v5**, connecting your self-hosted invoicing data to AI tools.

## Quick start

### Claude

[![Download for Claude Desktop](https://img.shields.io/badge/Claude_Desktop-Download_.mcpb-D97757?style=flat-square)](https://github.com/NightSquawk/invoiceninja-mcp-server/releases/download/mcpb-v0.1.0/invoiceninja-mcp-server-0.1.0.mcpb)

**bash (macOS/Linux):**

```bash
INVOICENINJA_BASE_URL="https://invoicing.yourdomain.com"
INVOICENINJA_API_TOKEN="your-api-token"

claude mcp add invoiceninja \
  --env INVOICENINJA_BASE_URL="$INVOICENINJA_BASE_URL" \
  --env INVOICENINJA_API_TOKEN="$INVOICENINJA_API_TOKEN" \
  -- npx -y @nightsquawktech/invoiceninja-mcp-server
```

**PowerShell (Windows):**

```powershell
$INVOICENINJA_BASE_URL = "https://invoicing.yourdomain.com"
$INVOICENINJA_API_TOKEN = "your-api-token"

claude mcp add invoiceninja `
  --env "INVOICENINJA_BASE_URL=$INVOICENINJA_BASE_URL" `
  --env "INVOICENINJA_API_TOKEN=$INVOICENINJA_API_TOKEN" `
  -- npx -y @nightsquawktech/invoiceninja-mcp-server
```

### Cursor

[![Add to Cursor](https://cursor.com/deeplink/mcp-install-dark.svg)](https://cursor.com/en/install-mcp?name=invoiceninja&config=eyJjb21tYW5kIjogIm5weCIsICJhcmdzIjogWyIteSIsICJAbmlnaHRzcXVhd2t0ZWNoL2ludm9pY2VuaW5qYS1tY3Atc2VydmVyIl0sICJlbnYiOiB7IklOVk9JQ0VOSU5KQV9CQVNFX1VSTCI6ICJodHRwczovL2ludm9pY2luZy55b3VyZG9tYWluLmNvbSIsICJJTlZPSUNFTklOSkFfQVBJX1RPS0VOIjogInlvdXItYXBpLXRva2VuIiwgIklOVk9JQ0VOSU5KQV9USU1FT1VUX01TIjogIjMwMDAwIn19)

Or put the [mcp.json](#mcpjson) block in `.cursor/mcp.json`, then verify with:

```bash
agent mcp list
```

(The Cursor CLI manages configured servers but has no `mcp add`; install is via the button or `mcp.json`.)

### VS Code

[![Install in VS Code](https://img.shields.io/badge/VS_Code-Install_Server-0098FF?style=flat-square&logo=visualstudiocode&logoColor=white)](https://insiders.vscode.dev/redirect/mcp/install?name=invoiceninja&config=%7B%22command%22%3A%20%22npx%22%2C%20%22args%22%3A%20%5B%22-y%22%2C%20%22%40nightsquawktech/invoiceninja-mcp-server%22%5D%2C%20%22env%22%3A%20%7B%22INVOICENINJA_BASE_URL%22%3A%20%22https%3A//invoicing.yourdomain.com%22%2C%20%22INVOICENINJA_API_TOKEN%22%3A%20%22your-api-token%22%2C%20%22INVOICENINJA_TIMEOUT_MS%22%3A%20%2230000%22%7D%7D)

**bash (macOS/Linux):**

```bash
INVOICENINJA_BASE_URL="https://invoicing.yourdomain.com"
INVOICENINJA_API_TOKEN="your-api-token"

code --add-mcp '{"name":"invoiceninja","command":"npx","args":["-y","@nightsquawktech/invoiceninja-mcp-server"],"env":{"INVOICENINJA_BASE_URL":"'"$INVOICENINJA_BASE_URL"'","INVOICENINJA_API_TOKEN":"'"$INVOICENINJA_API_TOKEN"'"}}'
```

**PowerShell (Windows):**

```powershell
$INVOICENINJA_BASE_URL = "https://invoicing.yourdomain.com"
$INVOICENINJA_API_TOKEN = "your-api-token"

$config = @{
  name = "invoiceninja"
  command = "npx"
  args = @("-y", "@nightsquawktech/invoiceninja-mcp-server")
  env = @{
    INVOICENINJA_BASE_URL = $INVOICENINJA_BASE_URL
    INVOICENINJA_API_TOKEN = $INVOICENINJA_API_TOKEN
  }
} | ConvertTo-Json -Compress

code --add-mcp $config
```

### Codex

**bash (macOS/Linux):**

```bash
INVOICENINJA_BASE_URL="https://invoicing.yourdomain.com"
INVOICENINJA_API_TOKEN="your-api-token"

codex mcp add invoiceninja \
  --env INVOICENINJA_BASE_URL="$INVOICENINJA_BASE_URL" \
  --env INVOICENINJA_API_TOKEN="$INVOICENINJA_API_TOKEN" \
  -- npx -y @nightsquawktech/invoiceninja-mcp-server
```

**PowerShell (Windows):**

```powershell
$INVOICENINJA_BASE_URL = "https://invoicing.yourdomain.com"
$INVOICENINJA_API_TOKEN = "your-api-token"

codex mcp add invoiceninja `
  --env "INVOICENINJA_BASE_URL=$INVOICENINJA_BASE_URL" `
  --env "INVOICENINJA_API_TOKEN=$INVOICENINJA_API_TOKEN" `
  -- npx -y @nightsquawktech/invoiceninja-mcp-server
```

Or add it to `~/.codex/config.toml` under `[mcp_servers.invoiceninja]`.

### mcp.json

Every environment variable the server reads, with recommended values:

```json
{
  "mcpServers": {
    "invoiceninja": {
      "command": "npx",
      "args": ["-y", "@nightsquawktech/invoiceninja-mcp-server"],
      "env": {
        "INVOICENINJA_BASE_URL": "https://invoicing.yourdomain.com",
        "INVOICENINJA_API_TOKEN": "your-api-token",
        "INVOICENINJA_TIMEOUT_MS": "30000"
      }
    }
  }
}
```

File locations: `.mcp.json` in your project root (Claude Code), `claude_desktop_config.json` (Claude Desktop), `.cursor/mcp.json` (Cursor).

## Configuration

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `INVOICENINJA_BASE_URL` | yes | | Your Invoice Ninja v5 instance URL, no trailing slash, no `/api/v1`, e.g. `https://invoicing.yourdomain.com` |
| `INVOICENINJA_API_TOKEN` | yes | | API token from Settings > Account Management > Integrations > API tokens, sent as `X-Api-Token` |
| `INVOICENINJA_TIMEOUT_MS` | no | `30000` | HTTP timeout for API requests, minimum 1000 |

## Security & write safety

Invoice Ninja credentials: create a dedicated API token under a restricted user (Settings > User Management) and grant that user only the permissions the assistant needs; the token inherits the user's permissions.

- Read-only endpoints (**186** GETs) execute freely.
- Mutating endpoints (**193** POST/PUT/DELETE operations) are refused unless the call carries `authorization_confirmed: true` **and** a non-empty `authorization_note` describing the user's explicit approval. There is no blanket write mode: authorization is per call.
- Before every mutating call, the server writes a JSON backup of the full request to a local temp directory. For updates and deletes it also fetches the current record first (best-effort) and stores it in the backup, so the change is reversible. The backup file path is returned in the tool response.
- Any `{action}` route (email, mark_paid, archive, restore, delete, clone) is treated as mutating even when registered as a GET, so destructive actions can never slip past the guard.
- All requests go directly from your machine to your Invoice Ninja instance; nothing passes through third parties.

> [!IMPORTANT]
> The authorization gate is a guardrail, not a security boundary. `INVOICENINJA_API_TOKEN` in your MCP config is a real Invoice Ninja API token, and an AI agent with shell access can bypass the MCP tools and call the Invoice Ninja API directly with it. If you need hard read-only, enforce it at the source: issue the token under a user whose permissions are scoped down in Invoice Ninja itself.

## Tools

Instead of one tool per endpoint (379 tools would drown any model's tool selection), this server ships a generated endpoint catalog behind three generic tools: `list_endpoints` to discover operations, `describe_endpoint` for the exact parameter spec of one operation, and `call_endpoint` to execute it. The pattern comes from [mcp-core](https://github.com/NightSquawk/mcp-core), the shared catalog runtime used across NightSquawk MCP servers.

```
list_endpoints       List/filter all 379 endpoints by category, read-vs-mutating, or search term
describe_endpoint    Full spec for one endpoint: method, path, params, body fields, mutating flag
call_endpoint        Execute an endpoint; mutating calls need per-call authorization and are backed up first
```

## API coverage

<!-- GENERATED SECTION: do not edit by hand. Regenerate from the catalog with scripts/generate-api-coverage.mjs whenever the catalog changes. -->

379 operations covered: 186 read-only, 193 mutating.

| Category | Operations |
|---|---|
| reports | 27 |
| clients | 14 |
| invoices | 12 |
| quotes | 12 |
| bank_integrations | 11 |
| payments | 11 |
| purchase_orders | 11 |
| recurring_invoices | 11 |
| users | 11 |
| companies | 10 |
| tasks | 10 |
| bank_transactions | 9 |
| credits | 9 |
| expenses | 9 |
| group_settings | 9 |
| products | 9 |
| projects | 9 |
| recurring_expenses | 9 |
| recurring_quotes | 9 |
| vendors | 9 |
| bank_transaction_rules | 8 |
| company_gateways | 8 |
| designs | 8 |
| expense_categories | 8 |
| payment_terms | 8 |
| subscriptions | 8 |
| tags | 8 |
| task_status | 8 |
| tokens | 8 |
| webhooks | 8 |
| client_gateway_tokens | 7 |
| locations | 7 |
| task_schedulers | 7 |
| tax_rates | 7 |
| auth | 6 |
| activities | 4 |
| charts | 4 |
| imports | 3 |
| migration | 3 |
| postmark | 3 |
| ping | 2 |
| preview | 2 |
| system_logs | 2 |
| templates | 2 |
| update | 2 |
| claim_license | 1 |
| company_ledger | 1 |
| company_user | 1 |
| connected_account | 1 |
| documents | 1 |
| emails | 1 |
| export | 1 |
| health_check | 1 |
| logout | 1 |
| one_time_token | 1 |
| refresh | 1 |
| scheduler | 1 |
| search | 1 |
| statics | 1 |
| support | 1 |
| webcron | 1 |
| yodlee | 1 |

<details>
<summary><strong>reports</strong> (27 operations)</summary>

| Method | Path | Operation ID |
|---|---|---|
| POST | `/api/v1/exports/preview/{hash}` | `get_export_preview` |
| POST | `/api/v1/reports/activities` | `get_activity_report` |
| POST | `/api/v1/reports/ar_detail_report` | `get_ardetail_report` |
| POST | `/api/v1/reports/ar_summary_report` | `get_arsummary_report` |
| POST | `/api/v1/reports/client_balance_report` | `get_client_balance_report` |
| POST | `/api/v1/reports/client_contacts` | `get_client_contact_report` |
| POST | `/api/v1/reports/client_sales_report` | `get_client_sales_report` |
| POST | `/api/v1/reports/clients` | `get_client_report` |
| POST | `/api/v1/reports/contacts` | `get_contact_report` |
| POST | `/api/v1/reports/credits` | `get_credit_report` |
| POST | `/api/v1/reports/documents` | `get_document_report` |
| POST | `/api/v1/reports/expenses` | `get_expense_report` |
| POST | `/api/v1/reports/invoice_items` | `get_invoice_item_report` |
| POST | `/api/v1/reports/invoices` | `get_invoice_report` |
| POST | `/api/v1/reports/payments` | `get_payment_report` |
| POST | `/api/v1/reports/preview/{hash}` | `get_report_preview` |
| POST | `/api/v1/reports/product_sales` | `get_product_sales_report` |
| POST | `/api/v1/reports/products` | `get_product_report` |
| POST | `/api/v1/reports/profitloss` | `get_profit_loss_report` |
| POST | `/api/v1/reports/projects` | `get_project_report` |
| POST | `/api/v1/reports/quote_items` | `get_quote_item_report` |
| POST | `/api/v1/reports/quotes` | `get_quote_report` |
| POST | `/api/v1/reports/recurring_invoices` | `get_recurring_invoice_report` |
| POST | `/api/v1/reports/tasks` | `get_task_report` |
| POST | `/api/v1/reports/tax_period_report` | `get_tax_period_report` |
| POST | `/api/v1/reports/tax_summary_report` | `get_tax_summary_report` |
| POST | `/api/v1/reports/user_sales_report` | `get_user_sales_report` |

</details>

<details>
<summary><strong>clients</strong> (14 operations)</summary>

| Method | Path | Operation ID |
|---|---|---|
| POST | `/api/v1/client_statement` | `client_statement` |
| GET | `/api/v1/clients` | `get_clients` |
| POST | `/api/v1/clients` | `store_client` |
| POST | `/api/v1/clients/{client}/updateTaxData` | `update_client_tax_data` |
| DELETE | `/api/v1/clients/{id}` | `delete_client` |
| GET | `/api/v1/clients/{id}` | `show_client` |
| PUT | `/api/v1/clients/{id}` | `update_client` |
| POST | `/api/v1/clients/{id}/{mergeable_client_hashed_id}/merge` | `merge_client` |
| GET | `/api/v1/clients/{id}/edit` | `edit_client` |
| POST | `/api/v1/clients/{id}/purge` | `purge_client` |
| POST | `/api/v1/clients/{id}/upload` | `upload_client` |
| POST | `/api/v1/clients/bulk` | `bulk_clients` |
| GET | `/api/v1/clients/create` | `get_clients_create` |
| POST | `/api/v1/reactivate_email/{bounce_id}` | `reactivate_email` |

</details>

<details>
<summary><strong>invoices</strong> (12 operations)</summary>

| Method | Path | Operation ID |
|---|---|---|
| GET | `/api/v1/invoice/{invitation_key}/download` | `download_invoice_by_invitation` |
| GET | `/api/v1/invoices` | `get_invoices` |
| POST | `/api/v1/invoices` | `store_invoice` |
| DELETE | `/api/v1/invoices/{id}` | `delete_invoice` |
| GET | `/api/v1/invoices/{id}` | `show_invoice` |
| PUT | `/api/v1/invoices/{id}` | `update_invoice` |
| GET | `/api/v1/invoices/{id}/{action}` | `action_invoice` |
| GET | `/api/v1/invoices/{id}/delivery_note` | `get_invoice_delivery_note` |
| GET | `/api/v1/invoices/{id}/edit` | `edit_invoice` |
| POST | `/api/v1/invoices/{id}/upload` | `upload_invoice_document` |
| POST | `/api/v1/invoices/bulk` | `bulk_invoices` |
| GET | `/api/v1/invoices/create` | `get_invoice_create` |

</details>

<details>
<summary><strong>quotes</strong> (12 operations)</summary>

| Method | Path | Operation ID |
|---|---|---|
| GET | `/api/v1/credit/{invitation_key}/download` | `download_credit` |
| GET | `/api/v1/quote/{invitation_key}/download` | `download_quote` |
| GET | `/api/v1/quotes` | `get_quotes` |
| POST | `/api/v1/quotes` | `store_quote` |
| DELETE | `/api/v1/quotes/{id}` | `delete_quote` |
| GET | `/api/v1/quotes/{id}` | `show_quote` |
| PUT | `/api/v1/quotes/{id}` | `update_quote` |
| GET | `/api/v1/quotes/{id}/{action}` | `action_quote` |
| GET | `/api/v1/quotes/{id}/edit` | `edit_quote` |
| POST | `/api/v1/quotes/{id}/upload` | `upload_quote` |
| POST | `/api/v1/quotes/bulk` | `bulk_quotes` |
| GET | `/api/v1/quotes/create` | `get_quotes_create` |

</details>

<details>
<summary><strong>bank_integrations</strong> (11 operations)</summary>

| Method | Path | Operation ID |
|---|---|---|
| GET | `/api/v1/bank_integrations` | `get_bank_integrations` |
| POST | `/api/v1/bank_integrations` | `store_bank_integration` |
| DELETE | `/api/v1/bank_integrations/{id}` | `delete_bank_integration` |
| GET | `/api/v1/bank_integrations/{id}` | `show_bank_integration` |
| PUT | `/api/v1/bank_integrations/{id}` | `update_bank_integration` |
| GET | `/api/v1/bank_integrations/{id}/edit` | `edit_bank_integration` |
| POST | `/api/v1/bank_integrations/bulk` | `bulk_bank_integrations` |
| GET | `/api/v1/bank_integrations/create` | `get_bank_integrations_create` |
| POST | `/api/v1/bank_integrations/get_transactions/account_id` | `get_account_transactions` |
| POST | `/api/v1/bank_integrations/refresh_accounts` | `get_refresh_accounts` |
| POST | `/api/v1/bank_integrations/remove_account/account_id` | `get_remove_account` |

</details>

<details>
<summary><strong>payments</strong> (11 operations)</summary>

| Method | Path | Operation ID |
|---|---|---|
| GET | `/api/v1/payments` | `get_payments` |
| POST | `/api/v1/payments` | `store_payment` |
| DELETE | `/api/v1/payments/{id}` | `delete_payment` |
| GET | `/api/v1/payments/{id}` | `show_payment` |
| PUT | `/api/v1/payments/{id}` | `update_payment` |
| GET | `/api/v1/payments/{id}/{action}` | `action_payment` |
| GET | `/api/v1/payments/{id}/edit` | `edit_payment` |
| POST | `/api/v1/payments/{id}/upload` | `upload_payment` |
| POST | `/api/v1/payments/bulk` | `bulk_payments` |
| GET | `/api/v1/payments/create` | `get_payments_create` |
| POST | `/api/v1/payments/refund` | `store_refund` |

</details>

<details>
<summary><strong>purchase_orders</strong> (11 operations)</summary>

| Method | Path | Operation ID |
|---|---|---|
| GET | `/api/v1/purchase_order/{invitation_key}/download` | `download_purchase_order` |
| GET | `/api/v1/purchase_orders` | `get_purchase_orders` |
| POST | `/api/v1/purchase_orders` | `store_purchase_order` |
| DELETE | `/api/v1/purchase_orders/{id}` | `delete_purchase_order` |
| GET | `/api/v1/purchase_orders/{id}` | `show_purchase_order` |
| PUT | `/api/v1/purchase_orders/{id}` | `update_purchase_order` |
| GET | `/api/v1/purchase_orders/{id}/{action}` | `action_purchase_order` |
| GET | `/api/v1/purchase_orders/{id}/edit` | `edit_purchase_order` |
| POST | `/api/v1/purchase_orders/{id}/upload` | `upload_purchase_order` |
| POST | `/api/v1/purchase_orders/bulk` | `bulk_purchase_orderss` |
| GET | `/api/v1/purchase_orders/create` | `get_purchase_order_create` |

</details>

<details>
<summary><strong>recurring_invoices</strong> (11 operations)</summary>

| Method | Path | Operation ID |
|---|---|---|
| GET | `/api/v1/recurring_invoice/{invitation_key}/download` | `download_recurring_invoice` |
| GET | `/api/v1/recurring_invoices` | `get_recurring_invoices` |
| POST | `/api/v1/recurring_invoices` | `store_recurring_invoice` |
| DELETE | `/api/v1/recurring_invoices/{id}` | `delete_recurring_invoice` |
| GET | `/api/v1/recurring_invoices/{id}` | `show_recurring_invoice` |
| PUT | `/api/v1/recurring_invoices/{id}` | `update_recurring_invoice` |
| GET | `/api/v1/recurring_invoices/{id}/{action}` | `action_recurring_invoice` |
| GET | `/api/v1/recurring_invoices/{id}/edit` | `edit_recurring_invoice` |
| POST | `/api/v1/recurring_invoices/{id}/upload` | `upload_recurring_invoice` |
| POST | `/api/v1/recurring_invoices/bulk` | `bulk_recurring_invoices` |
| GET | `/api/v1/recurring_invoices/create` | `get_recurring_invoices_create` |

</details>

<details>
<summary><strong>users</strong> (11 operations)</summary>

| Method | Path | Operation ID |
|---|---|---|
| GET | `/api/v1/users` | `get_users` |
| POST | `/api/v1/users` | `store_user` |
| DELETE | `/api/v1/users/{id}` | `delete_user` |
| GET | `/api/v1/users/{id}` | `show_user` |
| PUT | `/api/v1/users/{id}` | `update_user` |
| GET | `/api/v1/users/{id}/edit` | `edit_user` |
| DELETE | `/api/v1/users/{user}/detach_from_company` | `detach_user` |
| POST | `/api/v1/users/{user}/invite` | `invite_user` |
| POST | `/api/v1/users/{user}/reconfirm` | `invite_user_reconfirm` |
| POST | `/api/v1/users/bulk` | `bulk_users` |
| GET | `/api/v1/users/create` | `get_users_create` |

</details>

<details>
<summary><strong>companies</strong> (10 operations)</summary>

| Method | Path | Operation ID |
|---|---|---|
| GET | `/api/v1/companies` | `get_companies` |
| POST | `/api/v1/companies` | `store_company` |
| POST | `/api/v1/companies/{company}/default` | `set_default_company` |
| DELETE | `/api/v1/companies/{id}` | `delete_company` |
| GET | `/api/v1/companies/{id}` | `show_company` |
| PUT | `/api/v1/companies/{id}` | `update_company` |
| GET | `/api/v1/companies/{id}/edit` | `edit_company` |
| POST | `/api/v1/companies/{id}/upload` | `upload_companies` |
| GET | `/api/v1/companies/create` | `get_companies_create` |
| POST | `/api/v1/companies/current` | `show_current_company` |

</details>

<details>
<summary><strong>tasks</strong> (10 operations)</summary>

| Method | Path | Operation ID |
|---|---|---|
| GET | `/api/v1/tasks` | `get_tasks` |
| POST | `/api/v1/tasks` | `store_task` |
| DELETE | `/api/v1/tasks/{id}` | `delete_task` |
| GET | `/api/v1/tasks/{id}` | `show_task` |
| PUT | `/api/v1/tasks/{id}` | `update_task` |
| GET | `/api/v1/tasks/{id}/edit` | `edit_task` |
| POST | `/api/v1/tasks/{id}/upload` | `upload_task` |
| POST | `/api/v1/tasks/bulk` | `bulk_tasks` |
| GET | `/api/v1/tasks/create` | `get_tasks_create` |
| POST | `/api/v1/tasks/sort` | `sort_tasks` |

</details>

<details>
<summary><strong>bank_transactions</strong> (9 operations)</summary>

| Method | Path | Operation ID |
|---|---|---|
| GET | `/api/v1/bank_transactions` | `get_bank_transactions` |
| POST | `/api/v1/bank_transactions` | `store_bank_transaction` |
| DELETE | `/api/v1/bank_transactions/{id}` | `delete_bank_transaction` |
| GET | `/api/v1/bank_transactions/{id}` | `show_bank_transaction` |
| PUT | `/api/v1/bank_transactions/{id}` | `update_bank_transaction` |
| GET | `/api/v1/bank_transactions/{id}/edit` | `edit_bank_transaction` |
| POST | `/api/v1/bank_transactions/bulk` | `bulk_bank_transactions` |
| GET | `/api/v1/bank_transactions/create` | `get_bank_transactions_create` |
| POST | `/api/v1/bank_transactions/match` | `match_bank_transactions` |

</details>

<details>
<summary><strong>credits</strong> (9 operations)</summary>

| Method | Path | Operation ID |
|---|---|---|
| GET | `/api/v1/credits` | `get_credits` |
| POST | `/api/v1/credits` | `store_credit` |
| DELETE | `/api/v1/credits/{id}` | `delete_credit` |
| GET | `/api/v1/credits/{id}` | `show_credit` |
| PUT | `/api/v1/credits/{id}` | `update_credit` |
| GET | `/api/v1/credits/{id}/edit` | `edit_credit` |
| POST | `/api/v1/credits/{id}/upload` | `upload_credits` |
| POST | `/api/v1/credits/bulk` | `bulk_credits` |
| GET | `/api/v1/credits/create` | `get_credits_create` |

</details>

<details>
<summary><strong>expenses</strong> (9 operations)</summary>

| Method | Path | Operation ID |
|---|---|---|
| GET | `/api/v1/expenses` | `get_expenses` |
| POST | `/api/v1/expenses` | `store_expense` |
| DELETE | `/api/v1/expenses/{id}` | `delete_expense` |
| GET | `/api/v1/expenses/{id}` | `show_expense` |
| PUT | `/api/v1/expenses/{id}` | `update_expense` |
| GET | `/api/v1/expenses/{id}/edit` | `edit_expense` |
| POST | `/api/v1/expenses/{id}/upload` | `upload_expense` |
| POST | `/api/v1/expenses/bulk` | `bulk_expenses` |
| GET | `/api/v1/expenses/create` | `get_expenses_create` |

</details>

<details>
<summary><strong>group_settings</strong> (9 operations)</summary>

| Method | Path | Operation ID |
|---|---|---|
| GET | `/api/v1/group_settings` | `get_group_settings` |
| POST | `/api/v1/group_settings` | `store_group_setting` |
| DELETE | `/api/v1/group_settings/{id}` | `delete_group_setting` |
| GET | `/api/v1/group_settings/{id}` | `show_group_setting` |
| PUT | `/api/v1/group_settings/{id}` | `update_group_setting` |
| GET | `/api/v1/group_settings/{id}/edit` | `edit_group_setting` |
| POST | `/api/v1/group_settings/{id}/upload` | `upload_group_setting` |
| POST | `/api/v1/group_settings/bulk` | `bulk_group_settings` |
| GET | `/api/v1/group_settings/create` | `get_group_settings_create` |

</details>

<details>
<summary><strong>products</strong> (9 operations)</summary>

| Method | Path | Operation ID |
|---|---|---|
| GET | `/api/v1/products` | `get_products` |
| POST | `/api/v1/products` | `store_product` |
| DELETE | `/api/v1/products/{id}` | `delete_product` |
| GET | `/api/v1/products/{id}` | `show_product` |
| PUT | `/api/v1/products/{id}` | `update_product` |
| GET | `/api/v1/products/{id}/edit` | `edit_product` |
| POST | `/api/v1/products/{id}/upload` | `upload_product` |
| POST | `/api/v1/products/bulk` | `bulk_products` |
| GET | `/api/v1/products/create` | `get_products_create` |

</details>

<details>
<summary><strong>projects</strong> (9 operations)</summary>

| Method | Path | Operation ID |
|---|---|---|
| GET | `/api/v1/projects` | `get_projects` |
| POST | `/api/v1/projects` | `store_project` |
| DELETE | `/api/v1/projects/{id}` | `delete_project` |
| GET | `/api/v1/projects/{id}` | `show_project` |
| PUT | `/api/v1/projects/{id}` | `update_project` |
| GET | `/api/v1/projects/{id}/edit` | `edit_project` |
| POST | `/api/v1/projects/{id}/upload` | `upload_project` |
| POST | `/api/v1/projects/bulk` | `bulk_projects` |
| GET | `/api/v1/projects/create` | `get_projects_create` |

</details>

<details>
<summary><strong>recurring_expenses</strong> (9 operations)</summary>

| Method | Path | Operation ID |
|---|---|---|
| GET | `/api/v1/recurring_expenses` | `get_recurring_expenses` |
| POST | `/api/v1/recurring_expenses` | `store_recurring_expense` |
| DELETE | `/api/v1/recurring_expenses/{id}` | `delete_recurring_expense` |
| GET | `/api/v1/recurring_expenses/{id}` | `show_recurring_expense` |
| PUT | `/api/v1/recurring_expenses/{id}` | `update_recurring_expense` |
| GET | `/api/v1/recurring_expenses/{id}/edit` | `edit_recurring_expense` |
| POST | `/api/v1/recurring_expenses/{id}/upload` | `upload_recurring_expense` |
| POST | `/api/v1/recurring_expenses/bulk` | `bulk_recurring_expenses` |
| GET | `/api/v1/recurring_expenses/create` | `get_recurring_expenses_create` |

</details>

<details>
<summary><strong>recurring_quotes</strong> (9 operations)</summary>

| Method | Path | Operation ID |
|---|---|---|
| GET | `/api/v1/recurring_quotes` | `get_recurring_quotes` |
| POST | `/api/v1/recurring_quotes` | `store_recurring_quote` |
| DELETE | `/api/v1/recurring_quotes/{id}` | `delete_recurring_quote` |
| GET | `/api/v1/recurring_quotes/{id}` | `show_recurring_quote` |
| PUT | `/api/v1/recurring_quotes/{id}` | `update_recurring_quote` |
| GET | `/api/v1/recurring_quotes/{id}/{action}` | `action_recurring_quote` |
| GET | `/api/v1/recurring_quotes/{id}/edit` | `edit_recurring_quote` |
| POST | `/api/v1/recurring_quotes/bulk` | `bulk_recurring_quotes` |
| GET | `/api/v1/recurring_quotes/create` | `get_recurring_quotes_create` |

</details>

<details>
<summary><strong>vendors</strong> (9 operations)</summary>

| Method | Path | Operation ID |
|---|---|---|
| GET | `/api/v1/vendors` | `get_vendors` |
| POST | `/api/v1/vendors` | `store_vendor` |
| DELETE | `/api/v1/vendors/{id}` | `delete_vendor` |
| GET | `/api/v1/vendors/{id}` | `show_vendor` |
| PUT | `/api/v1/vendors/{id}` | `update_vendor` |
| GET | `/api/v1/vendors/{id}/edit` | `edit_vendor` |
| POST | `/api/v1/vendors/{id}/upload` | `upload_vendor` |
| POST | `/api/v1/vendors/bulk` | `bulk_vendors` |
| GET | `/api/v1/vendors/create` | `get_vendors_create` |

</details>

<details>
<summary><strong>bank_transaction_rules</strong> (8 operations)</summary>

| Method | Path | Operation ID |
|---|---|---|
| GET | `/api/v1/bank_transaction_rules` | `get_bank_transaction_rules` |
| POST | `/api/v1/bank_transaction_rules` | `store_bank_transaction_rule` |
| DELETE | `/api/v1/bank_transaction_rules/{id}` | `delete_bank_transaction_rule` |
| GET | `/api/v1/bank_transaction_rules/{id}` | `show_bank_transaction_rule` |
| PUT | `/api/v1/bank_transaction_rules/{id}` | `update_bank_transaction_rule` |
| GET | `/api/v1/bank_transaction_rules/{id}/edit` | `edit_bank_transaction_rule` |
| POST | `/api/v1/bank_transaction_rules/bulk` | `bulk_bank_transaction_rules` |
| GET | `/api/v1/bank_transaction_rules/create` | `get_bank_transaction_rules_create` |

</details>

<details>
<summary><strong>company_gateways</strong> (8 operations)</summary>

| Method | Path | Operation ID |
|---|---|---|
| GET | `/api/v1/company_gateways` | `get_company_gateways` |
| POST | `/api/v1/company_gateways` | `store_company_gateway` |
| DELETE | `/api/v1/company_gateways/{id}` | `delete_company_gateway` |
| GET | `/api/v1/company_gateways/{id}` | `show_company_gateway` |
| PUT | `/api/v1/company_gateways/{id}` | `update_company_gateway` |
| GET | `/api/v1/company_gateways/{id}/edit` | `edit_company_gateway` |
| POST | `/api/v1/company_gateways/bulk` | `bulk_company_gateways` |
| GET | `/api/v1/company_gateways/create` | `get_company_gateways_create` |

</details>

<details>
<summary><strong>designs</strong> (8 operations)</summary>

| Method | Path | Operation ID |
|---|---|---|
| GET | `/api/v1/designs` | `get_designs` |
| POST | `/api/v1/designs` | `store_design` |
| DELETE | `/api/v1/designs/{id}` | `delete_design` |
| GET | `/api/v1/designs/{id}` | `show_design` |
| PUT | `/api/v1/designs/{id}` | `update_design` |
| GET | `/api/v1/designs/{id}/edit` | `edit_design` |
| POST | `/api/v1/designs/bulk` | `bulk_designs` |
| GET | `/api/v1/designs/create` | `get_designs_create` |

</details>

<details>
<summary><strong>expense_categories</strong> (8 operations)</summary>

| Method | Path | Operation ID |
|---|---|---|
| GET | `/api/v1/expense_categories` | `get_expense_categorys` |
| POST | `/api/v1/expense_categories` | `store_expense_category` |
| DELETE | `/api/v1/expense_categories/{id}` | `delete_expense_category` |
| GET | `/api/v1/expense_categories/{id}` | `show_expense_category` |
| PUT | `/api/v1/expense_categories/{id}` | `update_expense_category` |
| GET | `/api/v1/expense_categories/{id}/edit` | `edit_expense_category` |
| POST | `/api/v1/expense_categories/bulk` | `bulk_expense_categorys` |
| GET | `/api/v1/expense_categories/create` | `get_expense_category_create` |

</details>

<details>
<summary><strong>payment_terms</strong> (8 operations)</summary>

| Method | Path | Operation ID |
|---|---|---|
| GET | `/api/v1/payment_terms` | `get_payment_terms` |
| POST | `/api/v1/payment_terms` | `store_payment_term` |
| DELETE | `/api/v1/payment_terms/{id}` | `delete_payment_term` |
| GET | `/api/v1/payment_terms/{id}` | `show_payment_term` |
| PUT | `/api/v1/payment_terms/{id}` | `update_payment_term` |
| GET | `/api/v1/payment_terms/{id}/edit` | `edit_payment_terms` |
| POST | `/api/v1/payment_terms/bulk` | `bulk_payment_terms` |
| GET | `/api/v1/payment_terms/create` | `get_payment_terms_create` |

</details>

<details>
<summary><strong>subscriptions</strong> (8 operations)</summary>

| Method | Path | Operation ID |
|---|---|---|
| GET | `/api/v1/subscriptions` | `get_subscriptions` |
| POST | `/api/v1/subscriptions` | `store_subscription` |
| DELETE | `/api/v1/subscriptions/{id}` | `delete_subscription` |
| GET | `/api/v1/subscriptions/{id}` | `show_subscription` |
| PUT | `/api/v1/subscriptions/{id}` | `update_subscription` |
| GET | `/api/v1/subscriptions/{id}/edit` | `edit_subscription` |
| POST | `/api/v1/subscriptions/bulk` | `bulk_subscriptions` |
| GET | `/api/v1/subscriptions/create` | `get_subscriptions_create` |

</details>

<details>
<summary><strong>tags</strong> (8 operations)</summary>

| Method | Path | Operation ID |
|---|---|---|
| GET | `/api/v1/tags` | `get_tags` |
| POST | `/api/v1/tags` | `store_tag` |
| DELETE | `/api/v1/tags/{id}` | `delete_tag` |
| GET | `/api/v1/tags/{id}` | `show_tag` |
| PUT | `/api/v1/tags/{id}` | `update_tag` |
| GET | `/api/v1/tags/{id}/edit` | `edit_tag` |
| POST | `/api/v1/tags/bulk` | `bulk_tags` |
| GET | `/api/v1/tags/create` | `get_tags_create` |

</details>

<details>
<summary><strong>task_status</strong> (8 operations)</summary>

| Method | Path | Operation ID |
|---|---|---|
| GET | `/api/v1/task_statuses` | `get_task_statuses` |
| POST | `/api/v1/task_statuses` | `store_task_status` |
| DELETE | `/api/v1/task_statuses/{id}` | `delete_task_status` |
| GET | `/api/v1/task_statuses/{id}` | `show_task_status` |
| PUT | `/api/v1/task_statuses/{id}` | `update_task_status` |
| GET | `/api/v1/task_statuses/{id}/edit` | `edit_task_statuss` |
| POST | `/api/v1/task_statuses/bulk` | `bulk_task_statuss` |
| GET | `/api/v1/task_statuses/create` | `get_task_statuss_create` |

</details>

<details>
<summary><strong>tokens</strong> (8 operations)</summary>

| Method | Path | Operation ID |
|---|---|---|
| GET | `/api/v1/tokens` | `get_tokens` |
| POST | `/api/v1/tokens` | `store_token` |
| DELETE | `/api/v1/tokens/{id}` | `delete_token` |
| GET | `/api/v1/tokens/{id}` | `show_token` |
| PUT | `/api/v1/tokens/{id}` | `update_token` |
| GET | `/api/v1/tokens/{id}/edit` | `edit_token` |
| POST | `/api/v1/tokens/bulk` | `bulk_tokens` |
| GET | `/api/v1/tokens/create` | `get_tokens_create` |

</details>

<details>
<summary><strong>webhooks</strong> (8 operations)</summary>

| Method | Path | Operation ID |
|---|---|---|
| GET | `/api/v1/webhooks` | `get_webhooks` |
| POST | `/api/v1/webhooks` | `store_webhook` |
| DELETE | `/api/v1/webhooks/{id}` | `delete_webhook` |
| GET | `/api/v1/webhooks/{id}` | `show_webhook` |
| PUT | `/api/v1/webhooks/{id}` | `update_webhook` |
| GET | `/api/v1/webhooks/{id}/edit` | `edit_webhook` |
| POST | `/api/v1/webhooks/bulk` | `bulk_webhooks` |
| GET | `/api/v1/webhooks/create` | `get_webhooks_create` |

</details>

<details>
<summary><strong>client_gateway_tokens</strong> (7 operations)</summary>

| Method | Path | Operation ID |
|---|---|---|
| GET | `/api/v1/client_gateway_tokens` | `get_client_gateway_tokens` |
| POST | `/api/v1/client_gateway_tokens` | `store_client_gateway_token` |
| DELETE | `/api/v1/client_gateway_tokens/{id}` | `delete_client_gateway_token` |
| GET | `/api/v1/client_gateway_tokens/{id}` | `show_client_gateway_token` |
| PUT | `/api/v1/client_gateway_tokens/{id}` | `update_client_gateway_token` |
| GET | `/api/v1/client_gateway_tokens/{id}/edit` | `edit_client_gateway_token` |
| GET | `/api/v1/client_gateway_tokens/create` | `get_client_gateway_tokens_create` |

</details>

<details>
<summary><strong>locations</strong> (7 operations)</summary>

| Method | Path | Operation ID |
|---|---|---|
| GET | `/api/v1/locations` | `get_locations` |
| POST | `/api/v1/locations` | `store_location` |
| DELETE | `/api/v1/locations/{id}` | `delete_location` |
| GET | `/api/v1/locations/{id}` | `show_location` |
| PUT | `/api/v1/locations/{id}` | `update_location` |
| POST | `/api/v1/locations/bulk` | `bulk_locations` |
| GET | `/api/v1/locations/create` | `get_locations_create` |

</details>

<details>
<summary><strong>task_schedulers</strong> (7 operations)</summary>

| Method | Path | Operation ID |
|---|---|---|
| GET | `/api/v1/task_schedulers` | `get_task_schedulers` |
| POST | `/api/v1/task_schedulers` | `create_task_scheduler` |
| DELETE | `/api/v1/task_schedulers/{id}` | `destroy_task_scheduler` |
| GET | `/api/v1/task_schedulers/{id}` | `show_task_scheduler` |
| PUT | `/api/v1/task_schedulers/{id}` | `update_task_scheduler` |
| POST | `/api/v1/task_schedulers/bulk` | `bulk_task_scheduler_actions` |
| GET | `/api/v1/task_schedulers/create` | `get_task_scheduler` |

</details>

<details>
<summary><strong>tax_rates</strong> (7 operations)</summary>

| Method | Path | Operation ID |
|---|---|---|
| GET | `/api/v1/tax_rates` | `get_tax_rates` |
| DELETE | `/api/v1/tax_rates/{id}` | `delete_tax_rate` |
| GET | `/api/v1/tax_rates/{id}` | `show_tax_rate` |
| PUT | `/api/v1/tax_rates/{id}` | `update_tax_rate` |
| GET | `/api/v1/tax_rates/{id}/edit` | `edit_tax_rate` |
| POST | `/api/v1/tax_rates/bulk` | `bulk_tax_rates` |
| GET | `/api/v1/tax_rates/create` | `get_tax_rate_create` |

</details>

<details>
<summary><strong>auth</strong> (6 operations)</summary>

| Method | Path | Operation ID |
|---|---|---|
| POST | `/api/v1/login` | `post_login` |
| POST | `/api/v1/passkeys/login/options` | `post_passkey_login_options` |
| GET | `/api/v1/settings/passkeys` | `get_settings_passkeys` |
| POST | `/api/v1/settings/passkeys` | `post_settings_passkeys` |
| DELETE | `/api/v1/settings/passkeys/{passkey}` | `delete_settings_passkey` |
| POST | `/api/v1/settings/passkeys/options` | `post_settings_passkeys_options` |

</details>

<details>
<summary><strong>activities</strong> (4 operations)</summary>

| Method | Path | Operation ID |
|---|---|---|
| GET | `/api/v1/activities` | `get_activities` |
| GET | `/api/v1/activities/download_entity/{activity_id}` | `get_activity_historical_entity_pdf` |
| POST | `/api/v1/activities/entity` | `post_activities_entity` |
| POST | `/api/v1/activities/notes` | `post_activities_notes` |

</details>

<details>
<summary><strong>charts</strong> (4 operations)</summary>

| Method | Path | Operation ID |
|---|---|---|
| POST | `/api/v1/charts/calculated_fields` | `get_chart_calculated_fields` |
| POST | `/api/v1/charts/chart_summary_v2` | `get_chart_summary_v2` |
| POST | `/api/v1/charts/totals` | `get_chart_totals` |
| POST | `/api/v1/charts/totals_v2` | `get_chart_totals_v2` |

</details>

<details>
<summary><strong>imports</strong> (3 operations)</summary>

| Method | Path | Operation ID |
|---|---|---|
| POST | `/api/v1/import` | `post_import` |
| POST | `/api/v1/import_json` | `get_import_json` |
| POST | `/api/v1/preimport` | `preimport` |

</details>

<details>
<summary><strong>migration</strong> (3 operations)</summary>

| Method | Path | Operation ID |
|---|---|---|
| POST | `/api/v1/migration/purge_save_settings/{company}` | `post_purge_company_save_settings` |
| POST | `/api/v1/migration/purge/{company}` | `post_purge_company` |
| POST | `/api/v1/migration/start` | `post_start_migration` |

</details>

<details>
<summary><strong>postmark</strong> (3 operations)</summary>

| Method | Path | Operation ID |
|---|---|---|
| POST | `/api/v1/apple/confirm_purchase` | `confirm_apple_purchase` |
| POST | `/api/v1/apple/process_webhook` | `process_apple_webhook` |
| POST | `/api/v1/postmark_webhook` | `postmark_webhook` |

</details>

<details>
<summary><strong>ping</strong> (2 operations)</summary>

| Method | Path | Operation ID |
|---|---|---|
| GET | `/api/v1/last_error` | `get_last_error` |
| GET | `/api/v1/ping` | `get_ping` |

</details>

<details>
<summary><strong>preview</strong> (2 operations)</summary>

| Method | Path | Operation ID |
|---|---|---|
| POST | `/api/v1/preview` | `get_preview` |
| POST | `/api/v1/preview/purchase_order` | `get_preview_purchase_order` |

</details>

<details>
<summary><strong>system_logs</strong> (2 operations)</summary>

| Method | Path | Operation ID |
|---|---|---|
| GET | `/api/v1/system_logs` | `get_system_logs` |
| GET | `/api/v1/system_logs/{id}` | `show_system_logs` |

</details>

<details>
<summary><strong>templates</strong> (2 operations)</summary>

| Method | Path | Operation ID |
|---|---|---|
| POST | `/api/v1/templates` | `get_show_template` |
| POST | `/api/v1/templates/preview/{hash}` | `get_template_preview` |

</details>

<details>
<summary><strong>update</strong> (2 operations)</summary>

| Method | Path | Operation ID |
|---|---|---|
| POST | `/api/v1/self-update` | `self_update` |
| POST | `/api/v1/self-update/check_version` | `self_update_check_version` |

</details>

<details>
<summary><strong>claim_license</strong> (1 operations)</summary>

| Method | Path | Operation ID |
|---|---|---|
| GET | `/api/v1/claim_license` | `get_claim_license` |

</details>

<details>
<summary><strong>company_ledger</strong> (1 operations)</summary>

| Method | Path | Operation ID |
|---|---|---|
| GET | `/api/v1/company_ledger` | `get_company_ledger` |

</details>

<details>
<summary><strong>company_user</strong> (1 operations)</summary>

| Method | Path | Operation ID |
|---|---|---|
| POST | `/api/v1/company_users` | `update_company_user` |

</details>

<details>
<summary><strong>connected_account</strong> (1 operations)</summary>

| Method | Path | Operation ID |
|---|---|---|
| POST | `/api/v1/connected_account` | `post_connected_account` |

</details>

<details>
<summary><strong>documents</strong> (1 operations)</summary>

| Method | Path | Operation ID |
|---|---|---|
| GET | `/api/v1/documents` | `get_documents` |

</details>

<details>
<summary><strong>emails</strong> (1 operations)</summary>

| Method | Path | Operation ID |
|---|---|---|
| POST | `/api/v1/emails` | `send_email_template` |

</details>

<details>
<summary><strong>export</strong> (1 operations)</summary>

| Method | Path | Operation ID |
|---|---|---|
| POST | `/api/v1/export` | `get_export` |

</details>

<details>
<summary><strong>health_check</strong> (1 operations)</summary>

| Method | Path | Operation ID |
|---|---|---|
| GET | `/api/v1/health_check` | `get_health_check` |

</details>

<details>
<summary><strong>logout</strong> (1 operations)</summary>

| Method | Path | Operation ID |
|---|---|---|
| POST | `/api/v1/logout` | `get_logout` |

</details>

<details>
<summary><strong>one_time_token</strong> (1 operations)</summary>

| Method | Path | Operation ID |
|---|---|---|
| POST | `/api/v1/one_time_token` | `post_one_time_token` |

</details>

<details>
<summary><strong>refresh</strong> (1 operations)</summary>

| Method | Path | Operation ID |
|---|---|---|
| POST | `/api/v1/refresh` | `post_refresh` |

</details>

<details>
<summary><strong>scheduler</strong> (1 operations)</summary>

| Method | Path | Operation ID |
|---|---|---|
| GET | `/api/v1/scheduler` | `get_scheduler` |

</details>

<details>
<summary><strong>search</strong> (1 operations)</summary>

| Method | Path | Operation ID |
|---|---|---|
| POST | `/api/v1/search` | `post_search` |

</details>

<details>
<summary><strong>statics</strong> (1 operations)</summary>

| Method | Path | Operation ID |
|---|---|---|
| GET | `/api/v1/statics` | `get_statics` |

</details>

<details>
<summary><strong>support</strong> (1 operations)</summary>

| Method | Path | Operation ID |
|---|---|---|
| POST | `/api/v1/support/messages/send` | `support_message` |

</details>

<details>
<summary><strong>webcron</strong> (1 operations)</summary>

| Method | Path | Operation ID |
|---|---|---|
| GET | `/api/v1/webcron` | `get_webcron` |

</details>

<details>
<summary><strong>yodlee</strong> (1 operations)</summary>

| Method | Path | Operation ID |
|---|---|---|
| POST | `/api/v1/yodlee/refresh` | `yodlee_refresh_webhook` |

</details>


## Contributing

Contributions and issues are welcome. Please open an issue first before submitting a PR.

## License

AGPL-3.0: free for personal and open-source use. Organizations that cannot comply with the AGPL can purchase a commercial license, and hosted/managed versions are available. See [COMMERCIAL.md](https://github.com/NightSquawk/invoiceninja-mcp-server/blob/v1.0.0/COMMERCIAL.md) or contact hello@nightsquawk.tech.

### Copyright

For copyright concerns or takedown requests, contact hello@nightsquawk.tech.
