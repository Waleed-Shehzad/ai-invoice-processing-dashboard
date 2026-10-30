# Invoice data contract

The read-only endpoint returns an object with one invoices array. See examples/api/invoices.example.json. This fixture is a sanitised example, not the dashboard's complete demo dataset.

## Ledger columns

| Field | Meaning |
| --- | --- |
| invoice_number | Identifier printed on the invoice |
| supplier_name | Invoice issuer |
| supplier_email | Issuer contact, when available |
| supplier_address | Issuer address, when available |
| invoice_date | Issue date; ISO date when unambiguous |
| due_date | Payment due date; ISO date when unambiguous |
| total_amount | Printed invoice total |
| amount_paid | Printed/recorded paid amount |
| balance_due | Printed/recorded remaining balance |
| currency | Explicit currency code |
| source_file_url | Original invoice's Drive URL |
| processed_at | Timestamp written during append |

Google Sheets responses additionally contain row_number. It is a sheet row reference, not a durable invoice identifier. The example ledger template deliberately omits it.

## Handling values

Amounts can arrive as numbers or numeric strings. Missing amounts can be absent, null or empty strings. A blank is not zero.

A dashboard can calculate a missing balance from total_amount minus amount_paid only when both are valid known amounts. Label that balance as calculated in invoice details. Do not infer payment from an absent balance alone.

Group financial totals by currency; do not sum EUR and USD without an explicit conversion policy. Ambiguous currencies and unknown amounts should remain unavailable rather than being guessed.

Invoice and due dates are date-only values and should not shift when displayed in a different timezone. Processing timestamps are instants; display them in Asia/Karachi for this project.

Derived overdue and due-soon views reflect the recorded due date and known outstanding balance. They are not payment verification. Demo dates are fixed fixtures, so due views may change as the current date advances.


## Actual dashboard proxy

The upstream n8n webhook must return `{ "invoices": [...] }`. Each invoice must be a non-array object. The server route normalizes the rows and returns `{ "invoices": [...], "fetched_at": "<ISO timestamp>" }` with `Cache-Control: no-store`. The raw upstream response is not exposed on failure.

Normalized amounts are finite numbers or null. `row_number` is a number, string or null. Non-empty textual fields are trimmed strings or null; currency is uppercased without inferring an absent code. `balance_calculated` is an additional boolean: true only when a missing balance is derived from valid `total_amount` and `amount_paid`. Explicit zero balances are preserved. Missing balances stay null when either input is unavailable.

The example API fixture represents the upstream webhook, so it intentionally omits `fetched_at` and `balance_calculated`; the proxy adds them. Its blank balance demonstrates normalization rather than verified payment status. The CSV includes every normalized field, including `row_number` and `balance_calculated`, escapes quotes and protects against spreadsheet formula injection.

Financial summaries use the current filters, group currencies separately and identify partial totals. Missing amounts are not zero. Missing currency is labelled unknown. Calendar dates must be valid `YYYY-MM-DD`; invalid due dates do not enter date-based quick filters. Source links accept HTTP or HTTPS only; demo PDF actions open example.com. Recently saved invoices use actual recorded `processed_at` values, not simulated workflow events.
