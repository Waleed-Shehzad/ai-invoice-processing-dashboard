# Setup

## Dashboard demonstration

Requires Node.js 20.9 or newer and npm. The actual application, configuration, lockfile and tests are included in `dashboard/`:

~~~bash
cd dashboard
npm ci
npm run dev
~~~

Open http://localhost:3000 and select Demo data. The demonstration is independent of n8n and uses fictional records.

## n8n workflow

1. Import workflows/invoice-processing.json. The shared export is inactive.
2. Select Google Drive credentials for Google Drive Trigger and Download file.
3. Choose your invoice folder in Google Drive Trigger. Replace REPLACE_WITH_DRIVE_FOLDER_ID.
4. Create a Google Sheet with the columns in examples/sheets/invoice-ledger-template.csv.
5. In Check existing Invoices, Append row in sheet, and Get Dashboard Invoices, select your Google Sheets credential, spreadsheet and sheet tab. Replace REPLACE_WITH_SPREADSHEET_ID. All three nodes must use the same ledger.
6. Confirm the duplicate lookup combines invoice_number, supplier_name and currency with AND. Keep Always Output Data enabled on the lookup.
7. Keep the IF condition as Boolean → is true. Its true output skips a duplicate; false restores extractor values and appends a row.
8. Choose Groq credentials for both chat-model nodes and select models available in your account. The supplied export uses openai/gpt-oss-20b for extraction and openai/gpt-oss-120b for email drafting.
9. In Basic LLM Chain, replace the example database URL with your ledger URL. Keep output as JSON with subject and email keys.
10. Select a Gmail credential and replace billing-team@example.com with your test notification recipient. Test with an address you control.
11. For Dashboard API, create/select a Header Auth credential with header name X-API-Key and a secret value. This is a webhook secret, not an n8n management API key.
12. Confirm Respond uses the Respond to Webhook node and that the response body returns the invoices array.

Account credentials are configured in n8n; they are not included in this repository. Node labels and settings should be checked in the installed n8n version before activation.

## Exercise invoice intake

With the configured workflow active/published, upload a new text-based PDF directly to the watched folder. The exported trigger polls every minute and watches file creation, not all existing documents or changes in subfolders.

Check that exactly one row is appended and a notification arrives. Re-submit an invoice with the same lookup fields and confirm no second row is appended.

A manual single-node test may not exercise the complete downstream branch. Check the execution trace of the whole workflow.

## Optional invoice API test

For a manual test, execute the entire Dashboard API branch from the canvas and then call its Test URL. Testing just the trigger can return an empty body.

For a published workflow, the production URL is:

~~~text
http://localhost:5678/webhook/invoice-dashboard
~~~

In PowerShell, prompt for the URL and shared secret locally:

~~~powershell
$url = Read-Host "Paste your production invoice webhook URL"
$secret = Read-Host "Enter your webhook X-API-Key" -AsSecureString
$apiKey = [System.Net.NetworkCredential]::new("", $secret).Password
$result = Invoke-RestMethod -Method Get -Uri $url -Headers @{ "X-API-Key" = $apiKey }
$result | ConvertTo-Json -Depth 10
~~~

Expect an object containing invoices, including an empty array for an empty ledger when the sheet node emits an empty item. Match a returned record to the Google Sheet.

## Optional live dashboard configuration

The portfolio dashboard may stay in Demo data mode. The included `dashboard/app/api/invoices/route.ts` proxies read requests to n8n server-side. Its actual configuration variables are shown below. The final live integration has deliberately not been verified.

From `dashboard/`, copy `.env.example` to `.env.local` and enter the real values. Keep `.env.local` private:

~~~dotenv
N8N_INVOICE_API_URL=http://localhost:5678/webhook/invoice-dashboard
N8N_INVOICE_API_KEY=your_webhook_secret
NEXT_PUBLIC_GOOGLE_DRIVE_FOLDER_URL=https://drive.google.com/drive/folders/YOUR_FOLDER_ID
~~~

Restart the development server, or rebuild for production, then select Live data. The API key must remain on the server; do not prefix it with NEXT_PUBLIC.

localhost refers to the machine/container running the dashboard server. A remote deployment needs a reachable, authenticated n8n URL rather than a developer's localhost.

`NEXT_PUBLIC_GOOGLE_DRIVE_FOLDER_URL` is a public folder link, not a credential. When configured, Open upload folder opens that real folder in a new tab; Google Drive permissions still apply. When absent, setup guidance appears only in Automation. It never simulates a file upload.

The proxy expects `{ "invoices": [...] }`, normalizes records, and adds `fetched_at` for the browser. It bypasses caching, rejects redirects and times out after 15 seconds. Live request failures show a connection error and retain the last successful live records; they never substitute demo data. Switching between Demo and Live clears records from the prior mode.

The dashboard has no user authentication layer. Keep live records on a trusted local network or add authenticated access before deploying them.


## Dashboard behaviour

Search by supplier or invoice number, currency filtering and quick status filters share the same scope: summaries, recent records, table and CSV. Date sorting applies to table and export order. Reset filters restores all records without changing the sort order.

Unpaid requires a known positive balance. Overdue additionally requires a valid due date before today in Asia/Karachi. Due in 7 days includes today through the seventh day. Missing payment information is labelled unknown and excluded from unpaid/due filters. Fixed demo dates mean these views change as time advances.

Theme preferences use browser storage and apply before the initial paint. First visits remain light even if the operating system uses dark mode. Switching themes keeps the invoice filters and selected record. When storage is blocked, switching still works for the current visit, but preferences cannot persist across visits.
