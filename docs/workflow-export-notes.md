# Shared workflow export

Source: the most recent workflow JSON supplied in this conversation, followed by the invoice API response successfully tested afterwards.

## Changes made for this package

- Renamed the workflow to AI Invoice Processing & Dashboard to match the implemented scope.
- Removed all node credential bindings, workflow/instance metadata, original workflow ID, version metadata, and pinned data.
- Replaced private spreadsheet and Drive folder IDs with REPLACE_WITH_SPREADSHEET_ID and REPLACE_WITH_DRIVE_FOLDER_ID; removed cached resource URLs/names.
- Replaced the notification recipient with billing-team@example.com.
- Replaced private spreadsheet links in the email prompt with a consistent replacement URL.
- Removed contradictory instructions that referenced an unreplaced database placeholder; kept the email as concise structured JSON.
- Changed the notification's review sentence to avoid suggesting an implemented approval workflow.
- Restored Respond to Webhook's final invoices-array expression instead of the temporary {"ok":true} test response.
- Set the exported workflow inactive and generated fresh node/webhook identifiers.

## Preserved

The extraction schema, PDF text operation, model selections, duplicate filters, Boolean IF condition, restore mapping, append mappings, code parser, notification node, API authentication mode, branch connections and node type versions are based on the supplied workflow.

The sanitised JSON is an import template. No credentials, resource access, runtime compatibility or message delivery were tested after sanitisation. Configure and test it in your n8n instance before use.
