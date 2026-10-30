# Architecture

## Two independent paths

The workflow contains the invoice intake path and an authenticated read-only invoice API on the same canvas. Each path has its own trigger. Processing a PDF does not require a dashboard request, and viewing the sample-data dashboard does not process documents.

## Intake and duplicate handling

The Google Drive trigger provides the file ID. Download file retrieves binary data, and Extract from File reads embedded PDF text. Information Extractor uses the Groq model connection to return an output object.

Check existing Invoices queries the sheet using invoice_number, supplier_name and currency. Always Output Data allows an unmatched lookup to continue as an empty item. The IF node checks for a non-empty row_number.

A matched row follows the true branch to No Operation. An unmatched invoice follows the false branch to Restore Values, which retrieves Information Extractor.output, preserving the Append node's existing field mappings.

The append operation records the invoice fields, the source Drive URL and a processing timestamp in Asia/Karachi.

## Notification

Basic LLM Chain receives the saved invoice fields and generates JSON containing subject and email. Code in JavaScript parses the text and exposes subject and body for Gmail.

This path does not implement payment approval. Saving a row does not prove an email was delivered. If email generation or sending fails, the row remains saved, and re-submitting the PDF may be skipped as a duplicate.

## Invoice API

Dashboard API validates a shared header credential, Get Dashboard Invoices reads sheet rows, and Respond to Webhook returns an invoices array. Empty emitted items are filtered using row_number.

The API is a read-only data source, not a payment or workflow-monitoring API. It does not expose email status, duplicate counts, approval actions or extraction confidence.

## Dashboard

The final portfolio presentation deliberately uses fictional sample records. Search, filters, monetary summaries, due-date views, details, exports, and themes operate on that sample dataset.

The included `dashboard/app/api/invoices/route.ts` calls n8n server-side and keeps `N8N_INVOICE_API_KEY` out of browser requests. Only the server sends the X-API-Key header. It normalizes numeric fields, derives balances only from two known amounts and adds a fetch timestamp. It rejects redirects, bypasses caching and uses a 15-second timeout. Its final live connection deliberately remains unverified.

Overview and Automation use hash navigation; changing views preserves filters. Light/dark presentation uses shared semantic tokens, a pre-paint theme initialization script and storage-safe controls. Demo and live records stay separate.

## Operational limits

Google Sheets lookup plus append is not atomic. Two simultaneous executions can both miss the duplicate and append it. Exact matching can also miss invoices whose extracted supplier or invoice number differs in spelling, spacing or case.

The extracted schema marks several fields required. Missing fields are not a validation result, and unknown values must not be treated as confirmed zero amounts.

For a deployed client system, a persistent uniqueness constraint, explicit failure handling, and a delivery/retry record would be additional work, not completed features.
